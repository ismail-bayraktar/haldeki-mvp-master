-- Check products table structure
DO $$
DECLARE
  col RECORD;
BEGIN
  RAISE NOTICE '=== PRODUCTS TABLE COLUMNS ===';
  FOR col IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'products' AND table_schema = 'public'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: %, Type: %', col.column_name, col.data_type;
  END LOOP;
END $$;
