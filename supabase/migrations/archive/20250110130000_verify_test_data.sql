-- Verify test data
DO $$
DECLARE
  supplier_count INTEGER;
  product_count INTEGER;
  sp_count INTEGER;
  aliaga_products INTEGER;
  menemen_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO supplier_count FROM suppliers WHERE id IN ('11111111-1111-1111-1111-111111111111'::UUID, '22222222-2222-2222-2222-222222222222'::UUID);
  SELECT COUNT(*) INTO product_count FROM products WHERE slug LIKE 'abc-%' OR slug LIKE 'xyz-%';
  SELECT COUNT(*) INTO sp_count FROM supplier_products;
  SELECT COUNT(*) INTO aliaga_products FROM products WHERE slug LIKE 'abc-%';
  SELECT COUNT(*) INTO menemen_products FROM products WHERE slug LIKE 'xyz-%';

  RAISE NOTICE '=== VERIFICATION RESULTS ===';
  RAISE NOTICE 'Suppliers (Aliğa + Menemen): %', supplier_count;
  RAISE NOTICE 'Aliğa products: %', aliaga_products;
  RAISE NOTICE 'Menemen products: %', menemen_products;
  RAISE NOTICE 'Total products: %', product_count;
  RAISE NOTICE 'Supplier_products junction records: %', sp_count;
  RAISE NOTICE 'Expected: 2 suppliers, 60 products, 60 junction records';
  RAISE NOTICE '============================';

  IF sp_count = 0 THEN
    RAISE NOTICE 'WARNING: No supplier_products found! Migration may have failed.';
  END IF;
END $$;
