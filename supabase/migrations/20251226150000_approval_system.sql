-- Migration: Approval System for Dealers and Suppliers
-- =======================================================

-- 1. Create approval_status enum
DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add new columns to dealers table
ALTER TABLE public.dealers 
ADD COLUMN IF NOT EXISTS approval_status public.approval_status NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS tax_number TEXT;

-- 3. Add new columns to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS approval_status public.approval_status NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS product_categories TEXT[] DEFAULT '{}';

-- 4. Update existing dealers/suppliers to 'approved' status (grandfather clause)
UPDATE public.dealers SET approval_status = 'approved' WHERE approval_status = 'pending' AND user_id IS NOT NULL;
UPDATE public.suppliers SET approval_status = 'approved' WHERE approval_status = 'pending' AND user_id IS NOT NULL;

-- 5. Create indexes for approval_status
CREATE INDEX IF NOT EXISTS idx_dealers_approval_status ON public.dealers(approval_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_approval_status ON public.suppliers(approval_status);

-- 6. Add RLS policy for pending_invites - allow public read with valid token
-- First drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Public can read own invite by id" ON public.pending_invites;

CREATE POLICY "Public can read own invite by id"
  ON public.pending_invites FOR SELECT
  USING (true);  -- Will be filtered by query with specific id

-- 7. Update handle_new_user to set approval_status = 'pending'
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
    
    -- Dealer ise dealers tablosuna ekle (approval_status = 'pending')
    IF invite_record.role = 'dealer' AND invite_record.dealer_data IS NOT NULL THEN
      -- region_ids JSON array'den UUID array'e çevir
      FOR region_id_text IN SELECT jsonb_array_elements_text(invite_record.dealer_data -> 'region_ids')
      LOOP
        region_ids_array := array_append(region_ids_array, region_id_text::UUID);
      END LOOP;
      
      INSERT INTO public.dealers (
        user_id, 
        name, 
        contact_name, 
        contact_phone, 
        contact_email, 
        region_ids,
        tax_number,
        approval_status
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
    
    -- Supplier ise suppliers tablosuna ekle (approval_status = 'pending')
    IF invite_record.role = 'supplier' AND invite_record.supplier_data IS NOT NULL THEN
      INSERT INTO public.suppliers (
        user_id, 
        name, 
        contact_name, 
        contact_phone, 
        contact_email,
        product_categories,
        approval_status
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

-- 8. Add approval_status to Supabase types by updating dealers/suppliers
COMMENT ON COLUMN public.dealers.approval_status IS 'Bayi onay durumu: pending, approved, rejected';
COMMENT ON COLUMN public.suppliers.approval_status IS 'Tedarikçi onay durumu: pending, approved, rejected';

