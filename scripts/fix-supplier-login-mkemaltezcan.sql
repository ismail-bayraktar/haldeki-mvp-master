-- Fix script for supplier login issue: mkemaltezcan@haldeki.com
-- Date: 2026-01-09
-- Issue: Supplier confirmed email but cannot login

-- ========================================
-- DIAGNOSTIC QUERIES (RUN FIRST)
-- ========================================

-- 1. Check if auth user exists and is confirmed
SELECT
  id,
  email,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'mkemaltezcan@haldeki.com';

-- 2. Check if user_roles record exists
SELECT
  user_id,
  role,
  created_at
FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'mkemaltezcan@haldeki.com'
);

-- 3. Check if suppliers record exists
SELECT
  id,
  user_id,
  company_name,
  approval_status,
  is_active,
  created_at
FROM public.suppliers
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'mkemaltezcan@haldeki.com'
);

-- 4. Check if profiles record exists
SELECT
  id,
  full_name,
  phone,
  created_at
FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'mkemaltezcan@haldeki.com'
);

-- ========================================
-- FIX QUERIES (RUN IF DIAGNOSTICS SHOW MISSING RECORDS)
-- ========================================

-- Get the user_id first (replace with actual ID from diagnostic query above)
-- DO NOT RUN THIS BLOCK - IT'S A TEMPLATE
-- Replace 'USER_ID_FROM_STEP_1' with actual UUID from step 1

-- FIX 1: Create user_roles record if missing
INSERT INTO public.user_roles (user_id, role)
SELECT
  id,
  'supplier'::app_role
FROM auth.users
WHERE email = 'mkemaltezcan@haldeki.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.users.id
      AND role = 'supplier'
  );

-- FIX 2: Create suppliers record if missing
INSERT INTO public.suppliers (
  user_id,
  company_name,
  approval_status,
  is_active,
  created_at
)
SELECT
  id,
  'Test Şirketi', -- Replace with actual company name
  'approved',     -- Admin manually created, so auto-approve
  true,
  now()
FROM auth.users
WHERE email = 'mkemaltezcan@haldeki.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE user_id = auth.users.id
  );

-- FIX 3: Create profiles record if missing (usually auto-created, but just in case)
INSERT INTO public.profiles (id, full_name, phone)
SELECT
  id,
  'Test Kullanıcı', -- Replace with actual name
  NULL              -- Phone number (can be added later)
FROM auth.users
WHERE email = 'mkemaltezcan@haldeki.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.users.id
  );

-- ========================================
-- VERIFICATION QUERIES (RUN AFTER FIXES)
-- ========================================

-- Verify all records are now in place
SELECT
  u.id,
  u.email,
  u.confirmed_at,
  CASE WHEN ur.role IS NOT NULL THEN 'YES' ELSE 'NO' END as has_user_role,
  ur.role,
  CASE WHEN s.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_supplier_record,
  s.approval_status,
  s.is_active,
  CASE WHEN p.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_profile
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'supplier'
LEFT JOIN public.suppliers s ON s.user_id = u.id
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mkemaltezcan@haldeki.com';

-- ========================================
-- LOGIN FLOW REQUIREMENTS CHECKLIST
-- ========================================

-- For mkemaltezcan@haldeki.com to login successfully:
--
-- ✅ auth.users:
--    - id exists
--    - email = 'mkemaltezcan@haldeki.com'
--    - confirmed_at IS NOT NULL (email confirmed)
--    - password is correct
--
-- ✅ user_roles:
--    - user_id matches auth.users.id
--    - role = 'supplier'
--
-- ✅ suppliers:
--    - user_id matches auth.users.id
--    - approval_status = 'approved' (or 'pending' will redirect to /beklemede)
--    - is_active = true (optional, but recommended)
--
-- ✅ profiles:
--    - id matches auth.users.id
--    - phone (optional for suppliers, but recommended)
--
-- Login Flow (AuthContext.tsx:238-329):
-- 1. signInWithPassword() → validates email/password
-- 2. checkUserRoles() → queries user_roles table
-- 3. checkApprovalStatus() → queries suppliers table
-- 4. fetch phone from profiles → for whitelist check (suppliers skip this)
-- 5. getRedirectPathForRole() → returns '/tedarikci' for supplier role
--
-- If any record is missing:
-- - user_roles missing: roles will be empty array → redirect to '/'
-- - suppliers missing: approval_status will be null → may cause issues
-- - profiles missing: non-fatal for suppliers (phone check skipped)
