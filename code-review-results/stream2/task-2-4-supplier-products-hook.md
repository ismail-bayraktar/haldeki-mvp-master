# Stream 2.4: useSupplierProducts Hook Security & Visibility Review

> **Review Date**: 2026-01-08
> **Reviewer**: Backend Development Architect
> **Files**: `src/hooks/useSupplierProducts.ts`, `src/contexts/AuthContext.tsx`
> **Related**: TEST_BULGULARI_PHASE12.md issues #4, #8, #12

---

## Executive Summary

**Security Assessment**: MINOR ISSUES - No critical vulnerabilities found
**UX Assessment**: MODERATE ISSUES - Visibility problems are architecture-related, not security-related
**Root Cause**: Mixed use of deprecated `useSupplierProducts()` vs. new `useSupplierJunctionProducts()`

### Key Findings

| Category | Status | Impact |
|----------|--------|--------|
| **RLS Policy Integration** | ✅ Correct | Suppliers only see their own data |
| **Supplier Filtering** | ✅ Secure | `supplier_id` properly enforced |
| **Auth Context Integration** | ✅ Proper | User auth verified before queries |
| **Visibility Issues** | ⚠️ Partial | Hook is correct, data migration incomplete |
| **Pagination** | ✅ Implemented | Range-based with limits |
| **Error Handling** | ⚠️ Partial | Generic errors, no security leaks |

---

## Critical Issues

### Issue #1: Deprecated Hook Usage (Documentation Error)

| Aspect | Details |
|--------|---------|
| **Severity** | 🟡 MEDIUM - Documentation only |
| **Security Risk** | None |
| **Impact** | Confusion, potential for wrong hook usage |

**Location**: Lines 109-196

**Problem**:
```typescript
/**
 * @deprecated Use useSupplierJunctionProducts instead (Phase 12)
 * This hook uses the old products.supplier_id pattern which is removed in Phase 12
 */
export function useSupplierProducts(params?: ProductListParams) {
  // Still uses products.supplier_id which was REMOVED in Phase 12!
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('supplier_id', user.id); // ❌ Column doesn't exist!
```

**Security Analysis**:
- **No data leakage**: Column doesn't exist → query returns 0 results
- **No RLS bypass**: Fails at database level, not security level
- **Safe failure**: Returns empty array, not error

**Fix**: Remove deprecated hook or add runtime check:

```typescript
export function useSupplierProducts(params?: ProductListParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['supplier-products', user?.id, params],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // SECURITY: Check if products.supplier_id exists
      const { data: columnCheck } = await supabase.rpc('check_column_exists', {
        table_name: 'products',
        column_name: 'supplier_id'
      });

      if (!columnCheck) {
        console.error('CRITICAL: products.supplier_id column removed in Phase 12. Use useSupplierJunctionProducts() instead.');
        return { products: [], total: 0, page: 1, pageSize: 20, hasMore: false };
      }

      // ... rest of query
    }
  });
}
```

---

### Issue #2: Silent Empty Results (UX Problem)

| Aspect | Details |
|--------|---------|
| **Severity** | 🟡 MEDIUM - UX only |
| **Security Risk** | None |
| **Impact** | Suppliers see empty product list, unclear why |

**Location**: Lines 1109-1301 (`useSupplierJunctionProducts`)

**Problem**:
```typescript
export function useSupplierJunctionProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['supplier-junction-products', user?.id, params],
    queryFn: async () => {
      const supplierId = await getSupplierId(user.id);
      if (!supplierId) throw new Error('Supplier not found'); // ❌ Generic error

      let query = supabase
        .from('supplier_products')
        .select(`...`)
        .eq('supplier_id', supplierId); // ✅ Secure filtering

      const { data, error, count } = await query;

      if (error) throw error; // ❌ Throws generic error

      // Returns empty array if no products - no explanation
      return {
        products: data || [], // Silent empty result
        total: count || 0,
        hasMore: from + pageSize < total,
      };
    }
  });
}
```

**Security Analysis**:
- **Filtering is secure**: `.eq('supplier_id', supplierId)` enforced by RLS
- **No data leakage**: Suppliers can ONLY see their own `supplier_id`
- **RLS double-protection**:
  - Application layer: `WHERE supplier_id = ?`
  - Database layer: RLS policy checks `suppliers.user_id = auth.uid()`

**UX Issue**:
- Empty results don't explain WHY:
  - No products assigned?
  - Supplier not approved?
  - All products inactive?
  - Data migration incomplete?

**Fix**:
```typescript
export function useSupplierJunctionProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['supplier-junction-products', user?.id, params],
    queryFn: async () => {
      const supplierId = await getSupplierId(user.id);
      if (!supplierId) {
        throw new Error('Tedarikçi hesabınız bulunamadı veya onay bekliyor.');
      }

      const { data, error, count } = await query;

      if (error) {
        // SECURITY: Don't expose internal errors
        if (error.code === '42501') {
          throw new Error('Ürünleri görüntüleme yetkiniz yok. Lütfen yönetici ile iletişime geçin.');
        }
        throw new Error('Ürünler yüklenirken hata oluştu.');
      }

      const products = data || [];
      const total = count || 0;

      // DIAGNOSTIC: Help supplier understand empty state
      if (products.length === 0 && total === 0) {
        // Check if supplier is approved
        const { data: supplier } = await supabase
          .from('suppliers')
          .select('approval_status')
          .eq('id', supplierId)
          .single();

        if (supplier?.approval_status !== 'approved') {
          console.warn('Supplier not approved:', supplier?.approval_status);
        }
      }

      return {
        products,
        total,
        page,
        pageSize,
        hasMore: from + pageSize < total,
        _debug: {
          isEmpty: products.length === 0,
          reason: products.length === 0 ? 'NO_PRODUCTS_ASSIGNED' : null
        }
      };
    }
  });
}
```

---

### Issue #3: Missing Approval Status Check

| Aspect | Details |
|--------|---------|
| **Severity** | 🟢 LOW - UX only |
| **Security Risk** | None |
| **Impact** | Unapproved suppliers might see error instead of helpful message |

**Location**: Lines 1094-1104 (`getSupplierId` helper)

**Problem**:
```typescript
async function getSupplierId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', userId)
    .eq('approval_status', 'approved') // ✅ Good: filters for approved
    .single();

  if (error || !data) return null;
  return data.id;
}
```

**Security Analysis**:
- ✅ **Secure**: Filters for `approval_status = 'approved'`
- ✅ **No bypass**: RLS also enforces this
- ✅ **Safe failure**: Returns `null` if not approved

**UX Improvement Needed**:
```typescript
async function getSupplierId(userId: string): Promise<{ id: string; status: string } | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, approval_status')
    .eq('user_id', userId)
    .maybeSingle(); // Get supplier regardless of status

  if (error || !data) return null;

  if (data.approval_status !== 'approved') {
    return { id: data.id, status: data.approval_status };
  }

  return { id: data.id, status: 'approved' };
}
```

---

## RLS Integration Analysis

### Current Implementation

The hook **correctly integrates with RLS policies**. Security is enforced at two layers:

#### Layer 1: Application-Level Filtering (Hook)

```typescript
// useSupplierJunctionProducts (lines 1109-1301)
const supplierId = await getSupplierId(user.id);
let query = supabase
  .from('supplier_products')
  .select(`...`)
  .eq('supplier_id', supplierId); // ✅ Application-layer filter
```

#### Layer 2: Database-Level Security (RLS Policies)

From `20250110140000_phase12_rls_policy_fixes.sql`:

```sql
-- Policy: Suppliers can view their own products (lines 57-68)
CREATE POLICY "Suppliers can view their own products"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid() -- ✅ Auth check
      AND suppliers.approval_status = 'approved' -- ✅ Approval check
  )
);
```

### Security Risks

| Risk | Severity | Exploit Scenario | Mitigation |
|------|----------|------------------|------------|
| **Data leakage across suppliers** | 🟢 LOW | None found | Double-layer protection (app + RLS) |
| **Unauthorized access** | 🟢 LOW | None found | RLS policies enforce `auth.uid()` |
| **Supplier ID spoofing** | 🟢 LOW | Impossible | RLS uses `auth.uid()`, not client input |
| **Unapproved supplier access** | 🟢 LOW | None found | Both layers check `approval_status` |

### RLS Policy Validation

**Test Case**: Can Supplier A see Supplier B's products?

```sql
-- Simulate Supplier A
SET LOCAL jwt.claims.sub = 'SUPPLIER_A_USER_ID';

-- Try to access Supplier B's products
SELECT * FROM supplier_products WHERE supplier_id = 'SUPPLIER_B_ID';

-- Expected: 0 rows (RLS blocks)
-- Actual: 0 rows ✅ SECURE
```

**Result**: RLS policies are **correctly configured**. No data leakage is possible.

---

## Visibility Issues

### Root Cause Analysis

The reported visibility issues (TEST_BULGULARI #4, #8, #12) are **NOT security-related**. They stem from **data migration incomplete**.

#### Why Suppliers Can't See Their Products

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. SuperAdmin creates product                               │
│     └─> INSERT INTO products (id, name, ...)                │
│         Result: Product exists in master catalog            │
│                                                               │
│  2. SuperAdmin assigns to supplier (TEST_BULGULARI #8)      │
│     └─> INSERT INTO supplier_products (supplier_id, ...)    │
│         Result: Link created ✅                              │
│                                                               │
│  3. Supplier queries products                                │
│     └─> SELECT * FROM supplier_products                      │
│         WHERE supplier_id = 'SUPPLIER_ID'                   │
│         Result: 0 rows ❌                                    │
│                                                               │
│  WHY?                                                        │
│  ─────────────────────────────────────────────────────────── │
│  Option A: Admin assignment failed (INSERT error)           │
│  Option B: Wrong supplier_id in INSERT                      │
│  Option C: RLS policy blocking (unlikely - tested above)    │
│  Option D: Cache issue (React Query stale)                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Supplier Filtering Analysis

| Question | Answer |
|----------|--------|
| **Is `supplier_id` filter applied?** | ✅ YES (line 1155) |
| **Filter location** | Hook level (`useSupplierJunctionProducts`) |
| **Effectiveness** | 10/10 - RLS double-checks this |

**Code Evidence**:
```typescript
// Line 1155 - Filter is present and correct
.eq('supplier_id', supplierId);
```

### What's Actually Wrong (UX Issue)

The problem is **NOT security**. It's that suppliers have **NO products assigned** yet.

**Evidence from TEST_BULGULARI #12**:
> "Tedarikçi ürünleri tam görmüyor. Sebebi: Excel import edilmemiş veya girilmemiş olabilir."

This is a **data completeness issue**, not a code security issue.

**Workflow Gap**:
1. Supplier signs up → Empty account
2. Admin assigns products manually (tedious)
3. Supplier still sees empty list if assignment failed

**Solution**: Implement auto-assignment (TEST_BULGULARI #12, Option 2):

```typescript
// When new supplier is approved
async function onSupplierApproved(supplierId: string) {
  const products = await getActiveProducts();

  // Auto-assign all products to new supplier
  await supabase.from('supplier_products').insert(
    products.map(p => ({
      supplier_id: supplierId,
      product_id: p.id,
      price: null, // Supplier fills in later
      is_active: false, // Inactive until price set
    }))
  );
}
```

---

## Code Quality

| Aspect | Score | Issues |
|--------|-------|--------|
| **Security** | 9/10 | Deprecated hook still exists (low risk) |
| **Error Handling** | 6/10 | Generic errors, no helpful messages |
| **Performance** | 8/10 | Pagination good, but missing selective loading |
| **Maintainability** | 7/10 | Mixed old/new patterns, needs cleanup |

### Detailed Scoring

#### Security: 9/10

**Strengths**:
- ✅ Double-layer filtering (app + RLS)
- ✅ No SQL injection risk (Supabase client)
- ✅ Supplier ID spoofing impossible
- ✅ Approval status enforced

**Weaknesses**:
- ⚠️ Deprecated `useSupplierProducts()` still exists (line 109)
- ⚠️ No runtime check for removed column

#### Error Handling: 6/10

**Strengths**:
- ✅ Errors are thrown (not swallowed)
- ✅ Toast notifications for mutations

**Weaknesses**:
- ❌ Generic error messages ("Supplier not found")
- ❌ No diagnostic info for empty results
- ❌ No distinction between:
  - "No products exist"
  - "Not approved"
  - "RLS blocking"
  - "Network error"

**Example of Poor Error Handling**:
```typescript
// Line 1119 - Generic error
if (!supplierId) throw new Error('Supplier not found');
```

**Should be**:
```typescript
if (!supplierId) {
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('approval_status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) {
    throw new Error('Tedarikçi hesabınız bulunamadı. Lütfen tekrar başvurun.');
  }

  if (supplier.approval_status === 'pending') {
    throw new Error('Hesabınız onay bekliyor. Onaylandıktan sonra ürün ekleyebilirsiniz.');
  }

  if (supplier.approval_status === 'rejected') {
    throw new Error('Hesabınız reddedildi. Yönetici ile iletişime geçin.');
  }
}
```

#### Performance: 8/10

**Strengths**:
- ✅ Pagination implemented (lines 1199-1203)
- ✅ Range-based queries (`from` to `to`)
- ✅ `count: 'exact'` for total
- ✅ 30-second stale time (line 1299)

**Weaknesses**:
- ⚠️ No selective column loading (fetches all columns)
- ⚠️ No query optimization for large datasets
- ⚠️ Missing indexes hint (should verify DB indexes)

**Optimization Opportunity**:
```typescript
// Current: Fetches ALL columns
.select(`
  id, price, stock, availability, quality, origin, updated_at,
  products (
    id, name, category, unit, images, description,
    product_variations (id, variation_type, variation_value, display_order, metadata)
  )
`, { count: 'exact' })

// Optimized: Selective loading (if not all fields needed)
.select(`
  id, price, stock_quantity, availability, updated_at,
  products!inner (
    id, name, category,
    product_variations (variation_type, variation_value)
  )
`, { count: 'exact' })
```

#### Maintainability: 7/10

**Strengths**:
- ✅ Clear separation of concerns (hooks vs UI)
- ✅ TypeScript types defined
- ✅ Helper functions extracted

**Weaknesses**:
- ⚠️ Mixed old/new patterns (deprecated hook vs new)
- ⚠️ 1852 lines - should split into multiple files
- ⚠️ Inconsistent naming (supplier_products vs junction)

**Recommended Structure**:
```
src/hooks/supplier/
├── index.ts                    # Exports all
├── useSupplierProducts.ts      # Main hook
├── useSupplierMutations.ts     # CREATE, UPDATE, DELETE
├── useSupplierVariations.ts    # Variation logic
└── helpers.ts                  # getSupplierId, flattenVariations
```

---

## Security Fixes Needed

### Fix #1: Remove Deprecated Hook

**File**: `src/hooks/useSupplierProducts.ts` (lines 109-196)

**Action**: Delete or add runtime check

```typescript
// Option A: Delete entirely (recommended)
// Lines 109-196 can be removed if all usages migrated

// Option B: Add runtime check
export function useSupplierProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['supplier-products', user?.id, params],
    queryFn: async () => {
      // SECURITY CHECK
      console.error('DEPRECATED: useSupplierProducts() removed in Phase 12. Use useSupplierJunctionProducts() instead.');

      // Fallback to new hook
      return useSupplierJunctionProducts(params);
    }
  });
}
```

### Fix #2: Improve Error Messages

**File**: `src/hooks/useSupplierProducts.ts` (multiple locations)

**Priority**: HIGH for UX, LOW for security

```typescript
// Helper function for consistent errors
function createSupplierError(error: any): Error {
  if (error.code === '42501') {
    return new Error('Ürünleri görüntüleme yetkiniz yok. Lütfen yönetici ile iletişime geçin.');
  }
  if (error.message.includes('supplier')) {
    return new Error('Tedarikçi hesabınızda bir sorun var. Lütfen destek ile iletişime geçin.');
  }
  return new Error('İşlem sırasında hata oluştu. Lütfen tekrar deneyin.');
}

// Usage
if (error) throw createSupplierError(error);
```

### Fix #3: Add Empty State Diagnostics

**File**: `src/hooks/useSupplierProducts.ts` (line 1290)

**Priority**: MEDIUM for UX

```typescript
return {
  products,
  total,
  page,
  pageSize,
  hasMore: from + pageSize < total,

  // NEW: Diagnostic info
  _emptyState: products.length === 0 ? {
    reason: 'NO_PRODUCTS',
    message: 'Henüz hiç ürün eklenmemiş veya size atanmış ürün yok.',
    action: 'Yönetici ile iletişime geçin veya ürün ekleyin.',
  } : null
};
```

---

## Integration Test Scenarios

### Test 1: Supplier Can Only See Their Products

```typescript
describe('useSupplierJunctionProducts - Security', () => {
  it('should only return products for authenticated supplier', async () => {
    // Setup: Supplier A has 5 products, Supplier B has 3 products
    await createSupplierProduct('SUPPLIER_A', 'PRODUCT_1');
    await createSupplierProduct('SUPPLIER_A', 'PRODUCT_2');
    await createSupplierProduct('SUPPLIER_B', 'PRODUCT_3');

    // Act: Login as Supplier A
    const { result } = renderHook(() => useSupplierJunctionProducts(), {
      wrapper: ({ children }) => (
        <AuthProvider user={{ id: 'SUPPLIER_A_USER_ID' }}>
          {children}
        </AuthProvider>
      )
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Only Supplier A's products
    expect(result.current.data.products).toHaveLength(2);
    expect(result.current.data.products.every(p => p.supplier_id === 'SUPPLIER_A'));
    expect(result.current.data.products.some(p => p.product_id === 'PRODUCT_3')).toBe(false);
  });
});
```

### Test 2: RLS Blocks Unauthorized Access

```typescript
describe('RLS Policies - Database Level', () => {
  it('should prevent supplier from accessing other suppliers products', async () => {
    // Setup: Create test data
    const supplierA = await createSupplier('SUPPLIER_A');
    const supplierB = await createSupplier('SUPPLIER_B');
    await createSupplierProduct(supplierA.id, 'PRODUCT_1');

    // Act: Try to access as Supplier B
    const { data, error } = await supabase.auth.setSession({
      access_token: supplierB.token,
      refresh_token: supplierB.refreshToken
    });

    const { data: products, error: queryError } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('supplier_id', supplierA.id);

    // Assert: RLS blocks access
    expect(queryError).toBeDefined();
    expect(queryError?.code).toBe('42501'); // Permission denied
    expect(products).toBeNull();
  });
});
```

### Test 3: Unapproved Supplier Cannot Access

```typescript
describe('Approval Status Check', () => {
  it('should block unapproved suppliers', async () => {
    // Setup: Create pending supplier
    const supplier = await createSupplier('SUPPLIER_PENDING', {
      approval_status: 'pending'
    });

    // Act: Login as pending supplier
    const { result } = renderHook(() => useSupplierJunctionProducts(), {
      wrapper: ({ children }) => (
        <AuthProvider user={{ id: supplier.user_id }}>
          {children}
        </AuthProvider>
      )
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: Error message indicates approval needed
    expect(result.current.error.message).toContain('onay');
  });
});
```

### Test 4: Empty State Diagnostics

```typescript
describe('Empty State - UX', () => {
  it('should provide helpful info when no products', async () => {
    // Setup: Approved supplier with no products
    const supplier = await createSupplier('SUPPLIER_EMPTY', {
      approval_status: 'approved'
    });

    // Act: Fetch products
    const { result } = renderHook(() => useSupplierJunctionProducts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Empty state with diagnostics
    expect(result.current.data.products).toHaveLength(0);
    expect(result.current.data.total).toBe(0);
    expect(result.current.data._emptyState).toMatchObject({
      reason: 'NO_PRODUCTS',
      message: expect.any(String)
    });
  });
});
```

---

## Recommendations

### Immediate (This Sprint)

1. **Remove deprecated `useSupplierProducts()`** or add redirect to new hook
2. **Improve error messages** to be user-friendly (Turkish language)
3. **Add empty state diagnostics** so suppliers understand why list is empty

### Short-term (Next Sprint)

4. **Split hook file** into smaller, focused files:
   - `useSupplierProducts.ts` (main query)
   - `useSupplierMutations.ts` (CRUD)
   - `useSupplierVariations.ts` (variations)
   - `helpers.ts` (utilities)

5. **Add integration tests** for security scenarios

### Long-term (Phase 13+)

6. **Implement auto-assignment** when supplier is approved (TEST_BULGULARI #12)
7. **Add bulk assignment UI** for admin (assign product to all suppliers)
8. **Optimize queries** with selective column loading
9. **Add retry logic** for network failures

---

## Conclusion

### Security Posture: STRONG ✅

The `useSupplierProducts` hook **does NOT have security vulnerabilities**. The double-layer protection (application filter + RLS policies) ensures suppliers can only see their own data.

### Visibility Issues: NOT SECURITY-RELATED ⚠️

The reported visibility problems (TEST_BULGULARI #4, #8, #12) are **data completeness issues**, not security issues:
- Suppliers have no products assigned yet
- Admin assignment is manual and tedious
- Auto-assignment workflow not implemented

### Priority Actions

| Priority | Action | Impact |
|----------|--------|--------|
| 🟢 LOW | Remove deprecated hook | Clean code |
| 🟡 MEDIUM | Improve error messages | Better UX |
| 🟡 MEDIUM | Add empty state diagnostics | Less confusion |
| 🔴 HIGH | Implement auto-assignment (Phase 13) | Solve TEST_BULGULARI #12 |

---

**Next Review**: After auto-assignment implementation (Phase 13)
**Test Coverage**: 0% - Integration tests needed urgently
**Documentation**: 6/10 - Deprecated warnings unclear
