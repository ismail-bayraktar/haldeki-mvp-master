# Pricing Redesign Migration - Execution Guide

## Overview

This migration implements a new simplified pricing system that replaces the 4-layer pricing complexity with a single source of truth.

### What Changes

**Before (4-layer):**
- `products.price`, `products.base_price`
- `region_products.price`, `region_products.business_price`
- `supplier_products.price`
- `supplier_product_variations.price_adjustment`

**After (Simplified):**
- `supplier_products.price` = Single source of truth
- `pricing_config` table = Commission rates (B2B: 30%, B2C: 50%)
- `regions.price_multiplier` = Regional adjustments
- `calculate_product_price()` RPC = Centralized calculation

### Migration Files

| File | Purpose | Required |
|------|---------|----------|
| `20260110200000_pricing_redesign_schema.sql` | Creates tables, views, functions | Yes |
| `20260110210000_pricing_redesign_data_migration.sql` | Migrates data, validates | Yes |
| `20260110220000_pricing_redesign_verification.sql` | Tests all functionality | No |
| `20260110290000_pricing_redesign_rollback.sql` | Rollback if issues found | Emergency |
| `RUN_ALL_MIGRATIONS.sql` | Combined for manual execution | Alternative |

---

## Execution Options

### Option A: Node.js Script (Recommended)

**Prerequisites:**
- Node.js installed
- `pg` package installed (`npm install pg --save-dev`)

**Steps:**

1. **Set database password environment variable:**
   ```bash
   # Get your password from: https://app.supabase.com/project/ynatuiwdvkxcmmnmejkl/settings/database
   export SUPABASE_DB_PASSWORD=your_password_here

   # Windows PowerShell:
   $env:SUPABASE_DB_PASSWORD="your_password_here"
   ```

2. **Run migrations:**
   ```bash
   node scripts/run-migrations.js
   ```

3. **Run verification only:**
   ```bash
   node scripts/run-migrations.js --verify-only
   ```

4. **Rollback if needed:**
   ```bash
   node scripts/run-migrations.js --rollback
   ```

### Option B: Manual SQL Editor Execution

**Steps:**

1. **Open Supabase SQL Editor:**
   ```
   https://app.supabase.com/project/ynatuiwdvkxcmmnmejkl/sql
   ```

2. **Open the combined migration file:**
   ```
   supabase/migrations/RUN_ALL_MIGRATIONS.sql
   ```

3. **Copy entire file contents and paste into SQL Editor**

4. **Click "Run" to execute**

5. **Review output for any errors or warnings**

---

## Pre-Migration Checklist

- [ ] **Database backup created** (Supabase auto-backups should be active)
- [ ] **Tested in staging/dev environment first**
- [ ] **Frontend changes ready to deploy** (uses new RPC function)
- [ ] **Team notified of migration**
- [ ] **Rollback plan documented**

---

## What the Migration Does

### Phase 1: Schema (Non-Breaking)

1. Creates `pricing_config` table with default commission rates
2. Adds `price_multiplier` column to `regions` table
3. Creates `customer_prices` view (new single source of truth)
4. Creates `price_history` table for analytics
5. Creates `calculate_product_price()` RPC function
6. Creates `calculate_cart_prices()` RPC function
7. Adds performance indexes
8. Creates price change trigger

**Note:** Old columns are NOT dropped, so existing queries still work.

### Phase 2: Data Migration

1. Calculates regional multipliers from existing price data
2. Migrates product base prices to supplier_products
3. Populates price_history with current state
4. Validates data integrity
5. Reports migration summary

### Phase 3: Verification

1. Tests all new tables/views exist
2. Validates configuration
3. Checks regional multipliers
4. Tests price calculation function
5. Reports verification results

---

## Post-Migration Steps

### 1. Test the New Function

```sql
-- Test price calculation
SELECT * FROM public.calculate_product_price(
  (SELECT id FROM public.products WHERE is_active = true LIMIT 1),
  (SELECT id FROM public.regions WHERE is_active = true LIMIT 1),
  NULL,  -- supplier_id (auto-select cheapest)
  'b2c'   -- user role
);

-- Check customer prices view
SELECT * FROM public.customer_prices LIMIT 10;
```

### 2. Update Frontend

Replace old pricing queries with the new RPC:

```typescript
// Old way (deprecated)
const { data } = await supabase
  .from('region_products')
  .select('price, business_price')
  .eq('region_id', regionId)
  .eq('product_id', productId);

// New way (use this)
const { data } = await supabase.rpc('calculate_product_price', {
  p_product_id: productId,
  p_region_id: regionId,
  p_user_role: userRole, // 'b2b' or 'b2c'
});
```

### 3. Monitor for 7 Days

- Check price calculations are correct
- Monitor for any errors in logs
- Compare new vs old pricing (should match)
- Watch for performance issues

### 4. Cleanup (After 7 Days)

Once verified working, deprecate old columns in a follow-up migration.

---

## Rollback Procedure

If critical issues are found:

### Option A: Node.js
```bash
node scripts/run-migrations.js --rollback
```

### Option B: Manual
1. Open SQL Editor
2. Run `supabase/migrations/20260110290000_pricing_redesign_rollback.sql`

### What Rollback Does

- Drops new tables (`pricing_config`, `price_history`)
- Drops new views (`customer_prices`)
- Drops new functions (`calculate_product_price`, `calculate_cart_prices`)
- Removes `regions.price_multiplier` column
- **Preserves all original data** (no data loss)

---

## Troubleshooting

### Error: "No active pricing configuration found"

**Cause:** Schema migration didn't run or failed.

**Fix:** Run schema migration first:
```bash
node scripts/run-migrations.js
```

### Error: "relation already exists"

**Cause:** Migration already applied.

**Fix:** This is safe. The script handles existing objects. Run with `--verify-only` to check state.

### Error: "Password not found"

**Cause:** `SUPABASE_DB_PASSWORD` environment variable not set.

**Fix:** Get password from Supabase dashboard and set environment variable.

### Price Calculations Seem Wrong

**Check:**
1. Regional multipliers: `SELECT * FROM public.regions;`
2. Commission rates: `SELECT * FROM public.pricing_config WHERE is_active = true;`
3. Supplier prices: `SELECT * FROM public.supplier_products WHERE is_active = true;`

### Performance Issues

**Check:** Indexes are created:
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('supplier_products', 'region_products', 'product_variations');
```

---

## Verification Queries

```sql
-- Check migration status
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'pricing_config') as pricing_config_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'price_history') as price_history_exists,
  (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'customer_prices') as customer_prices_exists,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'calculate_product_price') as function_exists;

-- Check configuration
SELECT * FROM public.pricing_config WHERE is_active = true;

-- Check regional multipliers
SELECT name, price_multiplier FROM public.regions WHERE is_active = true;

-- Check price history count
SELECT COUNT(*) FROM public.price_history;

-- Sample price calculation
SELECT * FROM public.calculate_product_price(
  (SELECT id FROM public.products WHERE is_active = true LIMIT 1),
  (SELECT id FROM public.regions WHERE is_active = true LIMIT 1),
  NULL,
  'b2c'
);
```

---

## Support

If issues occur:

1. Check Supabase logs: https://app.supabase.com/project/ynatuiwdvkxcmmnmejkl/logs
2. Review migration output for specific errors
3. Run verification queries to check state
4. Rollback if critical issues found

---

## Migration Summary

| Metric | Value |
|--------|-------|
| **Downtime Required** | None (non-breaking migration) |
| **Data Loss Risk** | None (rollback preserves data) |
| **Rollback Time** | < 1 minute |
| **Verification Time** | ~5 minutes |
| **Monitoring Period** | 7 days |
