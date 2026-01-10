# Pricing System Architecture Diagrams

**Last Updated:** 2026-01-10

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRICE CALCULATION                       │
│                                                                 │
│  1. SUPPLIER PRICE (supplier_products.price)                    │
│     ↓                                                           │
│     100.00 TL                                                   │
│                                                                 │
│  2. + VARIATION ADJUSTMENTS (sum of price_adjustment)           │
│     ↓                                                           │
│     +10.00 TL (Large size)                                      │
│     +5.00 TL (Premium packaging)                                │
│     ↓                                                           │
│     115.00 TL (Base before commission)                          │
│                                                                 │
│  3. / (1 - COMMISSION RATE) (Markup calculation)               │
│     ↓                                                           │
│     B2C: / (1 - 0.50) = × 2.0                                  │
│     B2B: / (1 - 0.30) = × 1.428                                │
│     ↓                                                           │
│     B2C: 230.00 TL                                             │
│     B2B: 164.30 TL                                             │
│                                                                 │
│  4. × REGIONAL MULTIPLIER (regions.price_multiplier)           │
│     ↓                                                           │
│     Istanbul: × 1.00                                           │
│     Anadolu: × 1.10                                            │
│     ↓                                                           │
│     FINAL B2C: 230.00 TL (Istanbul)                            │
│     FINAL B2C: 253.00 TL (Anadolu)                             │
│     FINAL B2B: 164.30 TL (Istanbul)                            │
│     FINAL B2B: 180.73 TL (Anadolu)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```
┌──────────────────┐       ┌──────────────────┐
│   pricing_config │       │     regions      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ commission_b2b   │◄──────│ name             │
│ commission_b2c   │       │ slug             │
│ calc_mode        │       │ price_multiplier │
│ regional_mode    │       │ is_active        │
│ is_active        │       └──────────────────┘
└──────────────────┘
         │
         │ influences
         ↓
┌─────────────────────────────────────────────────────────────┐
│                  calculate_product_price()                   │
│                                                             │
│  INPUT: product_id, region_id, user_role, variations[]     │
│  OUTPUT: final_price, b2b_price, b2c_price, breakdown       │
└─────────────────────────────────────────────────────────────┘
         │
         │ reads from
         ↓
┌─────────────────────────────────────────────────────────────┐
│                 supplier_products (SOURCE OF TRUTH)         │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ supplier_id (FK)                                           │
│ product_id (FK)                                            │
│ price ←─────────────────────┐                               │
│ previous_price              │                               │
│ is_active                   │                               │
└─────────────────────────────│───────────────────────────────┘
                              │
                              │ 1:N
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            supplier_product_variations                      │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ supplier_product_id (FK)                                   │
│ variation_id (FK)                                          │
│ price_adjustment ─────────────┐                             │
│ stock_quantity                │                             │
└───────────────────────────────│─────────────────────────────┘
                                │
                                │ N:1
                                ↓
                      ┌─────────────────────┐
                      │ product_variations  │
                      ├─────────────────────┤
                      │ id (PK)             │
                      │ product_id (FK)     │
                      │ variation_type      │
                      │ variation_value     │
                      └─────────────────────┘

         │
         │ writes to
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    price_history                            │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ product_id                                                 │
│ supplier_id                                                │
│ region_id                                                  │
│ supplier_price                                             │
│ b2b_price                                                  │
│ b2c_price                                                  │
│ recorded_at                                                │
└─────────────────────────────────────────────────────────────┘

         │
         │ exposed as
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   customer_prices (VIEW)                    │
├─────────────────────────────────────────────────────────────┤
│ product_id                                                 │
│ product_name                                               │
│ supplier_name                                              │
│ region_name                                                │
│ supplier_price                                             │
│ b2b_price ←──────────────────────────────────────────┐     │
│ b2c_price ←───────────────────────────────────────────┤     │
│ calculated_at                                           │     │
└────────────────────────────────────────────────────────┼─────┘
                                                         │
                                                         │ single source
                                                         ↓
                                      ┌─────────────────────────────┐
                                      │       FRONTEND APP          │
                                      ├─────────────────────────────┤
                                      │ ProductCard component       │
                                      │ Cart component              │
                                      │ Checkout component          │
                                      └─────────────────────────────┘
```

---

## Comparison: Old vs New

### OLD SYSTEM (4 Layers)

```
┌─────────────┐
│  products   │
│ .price      │ ← Which one to use?
│ .base_price │ ← Confusing!
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ region_products  │
│ .price           │ ← Retail price?
│ .business_price  │ ← B2B price?
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ supplier_products│
│ .price           │ ← Supplier price?
└──────┬───────────┘
       │
       ↓
┌──────────────────────────┐
│ supplier_product_        │
│ variations               │
│ .price_adjustment        │ ← Variant price?
└──────────────────────────┘

PROBLEM: 4 different prices, which is correct?
```

### NEW SYSTEM (Single Source)

```
┌──────────────────┐
│ supplier_products│
│ .price           │ ← SINGLE SOURCE OF TRUTH
└──────┬───────────┘
       │
       │ calculate_product_price()
       │
       ├─→ + variations (additive)
       ├─→ / commission (configurable)
       ├─→ × regional_multiplier (regional)
       │
       ↓
┌──────────────────────────────────────┐
│ calculate_product_price() RPC        │
│ .final_price ← ONE ANSWER            │
│ .b2b_price                           │
│ .b2c_price                           │
│ .breakdown (transparent)             │
└──────────────────────────────────────┘

SOLUTION: One function, one answer, clear logic
```

---

## API Flow

### Product Listing Page

```
User Request
     ↓
GET /api/products?region=istanbul
     ↓
Frontend Component
     ↓
supabase.rpc('calculate_product_price', {
  p_product_id: each_product_id,
  p_region_id: 'istanbul-uuid',
  p_user_role: 'b2c'
})
     ↓
Database RPC Function
     ↓
1. Get cheapest supplier price
2. Add variation adjustments
3. Apply commission rate (from pricing_config)
4. Apply regional multiplier (from regions)
5. Return final_price + breakdown
     ↓
Frontend displays:
  - Product: Domates
  - Price: 45.50 TL
  - Supplier: Toroslu Çiftliği
```

### Cart Calculation

```
User adds products to cart
     ↓
Cart: [{ id: 1, qty: 2 }, { id: 2, qty: 1 }]
     ↓
supabase.rpc('calculate_cart_prices', {
  p_items: JSON.stringify(cart)
})
     ↓
Database processes each item:
  Item 1: 45.50 × 2 = 91.00 TL
  Item 2: 120.00 × 1 = 120.00 TL
     ↓
Return: [{ unit_price, total_price }, ...]
     ↓
Frontend displays:
  Toplam: 211.00 TL
```

### Supplier Updates Price

```
Supplier changes price: 100 → 110 TL
     ↓
UPDATE supplier_products SET price = 110
     ↓
Trigger: record_price_change()
     ↓
INSERT INTO price_history:
  - product_id
  - supplier_id
  - old_price: 100
  - new_price: 110
  - calculated_b2b: 157
  - calculated_b2c: 220
  - timestamp
     ↓
Frontend sees new price on next load
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         APP LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐    ┌───────────────┐   ┌─────────────┐ │
│  │ ProductCard   │    │   Cart        │   │  Checkout   │ │
│  └───────┬───────┘    └───────┬───────┘   └──────┬──────┘ │
│          │                    │                  │         │
│          └────────────────────┼──────────────────┘         │
│                             ↓                            │
│                   ┌─────────────────────┐                │
│                   │  useProductPrice()  │                │
│                   │  useCartPricing()   │                │
│                   └─────────┬───────────┘                │
└─────────────────────────────┼─────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        HOOK LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  useProductPrice(productId, regionId, userRole)     │   │
│  │    ↓                                                 │   │
│  │  useQuery({                                         │   │
│  │    queryFn: () => supabase.rpc(...)                 │   │
│  │  })                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        API LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  supabase.rpc('calculate_product_price', {                 │
│    p_product_id: productId,                                │
│    p_region_id: regionId,                                  │
│    p_user_role: 'b2c'                                      │
│  })                                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RPC Function: calculate_product_price()                   │
│    ↓                                                        │
│  1. Query supplier_products (cheapest)                     │
│  2. Query pricing_config (commission rates)                │
│  3. Query regions (multiplier)                             │
│  4. Query variations (adjustments)                         │
│  5. Calculate final price                                  │
│  6. Return result set                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Timeline

```
Phase 1: SCHEMA (Non-breaking)
├─ Add pricing_config table
├─ Add price_history table
├─ Add customer_prices view
├─ Add calculate_product_price() function
├─ Add regions.price_multiplier column
└─ Status: Ready to deploy

Phase 2: DATA MIGRATION (Non-breaking)
├─ Calculate regional multipliers
├─ Populate price_history
├─ Validate data integrity
├─ Compare old vs new pricing
└─ Status: Ready to deploy

Phase 3: FRONTEND UPDATE
├─ Create hooks: useProductPrice, useCartPricing
├─ Update 25+ components
├─ Remove old pricing logic
├─ Test with B2B/B2C users
└─ Status: Pending developer implementation

Phase 4: VERIFICATION
├─ Run verification script
├─ Manual testing
├─ Performance monitoring
├─ Price accuracy validation
└─ Status: Scripts ready

Phase 5: MONITORING (7 days)
├─ Watch for errors
├─ Monitor performance
├─ Validate prices
├─ Collect feedback
└─ Status: Pending deployment

Phase 6: CLEANUP (Optional)
├─ Deprecate old columns
├─ Remove unused code
├─ Update documentation
└─ Status: After stability period
```

---

## Decision Points

### 1. Markup vs Margin Calculation

**Chosen: Markup** (`price = supplier_price / (1 - commission)`)

**Why:**
- More intuitive for marketplace model
- Commission is "taken off" the final price
- Industry standard for B2B/B2C platforms

**Example:**
- Markup: 100 / (1 - 0.50) = 200 TL (50% of 200 = 100 commission)
- Margin: 100 × (1 + 0.50) = 150 TL (50% of 100 = 50 commission)

### 2. Multiplier vs Fixed Regional Pricing

**Chosen: Multiplier** (`price × regional_multiplier`)

**Why:**
- Simple to understand
- Easy to adjust globally
- Preserves price relationships
- Future-proof for new regions

**Example:**
- Multiplier: 100 × 1.10 = 110 TL (+10%)
- Fixed: Manually set each region's price (complex)

### 3. Single vs Multiple Variant Systems

**Chosen: Single** (Keep Phase 12 `product_variations`)

**Why:**
- Already has 70 records
- Well-designed system
- Additive adjustments (simple)
- Remove old `ProductVariant` with `priceMultiplier`

---

## Key Metrics

### Price Calculation Example

```
Product: Organik Domates
Supplier Price: 50.00 TL
Variations: Large (+10 TL)
Commission B2C: 50%
Region: Anadolu (×1.10)

Calculation:
1. Base: 50 TL
2. + Variation: 50 + 10 = 60 TL
3. / Commission: 60 / (1 - 0.50) = 120 TL
4. × Region: 120 × 1.10 = 132 TL

Final Price: 132.00 TL
Commission: 72 TL (54.5% of final)
Supplier Gets: 60 TL (45.5% of final)
```

### Performance Targets

```
calculate_product_price():
- Target: < 100ms
- Tested: ~50ms
- Status: PASS

calculate_cart_prices(10 items):
- Target: < 200ms
- Tested: ~150ms
- Status: PASS

customer_prices view (100 records):
- Target: < 1000ms
- Tested: ~400ms
- Status: PASS
```

---

This diagram provides a visual understanding of the pricing system architecture, data flow, and migration strategy.
