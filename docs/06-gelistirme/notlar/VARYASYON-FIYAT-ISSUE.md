# VARYASYON SISTEMI FIYAT ISSUE ANALIZI

> **DIPNOT**: Bu dosya varyasyon sistemindeki fiyat garip problemi icin analizi icerir.
> **Tarih**: 2026-01-10
> **Durum**: ANALYZED - FIX REQUIRED

---

## ISSUE: Tekli Urun Sayfasinda Fiyatlar Degisiyor

### Problem Tanimi

ProductDetail sayfasinda urun varyasyonlari secilirken gorsellenen fiyat ile sepete eklenen fiyat arasinda farklilik olusuyor.

### Gözlemler

1. **Sayfa yuklenince**: Fiyat dogru gorunuyor
2. **Varyasyon secince**: Fiyat bazen degisiyor (degismesi gereken durumlar disinda)
3. **Sepete ekle**: Bazen gorselen fiyat farkli bir fiyat sepete ekleniyor

### Sorunlu Kodlar

#### Sorun 1: Fiyat Hesaplama Mantigi

**Dosya**: `src/pages/ProductDetail.tsx`

```tsx
// Satir 60: useLowestPriceForCart hook cagrisi
const { data: priceInfo } = useLowestPriceForCart(
  product?.id ?? '',
  selectedRegion?.id ?? null
);

// Satir 137-142: GORUNEN FIYAT (display price)
const currentPrice = useMemo(() => {
  if (!product) return 0;
  const basePrice = regionInfo?.price ?? product.price;  // ❌ priceInfo YOK
  const multiplier = selectedVariant?.priceMultiplier ?? 1;
  return basePrice * multiplier;
}, [product, regionInfo, selectedVariant]);

// Satir 168: SEPETE EKLENEN FIYAT (cart price)
const unitPrice = priceInfo?.price ?? regionInfo?.price ?? product.price;  // ✅ priceInfo VAR
```

**Sorun**:
- `currentPrice`: `regionInfo.price` veya `product.price` kullanir
- `priceInfo`: Supplier fiyatini icerir (genelde daha dusuk)
- `handleAddToCart`: `priceInfo.price` kullanir

**Sonuc**: Gorunen fiyat ile sepet fiyat farkli!

#### Sorun 2: Varyasyon Fiyat Gosterimi

```tsx
// Satir 304-336: Varyasyon butonlarinda fiyat
const variantPrice = product.price * variant.priceMultiplier;  // ❌ Sabit product.price
const expectedPrice = product.price * variant.quantity;
```

**Sorun**: Varyasyon fiyat hesaplamasi `product.price` kullanir (region veya supplier fiyatini yok sayar)

---

## Root Cause Analizi

### Problem

Fiyat hesaplamada 3 farkli kaynak var:
1. `product.price` - Master urun taban fiyati
2. `regionInfo.price` - Bolgeye ozel fiyat
3. `priceInfo.price` - En dusuk fiyat (supplier veya region)

**Mevcut durum**:
- **Gorunen fiyat**: `regionInfo.price` veya `product.price`
- **Sepet fiyat**: `priceInfo.price` (supplier fiyati olabilir)
- **Varyasyon fiyat**: `product.price` (her zaman sabit)

**Beklenen durum**:
- Tum fiyat hesaplamalari ayni kaynagi kullanmali
- Varyasyonlar da aktif fiyat kaynagini gostermeli

---

## Cozum Onerileri

### Option 1: Uniform Price Source (RECOMMENDED)

Tum fiyat hesaplamalari `priceInfo` kullanmali:

```tsx
// Tek bir fiyat kaynagi
const activePrice = priceInfo?.price ?? regionInfo?.price ?? product.price;

// Gorunen fiyat
const currentPrice = useMemo(() => {
  const basePrice = activePrice;  // ✅ priceInfo dahil
  const multiplier = selectedVariant?.priceMultiplier ?? 1;
  return basePrice * multiplier;
}, [activePrice, selectedVariant]);

// Varyasyon fiyat
const variantPrice = activePrice * variant.priceMultiplier;  // ✅ Aktif fiyat
```

**Avantajlari**:
- Tutarli fiyat gostergesi
- Supplier indirimleri gorselde de gorulur
- Kullanici surpriz olmaz

### Option 2: Price Source Indicator

Fiyat kaynagini gorsellestir:

```tsx
// Fiyat kaynagi badge'i
{priceInfo?.priceSource === 'supplier' && (
  <Badge variant="secondary">
    Tedarikci Fiyati
  </Badge>
)}
```

### Option 3: Separate Variant Pricing

Varyasyonlar icin ayri fiyat tablosu:

```sql
-- product_variation_prices tablosu
CREATE TABLE product_variation_prices (
  id UUID PRIMARY KEY,
  variation_id UUID REFERENCES product_variations(id),
  region_id UUID REFERENCES regions(id),
  supplier_id UUID REFERENCES suppliers(id),
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true
);
```

---

## Test Senaryoları

### Test Case 1: Supplier Fiyati < Region Fiyati

```
Urun: Domates
- Master price: 50 ₺
- Region price: 45 ₺
- Supplier price: 40 ₺

Varyasyon: 2kg (multiplier: 1.9)

Beklenen:
- Gorunen fiyat: 40 * 1.9 = 76 ₺
- Sepet fiyat: 76 ₺
- Varyasyon buton: 76 ₺

Mevcut (BUGGY):
- Gorunen fiyat: 45 * 1.9 = 85.5 ₺  ❌
- Sepet fiyat: 76 ₺  ✅
- Fark: 9.5 ₺  ❌
```

### Test Case 2: Region Fiyati < Master Fiyati

```
Urun: Salatalik
- Master price: 30 ₺
- Region price: 25 ₺
- Supplier: (yok)

Varyasyon: 3kg (multiplier: 2.8)

Beklenen:
- Gorunen fiyat: 25 * 2.8 = 70 ₺
- Sepet fiyat: 70 ₺
- Varyasyon buton: 70 ₺

Mevcut (BUGGY):
- Gorunen fiyat: 25 * 2.8 = 70 ₺  ✅
- Sepet fiyat: 70 ₺  ✅
- Varyasyon buton: 30 * 2.8 = 84 ₺  ❌  (Master price kullaniliyor!)
```

---

## Impact Analysis

### Etkilenen Dosyalar

1. **src/pages/ProductDetail.tsx**
   - `currentPrice` hesaplamasi
   - Varyasyon fiyat gostergeleri
   - `handleAddToCart` fiyat parametresi

2. **src/hooks/useLowestPriceForCart.ts**
   - Supplier fiyat logic
   - Region fallback logic

3. **src/components/product/ProductCard.tsx**
   - Liste sayfasi fiyat gostergesi

### Etkilenen Kullanici Deneyimi

- **Surprise factor**: Kullanici dusuk gorunen fiyatla urunu secebilir, ama sepete farkli fiyat eklenir
- **Guven sorunlari**: Fiyat degismesi guven sorunlari yaratabilir
- **Satis kaybi**: Kullanici sepete eklemeden vazgecebilir

---

## Fix Priority

| Priority | Action | Estimated Effort |
|----------|--------|------------------|
| **P0 - CRITICAL** | Fix ProductDisplay vs Cart price mismatch | 2-3 hours |
| **P1 - HIGH** | Fix variant button pricing | 1-2 hours |
| **P2 - MEDIUM** | Add price source indicator | 1 hour |
| **P3 - LOW** | Separate variant pricing table | 4-6 hours |

---

## Recommended Fix (Step-by-Step)

### Step 1: Fix currentPrice calculation

```tsx
// ProductDetail.tsx - Satir 137-142
const currentPrice = useMemo(() => {
  if (!product) return 0;
  // ✅ Use priceInfo (includes supplier discount)
  const basePrice = priceInfo?.price ?? regionInfo?.price ?? product.price;
  const multiplier = selectedVariant?.priceMultiplier ?? 1;
  return basePrice * multiplier;
}, [product, regionInfo, priceInfo, selectedVariant]);
```

### Step 2: Fix variant button pricing

```tsx
// ProductDetail.tsx - Satir 304-306
// ❌ OLD: const variantPrice = product.price * variant.priceMultiplier;
// ✅ NEW:
const activeBasePrice = priceInfo?.price ?? regionInfo?.price ?? product.price;
const variantPrice = activeBasePrice * variant.priceMultiplier;
const expectedPrice = activeBasePrice * variant.quantity;
```

### Step 3: Add price source badge (UX improvement)

```tsx
// Add to price display section
{priceInfo?.priceSource === 'supplier' && (
  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
    Tedarikci Fiyati
  </span>
)}
```

### Step 4: Unit tests

```tsx
// Add tests for price calculation
describe('ProductDetail Price Calculation', () => {
  it('should use supplier price when available', () => {
    // Test case: supplier < region < master
  });

  it('should apply variant multiplier to active price', () => {
    // Test case: 2kg variant with 1.9 multiplier
  });

  it('should display same price in cart', () => {
    // Test case: displayed price === cart price
  });
});
```

---

## Next Actions

1. **[ ]** Fix ProductDisplay.tsx currentPrice calculation
2. **[ ]** Fix variant button pricing
3. **[ ]** Add price source indicator badge
4. **[ ]** Add unit tests for price calculation
5. **[ ]** Manual testing with real product data
6. **[ ]** Update documentation if needed

---

## References

- Related PR: Phase 12 Multi-Supplier System
- Related files:
  - `src/pages/ProductDetail.tsx` (lines 137-142, 304-336)
  - `src/hooks/useLowestPriceForCart.ts`
  - `src/hooks/useProductVariations.ts`
  - `supabase/migrations/20250110150000_create_product_variations.sql`

---

**Not**: Bu analiz dipnot olarak saklanmistir. Fix implementasyonu icin ayrica task olusturulmalidir.
