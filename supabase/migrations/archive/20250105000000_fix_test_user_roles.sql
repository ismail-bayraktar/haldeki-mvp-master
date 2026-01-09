-- ============================================================================
-- Fix Test User Roles and Profiles
-- ============================================================================
-- This migration ensures all test accounts have proper:
-- 1. profiles records
-- 2. user_roles entries with correct roles
-- 3. dealer/supplier/business records where applicable
--
-- Idempotent: Can be run multiple times safely
-- ============================================================================

-- First, consolidate the has_role function to ensure superadmin cascade works
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Check if user has the exact role
  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) THEN
    RETURN true;
  END IF;

  -- Superadmin has all roles (cascading permission)
  IF _role != 'superadmin' AND EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- ============================================================================
-- Helper function to check if auth user exists
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ensure_auth_user_exists(email_param text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT id FROM auth.users WHERE email = email_param LIMIT 1;
$$;

-- ============================================================================
-- Insert or update profiles for test accounts
-- ============================================================================
DO $$
DECLARE
  v_user_record RECORD;
BEGIN
  -- Superadmin
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'superadmin@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Superadmin', '555-0001', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Superadmin', updated_at = NOW();
  END IF;

  -- Admin
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'admin@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Admin', '555-0002', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Admin', updated_at = NOW();
  END IF;

  -- Dealer Approved
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'dealer-approved@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Dealer Approved', '555-0003', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Dealer Approved', updated_at = NOW();
  END IF;

  -- Dealer Pending
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'dealer-pending@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Dealer Pending', '555-0004', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Dealer Pending', updated_at = NOW();
  END IF;

  -- Supplier Approved
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'supplier-approved@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Supplier Approved', '555-0005', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Supplier Approved', updated_at = NOW();
  END IF;

  -- Supplier Pending
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'supplier-pending@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Supplier Pending', '555-0006', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Supplier Pending', updated_at = NOW();
  END IF;

  -- Business Approved
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'business-approved@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Business Approved', '555-0007', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Business Approved', updated_at = NOW();
  END IF;

  -- Business Pending
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'business-pending@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Business Pending', '555-0008', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Business Pending', updated_at = NOW();
  END IF;

  -- Customer 1
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'customer1@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Customer 1', '555-0009', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Customer 1', updated_at = NOW();
  END IF;

  -- Customer 2
  SELECT id INTO v_user_record FROM auth.users WHERE email = 'customer2@test.haldeki.com' LIMIT 1;
  IF v_user_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (v_user_record.id, 'Test Customer 2', '555-0010', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Test Customer 2', updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- Insert or update user_roles for test accounts
-- ============================================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Superadmin
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'superadmin@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Admin
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Dealer (Approved)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dealer-approved@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'dealer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Dealer (Pending)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dealer-pending@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'dealer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Supplier (Approved)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'supplier-approved@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'supplier')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Supplier (Pending)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'supplier-pending@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'supplier')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Business (Approved)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'business-approved@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'business')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Business (Pending)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'business-pending@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'business')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Customer 1
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'customer1@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Customer 2
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'customer2@test.haldeki.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- Create dealer records for test dealer accounts
-- ============================================================================

DO $$
DECLARE
  v_menemen_id uuid;
  v_user_id uuid;
BEGIN
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

-- ============================================================================
-- Create supplier records for test supplier accounts
-- ============================================================================

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

-- ============================================================================
-- Create business records for test business accounts
-- ============================================================================

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
  v_auth_users_count int;
  v_profiles_count int;
  v_roles_count int;
  v_dealers_count int;
  v_suppliers_count int;
  v_businesses_count int;
BEGIN
  SELECT COUNT(*) INTO v_auth_users_count
  FROM auth.users
  WHERE email LIKE '%@test.haldeki.com';

  SELECT COUNT(*) INTO v_profiles_count
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email LIKE '%@test.haldeki.com';

  SELECT COUNT(*) INTO v_roles_count
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE u.email LIKE '%@test.haldeki.com';

  SELECT COUNT(*) INTO v_dealers_count FROM public.dealers WHERE contact_phone LIKE '0534 400 00%';
  SELECT COUNT(*) INTO v_suppliers_count FROM public.suppliers WHERE contact_phone LIKE '0534 400 00%';
  SELECT COUNT(*) INTO v_businesses_count FROM public.businesses WHERE contact_phone LIKE '0534 400 00%';

  RAISE NOTICE '=== Test User Setup Summary ===';
  RAISE NOTICE 'Auth users: %', v_auth_users_count;
  RAISE NOTICE 'Profiles: %', v_profiles_count;
  RAISE NOTICE 'User roles: %', v_roles_count;
  RAISE NOTICE 'Dealers: %', v_dealers_count;
  RAISE NOTICE 'Suppliers: %', v_suppliers_count;
  RAISE NOTICE 'Businesses: %', v_businesses_count;
  RAISE NOTICE '==============================';
END $$;
