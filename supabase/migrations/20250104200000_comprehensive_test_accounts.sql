-- ============================================================================
-- COMPREHENSIVE TEST ACCOUNTS MIGRATION
-- ============================================================================
-- Purpose: Create complete set of test accounts for ALL user roles
-- Idempotent: Safe to run multiple times (uses ON CONFLICT and checks)
-- Test Domain: @test.haldeki.com
-- Test Password: Test1234! (must be set via Supabase Auth)
-- ============================================================================

-- ============================================================================
-- CONFIGURATION
-- ============================================================================
-- All test passwords should be set to: Test1234!
-- After running this migration, set passwords in Supabase Dashboard:
--   Authentication > Users > Find user > Set Password
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user exists before attempting operations
CREATE OR REPLACE FUNCTION public.test_user_exists(p_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM auth.users WHERE email = p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 1. SUPERADMIN ACCOUNT
-- ============================================================================
-- Email: superadmin@test.haldeki.com
-- Password: Test1234!
-- Role: superadmin
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only create if auth user exists (created via Supabase Dashboard)
  IF NOT public.test_user_exists('superadmin@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping superadmin - user does not exist in auth.users. Create via Supabase Dashboard first.';
    RETURN;
  END IF;

  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'superadmin@test.haldeki.com';

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'superadmin@test.haldeki.com',
    'Süper Yönetici',
    '0532 100 00 01'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  -- Assign superadmin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'superadmin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Superadmin account created/updated: superadmin@test.haldeki.com';
END $$;

-- ============================================================================
-- 2. ADMIN ACCOUNT
-- ============================================================================
-- Email: admin@test.haldeki.com
-- Password: Test1234!
-- Role: admin
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.test_user_exists('admin@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping admin - user does not exist in auth.users.';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@test.haldeki.com';

  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'admin@test.haldeki.com',
    'Sistem Yöneticisi',
    '0532 100 00 02'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Admin account created/updated: admin@test.haldeki.com';
END $$;

-- ============================================================================
-- 3. DEALER ACCOUNTS (2 dealers: 1 approved, 1 pending)
-- ============================================================================

-- 3.1 APPROVED DEALER
-- Email: dealer-approved@test.haldeki.com
-- Password: Test1234!
-- Role: dealer
-- Status: approved
-- Company: İzmir Yaş Sebze Ticaret

DO $$
DECLARE
  v_user_id uuid;
  v_menemen_id uuid;
BEGIN
  IF NOT public.test_user_exists('dealer-approved@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping approved dealer - user does not exist in auth.users.';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dealer-approved@test.haldeki.com';
  SELECT id INTO v_menemen_id FROM public.regions WHERE slug = 'menemen' LIMIT 1;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'dealer-approved@test.haldeki.com',
    'Mehmet Yılmaz',
    '0532 200 00 01'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  -- Assign dealer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'dealer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create dealer record (approved)
  INSERT INTO public.dealers (
    id, user_id, name, contact_name, contact_phone, contact_email,
    region_ids, tax_number, approval_status, is_active
  )
  VALUES (
    v_user_id,
    v_user_id,
    'İzmir Yaş Sebze Ticaret',
    'Mehmet Yılmaz',
    '0532 200 00 01',
    'dealer-approved@test.haldeki.com',
    CASE WHEN v_menemen_id IS NOT NULL THEN ARRAY[v_menemen_id] ELSE '{}'::uuid[] END,
    '1234567890',
    'approved'::public.approval_status,
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    contact_name = EXCLUDED.contact_name,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    region_ids = EXCLUDED.region_ids,
    tax_number = EXCLUDED.tax_number,
    approval_status = EXCLUDED.approval_status,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  RAISE NOTICE 'Approved dealer created: dealer-approved@test.haldeki.com';
END $$;

-- 3.2 PENDING DEALER
-- Email: dealer-pending@test.haldeki.com
-- Password: Test1234!
-- Role: dealer
-- Status: pending
-- Company: Ege Gıda Pazarlama

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.test_user_exists('dealer-pending@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping pending dealer - user does not exist in auth.users.';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dealer-pending@test.haldeki.com';

  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'dealer-pending@test.haldeki.com',
    'Ayşe Demir',
    '0532 200 00 02'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'dealer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.dealers (
    id, user_id, name, contact_name, contact_phone, contact_email,
    region_ids, tax_number, approval_status, is_active
  )
  VALUES (
    v_user_id,
    v_user_id,
    'Ege Gıda Pazarlama',
    'Ayşe Demir',
    '0532 200 00 02',
    'dealer-pending@test.haldeki.com',
    '{}'::uuid[],
    '0987654321',
    'pending'::public.approval_status,
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    contact_name = EXCLUDED.contact_name,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    tax_number = EXCLUDED.tax_number,
    approval_status = EXCLUDED.approval_status,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  RAISE NOTICE 'Pending dealer created: dealer-pending@test.haldeki.com';
END $$;

-- ============================================================================
-- 4. SUPPLIER ACCOUNTS (2 suppliers: 1 approved, 1 pending)
-- ============================================================================

-- 4.1 APPROVED SUPPLIER
-- Email: supplier-approved@test.haldeki.com
-- Password: Test1234!
-- Role: supplier
-- Status: approved
-- Company: Toroslu Çiftliği

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.test_user_exists('supplier-approved@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping approved supplier - user does not exist in auth.users.';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'supplier-approved@test.haldeki.com';

  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'supplier-approved@test.haldeki.com',
    'Ali Kaya',
    '0533 300 00 01'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'supplier'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.suppliers (
    id, user_id, name, contact_name, contact_phone, contact_email,
    product_categories, approval_status, is_active
  )
  VALUES (
    v_user_id,
    v_user_id,
    'Toroslu Çiftliği',
    'Ali Kaya',
    '0533 300 00 01',
    'supplier-approved@test.haldeki.com',
    ARRAY['sebze', 'meyve', 'yeşillik']::text[],
    'approved'::public.approval_status,
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    contact_name = EXCLUDED.contact_name,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    product_categories = EXCLUDED.product_categories,
    approval_status = EXCLUDED.approval_status,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  RAISE NOTICE 'Approved supplier created: supplier-approved@test.haldeki.com';
END $$;

-- 4.2 PENDING SUPPLIER
-- Email: supplier-pending@test.haldeki.com
-- Password: Test1234!
-- Role: supplier
-- Status: pending
-- Company: Marmara Tarım Ürünleri

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.test_user_exists('supplier-pending@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping pending supplier - user does not exist in auth.users.';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'supplier-pending@test.haldeki.com';

  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'supplier-pending@test.haldeki.com',
    'Zeynep Arslan',
    '0533 300 00 02'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'supplier'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.suppliers (
    id, user_id, name, contact_name, contact_phone, contact_email,
    product_categories, approval_status, is_active
  )
  VALUES (
    v_user_id,
    v_user_id,
    'Marmara Tarım Ürünleri',
    'Zeynep Arslan',
    '0533 300 00 02',
    'supplier-pending@test.haldeki.com',
    ARRAY['meyve']::text[],
    'pending'::public.approval_status,
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    contact_name = EXCLUDED.contact_name,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    product_categories = EXCLUDED.product_categories,
    approval_status = EXCLUDED.approval_status,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  RAISE NOTICE 'Pending supplier created: supplier-pending@test.haldeki.com';
END $$;

-- ============================================================================
-- 5. BUSINESS ACCOUNTS (2 businesses: 1 approved, 1 pending)
-- ============================================================================

-- 5.1 APPROVED BUSINESS
-- Email: business-approved@test.haldeki.com
-- Password: Test1234!
-- Role: business
-- Status: approved
-- Company: Lezzet Durağı Restoran

DO $$
DECLARE
  v_user_id uuid;
  v_menemen_id uuid;
BEGIN
  IF NOT public.test_user_exists('business-approved@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping approved business - user does not exist in auth.users.';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'business-approved@test.haldeki.com';
  SELECT id INTO v_menemen_id FROM public.regions WHERE slug = 'menemen' LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'business-approved@test.haldeki.com',
    'Can Öztürk',
    '0534 400 00 01'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'business'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.businesses (
    id, user_id, company_name, contact_name, contact_phone, contact_email,
    business_type, region_ids, tax_number, tax_office, approval_status, is_active
  )
  VALUES (
    v_user_id,
    v_user_id,
    'Lezzet Durağı Restoran',
    'Can Öztürk',
    '0534 400 00 01',
    'business-approved@test.haldeki.com',
    'restaurant',
    CASE WHEN v_menemen_id IS NOT NULL THEN ARRAY[v_menemen_id] ELSE '{}'::uuid[] END,
    '1122334455',
    'Menemen',
    'approved'::public.approval_status,
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_name = EXCLUDED.contact_name,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    business_type = EXCLUDED.business_type,
    region_ids = EXCLUDED.region_ids,
    tax_number = EXCLUDED.tax_number,
    tax_office = EXCLUDED.tax_office,
    approval_status = EXCLUDED.approval_status,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  RAISE NOTICE 'Approved business created: business-approved@test.haldeki.com';
END $$;

-- 5.2 PENDING BUSINESS
-- Email: business-pending@test.haldeki.com
-- Password: Test1234!
-- Role: business
-- Status: pending
-- Company: Güneş Kafe & Pastane

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.test_user_exists('business-pending@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping pending business - user does not exist in auth.users.';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'business-pending@test.haldeki.com';

  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'business-pending@test.haldeki.com',
    'Elif Şahin',
    '0534 400 00 02'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'business'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.businesses (
    id, user_id, company_name, contact_name, contact_phone, contact_email,
    business_type, region_ids, tax_number, tax_office, approval_status, is_active
  )
  VALUES (
    v_user_id,
    v_user_id,
    'Güneş Kafe & Pastane',
    'Elif Şahin',
    '0534 400 00 02',
    'business-pending@test.haldeki.com',
    'cafe',
    '{}'::uuid[],
    '9988776655',
    'Bornova',
    'pending'::public.approval_status,
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_name = EXCLUDED.contact_name,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    business_type = EXCLUDED.business_type,
    tax_number = EXCLUDED.tax_number,
    tax_office = EXCLUDED.tax_office,
    approval_status = EXCLUDED.approval_status,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  RAISE NOTICE 'Pending business created: business-pending@test.haldeki.com';
END $$;

-- ============================================================================
-- 6. REGULAR CUSTOMER ACCOUNTS (2 users)
-- ============================================================================

-- 6.1 CUSTOMER 1
-- Email: customer1@test.haldeki.com
-- Password: Test1234!
-- Role: user
-- Name: Fatma Yıldız

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.test_user_exists('customer1@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping customer1 - user does not exist in auth.users.';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'customer1@test.haldeki.com';

  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'customer1@test.haldeki.com',
    'Fatma Yıldız',
    '0535 500 00 01'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Customer 1 created: customer1@test.haldeki.com';
END $$;

-- 6.2 CUSTOMER 2
-- Email: customer2@test.haldeki.com
-- Password: Test1234!
-- Role: user
-- Name: Hasan Çelik

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.test_user_exists('customer2@test.haldeki.com') THEN
    RAISE NOTICE 'Skipping customer2 - user does not exist in auth.users.';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'customer2@test.haldeki.com';

  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    v_user_id,
    'customer2@test.haldeki.com',
    'Hasan Çelik',
    '0535 500 00 02'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Customer 2 created: customer2@test.haldeki.com';
END $$;

-- ============================================================================
-- SUMMARY TABLE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'TEST ACCOUNTS MIGRATION COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TOTAL TEST ACCOUNTS: 10';
  RAISE NOTICE '';
  RAISE NOTICE '1. SUPERADMIN (1):';
  RAISE NOTICE '   - superadmin@test.haldeki.com';
  RAISE NOTICE '';
  RAISE NOTICE '2. ADMIN (1):';
  RAISE NOTICE '   - admin@test.haldeki.com';
  RAISE NOTICE '';
  RAISE NOTICE '3. DEALERS (2):';
  RAISE NOTICE '   ✓ dealer-approved@test.haldeki.com (İzmir Yaş Sebze Ticaret)';
  RAISE NOTICE '   ⏳ dealer-pending@test.haldeki.com (Ege Gıda Pazarlama)';
  RAISE NOTICE '';
  RAISE NOTICE '4. SUPPLIERS (2):';
  RAISE NOTICE '   ✓ supplier-approved@test.haldeki.com (Toroslu Çiftliği)';
  RAISE NOTICE '   ⏳ supplier-pending@test.haldeki.com (Marmara Tarım Ürünleri)';
  RAISE NOTICE '';
  RAISE NOTICE '5. BUSINESSES (2):';
  RAISE NOTICE '   ✓ business-approved@test.haldeki.com (Lezzet Durağı Restoran)';
  RAISE NOTICE '   ⏳ business-pending@test.haldeki.com (Güneş Kafe & Pastane)';
  RAISE NOTICE '';
  RAISE NOTICE '6. CUSTOMERS (2):';
  RAISE NOTICE '   - customer1@test.haldeki.com (Fatma Yıldız)';
  RAISE NOTICE '   - customer2@test.haldeki.com (Hasan Çelik)';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create all auth users via Supabase Dashboard or Edge Function';
  RAISE NOTICE '2. Set all passwords to: Test1234!';
  RAISE NOTICE '3. Re-run this migration to link auth users to profiles/roles';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- CLEANUP HELPER FUNCTION (optional)
-- ============================================================================
-- To clean up test accounts, run:
-- DELETE FROM public.profiles WHERE email LIKE '%@test.haldeki.com';
-- Then delete from auth.users via Dashboard
-- ============================================================================
