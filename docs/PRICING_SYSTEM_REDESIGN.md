# Pricing System Redesign - Complete Documentation

**Author:** Database Architect
**Date:** 2026-01-10
**Version:** 1.0

---

## Executive Summary

Complete redesign of the Haldeki Market pricing system from a complex 4-layer structure to a simplified, single-source-of-truth architecture with configurable B2B/B2C commission rates and regional multipliers.

### Problem Statement

The existing system had 4 pricing layers causing confusion:
1. `products.price` - Base product price
2. `products.base_price` - Supplier base price
3. `region_products.price` - Regional retail price
4. `region_products.business_price` - Regional B2B price
5. `supplier_products.price` - Supplier-specific price
6. `supplier_product_variations.price_adjustment` - Variant price modifier

### Solution

**Single Source of Truth:** `supplier_products.price` is the authoritative price

**Price Calculation:**
```
final_price = (supplier_price + variation_adjustment) / (1 - commission_rate) * regional_multiplier
```

**Key Features:**
- Configurable commission rates (B2B: 30%, B2C: 50% by default)
- Regional price multipliers (Istanbul: 1.00, Anadolu: 1.00+)
- Simple variation adjustments (additive)
- Price history tracking
- Fast, testable RPC functions

---

## Architecture

### New Tables

#### 1. `pricing_config`

Global pricing configuration table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `commission_b2b` | NUMERIC(5,4) | B2B commission rate (0.30 = 30%) |
| `commission_b2c` | NUMERIC(5,4) | B2C commission rate (0.50 = 50%) |
| `price_calculation_mode` | TEXT | 'markup' or 'margin' |
| `regional_pricing_mode` | TEXT | 'multiplier' or 'fixed' |
| `round_to_nearest` | NUMERIC | Rounding precision (default 0.01) |
| `is_active` | BOOLEAN | Only one active config at a time |

**Constraints:** Only one active row allowed

**Example:**
```sql
INSERT INTO pricing_config (commission_b2b, commission_b2c)
VALUES (0.30, 0.50);
```

#### 2. `price_history`

Historical price tracking for analytics and debugging.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `product_id` | UUID | Reference to products |
| `supplier_id` | UUID | Reference to suppliers |
| `region_id` | UUID | Reference to regions |
| `supplier_price` | NUMERIC(10,2) | Base supplier price |
| `b2b_price` | NUMERIC(10,2) | Calculated B2B price |
| `b2c_price` | NUMERIC(10,2) | Calculated B2C price |
| `regional_multiplier` | NUMERIC(5,4) | Regional multiplier used |
| `commission_rate_b2b` | NUMERIC(5,4) | Commission rate used |
| `commission_rate_b2c` | NUMERIC(5,4) | Commission rate used |
| `recorded_at` | TIMESTAMPTZ | Timestamp |

### Modified Tables

#### 3. `regions`

Added `price_multiplier` column.

| Column | Type | Description |
|--------|------|-------------|
| `price_multiplier` | NUMERIC(5,4) | Regional price multiplier (default 1.00) |

**Examples:**
- Istanbul: 1.00 (baseline)
- Anadolu: 1.10 (10% higher due to logistics)
- Diğer: 1.05 (5% higher)

### New Views

#### 4. `customer_prices`

Single source of truth for all customer-facing prices.

**Columns:**
- Product info: `product_id`, `product_name`, `category`, `unit`, `image_url`
- Supplier info: `supplier_id`, `supplier_name`, `supplier_price`, `is_featured`
- Regional info: `region_id`, `region_name`, `regional_multiplier`
- Calculated prices: `b2b_price`, `b2c_price`
- Metadata: `commission_b2b`, `commission_b2c`, `calculated_at`

**Usage:**
```sql
SELECT * FROM customer_prices
WHERE product_id = 'uuid' AND region_id = 'uuid';
```

### New Functions

#### 5. `calculate_product_price()`

Centralized price calculation RPC.

**Signature:**
```sql
calculate_product_price(
  p_product_id UUID,
  p_region_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_user_role TEXT DEFAULT 'b2c',
  p_variation_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  supplier_price NUMERIC(10,2),
  variation_adjustment NUMERIC(10,2),
  regional_multiplier NUMERIC(5,4),
  commission_rate NUMERIC(5,4),
  b2b_price NUMERIC(10,2),
  b2c_price NUMERIC(10,2),
  final_price NUMERIC(10,2),
  availability availability_status,
  stock_quantity INTEGER
)
```

**Parameters:**
- `p_product_id` (required): Product to calculate price for
- `p_region_id` (optional): Region for multiplier (NULL = no regional adjustment)
- `p_supplier_id` (optional): Specific supplier (NULL = auto-select cheapest)
- `p_user_role` (optional): 'b2b' or 'b2c' (default 'b2c')
- `p_variation_ids` (optional): Array of variation IDs for price adjustments

**Returns:** Complete price breakdown with metadata

**Example:**
```sql
SELECT * FROM calculate_product_price(
  'product-uuid',
  'region-uuid',
  NULL, -- cheapest supplier
  'b2c',
  ARRAY['variation-uuid-1', 'variation-uuid-2']
);
```

#### 6. `calculate_cart_prices()`

Bulk price calculation for cart items.

**Signature:**
```sql
calculate_cart_prices(
  p_items JSONB
)
RETURNS TABLE (
  item_index INTEGER,
  product_id UUID,
  quantity INTEGER,
  unit_price NUMERIC(10,2),
  total_price NUMERIC(10,2),
  b2b_price NUMERIC(10,2),
  b2c_price NUMERIC(10,2)
)
```

**Input Format:**
```json
[
  {
    "product_id": "uuid",
    "region_id": "uuid",
    "supplier_id": "uuid",
    "quantity": 2,
    "user_role": "b2c",
    "variation_ids": ["uuid1", "uuid2"]
  }
]
```

**Example:**
```sql
SELECT * FROM calculate_cart_prices(
  '[{"product_id": "uuid", "quantity": 2}]'::jsonb
);
```

---

## Price Calculation Logic

### Markup Mode (Default)

Formula: `price = supplier_price / (1 - commission_rate) * regional_multiplier`

**Example:**
- Supplier price: 100 TL
- B2C commission: 50%
- Regional multiplier: 1.10
- Calculation: `100 / (1 - 0.50) * 1.10 = 200 * 1.10 = 220 TL`

### Margin Mode (Alternative)

Formula: `price = supplier_price * (1 + commission_rate) * regional_multiplier`

**Example:**
- Supplier price: 100 TL
- B2C commission: 50%
- Regional multiplier: 1.10
- Calculation: `100 * (1 + 0.50) * 1.10 = 150 * 1.10 = 165 TL`

### Variation Adjustments

Variation prices are **additive** to the supplier base price.

Formula: `base_price = supplier_price + SUM(variation_adjustments)`

**Example:**
- Supplier price: 100 TL
- Variation 1 (+10 TL): Large size
- Variation 2 (+5 TL): Premium packaging
- Calculation: `(100 + 10 + 5) / (1 - 0.50) = 230 TL`

---

## Migration Files

### 1. Schema Migration
**File:** `20260110200000_pricing_redesign_schema.sql`

**Purpose:** Create new tables, views, functions, indexes

**Run Order:** First

**Breaking:** No (adds new structures only)

**Rollback:** 20260110290000_pricing_redesign_rollback.sql

### 2. Data Migration
**File:** `20260110210000_pricing_redesign_data_migration.sql`

**Purpose:** Migrate existing data to new structure

**Run Order:** Second (after schema)

**Breaking:** No (migrates data, preserves old columns)

**Actions:**
- Calculates regional multipliers from existing `region_products.price` ratios
- Populates `price_history` with current state
- Validates data integrity
- Compares old vs new pricing

### 3. Verification Script
**File:** `20260110220000_pricing_redesign_verification.sql`

**Purpose:** Comprehensive testing of new system

**Run Order:** Third (after data migration)

**Tests:**
1. Schema verification (tables, views, functions exist)
2. Configuration verification (active config, valid rates)
3. Regional multiplier verification (all regions have valid multipliers)
4. Price calculation function tests (B2B, B2C calculations)
5. Customer prices view tests (data integrity)
6. Price history tracking (records populated)
7. Variation adjustments (price differences)
8. Performance checks (query speed)
9. Data integrity summary (orphans, zero prices)

### 4. Rollback Script
**File:** `20260110290000_pricing_redesign_rollback.sql`

**Purpose:** Complete rollback if critical issues found

**Run Order:** Only if needed

**Actions:**
- Drops new tables and views
- Removes triggers and functions
- Removes `regions.price_multiplier` column
- Preserves all original data

---

## Frontend Integration Guide

### Old Way (Deprecated)

```typescript
// DON'T USE - Multiple sources of truth
const product = await supabase
  .from('products')
  .select('price, base_price')
  .single();

const regionPrice = await supabase
  .from('region_products')
  .select('price, business_price')
  .eq('region_id', regionId)
  .single();

// Which price to use? Confusing!
const price = regionPrice.price || product.price;
```

### New Way (Correct)

```typescript
// Single RPC call for all pricing
const { data, error } = await supabase.rpc('calculate_product_price', {
  p_product_id: productId,
  p_region_id: regionId,
  p_supplier_id: supplierId, // optional
  p_user_role: 'b2c',
  p_variation_ids: ['uuid1', 'uuid2'] // optional
});

// Returns complete price breakdown
console.log(data.final_price); // 220.50
console.log(data.supplier_price); // 100.00
console.log(data.commission_rate); // 0.50
console.log(data.regional_multiplier); // 1.10
```

### React Hook Example

```typescript
// hooks/useProductPrice.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PriceResult {
  final_price: number;
  b2b_price: number;
  b2c_price: number;
  supplier_price: number;
  supplier_name: string;
  availability: string;
  stock_quantity: number;
}

export function useProductPrice(
  productId: string,
  regionId?: string,
  userRole: 'b2b' | 'b2c' = 'b2c'
) {
  return useQuery({
    queryKey: ['product-price', productId, regionId, userRole],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: productId,
        p_region_id: regionId,
        p_user_role: userRole
      });

      if (error) throw error;
      return data as PriceResult;
    },
    enabled: !!productId
  });
}
```

### Component Usage

```typescript
// components/ProductCard.tsx
import { useProductPrice } from '@/hooks/useProductPrice';

export function ProductCard({ product, regionId, userRole }) {
  const { data: price, isLoading } = useProductPrice(
    product.id,
    regionId,
    userRole
  );

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <h3>{product.name}</h3>
      <p className="text-xl font-bold">
        {price.final_price.toLocaleString('tr-TR')} TL
      </p>
      {userRole === 'b2b' && (
        <p className="text-sm text-gray-500">
          İşletme Fiyatı: {price.b2b_price} TL
        </p>
      )}
      <p className="text-xs text-gray-400">
        Satıcı: {price.supplier_name}
      </p>
      <Badge variant={price.availability}>
        {price.stock_quantity > 0 ? 'Stokta' : 'Tükendi'}
      </Badge>
    </div>
  );
}
```

---

## Admin Panel Changes

### Commission Configuration UI

```typescript
// components/admin/PricingConfigPanel.tsx
export function PricingConfigPanel() {
  const [config, setConfig] = useState({
    commission_b2b: 0.30,
    commission_b2c: 0.50,
    price_calculation_mode: 'markup'
  });

  const handleSave = async () => {
    await supabase.from('pricing_config').upsert({
      ...config,
      is_active: true
    });
  };

  return (
    <form onSubmit={handleSave}>
      <FormField>
        <Label>B2B Komisyon Oranı (%)</Label>
        <Input
          type="number"
          min="0"
          max="100"
          step="1"
          value={config.commission_b2b * 100}
          onChange={(e) => setConfig({
            ...config,
            commission_b2b: Number(e.target.value) / 100
          })}
        />
      </FormField>

      <FormField>
        <Label>B2C Komisyon Oranı (%)</Label>
        <Input
          type="number"
          min="0"
          max="100"
          step="1"
          value={config.commission_b2c * 100}
          onChange={(e) => setConfig({
            ...config,
            commission_b2c: Number(e.target.value) / 100
          })}
        />
      </FormField>
    </form>
  );
}
```

### Regional Multiplier Configuration

```typescript
// components/admin/RegionalMultiplierPanel.tsx
export function RegionalMultiplierPanel() {
  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('regions')
        .select('id, name, price_multiplier');
      return data;
    }
  });

  const updateMultiplier = async (regionId, value) => {
    await supabase
      .from('regions')
      .update({ price_multiplier: value })
      .eq('id', regionId);
  };

  return (
    <Table>
      {regions?.map(region => (
        <TableRow key={region.id}>
          <TableCell>{region.name}</TableCell>
          <TableCell>
            <Input
              type="number"
              min="0.5"
              max="2"
              step="0.01"
              defaultValue={region.price_multiplier}
              onChange={(e) => updateMultiplier(
                region.id,
                Number(e.target.value)
              )}
            />
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/pricing/calculation.test.ts
describe('Price Calculation', () => {
  test('B2C price with 50% commission', async () => {
    const result = await supabase.rpc('calculate_product_price', {
      p_product_id: 'test-product',
      p_user_role: 'b2c'
    });

    expect(result.b2c_price).toBeGreaterThan(result.supplier_price);
    expect(result.commission_rate).toBe(0.50);
  });

  test('B2B price lower than B2C', async () => {
    const b2bResult = await supabase.rpc('calculate_product_price', {
      p_product_id: 'test-product',
      p_user_role: 'b2b'
    });

    const b2cResult = await supabase.rpc('calculate_product_price', {
      p_product_id: 'test-product',
      p_user_role: 'b2c'
    });

    expect(b2bResult.final_price).toBeLessThan(b2cResult.final_price);
  });

  test('Variation adjustments additive', async () => {
    const basePrice = await supabase.rpc('calculate_product_price', {
      p_product_id: 'test-product',
      p_variation_ids: null
    });

    const withVariations = await supabase.rpc('calculate_product_price', {
      p_product_id: 'test-product',
      p_variation_ids: ['var1', 'var2']
    });

    expect(withVariations.final_price).toBeGreaterThan(basePrice.final_price);
  });
});
```

### Integration Tests

```typescript
// __tests__/pricing/integration.test.ts
describe('Cart Price Calculation', () => {
  test('Bulk price calculation for cart', async () => {
    const cartItems = [
      { product_id: 'p1', quantity: 2 },
      { product_id: 'p2', quantity: 1 }
    ];

    const result = await supabase.rpc('calculate_cart_prices', {
      p_items: JSON.stringify(cartItems)
    });

    expect(result).toHaveLength(2);
    expect(result[0].total_price).toBe(result[0].unit_price * 2);
  });
});
```

---

## Performance Optimization

### Indexes Created

1. `idx_pricing_config_active` - Quick config lookup
2. `idx_regions_price_multiplier` - Regional pricing queries
3. `idx_supplier_products_price_ranking` - Cheapest supplier lookup
4. `idx_region_products_region_product` - Regional product lookup
5. `idx_product_variations_product_type` - Variation queries
6. `idx_supplier_product_variations_price_adj` - Variation adjustments
7. Price history indexes (product, supplier, region, timestamp)

### Query Performance Targets

- `calculate_product_price()`: < 100ms
- `calculate_cart_prices()`: < 200ms for 10 items
- `customer_prices` view: < 1000ms for 100 records

### Monitoring Queries

```sql
-- Monitor slow price calculations
SELECT * FROM pg_stat_statements
WHERE query LIKE '%calculate_product_price%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename IN ('pricing_config', 'price_history', 'supplier_products')
ORDER BY idx_scan DESC;
```

---

## Troubleshooting

### Issue: Prices seem too high

**Check:**
```sql
-- Verify commission rates
SELECT * FROM pricing_config WHERE is_active = true;

-- Check regional multipliers
SELECT name, price_multiplier FROM regions WHERE is_active = true;
```

**Fix:**
```sql
-- Adjust commission rates
UPDATE pricing_config
SET commission_b2c = 0.30
WHERE is_active = true;

-- Reset regional multipliers
UPDATE regions SET price_multiplier = 1.00;
```

### Issue: B2B price higher than B2C

**Check:**
```sql
-- Verify calculation mode
SELECT price_calculation_mode FROM pricing_config WHERE is_active = true;
```

**Expected:** B2B commission < B2C commission

### Issue: calculate_product_price returns no results

**Check:**
```sql
-- Verify product has active suppliers
SELECT COUNT(*) FROM supplier_products
WHERE product_id = 'your-uuid' AND is_active = true;

-- Verify supplier is active
SELECT s.name, s.is_active
FROM suppliers s
INNER JOIN supplier_products sp ON sp.supplier_id = s.id
WHERE sp.product_id = 'your-uuid';
```

---

## Rollback Procedure

If critical issues are found:

1. **Stop frontend from using new functions**
2. **Run rollback script:**
   ```bash
   psql -f supabase/migrations/20260110290000_pricing_redesign_rollback.sql
   ```
3. **Verify old pricing columns work:**
   ```sql
   SELECT price, base_price FROM products LIMIT 1;
   SELECT price, business_price FROM region_products LIMIT 1;
   ```
4. **Fix issues and re-migrate**

---

## Success Metrics

- [ ] All 25+ frontend files updated to use `calculate_product_price()`
- [ ] No performance degradation (>50ms increase)
- [ ] Price accuracy within 1% of old system
- [ ] All verification tests passing
- [ ] Production stable for 48 hours
- [ ] Price history populated correctly
- [ ] Commission rates configurable by admin

---

## Future Enhancements

1. **Dynamic Pricing:** Time-based, demand-based pricing
2. **Promotions:** Discount codes, bulk pricing tiers
3. **Currency Support:** Multi-currency pricing
4. **Price Alerts:** Notify customers of price changes
5. **Analytics:** Price elasticity, margin optimization

---

## Contact

**Author:** Database Architect
**Date:** 2026-01-10
**Version:** 1.0

For questions or issues, refer to the migration files or run the verification script.
