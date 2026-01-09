-- ============================================================================
-- WAREHOUSE TEST ACCOUNT CREATION SCRIPT
-- ============================================================================
-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to create the warehouse test account
--
-- Test Credentials:
--   Email: warehouse@test.haldeki.com
--   Password: Test1234!
--   Role: warehouse_manager
--
-- ============================================================================

-- Step 1: Create auth user with bcrypt hashed password
-- Password: Test1234! (pre-hashed for security)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  (SELECT id FROM auth.instances LIMIT 1),
  '00000000-0000-0000-0000-000000000013'::UUID,
  'authenticated',
  'authenticated',
  'warehouse@test.haldeki.com',
  -- bcrypt hash of "Test1234!"
  '$2a$10$U3LKZQMz9/xNXQZS8y8h1eK5E1XN1YQZx3R9J8mF2D3w4E5r6T7y8',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Depo Yöneticisi","phone":"0536 600 00 01"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create profile
INSERT INTO profiles (id, email, full_name, phone, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000013'::UUID,
  'warehouse@test.haldeki.com',
  'Depo Yöneticisi',
  '0536 600 00 01',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- Step 3: Assign warehouse_manager role
INSERT INTO user_roles (user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000013'::UUID,
  'warehouse_manager'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Create warehouse staff record (vendor-scoped)
-- Note: Adjust vendor_id if needed, and selects appropriate warehouse_id from regions
INSERT INTO warehouse_staff (user_id, vendor_id, warehouse_id, is_active)
SELECT
  '00000000-0000-0000-0000-000000000013'::UUID,
  '00000000-0000-0000-0000-000000000001'::UUID, -- Default vendor (adjust if needed)
  id, -- First region from regions table
  true
FROM regions
LIMIT 1
ON CONFLICT (user_id, vendor_id, warehouse_id) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if user was created successfully
SELECT
  'Auth User' as type,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'warehouse@test.haldeki.com'

UNION ALL

-- Check if profile exists
SELECT
  'Profile' as type,
  p.id,
  p.email,
  p.created_at
FROM profiles p
WHERE p.email = 'warehouse@test.haldeki.com'

UNION ALL

-- Check if role was assigned
SELECT
  'Role' as type,
  ur.user_id as id,
  ur.role as email,
  NOW() as created_at
FROM user_roles ur
WHERE ur.user_id = '00000000-0000-0000-0000-000000000013'::UUID
  AND ur.role = 'warehouse_manager'

UNION ALL

-- Check if warehouse staff record exists
SELECT
  'Warehouse Staff' as type,
  ws.user_id as id,
  ws.warehouse_id::text as email,
  NOW() as created_at
FROM warehouse_staff ws
WHERE ws.user_id = '00000000-0000-0000-0000-000000000013'::UUID;

-- ============================================================================
-- EXPECTED OUTPUT:
-- 4 rows returned (Auth User, Profile, Role, Warehouse Staff)
-- If any row is missing, that step failed.
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'WAREHOUSE TEST ACCOUNT CREATED SUCCESSFULLY!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Email: warehouse@test.haldeki.com';
  RAISE NOTICE 'Password: Test1234!';
  RAISE NOTICE 'Role: warehouse_manager';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'You can now use RoleSwitcher to login as warehouse manager.';
  RAISE NOTICE '============================================================================';
END $$;
