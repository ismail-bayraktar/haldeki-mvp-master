-- Faz 6: Sipariş ve Teslimat Sistemi Migration
-- Tarih: 2025-12-27

-- ============================================
-- 1. Orders Tablosu - Yeni Kolonlar
-- ============================================

-- Bayi ataması
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES public.dealers(id);

-- Ödeme durumu
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial'));

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Teslimat bilgileri
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMPTZ;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- İptal bilgileri
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Sipariş onay zamanı
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES auth.users(id);

-- ============================================
-- 2. Dealer Customers Tablosu (Bayinin Müşterileri)
-- ============================================

CREATE TABLE IF NOT EXISTS public.dealer_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  district TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_dealer_customers_dealer_id ON public.dealer_customers(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_customers_phone ON public.dealer_customers(phone);

-- RLS
ALTER TABLE public.dealer_customers ENABLE ROW LEVEL SECURITY;

-- Bayi kendi müşterilerini görebilir
CREATE POLICY "Dealers can view own customers"
  ON public.dealer_customers FOR SELECT
  USING (
    dealer_id IN (
      SELECT id FROM public.dealers WHERE user_id = auth.uid()
    )
  );

-- Bayi kendi müşterilerini ekleyebilir
CREATE POLICY "Dealers can insert own customers"
  ON public.dealer_customers FOR INSERT
  WITH CHECK (
    dealer_id IN (
      SELECT id FROM public.dealers WHERE user_id = auth.uid()
    )
  );

-- Bayi kendi müşterilerini güncelleyebilir
CREATE POLICY "Dealers can update own customers"
  ON public.dealer_customers FOR UPDATE
  USING (
    dealer_id IN (
      SELECT id FROM public.dealers WHERE user_id = auth.uid()
    )
  );

-- Admin tüm müşterileri yönetebilir
CREATE POLICY "Admins can manage all dealer_customers"
  ON public.dealer_customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================
-- 3. Products Tablosu - Tedarikçi İlişkisi
-- ============================================

-- Ürün-Tedarikçi ilişkisi için kolon
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id);

-- Index
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);

-- ============================================
-- 4. Orders RLS Güncellemeleri
-- ============================================

-- Bayi atandığı bölgelerdeki siparişleri görebilir
DROP POLICY IF EXISTS "Dealers can view region orders" ON public.orders;
CREATE POLICY "Dealers can view region orders"
  ON public.orders FOR SELECT
  USING (
    region_id IN (
      SELECT unnest(region_ids) FROM public.dealers WHERE user_id = auth.uid()
    )
  );

-- Bayi atandığı siparişleri güncelleyebilir
DROP POLICY IF EXISTS "Dealers can update assigned orders" ON public.orders;
CREATE POLICY "Dealers can update assigned orders"
  ON public.orders FOR UPDATE
  USING (
    dealer_id IN (
      SELECT id FROM public.dealers WHERE user_id = auth.uid()
    )
    OR
    region_id IN (
      SELECT unnest(region_ids) FROM public.dealers WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Supabase Storage Bucket (Teslimat Fotoğrafları)
-- ============================================

-- Not: Bu bucket Supabase Dashboard'dan manuel oluşturulmalı
-- Bucket adı: delivery-photos
-- Public: false
-- Allowed MIME types: image/*

-- ============================================
-- 6. Types Güncellemesi için yardımcı fonksiyon
-- ============================================

-- Sipariş durumu enum'u (opsiyonel - mevcut text olarak kalabilir)
-- CREATE TYPE public.order_status AS ENUM (
--   'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'
-- );

COMMENT ON TABLE public.dealer_customers IS 'Bayilerin kaydettigi isletme/musteri kayitlari';
COMMENT ON COLUMN public.orders.dealer_id IS 'Siparisi teslim edecek bayi';
COMMENT ON COLUMN public.orders.payment_status IS 'Odeme durumu: unpaid, paid, partial';
COMMENT ON COLUMN public.orders.delivery_photo_url IS 'Teslimat kaniti fotografi';

