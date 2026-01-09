-- ============================================================================
-- Fix Dealer, Supplier, Business Records for Test Accounts
-- ============================================================================
-- This migration ensures that dealer/supplier/business records are created
-- for the test accounts that already exist in auth.users
--
-- Idempotent: Can be run multiple times safely
-- ============================================================================

DO $$
DECLARE
  v_menemen_id uuid;
  v_user_id uuid;
BEGIN
  -- Get Menemen region ID for assigning to dealers
  SELECT id INTO v_menemen_id FROM public.regions WHERE slug = 'menemen' LIMIT 1;

  IF v_menemen_id IS NOT NULL THEN
    -- Dealer (Approved)
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'dealer-approved@test.haldeki.com' LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.dealers (
        user_id,
        name,
        contact_name,
        contact_phone,
        region_ids,
        approval_status,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id,
        'Test Dealer Company',
        'Can Test Dealer',
        '0534 400 00 01',
        ARRAY[v_menemen_id],
        'approved',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        region_ids = EXCLUDED.region_ids,
        approval_status = EXCLUDED.approval_status,
        updated_at = NOW();
    END IF;

    -- Dealer (Pending)
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'dealer-pending@test.haldeki.com' LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.dealers (
        user_id,
        name,
        contact_name,
        contact_phone,
        region_ids,
        approval_status,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id,
        'Pending Test Dealer',
        'Pending Test Dealer',
        '0534 400 00 02',
        ARRAY[v_menemen_id],
        'pending',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        region_ids = EXCLUDED.region_ids,
        approval_status = EXCLUDED.approval_status,
        updated_at = NOW();
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Supplier (Approved)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'supplier-approved@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.suppliers (
      user_id,
      name,
      contact_name,
      contact_phone,
      approval_status,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      'Test Supplier Company',
      'Ali Test Supplier',
      '0534 400 00 03',
      'approved',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      approval_status = EXCLUDED.approval_status,
      updated_at = NOW();
  END IF;

  -- Supplier (Pending)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'supplier-pending@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.suppliers (
      user_id,
      name,
      contact_name,
      contact_phone,
      approval_status,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      'Pending Test Supplier',
      'Pending Test Supplier',
      '0534 400 00 04',
      'pending',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      approval_status = EXCLUDED.approval_status,
      updated_at = NOW();
  END IF;
END $$;

DO $$
DECLARE
  v_menemen_id uuid;
  v_user_id uuid;
BEGIN
  SELECT id INTO v_menemen_id FROM public.regions WHERE slug = 'menemen' LIMIT 1;

  IF v_menemen_id IS NOT NULL THEN
    -- Business (Approved)
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'business-approved@test.haldeki.com' LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.businesses (
        user_id,
        company_name,
        contact_name,
        contact_phone,
        contact_email,
        business_type,
        tax_number,
        tax_office,
        region_ids,
        approval_status,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id,
        'Lezzet Durağı Restoran',
        'Can Öztürk',
        '0534 400 00 01',
        'business-approved@test.haldeki.com',
        'restaurant',
        '1122334455',
        'Menemen',
        ARRAY[v_menemen_id],
        'approved',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        region_ids = EXCLUDED.region_ids,
        approval_status = EXCLUDED.approval_status,
        updated_at = NOW();
    END IF;

    -- Business (Pending)
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'business-pending@test.haldeki.com' LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.businesses (
        user_id,
        company_name,
        contact_name,
        contact_phone,
        contact_email,
        business_type,
        tax_number,
        tax_office,
        region_ids,
        approval_status,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id,
        'Pending Test Business',
        'Pending Test Owner',
        '0534 400 00 05',
        'business-pending@test.haldeki.com',
        'cafe',
        '9988776655',
        'Menemen',
        ARRAY[v_menemen_id],
        'pending',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        region_ids = EXCLUDED.region_ids,
        approval_status = EXCLUDED.approval_status,
        updated_at = NOW();
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Verification summary
-- ============================================================================
DO $$
DECLARE
  v_dealers_count int;
  v_suppliers_count int;
  v_businesses_count int;
BEGIN
  SELECT COUNT(*) INTO v_dealers_count FROM public.dealers WHERE contact_phone LIKE '0534 400 00%';
  SELECT COUNT(*) INTO v_suppliers_count FROM public.suppliers WHERE contact_phone LIKE '0534 400 00%';
  SELECT COUNT(*) INTO v_businesses_count FROM public.businesses WHERE contact_phone LIKE '0534 400 00%';

  RAISE NOTICE '=== Test Account Records Summary ===';
  RAISE NOTICE 'Dealers: %', v_dealers_count;
  RAISE NOTICE 'Suppliers: %', v_suppliers_count;
  RAISE NOTICE 'Businesses: %', v_businesses_count;
  RAISE NOTICE '====================================';
END $$;
