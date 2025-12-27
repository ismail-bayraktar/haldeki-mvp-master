-- ============================================================================
-- HALDEKI.COM - FULL DATABASE SCHEMA
-- ============================================================================
-- Bu dosya tüm veritabanı şemasını içerir.
-- Yeni bir Supabase projesinde SQL Editor'da çalıştırın.
-- 
-- Tarih: 2025-12-26
-- Versiyon: 1.0
-- ============================================================================

-- ============================================================================
-- BÖLÜM 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- ============================================================================
-- BÖLÜM 2: ENUM TYPES
-- ============================================================================

-- Rol enum'u
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'superadmin', 'dealer', 'supplier');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Onay durumu enum'u
DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ürün birimi enum'u
DO $$ BEGIN
  CREATE TYPE public.product_unit AS ENUM ('kg', 'adet', 'demet', 'paket');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Kalite derecesi enum'u
DO $$ BEGIN
  CREATE TYPE public.quality_grade AS ENUM ('premium', 'standart', 'ekonomik');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Stok durumu enum'u
DO $$ BEGIN
  CREATE TYPE public.availability_status AS ENUM ('plenty', 'limited', 'last');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Fiyat değişimi enum'u
DO $$ BEGIN
  CREATE TYPE public.price_change AS ENUM ('up', 'down', 'stable');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- BÖLÜM 3: HELPER FUNCTIONS (Tablolardan bağımsız)
-- ============================================================================

-- Updated at trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- BÖLÜM 4: CORE TABLES
-- ============================================================================

-- Profiller tablosu
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Kullanıcı rolleri tablosu
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Bölgeler tablosu
CREATE TABLE IF NOT EXISTS public.regions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    is_active boolean DEFAULT true NOT NULL,
    delivery_slots jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Ürünler tablosu
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    category text NOT NULL,
    unit public.product_unit DEFAULT 'kg'::public.product_unit NOT NULL,
    base_price numeric(10,2) NOT NULL,
    images text[] DEFAULT '{}'::text[],
    origin text DEFAULT 'Türkiye',
    quality public.quality_grade DEFAULT 'standart'::public.quality_grade,
    availability public.availability_status DEFAULT 'plenty'::public.availability_status,
    price_change public.price_change DEFAULT 'stable'::public.price_change,
    previous_price numeric(10,2),
    arrival_date date DEFAULT CURRENT_DATE,
    is_bugun_halde boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Bölge ürünleri tablosu (fiyat/stok)
CREATE TABLE IF NOT EXISTS public.region_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    quality_grade public.quality_grade DEFAULT 'standart'::public.quality_grade,
    availability_status public.availability_status DEFAULT 'plenty'::public.availability_status,
    price_change public.price_change DEFAULT 'stable'::public.price_change,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (region_id, product_id)
);

-- Siparişler tablosu
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
    dealer_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    shipping_address jsonb,
    delivery_slot jsonb,
    items jsonb NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- BÖLÜM 5: ROLE-SPECIFIC TABLES
-- ============================================================================

-- Bekleyen davetler tablosu
CREATE TABLE IF NOT EXISTS public.pending_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    email text NOT NULL,
    role public.app_role NOT NULL,
    invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    dealer_data jsonb,
    supplier_data jsonb,
    expires_at timestamp with time zone DEFAULT (now() + interval '7 days') NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (email, role)
);

-- Bayiler tablosu
CREATE TABLE IF NOT EXISTS public.dealers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    name text NOT NULL,
    contact_name text,
    contact_phone text,
    contact_email text,
    region_ids uuid[] DEFAULT '{}',
    tax_number text,
    approval_status public.approval_status DEFAULT 'pending'::public.approval_status NOT NULL,
    approval_notes text,
    approved_at timestamp with time zone,
    approved_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tedarikçiler tablosu
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    name text NOT NULL,
    contact_name text,
    contact_phone text,
    contact_email text,
    product_categories text[] DEFAULT '{}',
    approval_status public.approval_status DEFAULT 'pending'::public.approval_status NOT NULL,
    approval_notes text,
    approved_at timestamp with time zone,
    approved_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tedarikçi teklifleri tablosu
CREATE TABLE IF NOT EXISTS public.supplier_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_name text NOT NULL,
    category text NOT NULL,
    unit public.product_unit NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    quality_grade public.quality_grade DEFAULT 'standart'::public.quality_grade,
    notes text,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_notes text,
    valid_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- BÖLÜM 6: ROLE HELPER FUNCTION (Tablolardan sonra)
-- ============================================================================

-- Rol kontrol fonksiyonu (superadmin dahil)
-- NOT: Bu fonksiyon user_roles tablosuna bağımlı, o yüzden tablolardan sonra tanımlanmalı
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role 
        OR (_role = 'admin' AND role = 'superadmin')
      )
  )
$$;

-- ============================================================================
-- BÖLÜM 7: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_regions_slug ON public.regions(slug);
CREATE INDEX IF NOT EXISTS idx_regions_is_active ON public.regions(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_bugun_halde ON public.products(is_bugun_halde);
CREATE INDEX IF NOT EXISTS idx_region_products_region ON public.region_products(region_id);
CREATE INDEX IF NOT EXISTS idx_region_products_product ON public.region_products(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_region ON public.orders(region_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_dealers_approval_status ON public.dealers(approval_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_approval_status ON public.suppliers(approval_status);
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON public.pending_invites(email);
CREATE INDEX IF NOT EXISTS idx_supplier_offers_supplier ON public.supplier_offers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_offers_status ON public.supplier_offers(status);

-- ============================================================================
-- BÖLÜM 8: TRIGGERS
-- ============================================================================

-- Updated at triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS regions_updated_at ON public.regions;
CREATE TRIGGER regions_updated_at BEFORE UPDATE ON public.regions 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS region_products_updated_at ON public.region_products;
CREATE TRIGGER region_products_updated_at BEFORE UPDATE ON public.region_products 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS dealers_updated_at ON public.dealers;
CREATE TRIGGER dealers_updated_at BEFORE UPDATE ON public.dealers 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS suppliers_updated_at ON public.suppliers;
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS supplier_offers_updated_at ON public.supplier_offers;
CREATE TRIGGER supplier_offers_updated_at BEFORE UPDATE ON public.supplier_offers 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- BÖLÜM 9: HANDLE NEW USER FUNCTION & TRIGGER
-- ============================================================================

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

-- Auth trigger (sadece yoksa oluştur)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- BÖLÜM 10: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- RLS'i etkinleştir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_offers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BÖLÜM 11: RLS POLICIES - PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- BÖLÜM 12: RLS POLICIES - USER ROLES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles 
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles 
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles 
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- BÖLÜM 13: RLS POLICIES - REGIONS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active regions" ON public.regions;
CREATE POLICY "Anyone can view active regions" ON public.regions 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage regions" ON public.regions;
CREATE POLICY "Admins can manage regions" ON public.regions 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- BÖLÜM 14: RLS POLICIES - PRODUCTS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- BÖLÜM 15: RLS POLICIES - REGION PRODUCTS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view region products" ON public.region_products;
CREATE POLICY "Anyone can view region products" ON public.region_products 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage region products" ON public.region_products;
CREATE POLICY "Admins can manage region products" ON public.region_products 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- BÖLÜM 16: RLS POLICIES - ORDERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders" ON public.orders 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders 
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- BÖLÜM 17: RLS POLICIES - PENDING INVITES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage invites" ON public.pending_invites;
CREATE POLICY "Admins can manage invites" ON public.pending_invites 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public can read own invite by id" ON public.pending_invites;
CREATE POLICY "Public can read own invite by id" ON public.pending_invites 
  FOR SELECT USING (true);

-- ============================================================================
-- BÖLÜM 18: RLS POLICIES - DEALERS
-- ============================================================================

DROP POLICY IF EXISTS "Dealers can view own record" ON public.dealers;
CREATE POLICY "Dealers can view own record" ON public.dealers 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage dealers" ON public.dealers;
CREATE POLICY "Admins can manage dealers" ON public.dealers 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- BÖLÜM 19: RLS POLICIES - SUPPLIERS
-- ============================================================================

DROP POLICY IF EXISTS "Suppliers can view own record" ON public.suppliers;
CREATE POLICY "Suppliers can view own record" ON public.suppliers 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
CREATE POLICY "Admins can manage suppliers" ON public.suppliers 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- BÖLÜM 20: RLS POLICIES - SUPPLIER OFFERS
-- ============================================================================

DROP POLICY IF EXISTS "Suppliers can view own offers" ON public.supplier_offers;
CREATE POLICY "Suppliers can view own offers" ON public.supplier_offers 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suppliers 
      WHERE id = supplier_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Suppliers can create own offers" ON public.supplier_offers;
CREATE POLICY "Suppliers can create own offers" ON public.supplier_offers 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers 
      WHERE id = supplier_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage supplier offers" ON public.supplier_offers;
CREATE POLICY "Admins can manage supplier offers" ON public.supplier_offers 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- BÖLÜM 21: COMMENTS
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'Kullanıcı profil bilgileri';
COMMENT ON TABLE public.user_roles IS 'Kullanıcı rolleri (multi-role destekli)';
COMMENT ON TABLE public.regions IS 'Teslimat bölgeleri ve slot bilgileri';
COMMENT ON TABLE public.products IS 'Ana ürün kataloğu';
COMMENT ON TABLE public.region_products IS 'Bölgeye özel fiyat ve stok bilgileri';
COMMENT ON TABLE public.orders IS 'Müşteri siparişleri';
COMMENT ON TABLE public.pending_invites IS 'Bayi/Tedarikçi davet sistemi';
COMMENT ON TABLE public.dealers IS 'Bayi bilgileri ve onay durumu';
COMMENT ON TABLE public.suppliers IS 'Tedarikçi bilgileri ve onay durumu';
COMMENT ON TABLE public.supplier_offers IS 'Tedarikçi ürün teklifleri';

COMMENT ON COLUMN public.dealers.approval_status IS 'Bayi onay durumu: pending, approved, rejected';
COMMENT ON COLUMN public.suppliers.approval_status IS 'Tedarikçi onay durumu: pending, approved, rejected';

-- ============================================================================
-- SCHEMA OLUŞTURMA TAMAMLANDI
-- ============================================================================

