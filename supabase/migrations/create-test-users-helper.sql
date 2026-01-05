-- ============================================================================
-- TEST ACCOUNTS CREATION HELPER
-- ============================================================================
-- Purpose: SQL statements to create auth.users via Supabase Admin API
-- Usage: Run these individually in Supabase Dashboard SQL Editor
-- Note: Requires service_role key (bypasses RLS)
-- ============================================================================

-- IMPORTANT: These commands require service_role privileges
-- Run in Supabase Dashboard: SQL Editor > New Query
-- Or use via Edge Function with service_role key

-- ============================================================================
-- OPTION 1: Create users via admin API (Dashboard SQL Editor)
-- ============================================================================

-- 1. SUPERADMIN
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'superadmin@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Süper Yönetici')
  )
);

-- 2. ADMIN
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'admin@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Sistem Yöneticisi')
  )
);

-- 3. APPROVED DEALER
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'dealer-approved@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Mehmet Yılmaz')
  )
);

-- 4. PENDING DEALER
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'dealer-pending@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Ayşe Demir')
  )
);

-- 5. APPROVED SUPPLIER
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'supplier-approved@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Ali Kaya')
  )
);

-- 6. PENDING SUPPLIER
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'supplier-pending@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Zeynep Arslan')
  )
);

-- 7. APPROVED BUSINESS
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'business-approved@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Can Öztürk')
  )
);

-- 8. PENDING BUSINESS
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'business-pending@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Elif Şahin')
  )
);

-- 9. CUSTOMER 1
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'customer1@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Fatma Yıldız')
  )
);

-- 10. CUSTOMER 2
SELECT *
FROM net.http_post(
  url := 'https://your-project.supabase.co/auth/v1/admin/users',
  headers := jsonb_build_object(
    'apikey', 'your-service-role-key',
    'Authorization', 'Bearer your-service-role-key',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'email', 'customer2@test.haldeki.com',
    'password', 'Test1234!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('full_name', 'Hasan Çelik')
  )
);

-- ============================================================================
-- OPTION 2: Alternative - Use Edge Function (Recommended)
-- ============================================================================
-- Create Edge Function: supabase/functions/create-test-users/index.ts
-- See TypeScript file in the functions directory
-- ============================================================================
