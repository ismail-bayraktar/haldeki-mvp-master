# optimize-image Edge Function

FAZ 1.2 - Phase 2: Görsel Otomatik Optimizasyonu

## Amaç

Yüklenen görselleri otomatik olarak modern formatlara dönüştürür:
- **WebP** (80% kalite) - Geniş tarayıcı desteği
- **AVIF** (65% kalite) - Daha iyi sıkıştırma, modern tarayıcılar

## Çalışma Mantığı

1. Görsel yüklendiğinde tetiklenir (Storage hook veya manuel çağrı)
2. Orijinal görseli storage'dan indirir
3. WebP formatına dönüştürür ve yükler
4. AVIF formatına dönüştürür ve yükler
5. Sonuçları döndürür

## Kurulum

### 1. Edge Function'ı Deploy Edin

```bash
# Local development
supabase functions serve optimize-image

# Production deployment
supabase functions deploy optimize-image
```

### 2. Environment Variables

Edge Function otomatik olarak şu environment variables'ları kullanır:
- `SUPABASE_URL` - Supabase proje URL'si
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (storage erişimi için)

Bu değişkenler otomatik olarak yüklendiği için ek ayar gerekmez.

### 3. Storage Hook Oluşturun (Opsiyonel)

Otomatik tetikleme için storage hook oluşturun:

```bash
# Supabase CLI ile hook oluştur
supabase storage hook create product-images INSERT optimize-image
```

VEYA Supabase Dashboard'u kullanın:
1. Storage > product-images > Hooks
2. New Hook oluştur:
   - Event: INSERT
   - Function: optimize-image

## Kullanım

### Manuel Çağrı (Client-side)

```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/optimize-image`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      bucketId: 'product-images',
      path: 'user-123/image-456.jpg',
    }),
  }
);

const result = await response.json();
console.log(result);
// {
//   success: true,
//   message: "Görsel optimizasyonu tamamlandı",
//   optimizedFormats: {
//     webp: "user-123/image-456.webp",
//     avif: "user-123/image-456.avif"
//   }
// }
```

### Otomatik Çağrı (useImageUpload Hook)

`useImageUpload` hook'u otomatik olarak optimizasyonu tetikler:

```typescript
import { useImageUpload } from '@/hooks/useImageUpload';

function ImageUploadComponent() {
  const { uploadImage } = useImageUpload();

  const handleUpload = async (file: File) => {
    const url = await uploadImage(file, 'product-123');
    // Optimizasyon arka planda tetiklendi!
    console.log('Görsel yüklendi:', url);
  };
}
```

## Test

### Local Test

```bash
# Local development server'ı başlat
supabase functions serve optimize-image

# Test isteği gönder
curl -X POST http://localhost:54321/functions/v1/optimize-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "bucketId": "product-images",
    "path": "test-image.jpg"
  }'
```

### Production Test

```bash
curl -X POST https://your-project.supabase.co/functions/v1/optimize-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "bucketId": "product-images",
    "path": "user-123/test-image.jpg"
  }'
```

### SQL ile Test

```sql
-- Mevcut tüm görselleri optimize etmek için
SELECT * FROM storage.optimize_existing_images();

-- Trigger'ı test etmek için
INSERT INTO storage.objects (bucket_id, name, metadata)
VALUES ('product-images', 'test.jpg', '{"mimetype": "image/jpeg"}')
RETURNING *;
```

## Dosya Yapısı

```
product-images/
├── user-123/
│   ├── original.jpg      # Orijinal yüklenen dosya
│   ├── original.webp     # Oluşturulan WebP (80% kalite)
│   └── original.avif     # Oluşturulan AVIF (65% kalite)
```

## Performans

| Format | Boyut | Kalite | Tarayıcı Desteği |
|--------|-------|--------|------------------|
| Orijinal JPG | 100% | 100% | %100 |
| WebP (80%) | ~60% | 80% | %95+ |
| AVIF (65%) | ~40% | 65% | %75+ |

## Hata Yönetimi

- WebP dönüşümü başarısız olursa AVIF oluşturulmaz
- AVIF dönüşümü başarısız olursa sessizce geçilir (opsiyonel)
- Hatalar console'a loglanır, kullanıcıya gösterilmez

## Güvenlik

- Sadece `product-images` bucket'ını işler
- Service role key ile çalışır (tam erişim)
- Public read erişimi ile optimize edilmiş dosyalara erişilebilir

## Sorun Giderme

### "Function not found" hatası

```bash
supabase functions deploy optimize-image
```

### "Storage permission denied" hatası

RLS politikalarını kontrol edin. Service role key tam erişime sahip olmalı.

### AVIF dosyaları oluşturulmuyor

Sharp kütüphanesinin AVIF desteğini kontrol edin. WebP her zaman oluşturulur.

### Optimizasyon çok uzun sürüyor

Büyük görseller (5MB+) optimizasyonu 5-10 saniye sürebilir. Bu normaldir.

## İleri Kullanım

### Custom Kalite Ayarları

`index.ts` içinde kalite değerlerini değiştirebilirsiniz:

```typescript
const webpBytes = await convertToWebP(originalBytes, 0.9);  // 90% kalite
const avifBytes = await convertToAVIF(originalBytes, 0.7);  // 70% kalite
```

### Thumbnail Oluşturma

Ek boyutlar ekleyebilirsiniz:

```typescript
const thumbnailBytes = await convertToWebP(originalBytes, 0.7);
const thumbnailPath = `${directory}/${fileNameWithoutExt}_thumb.webp`;
```

## İlgili Dosyalar

- `src/hooks/useImageUpload.ts` - Client-side upload hook
- `supabase/migrations/20260109150000_storage_product_images.sql` - Storage bucket kurulumu
- `supabase/migrations/20260110150000_image_optimization_trigger.sql` - Trigger kurulumu

## Destek

Sorunlar için:
1. Supabase logs: `supabase functions logs optimize-image`
2. Storage bucket permissions kontrol edin
3. Service role key'in doğru ayarlandığını doğrulayın
