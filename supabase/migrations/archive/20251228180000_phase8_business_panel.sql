-- Phase 8: Business (B2B) Panel
-- Add 'business' role and create 'businesses' table

-- 1. Add 'business' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business';

-- 2. Create businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    company_name text NOT NULL,
    contact_name text,
    contact_phone text,
    contact_email text,
    business_type text, -- e.g., 'restaurant', 'cafe', 'hotel'
    tax_number text,
    tax_office text,
    region_ids uuid[] DEFAULT '{}',
    approval_status public.approval_status DEFAULT 'pending'::public.approval_status NOT NULL,
    approval_notes text,
    approved_at timestamp with time zone,
    approved_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Add RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view own record" ON public.businesses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage businesses" ON public.businesses
    FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Trigger for updated_at
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Update handle_new_user function to support business role
-- We need to replace the existing function with an updated one
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
      FOR region_id_text IN SELECT jsonb_array_elements_text(invite_record.dealer_data -> 'region_ids')
      LOOP
        region_ids_array := array_append(region_ids_array, region_id_text::UUID);
      END LOOP;
      
      INSERT INTO public.dealers (
        user_id, name, contact_name, contact_phone, contact_email, 
        region_ids, tax_number, approval_status
      )
      VALUES (
        NEW.id,
        COALESCE(invite_record.dealer_data ->> 'name', ''),
        COALESCE(invite_record.dealer_data ->> 'contact_name', NEW.raw_user_meta_data ->> 'full_name'),
        COALESCE(invite_record.dealer_data ->> 'contact_phone', ''),
        COALESCE(invite_record.dealer_data ->> 'contact_email', NEW.email),
        region_ids_array,
        COALESCE(invite_record.dealer_data ->> 'tax_number', NULL),
        'pending'::public.approval_status
      );
    END IF;
    
    -- Supplier ise suppliers tablosuna ekle
    IF invite_record.role = 'supplier' AND invite_record.supplier_data IS NOT NULL THEN
      INSERT INTO public.suppliers (
        user_id, name, contact_name, contact_phone, contact_email,
        product_categories, approval_status
      )
      VALUES (
        NEW.id,
        COALESCE(invite_record.supplier_data ->> 'name', ''),
        COALESCE(invite_record.supplier_data ->> 'contact_name', NEW.raw_user_meta_data ->> 'full_name'),
        COALESCE(invite_record.supplier_data ->> 'contact_phone', ''),
        COALESCE(invite_record.supplier_data ->> 'contact_email', NEW.email),
        COALESCE(
          (SELECT array_agg(x)::TEXT[] FROM jsonb_array_elements_text(invite_record.supplier_data -> 'product_categories') AS x),
          '{}'::TEXT[]
        ),
        'pending'::public.approval_status
      );
    END IF;

    -- Business ise businesses tablosuna ekle (NEW for Phase 8)
    IF invite_record.role = 'business' AND invite_record.dealer_data IS NOT NULL THEN
      -- We reuse dealer_data structure for simplicity in invite flow
      FOR region_id_text IN SELECT jsonb_array_elements_text(invite_record.dealer_data -> 'region_ids')
      LOOP
        region_ids_array := array_append(region_ids_array, region_id_text::UUID);
      END LOOP;

      INSERT INTO public.businesses (
        user_id, company_name, contact_name, contact_phone, contact_email,
        region_ids, tax_number, approval_status
      )
      VALUES (
        NEW.id,
        COALESCE(invite_record.dealer_data ->> 'name', ''),
        COALESCE(invite_record.dealer_data ->> 'contact_name', NEW.raw_user_meta_data ->> 'full_name'),
        COALESCE(invite_record.dealer_data ->> 'contact_phone', ''),
        COALESCE(invite_record.dealer_data ->> 'contact_email', NEW.email),
        region_ids_array,
        COALESCE(invite_record.dealer_data ->> 'tax_number', NULL),
        'pending'::public.approval_status
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

-- 6. Add business_price to region_products
ALTER TABLE public.region_products ADD COLUMN IF NOT EXISTS business_price numeric(10,2);
COMMENT ON COLUMN public.region_products.business_price IS 'İşletmeler (B2B) için özel fiyat';
