# FAZ 1.2 Phase 2 - Quick Test Guide

## Hızlı Test Adımları

### 1. Edge Function'ı Deploy Edin

```bash
# Local test için
supabase functions serve

# Production için
supabase functions deploy optimize-image
```

### 2. Migration'ı Çalıştırın

```bash
supabase db push
```

### 3. Test Görseli Yükleyin

Supplier panelinden bir ürün görseli yükleyin ve şu kontrolleri yapın:

**Beklenen Sonuç:**
- Orijinal görsel yüklenir
- Arka planda WebP versiyonu oluşturulur
- Console'da "Görsel optimizasyonu tetiklendi" mesajını görürsünüz

### 4. Storage'ı Kontrol Edin

Supabase Dashboard'da:
1. Storage > product-images
2. Kullanıcı klasörüne gidin
3. Şu dosyaları görmelisiniz:
   - `original.jpg` (veya `.png`, `.webp`)
   - `original.webp` (yeni oluşturulan)
   - `original.avif` (opsiyonel, destek varsa)

### 5. Manuel Test (cURL)

```bash
# Local
curl -X POST http://localhost:54321/functions/v1/optimize-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"bucketId": "product-images", "path": "test.jpg"}'

# Production
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/optimize-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"bucketId": "product-images", "path": "user-123/test.jpg"}'
```

### 6. SQL Test

Supabase SQL Editor'da çalıştırın:

```sql
-- Mevcut görselleri optimize et
SELECT * FROM storage.optimize_existing_images();

-- Trigger'ı kontrol et
SELECT * FROM pg_trigger WHERE tgname = 'on_image_upload';
```

## Başarılı Olduğunu Nasıl Anlarsınız?

1. **Console Log:** "Görsel optimizasyonu tetiklendi" mesajı
2. **Storage:** `.webp` dosyaları görüyorsunuz
3. **Network:** Edge Function çağrısı başarılı (200 OK)
4. **Performans:** WebP dosyaları orijinalden daha küçük

## Hata Durumunda

| Hata | Çözüm |
|------|-------|
| "Function not found" | `supabase functions deploy optimize-image` |
| "Storage permission denied" | RLS politikalarını kontrol edin |
| "AVIF not created" | Normal, Sharp desteği opsiyonel |
| "Timeout" | Büyük görseller (5MB+) 5-10 sn sürebilir |

## İleri Test

### Batch Optimizasyon

```sql
-- İlk 100 görseli optimize et
SELECT * FROM storage.optimize_existing_images() LIMIT 100;
```

### Performans Testi

Farklı boyutlarda görseller yükleyin ve süreleri ölçün:

| Boyut | Beklenen Süre |
|-------|---------------|
| 500KB | ~1 sn |
| 1MB | ~2 sn |
| 3MB | ~5 sn |
| 5MB | ~10 sn |

## Sonraki Faz

Phase 3 için `<picture>` komponenti hazırlayın:
- Orijinal görseli fallback olarak kullan
- WebP'i öncelikli göster
- AVIF'i modern tarayıcılarda göster
