-- ====================================================================
-- REALISTIC SYSTEM CLEANUP
-- Date: 2025-01-10
-- Purpose: Simplify to 2 regions (Aliğa & Menemen) with realistic suppliers
-- ====================================================================

-- ====================================================================
-- STEP 1: BACKUP DATA BEFORE DELETION
-- ====================================================================

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_phase12_cleanup;

-- Backup regions to delete (keep Aliğa & Menemen)
CREATE TABLE IF NOT EXISTS backup_phase12_cleanup.regions_deleted AS
SELECT * FROM regions WHERE slug NOT IN ('aliaga', 'menemen');

-- Backup region_products to delete (CASCADE will handle this, but good to have)
CREATE TABLE IF NOT EXISTS backup_phase12_cleanup.region_products_deleted AS
SELECT rp.*
FROM region_products rp
WHERE rp.region_id IN (
  SELECT id FROM regions WHERE slug NOT IN ('aliaga', 'menemen')
);

-- Note: We're not backing up suppliers yet because we need to identify
-- which ones to keep (Aliğa & Menemen suppliers)

-- ====================================================================
-- STEP 2: DELETE REGIONS (CASCADE to related tables)
-- ====================================================================

-- First, let's see what we're deleting
DO $$
DECLARE
  region_count INTEGER;
  to_delete_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO region_count FROM regions;
  SELECT COUNT(*) INTO to_delete_count FROM regions WHERE slug NOT IN ('aliaga', 'menemen');

  RAISE NOTICE 'Total regions: %', region_count;
  RAISE NOTICE 'Regions to delete: %', to_delete_count;
END $$;

-- Delete region_products for unwanted regions (CASCADE)
DELETE FROM region_products
WHERE region_id IN (
  SELECT id FROM regions WHERE slug NOT IN ('aliaga', 'menemen')
);

-- Delete regions (keep only Aliğa & Menemen)
DELETE FROM regions
WHERE slug NOT IN ('aliaga', 'menemen');

-- ====================================================================
-- STEP 3: IDENTIFY SUPPLIERS TO KEEP
-- ====================================================================

-- For now, we'll identify suppliers by their user emails
-- Aliğa & Menemen suppliers will be created in the next migration
-- For now, let's backup ALL suppliers so we can restore if needed
CREATE TABLE IF NOT EXISTS backup_phase12_cleanup.suppliers_all AS
SELECT * FROM suppliers;

-- ====================================================================
-- VERIFICATION
-- ====================================================================

DO $$
DECLARE
  region_count INTEGER;
  supplier_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO region_count FROM regions;
  SELECT COUNT(*) INTO supplier_count FROM suppliers;

  RAISE NOTICE '=== CLEANUP VERIFICATION ===';
  RAISE NOTICE 'Remaining regions: %', region_count;
  RAISE NOTICE 'Expected: 2 (Aliğa, Menemen)';
  RAISE NOTICE 'Remaining suppliers: %', supplier_count;
  RAISE NOTICE '============================';
END $$;

-- Show remaining regions
SELECT id, name, slug, is_active
FROM regions
ORDER BY name;

-- Note: Suppliers will be cleaned up in the next migration
-- after we create the new Aliğa & Menemen suppliers
