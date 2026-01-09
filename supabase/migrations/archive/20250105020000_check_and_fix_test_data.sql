-- ============================================================================
-- Check and Fix Test Data
-- ============================================================================
-- This migration checks what auth users exist and creates missing records

-- First, let's see what auth users we have
DO $$
DECLARE
  v_user RECORD;
  v_count int := 0;
BEGIN
  RAISE NOTICE '=== Existing Auth Users ===';
  FOR v_user IN
    SELECT id, email, raw_user_meta_data->>'full_name' as full_name
    FROM auth.users
    WHERE email LIKE '%@test.haldeki.com'
    ORDER BY email
  LOOP
    RAISE NOTICE '  - % (%)', v_user.email, v_user.full_name;
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Total: % test users', v_count;
  RAISE NOTICE '===========================';
END $$;

-- Create missing dealer/supplier records if auth users exist
DO $$
DECLARE
  v_menemen_id uuid;
  v_user_id uuid;
  v_count int := 0;
BEGIN
  -- Get Menemen region
  SELECT id INTO v_menemen_id FROM public.regions WHERE slug = 'menemen' LIMIT 1;

  -- Process dealer-approved
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dealer-approved@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.dealers (user_id, name, contact_name, contact_phone, region_ids, approval_status, is_active, created_at, updated_at)
    VALUES (v_user_id, 'Test Dealer Company', 'Can Test Dealer', '0534 400 00 01', ARRAY[v_menemen_id], 'approved', true, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
    RAISE NOTICE '✓ Dealer (Approved) record created/updated';
    v_count := v_count + 1;
  ELSE
    RAISE NOTICE '✗ dealer-approved@test.haldeki.com NOT FOUND in auth.users';
  END IF;

  -- Process dealer-pending
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dealer-pending@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.dealers (user_id, name, contact_name, contact_phone, region_ids, approval_status, is_active, created_at, updated_at)
    VALUES (v_user_id, 'Pending Test Dealer', 'Pending Test Dealer', '0534 400 00 02', ARRAY[v_menemen_id], 'pending', true, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
    RAISE NOTICE '✓ Dealer (Pending) record created/updated';
    v_count := v_count + 1;
  ELSE
    RAISE NOTICE '✗ dealer-pending@test.haldeki.com NOT FOUND in auth.users';
  END IF;

  RAISE NOTICE 'Dealers created/updated: %', v_count;
END $$;

DO $$
DECLARE
  v_user_id uuid;
  v_count int := 0;
BEGIN
  -- Process supplier-approved
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'supplier-approved@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.suppliers (user_id, name, contact_name, contact_phone, approval_status, is_active, created_at, updated_at)
    VALUES (v_user_id, 'Test Supplier Company', 'Ali Test Supplier', '0534 400 00 03', 'approved', true, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
    RAISE NOTICE '✓ Supplier (Approved) record created/updated';
    v_count := v_count + 1;
  ELSE
    RAISE NOTICE '✗ supplier-approved@test.haldeki.com NOT FOUND in auth.users';
  END IF;

  -- Process supplier-pending
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'supplier-pending@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.suppliers (user_id, name, contact_name, contact_phone, approval_status, is_active, created_at, updated_at)
    VALUES (v_user_id, 'Pending Test Supplier', 'Pending Test Supplier', '0534 400 00 04', 'pending', true, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
    RAISE NOTICE '✓ Supplier (Pending) record created/updated';
    v_count := v_count + 1;
  ELSE
    RAISE NOTICE '✗ supplier-pending@test.haldeki.com NOT FOUND in auth.users';
  END IF;

  RAISE NOTICE 'Suppliers created/updated: %', v_count;
END $$;

-- Final summary
DO $$
DECLARE
  v_profiles int;
  v_roles int;
  v_dealers int;
  v_suppliers int;
  v_businesses int;
BEGIN
  SELECT COUNT(*) INTO v_profiles FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE u.email LIKE '%@test.haldeki.com';
  SELECT COUNT(*) INTO v_roles FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id WHERE u.email LIKE '%@test.haldeki.com';
  SELECT COUNT(*) INTO v_dealers FROM public.dealers d JOIN auth.users u ON u.id = d.user_id WHERE u.email LIKE '%@test.haldeki.com';
  SELECT COUNT(*) INTO v_suppliers FROM public.suppliers s JOIN auth.users u ON u.id = s.user_id WHERE u.email LIKE '%@test.haldeki.com';
  SELECT COUNT(*) INTO v_businesses FROM public.businesses b JOIN auth.users u ON u.id = b.user_id WHERE u.email LIKE '%@test.haldeki.com';

  RAISE NOTICE '';
  RAISE NOTICE '=== Final Test Data Summary ===';
  RAISE NOTICE 'Profiles: %', v_profiles;
  RAISE NOTICE 'User Roles: %', v_roles;
  RAISE NOTICE 'Dealers: %', v_dealers;
  RAISE NOTICE 'Suppliers: %', v_suppliers;
  RAISE NOTICE 'Businesses: %', v_businesses;
  RAISE NOTICE '=============================';
END $$;
