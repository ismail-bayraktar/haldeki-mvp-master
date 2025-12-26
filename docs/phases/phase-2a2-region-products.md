# FAZ 2A.2: Bölgeye Göre Ürün Fiyat/Stok Entegrasyonu

## Durum: ✅ TAMAMLANDI

**Başlangıç:** 2025-01-XX  
**Tamamlanma:** 2025-01-XX

---

## Özet

Bu fazda, ürün listeleme ve detay sayfalarında seçili bölgeye özel fiyat, stok ve uygunluk bilgileri gösterilmektedir. `region_products` tablosu ile `products` tablosu client-side merge stratejisi ile birleştirilmiştir.

---

## Uygulanan Değişiklikler

### 1. Veri Katmanı (Data Layer)

#### Type Tanımları (`src/types/index.ts`)
```typescript
// Yeni tipler eklendi:
- RegionProductInfo: region_products tablosundan gelen ham veri
- RegionPriceInfo: UI için basitleştirilmiş bölge fiyat bilgisi
- ProductWithRegionInfo: Master product + region bilgisi birleşik
```

#### Hooks (`src/hooks/useRegionProducts.ts`)
```typescript
- useRegionProducts(regionId): Belirli bölgedeki tüm ürün eşleşmelerini çeker
- useRegionProduct(regionId, productId): Tek ürün için bölge bilgisi çeker
- useBugunHaldeRegionProducts(regionId): Bugün Halde ürünleri için bölge bilgisi
```

#### Utility Fonksiyonlar (`src/lib/productUtils.ts`)
```typescript
- mergeProductsWithRegion(): Master products + region_products birleştirme
- sortByAvailability(): Stok durumuna göre sıralama
- getRegionPriceInfo(): Tek ürün için RegionPriceInfo oluşturma
- getPriceChangeLabel(): Fiyat değişim etiketini kampanya diline çevirme
- getStockLabel(): Stok durumunu kullanıcı dostu metne çevirme
```

### 2. UI Komponentleri

#### RegionBanner (`src/components/region/RegionBanner.tsx`)
- Bölge seçilmediğinde ürün listesi üstünde soft banner
- Kullanıcıyı bölge seçmeye yönlendirir

#### ProductCard (`src/components/product/ProductCard.tsx`)
- `regionInfo` prop'u eklendi
- "Bu bölgede yok" badge + disabled sepet butonu
- "Tükendi" badge + "Gelince Haber Ver" butonu
- Bölge fiyatı varsa gösterilir, yoksa master fiyat

### 3. Sayfa Güncellemeleri

#### Products.tsx
- `useActiveProducts()` + `useRegionProducts()` birlikte kullanılıyor
- Client-side merge stratejisi uygulandı
- Ürünler stok durumuna göre sıralanıyor
- RegionBanner entegrasyonu

#### ProductDetail.tsx
- `useRegionProduct()` hook entegrasyonu
- Bölge fiyatı/stok bilgisi gösterimi
- Bölge yoksa veya ürün bölgede yoksa uygun mesajlar

#### BugunHalde.tsx
- Bölge bazlı fiyat/stok gösterimi
- Tablo görünümünde bölge bilgileri
- Kampanya dili: "Bugüne Özel", "Yeni Hasat" (finans terminolojisi yok)

---

## Client-Side Merge Stratejisi

### Neden Client-Side Merge?

1. **Cache Verimliliği**: Her iki veriyi ayrı ayrı cache'leyebiliriz
2. **Bölge Değişikliği**: Bölge değiştiğinde sadece region_products yeniden çekilir
3. **Esneklik**: "Bu bölgede yok" durumunu kolayca işaretleyebiliriz

### Akış Diyagramı

```
┌─────────────────┐     ┌──────────────────┐
│ useActiveProducts│     │ useRegionProducts │
│ (master katalog) │     │ (bölge fiyat/stok)│
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
              mergeProductsWithRegion()
                     │
                     ▼
         ┌───────────────────────┐
         │ ProductWithRegionInfo[]│
         │ (birleşik veri)        │
         └───────────────────────┘
                     │
              sortByAvailability()
                     │
                     ▼
         ┌───────────────────────┐
         │ Sıralı ürün listesi   │
         │ (stok 0 alta, yok sona)│
         └───────────────────────┘
```

---

## Kabul Kriterleri

| Kriter | Durum |
|--------|-------|
| Aynı ürün farklı bölgede farklı fiyat gösterir | ✅ |
| Bölge yoksa liste/detay fiyatlar gösterilir (master) | ✅ |
| Bölge yoksa sepete ekleme modal açar | ✅ |
| Bölge ürünü yoksa "Bu bölgede yok" + disabled | ✅ |
| Stok 0 → "Tükendi" + "Gelince Haber Ver" | ✅ |
| Cart/Checkout hardcode fallback yok | ✅ |
| Checkout bölgesiz erişilemez | ✅ |
| Kampanya dili, finans terminolojisi yok | ✅ |

---

## Değişen Dosyalar

### Yeni Dosyalar
- `src/types/index.ts` (güncelleme: yeni tipler)
- `src/hooks/useRegionProducts.ts`
- `src/lib/productUtils.ts`
- `src/components/region/RegionBanner.tsx`
- `src/components/region/index.ts`

### Güncellenen Dosyalar
- `src/pages/Cart.tsx` (2A.1 hotfix)
- `src/pages/Checkout.tsx` (2A.1 hotfix + region gate)
- `src/pages/Products.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/BugunHalde.tsx`
- `src/components/product/ProductCard.tsx`

---

## Non-Goals (Bu Fazda Yapılmadı)

- ❌ Rol sistemi / RLS değişiklikleri
- ❌ Admin CRUD (bölge/ürün yönetimi)
- ❌ Gerçek "Gelince Haber Ver" abonelik sistemi
- ❌ Tedarikçi/Bayi entegrasyonu

---

## Sonraki Adımlar

- **Faz 2A.3**: Admin panelde bölge-ürün fiyat yönetimi
- **Faz 2B**: Sepet akışında bölge bazlı validasyon
- **Faz 3**: Rol tabanlı erişim kontrolü

---

## Risk ve Notlar

1. **Cache Süresi**: 2 dakika stale time kullanıldı, yoğun güncelleme dönemlerinde artırılabilir
2. **Performans**: Büyük ürün kataloglarında client-side merge yavaşlayabilir, bu durumda server-side view düşünülmeli
3. **Gelince Haber Ver**: Şu an mockup (toast), gerçek bildirim sistemi Faz 3+'te planlanmalı
