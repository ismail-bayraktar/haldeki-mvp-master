-- Storage Bucket Setup: product-images
-- Date: 2026-01-09
-- Purpose: Enable suppliers to upload product images
-- Requirements: Authenticated suppliers can upload, public read access

-- Insert storage bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, owner)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit (matches client-side validation)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  (SELECT id FROM auth.users WHERE email = 'admin@haldeki.com' LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for product-images bucket

-- 1. Authenticated users can upload images (used by suppliers)
CREATE POLICY IF NOT EXISTS "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text -- Can only upload to their own folder
);

-- 2. Authenticated users can view their own uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can view own product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Public read access (needed for product display on site)
CREATE POLICY IF NOT EXISTS "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4. Suppliers can delete their own images
CREATE POLICY IF NOT EXISTS "Authenticated users can delete own product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Suppliers can update their own images
CREATE POLICY IF NOT EXISTS "Authenticated users can update own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Verification queries
-- Run these after applying the migration to verify the setup:

-- 1. Check that bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'product-images';

-- 2. Check that policies exist
-- SELECT policyname, cmd, permissive, roles FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%product images%';

-- 3. Test upload as authenticated user
-- INSERT INTO storage.objects (bucket_id, name, metadata)
-- VALUES ('product-images', 'test-file.jpg', '{"mimetype": "image/jpeg"}')
-- RETURNING *;
