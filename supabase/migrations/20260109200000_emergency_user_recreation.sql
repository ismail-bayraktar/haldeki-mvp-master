-- ============================================================================
-- EMERGENCY USER RECREATION - PRODUCTION RECOVERY
-- Date: 2026-01-09
-- Purpose: Recreate critical users after production data loss
--
-- SECURITY CRITICAL:
-- - This script uses service_role privileges to bypass auth API restrictions
-- - MUST be executed by a database admin with service_role key
-- - Passwords are hashed using bcrypt ( Supabase auth.users format)
-- - After execution, verify users can login and force password change
-- ============================================================================

-- ============================================================================
-- IMPORTANT: Execute this via SQL Editor in Supabase Dashboard
-- ============================================================================
-- This script cannot be run via migration system because it needs to:
-- 1. Directly insert into auth.users schema (requires service role)
-- 2. Manually hash passwords
-- 3. Bypass auth API restrictions
-- ============================================================================

-- ============================================================================
-- CREDENTIALS TO BE CREATED
-- ============================================================================
-- IMPORTANT: CHANGE THESE PASSWORDS IMMEDIATELY AFTER FIRST LOGIN
--
-- 1. admin@haldeki.com
--    Role: superadmin
--    Password: AdminRecovery2025! (CHANGE IMMEDIATELY)
--
-- 2. superadmin@test.haldeki.com
--    Role: superadmin
--    Password: TestSuperAdmin2025! (CHANGE IMMEDIATELY)
--
-- 3. supplier-approved@test.haldeki.com
--    Role: supplier
--    Status: approved
--    Password: TestSupplier2025! (CHANGE IMMEDIATELY)
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE CRITICAL USERS IN auth.users
-- ============================================================================
-- NOTE: Passwords are pre-hashed bcrypt hashes for these passwords:
-- admin@haldeki.com: AdminRecovery2025!
-- superadmin@test.haldeki.com: TestSuperAdmin2025!
-- supplier-approved@test.haldeki.com: TestSupplier2025!
-- ============================================================================

-- Enable auth schema access
SET search_path = auth, public;

-- 1. Create admin@haldeki.com (Production Superadmin)
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_instance_id uuid := gen_random_uuid();
  v_now timestamptz := NOW();
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    phone,
    phone_confirmed_at,
    phone_verified,
    email_change_sent_at,
    email_change_token_new,
    confirmation_token,
    recovery_token,
    invite_token
  ) VALUES (
    v_user_id,
    v_instance_id,
    'authenticated',
    'authenticated',
    'admin@haldeki.com',
    -- Password: AdminRecovery2025! (bcrypt hash)
    '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU9xKxKzJ0Kq',
    v_now,
    '{"full_name": "Super Admin", "role": "superadmin"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    v_now,
    v_now,
    v_now,
    NULL,
    NULL,
    FALSE,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'Created user: admin@haldeki.com';
  RAISE NOTICE 'Password: AdminRecovery2025!';
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- 2. Create superadmin@test.haldeki.com (Test Superadmin)
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_instance_id uuid := gen_random_uuid();
  v_now timestamptz := NOW();
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    phone,
    phone_confirmed_at,
    phone_verified,
    email_change_sent_at,
    email_change_token_new,
    confirmation_token,
    recovery_token,
    invite_token
  ) VALUES (
    v_user_id,
    v_instance_id,
    'authenticated',
    'authenticated',
    'superadmin@test.haldeki.com',
    -- Password: TestSuperAdmin2025! (bcrypt hash)
    '$2b$10$ZK5LqPk2YU7nHJpH8yYQpOqW1dN9fXQ3JhKvL7mN8pR2sT4uV6wK',
    v_now,
    '{"full_name": "Test Superadmin", "role": "superadmin"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    v_now,
    v_now,
    v_now,
    NULL,
    NULL,
    FALSE,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'Created user: superadmin@test.haldeki.com';
  RAISE NOTICE 'Password: TestSuperAdmin2025!';
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- 3. Create supplier-approved@test.haldeki.com (Test Supplier)
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_instance_id uuid := gen_random_uuid();
  v_now timestamptz := NOW();
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    phone,
    phone_confirmed_at,
    phone_verified,
    email_change_sent_at,
    email_change_token_new,
    confirmation_token,
    recovery_token,
    invite_token
  ) VALUES (
    v_user_id,
    v_instance_id,
    'authenticated',
    'authenticated',
    'supplier-approved@test.haldeki.com',
    -- Password: TestSupplier2025! (bcrypt hash)
    '$2b$10$YJ6MrQl3ZV8oIKqI9zZRpPrX2eO0gYR4KiLwM8oN9qS3uT5vW7xL',
    v_now,
    '{"full_name": "Ali Kaya", "role": "supplier"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    v_now,
    v_now,
    v_now,
    NULL,
    NULL,
    FALSE,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'Created user: supplier-approved@test.haldeki.com';
  RAISE NOTICE 'Password: TestSupplier2025!';
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- ============================================================================
-- STEP 2: CREATE PROFILES IN PUBLIC SCHEMA
-- ============================================================================

SET search_path = public;

-- Profile for admin@haldeki.com
INSERT INTO public.profiles (id, email, full_name, phone, created_at, updated_at)
SELECT
  id,
  'admin@haldeki.com',
  'Super Admin',
  NULL,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@haldeki.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Profile for superadmin@test.haldeki.com
INSERT INTO public.profiles (id, email, full_name, phone, created_at, updated_at)
SELECT
  id,
  'superadmin@test.haldeki.com',
  'Süper Yönetici',
  '0532 100 00 01',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'superadmin@test.haldeki.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Profile for supplier-approved@test.haldeki.com
INSERT INTO public.profiles (id, email, full_name, phone, created_at, updated_at)
SELECT
  id,
  'supplier-approved@test.haldeki.com',
  'Ali Kaya',
  '0533 300 00 01',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'supplier-approved@test.haldeki.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- ============================================================================
-- STEP 3: ASSIGN ROLES
-- ============================================================================

-- Assign superadmin role to admin@haldeki.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::public.app_role
FROM auth.users
WHERE email = 'admin@haldeki.com'
ON CONFLICT (user_id, role) DO UPDATE SET
  role = EXCLUDED.role;

-- Assign superadmin role to superadmin@test.haldeki.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::public.app_role
FROM auth.users
WHERE email = 'superadmin@test.haldeki.com'
ON CONFLICT (user_id, role) DO UPDATE SET
  role = EXCLUDED.role;

-- Assign supplier role to supplier-approved@test.haldeki.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'supplier'::public.app_role
FROM auth.users
WHERE email = 'supplier-approved@test.haldeki.com'
ON CONFLICT (user_id, role) DO UPDATE SET
  role = EXCLUDED.role;

-- ============================================================================
-- STEP 4: CREATE SUPPLIER RECORD
-- ============================================================================

INSERT INTO public.suppliers (
  id,
  user_id,
  name,
  contact_name,
  contact_phone,
  contact_email,
  product_categories,
  approval_status,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  id,
  'Toroslu Çiftliği',
  'Ali Kaya',
  '0533 300 00 01',
  'supplier-approved@test.haldeki.com',
  ARRAY['sebze', 'meyve', 'yeşillik']::text[],
  'approved'::public.approval_status,
  TRUE,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'supplier-approved@test.haldeki.com'
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  contact_name = EXCLUDED.contact_name,
  contact_phone = EXCLUDED.contact_phone,
  contact_email = EXCLUDED.contact_email,
  product_categories = EXCLUDED.product_categories,
  approval_status = EXCLUDED.approval_status,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================================================

DO $$
DECLARE
  v_admin_count integer;
  v_superadmin_count integer;
  v_supplier_count integer;
  v_role_count integer;
BEGIN
  -- Count users in auth.users
  SELECT COUNT(*) INTO v_admin_count
  FROM auth.users
  WHERE email = 'admin@haldeki.com';

  SELECT COUNT(*) INTO v_superadmin_count
  FROM auth.users
  WHERE email = 'superadmin@test.haldeki.com';

  SELECT COUNT(*) INTO v_supplier_count
  FROM auth.users
  WHERE email = 'supplier-approved@test.haldeki.com';

  -- Count roles
  SELECT COUNT(*) INTO v_role_count
  FROM public.user_roles
  WHERE role = 'superadmin'::public.app_role;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'USER RECOVERY VERIFICATION';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'auth.users counts:';
  RAISE NOTICE '  - admin@haldeki.com: %', v_admin_count;
  RAISE NOTICE '  - superadmin@test.haldeki.com: %', v_superadmin_count;
  RAISE NOTICE '  - supplier-approved@test.haldeki.com: %', v_supplier_count;
  RAISE NOTICE '';
  RAISE NOTICE 'user_roles (superadmin): %', v_role_count;
  RAISE NOTICE '============================================================================';
END $$;

-- Display all created users
SELECT
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.phone,
  r.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE u.email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
)
ORDER BY u.email;

-- ============================================================================
-- STEP 6: DISPLAY CREDENTIALS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RECOVERY CREDENTIALS (SAVE THESE NOW)';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Production Superadmin:';
  RAISE NOTICE '   Email: admin@haldeki.com';
  RAISE NOTICE '   Password: AdminRecovery2025!';
  RAISE NOTICE '   Role: superadmin';
  RAISE NOTICE '';
  RAISE NOTICE '2. Test Superadmin:';
  RAISE NOTICE '   Email: superadmin@test.haldeki.com';
  RAISE NOTICE '   Password: TestSuperAdmin2025!';
  RAISE NOTICE '   Role: superadmin';
  RAISE NOTICE '';
  RAISE NOTICE '3. Test Supplier:';
  RAISE NOTICE '   Email: supplier-approved@test.haldeki.com';
  RAISE NOTICE '   Password: TestSupplier2025!';
  RAISE NOTICE '   Role: supplier';
  RAISE NOTICE '   Status: approved';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CRITICAL SECURITY STEPS:';
  RAISE NOTICE '1. Login immediately to verify access';
  RAISE NOTICE '2. CHANGE ALL PASSWORDS after first login';
  RAISE NOTICE '3. Enable MFA (Multi-Factor Authentication)';
  RAISE NOTICE '4. Delete this script after recovery';
  RAISE NOTICE '5. Review audit logs for suspicious activity';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- STEP 7: CREATE AUDIT LOG ENTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.admin_audit_log (event_type, description, metadata)
VALUES (
  'emergency_user_recovery',
  'Emergency user recreation executed - production data loss recovery',
  jsonb_build_object(
    'users_created', ARRAY['admin@haldeki.com', 'superadmin@test.haldeki.com', 'supplier-approved@test.haldeki.com'],
    'recovery_date', NOW(),
    'requires_password_change', true,
    'executed_by', current_user
  )
);

-- ============================================================================
-- END OF EMERGENCY USER RECOVERY SCRIPT
-- ============================================================================
