-- ============================================================================
-- Phase 3 Trigger Test Suite
-- Purpose: Test whitelist role assignment trigger functionality
-- ============================================================================
-- WARNING: This creates test data. Run on development environment only!

-- Setup: Create test user and application
DO $$
DECLARE
  test_user_id UUID;
  test_phone TEXT := '+905551234599';
BEGIN
  -- Create test user
  INSERT INTO public.users (id, phone, name, created_at)
  VALUES (
    gen_random_uuid(),
    test_phone,
    'Phase 3 Test User',
    NOW()
  )
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO test_user_id;

  RAISE NOTICE 'Created test user: %', test_user_id;

  -- Create pending whitelist application
  INSERT INTO public.whitelist_applications (phone, status, created_at)
  VALUES (test_phone, 'pending', NOW())
  ON CONFLICT (phone) DO NOTHING;

  RAISE NOTICE 'Created whitelist application for: %', test_phone;

  -- Test 1: Approve application - should trigger role assignment
  UPDATE public.whitelist_applications
  SET status = 'approved'
  WHERE phone = test_phone;

  RAISE NOTICE 'Test 1: Application approved';

  -- Verify: Check if role was assigned
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.phone = test_phone
    AND ur.role = 'user'
  ) THEN
    RAISE NOTICE 'Test 1 PASSED: Role assigned correctly';
  ELSE
    RAISE NOTICE 'Test 1 FAILED: Role NOT assigned';
  END IF;

  -- Test 2: Idempotency - Approve again, should not duplicate role
  UPDATE public.whitelist_applications
  SET status = 'approved'
  WHERE phone = test_phone;

  RAISE NOTICE 'Test 2: Application approved again (idempotency test)';

  -- Verify: Count roles - should still be 1
  DECLARE
    role_count INT;
  BEGIN
    SELECT COUNT(*) INTO role_count
    FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.phone = test_phone
    AND ur.role = 'user';

    IF role_count = 1 THEN
      RAISE NOTICE 'Test 2 PASSED: No duplicate roles (count = %)', role_count;
    ELSE
      RAISE NOTICE 'Test 2 FAILED: Duplicate roles detected (count = %)', role_count;
    END IF;
  END;

  -- Test 3: Revert to pending - role should remain (no removal logic)
  UPDATE public.whitelist_applications
  SET status = 'pending'
  WHERE phone = test_phone;

  RAISE NOTICE 'Test 3: Application reverted to pending';

  -- Verify: Role should still exist
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.phone = test_phone
    AND ur.role = 'user'
  ) THEN
    RAISE NOTICE 'Test 3 PASSED: Role remains (correct - trigger is one-way)';
  ELSE
    RAISE NOTICE 'Test 3 FAILED: Role was removed (unexpected)';
  END IF;

  -- Test 4: Reject application - should not assign role
  UPDATE public.whitelist_applications
  SET status = 'rejected'
  WHERE phone = test_phone;

  RAISE NOTICE 'Test 4: Application rejected';

  -- Verify: Role should still exist (from previous approval)
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.phone = test_phone
    AND ur.role = 'user'
  ) THEN
    RAISE NOTICE 'Test 4 PASSED: Status change handled correctly';
  ELSE
    RAISE NOTICE 'Test 4 INFO: Role behavior on rejection';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test suite completed. Check messages above.';
  RAISE NOTICE 'Clean up with: DELETE FROM public.users WHERE phone = ''%''', test_phone;
  RAISE NOTICE '========================================';

END $$;

-- Manual verification query
SELECT
  u.phone,
  u.name AS user_name,
  ur.role AS assigned_role,
  ur.created_at AS role_assigned_at,
  wa.status AS whitelist_status,
  wa.updated_at AS status_last_changed
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.role = 'user'
LEFT JOIN public.whitelist_applications wa ON u.phone = wa.phone
WHERE u.phone = '+905551234599'
OR u.name = 'Phase 3 Test User';

-- Clean up test data (uncomment to run)
-- DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM public.users WHERE phone = '+905551234599');
-- DELETE FROM public.whitelist_applications WHERE phone = '+905551234599';
-- DELETE FROM public.users WHERE phone = '+905551234599';
