-- Faz 7: Ödeme Sistemi Migration
-- Tarih: 2025-12-28

-- ============================================
-- 1. Orders Tablosu - Ödeme Yöntemi
-- ============================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT 
  CHECK (payment_method IN ('cash', 'card', 'eft', 'bank_transfer'));

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method_details JSONB DEFAULT NULL;
-- EFT için: { bank_name, account_holder, iban, receipt_url?, notification_date? }
-- Kapıda ödeme için: { type: 'cash' | 'card' }

-- ============================================
-- 2. System Settings Tablosu
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- İlk kayıtlar
INSERT INTO public.system_settings (key, value, description) VALUES
('bank_account', '{"bank_name": "", "account_holder": "", "iban": "", "branch": ""}', 'EFT/Havale için banka hesap bilgileri'),
('payment_settings', '{"eft_enabled": true, "cash_on_delivery_enabled": true}', 'Ödeme yöntemi ayarları')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 3. Payment Notifications Tablosu
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  bank_name TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_date DATE NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_notifications_order_id 
  ON public.payment_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_user_id 
  ON public.payment_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_status 
  ON public.payment_notifications(status);

-- ============================================
-- 4. has_role Fonksiyonu (Eğer yoksa)
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
END;
$$;

-- ============================================
-- 5. RLS Policies
-- ============================================

-- system_settings: Sadece admin erişebilir
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view settings" ON public.system_settings;
CREATE POLICY "Only admins can view settings"
  ON public.system_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::public.app_role) OR has_role(auth.uid(), 'superadmin'::public.app_role));

DROP POLICY IF EXISTS "Only admins can manage settings" ON public.system_settings;
CREATE POLICY "Only admins can manage settings"
  ON public.system_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::public.app_role) OR has_role(auth.uid(), 'superadmin'::public.app_role));

-- payment_notifications: Kullanıcılar kendi bildirimlerini oluşturabilir
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own payment notifications" ON public.payment_notifications;
CREATE POLICY "Users can create own payment notifications"
  ON public.payment_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own payment notifications" ON public.payment_notifications;
CREATE POLICY "Users can view own payment notifications"
  ON public.payment_notifications FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = payment_notifications.order_id 
      AND (
        orders.dealer_id IN (
          SELECT id FROM public.dealers WHERE user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_roles.user_id = auth.uid() 
          AND user_roles.role IN ('admin', 'superadmin')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Dealers and admins can update payment notifications" ON public.payment_notifications;
CREATE POLICY "Dealers and admins can update payment notifications"
  ON public.payment_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = payment_notifications.order_id 
      AND (
        orders.dealer_id IN (
          SELECT id FROM public.dealers WHERE user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_roles.user_id = auth.uid() 
          AND user_roles.role IN ('admin', 'superadmin')
        )
      )
    )
  );

-- ============================================
-- 5. Helper Functions
-- ============================================

-- ============================================
-- 5. Helper Functions
-- ============================================

-- System setting değeri getirme fonksiyonu
CREATE OR REPLACE FUNCTION public.get_system_setting(setting_key TEXT)
RETURNS JSONB AS $$
  SELECT value FROM public.system_settings WHERE key = setting_key;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 6. Storage Bucket (Manuel Oluşturulmalı)
-- ============================================
-- Supabase Dashboard > Storage > Create Bucket
-- Bucket Name: receipts
-- Public: No (Private)
-- File Size Limit: 5MB
-- Allowed MIME Types: image/*, application/pdf
--
-- Storage Policies (Supabase Dashboard > Storage > Policies):
-- 1. Users can upload own receipts:
--    - Policy Name: "Users can upload receipts"
--    - Allowed Operation: INSERT
--    - Policy Definition: (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])
--
-- 2. Users can view own receipts:
--    - Policy Name: "Users can view own receipts"
--    - Allowed Operation: SELECT
--    - Policy Definition: (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])
--
-- 3. Admins and dealers can view all receipts:
--    - Policy Name: "Admins and dealers can view receipts"
--    - Allowed Operation: SELECT
--    - Policy Definition: (
--        bucket_id = 'receipts' AND
--        EXISTS (
--          SELECT 1 FROM public.user_roles
--          WHERE user_roles.user_id = auth.uid()
--          AND user_roles.role IN ('admin', 'superadmin', 'dealer')
--        )
--      )

