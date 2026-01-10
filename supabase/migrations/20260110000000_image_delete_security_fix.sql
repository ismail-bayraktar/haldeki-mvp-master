-- Güvenlik Fix: Supplier Görsel Silme İçin Server-Side Validation
-- Date: 2026-01-10
-- Issue: Client-side authorization check vulnerable to manipulation
-- Fix: RPC function with server-side ownership verification

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
  -- 1. Dosya varlığını ve sahipliğini kontrol et
  -- Dosya yolu formatı: {supplier_id}/{timestamp}.{ext}
  SELECT
    SUBSTRING(name FROM '^([^/]+)') INTO file_owner_id
  FROM storage.objects
  WHERE bucket_id = 'product-images'
    AND name = image_path;

  -- 2. Dosya bulunamadıysa hata döndür
  IF file_owner_id IS NULL THEN
    RAISE EXCEPTION 'Görsel bulunamadı' USING ERRCODE = '42704';
  END IF;

  -- 3. Yetki kontrolü: Sadece kendi görsellerini silebilir
  IF file_owner_id != user_id THEN
    RAISE EXCEPTION 'Bu görseli silme yetkiniz yok' USING ERRCODE = '42501';
  END IF;

  -- 4. Storage'dan sil
  DELETE FROM storage.objects
  WHERE bucket_id = 'product-images'
    AND name = image_path;

  -- Başarılı
  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION delete_supplier_image(TEXT, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_supplier_image IS 'Supplier görsel silme fonksiyonu - Server-side yetki kontrolü ile güvenli silme işlemi. Sadece kendi görsellerini silebilir.';
