# Phase 2A: Bölge Sistemi

> Bölge bazlı fiyat, stok ve teslimat slotları sistemi

**İçindekiler**
- [Bölüm 1: RegionContext & Persistence](#bolum-1-regioncontext--persistence)
- [Bölüm 2: Bölgesel Ürün Fiyat/Stok](#bolum-2-bolgesel-urun-fiyatstok)
- [Bölüm 3: Sepet Bölge Değişikliği](#bolum-3-sepet-bolge-degisikligi)
- [Bölüm 4: Teslimat Slotları](#bolum-4-teslimat-slotlari)
- [İlgili Dokümanlar](#ilgili-dokumanlar)

---

## Bölüm 1: RegionContext & Persistence

> Statik data/regions.ts yerine DB-driven bölge sistemi

### Hedefler
- selectedRegion için localStorage persistence
- Kritik aksiyonlarda (sepet, checkout) zorunlu bölge seçimi
- Tek kaynak (RegionContext) ile tutarlı state yönetimi

### Tamamlanan Adımlar

#### Adım 1: Type Alignment
- DbRegion tipi eklendi (DB schema ile uyumlu)
- SelectedRegion tipi eklendi (localStorage için minimal)
- Dosya: src/types/index.ts

#### Adım 2: useRegions Hook
- src/hooks/useRegions.ts oluşturuldu
- React Query ile cache (5 dk stale, 30 dk gc)
- is_active = true filtresi
- sort_order → name sıralaması

#### Adım 3: RegionContext
- src/contexts/RegionContext.tsx oluşturuldu
- State: selectedRegion, regions, isLoading, isRegionModalOpen
- Actions: setSelectedRegion, clearSelectedRegion, openRegionModal, closeRegionModal, requireRegion, getSelectedRegionDetails
- Hydration: localStorage → DB validation
- STORAGE_KEY: "haldeki:selectedRegion"

#### Adım 4: App.tsx Entegrasyonu
- RegionProvider eklendi (AuthProvider içinde, CartProvider öncesinde)
- RequireRegionModal global olarak eklendi

#### Adım 5: UI Entegrasyonu
- Header.tsx: RegionContext kullanıyor
- RegionSelector.tsx: DB regions kullanıyor
- RequireRegionModal.tsx: Zorunlu modal oluşturuldu (kapatılamaz)

#### Adım 6: Kritik Aksiyon Entegrasyonu
- CartContext.tsx: region yoksa openRegionModal() çağırıyor
- Cart.tsx: region yoksa modal açılıyor, bölge detayları gösteriliyor
- Checkout.tsx: RegionContext entegre edildi

#### Adım 7: Cleanup
- AuthContext.tsx: selectedRegion ve setSelectedRegion kaldırıldı
- data/regions.ts: Deprecated olarak işaretlendi

### Kabul Kriterleri

| Kriter | Durum |
|--------|-------|
| Refresh sonrası region korunur | ✅ |
| DB'de pasif region → yeniden seç | ✅ |
| Header bölge seçimi çalışır | ✅ |
| Sepete ekleme bölgesiz → modal | ✅ |
| Sepet sayfası bölgesiz → modal | ✅ |
| Statik regions.ts UI'da kullanılmıyor | ✅ |

---

## Bölüm 2: Bölgesel Ürün Fiyat/Stok

> Ürün listeleme ve detay sayfalarında seçili bölgeye özel fiyat, stok ve uygunluk bilgileri

### Özet
region_products tablosu ile products tablosu client-side merge stratejisi ile birleştirilmiştir.

### Uygulanan Değişiklikler

#### 1. Veri Katmanı

Type Tanımları (src/types/index.ts)
- RegionProductInfo: region_products tablosundan gelen ham veri
- RegionPriceInfo: UI için basitleştirilmiş bölge fiyat bilgisi
- ProductWithRegionInfo: Master product + region bilgisi birleşik

Hooks (src/hooks/useRegionProducts.ts)
- useRegionProducts(regionId): Belirli bölgedeki tüm ürün eşleşmelerini çeker
- useRegionProduct(regionId, productId): Tek ürün için bölge bilgisi çeker
- useBugunHaldeRegionProducts(regionId): Bugün Halde ürünleri için bölge bilgisi

Utility Fonksiyonlar (src/lib/productUtils.ts)
- mergeProductsWithRegion(): Master products + region_products birleştirme
- sortByAvailability(): Stok durumuna göre sıralama
- getRegionPriceInfo(): Tek ürün için RegionPriceInfo oluşturma
- getPriceChangeLabel(): Fiyat değişim etiketini kampanya diline çevirme
- getStockLabel(): Stok durumunu kullanıcı dostu metne çevirme

#### 2. UI Komponentleri

RegionBanner (src/components/region/RegionBanner.tsx)
- Bölge seçilmediğinde ürün listesi üstünde soft banner
- Kullanıcıyı bölge seçmeye yönlendirir

ProductCard (src/components/product/ProductCard.tsx)
- regionInfo prop'u eklendi
- "Bu bölgede yok" badge + disabled sepet butonu
- "Tükendi" badge + "Gelince Haber Ver" butonu
- Bölge fiyatı varsa gösterilir, yoksa master fiyat

#### 3. Sayfa Güncellemeleri

Products.tsx
- useActiveProducts() + useRegionProducts() birlikte kullanılıyor
- Client-side merge stratejisi uygulandı
- Ürünler stok durumuna göre sıralanıyor
- RegionBanner entegrasyonu

ProductDetail.tsx
- useRegionProduct() hook entegrasyonu
- Bölge fiyatı/stok bilgisi gösterimi
- Bölge yoksa veya ürün bölgede yoksa uygun mesajlar

BugunHalde.tsx
- Bölge bazlı fiyat/stok gösterimi
- Tablo görünümünde bölge bilgileri
- Kampanya dili: "Bugüne Özel", "Yeni Hasat" (finans terminolojisi yok)

### Client-Side Merge Stratejisi

Neden Client-Side Merge?
1. Cache Verimliliği: Her iki veriyi ayrı ayrı cache'leyebiliriz
2. Bölge Değişikliği: Bölge değiştiğinde sadece region_products yeniden çekilir
3. Esneklik: "Bu bölgede yok" durumunu kolayca işaretleyebiliriz

### Kabul Kriterleri

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

## Bölüm 3: Sepet Bölge Değişikliği

> Kullanıcı bölge değiştirdiğinde sepetteki ürünlerin yeni bölgeye göre validasyonu

### Değişiklikler

#### 1. CartItem Tipi Genişletme
- unitPriceAtAdd: Sepete eklendiğindeki birim fiyat
- regionIdAtAdd: Sepete eklendiğindeki bölge ID'si

#### 2. useCartValidation Hook
- Toplu validasyon için optimize edilmiş hook
- validateCartForRegion(cartItems, regionId): Tüm sepet ürünlerini yeni bölgeye göre kontrol eder
- Dönen sonuç: { validItems, invalidItems, repricedItems }

#### 3. CartContext Güncellemesi
- addToCart: unitPriceAtAdd ve regionIdAtAdd otomatik eklenir
- Bölge değişikliğinde fiyat güncellemesi ve validasyon

#### 4. RegionChangeConfirmModal
- Bölge değişikliği öncesi kullanıcıya bilgi ve onay gösterir
- Geçersiz olacak ürünler listelenir
- Fiyatı değişecek ürünler gösterilir

### Acceptance Criteria
- Bölge değiştiğinde sepet validasyonu çalışır
- Geçersiz ürünler tespit edilir ve kullanıcıya gösterilir
- Kullanıcı onayı olmadan bölge değişmez (sepet doluysa)
- Fiyat değişiklikleri yeni bölgeye göre güncellenir
- Geçersiz ürünler sepetten kaldırılabilir

---

## Bölüm 4: Teslimat Slotları

> Teslimat slotlarının veritabanından bölge bazlı çekilmesi

### Değişiklikler

#### 1. DeliverySlot Tipi Genişletme
- ProcessedDeliverySlot: isPast alanı eklendi
- start/end zamanları için string formatı

#### 2. regions Tablosu
- delivery_slots JSONB kolonu her bölge için ayrı slot tanımı içerir

#### 3. Checkout Sayfası Güncellemesi
- Slotlar DB'den çekiliyor (selectedRegion.delivery_slots)
- Bugünkü slotlar için isPast hesaplanıyor
- Geçmiş slotlar disable + görsel olarak soluk
- Start saatine göre sıralama

#### 4. Statik Dosya Cleanup
- src/data/regions.ts silindi

### Acceptance Criteria
- Teslimat slotları DB'den yükleniyor
- Bugünkü geçmiş slotlar seçilemez
- Slotlar start saatine göre sıralanır
- Farklı bölgelerde farklı slotlar gösterilebilir

---

## Navigasyon

Önceki: [Phase 1 - Temel Altyapı](./phase-1-temel-altyapi.md) | Sonraki: [Phase 2B - Admin Bölge](./phase-2b-admin-bolge.md)

---

## İlgili Dokümanlar

- [Bölgesel Fiyatlandırma - İş Mantığı](../04-is-mantigi/bolgesel-fiyatlandirma.md)
- [Genel Bakış - Mimari](../03-mimari/genel-bakis.md)
- [Veritabanı Şeması](../03-mimari/veritabani-semasi.md)

---

Son güncelleme: 2026-01-10
Sürüm: 1.0
Durum: ✅ TAMAMLANDI
