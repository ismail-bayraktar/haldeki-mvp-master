# Variation Pricing - Visual Decision Tree

```
──────────────────────────────────────────────────────────────────────────────────────
                        CUSTOMER SEES PRODUCT
──────────────────────────────────────────────────────────────────────────────────────

  1. REGION SELECTION
  │
  ├─ NO REGION SELECTED
  │  └─ Customer sees: "Bölge Seçin" badge
  │  └─ Add to Cart: DISABLED
  │  └─ Price: NOT SHOWN
  │
  └─ REGION SELECTED ✓
     │
     ▼
  2. RPC CALL: calculate_product_price()
  │
  ├─ RPC FAILS / RETURNS NULL
  │  └─ Customer sees: "Varsayılan Fiyat" badge (orange)
  │  └─ Price: product.price (fallback)
  │  └─ WARNING: "Bu ürün için varsayılan fiyat kullanılıyor"
  │
  └─ RPC SUCCESS ✓
        │
        │  priceResult = {
        │    final_price: 50,
        │    stock_quantity: 20,
        │    availability: "plenty"
        │  }
        │
        ▼
  3. VARIANT SELECTION
  │
  ├─ NO VARIANTS
  │  └─ Customer sees: basePrice × 1 = 50 ₺ / kg
  │
  └─ VARIANTS EXIST
     │
     ├─ VARIANT SELECTED
     │  │
     │  ├─ priceMultiplier EXISTS (e.g., 2.0)
     │  │  └─ Customer sees: 50 × 2.0 = 100 ₺ / 2 kg
     │  │
     │  └─ priceMultiplier MISSING (undefined)
     │     └─ Customer sees: 50 × 1 = 50 ₺ / 2 kg  ⚠️ CONFUSING!
     │
     └─ NO VARIANT SELECTED
        └─ Customer sees: basePrice × 1 = 50 ₺ / kg

──────────────────────────────────────────────────────────────────────────────────────
                            STOCK STATUS
──────────────────────────────────────────────────────────────────────────────────────

  priceResult.stock_quantity === 0
  │
  └─ Customer sees: "Tükendi" badge (red)
  └─ Add to Cart: REPLACED with "Haber Ver" button

  priceResult.stock_quantity > 0 && priceResult.stock_quantity <= 20
  │
  └─ Customer sees: "Son Ürünler" + "15 adet" label

  priceResult.stock_quantity > 20
  │
  └─ Customer sees: "Bol Stok" badge (green)

──────────────────────────────────────────────────────────────────────────────────────
                            PRICING EDGE CASES
──────────────────────────────────────────────────────────────────────────────────────

  CASE 1: Region pricing exists, variant has no priceMultiplier
  ────────────────────────────────────────────────────────────
  Input:
    - priceResult.final_price = 50 ₺
    - variant.label = "2 kg"
    - variant.priceMultiplier = undefined

  Output:
    - displayPrice = 50 × 1 = 50 ₺
    - UI shows: "50 ₺ / 2 kg"  ⚠️ CONFUSING CUSTOMER!

  CASE 2: Region pricing missing, variant has priceMultiplier
  ────────────────────────────────────────────────────────────
  Input:
    - priceResult = null
    - product.price = 45 ₺ (fallback)
    - variant.priceMultiplier = 2.0

  Output:
    - displayPrice = 45 × 2.0 = 90 ₺
    - UI shows: "90 ₺ / 2 kg" + "Varsayılan Fiyat" badge

  CASE 3: Variant has discount priceMultiplier
  ────────────────────────────────────────────────────────────
  Input:
    - priceResult.final_price = 50 ₺
    - variant.quantity = 2
    - variant.priceMultiplier = 1.8 (discount)

  Calculation:
    - expectedPrice = 50 × 2 = 100 ₺
    - variantPrice = 50 × 1.8 = 90 ₺
    - savings = ((100 - 90) / 100) × 100 = 10%

  Output:
    - UI shows: "90 ₺ / 2 kg" + "Avantajlı" badge + "%10 tasarruf"

──────────────────────────────────────────────────────────────────────────────────────
                            WHAT CUSTOMER SEES
──────────────────────────────────────────────────────────────────────────────────────

┌────────────────────────────────────────────────────────────────────────────────────┐
│  ProductCard UI                                                                    │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │  [Image]                                                                      │  │
│  │                                                                                │  │
│  │  [Bugün Geldi] [Premium] [Bölgede yok⚠] [Tükendi❌]                            │  │
│  │                                                                                │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
│  Menemen, Türkiye                                                                  │
│  Domates                                                                           │
│                                                                                    │
│  [Bol Stok]                                                                       │
│                                                                                    │
│  Variant Selection:                                                                │
│  ┌───────┐ ┌───────┐ ┌───────┐                                                   │
│  │ 1 kg  │ │ 2 kg  │ │ 3 kg  │                                                   │
│  │ 50₺   │ │ 90₺   │ │ 130₺  │                                                   │
│  └───────┘ └───────┘ └───────┘                                                   │
│                                                                                    │
│  ──────────────────────────────────────────────                                    │
│  90 ₺ / 2 kg                                [+]                                   │
│  100 ₺ (previous price)                                                       │
│                                                                                    │
│  [+] Add to Cart  [♥] [⚖]                                                        │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘

──────────────────────────────────────────────────────────────────────────────────────
                            ADMIN IMPLICATIONS
──────────────────────────────────────────────────────────────────────────────────────

  When creating a variation in admin panel:

  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │  Add Variation                                                                   │
  ├──────────────────────────────────────────────────────────────────────────────────┤
  │                                                                                    │
  │  Variation Type:     [size ▼]                                                     │
  │  Variation Value:    [2 kg        ]                                               │
  │                                                                                    │
  │  ┌────────────────────────────────────────────────────────────────────────────┐   │
  │  │ Pricing (REQUIRED!)                                                        │   │
  │  ├────────────────────────────────────────────────────────────────────────────┤   │
  │  │ Quantity:           [2        ]                                             │   │
  │  │ Unit:               [kg       ]                                             │   │
  │  │ Price Multiplier:   [1.8      ]  ⚠️ Required for correct pricing!          │   │
  │  └────────────────────────────────────────────────────────────────────────────┘   │
  │                                                                                    │
  │  If Price Multiplier is missing:                                                  │
  │  ⚠️ Customers will see base price for this variant (confusing!)                   │
  │                                                                                    │
  │  [Save Variation]                                                                 │
  │                                                                                    │
  └──────────────────────────────────────────────────────────────────────────────────┘

──────────────────────────────────────────────────────────────────────────────────────
                            RECOMMENDATIONS
──────────────────────────────────────────────────────────────────────────────────────

  1. DATABASE VALIDATION
     ────────────────────
     Add CHECK constraint to product_variations.metadata:
     ```sql
     ALTER TABLE product_variations
     ADD CONSTRAINT price_multiplier_required
     CHECK (metadata->>'priceMultiplier' IS NOT NULL);
     ```

  2. ADMIN UI VALIDATION
     ───────────────────
     - Make priceMultiplier required field
     - Show warning if priceMultiplier < quantity (no discount)
     - Calculate expected vs actual price preview

  3. FRONTEND FALLBACK IMPROVEMENT
     ───────────────────────────
     ```typescript
     // Instead of defaulting to 1, show warning:
     if (!selectedVariant?.priceMultiplier) {
       toast.warning("Bu varyasyon için fiyat bilgisi eksik");
     }
     ```

  4. VARIANT STOCK TRACKING
     ───────────────────────
     Option A: Add stock to metadata
     ```json
     {
       "quantity": 2,
       "unit": "kg",
       "priceMultiplier": 1.8,
       "stock_quantity": 15  // ← NEW
     }
     ```

     Option B: Create separate table
     ```sql
     CREATE TABLE product_variation_stocks (
       id UUID PRIMARY KEY,
       variation_id UUID REFERENCES product_variations(id),
       supplier_id UUID REFERENCES suppliers(id),
       stock_quantity INTEGER NOT NULL DEFAULT 0,
       updated_at TIMESTAMP
     );
     ```
