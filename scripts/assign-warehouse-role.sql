-- ============================================================================
-- WAREHOUSE USER - ROLE & STAFF ASSIGNMENT
-- ============================================================================
-- User ID: 4e632141-0a80-41d1-b352-60d8580faa1c (curl ile oluşturuldu)
-- Email: warehouse@test.haldeki.com
-- ============================================================================

-- 1. Profile oluştur (auth.users'dan senkronize)
INSERT INTO profiles (id, email, full_name, phone, created_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Depo Yöneticisi') as full_name,
  COALESCE(raw_user_meta_data->>'phone', '0536 600 00 01') as phone,
  created_at
FROM auth.users
WHERE email = 'warehouse@test.haldeki.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- 2. warehouse_manager rolünü ata
INSERT INTO user_roles (user_id, role)
SELECT
  id,
  'warehouse_manager'
FROM auth.users
WHERE email = 'warehouse@test.haldeki.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. warehouse_staff kaydı oluştur (vendor-scoped)
INSERT INTO warehouse_staff (user_id, vendor_id, warehouse_id, is_active)
SELECT
  au.id as user_id,
  '00000000-0000-0000-0000-000000000001'::UUID as vendor_id, -- Default vendor
  r.id as warehouse_id,
  true as is_active
FROM auth.users au
CROSS JOIN regions r
WHERE au.email = 'warehouse@test.haldeki.com'
  AND NOT EXISTS (
    SELECT 1 FROM warehouse_staff ws
    WHERE ws.user_id = au.id
  )
LIMIT 1
ON CONFLICT (user_id, vendor_id, warehouse_id) DO NOTHING;

-- 4. Verification queries
SELECT
  '✅ Auth User' as type,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'warehouse@test.haldeki.com'

UNION ALL

SELECT
  '✅ Profile' as type,
  p.id,
  p.email,
  p.created_at
FROM profiles p
WHERE p.email = 'warehouse@test.haldeki.com'

UNION ALL

SELECT
  '✅ Role' as type,
  ur.user_id as id,
  ur.role as email,
  NOW() as created_at
FROM user_roles ur
WHERE ur.user_id = (SELECT id FROM auth.users WHERE email = 'warehouse@test.haldeki.com')
  AND ur.role = 'warehouse_manager'

UNION ALL

SELECT
  '✅ Warehouse Staff' as type,
  ws.user_id as id,
  ws.warehouse_id::text as email,
  NOW() as created_at
FROM warehouse_staff ws
WHERE ws.user_id = (SELECT id FROM auth.users WHERE email = 'warehouse@test.haldeki.com');

-- Success message
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  SELECT id, email INTO v_user_id, v_email
  FROM auth.users
  WHERE email = 'warehouse@test.haldeki.com';

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'WAREHOUSE TEST ACCOUNT SUCCESSFULLY CONFIGURED!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Password: (Set TEST_USER_PASSWORD in .env)';
  RAISE NOTICE 'Role: warehouse_manager';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'You can now use RoleSwitcher to login!';
  RAISE NOTICE 'Press Ctrl+Shift+D and click "Depo Yöneticisi"';
  RAISE NOTICE '============================================================================';
END $$;
