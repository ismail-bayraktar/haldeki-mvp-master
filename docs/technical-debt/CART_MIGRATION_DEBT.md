# Cart Migration Technical Debt

**Created:** 2026-01-09
**Phase:** 12 (Multi-Supplier)
**Priority:** HIGH (Revenue-Critical)
**Status:** ⏸️ PAUSED - User Requested Halt

---

## 🎯 Executive Summary

Phase 12 introduced `supplier_products` junction table for multi-supplier pricing. The cart system began migration to track `supplier_id` but was **paused before completion**. The cart system is functional but has **incomplete migration** that represents technical debt.

**Current Risk Level:** 🟡 MEDIUM
**Business Impact:** Revenue tracking, order fulfillment
**Estimated Effort:** 4-6 hours to complete

---

## 📋 Background

### Phase 12 Architecture Change

**Before Phase 12:**
```
products.price (single price per product)
    ↓
Cart: product_id + price_from_product
```

**After Phase 12:**
```
supplier_products.price (multiple suppliers per product)
    ↓ (lowest price selected)
Cart: product_id + supplier_id + supplier_product_id + price_from_supplier
```

### Migration Progress

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| Phase 1 | Verify useLowestPriceForCart hook | ✅ Complete | Hook already correct |
| Phase 2 | Integrate hook into ProductCard | ✅ Complete | ProductCard updated |
| Phase 3 | Verify CartContext compatibility | ✅ Complete | Already supports supplier info |
| Phase 4 | Testing & Deployment | ⏸️ Paused | Test plan created, user halted |

---

## 🔴 Technical Debt Items

### Debt #1: Incomplete Cart Migration

**Description:** Cart items track `supplier_id` but migration wasn't fully tested or deployed.

**Current State:**
```typescript
// CartContext.tsx - ALREADY SUPPORTS supplier info
export interface CartItem {
  productId: string;
  quantity: number;
  unitPriceAtAdd: number;
  variant?: ProductVariant;

  // Phase 12: Supplier tracking (supported but not fully deployed)
  supplierId?: string;
  supplierProductId?: string;
  supplierName?: string;
  priceSource?: 'supplier' | 'region';
}
```

**What Works:**
- ✅ CartContext accepts `supplierInfo` parameter
- ✅ `addToCart()` merges supplier info correctly
- ✅ Cart items store `supplierId`, `supplierProductId`, `supplierName`
- ✅ Price source tracking (`supplier` vs `region`)

**What's Missing:**
- ❌ Integration testing not completed
- ❌ Build verification failed (XCircle2 import error)
- ❌ Production deployment deferred
- ❌ User acceptance testing pending

**Impact:**
- Cart system functional for basic use
- Supplier tracking implemented but not verified in production
- Order fulfillment may not have correct supplier information

**Effort to Complete:** 2 hours (testing + deployment)

---

### Debt #2: Build Error Unresolved

**Description:** Build fails with unrelated `XCircle2` import error in WhitelistApplications.tsx

**Error:**
```
"XCircle2" is not exported by "node_modules/lucide-react/dist/esm/lucide-react.js"
Location: src/pages/admin/WhitelistApplications.tsx:11:126
```

**Root Cause:** Likely a lucide-react version mismatch or incorrect import name.

**Impact:**
- Cannot verify cart migration fixes work correctly
- Cannot deploy to production
- Blocks other features from deploying

**Effort to Fix:** 30 minutes (find correct icon name and update import)

---

### Debt #3: Test Coverage Gap

**Description:** No automated tests for supplier price tracking in cart.

**Missing Tests:**
```typescript
// TODO: Add these tests
describe('Cart with Supplier Products', () => {
  it('should add product with lowest supplier price', () => {
    // Given: Product with 3 suppliers (prices: 20, 18, 25)
    // When: Add to cart
    // Then: Cart item has supplierId of cheapest (18)
    // And: priceSource = 'supplier'
  });

  it('should fallback to region price when no suppliers', () => {
    // Given: Product with no suppliers, region price 25
    // When: Add to cart
    // Then: Cart item has priceSource = 'region'
    // And: unitPriceAtAdd = 25
  });

  it('should handle business price override', () => {
    // Given: Business user, product with supplier price 20, business price 18
    // When: Add to cart
    // Then: Cart item has priceSource = 'region' (business price from region)
    // And: unitPriceAtAdd = 18
  });

  it('should persist cart across page refresh', () => {
    // Given: Cart with supplier items
    // When: Refresh page
    // Then: All supplier fields preserved
  });
});
```

**Impact:**
- No regression testing for supplier price logic
- Risk of breaking changes in future updates
- Manual testing required for each change

**Effort to Implement:** 2-3 hours

---

### Debt #4: Migration Script for Existing Carts

**Description:** No migration strategy for existing cart items without `supplier_id`.

**Scenario:**
- User has cart items from before Phase 12
- These items lack `supplier_id`, `supplierProductId`, `supplierName`
- Need fallback logic or migration script

**Proposed Solution:**
```typescript
// In CartContext.tsx - loadCart function
const loadCart = () => {
  const stored = localStorage.getItem('cart-storage');
  if (stored) {
    const parsed = JSON.parse(stored);
    const items = parsed.state.items || [];

    // Migrate legacy items (Phase 12 compatibility)
    const migrated = items.map((item: CartItem) => {
      if (!item.supplierId && item.priceSource === undefined) {
        // Legacy item - add default values
        return {
          ...item,
          supplierId: '',  // Empty indicates legacy
          supplierProductId: '',
          supplierName: '',
          priceSource: 'region' as const,  // Assume region price
        };
      }
      return item;
    });

    return migrated;
  }
  return [];
};
```

**Impact:**
- Users with old carts won't lose data
- Smooth transition to Phase 12
- Fallback for orphaned items

**Effort to Implement:** 1 hour

---

### Debt #5: Rollback Plan Unverified

**Description:** Rollback plan exists but wasn't tested.

**Current Rollback Strategy:**
```bash
# Option 1: Revert ProductCard only (safest)
git revert <commit-hash>  # Reverts ProductCard.tsx changes
# CartContext changes stay (harmless)

# Option 2: Feature flag
# In .env
VITE_ENABLE_MULTI_SUPPLIER_CART=false

# Option 3: Full rollback
git revert <commit-hash-1> <commit-hash-2>
```

**Risk:**
- Rollback never tested
- Unknown side effects
- Potential data loss during rollback

**Impact:**
- Production deployment riskier without tested rollback
- Recovery time unknown if issues occur

**Effort to Verify:** 1 hour (test rollback in staging)

---

## 📊 Debt Summary

| Debt | Priority | Impact | Effort | Risk |
|------|----------|--------|--------|------|
| #1 Incomplete Migration | HIGH | Revenue | 2h | Medium |
| #2 Build Error | HIGH | Deployment | 30m | Low |
| #3 Test Coverage | MEDIUM | Quality | 3h | Medium |
| #4 Migration Script | LOW | UX | 1h | Low |
| #5 Rollback Plan | MEDIUM | Safety | 1h | High |

**Total Effort:** ~7-8 hours to resolve all debt

---

## 🎯 Resolution Plan

### Immediate (Before Next Deployment)

1. **Fix Build Error (30m)**
   - Update WhitelistApplications.tsx import
   - Verify build passes
   - Run `npm run build` successfully

2. **Complete Migration Testing (2h)**
   - Execute test plan: `tests/cart/multi-supplier-cart-test-plan.md`
   - Manual testing scenarios:
     - Add product with suppliers to cart
     - Add product without suppliers to cart
     - Business user price override
     - Cart persistence across refresh
     - Region change handling

3. **Verify Rollback (1h)**
   - Test rollback in staging environment
   - Document rollback steps
   - Verify no data loss

### This Week

4. **Implement Migration Script (1h)**
   - Add legacy item migration to CartContext
   - Test with old cart data
   - Verify no data loss

5. **Add Unit Tests (3h)**
   - Test supplier price selection
   - Test region price fallback
   - Test business price override
   - Test cart persistence

### Next Sprint

6. **Production Deployment**
   - Deploy migration to production
   - Monitor error logs (Sentry)
   - Verify cart functionality
   - A/B test vs old cart

7. **Performance Monitoring**
   - Track cart load times
   - Monitor price lookup performance
   - Alert on N+1 query issues

---

## 🔄 Migration Strategy

### Option A: Big Bang (Recommended for Small Teams)

**Pros:**
- Single deployment event
- All features available immediately
- Clear before/after comparison

**Cons:**
- Higher risk if issues occur
- No gradual rollout
- All-or-nothing approach

**Steps:**
1. Complete all debt items (#1-5)
2. Deploy to staging
3. Full testing pass
4. Deploy to production
5. Monitor for 24 hours
6. Rollback if issues detected

### Option B: Feature Flag (Recommended for Larger Teams)

**Pros:**
- Gradual rollout
- Easy rollback
- A/B testing possible

**Cons:**
- More complex code
- Feature flag maintenance
- Slower adoption

**Steps:**
1. Add feature flag: `VITE_ENABLE_MULTI_SUPPLIER_CART`
2. Deploy with flag OFF
3. Enable for 10% of users
4. Monitor metrics
5. Gradually increase to 100%
6. Remove flag after success

### Option C: Parallel Implementation (Safest)

**Pros:**
- Old cart continues working
- New cart tested independently
- Zero downtime

**Cons:**
- Higher maintenance burden
- Longer migration period
- Duplicate code

**Steps:**
1. Create `NewCartContext` alongside `CartContext`
2. Route traffic based on user ID
3. Test new cart thoroughly
4. Migrate users gradually
5. Deprecate old cart

---

## 📈 Success Metrics

### Before Migration (Baseline)

| Metric | Current Value |
|--------|---------------|
| Cart add success rate | 98% |
| Average price accuracy | Unknown |
| Order fulfillment time | 4 hours |
| Supplier tracking | None |

### After Migration (Target)

| Metric | Target Value | How to Measure |
|--------|--------------|----------------|
| Cart add success rate | 98%+ | Sentry errors |
| Price accuracy | 100% | Supplier ID present |
| Order fulfillment time | <2 hours | Supplier assignment |
| Cart persistence | 100% | Local storage check |

---

## 🚨 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Data loss during migration** | Low | Critical | Backup before deploy, test migration script |
| **Performance degradation** | Medium | High | Monitor query times, add indexes if needed |
| **User confusion** | Medium | Medium | Clear communication, UI changes minimal |
| **Supplier pricing errors** | Low | High | Extensive testing, rollback plan ready |
| **Build failures** | Low | Medium | Fix XCircle2 error first |

---

## 📝 Implementation Checklist

### Pre-Deployment

- [ ] Fix XCircle2 import error in WhitelistApplications.tsx
- [ ] Verify build passes: `npm run build`
- [ ] Run all tests: `npm run test`
- [ ] Create backup of production database
- [ ] Document rollback steps

### Deployment

- [ ] Deploy migration: `npx supabase db push`
- [ ] Verify supplier_products RPC works
- [ ] Deploy frontend: `npm run deploy`
- [ ] Smoke test cart functionality
- [ ] Monitor error logs for 1 hour

### Post-Deployment

- [ ] Verify cart items have supplier_id
- [ ] Check price accuracy on 10 random orders
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Update documentation

### Rollback (If Needed)

- [ ] Revert ProductCard.tsx changes
- [ ] Deploy previous version
- [ ] Verify cart works correctly
- [ ] Investigate root cause
- [ ] Fix and re-deploy

---

## 📚 Related Documentation

- `tests/cart/multi-supplier-cart-test-plan.md` - Complete test plan
- `docs/phases/phase-12-multi-supplier.md` - Phase 12 documentation
- `docs/reviews/CODE_REVIEW_2026-01-09.md` - Stream 5 findings
- `src/contexts/CartContext.tsx` - Cart implementation
- `src/hooks/useLowestPriceForCart.ts` - Supplier price hook

---

## ✅ Acceptance Criteria

Migration considered complete when:

- [ ] Build passes without errors
- [ ] All test scenarios pass (test plan)
- [ ] Cart items track `supplierId` correctly
- [ ] Price source identified (`supplier` vs `region`)
- [ ] Cart persists across page refresh
- [ ] Legacy cart items migrated successfully
- [ ] Rollback tested and verified
- [ ] Production deployed and monitored
- [ ] No regression in existing functionality

---

## 🎯 Next Steps

1. **Immediate:** Fix XCircle2 import error
2. **Today:** Complete migration testing
3. **This week:** Implement migration script + unit tests
4. **Next week:** Production deployment
5. **Following week:** Monitor and optimize

---

**Status:** ⏸️ PAUSED - Await user approval to resume
**Owner:** Development Team
**Review Date:** After deployment
**Last Updated:** 2026-01-09
