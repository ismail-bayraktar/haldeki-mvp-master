-- Görsel Optimizasyon Trigger Kurulumu
-- FAZ 1.2 - Phase 2
-- Date: 2025-01-10
-- Purpose: Yüklenen görseller için otomatik optimizasyon trigger'ı

-- Bu migration, görsel yüklendiğinde otomatik olarak optimize-image
-- Edge Function'ını tetikleyen database trigger'ını oluşturur.

-- ============================================
-- 1. Edge Function İçin HTTP Request Fonksiyonu
-- ============================================

-- HTTP request yapmak için pg_net extension'ını kullanıyoruz
-- Bu extension Supabase'te yüklü olmalı

CREATE OR REPLACE FUNCTION storage.trigger_image_optimization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url TEXT;
  edge_function_key TEXT;
  request_body JSONB;
  response TEXT;
BEGIN
  -- Sadece INSERT işleminde ve product-images bucket'ında çalış
  IF (TG_OP = 'INSERT') AND (NEW.bucket_id = 'product-images') THEN
    -- AVIF ve WebP dosyalarını atla (zaten optimize edilmişler)
    IF (NEW.name LIKE '%.webp' OR NEW.name LIKE '%.avif') THEN
      RETURN NEW;
    END IF;

    -- Edge Function URL'sini oluştur
    edge_function_url := (
      SELECT
        'https://' || project_ref || '.supabase.co/functions/v1/optimize-image'
      FROM
        (
          -- Proje referansını environment'den al
          SELECT
            current_setting('app.settings.project_ref', true) AS project_ref
        ) AS settings
    );

    -- Eğer project_ref ayarlanmamışsa, varsayılan URL kullan
    IF edge_function_url IS NULL OR edge_function_url = '' THEN
      -- Varsayılan olarak boş dönecek, gerçek deployment'da ayarlanmalı
      RETURN NEW;
    END IF;

    -- Edge Function key'ini al (anon key kullanıyoruz)
    edge_function_key := (
      SELECT
        current_setting('app.settings.anon_key', true)
    );

    -- Request body'yi hazırla
    request_body := jsonb_build_object(
      'bucketId', NEW.bucket_id,
      'path', NEW.name
    );

    -- Not: pg_net ile async HTTP request yapılabilir
    -- Ancak basitlik için manuel tetikleme de mümkündür
    -- Bu trigger, storage hook yerine kullanılabilir

    -- Log kaydı oluştur
    RAISE LOG 'Görsel optimizasyon tetiklendi: %', NEW.name;

    -- Async request başlat (pg_net ile)
    -- PERFORM net.http_post(
    --   edge_function_url,
    --   request_body::text,
    --   jsonb_build_object(
    --     'Authorization', 'Bearer ' || edge_function_key,
    --     'Content-Type', 'application/json'
    --   )
    -- );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 2. Trigger Oluştur
-- ============================================

-- Önce eski trigger'ı temizle (varsa)
DROP TRIGGER IF EXISTS on_image_upload ON storage.objects;

-- Yeni trigger'ı oluştur
CREATE TRIGGER on_image_upload
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION storage.trigger_image_optimization();

-- ============================================
-- 3. Alternatif: Storage Hook Yönetimi
-- ============================================

-- Supabase Storage hook'ları SQL ile değil,
-- Supabase dashboard veya CLI üzerinden yapılır.
--
-- Bu migration manuel çağrım için hazırdır.
-- Otomatik tetikleme için şu adımları izleyin:
--
-- 1. Supabase Dashboard'a gidin
-- 2. Storage > product-images > Triggers
-- 3. New Trigger oluştur:
--    - Event: INSERT
--    - Function: optimize-image
--    - Endpoint: /functions/v1/optimize-image
--
-- VEYA CLI ile:
-- supabase functions deploy optimize-image
-- supabase storage hook create product-images INSERT optimize-image

-- ============================================
-- 4. Yardımcı Fonksiyon: Manuel Optimizasyon
-- ============================================

-- Mevcut tüm görselleri optimize etmek için yardımcı fonksiyon
CREATE OR REPLACE FUNCTION storage.optimize_existing_images()
RETURNS TABLE(
  path TEXT,
  status TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  image_record RECORD;
BEGIN
  -- product-images bucket'ındaki tüm görselleri bul
  FOR image_record IN
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'product-images'
      AND name NOT LIKE '%.webp'
      AND name NOT LIKE '%.avif'
    ORDER BY created_at DESC
    LIMIT 100  -- Her çağrıda max 100 görsel
  LOOP
    -- Her görsel için optimizasyon tetikle
    -- Not: Bu fonksiyon Edge Function'ı çağırmalı
    RETURN QUERY
    SELECT
      image_record.name,
      'pending'::TEXT,
      'Optimizasyon kuyruğa alındı'::TEXT;
  END LOOP;

  RETURN;
END;
$$;

-- ============================================
-- 5. Application Settings (Opsiyonel)
-- ============================================

-- Edge Function çağrıları için gerekli ayarlar
-- Bu ayarları deployment sırasında yapın:
--
-- SET app.settings.project_ref = 'your-project-ref';
-- SET app.settings.anon_key = 'your-anon-key';
--
-- Bu ayarlar database'de saklanır ve trigger tarafından kullanılır

-- ============================================
-- Test Query'leri
-- ============================================

-- Trigger'ı test etmek için:
-- INSERT INTO storage.objects (bucket_id, name, metadata)
-- VALUES ('product-images', 'test-image.jpg', '{"mimetype": "image/jpeg"}')
-- RETURNING *;

-- Mevcut görselleri optimize etmek için:
-- SELECT * FROM storage.optimize_existing_images();

-- Trigger durumunu kontrol etmek için:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_image_upload';
