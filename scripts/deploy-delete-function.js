/**
 * Deploy delete_supplier_image function to Supabase
 * This script deploys the secure image deletion RPC function directly
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const sql = `
-- Drop function if exists (for replacement)
DROP FUNCTION IF EXISTS delete_supplier_image(TEXT, TEXT);

-- Create secure image deletion function
CREATE OR REPLACE FUNCTION delete_supplier_image(
  image_path TEXT,
  user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_owner_id TEXT;
BEGIN
  -- 1. Dosya varligini ve sahipligini kontrol et
  SELECT
    SUBSTRING(name FROM '^([^/]+)') INTO file_owner_id
  FROM storage.objects
  WHERE bucket_id = 'product-images'
    AND name = image_path;

  -- 2. Dosya bulunamadiysa hata dondur
  IF file_owner_id IS NULL THEN
    RAISE EXCEPTION 'Gorsel bulunamadi' USING ERRCODE = '42704';
  END IF;

  -- 3. Yetki kontrolu: Sadece kendi gorsellerini silebilir
  IF file_owner_id != user_id THEN
    RAISE EXCEPTION 'Bu gorseli silme yetkiniz yok' USING ERRCODE = '42501';
  END IF;

  -- 4. Storage'dan sil
  DELETE FROM storage.objects
  WHERE bucket_id = 'product-images'
    AND name = image_path;

  -- Basarili
  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION delete_supplier_image(TEXT, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_supplier_image IS 'Supplier gorsel silme fonksiyonu - Server-side yetki kontrolu ile guvenli silme islemi. Sadece kendi gorsellerini silebilir.';
`

async function deployFunction() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('Deploying delete_supplier_image function...')

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    })

    if (error) {
      // Try using raw SQL via Postgres connection
      console.log('Trying direct SQL execution...')
      const { data: postData, error: postError } = await supabase
        .from('_temp_sql_execution')
        .select('*')
        .limit(1)

      // Since Supabase JS client doesn't support arbitrary SQL execution,
      // we need to use the REST API directly
      console.error('\nDirect SQL execution requires Supabase Dashboard or psql.')
      console.error('\nPlease run this SQL in Supabase Dashboard > SQL Editor:\n')
      console.error('='.repeat(80))
      console.error(sql)
      console.error('='.repeat(80))
      process.exit(1)
    }

    console.log('Function deployed successfully!')
  } catch (err) {
    console.error('Deployment error:', err.message)
    process.exit(1)
  }
}

deployFunction()
