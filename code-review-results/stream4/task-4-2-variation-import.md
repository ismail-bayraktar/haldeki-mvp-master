# Stream 4.2: Variation Import Logic Review

## Executive Summary

**Quality Score: 6.5/10** - Functional but has critical gaps

The variation import system is **partially implemented** with good foundational patterns but **critical issues** in:
- Nested variation handling (non-existent)
- Rollback completeness (partial)
- Transaction safety (missing)
- Duplicate detection (basic, race conditions)

---

## Import Workflow

```
1. Parse File (Excel/CSV)
   ├─ extractVariations() from product name
   ├─ Validate with validateVariations()
   └─ Return ProductImportRow[] with variations[]

2. Validate Rows
   ├─ validateProductRows() checks all required fields
   ├─ Variation validation happens in parser
   └─ Return errors if invalid

3. Create Import Record
   └─ product_imports table with status='processing'

4. Process Batches (50 rows/batch)
   For each row:
   ├─ Check if product exists (by name + supplier)
   ├─ If exists: UPDATE product (no variations handled)
   ├─ If new: INSERT product
   │  └─ Call insertProductVariations()
   │     ├─ Check duplicates (SELECT + INSERT per variation)
   │     └─ Log errors to allErrors[]
   └─ Track createdProductIds[] for rollback

5. Update Import Record
   └─ status='completed' | 'rolled_back'

6. Rollback (on error)
   └─ DELETE FROM products WHERE id IN (createdProductIds)
```

---

## Critical Issues

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| **No nested variation support** | HIGH | Can't import multi-attribute products (size+type+ scent) | Add combination handling |
| **Missing transaction** | HIGH | Partial imports on failure | Wrap in transaction |
| **Incomplete rollback** | MEDIUM | Orphaned variations on error | Cascade delete variations |
| **Race condition in duplicate check** | MEDIUM | Duplicate variations on concurrent imports | Use upsert or unique constraint |
| **No supplier_product_variations linkage** | MEDIUM | Variations not linked to supplier products | Add junction table inserts |
| **Variations ignored on update** | LOW | Can't add variations to existing products | Handle update case |
| **No bulk insert optimization** | LOW | Slow imports for large files | Batch variation inserts |
| **Error context unclear** | LOW | Hard to debug which variation failed | Add variation details to errors |

---

## Nested Variation Handling

### Current Implementation:

```typescript
// excelParser.ts - extractVariations()
export function extractVariations(productName: string): {
  variations: ProductImportVariation[];
  baseName: string;
} {
  const variations: ProductImportVariation[] = [];
  let remainingText = productName;

  // Apply each pattern in order
  for (const pattern of VARIATION_PATTERNS) {
    const match = remainingText.match(pattern.regex);
    if (match) {
      const { value, metadata } = pattern.extractor(match);

      // Check for duplicate variation type
      if (!variations.some(v => v.type === pattern.type)) {
        variations.push({
          type: pattern.type,
          value,
          display_order: pattern.order,
          metadata,
        });
      }

      // Remove matched text from remaining
      remainingText = remainingText.replace(match[0], '').trim();
    }
  }

  return { variations, baseName: remainingText };
}
```

### Issues:

1. **No Combinations**: Each variation is stored independently
   - Product: "Sıvı Sabun 4 LT Beyaz Lavanta"
   - Extracts: [`size: 4 LT`, `type: BEYAZ`, `scent: LAVANTA`]
   - **Problem**: No relationship between variations
   - **Result**: Can't query "4 LT + BEYAZ + LAVANTA" as a specific SKU

2. **Flat Structure Only**:
   ```typescript
   // Current: Flat list
   variations: [
     { type: 'size', value: '4 LT' },
     { type: 'type', value: 'BEYAZ' },
     { type: 'scent', value: 'LAVANTA' }
   ]

   // Missing: Combination concept
   combination_key: "4_LT|BEYAZ|LAVANTA"
   sku_suffix: "4LT-BEY-LAV"
   ```

3. **No Validation of Valid Combinations**:
   - Can't mark "4 LT + RENKLI + LAVANTA" as invalid
   - Can't set stock per combination
   - Can't price per combination

### Improvements:

```typescript
// Better: Create variation combinations
interface VariationCombinationImport {
  combination_key: string;  // "size|type|scent" = "4 LT|BEYAZ|LAVANTA"
  variations: ProductImportVariation[];
  sku_suffix?: string;      // "4LT-BEY-LAV"
  stock?: number;           // Stock for this combination
  price_adjustment?: number; // Price delta
}

async function insertVariationCombinations(
  productId: string,
  combinations: VariationCombinationImport[],
  errors: ImportError[],
  batchIndex: number
): Promise<void> {
  for (const combo of combinations) {
    // 1. Insert individual variations (idempotent)
    const variationIds = await insertVariations(productId, combo.variations);

    // 2. Check if combination exists
    const { data: existing } = await supabase
      .from('product_variation_combinations')
      .select('id')
      .eq('product_id', productId)
      .eq('combination_key', combo.combination_key)
      .maybeSingle();

    if (existing) {
      // Update combination
      await supabase
        .from('product_variation_combinations')
        .update({
          stock_quantity: combo.stock,
          price_adjustment: combo.price_adjustment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Insert combination
      const { error } = await supabase
        .from('product_variation_combinations')
        .insert({
          product_id: productId,
          combination_key: combo.combination_key,
          sku_suffix: combo.sku_suffix,
          stock_quantity: combo.stock,
          price_adjustment: combo.price_adjustment,
        });

      if (error) {
        errors.push({
          row: batchIndex + 2,
          field: 'variation_combination',
          error: `Varyasyon kombinasyonu hatası (${combo.combination_key}): ${error.message}`,
          value: combo.combination_key,
        });
      }
    }
  }
}
```

---

## Duplicate Detection

### Current Logic:

```typescript
// useProductImport.ts - insertProductVariations()
async function insertProductVariations(
  productId: string,
  variations: ProductImportVariation[],
  errors: ImportError[],
  batchIndex: number
): Promise<void> {
  for (const variation of variations) {
    try {
      // Check if variation already exists for this product
      const { data: existing } = await supabase
        .from('product_variations')
        .select('id')
        .eq('product_id', productId)
        .eq('variation_type', variation.type)
        .eq('variation_value', variation.value)
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Variation exists, skip
        continue;
      }

      // Insert new variation
      const { error: varError } = await supabase
        .from('product_variations')
        .insert({
          product_id: productId,
          variation_type: variation.type,
          variation_value: variation.value,
          display_order: variation.display_order,
          metadata: variation.metadata || null,
        });

      if (varError) {
        errors.push({
          row: batchIndex + 2,
          field: 'variation',
          error: `Varyasyon hatası (${variation.type}): ${varError.message}`,
          value: variation.value,
        });
      }
    } catch (error) {
      errors.push({
        row: batchIndex + 2,
        field: 'variation',
        error: `Varyasyon hatası (${variation.type}): ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        value: variation.value,
      });
    }
  }
}
```

### Gaps:

1. **Race Condition (Check-Then-Act)**:
   ```
   Thread A: SELECT (no match)
   Thread B: SELECT (no match)
   Thread A: INSERT (success)
   Thread B: INSERT (duplicate error)
   ```

2. **No Database-Level Enforcement**:
   - Missing unique constraint: `(product_id, variation_type, variation_value)`
   - Relies on application logic (fragile)

3. **Per-Variation Query**:
   - N queries for N variations
   - Slow for products with many variations

4. **No Warning on Skip**:
   - Silently skips duplicates
   - User doesn't know variations were ignored

### Improvements:

```typescript
// Better: Use database upsert with unique constraint
async function insertProductVariations(
  productId: string,
  variations: ProductImportVariation[],
  errors: ImportError[],
  batchIndex: number
): Promise<void> {
  // Batch insert all variations at once
  const variationsToInsert = variations.map(v => ({
    product_id: productId,
    variation_type: v.type,
    variation_value: v.value,
    display_order: v.display_order,
    metadata: v.metadata || null,
  }));

  // Use Supabase upsert with unique constraint
  const { error, data } = await supabase
    .from('product_variations')
    .upsert(variationsToInsert, {
      onConflict: 'product_id,variation_type,variation_value',
      ignoreDuplicates: false, // Update existing
    })
    .select();

  if (error) {
    // Check if it's a unique constraint violation (expected)
    if (error.code === '23505') {
      // Duplicate - not an error, just skip
      return;
    }

    // Real error
    errors.push({
      row: batchIndex + 2,
      field: 'variation',
      error: `Varyasyon eklenemedi: ${error.message}`,
      value: JSON.stringify(variations),
    });
  }
}

// Database migration needed:
/*
ALTER TABLE product_variations
ADD CONSTRAINT product_variations_unique_variation
UNIQUE (product_id, variation_type, variation_value);
*/
```

---

## Rollback Mechanism

### Current State: **Partial**

```typescript
// useProductImport.ts - Rollback on error
} catch (error) {
  // Rollback: Delete all products created in this import
  if (createdProductIds.length > 0) {
    await supabase
      .from('products')
      .delete()
      .in('id', createdProductIds);
  }

  // Mark import as rolled back
  await supabase
    .from('product_imports')
    .update({
      status: 'rolled_back',
      completed_at: new Date().toISOString(),
    })
    .eq('id', importId);

  throw error;
}
```

### What's Missing:

1. **No Transaction**:
   - Products deleted BUT variations might remain
   - No atomic guarantee
   - If delete fails, inconsistent state

2. **Variations Not Rolled Back**:
   ```sql
   -- Current: Deletes product
   DELETE FROM products WHERE id = ?

   -- Problem: Orphaned variations
   SELECT * FROM product_variations WHERE product_id = ?;
   -- Still exists! Orphaned!
   ```

3. **No Cascade Safety**:
   - If ON DELETE CASCADE not set, manual cleanup needed
   - No verification cleanup succeeded

4. **Import Record State**:
   - Marks as 'rolled_back' even if delete fails
   - Misleading status

### Improvements:

```typescript
// Better: Transactional rollback with cascade
async function rollbackImport(
  importId: string,
  productIds: string[]
): Promise<void> {
  // Use Supabase RPC function for transactional rollback
  const { error } = await supabase.rpc('rollback_product_import', {
    p_import_id: importId,
    p_product_ids: productIds,
  });

  if (error) {
    console.error('Rollback failed:', error);
    throw new Error('İçe aktarma geri alınamadı: ' + error.message);
  }
}

// Database function (RPC):
/*
CREATE OR REPLACE FUNCTION rollback_product_import(
  p_import_id UUID,
  p_product_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete in transaction (cascade should handle variations)
  DELETE FROM products
  WHERE id = ANY(p_product_ids);

  -- Verify variations deleted
  IF EXISTS (
    SELECT 1 FROM product_variations
    WHERE product_id = ANY(p_product_ids)
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Variations not deleted, cascade not working';
  END IF;

  -- Mark import as rolled back
  UPDATE product_imports
  SET status = 'rolled_back',
      completed_at = NOW(),
      errors = array_append(errors, jsonb_build_object(
        'rolled_back_at', NOW(),
        'product_count', array_length(p_product_ids, 1)
      ))
  WHERE id = p_import_id;
END;
$$;

-- Ensure cascade is set:
ALTER TABLE product_variations
DROP CONSTRAINT IF EXISTS product_variations_product_id_fkey;

ALTER TABLE product_variations
ADD CONSTRAINT product_variations_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id)
ON DELETE CASCADE;
*/
```

---

## Error Reporting

### Current Error Messages:

```typescript
// From useProductImport.ts
errors.push({
  row: batchIndex + 2,
  field: 'variation',
  error: `Varyasyon hatası (${variation.type}): ${varError.message}`,
  value: variation.value,
});
```

### Examples:

- `"Varyasyon hatası (size): null value in column "variation_value" violates not-null constraint"`
- `"Varyasyon hatası (type): duplicate key value violates unique constraint"`

### User-Friendly? **No**

**Problems:**
1. Technical jargon ("null value", "constraint violation")
2. No actionable guidance
3. Turkish mixed with English
4. No context (which product?)
5. Generic field name ("variation" instead of specific variation)

### Improvements:

```typescript
// Better: User-friendly Turkish error messages
interface VariationErrorContext {
  productName: string;
  variationType: ProductVariationType;
  variationValue: string;
  row: number;
}

function getVariationErrorMessage(
  error: any,
  context: VariationErrorContext
): string {
  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    '23505': `"${context.variationValue}" varyasyonu zaten mevcut. Atlanıyor.`,
    '23502': `${getVariationTypeName(context.variationType)} varyasyonu için değer gereklidir.`,
    '23503': 'Ürün bulunamadı, varyasyon eklenemiyor.',
    '22001': 'Varyasyon değeri çok uzun (maksimum 50 karakter).',
    'default': `${getVariationTypeName(context.variationType)} varyasyonu eklenirken hata oluştu.`,
  };

  return errorMessages[error.code] || errorMessages['default'];
}

function getVariationTypeName(type: ProductVariationType): string {
  const names: Record<ProductVariationType, string> = {
    size: 'Boyut',
    type: 'Tür',
    scent: 'Koku',
    packaging: 'Paket',
    material: 'Materyal',
    flavor: 'Aroma',
    other: 'Diğer',
  };
  return names[type] || type;
}

// Usage:
errors.push({
  row: context.row,
  field: `variation_${context.variationType}`,
  error: getVariationErrorMessage(varError, context),
  value: {
    product: context.productName,
    variation: `${context.variationType}: ${context.variationValue}`,
  },
});
```

---

## Test Scenarios

| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| **Single variation** | Success | Success | ✅ PASS |
| **Multiple variations (same type)** | Success | Success | ✅ PASS |
| **Nested variations (type+size+scent)** | Create combinations | Flat list only | ❌ FAIL |
| **Duplicate variations** | Skip silently | Skip silently | ⚠️ PARTIAL |
| **Invalid variation type** | Error with message | Generic error | ⚠️ PARTIAL |
| **Empty variation value** | Validation error | DB constraint error | ❌ FAIL |
| **Import with 100+ variations** | Batch insert | Per-variation INSERT | ⚠️ SLOW |
| **Concurrent imports** | No duplicates | Race condition | ❌ FAIL |
| **Import failure** | Full rollback | Partial rollback | ❌ FAIL |
| **Update existing product** | Add variations | Ignored | ❌ FAIL |
| **Variation with metadata** | Save metadata | Works | ✅ PASS |

---

## Recommendations Summary

### Priority 1 (Critical):

1. **Add Transaction Support**:
   - Wrap import in database transaction
   - Use Supabase RPC function for atomicity

2. **Fix Rollback**:
   - Add ON DELETE CASCADE to product_variations
   - Verify cascade in rollback function
   - Mark import as failed if rollback fails

3. **Add Unique Constraint**:
   ```sql
   ALTER TABLE product_variations
   ADD CONSTRAINT product_variations_unique_variation
   UNIQUE (product_id, variation_type, variation_value);
   ```

### Priority 2 (High):

4. **Implement Variation Combinations**:
   - Add `product_variation_combinations` table
   - Extract and store combination keys
   - Validate combination uniqueness

5. **Batch Variation Inserts**:
   - Replace loop with single upsert
   - Use onConflict to handle duplicates

6. **Handle Update Case**:
   - Check for existing variations
   - Insert new, skip existing
   - Update metadata if changed

### Priority 3 (Medium):

7. **Improve Error Messages**:
   - Map error codes to Turkish messages
   - Include product name in error
   - Show variation details clearly

8. **Add Validation Layer**:
   - Validate variation values before DB
   - Check metadata format
   - Verify combination rules

9. **Add Logging**:
   - Log import progress
   - Track variation insert results
   - Record skipped duplicates

---

## Code Quality Assessment

### Strengths:
- ✅ Clear separation of concerns (parser → validator → importer)
- ✅ Good type safety with TypeScript
- ✅ Variation extraction from product name is clever
- ✅ Batching for main product import (50 rows)

### Weaknesses:
- ❌ No transaction support (critical for data integrity)
- ❌ Nested variations not handled (major feature gap)
- ❌ Per-variation queries (performance issue)
- ❌ Generic error messages (poor UX)
- ❌ Incomplete rollback (data integrity risk)
- ❌ No validation before DB (relies on constraints)

---

## Security Considerations

### Current:
- ✅ User authentication checked
- ✅ RLS policies should apply
- ⚠️ SQL injection risk? (uses parameterized queries ✅)

### Missing:
- ❌ No rate limiting on imports
- ❌ No file size validation (parser has it, but not enforced)
- ❌ No validation of variation metadata (could inject JSON)
- ❌ No sanitize of product names before extraction

---

## Performance Analysis

### Current Bottlenecks:

1. **Per-Variation Query**:
   ```
   50 products × 5 variations = 250 queries
   Each query: SELECT + INSERT = 500 DB round trips
   ```

2. **Duplicate Check**:
   ```
   SELECT before each INSERT
   Can be eliminated with upsert
   ```

3. **No Index on Variations**:
   ```sql
   -- Should have:
   CREATE INDEX idx_product_variations_lookup
   ON product_variations(product_id, variation_type, variation_value);
   ```

### Optimization Potential:
- **Current**: 500 queries for 250 variations
- **With batching**: 50 batches (1 per product)
- **With bulk upsert**: 1 query for all variations

---

## Conclusion

The variation import system **works for basic use cases** but has **critical gaps** for production:

### Must Fix Before Launch:
1. Transaction support (data integrity)
2. Complete rollback (orphan prevention)
3. Unique constraint (duplicate prevention)

### Should Fix Soon:
4. Variation combinations (core feature)
5. Batch operations (performance)
6. Error messages (UX)

### Can Defer:
7. Advanced validation
8. Detailed logging
9. Performance optimization

**Recommendation**: Address Priority 1 & 2 issues before handling large-scale imports or multi-attribute products.
