# Stream 5.1: CartContext Migration Plan

## Executive Summary

**Migration Complexity**: 🔴 **HIGH** - Critical revenue-blocking issue requiring database schema changes, multi-layer code updates, and data migration.

**Business Impact**: 🔴 **CRITICAL** - Users cannot add products to cart. Order flow completely broken. Direct revenue loss.

**Root Cause**: Phase 12 database migration changed pricing architecture from single `products.price` to multi-supplier `supplier_products.price(price)` junction table, but CartContext was not updated.

**Estimated Effort**: 3-4 days
- Day 1: Database analysis + RPC function creation
- Day 2: CartContext migration + useLowestPriceForCart hook
- Day 3: Frontend component updates (ProductCard, ProductDetail)
- Day 4: Testing, edge cases, stock validation

---

## Current State Analysis

### CartContext.tsx Architecture

**Current Data Flow:**
```
ProductCard (onClick)
  ↓
addToCart(product, quantity, variant, regionPrice, supplierInfo?)
  ↓
CartContext stores: {
  unitPriceAtAdd: number,  // ← Uses regionPrice or product.price
  supplierId: string | null,  // ← Present but NULL
  supplierProductId: string | null,  // ← Present but NULL
  supplierName: string,  // ← Empty string
  priceSource: 'region' | 'supplier' | 'product'  // ← Always 'product'
}
```

**CRITICAL ISSUE - Line 175 in CartContext.tsx:**
```typescript
// ❌ BROKEN: Falls back to old schema
const unitPrice = regionPrice ?? product.price;

// ❌ PROBLEM: product.price is MASTER catalog price, NOT supplier price
// In Phase 12, products.price is deprecated for transactions
// Actual price lives in: supplier_products.price
```

**Current Add to Cart Flow (ProductCard.tsx:105-109):**
```typescript
// ProductCard passes regionPrice (from region_products table)
const unitPrice = (isBusiness && regionInfo?.businessPrice)
  ? regionInfo.businessPrice
  : (regionInfo?.price ?? product.price);

addToCart(product, 1, selectedVariant, unitPrice);
// ❌ Missing: supplierInfo parameter!
```

### Phase 12 Database Architecture

**New Price Hierarchy:**
```
1. supplier_products.price (Supplier's offer price)
   ↓ (if no supplier)
2. region_products.price (Regional price)
   ↓ (if no region)
3. products.price (Master catalog fallback - DEPRECATED for transactions)
```

**Supplier Products Junction Table:**
```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  price NUMERIC(10,2) NOT NULL,  -- ← THIS is the transaction price
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  availability availability_status DEFAULT 'plenty',
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- ... other fields
);
```

**Key Insight:** One `product_id` can have MULTIPLE `supplier_products` records (one per supplier). Cart must:
1. Find all active suppliers for this product
2. Select lowest price
3. Store which supplier was chosen
4. Validate stock from that supplier

### Price Lookup Logic

**Current Implementation (useLowestPriceForCart.ts):**
```typescript
// ✅ This hook EXISTS and looks correct!
export function useLowestPriceForCart(productId: string, regionId: string | null) {
  // Fetches supplier_products via RPC
  const { data: supplierProducts } = useQuery({
    queryKey: ['product-suppliers', productId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_product_suppliers', {
        p_product_id: productId,
      });
      return data;
    },
  });

  // Compares with region_products
  const { data: regionPrice } = useQuery({
    queryKey: ['region-product-price', productId, regionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('region_products')
        .select('*')
        .eq('product_id', productId)
        .eq('region_id', regionId)
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
  });

  // Returns lowest price with supplier info
  const priceInfo: CartPriceInfo | null = {
    supplierId: string,
    supplierProductId: string,
    supplierName: string,
    priceSource: 'supplier' | 'region',
    price: number,
  };

  return { data: priceInfo, isLoading: ... };
}
```

**Problem:** This hook exists but is **NOT USED** in ProductCard or ProductDetail!

### Multi-Supplier Cart Support

**Current CartItem Type (types/index.ts:102-115):**
```typescript
export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
  selectedVariant?: ProductVariant;
  unitPriceAtAdd: number;
  regionIdAtAdd: string;
  // Phase 12 fields (present but unused)
  supplierId: string | null;  // ← Always NULL
  supplierProductId: string | null;  // ← Always NULL
  supplierName: string;  // ← Empty string
  priceSource: PriceSource;  // ← Always 'product'
}
```

**Gap Analysis:**
- ✅ Type definition supports multi-supplier
- ❌ ProductCard doesn't call useLowestPriceForCart hook
- ❌ addToCart receives undefined supplierInfo
- ❌ CartContext sets default empty supplierInfo (line 176-181)
- ❌ No validation that chosen supplier has stock
- ❌ No checkout flow to select specific supplier

**Missing Features:**
1. **Supplier Selection UI**: User sees "3 suppliers offer this product" but can't choose
2. **Stock Validation**: Cart doesn't check if selected supplier has enough stock
3. **Price Updates**: If supplier changes price, cart shows stale price (unitPriceAtAdd)
4. **Supplier Fallback**: If supplier becomes inactive, cart item breaks

---

## Migration Strategy

### Phase 1: Database Infrastructure (Day 1)

**Goal:** Ensure reliable price lookup with proper error handling.

**Task 1.1: Create/Verify RPC Function**
```sql
-- File: supabase/migrations/20260108_cart_price_lookup.sql

-- RPC function to get best price for cart
CREATE OR REPLACE FUNCTION get_cart_price_info(
  p_product_id UUID,
  p_region_id UUID
)
RETURNS TABLE (
  supplier_id UUID,
  supplier_product_id UUID,
  supplier_name TEXT,
  price_source TEXT,
  price NUMERIC,
  stock_quantity INTEGER,
  availability availability_status
) AS $$
BEGIN
  -- Try supplier products first (lowest price)
  RETURN QUERY
  WITH supplier_prices AS (
    SELECT
      sp.id AS supplier_product_id,
      sp.supplier_id,
      s.name AS supplier_name,
      sp.price,
      sp.stock_quantity,
      sp.availability,
      'supplier'::TEXT AS price_source
    FROM supplier_products sp
    INNER JOIN suppliers s ON s.id = sp.supplier_id
    WHERE sp.product_id = p_product_id
      AND sp.is_active = true
      AND s.approved = true
      AND sp.stock_quantity > 0
    ORDER BY sp.price ASC
    LIMIT 1
  ),
  region_prices AS (
    SELECT
      NULL::UUID AS supplier_product_id,
      NULL::UUID AS supplier_id,
      ''::TEXT AS supplier_name,
      rp.price,
      rp.stock_quantity,
      rp.availability,
      'region'::TEXT AS price_source
    FROM region_products rp
    WHERE rp.product_id = p_product_id
      AND rp.region_id = p_region_id
      AND rp.is_active = true
      AND rp.stock_quantity > 0
    LIMIT 1
  )
  SELECT
    COALESCE(sp.supplier_id, rp.supplier_id),
    COALESCE(sp.supplier_product_id, rp.supplier_product_id),
    COALESCE(sp.supplier_name, rp.supplier_name),
    COALESCE(sp.price_source, rp.price_source),
    COALESCE(sp.price, rp.price),
    COALESCE(sp.stock_quantity, rp.stock_quantity),
    COALESCE(sp.availability, rp.availability)
  FROM supplier_prices sp
  FULL OUTER JOIN region_prices rp ON true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_cart_price_info TO authenticated;
```

**Task 1.2: Add Indexes for Performance**
```sql
-- Index for cart lookups
CREATE INDEX IF NOT EXISTS idx_supplier_products_cart_lookup
ON supplier_products(product_id, is_active, price ASC)
WHERE is_active = true AND stock_quantity > 0;

CREATE INDEX IF NOT EXISTS idx_region_products_cart_lookup
ON region_products(product_id, region_id, is_active)
WHERE is_active = true AND stock_quantity > 0;
```

**Task 1.3: Create Stock Validation Function**
```sql
-- Validate cart item stock at checkout time
CREATE OR REPLACE FUNCTION validate_cart_stock(
  p_supplier_product_id UUID,
  p_quantity INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_stock INTEGER;
  v_available BOOLEAN;
BEGIN
  SELECT stock_quantity INTO v_stock
  FROM supplier_products
  WHERE id = p_supplier_product_id;

  v_available := (v_stock >= p_quantity);

  RETURN json_build_object(
    'available', v_available,
    'requested', p_quantity,
    'available_stock', v_stock
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Phase 2: CartContext Logic Migration (Day 2-3)

**Task 2.1: Update useLowestPriceForCart Hook**

```typescript
// File: src/hooks/useLowestPriceForCart.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CartPriceInfo {
  supplierId: string | null;
  supplierProductId: string | null;
  supplierName: string;
  priceSource: 'supplier' | 'region' | 'product';
  price: number;
  stockQuantity: number;
  availability: 'plenty' | 'limited' | 'last';
}

export function useLowestPriceForCart(productId: string, regionId: string | null) {
  // Single RPC call for efficiency
  const { data, isLoading, error } = useQuery({
    queryKey: ['cart-price-info', productId, regionId],
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase.rpc('get_cart_price_info', {
        p_product_id: productId,
        p_region_id: regionId,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        // Fallback to master product price (shouldn't happen in production)
        const { data: product } = await supabase
          .from('products')
          .select('price')
          .eq('id', productId)
          .single();

        return {
          supplier_id: null,
          supplier_product_id: null,
          supplier_name: '',
          price_source: 'product',
          price: product?.price || 0,
          stock_quantity: 999,
          availability: 'plenty',
        };
      }

      return data[0];
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 min
  });

  const priceInfo: CartPriceInfo | null = data ? {
    supplierId: data.supplier_id,
    supplierProductId: data.supplier_product_id,
    supplierName: data.supplier_name || '',
    priceSource: data.price_source,
    price: Number(data.price),
    stockQuantity: data.stock_quantity,
    availability: data.availability,
  } : null;

  return {
    data: priceInfo,
    isLoading,
    error,
  };
}
```

**Task 2.2: Update CartContext.addToCart**

```typescript
// File: src/contexts/CartContext.tsx

// addToCart signature (already correct, just ensure implementation)
addToCart: (
  product: Product,
  quantity?: number,
  variant?: ProductVariant,
  regionPrice?: number,  // DEPRECATED: Remove in Phase 13
  supplierInfo?: {  // ← NEW PARAMETER (already in type definition)
    supplierId: string | null;
    supplierProductId: string | null;
    supplierName: string;
    priceSource: PriceSource;
  }
) => void;

// Implementation update (line 153-215)
const addToCart = (
  product: Product,
  quantity = 1,
  variant?: ProductVariant,
  regionPrice?: number,  // Keep for backward compatibility
  supplierInfo?: {
    supplierId: string | null;
    supplierProductId: string | null;
    supplierName: string;
    priceSource: PriceSource;
  }
) => {
  if (!isAuthenticated) {
    openAuthDrawer();
    return;
  }

  if (!selectedRegion) {
    openRegionModal();
    return;
  }

  // Phase 12: Use supplierInfo if provided, otherwise fallback
  const unitPrice = supplierInfo
    ? (regionPrice ?? product.price)  // supplierInfo has the real source
    : (regionPrice ?? product.price);  // Legacy fallback

  const defaultSupplierInfo = {
    supplierId: supplierInfo?.supplierId ?? null,
    supplierProductId: supplierInfo?.supplierProductId ?? null,
    supplierName: supplierInfo?.supplierName ?? '',
    priceSource: supplierInfo?.priceSource ?? 'product',
  };

  setItems((prev) => {
    const itemKey = getCartItemKey(product.id, variant?.id);
    const existingItem = prev.find(
      (item) => getCartItemKey(item.productId, item.selectedVariant?.id) === itemKey
    );

    const variantLabel = variant ? ` (${variant.label})` : "";

    if (existingItem) {
      // Validate stock if supplier product
      if (existingItem.supplierProductId) {
        // TODO: Add stock validation hook
        // For now, allow but show warning
        toast.success(`${product.name}${variantLabel} sepetinizde güncellendi`);
      } else {
        toast.success(`${product.name}${variantLabel} sepetinizde güncellendi`);
      }

      return prev.map((item) =>
        getCartItemKey(item.productId, item.selectedVariant?.id) === itemKey
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    }

    toast.success(`${product.name}${variantLabel} sepete eklendi`);
    return [
      ...prev,
      {
        productId: product.id,
        quantity,
        product,
        selectedVariant: variant,
        unitPriceAtAdd: unitPrice,
        regionIdAtAdd: selectedRegion.id,
        ...defaultSupplierInfo,
      },
    ];
  });
};
```

**Task 2.3: Add Stock Validation to CartContext**

```typescript
// New function in CartContext
const validateCartItemStock = useCallback(
  async (item: CartItem): Promise<{ valid: boolean; availableStock?: number }> => {
    if (!item.supplierProductId) {
      // No supplier = region or master price, assume valid
      return { valid: true };
    }

    const { data } = await supabase.rpc('validate_cart_stock', {
      p_supplier_product_id: item.supplierProductId,
      p_quantity: item.quantity,
    });

    return {
      valid: data?.available || false,
      availableStock: data?.available_stock,
    };
  },
  []
);

// New export for checkout validation
validateCartItems: () => Promise<{
  valid: boolean;
  invalidItems: Array<{ item: CartItem; availableStock: number }>;
}>
```

---

### Phase 3: Frontend Component Updates (Day 3)

**Task 3.1: Update ProductCard.tsx**

```typescript
// File: src/components/product/ProductCard.tsx

import { useLowestPriceForCart } from '@/hooks/useLowestPriceForCart';

const ProductCard = ({ product, regionInfo, variant = "default" }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { selectedRegion } = useRegion();

  // Phase 12: Get lowest price from suppliers
  const { data: priceInfo, isLoading: isLoadingPrice } = useLowestPriceForCart(
    product.id,
    selectedRegion?.id || null
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canAddToCart) {
      if (!selectedRegion) {
        openRegionModal();
      } else if (!isInRegion) {
        toast.error("Bu ürün seçili bölgede satılmamaktadır");
      } else if (isOutOfStock) {
        toast.error("Ürün stokta yok");
      }
      return;
    }

    // Phase 12: Pass supplier info to cart
    if (priceInfo) {
      addToCart(product, 1, selectedVariant, priceInfo.price, {
        supplierId: priceInfo.supplierId,
        supplierProductId: priceInfo.supplierProductId,
        supplierName: priceInfo.supplierName,
        priceSource: priceInfo.priceSource,
      });
    } else {
      // Fallback (shouldn't happen)
      const unitPrice = (isBusiness && regionInfo?.businessPrice)
        ? regionInfo.businessPrice
        : (regionInfo?.price ?? product.price);
      addToCart(product, 1, selectedVariant, unitPrice);
    }
  };

  // Update display price to show supplier source
  const displayPrice = useMemo(() => {
    if (priceInfo && priceInfo.priceSource === 'supplier') {
      return priceInfo.price * (selectedVariant?.priceMultiplier ?? 1);
    }
    // Fallback to region or master price
    const basePrice = (isBusiness && regionInfo?.businessPrice)
      ? regionInfo.businessPrice
      : (regionInfo?.price ?? product.price);
    return basePrice * (selectedVariant?.priceMultiplier ?? 1);
  }, [priceInfo, regionInfo, product.price, selectedVariant, isBusiness]);

  // Disable button while loading price
  return (
    <Button
      size="icon"
      className={cn(
        "h-9 w-9 rounded-full",
        canAddToCart && !isLoadingPrice
          ? "bg-primary hover:bg-primary/90"
          : "bg-muted text-muted-foreground cursor-not-allowed"
      )}
      onClick={handleAddToCart}
      disabled={!canAddToCart && !!selectedRegion || isLoadingPrice}
    >
      <Plus className="h-4 w-4" />
    </Button>
  );
};
```

**Task 3.2: Update ProductDetail.tsx**

```typescript
// Similar changes to ProductCard
// Add useLowestPriceForCart hook
// Pass supplierInfo to addToCart
// Show supplier name if priceSource === 'supplier'
```

**Task 3.3: Update Cart.tsx Display**

```typescript
// File: src/pages/Cart.tsx

// Show supplier info in cart (already implemented at line 126-135)
{item.priceSource === 'supplier' && item.supplierName && (
  <p className="text-xs text-muted-foreground mt-1">
    Tedarikçi: {item.supplierName}
  </p>
)}
{item.priceSource === 'region' && (
  <p className="text-xs text-muted-foreground mt-1">
    Bölge Fiyatı
  </p>
)}

// Add stock validation warning
{item.priceSource === 'supplier' && item.supplierProductId && (
  <StockWarning cartItem={item} />
)}
```

---

### Phase 4: Testing & Edge Cases (Day 4)

**Test Scenarios:**

| Scenario | Expected Behavior | Status |
|----------|-------------------|--------|
| **Add product with active suppliers** | Cart shows lowest price + supplier name | ❌ FAIL |
| **Add product with no suppliers (region only)** | Cart shows region price | ❌ FAIL |
| **Add product with no region or suppliers** | Falls back to master price | ❌ FAIL |
| **Add product with multiple suppliers** | Selects lowest price automatically | ❌ FAIL |
| **Cart item quantity exceeds supplier stock** | Show warning, block checkout | ❌ NOT IMPLEMENTED |
| **Supplier becomes inactive after add to cart** | Show warning, offer to remove | ❌ NOT IMPLEMENTED |
| **Supplier changes price after add to cart** | Show "price updated" notification | ❌ NOT IMPLEMENTED |
| **Same product from different suppliers** | Separate cart items (by supplierProductId) | ❌ FAIL |
| **Region change with items in cart** | Existing items keep regionIdAtAdd | ✅ PASS (already implemented) |
| **Guest user adds to cart** | Works, but requires login at checkout | ✅ PASS (already implemented) |

**Edge Cases to Handle:**

1. **Zero suppliers available:** Should fall back to region_products or products.price
2. **All suppliers out of stock:** Should show "Out of Stock" in ProductCard
3. **Supplier deleted:** Cart should handle null supplier gracefully
4. **Price increased significantly:** Show warning: "Price increased from X to Y"
5. **Variant with different prices per supplier:** Need variant-specific supplier_products

---

## Breaking Changes

| Change | Impact | Migration Needed |
|--------|--------|------------------|
| **Cart data structure** | Existing carts lose supplier tracking | Data migration script needed |
| **Price lookup logic** | Wrong prices if using old code | All addToCart calls must update |
| **RPC dependency** | Requires new database function | Run migration before deploy |
| **Stock validation** | Checkout may fail if no stock | Add validation to checkout flow |

**Data Migration for Existing Carts:**

```typescript
// File: scripts/migrate-carts-to-phase12.ts

// For users with existing carts in localStorage
// Backfill supplier info based on current state
async function migrateExistingCart(cartItem: CartItem): Promise<CartItem> {
  if (cartItem.supplierProductId) {
    // Already migrated
    return cartItem;
  }

  // Try to find supplier product
  const { data: priceInfo } = await getLowestPriceForCart(
    cartItem.productId,
    cartItem.regionIdAtAdd
  );

  return {
    ...cartItem,
    supplierId: priceInfo?.supplierId || null,
    supplierProductId: priceInfo?.supplierProductId || null,
    supplierName: priceInfo?.supplierName || '',
    priceSource: priceInfo?.priceSource || 'product',
    unitPriceAtAdd: priceInfo?.price || cartItem.unitPriceAtAdd,
  };
}
```

---

## Implementation Checklist

### Database (MUST DO FIRST)
- [ ] Create `get_cart_price_info` RPC function
- [ ] Add indexes for cart lookup performance
- [ ] Create `validate_cart_stock` function
- [ ] Test RPC functions in Supabase dashboard
- [ ] Grant execute permissions to authenticated role

### Backend/Hooks
- [ ] Update `useLowestPriceForCart` to use new RPC
- [ ] Add loading state handling
- [ ] Add error boundary for RPC failures
- [ ] Implement stock validation hook
- [ ] Add retry logic for failed RPC calls

### CartContext
- [ ] Update `addToCart` to accept and use `supplierInfo`
- [ ] Add `validateCartItems` function
- [ ] Update cart storage schema (version bump to 3)
- [ ] Add migration logic for old cart items
- [ ] Update total calculation to use supplier pricing

### Frontend Components
- [ ] Update `ProductCard.tsx` to use `useLowestPriceForCart`
- [ ] Update `ProductDetail.tsx` similarly
- [ ] Update `TodaysDealsHighlight.tsx`
- [ ] Update `Wishlist.tsx` add to cart
- [ ] Update `Compare.tsx` add to cart
- [ ] Update `BugunHalde.tsx` add to cart
- [ ] Update `useRepeatOrder.ts` hook

### Cart Page
- [ ] Show supplier name in cart items (✅ already done)
- [ ] Add stock validation warnings
- [ ] Add "price changed" notifications
- [ ] Implement "remove out of stock items" bulk action
- [ ] Update checkout flow validation

### Testing
- [ ] Unit tests for `useLowestPriceForCart` hook
- [ ] Integration tests for CartContext
- [ ] E2E tests for add to cart flow
- [ ] Manual testing with multiple suppliers
- [ ] Manual testing with out-of-stock scenarios
- [ ] Load testing for RPC performance

### Documentation
- [ ] Update Phase 12 migration documentation
- [ ] Add cart architecture decision record
- [ ] Document supplier selection workflow
- [ ] Create troubleshooting guide

---

## Success Criteria

**Definition of Done:**
1. ✅ User can add any product to cart from ProductCard
2. ✅ Cart displays correct price from lowest supplier or region
3. ✅ Cart shows which supplier is providing the product
4. ✅ Checkout validates stock before order creation
5. ✅ Existing user carts are migrated without data loss
6. ✅ No regression in region-based pricing
7. ✅ Performance: Add to cart < 500ms (RPC call + UI update)
8. ✅ Error handling: Graceful fallback if RPC fails
9. ✅ All tests passing (unit + integration + E2E)

**Metrics to Monitor:**
- Cart abandonment rate (before vs after)
- Add to cart error rate
- Average time to add to cart
- Stock-out rate at checkout
- Supplier price participation rate

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **RPC function fails** | 🔴 HIGH | Add fallback to old logic, monitor errors |
| **Performance degradation** | 🟠 MED | Add caching, use indexes, monitor query times |
| **Stock race condition** | 🟠 MED | Validate at checkout, hold stock temporarily |
| **User cart data loss** | 🔴 HIGH | Backup localStorage before migration, test thoroughly |
| **Supplier price changes** | 🟢 LOW | Show price in cart is "at time of add" |
| **Region price not found** | 🟢 LOW | Fallback to master price, log warning |

---

## Next Steps

1. **IMMEDIATE (Today):**
   - Create database migration file with RPC functions
   - Test RPC in Supabase SQL editor
   - Update `useLowestPriceForCart` hook

2. **Tomorrow:**
   - Update CartContext implementation
   - Update ProductCard component
   - Test add to cart flow end-to-end

3. **Day 3:**
   - Update all other addToCart call sites
   - Implement stock validation
   - Write migration script for existing carts

4. **Day 4:**
   - Comprehensive testing
   - Performance optimization
   - Documentation updates

5. **Deploy:**
   - Run database migration
   - Deploy frontend changes
   - Monitor for errors
   - Rollback plan ready

---

## References

- Test Findings: `docs/TEST_BULGULARI_PHASE12.md` (Issue #3)
- Phase 12 Schema: `supabase/migrations/20250110000000_phase12_multi_supplier_products.sql`
- Current Cart Context: `src/contexts/CartContext.tsx`
- Price Lookup Hook: `src/hooks/useLowestPriceForCart.ts`
- Product Card: `src/components/product/ProductCard.tsx`
- Types: `src/types/index.ts`

---

**Document Version:** 1.0
**Last Updated:** 2026-01-08
**Author:** Claude Code (Backend Development Architect)
**Status:** 🔴 READY FOR IMPLEMENTATION
