# Stream 2.1: useMultiSupplierProducts Hook Review

## Executive Summary

**Overall Code Quality Score: 6/10**

This hook is well-structured and uses React Query appropriately, but has **critical issues** that prevent supplier products from being displayed correctly in the UI. The main problems are:

1. **Type mismatch in `useProductWithSuppliers`** - Returns incompatible structure
2. **Missing `supplier_product_id` in RPC return type** - Causes tracking issues
3. **Insufficient error context** - Makes debugging difficult
4. **No retry logic** for transient failures
5. **Direct table access instead of RPC** for some operations (bypasses RLS)

## Critical Issues

| Issue | Severity | Location | Impact |
|-------|----------|----------|--------|
| **Type mismatch: ProductWithSuppliers returns incompatible structure** | HIGH | Line 85-95 | UI cannot display supplier data correctly |
| **Missing `supplier_product_id` in `SupplierProductInfo` from RPC** | HIGH | RPC vs Types | Cart cannot track which supplier product was selected |
| **Direct `supplier_products` table access bypasses RLS policies** | CRITICAL | Lines 111, 158, 199, 228, 265, 302 | Security risk - may expose unauthorized data |
| **No optimistic updates** | MEDIUM | All mutations | Poor UX - slow feedback |
| **Missing error classification** | MEDIUM | All error handlers | Users see raw error messages |
| **No request deduplication** | LOW | Lines 17-30 | Potential duplicate queries |

## Code Analysis

### Query Structure

#### RPC Functions Used (CORRECT):
```typescript
// Lines 21-23: Correctly uses RPC for supplier lookup
await supabase.rpc('get_product_suppliers', { p_product_id: productId })

// Lines 40-42: Correctly uses RPC for price stats
await supabase.rpc('get_product_price_stats', { p_product_id: productId })
```

**Issue:** RPC functions use `SECURITY DEFINER` which bypasses RLS. This is intentional for read operations, but the hook also uses direct table access which may not respect RLS correctly.

#### Direct Table Access (PROBLEMATIC):
```typescript
// Line 111-126: Direct INSERT to supplier_products
await supabase.from('supplier_products').insert({ ... })

// Line 158-162: Direct UPDATE to supplier_products
await supabase.from('supplier_products').update({ price }).eq('id', supplierProductId)
```

**Problem:** While RLS policies exist, direct table access without explicit user context may fail if `auth.uid()` is not properly propagated. The RPC functions use `SECURITY DEFINER` to ensure proper access control.

### Type Safety

#### Interface Compliance: 7/10

**Type Mismatch - CRITICAL:**

```typescript
// types/multiSupplier.ts defines ProductWithSuppliers as:
export interface ProductWithSuppliers {
  product_id: string;        // ❌ Hook returns product.id
  product_name: string;      // ❌ Hook returns product.name
  category: string;          // ❌ Hook returns product.category
  unit: string;              // ❌ Hook returns product.unit
  image_url: string | null;  // ❌ Hook returns product.image_url
  suppliers: SupplierProductInfo[];
  stats: PriceStats;
}

// But hook returns (lines 85-95):
return {
  product: {                // ❌ Type mismatch - nested object
    id: product.id,
    name: product.name,
    category: product.category,
    unit: product.unit,
    image_url: Array.isArray(product.images) ? product.images[0] : null,
  },
  suppliers,
  stats,
};
```

**Impact:** Components using this hook will get `product.id` instead of `product_id`, causing undefined values.

**Fix Required:**
```typescript
// Either update the type:
export interface ProductWithSuppliers {
  product: {
    id: string;
    name: string;
    category: string;
    unit: string;
    image_url: string | null;
  };
  suppliers: SupplierProductInfo[];
  stats: PriceStats;
}

// Or update the hook return:
return {
  product_id: product.id,
  product_name: product.name,
  category: product.category,
  unit: product.unit,
  image_url: Array.isArray(product.images) ? product.images[0] : null,
  suppliers,
  stats,
};
```

#### Missing `supplier_product_id` in RPC Return:

```typescript
// RPC function returns (line 160-171):
CREATE OR REPLACE FUNCTION get_product_suppliers(p_product_id UUID)
RETURNS TABLE (
  supplier_id UUID,
  supplier_name TEXT,
  price NUMERIC,
  previous_price NUMERIC,
  price_change public.price_change,
  availability public.availability_status,
  stock_quantity INTEGER,
  quality public.quality_grade,
  delivery_days INTEGER,
  is_featured BOOLEAN
  -- ❌ MISSING: supplier_product_id (the junction table ID)
)
```

**Type Definition Expects:**
```typescript
export interface SupplierProductInfo {
  supplier_product_id: string;  // ❌ Not in RPC return
  supplier_id: string;
  supplier_name: string;
  // ...
}
```

**Impact:** Cart and checkout cannot identify which supplier product to add.

**Fix Required:**
```sql
-- Add to RPC function:
RETURNS TABLE (
  supplier_product_id UUID,  -- Add this
  supplier_id UUID,
  supplier_name TEXT,
  ...
)

-- And update query:
SELECT
  sp.id as supplier_product_id,  -- Add this
  sp.supplier_id,
  s.name,
  ...
```

### Error Handling

#### Try-Catch Coverage: 4/10

**Basic Error Handling Present:**
```typescript
if (error) throw error;  // Lines 25, 44, 66, 74, etc.
```

**Issues:**
1. No error classification (network vs validation vs permissions)
2. Raw error messages exposed to users (line 138: `error.message`)
3. No retry logic for transient failures
4. No error boundaries or fallback data

**Improved Pattern:**
```typescript
export enum SupplierProductError {
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN'
}

function classifyError(error: unknown): SupplierProductError {
  if (error instanceof Error) {
    if (error.message.includes('fetch')) return SupplierProductError.NETWORK;
    if (error.message.includes('permission')) return SupplierProductError.PERMISSION;
    if (error.message.includes('not found')) return SupplierProductError.NOT_FOUND;
  }
  return SupplierProductError.UNKNOWN;
}

// In mutation:
onError: (error: Error) => {
  const errorType = classifyError(error);
  const userMessage = ERROR_MESSAGES[errorType];
  toast.error(userMessage);
  logger.error('Supplier product error', { error: error.message, type: errorType });
}
```

### Performance

#### Query Efficiency: 8/10

**Good:**
- Uses `Promise.all()` for parallel queries (line 69-72)
- Appropriate `staleTime: 60 * 1000` (1 minute)
- RPC functions use indexes (`idx_supplier_products_product_price`, etc.)

**Issues:**
1. **N+1 Risk in `useBulkUpdateSupplierAvailability`:**
```typescript
// Lines 263-274: Sequential updates in a loop
for (const id of supplierProductIds) {
  const { error } = await supabase
    .from('supplier_products')
    .update({ availability })
    .eq('id', id);
  // ❌ N queries for N items
}
```

**Fix:** Use bulk update:
```typescript
const { error } = await supabase
  .from('supplier_products')
  .update({ availability })
  .in('id', supplierProductIds);  // Single query
```

2. **Missing Query Deduplication:**
```typescript
// Lines 17-30: If multiple components call this hook simultaneously
// with the same productId, React Query won't deduplicate without config

// Fix: Add to queryClient defaults:
queryClient.setDefaultOptions({
  queries: {
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,  // Cache for 5 minutes
    retry: 1,  // Retry once on failure
  }
})
```

### RLS Integration

#### RLS Compliance: 5/10

**RLS Policies Exist:**
- `supplier_products` has RLS enabled (migration line 328)
- Policies for authenticated users, suppliers, admins

**Issues:**

1. **RPC Functions Use `SECURITY DEFINER`:**
```sql
-- Line 192: SECURITY DEFINER bypasses RLS
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

This is intentional for read operations (allows suppliers to see products they don't own), but means the functions return ALL active supplier products for a product, not filtered by current user.

2. **Direct Table Access May Fail:**
```typescript
// Line 111: Direct insert
await supabase.from('supplier_products').insert({ ... })
```

This relies on RLS policy:
```sql
CREATE POLICY "Approved suppliers can insert products"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()  -- Requires authenticated user
      AND suppliers.approval_status = 'approved'
  )
)
```

**If `auth.uid()` is not set, this will fail.** The hook doesn't verify authentication before mutations.

3. **Missing Role-Based Filtering:**
The hook doesn't filter results based on user role:
- Admins should see all supplier products
- Suppliers should only see their own
- Public should only see active products

**Fix:**
```typescript
// Add role check before mutations:
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Authentication required');

// For reads, use different queries based on role:
const isAdmin = await checkIsAdmin(user.id);
if (isAdmin) {
  // Show all supplier products
} else {
  // Show only active
}
```

## Code Quality Metrics

| Metric | Score | Notes |
|--------|-------|-------|
| **Maintainability** | 7/10 | Clear function names, but inconsistent return types |
| **Test Coverage** | 0% | No tests found |
| **Type Safety** | 5/10 | Critical type mismatch, missing supplier_product_id |
| **Error Handling** | 4/10 | Basic try-catch, no error classification |
| **Performance** | 8/10 | Good caching, but N+1 in bulk update |
| **Security** | 6/10 | RLS exists, but direct table access risky |
| **Documentation** | 8/10 | Good comments, but missing JSDoc |

## Refactoring Recommendations

### 1. Fix Type Mismatch (CRITICAL)

```typescript
// Option A: Update the hook to match the type
export function useProductWithSuppliers(productId: string) {
  return useQuery({
    queryKey: ['product-with-suppliers', productId],
    queryFn: async (): Promise<ProductWithSuppliers | null> => {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, category, unit, images')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      if (!product) return null;

      const [suppliersResponse, statsResponse] = await Promise.all([
        supabase.rpc('get_product_suppliers', { p_product_id: productId }),
        supabase.rpc('get_product_price_stats', { p_product_id: productId }),
      ]);

      if (suppliersResponse.error) throw suppliersResponse.error;
      if (statsResponse.error) throw statsResponse.error;

      const suppliers = (suppliersResponse.data || []) as SupplierProductInfo[];
      const stats = statsResponse.data?.[0] as ProductPriceStats || {
        min_price: 0,
        max_price: 0,
        avg_price: 0,
        supplier_count: 0,
      };

      // FIX: Match ProductWithSuppliers interface
      return {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        unit: product.unit,
        image_url: Array.isArray(product.images) ? product.images[0] : null,
        suppliers,
        stats,
      };
    },
    enabled: !!productId,
    staleTime: 60 * 1000,
  });
}
```

### 2. Add supplier_product_id to RPC

```sql
-- Migration needed:
CREATE OR REPLACE FUNCTION get_product_suppliers(p_product_id UUID)
RETURNS TABLE (
  supplier_product_id UUID,  -- ADD THIS
  supplier_id UUID,
  supplier_name TEXT,
  price NUMERIC,
  previous_price NUMERIC,
  price_change public.price_change,
  availability public.availability_status,
  stock_quantity INTEGER,
  quality public.quality_grade,
  delivery_days INTEGER,
  is_featured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id as supplier_product_id,  -- ADD THIS
    sp.supplier_id,
    s.name,
    sp.price,
    sp.previous_price,
    sp.price_change,
    sp.availability,
    sp.stock_quantity,
    sp.quality,
    sp.delivery_days,
    sp.is_featured
  FROM public.supplier_products sp
  INNER JOIN public.suppliers s ON s.id = sp.supplier_id
  WHERE sp.product_id = p_product_id
    AND sp.is_active = true
    AND s.is_active = true
  ORDER BY sp.price ASC, sp.is_featured DESC, sp.delivery_days ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 3. Add Error Classification

```typescript
// types/multiSupplier.ts - Add error types
export enum SupplierProductErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  SUPPLIER_NOT_FOUND = 'SUPPLIER_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface SupplierProductError {
  code: SupplierProductErrorCode;
  message: string;
  details?: unknown;
}

// utils/errorHandler.ts
export function classifySupplierProductError(error: unknown): SupplierProductError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('fetch') || message.includes('network')) {
      return {
        code: SupplierProductErrorCode.NETWORK_ERROR,
        message: 'Ağ bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
        details: error.message
      };
    }

    if (message.includes('permission') || message.includes('rls')) {
      return {
        code: SupplierProductErrorCode.PERMISSION_DENIED,
        message: 'Bu işlem için yetkiniz yok.',
        details: error.message
      };
    }

    if (message.includes('jwt') || message.includes('auth')) {
      return {
        code: SupplierProductErrorCode.AUTHENTICATION_REQUIRED,
        message: 'Lütfen giriş yapın.',
        details: error.message
      };
    }

    if (message.includes('not found') || message.includes('empty')) {
      return {
        code: SupplierProductErrorCode.PRODUCT_NOT_FOUND,
        message: 'Ürün bulunamadı.',
        details: error.message
      };
    }
  }

  return {
    code: SupplierProductErrorCode.UNKNOWN_ERROR,
    message: 'Beklenmeyen bir hata oluştu.',
    details: error
  };
}

// Update mutations:
export function useCreateSupplierProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: SupplierProductFormData) => {
      const { data, error } = await supabase
        .from('supplier_products')
        .insert({ /* ... */ })
        .select()
        .single();

      if (error) throw classifySupplierProductError(error);
      return data;
    },
    onError: (error: SupplierProductError) => {
      toast.error(error.message);
      // Log full error for debugging
      console.error('Supplier product error:', error.details);
    },
  });
}
```

### 4. Fix Bulk Update Performance

```typescript
export function useBulkUpdateSupplierAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierProductIds,
      availability,
    }: {
      supplierProductIds: string[];
      availability: 'plenty' | 'limited' | 'last';
    }): Promise<BulkSupplierProductResult> => {
      // FIX: Use single bulk query instead of loop
      const { data, error } = await supabase
        .from('supplier_products')
        .update({ availability })
        .in('id', supplierProductIds)
        .select('id');

      if (error) throw error;

      // Check which IDs were actually updated
      const updatedIds = new Set(data?.map(d => d.id) || []);
      const succeeded = supplierProductIds.filter(id => updatedIds.has(id));
      const failed = supplierProductIds
        .filter(id => !updatedIds.has(id))
        .map(id => ({ id, error: 'Not updated' }));

      return { success: failed.length === 0, succeeded, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });

      if (result.success) {
        toast.success(`${result.succeeded.length} ürün güncellendi`);
      } else {
        toast.warning(
          `${result.succeeded.length} ürün güncellendi, ${result.failed.length} başarısız`
        );
      }
    },
  });
}
```

### 5. Add Authentication Check

```typescript
// Add helper function:
async function ensureAuthenticated() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw {
      code: SupplierProductErrorCode.AUTHENTICATION_REQUIRED,
      message: 'Lütfen giriş yapın.'
    };
  }

  return user;
}

// Update mutations:
export function useCreateSupplierProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: SupplierProductFormData) => {
      // Ensure user is authenticated
      await ensureAuthenticated();

      const { data, error } = await supabase
        .from('supplier_products')
        .insert({ /* ... */ })
        .select()
        .single();

      if (error) throw classifySupplierProductError(error);
      return data;
    },
    // ... rest of mutation
  });
}
```

### 6. Add Optimistic Updates

```typescript
export function useUpdateSupplierProductPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierProductId,
      price,
    }: {
      supplierProductId: string;
      price: number;
    }) => {
      const { data, error } = await supabase
        .from('supplier_products')
        .update({ price })
        .eq('id', supplierProductId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ supplierProductId, price }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['product-suppliers'] });

      // Snapshot previous value
      const previousSuppliers = queryClient.getQueryData(['product-suppliers']);

      // Optimistically update to the new value
      queryClient.setQueryData(['product-suppliers'], (old: SupplierProductInfo[] | undefined) => {
        if (!old) return old;
        return old.map(supplier =>
          supplier.supplier_product_id === supplierProductId
            ? { ...supplier, price }
            : supplier
        );
      });

      // Return context with previous value
      return { previousSuppliers };
    },
    onError: (error, variables, context) => {
      // Rollback to previous value
      if (context?.previousSuppliers) {
        queryClient.setQueryData(['product-suppliers'], context.previousSuppliers);
      }
      toast.error('Fiyat güncellenirken hata: ' + error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['product-price-stats'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      toast.success('Fiyat güncellendi');
    },
  });
}
```

## Integration Test Scenarios

### Unit Tests Needed

```typescript
// src/hooks/__tests__/useMultiSupplierProducts.test.ts

describe('useMultiSupplierProducts', () => {
  describe('useProductWithSuppliers', () => {
    it('should return product with matching structure', async () => {
      const { result } = renderHook(() => useProductWithSuppliers('test-product-id'), {
        wrapper: createQueryClientWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Type check: Should have product_id, not product.id
      expect(result.current.data).toMatchObject({
        product_id: expect.any(String),
        product_name: expect.any(String),
        category: expect.any(String),
        unit: expect.any(String),
        image_url: expect.any(String),
        suppliers: expect.any(Array),
        stats: expect.any(Object)
      });
    });

    it('should handle missing product gracefully', async () => {
      // Mock RPC to return null
      const { result } = renderHook(() => useProductWithSuppliers('nonexistent-id'), {
        wrapper: createQueryClientWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeNull();
    });
  });

  describe('useCreateSupplierProduct', () => {
    it('should require authentication', async () => {
      const { result } = renderHook(() => useCreateSupplierProduct(), {
        wrapper: createQueryClientWrapper()
      });

      // Mock unauthenticated state
      mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            product_id: 'test-id',
            supplier_id: 'test-supplier',
            price: 100,
            stock_quantity: 50,
            availability: 'plenty'
          });
        } catch (error) {
          expect(error.code).toBe(SupplierProductErrorCode.AUTHENTICATION_REQUIRED);
        }
      });
    });
  });
});
```

### Integration Tests Needed

```typescript
// tests/integration/supplier-products-flow.test.ts

describe('Supplier Products Integration', () => {
  it('should display supplier products on product detail page', async () => {
    // 1. Create product with multiple suppliers
    const productId = await createProductWithMultipleSuppliers();

    // 2. Navigate to product detail
    await page.goto(`/products/${productId}`);

    // 3. Verify all suppliers are shown
    const supplierCards = await page.locator('[data-testid="supplier-card"]').all();
    expect(supplierCards.length).toBeGreaterThan(1);

    // 4. Verify lowest price is highlighted
    const lowestPriceCard = await page.locator('[data-testid="supplier-card"][data-is-lowest="true"]');
    expect(await lowestPriceCard.isVisible()).toBe(true);
  });

  it('should add correct supplier product to cart', async () => {
    // 1. View product with multiple suppliers
    const productId = 'test-product-with-suppliers';
    await page.goto(`/products/${productId}`);

    // 2. Click "Add to Cart" on second supplier
    await page.locator('[data-testid="supplier-card"]').nth(1).locator('button:has-text("Sepete Ekle")').click();

    // 3. Check cart contains correct supplier_product_id
    await page.goto('/cart');
    const cartItem = await page.locator('[data-testid="cart-item"]').first();
    const supplierProductId = await cartItem.getAttribute('data-supplier-product-id');

    expect(supplierProductId).toBeTruthy(); // Should have supplier_product_id
  });
});
```

### Database Tests Needed

```sql
-- tests/supplier-products-rls.test.sql

-- Test 1: Authenticated user can view active supplier products
BEGIN;
  SET LOCAL jwt.claims.sub = 'TEST_USER_ID';
  SELECT * FROM get_product_suppliers('TEST_PRODUCT_ID');
  -- Expected: Returns all active supplier products for this product
ROLLBACK;

-- Test 2: Anonymous user cannot access
BEGIN;
  SET ROLE anon;
  SELECT * FROM get_product_suppliers('TEST_PRODUCT_ID');
  -- Expected: Permission denied
ROLLBACK;

-- Test 3: Supplier can insert their own product
BEGIN;
  SET LOCAL jwt.claims.sub = 'SUPPLIER_USER_ID';
  INSERT INTO supplier_products (supplier_id, product_id, price, stock_quantity)
  VALUES (
    (SELECT id FROM suppliers WHERE user_id = 'SUPPLIER_USER_ID'),
    'TEST_PRODUCT_ID',
    100,
    50
  );
  -- Expected: 1 row inserted
ROLLBACK;

-- Test 4: Supplier cannot update another supplier's product
BEGIN;
  SET LOCAL jwt.claims.sub = 'SUPPLIER_1_USER_ID';
  UPDATE supplier_products
  SET price = 1
  WHERE id = (SELECT id FROM supplier_products WHERE supplier_id = (SELECT id FROM suppliers WHERE user_id = 'SUPPLIER_2_USER_ID' LIMIT 1) LIMIT 1);
  -- Expected: No rows updated (RLS blocks it)
ROLLBACK;
```

## Summary

The `useMultiSupplierProducts` hook is functional but has critical type mismatches and missing error handling that prevent proper supplier product display. The main issues are:

1. **Type mismatch in `useProductWithSuppliers`** - Returns nested `product` object instead of flat structure expected by `ProductWithSuppliers` type
2. **Missing `supplier_product_id`** - RPC function doesn't return junction table ID needed for cart tracking
3. **Direct table access** - May bypass RLS in some cases
4. **No error classification** - Raw error messages exposed to users
5. **N+1 query in bulk update** - Sequential updates instead of single bulk query

**Priority fixes:**
1. Fix type mismatch (CRITICAL - blocks UI)
2. Add `supplier_product_id` to RPC (CRITICAL - blocks cart)
3. Add error classification (HIGH - UX)
4. Fix bulk update N+1 (MEDIUM - performance)
5. Add optimistic updates (LOW - UX)
