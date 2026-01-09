-- ============================================================================
-- Whitelist Applications Table Migration
-- Date: 2026-01-10
-- Purpose: Store whitelist applications for İzmir launch
-- Security: Insert-only from public, RLS policies for access control
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: whitelist_applications
-- ----------------------------------------------------------------------------
-- Stores vendor/whitelist applications with dedupe support
-- Public: INSERT only (no SELECT)
-- Admin: Full access
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.whitelist_applications (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Applicant Information (Required)
  -- Turkish: Başvuranın tam adı
  full_name TEXT NOT NULL CHECK (LENGTH(TRIM(full_name)) >= 2),

  -- Turkish: Telefon numarası (normalize edilecek)
  phone TEXT NOT NULL CHECK (LENGTH(phone) >= 10),

  -- Applicant Information (Optional)
  -- Turkish: E-posta adresi (opsiyonel)
  email TEXT,

  -- Turkish: Şehir
  city TEXT,

  -- Turkish: İlçe
  district TEXT,

  -- Turkish: Kullanıcı tipi (B2B: İşletme, B2C: Bireysel)
  user_type TEXT DEFAULT 'B2C' CHECK (user_type IN ('B2B', 'B2C')),

  -- Turkish: Ek notlar
  notes TEXT,

  -- Application Status
  -- Turkish: Başvuru durumu
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),

  -- Audit Trail
  -- Turkish: Başvuru kaynağı (web, referans, admin)
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'referral', 'admin')),

  -- Turkish: IP adresi (spam koruması)
  ip_address TEXT,

  -- Turkish: Tarayıcı bilgisi
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  -- Turkish: Her telefon numarası için tek başvuru
  CONSTRAINT whitelist_phone_unique UNIQUE (phone)
);

-- ============================================================================
-- UNIQUE EMAIL INDEX (Partial Index)
-- ============================================================================
-- Turkish: E-posta benzersizlik kısıtı (opsiyonel)
CREATE UNIQUE INDEX IF NOT EXISTS whitelist_email_unique_idx
  ON public.whitelist_applications(email)
  WHERE email IS NOT NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Turkish: Telefon bazlı arama (duplicate check için)
CREATE INDEX IF NOT EXISTS idx_whitelist_phone
  ON public.whitelist_applications(phone);

-- Turkish: Bekleyen başvurular (admin paneli için)
CREATE INDEX IF NOT EXISTS idx_whitelist_status_created
  ON public.whitelist_applications(status, created_at DESC);

-- Turkish: Kaynak bazlı raporlama
CREATE INDEX IF NOT EXISTS idx_whitelist_source
  ON public.whitelist_applications(source, created_at DESC);

-- Turkish: IP bazlı rate limiting (son 24 saat)
CREATE INDEX IF NOT EXISTS idx_whitelist_ip_created
  ON public.whitelist_applications(ip_address, created_at DESC)
  WHERE ip_address IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.whitelist_applications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Policy 1: Public INSERT (authentication NOT required)
-- ---------------------------------------------------------------------------
-- Turkish: Herkes başvuru gönderebilir (okuma yetkisi yok)
CREATE POLICY "Public can insert whitelist applications"
  ON public.whitelist_applications
  FOR INSERT
  TO public
  WITH CHECK (
    full_name IS NOT NULL
    AND phone IS NOT NULL
    AND LENGTH(TRIM(full_name)) >= 2
    AND LENGTH(phone) >= 10
  );

-- ---------------------------------------------------------------------------
-- Policy 2: Admins have full access
-- ---------------------------------------------------------------------------
-- Turkish: Yöneticiler tüm başvuruları yönetebilir
CREATE POLICY "Admins can manage all applications"
  ON public.whitelist_applications
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- ---------------------------------------------------------------------------
-- Policy 3: Service role full access
-- ---------------------------------------------------------------------------
-- Turkish: Servis rolü tam yetkiye sahip
CREATE POLICY "Service role full access"
  ON public.whitelist_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

-- Turkish: Güncelleme zaman damgası otomatik güncelleme
CREATE OR REPLACE FUNCTION update_whitelist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whitelist_updated_at
  BEFORE UPDATE ON public.whitelist_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_whitelist_updated_at();

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Turkish: Public sadece INSERT yapabilir
GRANT INSERT ON TABLE public.whitelist_applications TO public;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.whitelist_applications IS
'Turkish: Tedarikçi/beyaz liste başvuruları tablosu | English: Whitelist applications table for early access signup';

COMMENT ON COLUMN public.whitelist_applications.id IS
'Primary Key';

COMMENT ON COLUMN public.whitelist_applications.full_name IS
'Turkish: Başvuranın tam adı (en az 2 karakter) | English: Applicant full name (min 2 chars)';

COMMENT ON COLUMN public.whitelist_applications.phone IS
'Turkish: Telefon numarası (benzersiz) | English: Phone number (unique)';

COMMENT ON COLUMN public.whitelist_applications.email IS
'Turkish: E-posta adresi (opsiyonel, benzersiz) | English: Email address (optional, unique if provided)';

COMMENT ON COLUMN public.whitelist_applications.status IS
'Turkish: pending, approved, rejected, duplicate | English: Application status';

COMMENT ON COLUMN public.whitelist_applications.ip_address IS
'Turkish: IP adresi (spam koruması) | English: IP address (spam protection)';
