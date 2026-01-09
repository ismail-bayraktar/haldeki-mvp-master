# Multi-Supplier Cart Migration Test Plan

## Test Environment
- **Date:** 2026-01-08
- **Migration:** Phase 12 Cart Context
- **Files Modified:**
  - `src/hooks/useLowestPriceForCart.ts` (already correct)
  - `src/components/product/ProductCard.tsx` (updated)
  - `src/contexts/CartContext.tsx` (verified, no changes needed)

---

## Unit Tests

### Test 1: useLowestPriceForCart Hook
**File:** `src/hooks/__tests__/useLowestPriceForCart.test.ts`

```typescript
describe('useLowestPriceForCart', () => {
  it('should prefer supplier price over region price', async () => {
    // Mock: Supplier 10₺ < Region 15₺
    // Expected: Returns supplier price
    expect(priceInfo.priceSource).toBe('supplier');
    expect(priceInfo.price).toBe(10);
  });

  it('should fall back to region when no suppliers', async () => {
    // Mock: No suppliers, Region 15₺
    // Expected: Returns region price
    expect(priceInfo.priceSource).toBe('region');
    expect(priceInfo.price).toBe(15);
  });

  it('should return null when no data available', async () => {
    // Mock: No suppliers, no region
    // Expected: Returns null
    expect(priceInfo).toBeNull();
  });

  it('should cache results for 5 minutes', () => {
    // Verify staleTime: 5 * 60 * 1000
    const { result } = renderHook(() => useLowestPriceForCart('p1', 'r1'));
    // Query should be cached
  });
});
```

---

## Integration Tests

### Test 2: Add to Cart with Supplier
**Scenario:** Product has 3 suppliers offering different prices

**Steps:**
1. Navigate to product page
2. Select region (e.g., "İzmir")
3. Observe displayed price (should be lowest supplier price)
4. Click "Add to Cart"
5. Open cart drawer

**Expected Results:**
```typescript
CartItem {
  productId: 'uuid-product',
  quantity: 1,
  unitPriceAtAdd: 18.75,  // Lowest supplier price
  supplierId: 'uuid-aliaga-tarim',
  supplierProductId: 'uuid-junction-table',
  supplierName: 'Aliaga Tarım',
  priceSource: 'supplier',  // ← Critical!
}
```

**Verification Points:**
- [ ] Cart shows correct supplier name
- [ ] Unit price matches displayed price
- [ ] Cart persists after page refresh
- [ ] Cart item has `priceSource: 'supplier'`

---

### Test 3: Add to Cart without Supplier (Region Fallback)
**Scenario:** Product has no suppliers, only region price

**Steps:**
1. Navigate to product page
2. Select region
3. Click "Add to Cart"

**Expected Results:**
```typescript
CartItem {
  supplierId: '',  // Empty string
  supplierProductId: '',  // Empty string
  supplierName: '',  // Empty string
  priceSource: 'region',
  unitPriceAtAdd: 25.00,  // Region price
}
```

**Verification Points:**
- [ ] Cart item has `priceSource: 'region'`
- [ ] No supplier info displayed
- [ ] Price matches region price

---

### Test 4: Business User Price Override
**Scenario:** Business user gets region business price

**Steps:**
1. Login as business user
2. Navigate to product
3. Add to cart

**Expected Results:**
```typescript
CartItem {
  unitPriceAtAdd: 22.50,  // Business price (overrides supplier)
  priceSource: 'region',  // Business price is from region
  supplierInfo: undefined,  // Not used for business
}
```

**Verification Points:**
- [ ] Business price takes precedence
- [ ] Cart displays business price
- [ ] `priceSource` reflects region source

---

### Test 5: Cart Persistence
**Scenario:** Refresh page after adding to cart

**Steps:**
1. Add product with supplier to cart
2. Open DevTools → Application → Local Storage
3. Verify `cart-storage` structure
4. Refresh page
5. Verify cart items persist

**Expected Results:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 1,
      "supplierId": "uuid-supplier",  // ← Persisted!
      "supplierProductId": "uuid-junction",  // ← Persisted!
      "supplierName": "Aliaga Tarım",  // ← Persisted!
      "priceSource": "supplier",  // ← Persisted!
      "unitPriceAtAdd": 18.75
    }
  ]
}
```

**Verification Points:**
- [ ] All supplier fields persist
- [ ] Cart loads correctly on refresh
- [ ] No data loss

---

### Test 6: Region Change
**Scenario:** User changes region after adding to cart

**Steps:**
1. Add product to cart (Region: İzmir, Supplier: Aliaga)
2. Navigate to different region (e.g., Ankara)
3. Open cart

**Expected Behavior:**
- Cart validates items for new region
- If product not available in new region → Remove or warn
- If available → Update price based on new region's suppliers

**Verification Points:**
- [ ] Cart handles region change gracefully
- [ ] User sees clear warning if item unavailable
- [ ] Supplier info updates if different suppliers in new region

---

### Test 7: Stock Validation
**Scenario:** Supplier goes out of stock after adding to cart

**Steps:**
1. Add product to cart (Supplier has 50 units)
2. Admin sets supplier stock to 0
3. User proceeds to checkout

**Expected Behavior:**
- Cart validation detects stock shortage
- User sees warning: "Aliaga Tarım stoğu tükendi"
- User can remove item or select different supplier

**Verification Points:**
- [ ] Cart validates stock at checkout time
- [ ] Clear error message to user
- [ ] Option to select alternative supplier

---

## Manual Testing Checklist

### Pre-Deployment
- [ ] Run build: `npm run build` (no TypeScript errors)
- [ ] Run linter: `npm run lint` (no errors)
- [ ] Run tests: `npm run test` (all passing)

### Staging Environment
- [ ] Deploy to staging
- [ ] Test Add to Cart (with suppliers)
- [ ] Test Add to Cart (without suppliers)
- [ ] Test Cart Persistence
- [ ] Test Region Change
- [ ] Test Checkout Flow
- [ ] Verify localStorage structure

### Production Deployment
- [ ] Create backup before deployment
- [ ] Deploy migration `20260110000001_fix_rpc_supplier_product_id.sql`
- [ ] Deploy frontend changes
- [ ] Monitor error logs (Sentry)
- [ ] Verify cart functionality in production

---

## Rollback Plan

### If Issues Occur:

**Option 1: Feature Flag**
```typescript
// In .env
VITE_ENABLE_MULTI_SUPPLIER_CART=false

// In ProductCard.tsx
if (import.meta.env.VITE_ENABLE_MULTI_SUPPLIER_CART === 'true') {
  // Use new logic
} else {
  // Use old logic
}
```

**Option 2: Revert ProductCard Only**
```bash
git revert <commit-hash>
# Reverts ProductCard.tsx changes
# CartContext changes stay (harmless)
```

**Option 3: Full Rollback**
```bash
git revert <commit-hash-1> <commit-hash-2>
# Reverts all changes
```

---

## Success Criteria

✅ **Migration Success:**
1. Add to cart works for products with suppliers
2. Add to cart works for products without suppliers (region fallback)
3. Cart items have correct `supplierId`, `supplierProductId`, `supplierName`
4. Cart items have correct `priceSource` ('supplier' or 'region')
5. Cart persists across page refreshes
6. No data loss in localStorage

✅ **Performance:**
- Cart loads in <500ms
- Price lookups cached for 5 minutes
- No N+1 query problems

✅ **User Experience:**
- No visible breaking changes
- Cart works seamlessly
- Price updates are smooth

---

## Test Execution Log

**Date:** 2026-01-08
**Tester:** [Name]
**Environment:** [Staging/Production]

| Test # | Status | Notes | Issues Found |
|--------|--------|-------|---------------|
| Test 1 | ☐ PASS | Unit test hook |  |
| Test 2 | ☐ PASS | Add with supplier |  |
| Test 3 | ☐ PASS | Add without supplier |  |
| Test 4 | ☐ PASS | Business user override |  |
| Test 5 | ☐ PASS | Cart persistence |  |
| Test 6 | ☐ PASS | Region change |  |
| Test 7 | ☐ PASS | Stock validation |  |

---

**Sign-off:**
- [ ] Developer: Migration implemented
- [ ] QA: Tests passed
- [ ] Product Owner: Approved for production
