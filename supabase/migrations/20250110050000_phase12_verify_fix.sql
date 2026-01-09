-- Phase 12: Quick Verification & Test Data
-- Date: 2025-01-10

-- ============================================================================
-- VERIFY DEPLOYMENT
-- ============================================================================

-- 1. Check tables
DO $$
BEGIN
  RAISE NOTICE '=== PHASE 12 DEPLOYMENT VERIFICATION ===';

  -- Check tables
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supplier_products') THEN
    RAISE NOTICE '✓ supplier_products table exists';
  ELSE
    RAISE NOTICE '✗ supplier_products table MISSING';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_variations') THEN
    RAISE NOTICE '✓ product_variations table exists';
  ELSE
    RAISE NOTICE '✗ product_variations table MISSING';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supplier_product_variations') THEN
    RAISE NOTICE '✓ supplier_product_variations table exists';
  ELSE
    RAISE NOTICE '✗ supplier_product_variations table MISSING';
  END IF;

  -- Check views
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'bugun_halde_comparison') THEN
    RAISE NOTICE '✓ bugun_halde_comparison view exists';
  ELSE
    RAISE NOTICE '✗ bugun_halde_comparison view MISSING';
  END IF;

  -- Check functions
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_product_suppliers') THEN
    RAISE NOTICE '✓ get_product_suppliers function exists';
  ELSE
    RAISE NOTICE '✗ get_product_suppliers function MISSING';
  END IF;

  RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;

-- ============================================================================
-- CREATE TEST DATA
-- ============================================================================

-- Get first supplier (or create test supplier if none exists)
DO $$
DECLARE
  v_supplier_id UUID;
  v_admin_user_id UUID;
  v_product_id UUID;
BEGIN
  -- Get admin user
  SELECT id INTO v_admin_user_id FROM auth.users LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Skipping test data creation.';
    RETURN;
  END IF;

  -- Get first supplier
  SELECT id INTO v_supplier_id FROM public.suppliers LIMIT 1;

  IF v_supplier_id IS NULL THEN
    -- Create test supplier
    INSERT INTO public.suppliers (id, user_id, name, contact_name, contact_phone, contact_email, is_active)
    VALUES (
      gen_random_uuid(),
      v_admin_user_id,
      'Test Tedarikçi A.Ş.',
      'Test Contact',
      '+905550000000',
      'test@haldeki.com',
      true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_supplier_id;

    RAISE NOTICE 'Created test supplier: %', v_supplier_id;
  ELSE
    RAISE NOTICE 'Using existing supplier: %', v_supplier_id;
  END IF;

  -- Get first product
  SELECT id INTO v_product_id FROM public.products WHERE id IS NOT NULL LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE NOTICE 'No products found. Skipping product test data.';
  ELSE
    -- Add size variation to product
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
    VALUES (v_product_id, 'size', '1 KG', 1)
    ON CONFLICT (product_id, variation_type, variation_value) DO NOTHING;

    -- Add supplier product
    INSERT INTO public.supplier_products (
      supplier_id, product_id, price, stock_quantity, availability, is_active
    )
    VALUES (
      v_supplier_id,
      v_product_id,
      99.99,
      50,
      'plenty',
      true
    )
    ON CONFLICT (supplier_id, product_id) DO UPDATE SET
      price = EXCLUDED.price,
      stock_quantity = EXCLUDED.stock_quantity;

    RAISE NOTICE 'Created test data for product: %', v_product_id;
  END IF;

END $$;

-- ============================================================================
-- SAMPLE QUERIES (for testing)
-- ============================================================================

-- Check supplier_products count
SELECT
  'supplier_products' as table_name,
  COUNT(*) as row_count
FROM public.supplier_products;

-- Check product_variations count
SELECT
  'product_variations' as table_name,
  COUNT(*) as row_count
FROM public.product_variations;

-- Check bugun_halde_comparison
SELECT
  COUNT(*) as comparison_rows
FROM public.bugun_halde_comparison;
