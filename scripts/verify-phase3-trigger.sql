-- ============================================================================
-- Phase 3 Trigger Deployment Verification
-- Purpose: Check if whitelist role trigger is deployed and functional
-- ============================================================================

-- 1. Check if trigger exists and is enabled
SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled,
  CASE tgenabled
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
    WHEN 'R' THEN 'Replica'
    WHEN 'A' THEN 'Always'
  END AS enabled_status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE tgname = 'on_whitelist_approved'
AND n.nspname = 'public';

-- Expected: 1 row, enabled = 'O' (Enabled)

-- 2. Check if function exists and has proper security
SELECT
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  CASE p.prosecdef
    WHEN true THEN 'SECURITY DEFINER (privilege escalation)'
    WHEN false THEN 'SECURITY INVOKER (no privilege escalation)'
  END AS security_mode,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'assign_user_role_on_approval'
AND n.nspname = 'public';

-- Expected: prosecdef = true (SECURITY DEFINER)

-- 3. Verify RLS policies on user_roles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Expected: Policies allowing trigger inserts (system user or service role)

-- 4. Check whitelist_applications table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'whitelist_applications'
ORDER BY ordinal_position;

-- Expected: status column exists

-- 5. Check user_roles table structure and constraints
SELECT
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  cn.constraint_name,
  cn.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
  ON c.table_name = kcu.table_name
  AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints cn
  ON kcu.constraint_name = cn.constraint_name
WHERE c.table_schema = 'public'
AND c.table_name = 'user_roles'
ORDER BY c.ordinal_position;

-- Expected: user_id, role columns with proper constraints

-- 6. Verify function ownership and permissions
SELECT
  p.proname AS function_name,
  pg_get_userbyid(p.proowner) AS owner,
  has_function_privilege(p.oid, 'EXECUTE') AS can_execute,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'assign_user_role_on_approval'
AND n.nspname = 'public';

-- 7. Test query: Check for any recent role assignments from trigger
SELECT
  ua.created_at,
  u.phone,
  u.name AS user_name,
  ua.role,
  wa.status AS whitelist_status,
  wa.created_at AS application_date
FROM public.user_roles ua
JOIN public.users u ON ua.user_id = u.id
LEFT JOIN public.whitelist_applications wa ON u.phone = wa.phone
WHERE ua.role = 'user'
ORDER BY ua.created_at DESC
LIMIT 10;
