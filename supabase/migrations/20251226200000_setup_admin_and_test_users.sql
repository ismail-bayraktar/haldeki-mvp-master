-- ============================================================================
-- ADMIN VE TEST KULLANICILARI KURULUMU
-- ============================================================================
-- Tarih: 2025-12-26
-- ============================================================================

-- 1. bayraktarismail00@gmail.com kullanıcısına superadmin rolü ata
-- (Eğer kullanıcı kayıtlıysa)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::public.app_role
FROM auth.users
WHERE email = 'bayraktarismail00@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Test bayi için pending invite oluştur
INSERT INTO public.pending_invites (email, role, dealer_data)
VALUES (
  'test.bayi@haldeki.com',
  'dealer'::public.app_role,
  '{
    "name": "Test Bayi",
    "contact_name": "Test Bayi Kullanıcı",
    "contact_phone": "0555 111 2233",
    "region_ids": []
  }'::jsonb
)
ON CONFLICT (email, role) DO NOTHING;

-- 3. Test tedarikçi için pending invite oluştur
INSERT INTO public.pending_invites (email, role, supplier_data)
VALUES (
  'test.tedarikci@haldeki.com',
  'supplier'::public.app_role,
  '{
    "name": "Test Tedarikçi",
    "contact_name": "Test Tedarikçi Kullanıcı",
    "contact_phone": "0555 444 5566",
    "product_categories": ["sebzeler", "meyveler"]
  }'::jsonb
)
ON CONFLICT (email, role) DO NOTHING;

-- ============================================================================
-- NOT: Test hesapları oluşturmak için Supabase Dashboard kullanılmalı
-- Auth > Users > Invite User ile aşağıdaki bilgilerle davet gönderin:
--
-- Bayi:
--   Email: test.bayi@haldeki.com
--   (Kayıt olduğunda otomatik dealer rolü atanacak)
--
-- Tedarikçi:
--   Email: test.tedarikci@haldeki.com
--   (Kayıt olduğunda otomatik supplier rolü atanacak)
-- ============================================================================

