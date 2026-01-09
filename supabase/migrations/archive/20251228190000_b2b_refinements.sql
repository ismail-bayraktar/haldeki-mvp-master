-- B2B Refinements: Add business_data to pending_invites and update handle_new_user
-- Date: 2025-12-28

-- 1. Add business_data column to pending_invites if it doesn't exist
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS business_data jsonb;

-- 2. Update handle_new_user function to use business_data for business role
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

    -- Business ise businesses tablosuna ekle (Updated to use business_data)
    IF invite_record.role = 'business' AND invite_record.business_data IS NOT NULL THEN
      FOR region_id_text IN SELECT jsonb_array_elements_text(invite_record.business_data -> 'region_ids')
      LOOP
        region_ids_array := array_append(region_ids_array, region_id_text::UUID);
      END LOOP;

      INSERT INTO public.businesses (
        user_id, company_name, contact_name, contact_phone, contact_email,
        business_type, tax_number, tax_office, region_ids, approval_status
      )
      VALUES (
        NEW.id,
        COALESCE(invite_record.business_data ->> 'name', ''),
        COALESCE(invite_record.business_data ->> 'contact_name', NEW.raw_user_meta_data ->> 'full_name'),
        COALESCE(invite_record.business_data ->> 'contact_phone', ''),
        COALESCE(invite_record.business_data ->> 'contact_email', NEW.email),
        COALESCE(invite_record.business_data ->> 'business_type', NULL),
        COALESCE(invite_record.business_data ->> 'tax_number', NULL),
        COALESCE(invite_record.business_data ->> 'tax_office', NULL),
        region_ids_array,
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
