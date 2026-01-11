# Variation Pricing Fix Plan - End-to-End

## Goal
Fix the variation pricing system for fresh food market to:
1. Remove invalid variation types (beden, type, scent, material, flavor - inappropriate for food)
2. Add admin panel to manage variation types
3. Require price adjustment and stock for all variations
4. Fix double-calculation bug in ProductCard/ProductDetail
5. Test all user roles (Super Admin, Supplier, Customer, B2B, Guest)

---

## Current Issues Found

### Issue 1: Invalid Variation Types in Fresh Food Market
Problem: Database contains inappropriate variation types for food products:
- beden (size for clothing) - should be size (Boyut: 1 KG, 2 KG, 5 KG)
- type with values like BEYAZ (color for non-food items)
- scent (LAVANTA, LIMON) - irrelevant for fresh produce
- material (CAM, PLASTIK) - packaging type, not product variation
- flavor (VANILLA, CIKOLATA) - for processed foods, not fresh produce

Root Cause: The product_variation_type enum was designed for general e-commerce, not fresh food.

### Issue 2: No Price Adjustment Required
Problem: product_variations table does NOT have price_adjustment field.
- Price adjustment is in supplier_product_variations junction table
- Admin UI (ProductVariationsRow.tsx) does not show price/stock inputs
- Suppliers cannot set variation-specific pricing

### Issue 3: Double Calculation Bug
Problem: ProductCard.tsx line 64-66 multiplies by priceMultiplier TWICE.
RPC function already returns final_price with variation adjustments.

### Issue 4: No Admin Panel for Variation Types
Problem: Only Super Admin can define valid variation types, but no UI exists.

---

## Approved Variation Types for Fresh Food Market

| Type | Turkish Label | Valid Examples | Invalid Examples |
|------|---------------|----------------|------------------|
| size | Boyut | 1 KG, 2 KG, 5 KG, 500 GR | beden, S, M, L, XL |
| packaging | Ambalaj | Kasa, Koli, Poset, Koli (4lu) | type, BEYAZ, RENKLI |
| quality | Kalite | 1. Sinif, 2. Sinif, Premium | scent, LAVANTA |
| other | Diger | Custom variations | material, CAM, METAL |

REMOVED types: type, scent, material, flavor

---

## Phase 1: Database Cleanup

### Task 1.1: Create Migration to Update Variation Type Enum

File: supabase/migrations/20260111000000_fix_variation_types.sql

```sql
-- Add new quality type
ALTER TYPE product_variation_type ADD VALUE IF NOT EXISTS 'quality';

-- Migrate existing data: type -> packaging, material -> packaging
UPDATE product_variations 
SET variation_type = 'packaging' 
WHERE variation_type IN ('type', 'material');

-- Delete invalid variations (scent, flavor)
DELETE FROM product_variations 
WHERE variation_type IN ('scent', 'flavor');

-- Create new enum with only 4 types
CREATE TYPE product_variation_type_new AS ENUM ('size', 'packaging', 'quality', 'other');

-- Alter table to use new enum
ALTER TABLE product_variations 
ALTER COLUMN variation_type TYPE product_variation_type_new 
USING variation_type::text::product_variation_type_new;

-- Drop old enum and rename
DROP TYPE product_variation_type;
ALTER TYPE product_variation_type_new RENAME TO product_variation_type;
```

### Task 1.2: Clean Up Invalid Variation Data

```sql
-- Delete any remaining invalid variations
DELETE FROM product_variations
WHERE variation_type NOT IN ('size', 'packaging', 'quality', 'other');

-- Verify no invalid types remain
SELECT COUNT(*) FROM product_variations
WHERE variation_type NOT IN ('size', 'packaging', 'quality', 'other');
```

---

## Phase 2: Admin Panel - Variation Type Management

### Task 2.1: Create Admin Page /admin/variation-types

File: src/pages/admin/VariationTypes.tsx (NEW)

### Task 2.2: Add Admin Sidebar Link

File: src/components/admin/AdminSidebar.tsx

### Task 2.3: Add Validation When Creating Variations

File: src/components/admin/ProductVariationsRow.tsx

---

## Phase 3: Required Pricing for Variations

### Task 3.1: Update Supplier Product Variations UI

File: src/components/admin/ProductVariationsRow.tsx

Add required fields: price_adjustment, stock_quantity

### Task 3.2: Update Database Schema

```sql
ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS price_adjustment NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
```

---

## Phase 4: Fix Double Calculation Bug

### Task 4.1: Remove priceMultiplier from ProductCard.tsx

File: src/components/product/ProductCard.tsx (lines 62-67)

### Task 4.2: Remove priceMultiplier from ProductDetail.tsx

File: src/pages/ProductDetail.tsx (lines 141-146)

---

## Phase 5: Test All Roles

### Task 5.1: Super Admin Tests
### Task 5.2: Supplier Tests
### Task 5.3: Customer/B2B Tests
### Task 5.4: Guest Tests

---

## Phase X: Verification

### Run Scripts
```bash
python ~/.claude/skills/database-design/scripts/schema_validator.py .
python ~/.claude/skills/vulnerability-scanner/scripts/security_scan.py .
python ~/.claude/skills/frontend-design/scripts/ux_audit.py .
```

### Manual Checklist
- [ ] Only 4 variation types in database
- [ ] Admin panel shows /admin/variation-types
- [ ] Supplier must enter price + stock
- [ ] No double calculation in prices
- [ ] All roles see correct prices

---

## Files to Modify

| File | Change |
|------|--------|
| supabase/migrations/20260111000000_fix_variation_types.sql | New migration |
| src/pages/admin/VariationTypes.tsx | New file |
| src/components/admin/AdminSidebar.tsx | Add menu item |
| src/components/admin/ProductVariationsRow.tsx | Add price/stock fields |
| src/components/product/ProductCard.tsx | Remove priceMultiplier |
| src/pages/ProductDetail.tsx | Remove priceMultiplier |
| src/types/multiSupplier.ts | Update type definition |

---

## Success Criteria

1. Database: Only 4 valid variation types
2. Admin: /admin/variation-types page exists
3. Supplier: Must enter price + stock for variations
4. Pricing: No double calculation bug
5. UI: All roles see correct prices

---

## Completion Checklist

- [ ] Phase 1: Database migration
- [ ] Phase 2: Admin panel created
- [ ] Phase 3: Required pricing fields
- [ ] Phase 4: Double calc bug fixed
- [ ] Phase 5: All roles tested
- [ ] Phase X: Verification scripts pass
