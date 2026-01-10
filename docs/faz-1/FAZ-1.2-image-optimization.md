# FAZ 1.2: Image Optimizasyonu - Detaylı Implementasyon Planı

> Ana yol haritası: [faz-1-2-3-yol-haritasi.md](../../faz-1-2-3-yol-haritasi.md)
> 
> Oluşturma: 2026-01-10
> Durum: **Implementasyona Hazır**
> Son Güncelleme: 2026-01-10 (Kullanıcı kararlariyla güncellendi)

---

## Özet

**İş Değeri:** Resim yükleme süresini %50 azaltır. Lighthouse Performance skorunu +10 puan iyileştirir.

**Süre:** 2-3 saat

**Kapsam:** Tüm resimler + otomatik optimizasyon pipeline

**Hedefler:**
- WebP VE AVIF format dönüşümü (her ikisi de gerekli)
- Otomatik resim sıkıştırma (yeni yüklemeler için)
- Lazy loading implementasyonu (best practices)
- Responsive srcset desteği
- Depolama stratejisi kararı (Supabase vs R2)

---

## Kullanıcı Kararları

### 1. Kapsam
- Tüm resimler optimize edilecek
- Mevcut resimler + gelecekteki yüklemeler

### 2. Format Desteği
- WebP + AVIF (her ikisi de gerekli)
- Fallback: JPEG/PNG

### 3. Depolama Stratejisi (Karar Bekleniyor)
- Mevcut: Supabase Storage
- Alternatif: Cloudflare R2
- Karar: Backend-specialist analizi pending

### 4. Lazy Loading
- Best practices uygulanacak
- Frontend-specialist tarafından belirlenecek


---

## Mevcut Durum Analizi

### Resim Dosyaları

Statik Resimler (src/assets/):
- src/assets/products/dereotu.jpg
- src/assets/products/maydanoz.jpg
- src/assets/products/patates.jpg
- src/assets/products/patlican.jpg

Public Resimler:
- public/haldeki-logo.svg
- public/placeholder.svg
- public/favicon-*.png

Dinamik Resimler (Supabase Storage):
- Ürün resimleri (supplier uploads)
- Kullanıcı avatarları (gelecek)

### Mevcut Resim Kullanımı

| Component | Resim Sayısı | Loading Stratejisi | Durum |
|-----------|--------------|-------------------|-------|
| ProductCard | 1/resim | lazy | Güncellenecek |
| HeroSection | 8+ ürün | lazy | Güncellenecek |
| Header (logo) | 1 | eager | Güncellenecek |
| SupplierProductTable | 1/ürün | lazy | Güncellenecek |

---

## Depolama Stratejisi Analizi (Backend-Specialist)

### Soru: Supabase mi, Cloudflare R2 mi?

| Özellik | Supabase Storage | Cloudflare R2 |
|---------|------------------|---------------|
| Maliyet | 1GB free, sonra $0.021/GB | 0-10GB free, sonra $0.015/GB |
| Bandwidth | Ücretsiz çıkış ücreti | Ücretsiz egress (sınırsız) |
| CDN | Supabase CDN (CloudFlare) | CloudFlare CDN (entegre) |
| Transform | Edge functions ile | Images API (dahili) |
| Migration | Mevcut (değişiklik yok) | Gerekli |
| Setup | Mevcut çalışıyor | Yeni konfigürasyon |

Öneri:
- Kısa vade: Supabase + Edge Functions (hızlı implementasyon)
- Uzun vade: R2'ye migrate (maliyet optimizasyonu)

Karar: Backend-specialist tarafından onaylanacak.

---

## Gerekli Paketler

npm install -D vite-plugin-imagemin @types/sharp


---

## Implementasyon Adımları

### Adım 1: Paket Kurulumu

npm install -D vite-plugin-imagemin @types/sharp

Verify: package.json devDependencies bölümünde paketler görünmeli.

### Adım 2: Vite Config Güncelleme (WebP + AVIF)

Dosya: vite.config.ts

vite-plugin-imagemin ile WebP ve AVIF formatlarını build-time'da oluştur.

Not: AVIF encoding daha yavaş, build süresini uzatabilir. Production build'de çalışacak.

### Adım 3: Otomatik Optimizasyon Pipeline (Supabase Edge Function)

Dosya: supabase/functions/optimize-image/index.ts (YENİ)

Edge Function ile yeni yüklenen resimler otomatik optimize edilir.

### Adım 4: OptimizedImage Component Oluşturma (Best Practices)

Dosya: src/components/ui/OptimizedImage.tsx (YENİ)

Native lazy loading, fetchpriority, ve accessibility best practices ile.

### Adım 5: Picture Component Oluşturma (WebP + AVIF)

Dosya: src/components/ui/Picture.tsx (YENİ)

Browser'a göre otomatik format seçimi (AVIF > WebP > Fallback).

### Adım 6: Mevcut Componentleri Güncelleme

- ProductCard.tsx
- HeroSection.tsx
- Header.tsx (logo için priority)
- SupplierProductTable.tsx

### Adım 7: Upload Hook ile Otomatik Optimizasyon

Dosya: src/hooks/useImageUpload.ts (YENİ)

Yeni yüklenen resimler için otomatik WebP + AVIF dönüşümü.


---

## Test Stratejisi

### 1. Build Testi

npm run build

Beklenen Sonuç:
- JPEG/PNG dosyaları WebP + AVIF'e dönüştürülmüş
- Toplam resim boyutu %50-60 azalmış
- AVIF dosyaları WebP'ten daha küçük

### 2. Lighthouse Performance Testi

Beklenen Sonuç:
- Performance skoru +10-15 puan
- LCP %30-40 azalma
- CLS <0.1

### 3. Görsel Test

- [ ] Resimler bozuk görünmüyor
- [ ] Renkler doğru
- [ ] Loading state çalışıyor
- [ ] Lazy loading çalışıyor
- [ ] WebP/AVIF fallback çalışıyor

---

## Performans Metrikleri

### Öncesi (Mevcut)

| Metrik | Değer |
|--------|-------|
| Performance Score | 65-75 |
| LCP | 2.5-3.5s |
| Total Image Size | ~500KB |
| Format | JPEG/PNG |

### Sonrası (Hedef)

| Metrik | Hedef |
|--------|-------|
| Performance Score | 75-85+ |
| LCP | 1.5-2.0s |
| Total Image Size | ~200KB |
| Format | WebP + AVIF |

### İyileştirme

| Metrik | İyileştirme |
|--------|-------------|
| Performance | +10-15 puan |
| LCP | -30-40% |
| Bundle Size | -50-60% |
| Browser Support | Modern + Fallback |


---

## Rollback Planı

# 1. Paketi kaldır
npm uninstall vite-plugin-imagemin

# 2. vite.config.ts eski haline getir

# 3. Componentlerdeki değişiklikleri geri al

# 4. Edge function'ı sil (varsa)
supabase functions delete optimize-image

# 5. Tekrar build
npm run build

Yedekleme:
git checkout -b backup/faz-1.2-image-optimization
git add .
git commit -m "backup: Before FAZ 1.2 image optimization"

---

## Kontrol Listesi

### Kurulum
- [ ] vite-plugin-imagemin yüklendi
- [ ] @types/sharp yüklendi (opsiyonel)
- [ ] package.json güncellendi

### Konfigürasyon
- [ ] vite.config.ts güncellendi (WebP + AVIF)
- [ ] Build hatası yok
- [ ] AVIF encoding çalışıyor

### Componentler
- [ ] OptimizedImage.tsx oluşturuldu
- [ ] Picture.tsx oluşturuldu
- [ ] ProductCard.tsx güncellendi
- [ ] HeroSection.tsx güncellendi
- [ ] Header.tsx güncellendi
- [ ] SupplierProductTable.tsx güncellendi

### Otomatik Pipeline
- [ ] Supabase Edge Function oluşturuldu
- [ ] useImageUpload hook oluşturuldu
- [ ] Upload test edildi
- [ ] WebP + AVIF dönüşümü çalışıyor

### Depolama Stratejisi
- [ ] Backend-specialist analizi tamamlandı
- [ ] Supabase vs R2 kararı verildi
- [ ] R2'ye migration planı (gerekirse)

### Test
- [ ] Build başarılı
- [ ] Resimler sıkıştırılmış (WebP + AVIF)
- [ ] Lighthouse testi geçti
- [ ] Görsel regresyon yok
- [ ] Format fallback çalışıyor

### Metrikler
- [ ] Performance skoru +10 puan arttı
- [ ] LCP %30 azaldı
- [ ] Bundle boyutu %50 azaldı
- [ ] Tüm browser'larda çalışıyor


---

## İlgili Dokümanlar

- [Ana Yol Haritası](../../faz-1-2-3-yol-haritasi.md)
- [FAZ 1.1: Recharts Lazy Load](./FAZ-1.1-recharts-lazy-load.md)

---

## Notlar

### AVIF Encoding Süresi

AVIF encoding, WebP'ten 3-5x daha yavaş olabilir:
- Development build'de AVIF'i devre dışı bırakabilirsiniz
- Production build'de aktif edin
- CI/CD pipeline'da build time'ı göz önünde bulundurun

### Browser Support

- WebP: %95+ destek (Chrome, Firefox, Edge, Safari 14+)
- AVIF: %75+ destek (Chrome 85+, Firefox 93+, Safari 16+)
- Fallback: Picture element sayesinde otomatik

### Supabase vs R2 Migration (Opsiyonel)

Eğer R2'ye geçmeye karar verirseniz:

1. Migration Script:
   - Supabase Storage'dan tüm resimleri indir
   - R2'ye yükle
   - WebP + AVIF dönüşümleri oluştur

2. URL Update:
   - Database'deki image_url'leri güncelle
   - Eski URL'leri redirect et

3. Cost Analysis:
   - Mevcut maliyet: Supabase ($0.021/GB)
   - Yeni maliyet: R2 ($0.015/GB) + Sınırsız egress
   - Break-even point: ~1TB transfer

---

Son Güncelleme: 2026-01-10
Durum: Implementasyona Hazır
Sonraki Adım: Backend-specialist depolama stratejisi analizi
