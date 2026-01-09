# Stream 6.2: Supplier Assignment Automation Review

## Executive Summary

**Automation Potential Score: 8.5/10**

Current supplier assignment workflow is **fully manual** with significant optimization opportunities. The codebase has solid foundations (RPC functions, hooks, UI components) but lacks critical automation features. Post-assignment visibility issues indicate RLS/cache problems that block workflow completion.

---

## Current Workflow Analysis

### Manual Assignment Steps

1. **SuperAdmin creates product** → `products` table (automatic)
2. **SuperAdmin opens product detail** → Click "Yönet" button
3. **Dialog opens** → Click "Tedarikçi Ekle" button
4. **Form appears** → Manually select supplier from dropdown
5. **Fill details** → Price, stock, availability, quality, origin, delivery, etc.
6. **Submit** → Creates `supplier_products` record
7. **Repeat for each supplier** → N separate operations for N suppliers

### Time Investment

| Scenario | Current Time | After Automation | Savings |
|----------|-------------|------------------|---------|
| **Single assignment** | 45 seconds | 30 seconds | 15 sec |
| **5 suppliers** | 3.75 minutes | 30 seconds | 3.25 min |
| **10 products × 5 suppliers** | 37.5 minutes | 5 minutes | 32.5 min |
| **Weekly operations** (est.) | ~4 hours | ~30 minutes | **3.5 hours/week** |

**Current Estimated Load:** 4-6 hours/week for manual assignments
**After Automation:** 30-45 minutes/week

---

## Root Cause: Why Manual?

### Technical Constraints

#### 1. No Bulk Assignment API
```typescript
// Current: useCreateSupplierProduct() handles ONE assignment
// Missing: useBulkAssignSupplierProducts() for multiple

// Existing code in useMultiSupplierProducts.ts (lines 105-141):
export function useCreateSupplierProduct() {
  return useMutation({
    mutationFn: async (formData: SupplierProductFormData) => {
      const { data, error } = await supabase
        .from('supplier_products')
        .insert({ /* single record */ })
    }
  });
}
```

**Problem:** No bulk insert function exists. Database supports it (PostgreSQL), but no RPC/wrapper.

#### 2. No Auto-Assignment Rules
```typescript
// Missing entirely:
// - assignToAllApprovedSuppliers()
// - assignByRegion(product, region)
// - assignByCategory(category, suppliers)
```

**Problem:** No business logic layer for automatic assignment decisions.

#### 3. Supplier Selection is Manual Dropdown
```typescript
// SupplierAssignmentDialog.tsx (lines 140-167):
<Select onValueChange={field.onChange} value={field.value}>
  <SelectContent>
    {availableSuppliers.map((supplier) => (
      <SelectItem key={supplier.id} value={supplier.id}>
        {supplier.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Problem:** No multi-select, no "assign all", no bulk checkboxes.

### Business Rules

**Current Required Rules (implicit):**
- Supplier must be `is_active = true`
- Supplier must be `approval_status = 'approved'`
- Supplier cannot be already assigned to product (duplicate prevention)

**Additional Rules Needed:**
- Region-based assignment (supplier regions match product availability)
- Category-based auto-assignment (supplier category preferences)
- Minimum price validation (prevent dumping)
- Maximum suppliers per product (prevent oversaturation)

---

## Post-Assignment Visibility Issue

### Root Cause Analysis (TEST_BULGULARI #8)

**Symptom:** SuperAdmin assigns supplier → `supplier_products` insert succeeds → Supplier panel shows nothing.

**Investigation:**

#### Hypothesis 1: RLS Policy Blocking Supplier View
```sql
-- Check: Can supplier SELECT their own records?
-- Likely issue: RLS policy checks user_id, but query uses supplier_id

-- Current probable policy (needs verification):
CREATE POLICY "Suppliers can view their products"
ON supplier_products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()  -- ← This is correct
      AND suppliers.approved = true
  )
);
```

**Fix Required:**
```sql
-- Ensure RLS allows suppliers to see:
-- 1. Their assigned products
-- 2. Products they created themselves
-- 3. Products with is_active = true (optional)

CREATE POLICY "Suppliers can view assigned products"
ON supplier_products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()
  )
);
```

#### Hypothesis 2: React Query Cache Not Invalidated
```typescript
// useMultiSupplierProducts.ts (lines 131-135):
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
  queryClient.invalidateQueries({ queryKey: ['product-price-stats'] });
  queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
  // Missing: ['supplier-products'] ?
  toast.success('Tedarikçi ürünü eklendi');
}
```

**Fix Required:**
```typescript
// Add more comprehensive invalidation
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
  queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
  queryClient.invalidateQueries({ queryKey: ['supplier-products'] });  // ← Add this
  queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });       // ← Add this
}
```

#### Hypothesis 3: Frontend Query Filter Issue
```typescript
// Supplier panel query (useSupplierProducts.ts - likely):
// May have incorrect filter: is_active: true, but default is false?

// Fix: Ensure query includes all assigned products regardless of is_active
const { data } = await supabase
  .from('supplier_products')
  .select('*, products(*)')
  .eq('supplier_id', supplierId)
  // .eq('is_active', true)  // ← Remove this filter if blocking new assignments
```

---

## Automation Opportunities

### Quick Wins (Week 1)

| Task | Complexity | Benefit | Implementation |
|------|------------|---------|----------------|
| **1. Bulk Assignment Dialog** | Low | High | Multi-select checkbox UI + RPC batch insert |
| **2. "Assign to All Suppliers" Button** | Low | High | Single button → Loop through approved suppliers |
| **3. Fix Post-Assignment Visibility** | Low | Critical | RLS policy fix + Query cache invalidation |
| **4. Auto-Open Dialog After Product Create** | Low | Medium | Immediately prompt for supplier assignment |
| **5. Assignment Templates** | Low | Medium | Save default price/stock/delivery values |

**Estimated Time:** 6-8 hours
**Impact:** 70% reduction in manual clicks

### Medium Complexity (Week 2)

| Task | Complexity | Benefit | Implementation |
|------|------------|---------|----------------|
| **6. Region-Based Auto-Assignment** | Medium | High | Match supplier.regions to product.regions |
| **7. Category-Based Assignment** | Medium | High | Supplier preferences → Product categories |
| **8. Import/Export CSV** | Medium | High | Export product list → Bulk edit prices → Import |
| **9. Assignment Validation Rules** | Medium | High | Prevent duplicates, enforce price ranges |
| **10. Assignment History** | Medium | Medium | Track who assigned what, when |

**Estimated Time:** 12-15 hours
**Impact:** 90% reduction in manual operations

### Full Automation (Week 3+)

| Task | Complexity | Benefit | Implementation |
|------|------------|---------|----------------|
| **11. Auto-Assignment on Supplier Signup** | High | Very High | New supplier → Auto-assign existing products |
| **12. Auto-Assignment on Product Create** | High | Very High | New product → Auto-assign all approved suppliers |
| **13. Smart Pricing Recommendations** | High | Medium | ML model suggests competitive prices |
| **14. Bulk Edit from Bugün Halde** | High | High | Select products → Mass update prices |
| **15. Assignment Workflow Engine** | High | High | Configurable rules per product/supplier |

**Estimated Time:** 20-25 hours
**Impact:** Near-zero manual intervention

---

## Bulk Assignment Feature

### Current State

**Implemented:** No
**Required:** Yes (Critical)

### Required Implementation

#### UI Component: BulkAssignmentDialog.tsx

```typescript
interface BulkAssignmentProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

// UI Mockup:
┌─────────────────────────────────────────────────────────────┐
│  Toplu Tedarikçi Atama                             [✕]       │
│  ─────────────────────────────────────────────────────────  │
│  Ürün: Domates (1 KG)                                       │
│                                                               │
│  Varsayılan Değerler (tüm atamalar için geçerli)            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Fiyat: [15.00] TL   Stok: [100]   Teslimat: [1] gün    │ │
│  │ Kalite: [Standart ▼]   Menşei: [Antalya]               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Tedarikçiler                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ☑ Aliaga Tedarik       (Aktif, Onaylı)                 │ │
│  │ ☑ Menemen Toptancılık   (Aktif, Onaylı)                │ │
│  │ ☐ İzmir Hal            (Aktif, Onaylı)                 │ │
│  │ ☐ Ege Sebze            (Pasif)                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Tümünü Seç]  [Tümünü Temizle]                              │
│                                                               │
│  [İptal]  [Seçilenlere Ata (3 tedarikçi)]                    │
└─────────────────────────────────────────────────────────────┘
```

#### Backend: RPC Function

```sql
CREATE OR REPLACE FUNCTION bulk_assign_supplier_products(
  p_product_id UUID,
  p_supplier_ids UUID[],
  p_default_price NUMERIC DEFAULT NULL,
  p_default_stock_quantity INTEGER DEFAULT 0,
  p_default_availability TEXT DEFAULT 'plenty',
  p_default_quality TEXT DEFAULT 'standart',
  p_default_origin TEXT DEFAULT 'Türkiye',
  p_default_min_order_quantity INTEGER DEFAULT 1,
  p_default_delivery_days INTEGER DEFAULT 1
)
RETURNS TABLE (
  supplier_id UUID,
  supplier_product_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supplier_id UUID;
  v_existing_count INTEGER;
BEGIN
  FOREACH v_supplier_id IN ARRAY p_supplier_ids
  LOOP
    -- Check if already assigned
    SELECT COUNT(*) INTO v_existing_count
    FROM supplier_products
    WHERE product_id = p_product_id
      AND supplier_id = v_supplier_id;

    IF v_existing_count > 0 THEN
      RETURN QUERY SELECT
        v_supplier_id,
        NULL::UUID,
        FALSE,
        'Zaten atanmış'::TEXT;
      CONTINUE;
    END IF;

    -- Insert new assignment
    INSERT INTO supplier_products (
      supplier_id,
      product_id,
      price,
      stock_quantity,
      availability,
      quality,
      origin,
      min_order_quantity,
      delivery_days,
      is_active,
      is_featured
    ) VALUES (
      v_supplier_id,
      p_product_id,
      COALESCE(p_default_price, 0),
      p_default_stock_quantity,
      p_default_availability,
      p_default_quality,
      p_default_origin,
      p_default_min_order_quantity,
      p_default_delivery_days,
      p_default_price IS NOT NULL,  -- is_active = true only if price set
      FALSE
    )
    RETURNING supplier_id, id, TRUE, NULL INTO v_supplier_id;

  END LOOP;

  RETURN;
END;
$$;
```

#### Frontend Hook

```typescript
// useMultiSupplierProducts.ts
export function useBulkAssignSupplierProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: string;
      supplierIds: string[];
      defaultValues?: Partial<SupplierProductFormData>;
    }) => {
      const { data, error } = await supabase.rpc('bulk_assign_supplier_products', {
        p_product_id: params.productId,
        p_supplier_ids: params.supplierIds,
        p_default_price: params.defaultValues?.price,
        p_default_stock_quantity: params.defaultValues?.stock_quantity,
        p_default_availability: params.defaultValues?.availability || 'plenty',
        p_default_quality: params.defaultValues?.quality || 'standart',
        p_default_origin: params.defaultValues?.origin || 'Türkiye',
        p_default_min_order_quantity: params.defaultValues?.min_order_quantity || 1,
        p_default_delivery_days: params.defaultValues?.delivery_days || 1,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      toast.success('Toplu atama tamamlandı');
    },
  });
}
```

---

## Assignment Validation Rules

### Current Rules

1. **Supplier must be active** (`is_active = true`)
2. **Supplier must be approved** (`approval_status = 'approved'`)
3. **No duplicate assignments** (product_id + supplier_id unique)

### Additional Rules Needed

| Rule | Priority | Implementation |
|------|----------|----------------|
| **Max 10 suppliers per product** | Medium | Prevent oversaturation, UI warning |
| **Min price > 0** | High | Form validation |
| **Max price < 10× base_price** | Medium | Prevent price gouging |
| **Delivery days 1-30** | Low | Reasonable delivery window |
| **Stock quantity >= 0** | High | Form validation |
| **Region match (optional)** | Medium | Supplier regions overlap product regions |
| **Category preference (optional)** | Low | Supplier's preferred categories |

### Validation Implementation

```typescript
// src/lib/supplierAssignmentValidator.ts

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export async function validateSupplierAssignment(
  productId: string,
  supplierId: string,
  price: number
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Duplicate
  const { data: existing } = await supabase
    .from('supplier_products')
    .select('id')
    .eq('product_id', productId)
    .eq('supplier_id', supplierId)
    .single();

  if (existing) {
    errors.push('Bu tedarikçi z atanmış');
  }

  // Check 2: Price validation
  if (price <= 0) {
    errors.push('Fiyat 0\'dan büyük olmalı');
  }

  const { data: product } = await supabase
    .from('products')
    .select('base_price')
    .eq('id', productId)
    .single();

  if (product && price > product.base_price * 10) {
    warnings.push('Fiyat taban fiyatın 10 katından fazla');
  }

  // Check 3: Supplier count
  const { count } = await supabase
    .from('supplier_products')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (count && count >= 10) {
    warnings.push('Bu ürüne zaten 10 tedarikçi atanmış');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
```

---

## Implementation Plan

### Phase 1: Critical Fixes (Day 1)

**Time:** 3-4 hours

#### 1.1 Fix Post-Assignment Visibility (Critical)
```sql
-- Migration: 20260110000001_fix_supplier_assignment_visibility.sql

-- Drop existing policies
DROP POLICY IF EXISTS "Suppliers can view their products" ON supplier_products;

-- Recreate with correct logic
CREATE POLICY "Suppliers can view assigned products"
ON supplier_products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()
  )
);
```

```typescript
// Fix cache invalidation in useMultiSupplierProducts.ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
  queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
  queryClient.invalidateQueries({ queryKey: ['supplier-products'] });  // Add
  queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });       // Add
  toast.success('Tedarikçi ürünü eklendi');
}
```

#### 1.2 Add "Assign to All" Quick Button
```typescript
// In SupplierAssignmentDialog.tsx, add button:
<Button
  variant="outline"
  onClick={handleAssignToAllSuppliers}
  disabled={createMutation.isPending}
>
  <Users className="h-4 w-4 mr-2" />
  Tüm Onaylı Tedarikçilere Ata
</Button>
```

```typescript
const handleAssignToAllSuppliers = async () => {
  const approvedSupplierIds = suppliers
    .filter(s => s.is_active && s.approval_status === 'approved')
    .map(s => s.id);

  // Loop through and create assignments
  for (const supplierId of approvedSupplierIds) {
    await createMutation.mutateAsync({
      product_id: productId,
      supplier_id: supplierId,
      price: 0,  // Let supplier fill in
      is_active: false,
      // ... other defaults
    });
  }

  onClose();
};
```

### Phase 2: Bulk Assignment UI (Day 2-3)

**Time:** 6-8 hours

#### 2.1 Create BulkAssignmentDialog Component
```typescript
// src/components/admin/BulkAssignmentDialog.tsx

interface BulkAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export function BulkAssignmentDialog({
  open,
  onClose,
  productId,
  productName,
}: BulkAssignmentDialogProps) {
  const { suppliers } = useSuppliers();
  const bulkAssign = useBulkAssignSupplierProducts();

  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [defaultValues, setDefaultValues] = useState<Partial<SupplierProductFormData>>({
    price: 0,
    stock_quantity: 0,
    availability: 'plenty',
    quality: 'standart',
    origin: 'Türkiye',
  });

  const handleSelectAll = () => {
    const approvedIds = suppliers
      .filter(s => s.is_active && s.approval_status === 'approved')
      .map(s => s.id);
    setSelectedSupplierIds(approvedIds);
  };

  const handleAssign = () => {
    bulkAssign.mutate({
      productId,
      supplierIds: selectedSupplierIds,
      defaultValues,
    }, {
      onSuccess: () => {
        onClose();
        setSelectedSupplierIds([]);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* UI implementation based on mockup above */}
      </DialogContent>
    </Dialog>
  );
}
```

#### 2.2 Create RPC Function
```sql
-- Migration: 20260111000000_bulk_assign_supplier_products.sql

CREATE OR REPLACE FUNCTION bulk_assign_supplier_products(
  p_product_id UUID,
  p_supplier_ids UUID[],
  p_default_price NUMERIC DEFAULT NULL,
  p_default_stock_quantity INTEGER DEFAULT 0,
  p_default_availability TEXT DEFAULT 'plenty',
  p_default_quality TEXT DEFAULT 'standart',
  p_default_origin TEXT DEFAULT 'Türkiye',
  p_default_min_order_quantity INTEGER DEFAULT 1,
  p_default_delivery_days INTEGER DEFAULT 1
)
RETURNS TABLE (
  supplier_id UUID,
  supplier_product_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
-- [Full implementation from previous section]
```

#### 2.3 Add Hook
```typescript
// In useMultiSupplierProducts.ts
export function useBulkAssignSupplierProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: string;
      supplierIds: string[];
      defaultValues?: Partial<SupplierProductFormData>;
    }) => {
      const { data, error } = await supabase.rpc('bulk_assign_supplier_products', {
        p_product_id: params.productId,
        p_supplier_ids: params.supplierIds,
        // ... other params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      toast.success('Toplu atama tamamlandı');
    },
  });
}
```

### Phase 3: Auto-Assignment Rules (Day 4-5)

**Time:** 6-8 hours

#### 3.1 Auto-Assign on Supplier Signup
```sql
-- Migration: 20260112000000_auto_assign_on_supplier_approval.sql

CREATE OR REPLACE FUNCTION auto_assign_products_to_new_supplier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When supplier is approved, assign all active products
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    INSERT INTO supplier_products (
      supplier_id,
      product_id,
      price,
      is_active
    )
    SELECT
      NEW.id,
      p.id,
      0,  -- Default price, supplier fills in
      FALSE  -- Inactive until price set
    FROM products p
    WHERE p.is_active = true
    ON CONFLICT (supplier_id, product_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_assign_on_supplier_approval
AFTER UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION auto_assign_products_to_new_supplier();
```

#### 3.2 Auto-Assign on Product Create
```sql
-- Migration: 20260112000001_auto_assign_on_product_create.sql

CREATE OR REPLACE FUNCTION auto_assign_suppliers_to_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When product is created, assign to all approved suppliers
  INSERT INTO supplier_products (
    supplier_id,
    product_id,
    price,
    is_active
  )
  SELECT
    s.id,
    NEW.id,
    0,  -- Default price
    FALSE  -- Inactive until price set
  FROM suppliers s
  WHERE s.approval_status = 'approved' AND s.is_active = true
  ON CONFLICT (supplier_id, product_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_assign_on_product_create
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION auto_assign_suppliers_to_new_product();
```

### Phase 4: Import/Export & Advanced Features (Week 2)

**Time:** 10-12 hours

#### 4.1 Export/Import CSV
```typescript
// src/hooks/useSupplierProductImportExport.ts

export function useExportSupplierProductTemplate(productId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('approval_status', 'approved')
        .eq('is_active', true);

      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      // Generate CSV
      const headers = ['Tedarikçi ID', 'Tedarikçi Adı', 'Fiyat', 'Stok', 'Teslimat (Gün)'];
      const rows = suppliers.map(s => [
        s.id,
        s.name,
        '',  // Price - supplier fills
        '',  // Stock
        '',  // Delivery
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      return csv;
    },
  });
}

export function useImportSupplierProductPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const rows = text.split('\n').slice(1);  // Skip header

      const updates = rows.map(row => {
        const [supplierId, , price, stock, delivery] = row.split(',');
        return supabase
          .from('supplier_products')
          .update({
            price: parseFloat(price),
            stock_quantity: parseInt(stock),
            delivery_days: parseInt(delivery),
            is_active: true,
          })
          .eq('supplier_id', supplierId)
          .eq('product_id', productId);
      });

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      toast.success('Fiyatlar içe aktarıldı');
    },
  });
}
```

#### 4.2 Smart Pricing Recommendations (Optional)
```typescript
// src/hooks/usePricingRecommendations.ts

export function usePricingRecommendations(productId: string) {
  return useQuery({
    queryKey: ['pricing-recommendations', productId],
    queryFn: async () => {
      const { data: stats } = await supabase.rpc('get_product_price_stats', {
        p_product_id: productId,
      });

      const { data: product } = await supabase
        .from('products')
        .select('base_price')
        .eq('id', productId)
        .single();

      // Recommend: avg_price * 0.95 (5% below average)
      const recommendedPrice = stats.avg_price * 0.95;

      return {
        recommended: recommendedPrice,
        min: stats.min_price,
        max: stats.max_price,
        avg: stats.avg_price,
        base: product.base_price,
      };
    },
  });
}
```

---

## Testing Checklist

### Unit Tests

```typescript
// __tests__/hooks/useBulkAssignSupplierProducts.test.ts
describe('useBulkAssignSupplierProducts', () => {
  it('should assign to multiple suppliers', async () => {
    const { result } = renderHook(() => useBulkAssignSupplierProducts());

    await act(async () => {
      await result.current.mutateAsync({
        productId: 'prod-1',
        supplierIds: ['sup-1', 'sup-2', 'sup-3'],
        defaultValues: { price: 10 },
      });
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('should skip already assigned suppliers', async () => {
    // Test duplicate prevention
  });

  it('should handle partial failures', async () => {
    // Test error handling
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/supplierAssignment.test.ts
describe('Supplier Assignment Integration', () => {
  it('should create assignment and make visible to supplier', async () => {
    // 1. Admin assigns product to supplier
    // 2. Verify in supplier_products
    // 3. Login as supplier
    // 4. Verify product visible in supplier panel
  });

  it('should bulk assign with defaults', async () => {
    // 1. Create bulk assignment
    // 2. Verify all suppliers have records
    // 3. Verify default values applied
  });
});
```

### Manual Testing

- [ ] Admin can assign single supplier
- [ ] Admin can bulk assign (multi-select)
- [ ] Admin can "assign to all approved"
- [ ] Supplier sees assigned products immediately
- [ ] Supplier can edit assigned product prices
- [ ] New supplier gets auto-assigned products on approval
- [ ] New product gets auto-assigned to all suppliers
- [ ] Export CSV works
- [ ] Import CSV works
- [ ] Validation prevents duplicates
- [ ] Validation warns on high prices

---

## Success Metrics

### Operational Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Time per assignment** | 45 sec | 5 sec | Average click time |
| **Assignments per hour** | ~80 | ~500 | Admin throughput |
| **Post-assignment delay** | ∞ (broken) | <1 sec | Supplier visibility |
| **Manual clicks saved** | 0 | 90% | Click count reduction |

### Business Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Products with 2+ suppliers** | Low | 80% | Price comparison coverage |
| **Supplier panel adoption** | Low | 100% | Active suppliers |
| **Price competitiveness** | Unknown | +15% | Margin improvement |
| **Admin time saved** | 0 | 3.5 hrs/wk | Time tracking |

---

## Next Steps

### Immediate (Today)

1. **Fix RLS policies** - Critical blocker
2. **Fix cache invalidation** - Quick win
3. **Test post-assignment visibility** - Verify fix

### This Week

4. **Implement bulk assignment UI** - Major time saver
5. **Add "assign to all" button** - Quick win
6. **Create RPC function** - Backend support
7. **Test bulk assignment** - Verify functionality

### Next Sprint

8. **Auto-assignment triggers** - Full automation
9. **Import/Export CSV** - Bulk operations
10. **Smart pricing** - Competitive advantage
11. **Assignment analytics** - Data-driven decisions

---

## Files to Modify

| File | Change Type | Priority |
|------|-------------|----------|
| `supabase/migrations/20260110000001_fix_visibility.sql` | **NEW** - RLS fix | Critical |
| `src/hooks/useMultiSupplierProducts.ts` | **MODIFY** - Cache invalidation | Critical |
| `src/components/admin/SupplierAssignmentDialog.tsx` | **MODIFY** - Add "Assign All" button | High |
| `src/components/admin/BulkAssignmentDialog.tsx` | **NEW** - Bulk UI | High |
| `supabase/migrations/20260111000000_bulk_assign.sql` | **NEW** - RPC function | High |
| `supabase/migrations/20260112000000_auto_assign.sql` | **NEW** - Triggers | Medium |
| `src/hooks/useSupplierProductImportExport.ts` | **NEW** - Import/Export | Medium |

---

**Review Date:** 2026-01-08
**Reviewer:** Backend Development Architect
**Status:** Ready for implementation
