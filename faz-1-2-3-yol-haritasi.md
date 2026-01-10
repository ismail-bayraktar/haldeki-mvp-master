# Haldeki Market - FAZ 1-2-3 Yol Haritası

> Oncelikli Gelistirme Plani
> Playground gelistirmesinden once, is kritik ozelliklere odaklanan detayli yol haritasi

Son guncelleme: 2026-01-10

---

## Ozet

Bu yol haritasi, Haldeki Market platformunun performansini, ozellik setini ve musteri deneyimini gelistirmek icin tasarlanmis uc ana fazi icerir.

| Faz | Sure | Odak | Is Degeri |
|-----|------|------|-----------|
| FAZ 1 | 1-2 hafta | Performans | Hizli yukleme, daha iyi UX |
| FAZ 2 | 2-3 hafta | Siparis Takibi | Mustteri memnuniyeti, guven |
| FAZ 3 | 3-4 hafta | Promosyon | Satis artisi, musteri bagliligi |

---

## FAZ 1: Hizli Kazanclar (Quick Wins)

### 1.1 Recharts Lazy Load

**Is Degeri:** Dashboard ve admin sayfalarda ilk yukleme suresini azaltir.

**Detayli Plan:** [FAZ 1.1: Recharts Lazy Load Implementasyonu](docs/faz-1/FAZ-1.1-recharts-lazy-load.md)

**Teknik Yaklasim:**
- React.lazy() ile dinamik import
- Suspense ile yukleniyor durumu

**Dosyalar:**
- src/components/charts/LazyChart.tsx (YENI)
- src/pages/admin/Dashboard.tsx (GUNCELLE)

**Kabul Kriteri:**
- [ ] Ilk yukleme suresi en az 200ms azaldi
- [ ] Skeleton gosterge calisiyor

---

### 1.2 Image Optimizasyonu

**Is Degeri:** Resim yukleme suresini %50 azaltir. SEO skorunu iyilestirir.

**Teknik Yaklasim:**
- vite-plugin-imagemin ekle
- WebP/AVIF formatina cevir
- Lazy loading

**Dosyalar:**
- vite.config.ts (GUNCELLE)
- src/components/ui/OptimizedImage.tsx (YENI)
- package.json (vite-plugin-imagemin ekle)

**Kabul Kriteri:**
- [ ] Lighthouse Performance skoru +10 puan artti

---

### 1.3 Account Panel Backend Entegrasyonu

**Is Degeri:** Musterilerin kendi verilerini yonetebilmelerini saglar.

**Teknik Yaklasim:**
- Supabase tablolari bagla
- Siparis listesi getir
- Adres CRUD

**Dosyalar:**
- src/lib/supabase/queries.ts (GUNCELLE)
- src/pages/account/Orders.tsx (GUNCELLE)
- src/pages/account/Addresses.tsx (YENI)
- supabase/migrations/xxx_user_addresses.sql (YENI)

**Kabul Kriteri:**
- [ ] Siparis listesi gosteriliyor
- [ ] Adres ekleme/duzenleme/silme calisiyor

---

## FAZ 2: Core Ozellikler

### 2.1 Real-time Siparis Takibi

**Is Degeri:** Musteriler siparis durumunu anlik gorebilir.

**Teknik Yaklasim:**
- Timeline gorunumu
- 30 saniyede bir polling

**Dosyalar:**
- src/types/order.ts (YENI)
- src/hooks/useOrderTracking.ts (YENI)
- src/components/order/OrderTimeline.tsx (YENI)
- supabase/migrations/xxx_order_timeline.sql (YENI)

**Kabul Kriteri:**
- [ ] Siparis asamalari timeline olarak gosteriliyor
- [ ] Otomatik guncelleniyor

---

### 2.2 Urun Degerlendirme Sistemi

**Is Degeri:** Sosyal kanit saglar. Satis donusumunu artirir.

**Teknik Yaklasim:**
- Yildiz + yorum + fotograf
- Onay sistemi
- Ortalama puan

**Dosyalar:**
- src/types/review.ts (YENI)
- src/components/product/ProductReviews.tsx (GUNCELLE)
- src/components/product/ReviewForm.tsx (YENI)
- supabase/migrations/xxx_product_reviews.sql (YENI)

**Kabul Kriteri:**
- [ ] Yildiz puani verilebiliyor
- [ ] Yorum yazilabiliyor
- [ ] Dogrulanmis alisveris rozeti

---

## FAZ 3: Buyume Ozellikleri

### 3.1 Promosyon Sistemi

**Is Degeri:** Siparis degerini artirir.

**Teknik Yaklasim:**
- Kupon sistemi
- Sepet indirimleri
- Admin yonetimi

**Dosyalar:**
- src/contexts/CouponContext.tsx (YENI)
- src/components/cart/CouponInput.tsx (YENI)
- src/pages/admin/Coupons.tsx (YENI)
- supabase/migrations/xxx_coupons.sql (YENI)

**Kabul Kriteri:**
- [ ] Kupon kodu ile indirim uygulanabiliyor
- [ ] Admin panelde kupon CRUD

---

### 3.2 Akilli Urun Oneri Sistemi

**Is Degeri:** Cross-sell firsatlari artirir.

**Teknik Yaklasim:**
- Icincen satin alanlar (IBA)
- Kisilsel oneriler
- Popiler urunler

**Dosyalar:**
- src/lib/supabase/recommendations.ts (YENI)
- src/components/product/ProductRecommendations.tsx (YENI)
- supabase/migrations/xxx_recommendations.sql (YENI)

**Kabul Kriteri:**
- [ ] "Bunu alanlar bunlari da aldilar" gosteriliyor
- [ ] Kisilsel oneriler sunuluyor

---

## Test Stratejisi

### Birim Testler (Vitest)
- tests/unit/lazy-chart.test.ts
- tests/unit/order-timeline.test.ts
- tests/unit/coupon-context.test.ts

### E2E Testler (Playwright)
- tests/e2e/account.spec.ts
- tests/e2e/order-tracking.spec.ts
- tests/e2e/product-reviews.spec.ts
- tests/e2e/coupon.spec.ts

---

## Deployment

1. Her faz icin: Kod -> Migration -> Test -> Staging -> Production
2. Feature flags ile kontrollu acilis
3. Monitoring ve error tracking

---

**Son guncelleme:** 2026-01-10
**Durum:** Planlama Asamasi

## Detayli Faz Planlari

- [FAZ 1.1: Recharts Lazy Load](docs/faz-1/FAZ-1.1-recharts-lazy-load.md) - Implementasyona Hazir

- [FAZ 1.2: Image Optimizasyonu](docs/faz-1/FAZ-1.2-image-optimization.md) - Implementasyona Hazir
