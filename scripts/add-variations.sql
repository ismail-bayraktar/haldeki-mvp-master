-- Add product variations for testing
-- Run this in Supabase SQL Editor or via: psql < add-variations.sql

-- Add variations to Domates
INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
SELECT id, 'size', 'Küçük', 1 FROM public.products WHERE name = 'Domates' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
SELECT id, 'size', 'Standart', 2 FROM public.products WHERE name = 'Domates' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
SELECT id, 'size', 'Büyük', 3 FROM public.products WHERE name = 'Domates' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
SELECT id, 'type', 'Taze', 1 FROM public.products WHERE name = 'Domates' LIMIT 1
ON CONFLICT DO NOTHING;

-- Add variations to other products (first 5)
DO $$
DECLARE
  product_record RECORD;
  counter INTEGER := 0;
BEGIN
  FOR product_record IN
    SELECT id, name FROM public.products WHERE name != 'Domates' LIMIT 5
  LOOP
    -- Size variations
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
    VALUES (product_record.id, 'size', 'Küçük', 1)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
    VALUES (product_record.id, 'size', 'Standart', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
    VALUES (product_record.id, 'size', 'Büyük', 3)
    ON CONFLICT DO NOTHING;

    -- Type variation
    INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
    VALUES (product_record.id, 'type', 'Taze', 1)
    ON CONFLICT DO NOTHING;

    counter := counter + 1;
  END LOOP;

  RAISE NOTICE 'Added variations to % products', counter;
END $$;

-- Verify
SELECT
  p.name,
  pv.variation_type,
  pv.variation_value
FROM public.product_variations pv
JOIN public.products p ON p.id = pv.product_id
ORDER BY p.name, pv.variation_type, pv.display_order;
