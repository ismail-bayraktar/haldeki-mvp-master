import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS başlıkları - Güvenlik fixi: Wildcard yerine spesifik originler
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS")?.split(",")[0] || "https://haldeki.com.tr",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

/**
 * Path sanitization - Path traversal koruması
 * Saldırganın "../" kullanarak sistem dosyalarına erişmesini engeller
 */
function sanitizePath(path: string): string {
  // Backslash'leri forward slash'e çevir
  let cleanPath = path.replace(/\\/g, '/');
  // Path traversal karakterlerini temizle
  cleanPath = cleanPath.replace(/\.\./g, '');
  // Sadece güvenli karakterlere izin ver
  if (!/^[a-zA-Z0-9/_-]+$/.test(cleanPath)) {
    throw new Error('Invalid path characters');
  }
  return cleanPath;
}

/**
 * Dosya tipi validasyonu - Magic bytes kontrolü
 * Dosya uzantısına güvenmek yerine gerçek içerik tipini kontrol eder
 * Bu, saldırganın zararlı dosyaları yüklemesini engeller
 */
function validateImageFile(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;

  // JPEG Magic Bytes: FF D8 FF
  const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;

  // PNG Magic Bytes: 89 50 4E 47
  const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;

  // WebP Magic Bytes: 52 49 46 46 ... 57 45 42 50
  const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                 bytes.length > 11 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  // AVIF Magic Bytes: 00 00 00 20 66 74 79 70
  const isAVIF = bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x00 && bytes[3] === 0x20 &&
                 bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;

  return isJPEG || isPNG || isWebP || isAVIF;
}

/**
 * Supabase Edge Function: Görsel Otomatik Optimizasyonu
 * FAZ 1.2 - Phase 2
 *
 * Amaç: Yüklenen görselleri WebP ve AVIF formatlarına otomatik dönüştürme
 * - WebP (80% kalite) - Geniş tarayıcı desteği
 * - AVIF (65% kalite) - Daha iyi sıkıştırma, modern tarayıcılar
 *
 * Tetikleme: Storage hook veya manuel çağrı ile
 */

serve(async (req) => {
  // CORS preflight isteğini işle
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders, ...securityHeaders } });
  }

  // Sadece POST isteklerini kabul et
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // GÜVENLİK FIXİ #1: Authorization kontrolü - JWT token validasyonu
    // Her isteğin geçerli bir Supabase JWT token'ı olması gerekir
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "Geçerli bir Authorization header gerekli"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Supabase admin client oluştur - Auth kontrolü için
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Token'ı validate et
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Authorization hatası:", authError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "Geçersiz veya süresi dolmuş token"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // İsteği yapan kullanıcıyı logla (güvenlik audit için)
    console.log(`Image optimization requested by user: ${user.id}`);

    // İstek gövdesini ayrıştır
    const { bucketId, path } = await req.json();

    // Gerekli parametreleri doğrula
    if (!bucketId || !path) {
      return new Response(
        JSON.stringify({
          error: "Eksik parametreler",
          details: "bucketId ve path gereklidir"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sadece product-images bucket'ını işle
    if (bucketId !== "product-images") {
      return new Response(
        JSON.stringify({
          error: "Geçersiz bucket",
          details: "Sadece product-images bucket'ı destekleniyor"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GÜVENLİK FIXİ #3: Path sanitization - Path traversal koruması
    // Kullanıcı tarafından sağlanan path'i temizle
    let sanitizedPath: string;
    try {
      sanitizedPath = sanitizePath(path);
    } catch (pathError) {
      console.error("Path sanitization hatası:", pathError);
      return new Response(
        JSON.stringify({
          error: "Invalid path",
          details: "Dosya yolu güvenli değil"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Orijinal görseli storage'dan indir (sanitized path kullan)
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from(bucketId)
      .download(sanitizedPath);

    if (downloadError) {
      console.error("Dosya indirme hatası:", downloadError);
      return new Response(
        JSON.stringify({
          error: "Dosya indirilemedi",
          details: downloadError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Dosya içeriğini ArrayBuffer olarak al
    const originalBuffer = await fileData.arrayBuffer();
    const originalBytes = new Uint8Array(originalBuffer);

    // GÜVENLİK FIXİ #4: Dosya tipi validasyonu - Magic bytes kontrolü
    // Sadece gerçek görsel dosyalarını işle, zararlı dosyaları engelle
    if (!validateImageFile(originalBytes)) {
      console.error("Geçersiz dosya formatı tespit edildi:", sanitizedPath);
      return new Response(
        JSON.stringify({
          error: "Invalid file format",
          details: "Dosya geçerli bir görsel formatında değil (JPEG, PNG, WebP, AVIF)"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Dosya yolunu ayrıştır (uzantıyı bul) - sanitized path kullan
    const pathParts = sanitizedPath.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const directory = pathParts.slice(0, -1).join("/");

    // 2. WebP formatına dönüştür (80% kalite)
    const webpBytes = await convertToWebP(originalBytes, 0.8);
    const webpPath = `${directory}/${fileNameWithoutExt}.webp`;

    const { error: webpUploadError } = await supabaseAdmin
      .storage
      .from(bucketId)
      .upload(webpPath, webpBytes, {
        contentType: "image/webp",
        upsert: true,
      });

    if (webpUploadError) {
      console.error("WebP yükleme hatası:", webpUploadError);
    } else {
      console.log("WebP versiyonu oluşturuldu:", webpPath);
    }

    // 3. AVIF formatına dönüştür (65% kalite)
    // Not: AVIF desteği için ek kütüphane gerekebilir
    // Şu an için sadece WebP yapıyoruz, AVIF opsiyonel
    try {
      const avifBytes = await convertToAVIF(originalBytes, 0.65);
      const avifPath = `${directory}/${fileNameWithoutExt}.avif`;

      const { error: avifUploadError } = await supabaseAdmin
        .storage
        .from(bucketId)
        .upload(avifPath, avifBytes, {
          contentType: "image/avif",
          upsert: true,
        });

      if (avifUploadError) {
        console.error("AVIF yükleme hatası:", avifUploadError);
      } else {
        console.log("AVIF versiyonu oluşturuldu:", avifPath);
      }
    } catch (avifError) {
      console.warn("AVIF dönüşümü atlandı (desteklenmeyebilir):", avifError);
    }

    // 4. Başarılı yanıt dön
    return new Response(
      JSON.stringify({
        success: true,
        message: "Görsel optimizasyonu tamamlandı",
        optimizedFormats: {
          webp: webpPath,
          avif: `${directory}/${fileNameWithoutExt}.avif`,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Optimizasyon hatası:", error);
    return new Response(
      JSON.stringify({
        error: "Görsel optimizasyonu başarısız",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * WebP formatına dönüştürme fonksiyonu
 * Not: Deno'da görsel işleme içinSharp kullanıyoruz
 */
async function convertToWebP(
  imageBytes: Uint8Array,
  quality: number
): Promise<Uint8Array> {
  try {
    // Deno.sharp kütüphanesini kullan
    const sharp = await import("https://deno.land/x/sharp@0.1.0/mod.ts");

    const image = sharp.default(imageBytes);
    const webpBuffer = await image
      .webp({ quality: Math.round(quality * 100) })
      .toBuffer();

    return new Uint8Array(webpBuffer);
  } catch (error) {
    console.error("WebP dönüşüm hatası:", error);
    throw new Error("WebP dönüşümü başarısız");
  }
}

/**
 * AVIF formatına dönüştürme fonksiyonu
 * Not: AVIF desteği Sharp'ta opsiyonel, her ortamda çalışmayabilir
 */
async function convertToAVIF(
  imageBytes: Uint8Array,
  quality: number
): Promise<Uint8Array> {
  try {
    const sharp = await import("https://deno.land/x/sharp@0.1.0/mod.ts");

    const image = sharp.default(imageBytes);
    const avifBuffer = await image
      .avif({ quality: Math.round(quality * 100) })
      .toBuffer();

    return new Uint8Array(avifBuffer);
  } catch (error) {
    console.error("AVIF dönüşüm hatası:", error);
    throw error;
  }
}
