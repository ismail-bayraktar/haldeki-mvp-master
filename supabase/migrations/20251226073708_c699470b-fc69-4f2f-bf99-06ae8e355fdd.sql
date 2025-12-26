-- Migration-2: Tables + RLS + Trigger Update + Seed
-- ===========================================

-- 1. pending_invites tablosu (davet sistemi)
CREATE TABLE IF NOT EXISTS public.pending_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role public.app_role NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dealer_data JSONB DEFAULT NULL,
  supplier_data JSONB DEFAULT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT pending_invites_role_check CHECK (role IN ('dealer', 'supplier'))
);

-- pending_invites indexes
CREATE INDEX IF NOT EXISTS pending_invites_email_idx ON public.pending_invites(email);
CREATE INDEX IF NOT EXISTS pending_invites_expires_at_idx ON public.pending_invites(expires_at);

-- pending_invites RLS
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins and admins can view all invites"
  ON public.pending_invites FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins and admins can create invites"
  ON public.pending_invites FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins and admins can update invites"
  ON public.pending_invites FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins and admins can delete invites"
  ON public.pending_invites FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- 2. dealers tablosu
CREATE TABLE IF NOT EXISTS public.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  region_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dealers_user_id_unique UNIQUE (user_id)
);

-- dealers GIN index for region_ids
CREATE INDEX IF NOT EXISTS dealers_region_ids_gin ON public.dealers USING GIN (region_ids);

-- dealers RLS
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins and admins can view all dealers"
  ON public.dealers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Dealers can view own record"
  ON public.dealers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins and admins can create dealers"
  ON public.dealers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins and admins can update dealers"
  ON public.dealers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins and admins can delete dealers"
  ON public.dealers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- dealers updated_at trigger
CREATE TRIGGER update_dealers_updated_at
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. suppliers tablosu
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_user_id_unique UNIQUE (user_id)
);

-- suppliers RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins and admins can view all suppliers"
  ON public.suppliers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Suppliers can view own record"
  ON public.suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins and admins can create suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins and admins can update suppliers"
  ON public.suppliers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins and admins can delete suppliers"
  ON public.suppliers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- suppliers updated_at trigger
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. has_role fonksiyonunu güncelle (superadmin → admin yetkisi dahil)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (role = 'superadmin' AND _role = 'admin')
      )
  )
$$;

-- 5. handle_new_user trigger'ını güncelle (invite flow desteği)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_record RECORD;
  region_id_text TEXT;
  region_ids_array UUID[] := '{}';
BEGIN
  -- Profil oluştur
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Bekleyen davet var mı kontrol et
  SELECT * INTO invite_record
  FROM public.pending_invites
  WHERE email = NEW.email
    AND used_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF invite_record IS NOT NULL THEN
    -- Davet bulundu, rolü ata
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invite_record.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Dealer ise dealers tablosuna ekle
    IF invite_record.role = 'dealer' AND invite_record.dealer_data IS NOT NULL THEN
      -- region_ids JSON array'den UUID array'e çevir
      FOR region_id_text IN SELECT jsonb_array_elements_text(invite_record.dealer_data -> 'region_ids')
      LOOP
        region_ids_array := array_append(region_ids_array, region_id_text::UUID);
      END LOOP;
      
      INSERT INTO public.dealers (user_id, name, contact_name, contact_phone, contact_email, region_ids)
      VALUES (
        NEW.id,
        COALESCE(invite_record.dealer_data ->> 'name', ''),
        COALESCE(invite_record.dealer_data ->> 'contact_name', ''),
        COALESCE(invite_record.dealer_data ->> 'contact_phone', ''),
        COALESCE(invite_record.dealer_data ->> 'contact_email', NEW.email),
        region_ids_array
      );
    END IF;
    
    -- Supplier ise suppliers tablosuna ekle
    IF invite_record.role = 'supplier' AND invite_record.supplier_data IS NOT NULL THEN
      INSERT INTO public.suppliers (user_id, name, contact_name, contact_phone, contact_email)
      VALUES (
        NEW.id,
        COALESCE(invite_record.supplier_data ->> 'name', ''),
        COALESCE(invite_record.supplier_data ->> 'contact_name', ''),
        COALESCE(invite_record.supplier_data ->> 'contact_phone', ''),
        COALESCE(invite_record.supplier_data ->> 'contact_email', NEW.email)
      );
    END IF;
    
    -- Daveti kullanıldı olarak işaretle
    UPDATE public.pending_invites
    SET used_at = now()
    WHERE id = invite_record.id;
  ELSE
    -- Normal kullanıcı rolü ata
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Superadmin seed: bayraktarismail00@gmail.com için superadmin rolü ekle
-- (mevcut admin rolü kalır, ek olarak superadmin eklenir)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::public.app_role
FROM auth.users
WHERE email = 'bayraktarismail00@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;