# Yeni Fiyatlandırma Sistemi - Hızlı Başvuru
# New Pricing System - Quick Reference

## Hızlı Bakış / Quick Overview

**Eski Sistem (4 Katmanlı) / Old System (4-Layer):**
```
products.price → products.base_price → region_products.price → supplier_products.price
❌ Karmaşık, hangisi doğru?
```

**Yeni Sistem (Tek Kaynak) / New System (Single Source):**
```
supplier_products.price → calculate_product_price() RPC → Final Price
✅ Tek kaynak, net hesaplama
```

## Temel Kavramlar / Core Concepts

### 1. Tedarikçi Fiyatı (Authority Source)
- **Tablo:** `supplier_products.price`
- **Anlamı:** Tedarikçinin satış fiyatı (tüm hesaplamaların temeli)
- **Not:** Bütün fiyatlar buradan başlar

### 2. Bölgesel Çarpan (Regional Multiplier)
- **Tablo:** `regional_multipliers.multiplier`
- **Varsayılan:** 1.0 (değişiklik yok)
- **Örnek:** 1.1 = %10 artış, 0.9 = %10 indirim

### 3. Komisyon Oranı (Commission Rate)
- **B2B:** %30 (0.30)
- **B2C:** %50 (0.50)
- **Yer:** `system_settings` tablosu, admin panelinden ayarlanabilir

### 4. Varyasyon Ayarlaması (Variation Adjustment)
- **Tablo:** `supplier_product_variations.price_adjustment`
- **Anlamı:** Varyasyona göre fiyat farkı (+ veya -)
- **Örnek:** 4 LT +5 TL, Renkli -2 TL

## Fiyat Hesaplama Formülü / Price Calculation Formula

```
1. Temel Fiyat = supplier_products.price
2. Bölgesel = Temel Fiyat × regional_multiplier
3. Varyasyon = Bölgesel + variation_adjustments
4. Komisyon = Varyasyon × commission_rate
5. Final Fiyat = Varyasyon + Komisyon
```

**Örnek Hesaplama / Example Calculation:**
```
Ürün: Domates
Tedarikçi Fiyatı: 50 TL
Bölgesel Çarpan: 1.1 (İzmir)
Varyasyon: +5 TL (Organik)
Müşteri Tipi: B2C

Hesaplama:
1. Temel: 50 TL
2. Bölgesel: 50 × 1.1 = 55 TL
3. Varyasyon: 55 + 5 = 60 TL
4. Komisyon: 60 × 0.50 = 30 TL
5. Final: 60 + 30 = 90 TL
```

## Kullanım Örnekleri / Usage Examples

### React Hook ile Fiyat Al / Get Price with Hook

```typescript
import { useProductPrice } from '@/hooks/useProductPrice';

function ProductCard({ productId }) {
  const { data: price, isLoading } = useProductPrice({
    productId,
    regionId: selectedRegion?.id,
    customerType: isB2B ? 'b2b' : 'b2c',
  });

  if (isLoading) return <Yükleniyor />;
  if (!price) return <Fiyat Yok>;

  return (
    <div>
      <p>Fiyat: {price.final_price} TL</p>
      <p>Tedarikçi: {price.supplier_name}</p>
    </div>
  );
}
```

### Sepete Ekleme / Add to Cart

```typescript
import { useCart } from '@/contexts/CartContext';
import { useProductPrice } from '@/hooks/useProductPrice';

function AddButton({ product }) {
  const { addToCart } = useCart();
  const { data: price } = useProductPrice({
    productId: product.id,
    regionId: selectedRegion?.id,
    customerType: 'b2c',
  });

  return (
    <button onClick={() => addToCart(product, 1, undefined, undefined, undefined, price)}>
      Sepete Ekle
    </button>
  );
}
```

### Direct RPC Call (Utilities)

```typescript
import { calculateProductPrice } from '@/lib/supabase/queries';

async function getPrice() {
  const price = await calculateProductPrice({
    productId: 'prod-123',
    regionId: 'reg-456',
    customerType: 'b2c',
  });

  console.log('Final:', price.final_price);
  console.log('Komisyon:', price.commission_amount);
}
```

## Tip Güvenliği / Type Safety

```typescript
import type { PriceCalculationResult } from '@/types/pricing';

const price: PriceCalculationResult = {
  supplier_price: 50,
  regional_multiplier: 1.1,
  variation_adjustment: 5,
  base_price: 60,
  commission_rate: 0.5,
  commission_amount: 30,
  final_price: 90,
  supplier_id: 'sup-123',
  supplier_name: 'Ali Çiftçi',
  supplier_product_id: 'sp-456',
  stock_quantity: 100,
  availability: 'plenty',
  is_available: true,
  min_order_quantity: 10,
};
```

## Komisyon Yardımcıları / Commission Helpers

```typescript
import { getCommissionRate, calculateCommission } from '@/lib/pricing';

// Komisyon oranını al
const rate = getCommissionRate('b2b'); // 0.30

// Komisyon tutarını hesapla
const commission = calculateCommission(100, 'b2c'); // 50

// Fiyata komisyon ekle
const withCommission = 100 + commission; // 150
```

## Bölgesel Fiyatlandırma / Regional Pricing

```typescript
import { applyRegionalMultiplier, getRegionalMultiplier } from '@/lib/pricing';

// Çarpan uygula
const price = applyRegionalMultiplier(100, 1.1); // 110

// Veritabanından çarpan al
const multiplier = await getRegionalMultiplier('region-123');
const regionalPrice = applyRegionalMultiplier(100, multiplier);
```

## Varyasyon Fiyatları / Variation Prices

```typescript
import { applyVariationAdjustment, sumVariationAdjustments } from '@/lib/pricing';

// Tek varyasyon ekle
const price1 = applyVariationAdjustment(100, 5); // 105

// Birden fazla varyasyon topla
const adjustments = [5, -2, 3];
const totalAdjustment = sumVariationAdjustments(adjustments); // 6
const price2 = applyVariationAdjustment(100, totalAdjustment); // 106
```

## Formatlama / Formatting

```typescript
import { formatPrice, formatPriceChange, formatCommissionRate } from '@/lib/pricing';

// Para birimi formatı
formatPrice(123.45); // "123,45 ₺"

// Fiyat değişimi formatı
formatPriceChange(110, 100); // { type: 'increased', percentage: 10, formatted: '%10 artış' }

// Komisyon oranı formatı
formatCommissionRate(0.30); // "%30"
```

## Doğrulama / Validation

```typescript
import { validatePriceInput, validatePriceResult } from '@/lib/pricing';

// Girdileri doğrula
const inputValidation = validatePriceInput({
  product_id: 'prod-123',
  region_id: 'reg-456',
  customer_type: 'b2c',
});

if (!inputValidation.isValid) {
  console.error('Hatalar:', inputValidation.errors);
}

// Sonucu doğrula
const resultValidation = validatePriceResult(priceResult);
if (!resultValidation.isValid) {
  console.error('Hatalar:', resultValidation.errors);
}
```

## Güvenlik Notları / Security Notes

1. **Fiyat Hesaplama:** Her zaman RPC fonksiyonunu kullanın
2. **Client-side:** Sadece fallback için kullanılır
3. **Sepet Doğrulama:** Checkout'da fiyatları tekrar hesaplayın
4. **Yetkilendirme:** Admin işlemleri için RLS politikaları

## Geçiş Rehberi / Migration Guide

### Eski Kod / Old Code
```typescript
// ❌ ESKİ: products.price kullan
const price = product.price;
```

### Yeni Kod / New Code
```typescript
// ✅ YENİ: RPC ile hesapla
const { data: price } = useProductPrice({
  productId: product.id,
  regionId: selectedRegion?.id,
  customerType: 'b2c',
});
const finalPrice = price?.final_price;
```

### Eski Kod / Old Code
```typescript
// ❌ ESKİ: region_products.price kullan
const regionPrice = regionProduct.price;
```

### Yeni Kod / New Code
```typescript
// ✅ YENİ: RPC otomatik hesaplar
// Regional multiplier, RPC içinde uygulanır
```

### Eski Kod / Old Code
```typescript
// ❌ ESKİ: Komisyon manuel hesapla
const commission = price * 0.5;
```

### Yeni Kod / New Code
```typescript
// ✅ YENİ: RPC otomatik hesaplar
const commission = price.commission_amount;
```

## Hata Ayıklama / Debugging

```typescript
// Fiyat hesaplama detaylarını gör
console.log('Fiyat Detayları:', {
  temel: price.supplier_price,
  bolgesel_carpan: price.regional_multiplier,
  varyasyon: price.variation_adjustment,
  ara_fiyat: price.base_price,
  komisyon_orani: price.commission_rate,
  komisyon_tutari: price.commission_amount,
  final_fiyat: price.final_price,
});

// Beklenmedik fiyat kontrolü
if (price.final_price < price.supplier_price) {
  console.error('HATA: Final fiyat temel fiyattan düşük!');
}
```

## İpuçları / Tips

1. **Her zaman RPC kullanın:** `calculate_product_price()`
2. **Hook tercih edin:** `useProductPrice()` daha kolay
3. **Type-safe kullanın:** `PriceCalculationResult` tipi
4. **Hata yakalayın:** RPC hatalarını yönetin
5. **Cache'in farkında olun:** 2 dakika staleTime

## Sonraki Adımlar / Next Steps

- [ ] ProductCard bileşenlerini güncelle
- [ ] Admin paneli - Komisyon oranları
- [ ] Tedarikçi paneli - Fiyat güncelleme
- [ ] Checkout - Fiyat doğrulama
- [ ] Test yaz - Unit & Integration
