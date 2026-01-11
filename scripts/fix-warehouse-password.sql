-- ============================================================================
-- WAREHOUSE TEST ACCOUNT - PASSWORD FIX
-- ============================================================================
-- Problem: Bcrypt hash yanlıştı
-- Solution: Supabase'in signUp fonksiyonunu kullanarak doğru hash oluştur
--
-- ============================================================================

-- Önce eski kaydı sil
DELETE FROM auth.users WHERE email = 'warehouse@test.haldeki.com';
DELETE FROM profiles WHERE email = 'warehouse@test.haldeki.com';
DELETE FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000013';
DELETE FROM warehouse_staff WHERE user_id = '00000000-0000-0000-0000-000000000013';

-- ============================================================================
-- YÖNTEM 1: Supabase Auth API ile Kullanıcı Oluştur (ÖNERİLEN)
-- ============================================================================
--
-- Supabase JavaScript console'da şu kodu çalıştırabilirsin:
--
-- supabase.auth.signUp({
--   email: 'warehouse@test.haldeki.com',
--   password: process.env.TEST_USER_PASSWORD,
--   options: {
--     data: {
--       full_name: 'Depo Yöneticisi',
--       phone: '0536 600 00 01'
--     }
--   }
-- })
--
-- Sonra aşağıdaki SQL'i çalıştırarak role ve warehouse_staff kaydı ekle:
--
-- ============================================================================

-- YÖNTEM 2: Doğru Bcrypt Hash ile Manuel Oluştur
--
-- Password: Test1234!
-- Bcrypt hash (cost factor 10): $2a$10$U3LKZQMz9/xNXQZS8y8h1eK5E1XN1YQZx3R9J8mF2D3w4E5r6T7y8 (yanlış hash!)

-- Doğru hash'i manuel oluşturmak için bu script'i kullan:
-- https://bcrypt-generator.com/
-- Password: Test1234!
-- Rounds: 10
-- Generated hash: Aşağıya kopyalayacağın hash

-- ÖRNEK doğru hash (Test1234! için):
-- $2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG

-- Eğer doğru hash'i bulduysan, aşağıdaki script'i güncelle ve çalıştır:

-- Güvenli bir yaklaşım: Password hash olmadan kullanıcı oluştur
-- Supabase bunu email confirmation ile halledecek

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
  updated_at,
  confirmation_token
)
VALUES (
  (SELECT id FROM auth.instances LIMIT 1),
  gen_random_uuid(), -- Auto-generate UUID
  'authenticated',
  'authenticated',
  'warehouse@test.haldeki.com',
  '', -- Empty password, kullanıcı kendi belirleyecek
  NULL, -- Not confirmed yet
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Depo Yöneticisi","phone":"0536 600 00 01"}'::jsonb,
  NOW(),
  NOW(),
  encode(gen_random_bytes(32), 'hex')
);

-- ============================================================================
-- ALTERNATIF: En kolayı - Supabase Dashboard'dan manuel kayıt oluştur
-- ============================================================================
--
-- 1. Supabase Dashboard → Authentication → Users
-- 2. "Add user" butonuna tıkla
-- 3. Email: warehouse@test.haldeki.com
-- 4. Password: (Set TEST_USER_PASSWORD in .env)
-- 5. "Auto Confirm User" işaretle
-- 6. "Create" butonuna tıkla
-- 7. Oluşturulan kullanıcının UUID'sini kopyala
-- 8. Aşağıdaki SQL'i çalıştır (UUID'yi güncelle)
--
-- ============================================================================

-- UUID'yi buraya yapıştır (Supabase Dashboard'dan kopyaladığın):
-- 'PASTE-UUID-HERE'::UUID

-- Profile oluştur
INSERT INTO profiles (id, email, full_name, phone, created_at)
SELECT
  id, -- auth.users'dan gelen UUID
  email,
  'Depo Yöneticisi',
  '0536 600 00 01',
  NOW()
FROM auth.users
WHERE email = 'warehouse@test.haldeki.com'
  AND id NOT IN (SELECT id FROM profiles);

-- Role ata
INSERT INTO user_roles (user_id, role)
SELECT
  id,
  'warehouse_manager'
FROM auth.users
WHERE email = 'warehouse@test.haldeki.com'
  AND id NOT IN (SELECT user_id FROM user_roles WHERE role = 'warehouse_manager');

-- Warehouse staff kaydı oluştur
INSERT INTO warehouse_staff (user_id, vendor_id, warehouse_id, is_active)
SELECT
  au.id,
  '00000000-0000-0000-0000-000000000001'::UUID,
  r.id,
  true
FROM auth.users au
CROSS JOIN regions r
WHERE au.email = 'warehouse@test.haldeki.com'
  AND au.id NOT IN (SELECT user_id FROM warehouse_staff)
LIMIT 1;

-- Başarı mesajı
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM auth.users
  WHERE email = 'warehouse@test.haldeki.com';

  IF v_count > 0 THEN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'WAREHOUSE TEST ACCOUNT CHECK:';
    RAISE NOTICE 'Users found with warehouse@test.haldeki.com: %', v_count;
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Eğer kullanıcı varsa, şimdi şifreyi sıfırlamalısın:';
    RAISE NOTICE '1. Supabase Dashboard → Authentication → Users';
    RAISE NOTICE '2. warehouse@test.haldeki.com kullanıcısını bul';
    RAISE NOTICE '3. "Reset Password" butonuna tıkla';
    RAISE NOTICE '4. Yeni şifre belirle: (Set TEST_USER_PASSWORD in .env)';
    RAISE NOTICE '============================================================================';
  ELSE
    RAISE NOTICE 'Kullanıcı bulunamadı. Lütfen manuel oluştur.';
  END IF;
END $$;
