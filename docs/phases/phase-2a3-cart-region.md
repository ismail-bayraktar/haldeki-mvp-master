# Phase 2A.3: Sepet Bölge Değişikliği Yönetimi

## Özet
Kullanıcı bölge değiştirdiğinde sepetteki ürünlerin yeni bölgeye göre validasyonu, fiyat güncellemesi ve geçersiz ürünlerin kaldırılması.

## Tamamlanma Tarihi
2024-12

## Değişiklikler

### 1. CartItem Tipi Genişletme (`src/types/index.ts`)
- `unitPriceAtAdd`: Sepete eklendiğindeki birim fiyat
- `regionIdAtAdd`: Sepete eklendiğindeki bölge ID'si

### 2. useCartValidation Hook (`src/hooks/useCartValidation.ts`)
- Toplu validasyon için optimize edilmiş hook
- `validateCartForRegion(cartItems, regionId)`: Tüm sepet ürünlerini yeni bölgeye göre kontrol eder
- Dönen sonuç: `{ validItems, invalidItems, repricedItems }`

### 3. CartContext Güncellemesi (`src/contexts/CartContext.tsx`)
- `addToCart`: unitPriceAtAdd ve regionIdAtAdd otomatik eklenir
- Bölge değişikliğinde fiyat güncellemesi ve validasyon

### 4. RegionChangeConfirmModal (`src/components/region/RegionChangeConfirmModal.tsx`)
- Bölge değişikliği öncesi kullanıcıya bilgi ve onay gösterir
- Geçersiz olacak ürünler listelenir
- Fiyatı değişecek ürünler gösterilir

### 5. RegionSelector Entegrasyonu
- Seçim öncesi validasyon
- Modal ile onay akışı

### 6. Cart Sayfası Güncellemesi
- Geçersiz ürünler için uyarı badge
- "Bu ürün seçili bölgede mevcut değil" mesajı

## Acceptance Criteria
- [x] Bölge değiştiğinde sepet validasyonu çalışır
- [x] Geçersiz ürünler tespit edilir ve kullanıcıya gösterilir
- [x] Kullanıcı onayı olmadan bölge değişmez (sepet doluysa)
- [x] Fiyat değişiklikleri yeni bölgeye göre güncellenir
- [x] Geçersiz ürünler sepetten kaldırılabilir

## Test Senaryoları
1. Boş sepet → bölge değiş → sorunsuz geçiş
2. Dolu sepet → ürünlerin hepsi yeni bölgede var → onay modal + geçiş
3. Dolu sepet → bazı ürünler yeni bölgede yok → uyarı + onay + geçersizler kaldırılır
4. Fiyat farkı olan ürünler → modal'da gösterilir + sepet güncellenir
