# Variation Types Migration Test Checklist
## Fresh Food Market - Variation Types Cleanup

**Migration Files:**
- `20260111000000_remove_invalid_variation_types.sql`
- `20260111010000_fix_variation_types.sql`

**Date:** 2026-01-11
**Purpose:** Verify invalid variation types are removed and system works with new valid types (size, packaging, quality, other)

---

## PHASE 1: Database Verification (CRITICAL)

### 1.1 Pre-Migration Snapshot
```sql
-- Run BEFORE migration to document current state
SELECT
  variation_type,
  COUNT(*) AS variation_count,
  COUNT(DISTINCT product_id) AS product_count
FROM public.product_variations
GROUP BY variation_type
ORDER BY variation_type;
```

**Record Results:**
- [ ] Document count of each variation type
- [ ] Identify products with invalid types (beden, BEYAZ, scent, material, flavor)
- [ ] Save snapshot to `backups/variation-pre-migration-YYYY-MM-DD.sql`

### 1.2 Backup Verification
```sql
-- Verify backup table was created
SELECT COUNT(*) AS backup_count
FROM public.product_variations_backup_20260111;
```

- [ ] Backup table exists
- [ ] Backup count matches pre-migration count

### 1.3 Post-Migration Cleanup Verification
```sql
-- Verify NO invalid types remain
SELECT
  variation_type,
  COUNT(*) AS count
FROM public.product_variations
WHERE variation_type NOT IN ('size', 'packaging', 'quality', 'other')
GROUP BY variation_type;
```

**Expected Result:** 0 rows (no invalid types)

- [ ] No invalid types found
- [ ] Only valid types exist: size, packaging, quality, other

### 1.4 Valid Types Distribution
```sql
-- Verify current state after migration
SELECT
  variation_type,
  COUNT(*) AS variation_count,
  COUNT(DISTINCT product_id) AS product_count,
  STRING_AGG(DISTINCT variation_value, ', ') AS sample_values
FROM public.product_variations
GROUP BY variation_type
ORDER BY variation_type;
```

- [ ] Size variations exist (e.g., "1 KG", "2 KG", "500 GR")
- [ ] Packaging variations exist (e.g., "Kasa", "Koli", "Poset")
- [ ] Quality type is available
- [ ] Other type is available

### 1.5 Quality Type Verification
```sql
-- Verify 'quality' enum value was added
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'product_variation_type'
)
AND enumlabel = 'quality';
```

- [ ] Quality enum value exists

### 1.6 CHECK Constraint Verification
```sql
-- Verify constraint only allows valid types
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.product_variations'::regclass
AND conname = 'product_variations_variation_type_check';
```

**Expected:** `CHECK (variation_type IN ('size', 'packaging', 'quality', 'other'))`

- [ ] Constraint definition is correct

---

## PHASE 2: Backend API Verification

### 2.1 Product Variations RPC
```sql
-- Test RPC function returns correct data
SELECT * FROM get_product_variations('YOUR_PRODUCT_ID');
```

- [ ] RPC returns variations
- [ ] All returned variations have valid types
- [ ] No errors in execution

### 2.2 Create Variation with Valid Types
```sql
-- Test creating variations with each valid type
INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
VALUES
  ('TEST_PRODUCT_ID', 'size', '3 KG', 0),
  ('TEST_PRODUCT_ID', 'packaging', 'Kutu', 1),
  ('TEST_PRODUCT_ID', 'quality', '1. Sınıf', 2),
  ('TEST_PRODUCT_ID', 'other', 'Organik', 3);
```

- [ ] Size variation created successfully
- [ ] Packaging variation created successfully
- [ ] Quality variation created successfully
- [ ] Other variation created successfully

### 2.3 Reject Invalid Types
```sql
-- Test that invalid types are rejected
-- Should fail with constraint violation
INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
VALUES ('TEST_PRODUCT_ID', 'beden', 'M', 0);
```

**Expected:** ERROR: check constraint violation

- [ ] Invalid type 'beden' rejected
- [ ] Invalid type 'type' rejected
- [ ] Invalid type 'scent' rejected
- [ ] Invalid type 'material' rejected
- [ ] Invalid type 'flavor' rejected

---

## PHASE 3: Frontend Admin Pages

### 3.1 `/admin/products` - Product List
**Test Steps:**
1. Navigate to `/admin/products`
2. Search for a product with variations
3. Click "Varyasyonlar" expand button for a product

**Expected Results:**
- [ ] Page loads without errors
- [ ] Variations row displays for products
- [ ] Variation count badge shows correct number
- [ ] Click to expand variations works smoothly
- [ ] All displayed variations have valid types only

### 3.2 ProductVariationsRow Component
**Test Steps:**
1. Expand variations for a product
2. Verify variation type badges display correctly

**Expected Results:**
- [ ] "size" displays as "Boyut" badge
- [ ] "packaging" displays as "Ambalaj" badge
- [ ] "quality" displays as "Kalite" badge
- [ ] "other" displays as "Diğer" badge
- [ ] No invalid type badges appear (beden, BEYAZ, scent, etc.)

### 3.3 Add New Variation (Inline)
**Test Steps:**
1. Click "Varyasyonlar" to expand
2. In the input field, type "3 KG"
3. Click "Ekle" button or press Enter

**Expected Results:**
- [ ] New variation appears in list
- [ ] Toast message: "Varyasyon eklendi"
- [ ] New variation has type "size"
- [ ] Variation displays immediately without page reload

### 3.4 Edit Variation Value
**Test Steps:**
1. Click pencil icon on a variation
2. Change value (e.g., "1 KG" -> "2 KG")
3. Click checkmark or press Enter

**Expected Results:**
- [ ] Input field appears for editing
- [ ] Value updates successfully
- [ ] Toast message: "Varyasyon güncellendi"
- [ ] Edit mode closes automatically

### 3.5 Delete Variation
**Test Steps:**
1. Click trash icon on a variation
2. Confirm deletion

**Expected Results:**
- [ ] Variation removed from list
- [ ] Toast message: "Varyasyon silindi"
- [ ] Variation count updates

### 3.6 `/admin/products/:id` - Product Detail
**Test Steps:**
1. Click edit (pencil) icon on a product
2. Verify ProductForm dialog opens
3. Check variations JSON field (if populated)

**Expected Results:**
- [ ] ProductForm opens without errors
- [ ] Variations JSON (if exists) contains valid types only

---

## PHASE 4: Frontend Customer Pages

### 4.1 `/urunler` - Products Listing Page
**Test Steps:**
1. Navigate to `/urunler`
2. Find products with variations
3. Verify ProductCard displays variations

**Expected Results:**
- [ ] Page loads without console errors
- [ ] ProductCard shows variation buttons
- [ ] Variation labels display correctly (e.g., "1 KG", "2 KG")
- [ ] Clicking variation button updates selection
- [ ] Price updates when variation selected

### 4.2 ProductCard Component
**Test Steps:**
1. Hover over a product card with variations
2. Click different variation buttons

**Expected Results:**
- [ ] Up to 4 variations display as buttons
- [ ] Selected variation has different style (border/background)
- [ ] Clicking variation button updates selected variant
- [ ] Price reflects selected variant's price multiplier

### 4.3 `/urun/:slug` - Product Detail Page
**Test Steps:**
1. Click on a product to view detail page
2. Scroll to variant selector section
3. Test each variation button

**Expected Results:**
- [ ] "Miktar Seçin" label displays
- [ ] All variations display as buttons
- [ ] Variation label shows (e.g., "1 KG", "2 KG", "Kutu")
- [ ] Price updates below when variation selected
- [ ] Selected variation highlighted

### 4.4 Variant Price Calculation
**Test Steps:**
1. Select a variant with priceMultiplier != 1
2. Verify price calculation

**Expected Results:**
- [ ] Base price × priceMultiplier = displayed price
- [ ] Unit label updates (e.g., "/ 2 KG")
- [ ] Savings badge shows if applicable

### 4.5 Add to Cart with Variations
**Test Steps:**
1. Select a variation
2. Click "Sepete Ekle" button
3. Open cart drawer

**Expected Results:**
- [ ] Product added to cart with selected variation
- [ ] Cart shows correct variant label
- [ ] Cart shows correct price for variant

---

## PHASE 5: Role-Based Testing

### 5.1 Super Admin Role
**User:** Super Admin account
**Tests:**
- [ ] Can access `/admin/products`
- [ ] Can view all product variations
- [ ] Can add new variations (any type)
- [ ] Can edit variation values
- [ ] Can delete variations
- [ ] Variation changes apply immediately

### 5.2 Supplier Role
**User:** Supplier account
**Tests:**
- [ ] Can access supplier dashboard
- [ ] Can add variations to their products
- [ ] Variation type dropdown shows only valid types
- [ ] Can edit their own product variations
- [ ] Cannot delete variations if stock exists

### 5.3 Customer Role
**User:** Regular customer (B2C)
**Tests:**
- [ ] Can view product variations on `/urunler`
- [ ] Can view variations on `/urun/:slug`
- [ ] Can select variations
- [ ] Cannot add/edit/delete variations
- [ ] Variation selection affects cart correctly

### 5.4 Guest (Unauthenticated)
**Tests:**
- [ ] Can view product variations on `/urunler`
- [ ] Can view variations on `/urun/:slug`
- [ ] Can select variations
- [ ] Variation selection persists to checkout

---

## PHASE 6: Edge Cases & Error Handling

### 6.1 Empty Variations
**Tests:**
- [ ] Product with no variations displays correctly
- [ ] "Henüz varyasyon eklenmemiş" message shows
- [ ] Add variation button is visible

### 6.2 Duplicate Variation Values
**Tests:**
- [ ] Adding duplicate value shows error toast
- [ ] Error message: "Bu değer zaten mevcut"
- [ ] Duplicate is NOT added to database

### 6.3 Special Characters in Values
**Tests:**
- [ ] Turkish characters (ş, ı, ğ, ü, ö, ç) work correctly
- [ ] Values with spaces (e.g., "1. Sınıf") display correctly
- [ ] Values with asterisk (e.g., "*4") display correctly

### 6.4 Maximum Variations
**Tests:**
- [ ] Adding 5+ variation types shows warning
- [ ] UI limits visible types (max 5 per product)

### 6.5 Concurrent Edits
**Tests:**
- [ ] Two admins editing same product variations
- [ ] Last save wins (optimistic locking)
- [ ] No data corruption

---

## PHASE 7: Performance & Load Testing

### 7.1 Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM product_variations
WHERE product_id = 'TEST_ID'
ORDER BY display_order;
```

- [ ] Query uses index on (product_id, display_order)
- [ ] Execution time < 10ms

### 7.2 Bulk Operations
**Tests:**
- [ ] Loading 100+ products with variations
- [ ] Page load time < 2 seconds
- [ ] No console errors

### 7.3 Cache Invalidation
**Tests:**
- [ ] Adding variation invalidates product query cache
- [ ] Deleting variation updates UI immediately
- [ ] useQuery cache updates correctly

---

## PHASE 8: TypeScript Type Safety

### 8.1 Type Definitions Check
**File:** `src/types/multiSupplier.ts`

```typescript
// Verify this matches database
export type ProductVariationType =
  | 'size'
  | 'packaging'
  | 'quality'
  | 'other';
```

- [ ] Type definition includes only valid types
- [ ] No deprecated types (type, scent, material, flavor)
- [ ] Build passes: `npm run build` or `npx tsc --noEmit`

### 8.2 Component Props Type Check
**Files to verify:**
- `src/components/supplier/VariationModal.tsx`
- `src/components/admin/ProductVariationsRow.tsx`
- `src/hooks/useProductVariations.ts`

- [ ] All components use `ProductVariationType` correctly
- [ ] No hardcoded type strings
- [ ] Type narrowing works correctly

---

## PHASE 9: Migration Rollback Test

### 9.1 Rollback Procedure
```sql
-- Test rollback procedure
BEGIN;

-- Restore from backup
TRUNCATE TABLE public.product_variations;
INSERT INTO public.product_variations
SELECT * FROM public.product_variations_backup_20260111;

-- Verify restored data
SELECT COUNT(*) FROM public.product_variations;

COMMIT;
```

- [ ] Rollback restores original data
- [ ] Count matches pre-migration
- [ ] Invalid types restored (if rollback needed)

### 9.2 Re-apply Migration After Rollback
- [ ] Migration runs successfully again
- [ ] No duplicate data issues
- [ ] Cleanup completes successfully

---

## PHASE 10: Data Integrity Checks

### 10.1 Orphaned Variations
```sql
-- Find variations without products
SELECT pv.*
FROM public.product_variations pv
LEFT JOIN public.products p ON pv.product_id = p.id
WHERE p.id IS NULL;
```

- [ ] No orphaned variations found

### 10.2 Supplier Product Variations
```sql
-- Check junction table integrity
SELECT COUNT(*)
FROM public.supplier_product_variations spv
LEFT JOIN public.product_variations pv ON spv.variation_id = pv.id
WHERE pv.id IS NULL;
```

- [ ] No broken foreign keys in junction table

### 10.3 Display Order Consistency
```sql
-- Check for gaps or duplicates in display_order
SELECT
  product_id,
  variation_type,
  display_order,
  COUNT(*)
FROM public.product_variations
GROUP BY product_id, variation_type, display_order
HAVING COUNT(*) > 1;
```

- [ ] No duplicate display_order values per type

---

## PHASE 11: Cross-Browser Testing

### Browsers to Test:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Tests:
- [ ] Variation selector works on all browsers
- [ ] Add/edit/delete variations work
- [ ] Modal dialogs render correctly
- [ ] Touch interactions work on mobile

---

## PHASE 12: Accessibility Testing

### 12.1 Keyboard Navigation
- [ ] Tab key focuses variation buttons
- [ ] Enter/Space selects variation
- [ ] Escape closes modals
- [ ] Focus trap in VariationModal

### 12.2 Screen Reader
- [ ] Variation buttons have aria-label
- [ ] Selected state announced
- [ ] Error messages are accessible

### 12.3 Visual Contrast
- [ ] Selected variation has sufficient contrast
- [ ] Disabled states are visible
- [ ] Error messages are readable

---

## PASS/FAIL Criteria

### CRITICAL (Must Pass):
- [ ] No invalid variation types remain in database
- [ ] Only valid types exist: size, packaging, quality, other
- [ ] All admin pages function without errors
- [ ] All customer pages display variations correctly
- [ ] TypeScript compilation passes
- [ ] No runtime errors in browser console

### IMPORTANT (Should Pass):
- [ ] All role-based access works
- [ ] Performance acceptable (< 2s page loads)
- [ ] Edge cases handled gracefully
- [ ] Migration rollback procedure tested

### NICE TO HAVE:
- [ ] All browsers tested
- [ ] Accessibility verified
- [ ] Performance optimized

---

## Test Execution Log

**Tester:** _______________
**Date:** _______________
**Migration Files:**
- [ ] `20260111000000_remove_invalid_variation_types.sql` executed
- [ ] `20260111010000_fix_variation_types.sql` executed

**Pre-Migration Count:** _____ variations
**Post-Migration Count:** _____ variations
**Deleted Count:** _____ variations

**Issues Found:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

## Quick Verification Commands

### One-Line Check
```bash
# Run this single command to verify migration success
psql $DATABASE_URL -c "SELECT variation_type, COUNT(*) FROM public.product_variations GROUP BY variation_type ORDER BY variation_type;"
```

**Expected Output:**
```
 variation_type | count
----------------+-------
 other          |     X
 packaging      |     X
 quality        |     X
 size           |     X
```

### Frontend Console Check
```javascript
// Run in browser console
fetch('/api/rest/product_variations?select=variation_type')
  .then(r => r.json())
  .then(data => {
    const types = [...new Set(data.map(v => v.variation_type))];
    console.log('Variation types:', types.sort());
    const invalid = types.filter(t => !['size','packaging','quality','other'].includes(t));
    console.log('Invalid types:', invalid);
  });
```

**Expected:** No invalid types logged

---

**Document Version:** 1.0
**Last Updated:** 2026-01-11
**Status:** Ready for Testing
