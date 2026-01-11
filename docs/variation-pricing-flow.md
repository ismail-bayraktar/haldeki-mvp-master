# Variation Pricing Flow Analysis

> **Soru:** "Varyasyonların fiyatı veya stoğu girmezsek nasıl olacak?"
>
> **Cevap:** Sistem çeşitli fallback mekanizmaları ile durumu yönetir.

---

## 1. Veri Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE (PostgreSQL)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌────────────────────┐    ┌──────────────────┐   │
│  │   products       │    │ product_variations │    │ supplier_products│   │
│  ├──────────────────┤    ├────────────────────┤    ├──────────────────┤   │
│  │ id               │    │ id                 │    │ id               │   │
│  │ name             │◄───│ product_id        │◄───│ product_id       │   │
│  │ base_price       │    │ variation_type     │    │ price            │   │
│  │ unit             │    │ variation_value    │    │ stock_quantity   │   │
│  └──────────────────┘    │ metadata (JSONB)   │    │ availability     │   │
│                          │  ├─ quantity       │    │ supplier_id      │   │
│                          │  ├─ priceMultiplier│    └──────────────────┘   │
│                          │  └─ unit           │                            │
│                          └────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ RPC: get_product_variations()
                                    │ RPC: calculate_product_price()
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  useProductVariations Hook                                            │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  - Fetches variations from DB                                         │  │
│  │  - Returns: ProductVariation[]                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  useProductPrice Hook                                                 │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  - Calls calculate_product_price RPC                                  │  │
│  │  - Returns: PriceCalculationResult | null                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ProductCard / ProductDetail Components                              │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  - Combines price result + variant multiplier                         │  │
│  │  - Displays final price to customer                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fiyat Hesaplama Formülü

### ProductCard.tsx (Satır 62-67)

```typescript
const displayPrice = useMemo(() => {
  // Fallback: RPC null dönerse ürünün base fiyatını kullan
  const basePrice = priceResult?.final_price ?? product.price;
  const multiplier = selectedVariant?.priceMultiplier ?? 1;
  return basePrice * multiplier;
}, [priceResult, product.price, selectedVariant]);
```

### ProductDetail.tsx (Satır 141-146)

```typescript
const currentPrice = useMemo(() => {
  if (!product) return 0;
  const basePrice = priceResult?.final_price ?? product.price;
  const multiplier = selectedVariant?.priceMultiplier ?? 1;
  return basePrice * multiplier;
}, [product, priceResult, selectedVariant]);
```

---

## 3. Senaryo Analizi

### Senaryo A: Tüm Veriler Mevcut

| Durum | Değer |
|-------|-------|
| `priceResult.final_price` | 50 ₺ |
| `selectedVariant.priceMultiplier` | 2.0 |
| `displayPrice` | 50 × 2.0 = **100 ₺** |

**Müşteri görür:** "100 ₺ / 2 kg"

---

### Senaryo B: Varyasyon Fiyat Çarpanı Yok

| Durum | Değer |
|-------|-------|
| `priceResult.final_price` | 50 ₺ |
| `selectedVariant.priceMultiplier` | `undefined` |
| `displayPrice` | 50 × 1 = **50 ₺** |

**Müşteri görür:** "50 ₺ / 1 kg" (varsayılan birim)

---

### Senaryo C: Bölge Fiyatı Yok (RPC null döner)

| Durum | Değer |
|-------|-------|
| `priceResult` | `null` |
| `product.price` (fallback) | 45 ₺ |
| `selectedVariant.priceMultiplier` | 2.0 |
| `displayPrice` | 45 × 2.0 = **90 ₺** |

**Müşteri görür:**
- Fiyat: "90 ₺"
- Badge: "Varsayılan Fiyat" (turuncu uyarı)

---

### Senaryo D: Varyasyon Meta Verisi Eksik

**Veritabanı kaydı:**
```json
{
  "id": "var_123",
  "variation_type": "size",
  "variation_value": "2 kg",
  "metadata": {
    "quantity": 2,
    "unit": "kg"
    // "priceMultiplier" eksik!
  }
}
```

**Frontend davranışı (ProductDetail.tsx:86):**
```typescript
const priceMultiplier = v.metadata?.priceMultiplier as number || 1;
```

| Durum | Değer |
|-------|-------|
| `priceMultiplier` | 1 (fallback) |
| `displayPrice` | basePrice × 1 |

**Müşteri görür:** Varyasyon label'ı ("2 kg") görünür ama fiyat base_price kadar olur.

---

## 4. Stok Durumu

### useProductVariations Hook

**Not:** `product_variations` tablosunda `stock_quantity` alanı YOKtur.

Stok bilgisi **sadece** `supplier_products` tablosundan gelir:
- `supplier_products.stock_quantity`
- `supplier_products.availability`

### ProductCard.tsx Stok Kontrolü (Satır 57)

```typescript
const isOutOfStock = priceResult?.stock_quantity === 0;
```

**Eğer varyasyon stoğu ayrı tutulmak isteniyorsa:**
1. `product_variations.metadata` JSONB alanına `stock_quantity` ekle
2. Frontend'de `selectedVariant.metadata?.stock_quantity` kontrolü ekle
3. Varyasyon seçiminde stok kontrolü yap

---

## 5. Müşteri Arayüzü Gösterimi

### Varyasyon Seçim Butonları (ProductDetail.tsx:308-336)

```tsx
<button>
  <span>{variant.label}</span>           {/* "2 kg" */}
  <span>{variantPrice.toFixed(2)}₺</span> {/* Hesaplanan fiyat */}
</button>
```

**Fiyat hesaplaması (Satır 303):**
```typescript
const variantPrice = product.price * variant.priceMultiplier;
```

### "Avantajlı" Badge Kontrolü (Satır 305)

```typescript
const expectedPrice = product.price * variant.quantity;
const hasSavings = variantPrice < expectedPrice;
```

**Örnek:**
- `product.price` = 50 ₺
- `variant.quantity` = 2 (2 kg)
- `variant.priceMultiplier` = 1.8 (indirimli)
- `expectedPrice` = 50 × 2 = 100 ₺
- `variantPrice` = 50 × 1.8 = 90 ₺
- `hasSavings` = true (10 ₺ indirim)

---

## 6. Hata Durumları ve Fallback'ler

### Durum 1: RPC Hata Döner

```typescript
// useProductPrice.ts:60-64
if (error) {
  console.error('RPC error calculating product price:', error);
  return null; // Fallback tetikler
}
```

**Sonuç:** `product.price` kullanılır

---

### Durum 2: Bölge Seçili Değil

```typescript
// useProductPrice.ts:45-47
if (!regionId) {
  return null;
}
```

**Sonuç:**
- ProductCard: "Bölge Seçin" badge
- Buton disabled

---

### Durum 3: Varyasyon Verisi Yok

```typescript
// ProductDetail.tsx:76
if (!dbVariations || dbVariations.length === 0) {
  return product?.variants || [];
}
```

**Sonuç:** Varyasyon seçici gösterilmez, varsayılan birim kullanılır

---

## 7. Özet Tablo

| Girdi | Eksikse Ne Olur? | Fallback | Müşteri Görür |
|-------|------------------|----------|---------------|
| `priceResult` | RPC null döner | `product.price` | "Varsayılan Fiyat" badge |
| `priceMultiplier` | Metadata'da yok | `1` | Varyasyon fiyatı = basePrice |
| `stock_quantity` | Supplier'da yok | `0` (stokta yok) | "Tükendi" badge |
| `variation_type` | Tabloda yok | - | Varyasyon gösterilmez |
| `regionId` | Kullanıcı seçmedi | RPC çağrılmaz | "Bölge Seçin" uyarısı |

---

## 8. Öneriler

### Varyasyon Fiyatı Girilmezse

**Mevcut davranış:** `priceMultiplier = 1` kullanılır
**Sorun:** 2 kg varyasyonu seçildi ama fiyat 1 kg ile aynı

**Çözüm önerileri:**

1. **Admin validation:** Varyasyon kaydederken `priceMultiplier` zorunlu yap
2. **Frontend warning:** `priceMultiplier` eksikse varyasyon butonunda uyarı göster
3. **Varyasyon gizle:** Eksik verili varyasyonları UI'da gizle

### Varyasyon Stoğu Girilmezse

**Mevcut davranış:** `supplier_products.stock_quantity` kullanılır (tüm varyasyonlar aynı stok)

**Çözüm önerileri:**

1. **Metadata ekle:** `product_variations.metadata` alanına `stock_quantity` ekle
2. **UI kontrolü:** Varyasyon seçiminde stok kontrolü yap
3. **Variant tablo:** `product_variation_stocks` ayrı tablo oluştur

---

## 9. Kod Referansları

| Dosya | Satır | Açıklama |
|-------|-------|----------|
| `ProductCard.tsx` | 62-67 | Fiyat hesaplama formülü |
| `ProductCard.tsx` | 214-218 | Varsayılan fiyat badge |
| `ProductDetail.tsx` | 141-146 | Detay sayfası fiyat formülü |
| `ProductDetail.tsx` | 303-305 | Varyasyon indirim kontrolü |
| `useProductPrice.ts` | 52-58 | RPC çağrısı |
| `useProductPrice.ts` | 60-64 | Hata fallback |
| `useProductVariations.ts` | 14-28 | Varyasyon fetching |
