-- ============================================================================
-- Whitelist Login Test Data Setup
-- Phase 2: Login Logic - Whitelist Check Integration
-- ============================================================================
--
-- Purpose: Create test users and whitelist applications for E2E testing
-- Usage: Run this script in Supabase SQL Editor or via CLI
--
-- Test Users Created:
-- 1. test-pending@haldeki.com   - Pending whitelist application
-- 2. test-approved@haldeki.com  - Approved whitelist application
-- 3. test-rejected@haldeki.com  - Rejected whitelist application
-- 4. test-duplicate@haldeki.com - Duplicate whitelist application
-- 5. test-no-whitelist@haldeki.com - Has phone, no whitelist application
-- 6. test-no-phone@haldeki.com    - No phone in users table
--
-- ============================================================================

-- ============================================================================
-- Step 1: Create Test Users via Auth API
-- ============================================================================
-- Note: These users must be created via Supabase Auth API first
-- Use the script: scripts/create-whitelist-test-users.ts
--
-- For now, we'll assume users exist and add them to the users table
-- ============================================================================

-- ============================================================================
-- Step 2: Add Users to users Table
-- ============================================================================

-- User 1: test-pending@haldeki.com (Phone: 5551234567, Status: pending)
INSERT INTO users (id, email, phone, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test-pending@haldeki.com',
  '5551234567',
  'Test Pending User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- User 2: test-approved@haldeki.com (Phone: 5551234568, Status: approved)
INSERT INTO users (id, email, phone, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'test-approved@haldeki.com',
  '5551234568',
  'Test Approved User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- User 3: test-rejected@haldeki.com (Phone: 5551234569, Status: rejected)
INSERT INTO users (id, email, phone, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'test-rejected@haldeki.com',
  '5551234569',
  'Test Rejected User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- User 4: test-duplicate@haldeki.com (Phone: 5551234570, Status: duplicate)
INSERT INTO users (id, email, phone, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'test-duplicate@haldeki.com',
  '5551234570',
  'Test Duplicate User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- User 5: test-no-whitelist@haldeki.com (Phone: 5551234571, No application)
INSERT INTO users (id, email, phone, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  'test-no-whitelist@haldeki.com',
  '5551234571',
  'Test No Whitelist User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- User 6: test-no-phone@haldeki.com (Phone: NULL, No application)
INSERT INTO users (id, email, phone, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  'test-no-phone@haldeki.com',
  NULL,
  'Test No Phone User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- ============================================================================
-- Step 3: Create Whitelist Applications
-- ============================================================================

-- Application 1: Pending
INSERT INTO whitelist_applications (id, full_name, phone, email, city, district, user_type, status, source, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-0000000000a1',
  'Test Pending User',
  '5551234567',
  'test-pending@haldeki.com',
  'İzmir',
  'Karşıyaka',
  'B2C',
  'pending',
  'web',
  NOW() - INTERVAL '1 day',
  NOW()
)
ON CONFLICT (phone) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- Application 2: Approved
INSERT INTO whitelist_applications (id, full_name, phone, email, city, district, user_type, status, source, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-0000000000a2',
  'Test Approved User',
  '5551234568',
  'test-approved@haldeki.com',
  'İzmir',
  'Bornova',
  'B2B',
  'approved',
  'web',
  NOW() - INTERVAL '2 days',
  NOW()
)
ON CONFLICT (phone) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- Application 3: Rejected
INSERT INTO whitelist_applications (id, full_name, phone, email, city, district, user_type, status, source, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-0000000000a3',
  'Test Rejected User',
  '5551234569',
  'test-rejected@haldeki.com',
  'İzmir',
  'Buca',
  'B2C',
  'rejected',
  'web',
  NOW() - INTERVAL '3 days',
  NOW()
)
ON CONFLICT (phone) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- Application 4: Duplicate
INSERT INTO whitelist_applications (id, full_name, phone, email, city, district, user_type, status, source, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-0000000000a4',
  'Test Duplicate User',
  '5551234570',
  'test-duplicate@haldeki.com',
  'İzmir',
  'Konak',
  'B2C',
  'duplicate',
  'web',
  NOW() - INTERVAL '4 days',
  NOW()
)
ON CONFLICT (phone) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- Note: No application for test-no-whitelist@haldeki.com (phone: 5551234571)
-- Note: No application for test-no-phone@haldeki.com (phone: NULL)

-- ============================================================================
-- Step 4: Assign Roles (Optional - for role-based redirect testing)
-- ============================================================================

-- Assign 'user' role to test users
INSERT INTO user_roles (user_id, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'user'),
  ('00000000-0000-0000-0000-000000000002', 'user'),
  ('00000000-0000-0000-0000-000000000003', 'user'),
  ('00000000-0000-0000-0000-000000000004', 'user'),
  ('00000000-0000-0000-0000-000000000005', 'user'),
  ('00000000-0000-0000-0000-000000000006', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- View all test users
SELECT
  u.id,
  u.email,
  u.phone,
  u.full_name,
  wa.status as whitelist_status,
  ur.role
FROM users u
LEFT JOIN whitelist_applications wa ON u.phone = wa.phone
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email LIKE 'test-%@haldeki.com'
ORDER BY u.email;

-- View all whitelist applications
SELECT
  id,
  full_name,
  phone,
  email,
  status,
  created_at
FROM whitelist_applications
WHERE phone LIKE '555123%'
ORDER BY phone;

-- ============================================================================
-- Cleanup Script (Use with caution!)
-- ============================================================================

-- Uncomment to delete all test data
-- DELETE FROM user_roles WHERE user_id LIKE '00000000-0000-0000-0000-000000000%';
-- DELETE FROM whitelist_applications WHERE phone LIKE '555123%';
-- DELETE FROM users WHERE email LIKE 'test-%@haldeki.com';
-- Note: Auth users must be deleted via Supabase Auth API or dashboard

-- ============================================================================
-- Instructions for Creating Auth Users
-- ============================================================================

-- Option 1: Via Supabase Dashboard
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Enter email and temporary password
-- 4. Set user ID to match the UUIDs above
-- 5. Repeat for all 6 test users

-- Option 2: Via Script (Recommended)
-- Run: node scripts/create-whitelist-test-users.ts
-- This will create auth users via Supabase Auth API

-- ============================================================================
-- Test Data Summary
-- ============================================================================

-- Email                          Phone         Status          Expected Behavior
-- ----------------------------- ------------  --------------  ----------------------------------
-- test-pending@haldeki.com      5551234567    pending         Redirect to /beklemede
-- test-approved@haldeki.com     5551234568    approved        Redirect to /urunler (normal flow)
-- test-rejected@haldeki.com     5551234569    rejected        Show error + logout
-- test-duplicate@haldeki.com    5551234570    duplicate       Show error + logout
-- test-no-whitelist@haldeki.com 5551234571    (no application) Normal flow (role-based)
-- test-no-phone@haldeki.com     NULL          (no application) Normal flow (skip whitelist)

-- ============================================================================
-- End of Script
-- ============================================================================
