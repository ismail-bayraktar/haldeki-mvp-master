-- Constraint olarak kaldır (index değil)
ALTER TABLE public.supplier_offers 
DROP CONSTRAINT IF EXISTS supplier_offers_supplier_id_product_id_status_key;

-- Partial unique index: tek pending teklif per supplier+product
CREATE UNIQUE INDEX supplier_offers_one_pending_per_product
ON public.supplier_offers (supplier_id, product_id)
WHERE status = 'pending';