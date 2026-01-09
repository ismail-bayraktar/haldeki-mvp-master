-- Add database-level validation constraints for critical fields
-- This provides server-side validation as defense-in-depth

-- Orders table: Add constraints for price validation and text limits
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_total_amount_positive CHECK (total_amount > 0 AND total_amount < 1000000);

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_notes_length CHECK (char_length(notes) <= 2000);

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_status_valid CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

-- Products table: Add constraints for price validation
ALTER TABLE public.products 
  ADD CONSTRAINT products_price_range CHECK (price > 0 AND price < 100000);

ALTER TABLE public.products 
  ADD CONSTRAINT products_previous_price_range CHECK (previous_price IS NULL OR (previous_price > 0 AND previous_price < 100000));

ALTER TABLE public.products 
  ADD CONSTRAINT products_name_length CHECK (char_length(name) <= 200);

ALTER TABLE public.products 
  ADD CONSTRAINT products_description_length CHECK (description IS NULL OR char_length(description) <= 5000);

-- Region products: Add constraints for price validation
ALTER TABLE public.region_products 
  ADD CONSTRAINT region_products_price_range CHECK (price > 0 AND price < 100000);

ALTER TABLE public.region_products 
  ADD CONSTRAINT region_products_previous_price_range CHECK (previous_price IS NULL OR (previous_price > 0 AND previous_price < 100000));

ALTER TABLE public.region_products 
  ADD CONSTRAINT region_products_stock_quantity_range CHECK (stock_quantity IS NULL OR (stock_quantity >= 0 AND stock_quantity < 1000000));

-- Supplier offers: Add constraints for price and quantity validation
ALTER TABLE public.supplier_offers 
  ADD CONSTRAINT supplier_offers_price_range CHECK (offered_price > 0 AND offered_price < 100000);

ALTER TABLE public.supplier_offers 
  ADD CONSTRAINT supplier_offers_quantity_range CHECK (offered_quantity > 0 AND offered_quantity < 1000000);

ALTER TABLE public.supplier_offers 
  ADD CONSTRAINT supplier_offers_notes_length CHECK (notes IS NULL OR char_length(notes) <= 2000);

ALTER TABLE public.supplier_offers 
  ADD CONSTRAINT supplier_offers_status_valid CHECK (status IN ('pending', 'approved', 'rejected'));

-- Dealers: Add constraints for text field lengths
ALTER TABLE public.dealers 
  ADD CONSTRAINT dealers_name_length CHECK (char_length(name) <= 200);

ALTER TABLE public.dealers 
  ADD CONSTRAINT dealers_contact_name_length CHECK (contact_name IS NULL OR char_length(contact_name) <= 200);

ALTER TABLE public.dealers 
  ADD CONSTRAINT dealers_contact_phone_length CHECK (contact_phone IS NULL OR char_length(contact_phone) <= 30);

ALTER TABLE public.dealers 
  ADD CONSTRAINT dealers_contact_email_length CHECK (contact_email IS NULL OR char_length(contact_email) <= 255);

-- Suppliers: Add constraints for text field lengths
ALTER TABLE public.suppliers 
  ADD CONSTRAINT suppliers_name_length CHECK (char_length(name) <= 200);

ALTER TABLE public.suppliers 
  ADD CONSTRAINT suppliers_contact_name_length CHECK (contact_name IS NULL OR char_length(contact_name) <= 200);

ALTER TABLE public.suppliers 
  ADD CONSTRAINT suppliers_contact_phone_length CHECK (contact_phone IS NULL OR char_length(contact_phone) <= 30);

ALTER TABLE public.suppliers 
  ADD CONSTRAINT suppliers_contact_email_length CHECK (contact_email IS NULL OR char_length(contact_email) <= 255);

-- Profiles: Add constraints for text field lengths
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_full_name_length CHECK (full_name IS NULL OR char_length(full_name) <= 200);

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_phone_length CHECK (phone IS NULL OR char_length(phone) <= 30);

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_email_length CHECK (email IS NULL OR char_length(email) <= 255);

-- Regions: Add constraints for delivery settings
ALTER TABLE public.regions 
  ADD CONSTRAINT regions_min_order_amount_range CHECK (min_order_amount >= 0 AND min_order_amount < 100000);

ALTER TABLE public.regions 
  ADD CONSTRAINT regions_delivery_fee_range CHECK (delivery_fee >= 0 AND delivery_fee < 10000);

ALTER TABLE public.regions 
  ADD CONSTRAINT regions_free_delivery_threshold_range CHECK (free_delivery_threshold IS NULL OR (free_delivery_threshold >= 0 AND free_delivery_threshold < 100000));

ALTER TABLE public.regions 
  ADD CONSTRAINT regions_name_length CHECK (char_length(name) <= 200);