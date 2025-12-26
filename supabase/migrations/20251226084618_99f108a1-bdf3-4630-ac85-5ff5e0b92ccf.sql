-- supplier_offers tablosu: tedarikçilerin ürün teklifleri
CREATE TABLE public.supplier_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  offered_price numeric NOT NULL CHECK (offered_price > 0),
  offered_quantity integer NOT NULL CHECK (offered_quantity > 0),
  unit text NOT NULL DEFAULT 'kg',
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, product_id, status)
);

-- RLS aktif et
ALTER TABLE public.supplier_offers ENABLE ROW LEVEL SECURITY;

-- Supplier kendi tekliflerini görebilir
CREATE POLICY "Suppliers can view own offers"
ON public.supplier_offers FOR SELECT
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
);

-- Supplier kendi tekliflerini oluşturabilir
CREATE POLICY "Suppliers can create own offers"
ON public.supplier_offers FOR INSERT
TO authenticated
WITH CHECK (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
);

-- Supplier kendi pending tekliflerini güncelleyebilir
CREATE POLICY "Suppliers can update own pending offers"
ON public.supplier_offers FOR UPDATE
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
  AND status = 'pending'
);

-- Supplier kendi pending tekliflerini silebilir
CREATE POLICY "Suppliers can delete own pending offers"
ON public.supplier_offers FOR DELETE
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
  AND status = 'pending'
);

-- Admin tüm teklifleri görebilir
CREATE POLICY "Admins can view all offers"
ON public.supplier_offers FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admin teklifleri güncelleyebilir (approve/reject)
CREATE POLICY "Admins can update offers"
ON public.supplier_offers FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_supplier_offers_updated_at
BEFORE UPDATE ON public.supplier_offers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();