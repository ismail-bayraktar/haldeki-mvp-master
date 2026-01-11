# Varyasyon Fiyatlandırma Sistemi Analizi
# Variation Pricing System Analysis

**Tarih:** 2025-01-11
**Analiz Türü:** Varyasyon fiyatı girilmezse ne olur?
**Kapsam:** Database → RPC → Frontend → Müşteri/Ekrana

---

## ÖZET (EXECUTIVE SUMMARY)

**Soru:** Varyasyon fiyatı eklenmezse fiyat nasıl belirleniyor?

**Cevap:** 2 farklı sistem çalışıyor ve birbiriyle çelişiyor:

1. **Yeni Sistem (RPC):** Varyasyon fiyatı girilmezse = 0 ekler, yani varyasyonsuz baz fiyat gösterir
2. **Eski Sistem (Frontend):** `priceMultiplier` kullanarak `product.price * multiplier` hesaplar

**Problem:** Varyasyon fiyatı girilmemiş ürünlerde:
- RPC = baz fiyatı döndürür
- Frontend = baz fiyatı × multiplier ile çarpar
- **SONUÇ:** Yanlış/eksik fiyat gösterimi

---

## SİSTEM MİMARİSİ

### 1. DATABASE TABLOLARI

#### 1.1 `product_variations` (Varyasyon Tanımları)

```sql
CREATE TABLE public.product_variations (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  variation_type TEXT NOT NULL,        -- 'size', 'type', 'scent', 'packaging', 'material', 'flavor', 'other'
  variation_value TEXT NOT NULL,       -- '1 KG', '500 GR', 'Kasa', etc.
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,  -- {quantity: 1, unit: 'kg', priceMultiplier: 2}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**ÖNEMLİ:** Bu tabloda **FİYAT YOK**. Sadece varyasyon tanımı var.

#### 1.2 `supplier_product_variations` (Varyasyon Fiyatları)

```sql
CREATE TABLE public.supplier_product_variations (
  id UUID PRIMARY KEY,
  supplier_product_id UUID NOT NULL REFERENCES supplier_products(id),
  variation_id UUID NOT NULL REFERENCES product_variations(id),
  supplier_variation_sku TEXT,
  price_adjustment NUMERIC(10, 2) DEFAULT 0,    -- VARYASYON FİYAT FARKI BURADA!
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_product_id, variation_id)
);
```

**ANA NOKTA:** `price_adjustment` = varyasyonun baz fiyata eklenen farkı

**Varsayılan Değer:** `0` (fiyat farkı yok)

---

## 2. RPC FONKSİYONU (calculate_product_price)

### 2.1 Fonksiyon İmzası

```sql
CREATE OR REPLACE FUNCTION public.calculate_product_price(
  p_product_id UUID,
  p_region_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_user_role TEXT DEFAULT 'b2c',
  p_variation_ids UUID[] DEFAULT NULL          -- Varyasyon ID listesi
)
RETURNS TABLE (
  final_price NUMERIC(10, 2),
  variation_adjustment NUMERIC(10, 2),         -- DÖNEN DEĞER
  supplier_price NUMERIC(10, 2),
  b2b_price NUMERIC(10, 2),
  b2c_price NUMERIC(10, 2),
  ...
)
```

### 2.2 Varyasyon Fiyat Hesaplama Mantığı

```sql
-- SATIR 420-429: Varyasyon fiyat ayarlaması hesapla
IF p_variation_ids IS NOT NULL AND array_length(p_variation_ids, 1) > 0 THEN
  SELECT COALESCE(SUM(price_adjustment), 0) INTO v_variation_price_adj
  FROM public.supplier_product_variations
  WHERE supplier_product_id IN (
    SELECT id FROM public.supplier_products
    WHERE product_id = p_product_id AND supplier_id = v_supplier_id
  )
  AND variation_id = ANY(p_variation_ids);
END IF;
```

**NE YAPAR:**
1. `p_variation_ids` listesindeki varyasyonları bulur
2. `supplier_product_variations.price_adjustment` değerlerini toplar
3. Toplam farkı `v_variation_price_adj` değişkenine atar

**EĞER VARYASYON FİYATI GİRİLMEZSE:**
- `price_adjustment = 0` (varsayılan)
- `SUM(price_adjustment) = 0`
- `v_variation_price_adj = 0`

### 2.3 Final Fiyat Hesaplama

```sql
-- SATIR 439-444: B2C fiyatı hesapla (örnek)
v_b2c_price := CASE
  WHEN v_config.price_calculation_mode = 'markup' THEN
    ROUND((v_supplier_price + v_variation_price_adj) / (1 - v_config.commission_b2c) * v_regional_multiplier, 2)
  ELSE
    ROUND((v_supplier_price + v_variation_price_adj) * (1 + v_config.commission_b2c) * v_regional_multiplier, 2)
  END;
```

**Formül:**
```
final_price = (supplier_price + variation_adjustment) * regional_multiplier / (1 - commission)
```

**Varyasyon fiyatı yoksa:**
```
final_price = (supplier_price + 0) * regional_multiplier / (1 - commission)
           = supplier_price * regional_multiplier / (1 - commission)
```

**SONUÇ:** Varyasyonsuz baz fiyat döner.

---

## 3. FRONTEND UYGULAMASI

### 3.1 useProductPrice Hook

**Dosya:** `src/hooks/useProductPrice.ts`

```typescript
export function useProductPrice(params: {
  productId: string;
  regionId: string | null;
  customerType: CustomerType;
  variationId?: string | null;         // TEK varyasyon ID
  enabled?: boolean;
}) {
  return useQuery<PriceCalculationResult | null>({
    queryKey: ['product-price', productId, regionId, customerType, variationId, supplierId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: productId,
        p_region_id: regionId,
        p_variation_ids: variationId ? [variationId] : null,  // Diziye çevir
      });
      return data as PriceCalculationResult;
    }
  });
}
```

**ÖNEMLİ:** `variationId` tek bir ID, RPC'ye `[variationId]` olarak dizi gönderilir.

### 3.2 ProductCard Fiyat Hesaplama

**Dosya:** `src/components/product/ProductCard.tsx` (SATIR 62-67)

```typescript
const displayPrice = useMemo(() => {
  const basePrice = priceResult?.final_price ?? product.price;
  const multiplier = selectedVariant?.priceMultiplier ?? 1;   // <-- ESKİ SİSTEM
  return basePrice * multiplier;
}, [priceResult, product.price, selectedVariant]);
```

**PROBLEM:**
1. RPC zaten varyasyon fiyatını hesaplar (`final_price`)
2. Frontend tekrar `priceMultiplier` ile çarpar
3. **ÇİFTE HESAPLAMA:**
   - RPC: `supplier_price + variation_adjustment`
   - Frontend: `result * priceMultiplier`

**DOĞRUSU:**
```typescript
const displayPrice = priceResult?.final_price ?? product.price;
// priceMultiplier ZATEN RPC'de variation_adjustment olarak işlendi
```

### 3.3 ProductDetail Fiyat Hesaplama

**Dosya:** `src/pages/ProductDetail.tsx` (SATIR 141-146)

```typescript
const currentPrice = useMemo(() => {
  if (!product) return 0;
  const basePrice = priceResult?.final_price ?? product.price;
  const multiplier = selectedVariant?.priceMultiplier ?? 1;      // <-- ESKİ SİSTEM
  return basePrice * multiplier;
}, [product, priceResult, selectedVariant]);
```

**AYNI PROBLEM:**
- RPC hesaplaması + Frontend çarpanı = Yanlış fiyat

### 3.4 Varyasyon Seçim UI

**Dosya:** `src/pages/ProductDetail.tsx` (SATIR 301-338)

```typescript
{productVariants.map((variant) => {
  const variantPrice = product.price * variant.priceMultiplier;  // <-- product.price ESİKİ
  const expectedPrice = product.price * variant.quantity;
  const hasSavings = variantPrice < expectedPrice;

  return (
    <button>
      <span>{variant.label}</span>
      <span>{variantPrice.toFixed(2)}₺</span>   {/* ESKİ HESAPLAMA */}
    </button>
  );
})}
```

**PROBLEMLER:**
1. `product.price` kullanılıyor (eski sistem, baz fiyat)
2. RPC'den gelen `priceResult` kullanılmıyor
3. `priceMultiplier` ile çarpılıyor (zaten RPC'de var)

**DOĞRUSU:**
```typescript
// Varyasyon için RPC çağır
const { data: variantPriceResult } = useProductPrice({
  productId: product.id,
  regionId: selectedRegion?.id ?? null,
  customerType,
  variationId: variant.id,      // Her varyasyon için ayrı RPC
});

const variantPrice = variantPriceResult?.final_price ?? product.price;
```

---

## 4. ESKİ SİSTEM (Legacy)

### 4.1 ProductVariant Tipi

**Dosya:** `src/types/index.ts`

```typescript
export interface ProductVariant {
  id: string;
  label: string;
  quantity: number;           // Örn: 2 (2 KG)
  unit: string;               // Örn: 'kg'
  priceMultiplier: number;    // Örn: 2 (2 KG = 2x fiyat)
  isDefault?: boolean;
}
```

### 4.2 Örnek Veri

**Dosya:** `src/data/products.ts`

```typescript
{
  id: "1kg",
  label: "1 KG",
  quantity: 1,
  unit: "kg",
  priceMultiplier: 1,
  isDefault: true
},
{
  id: "2kg",
  label: "2 KG",
  quantity: 2,
  unit: "kg",
  priceMultiplier: 2        // 2 KG = 2x fiyat
},
{
  id: "5kg",
  label: "5 KG",
  quantity: 5,
  unit: "kg",
  priceMultiplier: 4.5      // 5 KG = 4.5x fiyat (toplu alım indirimi)
}
```

### 4.3 Eski Hesaplama Mantığı

```
variantPrice = product.price * variant.priceMultiplier
```

**Örnek:**
- Ürün baz fiyatı: 100₺
- 2 KG varyasyonu: `100 * 2 = 200₺`
- 5 KG varyasyonu: `100 * 4.5 = 450₺` (indirimli)

---

## 5. VERİ AKIŞI (DATA FLOW)

### 5.1 Varyasyon Fiyatı Girilmiş İse

```
1. DATABASE
   supplier_product_variations.price_adjustment = 50₺

2. RPC (calculate_product_price)
   variation_adjustment = 50₺
   supplier_price = 100₺
   v_b2c_price = (100 + 50) / (1 - 0.50) * 1.0 = 300₺

3. Frontend (ProductCard)
   displayPrice = 300₺ * 1 = 300₺
   (priceMultiplier kullanılmamalı)

4. EKRAN
   300₺ gösterilir
```

### 5.2 Varyasyon Fiyatı Girilmemiş İse

```
1. DATABASE
   supplier_product_variations.price_adjustment = NULL (veya 0)

2. RPC (calculate_product_price)
   variation_adjustment = 0
   supplier_price = 100₺
   v_b2c_price = (100 + 0) / (1 - 0.50) * 1.0 = 200₺

3. Frontend (ProductCard)
   displayPrice = 200₺ * 2 = 400₺  <-- YANLIŞ!
   (priceMultiplier = 2 kullanıldı)

4. EKRAN
   400₺ gösterilir (DOĞRUSU 200₺ olmalı)
```

### 5.3 Gerçekleşen Senaryo

**Durum:** Varyasyon fiyatı girilmemiş

**Frontend'de görünen:**
- ProductCard: `displayPrice = priceResult.final_price * priceMultiplier`
- ProductDetail: `currentPrice = priceResult.final_price * priceMultiplier`
- Variant button: `variantPrice = product.price * priceMultiplier`

**Beklenti:**
- 1 KG: 100₺
- 2 KG: 200₺ (2x)
- 5 KG: 450₺ (4.5x)

**Gerçekleşen (eğer variation_adjustment = 0):**
- 1 KG: `200₺ * 1 = 200₺` (RPC = 200₺, multiplier = 1)
- 2 KG: `200₺ * 2 = 400₺` (RPC = 200₺, multiplier = 2) <-- YANLIŞ
- 5 KG: `200₺ * 4.5 = 900₺` (RPC = 200₺, multiplier = 4.5) <-- YANLIŞ

---

## 6. STOK DURUMU (STOCK QUANTITY)

### 6.1 Database Yapısı

**Tablo:** `supplier_product_variations`

```sql
stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0)
```

**Varsayılan:** `0` (stok yok)

### 6.2 RPC'de Stok Kontrolü

**Dosya:** `supabase/migrations/20260110200000_pricing_redesign_schema.sql`

```sql
-- SATIR 397-414: Supplier bilgisi (stok dahil)
SELECT
  sp.price,
  sp.availability,
  sp.stock_quantity,  -- Ürün bazlı stok
  ...
INTO v_supplier_price, v_availability, v_stock_quantity, ...
```

**PROBLEM:** Varyasyon bazlı stok (`supplier_product_variations.stock_quantity`) RPC'de kullanılmıyor.

### 6.3 Frontend'de Stok Gösterimi

**ProductCard.tsx (SATIR 57):**
```typescript
const isOutOfStock = priceResult?.stock_quantity === 0;
```

**ProductDetail.tsx (SATIR 106):**
```typescript
const isOutOfStock = !priceResult?.is_available || priceResult?.stock_quantity === 0;
```

**EKSİK:** Varyasyon seçilmişse, varyasyonun stok durumu kontrol edilmeli.

---

## 7. SORUNLAR ve ÇÖZÜMLER

### Sorun 1: Çift Fiyat Hesaplama

**Durum:**
- RPC zaten varyasyon fiyatını hesaplar
- Frontend tekrar `priceMultiplier` ile çarpar

**Çözüm:**
```typescript
// ProductCard.tsx
const displayPrice = useMemo(() => {
  return priceResult?.final_price ?? product.price;
  // priceMultiplier KALDIRILMALI
}, [priceResult, product.price]);
```

### Sorun 2: Varyasyon Fiyatı Yoksa 0 Döner

**Durum:**
- `price_adjustment = NULL` veya `0`
- RPC = baz fiyatı döndürür
- Frontend = multiplier ile çarpar

**Çözüm A (Tercih Edilen):**
- Tüm varyasyonlar için `supplier_product_variations.price_adjustment` doldurulmalı
- Varyasyon mantığı: `price_adjustment = (quantity - 1) * supplier_price`

**Çözüm B (Alternatif):**
- RPC'de varyasyon yoksa `priceMultiplier` mantığı eklenir
- Frontend'de `priceMultiplier` kullanılmaya devam edilir

### Sorun 3: Varyasyon Stok Kontrolü Yapılmıyor

**Durum:**
- RPC supplier_products.stock_quantity döndürür
- Varyasyon stokları kontrol edilmez

**Çözüm:**
- RPC'ye varyasyon stok kontrolü eklenmeli
- `supplier_product_variations.stock_quantity` kullanılmalı

### Sorun 4: UI'da Varyasyon Fiyatları Yanlış

**Durum:**
- ProductDetail varyasyon butonlarında `product.price * priceMultiplier`
- RPC sonucu kullanılmıyor

**Çözüm:**
- Her varyasyon için ayrı RPC çağrısı yapılmalı
- Veya varyasyon fiyatları cache'lenmeli

---

## 8. ÖNERİLER

### Kısa Vadeli (Acil)

1. **Frontend'de `priceMultiplier` kullanımı kaldırılmalı**
   - ProductCard.tsx: `displayPrice = priceResult?.final_price`
   - ProductDetail.tsx: `currentPrice = priceResult?.final_price`

2. **Tüm varyasyonlar için `price_adjustment` doldurulmalı**
   - Data migration script yazılmalı
   - `price_adjustment = (quantity - 1) * supplier_price` formülü

### Orta Vadeli

3. **RPC'ye varyasyon stok kontrolü eklenmeli**
   - `supplier_product_variations.stock_quantity` kontrolü
   - Varyasyon stokta yoksa `is_available = false`

4. **ProductDetail varyasyon seçimi iyileştirilmeli**
   - Her varyasyon için fiyat hesaplama (batch RPC)
   - Varyasyon fiyatları cache'lenmeli

### Uzun Vadeli

5. **Legacy `priceMultiplier` tamamen kaldırılmalı**
   - ProductVariant tipinden çıkarılmalı
   - Tüm veri migrate edilmeli

6. **Fiyat hesaplama tek bir yerde olmalı**
   - RPC = tek kaynak
   - Frontend = sadece display

---

## 9. TEST VAKALARI

### Test Vakası 1: Varyasyon Fiyatı Girilmiş

```
Girdi:
- supplier_price = 100₺
- variation_adjustment = 50₺
- commission_b2c = 0.50
- regional_multiplier = 1.0

Beklenen Çıktı:
- v_b2c_price = (100 + 50) / (1 - 0.50) * 1.0 = 300₺
- final_price = 300₺
- Frontend displayPrice = 300₺
```

### Test Vakası 2: Varyasyon Fiyatı Girilmemiş

```
Girdi:
- supplier_price = 100₺
- variation_adjustment = 0 (veya NULL)
- commission_b2c = 0.50
- regional_multiplier = 1.0

Beklenen Çıktı:
- v_b2c_price = (100 + 0) / (1 - 0.50) * 1.0 = 200₺
- final_price = 200₺
- Frontend displayPrice = 200₺
- (priceMultiplier kullanılmamalı)
```

### Test Vakası 3: Varyasyon Stok Kontrolü

```
Girdi:
- supplier_products.stock_quantity = 100
- supplier_product_variations.stock_quantity = 0 (varyasyon stokta yok)

Beklenen Çıktı:
- is_available = false
- isOutOfStock = true
- Sepete ekle butonu disabled
```

---

## 10. ÖZET TABLO

| Senaryo | RPC Sonucu | Frontend | Ekranda Görünen | Doğru mu? |
|---------|-----------|----------|-----------------|-----------|
| Varyasyon fiyatı var | adjustment = 50₺ | × multiplier | Yanlış | ❌ |
| Varyasyon fiyatı yok | adjustment = 0₺ | × multiplier | Yanlış | ❌ |
| Varyasyon fiyatı var | adjustment = 50₺ | Doğrudan kullan | Doğru | ✅ |
| Varyasyon fiyatı yok | adjustment = 0₺ | Doğrudan kullan | Doğru | ✅ |

---

## 11. KAYNAKLAR

**Database Migrations:**
- `supabase/migrations/20250110000000_phase12_multi_supplier_products.sql`
- `supabase/migrations/20260110200000_pricing_redesign_schema.sql`

**Frontend Kod:**
- `src/hooks/useProductPrice.ts`
- `src/components/product/ProductCard.tsx`
- `src/pages/ProductDetail.tsx`

**Types:**
- `src/types/pricing.ts`
- `src/types/index.ts` (ProductVariant)

**Dokümantasyon:**
- `docs/06-gelistirme/notlar/VARYASYON-FIYAT-ISSUE.md`

---

**Son Güncelleme:** 2025-01-11
**Durum:** Analiz tamamlandı, çözüm önerileri hazır
**Öncelik:** Yüksek (müşteriye yanlış fiyat gösteriliyor)
