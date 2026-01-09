-- ============================================================================
-- Phase 12: Eski Varyasyonları product_variations Tablosuna Ekle
-- Tarihi: 2025-01-10 15:30
-- Amaç: Aliğa tedarikçisine tüm ürünleri varyasyonla eklemek
-- ============================================================================

-- Çilek varyasyonları (kullanıcının istediği)
DO $$
DECLARE
  product RECORD;
BEGIN
  SELECT id INTO product FROM public.products WHERE name = 'Çilek' LIMIT 1;

  IF product.id IS NOT NULL
  THEN
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order, metadata)
    VALUES
      (product.id, 'size', '250 GR', 1, '{"quantity": 0.25, "unit": "kg", "priceMultiplier": 0.3}'::jsonb),
      (product.id, 'size', '500 GR', 2, '{"quantity": 0.5, "unit": "kg", "priceMultiplier": 0.55}'::jsonb),
      (product.id, 'size', '1 KG', 3, '{"quantity": 1, "unit": "kg", "priceMultiplier": 1}'::jsonb),
      (product.id, 'packaging', 'Kasa (5 KG)', 4, '{"quantity": 5, "unit": "kg", "priceMultiplier": 4}'::jsonb)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Çilek varyasyonları eklendi';
  END IF;
END $$;

-- Diğer ürünler için KG varyasyonları (1 KG, 2 KG, 5 KG, Kasa 15 KG)
DO $$
DECLARE
  product RECORD;
  counter INTEGER := 0;
BEGIN
  FOR product IN
    SELECT id, name FROM public.products
    WHERE name IN (
      'Kırmızı Elma', 'Muz', 'Armut', 'Domates', 'Salatalık',
      'Biber (Sivri)', 'Patlıcan', 'Portakal', 'Limon',
      'Havuç', 'Patates'
    )
  LOOP
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order, metadata)
    VALUES
      (product.id, 'size', '1 KG', 1, '{"quantity": 1, "unit": "kg", "priceMultiplier": 1}'::jsonb),
      (product.id, 'size', '2 KG', 2, '{"quantity": 2, "unit": "kg", "priceMultiplier": 2}'::jsonb),
      (product.id, 'size', '5 KG', 3, '{"quantity": 5, "unit": "kg", "priceMultiplier": 4.5}'::jsonb),
      (product.id, 'packaging', 'Kasa (15 KG)', 4, '{"quantity": 15, "unit": "kg", "priceMultiplier": 12}'::jsonb)
    ON CONFLICT DO NOTHING;

    counter := counter + 1;
  END LOOP;

  RAISE NOTICE 'KG varyasyonları % ürüne eklendi', counter;
END $$;

-- Maydanoz ve Dereotu için DEMET varyasyonları
DO $$
DECLARE
  product RECORD;
BEGIN
  -- Maydanoz
  SELECT id INTO product FROM public.products WHERE name = 'Maydanoz' LIMIT 1;
  IF product.id IS NOT NULL
  THEN
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order, metadata)
    VALUES
      (product.id, 'size', '1 Demet', 1, '{"quantity": 1, "unit": "demet", "priceMultiplier": 1}'::jsonb),
      (product.id, 'size', '3 Demet', 2, '{"quantity": 3, "unit": "demet", "priceMultiplier": 2.7}'::jsonb),
      (product.id, 'size', '5 Demet', 3, '{"quantity": 5, "unit": "demet", "priceMultiplier": 4}'::jsonb),
      (product.id, 'packaging', 'Kasa (20 Demet)', 4, '{"quantity": 20, "unit": "demet", "priceMultiplier": 15}'::jsonb)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Dereotu
  SELECT id INTO product FROM public.products WHERE name = 'Dereotu' LIMIT 1;
  IF product.id IS NOT NULL
  THEN
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order, metadata)
    VALUES
      (product.id, 'size', '1 Demet', 1, '{"quantity": 1, "unit": "demet", "priceMultiplier": 1}'::jsonb),
      (product.id, 'size', '3 Demet', 2, '{"quantity": 3, "unit": "demet", "priceMultiplier": 2.7}'::jsonb),
      (product.id, 'size', '5 Demet', 3, '{"quantity": 5, "unit": "demet", "priceMultiplier": 4}'::jsonb),
      (product.id, 'packaging', 'Kasa (20 Demet)', 4, '{"quantity": 20, "unit": "demet", "priceMultiplier": 15}'::jsonb)
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Demet varyasyonları eklendi';
END $$;

-- Avokado ve Mango için ADET varyasyonları
DO $$
DECLARE
  product RECORD;
BEGIN
  -- Avokado
  SELECT id INTO product FROM public.products WHERE name = 'Avokado' LIMIT 1;
  IF product.id IS NOT NULL
  THEN
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order, metadata)
    VALUES
      (product.id, 'size', '1 Adet', 1, '{"quantity": 1, "unit": "adet", "priceMultiplier": 1}'::jsonb),
      (product.id, 'size', '3 Adet', 2, '{"quantity": 3, "unit": "adet", "priceMultiplier": 2.8}'::jsonb),
      (product.id, 'size', '5 Adet', 3, '{"quantity": 5, "unit": "adet", "priceMultiplier": 4.5}'::jsonb),
      (product.id, 'packaging', 'Kasa (12 Adet)', 4, '{"quantity": 12, "unit": "adet", "priceMultiplier": 10}'::jsonb)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Mango
  SELECT id INTO product FROM public.products WHERE name = 'Mango' LIMIT 1;
  IF product.id IS NOT NULL
  THEN
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order, metadata)
    VALUES
      (product.id, 'size', '1 Adet', 1, '{"quantity": 1, "unit": "adet", "priceMultiplier": 1}'::jsonb),
      (product.id, 'size', '3 Adet', 2, '{"quantity": 3, "unit": "adet", "priceMultiplier": 2.8}'::jsonb),
      (product.id, 'size', '5 Adet', 3, '{"quantity": 5, "unit": "adet", "priceMultiplier": 4.5}'::jsonb),
      (product.id, 'packaging', 'Kasa (12 Adet)', 4, '{"quantity": 12, "unit": "adet", "priceMultiplier": 10}'::jsonb)
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Adet varyasyonları eklendi';
END $$;

-- Patates özel (Kasa 25 KG)
DO $$
DECLARE
  product RECORD;
BEGIN
  SELECT id INTO product FROM public.products WHERE name = 'Patates' LIMIT 1;

  IF product.id IS NOT NULL
  THEN
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order, metadata)
    VALUES
      (product.id, 'size', '1 KG', 1, '{"quantity": 1, "unit": "kg", "priceMultiplier": 1}'::jsonb),
      (product.id, 'size', '3 KG', 2, '{"quantity": 3, "unit": "kg", "priceMultiplier": 2.8}'::jsonb),
      (product.id, 'size', '5 KG', 3, '{"quantity": 5, "unit": "kg", "priceMultiplier": 4.5}'::jsonb),
      (product.id, 'packaging', 'Kasa (25 KG)', 4, '{"quantity": 25, "unit": "kg", "priceMultiplier": 18}'::jsonb)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Patates varyasyonları eklendi';
  END IF;
END $$;
