# Backend Update for New Pricing System

## Overview

Backend code updated to support the new simplified pricing system. The new system uses a single source of truth for pricing (supplier_products) and calculates final prices using an RPC function with configurable commission rates.

## Files Created

### 1. TypeScript Types (`src/types/pricing.ts`)

**Purpose:** Define all pricing-related types for the new system.

**Key Types:**
- `CommissionRates` - B2B (30%) and B2C (50%) commission configuration
- `CustomerType` - 'b2b' | 'b2c' customer type
- `PriceCalculationInput` - Input parameters for price calculation
- `PriceCalculationResult` - Complete price breakdown with:
  - Supplier base price
  - Regional multiplier
  - Variation adjustments
  - Commission amounts
  - Final calculated price
- `CartPriceCalculationResult` - Cart item price with quantity
- `RegionalMultiplier` - Regional price multiplier configuration
- `SupplierProductPrice` - Authoritative price source
- `VariationPriceAdjustment` - Variation-specific price changes

**Constants:**
- `DEFAULT_COMMISSION_RATES` - B2B: 0.30, B2C: 0.50

### 2. Pricing Utilities (`src/lib/pricing.ts`)

**Purpose:** Client-side pricing calculation utilities (fallback when RPC unavailable).

**Functions:**

#### Commission Helpers
- `getCommissionRate()` - Get commission rate for customer type
- `calculateCommission()` - Calculate commission amount
- `calculatePriceWithCommission()` - Add commission to base price

#### Regional Pricing Helpers
- `applyRegionalMultiplier()` - Apply regional multiplier to price
- `isValidRegionalMultiplier()` - Validate multiplier (0.5 - 2.0)
- `getDefaultRegionalMultiplier()` - Returns 1.0

#### Variation Price Helpers
- `applyVariationAdjustment()` - Add variation adjustment to price
- `sumVariationAdjustments()` - Sum multiple variation adjustments

#### Complete Price Calculation (Client-side)
- `calculateCustomerPriceClientSide()` - Full price calculation fallback
- `createPriceCalculationResultClientSide()` - Create complete result object

#### Cart Price Calculation
- `calculateCartItemPrice()` - Calculate cart item total
- `calculateCartTotal()` - Sum cart totals

#### Validation
- `validatePriceInput()` - Validate price calculation inputs
- `validatePriceResult()` - Validate price calculation results

#### Display Helpers
- `formatPrice()` - Format as Turkish Lira (TRY)
- `formatPriceChange()` - Format price change percentage
- `formatCommissionRate()` - Format commission rate as percentage

### 3. Supabase Queries (`src/lib/supabase/queries.ts`)

**Purpose:** Supabase database queries for the new pricing system.

**Functions:**

#### RPC Function Wrappers
- `calculateProductPrice()` - Primary price calculation using RPC
- `calculateCartPrices()` - Batch cart price calculation
- `getProductSuppliers()` - Get all suppliers for a product
- `getLowestProductPrice()` - Find lowest price supplier

#### Regional Multiplier Queries
- `getRegionalMultiplier()` - Get region's price multiplier
- `setRegionalMultiplier()` - Admin: Set regional multiplier

#### Commission Rate Queries
- `getCommissionRates()` - Get current B2B/B2C rates
- `setCommissionRates()` - Admin: Set commission rates

#### Supplier Product Queries
- `getSupplierProductPrice()` - Get supplier's base price (authoritative)
- `updateSupplierProductPrice()` - Supplier: Update base price

#### Variation Price Queries
- `getVariationPriceAdjustments()` - Get variation price adjustments
- `updateVariationPriceAdjustment()` - Update variation adjustment

### 4. Product Price Hooks (`src/hooks/useProductPrice.ts`)

**Purpose:** React hooks for product price queries.

**Hooks:**

#### `useProductPrice()`
Get calculated price for a single product using RPC.

**Parameters:**
- `productId` - Product ID
- `regionId` - Region ID
- `customerType` - 'b2b' or 'b2c'
- `variationId` - Optional variation ID
- `supplierId` - Optional supplier ID
- `enabled` - Enable/disable query

**Returns:** `PriceCalculationResult`

#### `useProductPrices()`
Batch fetch prices for multiple products.

**Parameters:**
- `productIds` - Array of product IDs
- `regionId` - Region ID
- `customerType` - 'b2b' or 'b2c'
- `enabled` - Enable/disable query

**Returns:** `Record<string, PriceCalculationResult>`

#### `useLowestPriceForCart()`
Find lowest price across all suppliers for cart operations.

**Parameters:**
- `productId` - Product ID
- `regionId` - Region ID
- `customerType` - 'b2b' or 'b2c'

**Returns:** Supplier info with lowest price

## Files Updated

### 1. Type Exports (`src/types/index.ts`)

Added exports for new pricing types:
```typescript
export type {
  CommissionRates,
  CustomerType,
  PriceCalculationInput,
  PriceCalculationResult,
  CartPriceCalculationResult,
  RegionalPricingConfig,
  RegionalMultiplier,
  SupplierProductPrice,
  VariationPriceAdjustment,
} from './pricing';

export { DEFAULT_COMMISSION_RATES } from './pricing';
```

### 2. Cart Context (`src/contexts/CartContext.tsx`)

**Changes:**
1. Added `PriceCalculationResult` import
2. Updated `addToCart()` interface to accept `priceResult` parameter
3. Updated `addToCart()` implementation to use new pricing system:
   - Uses `priceResult?.final_price` when available
   - Falls back to `regionPrice` (legacy)
   - Falls back to `product.price` (legacy)
   - Populates supplier info from `priceResult`

**Backward Compatibility:**
- Existing calls to `addToCart()` continue to work
- New pricing system is optional (progressive migration)

### 3. Lowest Price Hook (`src/hooks/useLowestPriceForCart.ts`)

**Changes:**
1. Added `PriceCalculationResult` import
2. Added `customerType` parameter (default: 'b2c')
3. Updated return type to include optional `priceResult`
4. Added `priceSource: 'product'` option

**Backward Compatibility:**
- Existing calls work without `customerType` parameter
- Returns same structure as before

## Usage Examples

### Example 1: Get Product Price with Hook

```typescript
import { useProductPrice } from '@/hooks/useProductPrice';

function ProductCard({ productId }) {
  const { data: price, isLoading } = useProductPrice({
    productId,
    regionId: selectedRegion?.id,
    customerType: isB2B ? 'b2b' : 'b2c',
  });

  if (isLoading) return <Skeleton />;
  if (!price) return null;

  return (
    <div>
      <p>Final Price: {price.final_price} TL</p>
      <p>Commission: {price.commission_amount} TL</p>
      <p>Supplier: {price.supplier_name}</p>
    </div>
  );
}
```

### Example 2: Add to Cart with New Pricing

```typescript
import { useCart } from '@/contexts/CartContext';
import { useProductPrice } from '@/hooks/useProductPrice';

function AddToCartButton({ product }) {
  const { addToCart } = useCart();
  const { data: priceResult } = useProductPrice({
    productId: product.id,
    regionId: selectedRegion?.id,
    customerType: 'b2c',
  });

  const handleAdd = () => {
    addToCart(
      product,
      1, // quantity
      undefined, // variant
      undefined, // regionPrice (legacy, not used)
      undefined, // supplierInfo (derived from priceResult)
      priceResult // NEW: Pass price calculation result
    );
  };

  return <button onClick={handleAdd}>Add to Cart</button>;
}
```

### Example 3: Direct Supabase Query

```typescript
import { calculateProductPrice } from '@/lib/supabase/queries';

async function getProductPrice() {
  const price = await calculateProductPrice({
    productId: 'prod-123',
    regionId: 'reg-456',
    customerType: 'b2b',
    variationId: 'var-789',
    supplierId: 'sup-000',
  });

  console.log('Final price:', price.final_price);
  console.log('Commission:', price.commission_amount);
  console.log('Breakdown:', {
    supplier_price: price.supplier_price,
    regional_multiplier: price.regional_multiplier,
    base_price: price.base_price,
    commission_rate: price.commission_rate,
  });
}
```

### Example 4: Client-side Fallback

```typescript
import { calculateCustomerPriceClientSide } from '@/lib/pricing';

// When RPC is unavailable, calculate client-side
const finalPrice = calculateCustomerPriceClientSide({
  supplierPrice: 100,
  regionalMultiplier: 1.1,
  variationAdjustments: [5, -2],
  customerType: 'b2b',
});

console.log('Client-side calculated price:', finalPrice); // 137.15
```

## Migration Notes

### Phase 1: Types Ready
- All new types are defined and exported
- Legacy types marked as `@deprecated`
- No breaking changes to existing types

### Phase 2: Utilities Ready
- Client-side utilities available as fallback
- Supabase query wrappers ready for RPC functions
- Hooks ready to use new pricing system

### Phase 3: Context Updated
- CartContext supports new pricing system
- Backward compatible with existing code
- Progressive migration path available

### Phase 4: Next Steps
1. Database architect creates RPC functions:
   - `calculate_product_price()`
   - `calculate_cart_prices()`
2. Update ProductCard components to use `useProductPrice`
3. Update Admin panel for commission rates
4. Update Supplier panel for price updates
5. Remove legacy pricing tables after migration

## Testing Recommendations

### Unit Tests
```typescript
// Test commission calculation
import { getCommissionRate, calculateCommission } from '@/lib/pricing';

test('B2B commission rate is 30%', () => {
  expect(getCommissionRate('b2b')).toBe(0.30);
});

test('B2C commission rate is 50%', () => {
  expect(getCommissionRate('b2c')).toBe(0.50);
});

test('Commission amount calculated correctly', () => {
  expect(calculateCommission(100, 'b2b')).toBe(30);
  expect(calculateCommission(100, 'b2c')).toBe(50);
});
```

### Integration Tests
```typescript
// Test price calculation with RPC
test('Product price calculated with B2B commission', async () => {
  const price = await calculateProductPrice({
    productId: 'test-product',
    regionId: 'test-region',
    customerType: 'b2b',
  });

  expect(price.final_price).toBeGreaterThan(price.supplier_price);
  expect(price.commission_rate).toBe(0.30);
});
```

## Rollback Plan

If issues occur:

1. **Database:** RPC functions not called, fall back to client-side
2. **Frontend:** All changes backward compatible
3. **Git:** Revert to commit f068c75 (checkpoint)

**Rollback Command:**
```bash
git checkout f068c75
```

## Success Criteria

- [x] TypeScript types defined and exported
- [x] Pricing utility functions created
- [x] Supabase query wrappers created
- [x] React hooks created
- [x] CartContext updated (backward compatible)
- [x] No TypeScript errors
- [x] No new lint errors (fixed existing)
- [ ] RPC functions created by DB architect
- [ ] ProductCard components updated
- [ ] Admin panel updated
- [ ] Supplier panel updated

## Next Tasks for Database Architect

1. Create `calculate_product_price()` RPC function
2. Create `calculate_cart_prices()` RPC function
3. Create `regional_multipliers` table
4. Create `system_settings` table for commission rates
5. Update RLS policies for new tables
6. Create migration scripts
7. Test RPC functions
8. Document RPC function signatures
