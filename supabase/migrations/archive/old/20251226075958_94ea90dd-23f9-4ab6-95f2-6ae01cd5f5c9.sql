-- PHASE A: user_roles RLS Güvenlik Düzeltmesi
-- Admin'in superadmin rolünü yönetmesini engelle

-- 1) Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- 2) SELECT: Admin/Superadmin tüm rolleri görebilir (mevcut politika korunuyor)
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 3) INSERT: Superadmin her rolü ekleyebilir
CREATE POLICY "Superadmins can insert any role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- 4) INSERT: Admin sadece non-superadmin rolleri ekleyebilir
CREATE POLICY "Admins can insert non-superadmin roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') 
  AND role != 'superadmin'
);

-- 5) DELETE: Superadmin her rolü silebilir
CREATE POLICY "Superadmins can delete any role"
ON public.user_roles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'));

-- 6) DELETE: Admin sadece non-superadmin rolleri silebilir
CREATE POLICY "Admins can delete non-superadmin roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') 
  AND role != 'superadmin'
);

-- 7) UPDATE: Superadmin her rolü güncelleyebilir
CREATE POLICY "Superadmins can update any role"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- 8) UPDATE: Admin sadece non-superadmin rolleri güncelleyebilir
CREATE POLICY "Admins can update non-superadmin roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin') AND role != 'superadmin')
WITH CHECK (has_role(auth.uid(), 'admin') AND role != 'superadmin');