-- Create Approved Test Supplier for Product Management Testing
-- This migration creates a test supplier account with approval_status='approved'
-- to enable testing of supplier product creation/editing features
--
-- Usage: Run this migration to create a test supplier account
-- The supplier will be able to create and manage products immediately
--
-- Test Account Credentials:
-- Email: test-supplier@haldeki.com
-- Password: Test1234!

-- Step 1: Create auth user for test supplier
DO $$
DECLARE
  v_user_id UUID;
  v_supplier_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'test-supplier@haldeki.com';

  -- If user doesn't exist, create it
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'test-supplier@haldeki.com',
      crypt('Test1234!', gen_salt('bf')),
      now(),
      '{"full_name": "Test Tedarikçi"}',
      '{"provider": "email"}',
      now(),
      now()
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE 'Created auth user: test-supplier@haldeki.com';
  ELSE
    RAISE NOTICE 'Auth user already exists: test-supplier@haldeki.com';
  END IF;

  -- Step 2: Create profile record
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_user_id, 'test-supplier@haldeki.com', 'Test Tedarikçi')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Step 3: Assign supplier role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'supplier'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Step 4: Create supplier record with approved status
  INSERT INTO public.suppliers (
    user_id,
    name,
    contact_name,
    contact_phone,
    contact_email,
    product_categories,
    approval_status,
    is_active
  )
  VALUES (
    v_user_id,
    'Test Tedarikçi Şirketi',
    'Test Yetkilisi',
    '+905551234567',
    'test-supplier@haldeki.com',
    ARRAY['Sebze', 'Meyve']::TEXT[],
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
    updated_at = now()
  RETURNING id INTO v_supplier_id;

  RAISE NOTICE 'Created/updated supplier with ID: %', v_supplier_id;
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Test Supplier Account Created';
  RAISE NOTICE 'Email: test-supplier@haldeki.com';
  RAISE NOTICE 'Password: Test1234!';
  RAISE NOTICE 'Status: approved';
  RAISE NOTICE '====================================';

END $$;
