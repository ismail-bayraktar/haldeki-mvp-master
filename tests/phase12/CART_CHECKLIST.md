# Cart Migration Manual Test Checklist
## Phase 12 Completion - Sprint 1

### Test Environment
- [ ] Test environment setup complete
- [ ] Database migrations applied
- [ ] Test user account created
- [ ] Test region configured

### Test 1: Add Product to Cart from ProductCard
**Steps:**
1. Login as test user
2. Select a region (e.g., "Aliaga")
3. Navigate to products page
4. Click "Add to Cart" on any product
5. Open browser DevTools → Application → Local Storage

**Expected Results:**
- [ ] Product added to cart successfully
- [ ] Toast notification appears: "[Product Name] sepete eklendi"
- [ ] localStorage has `haldeki_cart_items` key
- [ ] Cart item contains new fields:
  - [ ] `supplierId` (string or null)
  - [ ] `supplierProductId` (string or null)
  - [ ] `supplierName` (string)
  - [ ] `priceSource` ('region' | 'supplier' | 'product')

**Test Data:**
```json
{
  "supplierId": null,
  "supplierProductId": null,
  "supplierName": "",
  "priceSource": "product"
}
```

### Test 2: Check localStorage Has New Fields
**Steps:**
1. Add a product to cart
2. Open DevTools → Console
3. Run: `JSON.parse(localStorage.getItem('haldeki_cart_items'))`

**Expected Results:**
- [ ] All cart items have `supplierId` field
- [ ] All cart items have `supplierProductId` field
- [ ] All cart items have `supplierName` field
- [ ] All cart items have `priceSource` field
- [ ] Old format items (if any) have null/empty values

### Test 3: Cart Migration from Old Format
**Steps:**
1. Open DevTools → Console
2. Simulate old format cart:
   ```javascript
   const oldCart = [{
     productId: 'test-1',
     quantity: 1,
     product: { id: 'test-1', name: 'Test' },
     unitPriceAtAdd: 100,
     regionIdAtAdd: 'region-1'
   }];
   localStorage.setItem('haldeki_cart_items', JSON.stringify(oldCart));
   ```
3. Refresh the page
4. Check cart contents

**Expected Results:**
- [ ] Cart loads without errors
- [ ] Cart items are migrated to new format
- [ ] Migrated items have default values:
  - [ ] `supplierId: null`
  - [ ] `supplierProductId: null`
  - [ ] `supplierName: ""`
  - [ ] `priceSource: "product"`

### Test 4: Reload Page → Cart Restores
**Steps:**
1. Add 2-3 products to cart
2. Verify cart shows correct items
3. Hard refresh page (Ctrl+Shift+R)
4. Check cart again

**Expected Results:**
- [ ] Cart persists after page reload
- [ ] All items restored with correct quantities
- [ ] Supplier info preserved
- [ ] Cart total calculated correctly

### Test 5: Cart Shows Supplier Name
**Steps:**
1. Add a product with supplier price
2. Navigate to cart page
3. Check product display

**Expected Results:**
- [ ] Product displays in cart
- [ ] If `priceSource === 'supplier'`, show supplier name
- [ ] Format: "[Product Name] - [Supplier Name]"
- [ ] If `priceSource === 'product'`, show regular format

### Test 6: Cart with Region Price
**Steps:**
1. Select region "Aliaga"
2. Add a product with region-specific pricing
3. Check cart item

**Expected Results:**
- [ ] `priceSource === 'region'`
- [ ] `unitPriceAtAdd` matches region price
- [ ] `regionIdAtAdd` matches selected region

### Test 7: Cart with Supplier Price
**Steps:**
1. Add product from "Bugün Halde" page (multi-supplier)
2. Select specific supplier
3. Check cart item

**Expected Results:**
- [ ] `priceSource === 'supplier'`
- [ ] `supplierId` is set
- [ ] `supplierName` is displayed
- [ ] `unitPriceAtAdd` matches supplier price

### Test 8: Cart Totals Calculation
**Steps:**
1. Add multiple products with different price sources
2. Check cart total

**Expected Results:**
- [ ] Total calculated correctly
- [ ] Region prices included
- [ ] Supplier prices included
- [ ] Variant multipliers applied
- [ ] Formula: `sum(unitPriceAtAdd * variantMultiplier * quantity)`

### Test 9: Update Quantity
**Steps:**
1. Add product to cart
2. Change quantity to 5
3. Check localStorage

**Expected Results:**
- [ ] Quantity updated
- [ ] Supplier info preserved
- [ ] Total recalculated

### Test 10: Remove from Cart
**Steps:**
1. Add 2 products to cart
2. Remove one product
3. Check cart and localStorage

**Expected Results:**
- [ ] Product removed from cart
- [ ] Toast notification: "Ürün sepetten çıkarıldı"
- [ ] localStorage updated
- [ ] If cart empty, localStorage key removed

### Test 11: Clear Cart
**Steps:**
1. Add multiple products
2. Clear cart (via clear button or logout)
3. Check localStorage

**Expected Results:**
- [ ] Cart is empty
- [ ] `haldeki_cart_items` removed from localStorage

### Test 12: Checkout Verifies Supplier Info
**Steps:**
1. Add product with supplier info
2. Proceed to checkout
3. Check order data

**Expected Results:**
- [ ] Order includes supplier information
- [ ] `items` array has supplier fields
- [ ] Order summary shows correct products

### Test 13: Multiple Price Sources in Same Cart
**Steps:**
1. Add product with region price
2. Add product with supplier price
3. Add product with base price
4. Check cart

**Expected Results:**
- [ ] All 3 products in cart
- [ ] Each has correct `priceSource`
- [ ] Total calculated correctly

### Test 14: Cart Variant Handling
**Steps:**
1. Add product with variant (e.g., "2 kg")
2. Check cart item

**Expected Results:**
- [ ] `selectedVariant` populated
- [ ] Variant multiplier applied to total
- [ ] Supplier info preserved with variant

### Test 15: Rollback Scenario
**Steps:**
1. Create cart with new format
2. Manually edit localStorage to old format
3. Refresh page

**Expected Results:**
- [ ] Cart loads without errors
- [ ] Old format items migrated
- [ ] No console errors

---

## Test Summary

### Pass/Fail Status
- [ ] All tests passed
- [ ] Critical bugs found: _____
- [ ] Minor issues found: _____

### Issues Found
1. ___________
2. ___________
3. ___________

### Notes
- ___________
- ___________
- ___________

### Tester Signature
- Name: ___________
- Date: ___________
- Environment: (Dev/Staging/Prod)
