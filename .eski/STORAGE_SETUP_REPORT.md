# Storage Bucket Verification Report: product-images

**Date:** 2026-01-09
**Project:** Haldeki Market - Supplier Product Management
**Status:** Setup Required

---

## Summary

The system requires a Supabase Storage bucket named `product-images` for suppliers to upload product photos. Currently, **this bucket does NOT exist** in the database.

---

## Current System Configuration

### Client-Side Configuration

**Component:** `src/hooks/useImageUpload.ts`
- **Bucket Name:** `product-images`
- **Max File Size:** 5MB (5242880 bytes)
- **Allowed Types:** JPEG, PNG, WebP
- **Upload Path:** `{user_id}/{filename}`
- **Compression:** Automatic if > 1MB (max 1200px, quality 0.8)

**Component:** `src/components/supplier/ImageUpload.tsx`
- **Max Images per Product:** 5
- **Features:** Camera capture, gallery selection, drag-drop, progress tracking

---

## Migration Script Created

**File:** `supabase/migrations/20260109150000_storage_product_images.sql`

### What This Migration Does:

1. **Creates Storage Bucket**
   - ID: `product-images`
   - Public: Yes (for product display)
   - File Size Limit: 5MB
   - Allowed MIME Types: image/jpeg, image/jpg, image/png, image/webp

2. **Sets Up RLS Policies**

   | Policy | Purpose | Who | Access |
   |--------|---------|-----|--------|
   | Authenticated users can upload | Upload to own folder | authenticated | INSERT (own folder only) |
   | Authenticated users can view own | View own uploads | authenticated | SELECT (own folder only) |
   | Public can view product images | Display on website | public | SELECT (all images) |
   | Authenticated users can delete own | Delete own images | authenticated | DELETE (own folder only) |
   | Authenticated users can update own | Update own images | authenticated | UPDATE (own folder only) |

---

## Manual Setup Instructions

If migration cannot be applied automatically, follow these steps:

### Option 1: SQL Editor (Recommended)

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ynatuiwdvkxcmmnmejkl
2. Navigate to SQL Editor
3. Run the migration script: `20260109150000_storage_product_images.sql`

### Option 2: Dashboard UI

1. Go to Storage in Supabase Dashboard
2. Click "New bucket"
3. Configure:
   - Name: `product-images`
   - Public bucket: Toggle ON
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
4. Add policies manually via SQL Editor (see migration script)

---

## Verification Checklist

After setup, verify the following:

### 1. Bucket Exists

```sql
SELECT * FROM storage.buckets WHERE id = 'product-images';
```

Expected: One row with `id = 'product-images'`, `public = true`

---

### 2. Policies Created

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%product images%';
```

Expected: 5 policies (upload, view own, public view, delete own, update own)

---

### 3. Public URL Works

Test that public URLs are accessible:
```
https://ynatuiwdvkxcmmnmejkl.supabase.co/storage/v1/object/public/product-images/{user_id}/{filename}
```

---

## How to Apply Migration

### Using Supabase CLI (if available):

```bash
# Apply migration
npx supabase db push

# Or apply specific migration
npx supabase migration up 20260109150000_storage_product_images.sql
```

### Using Dashboard (Most Reliable):

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste migration content
4. Click "Run"

---

## Integration Points

The `product-images` bucket is used by:

1. **Supplier Product Creation Flow**
   - Hook: `useImageUpload()` → `uploadImage()`
   - Component: `ImageUpload.tsx`
   - Path: `src/features/supplier/products/create`

2. **Product Import System**
   - CSV import with image URLs
   - Validates images belong to supplier

3. **Product Display**
   - Public read access allows website to display images
   - CDN-enabled URLs for fast loading

---

## Security Considerations

### Implemented

- **Folder Isolation:** Suppliers can only upload to `/{user_id}/` folder
- **File Type Validation:** Only JPEG, PNG, WebP allowed
- **Size Limits:** 5MB max (client + server)
- **Delete Protection:** Suppliers can only delete their own images

### Not Implemented (Future)

- **Image Moderation:** No explicit content detection
- **Virus Scanning:** Files not scanned for malware
- **CDN Caching:** Default Supabase CDN used

---

## Troubleshooting

### Error: "Bucket not found"

**Cause:** Migration not applied
**Fix:** Run migration script via SQL Editor

### Error: "Permission denied"

**Cause:** RLS policies missing or incorrect
**Fix:** Check policies exist with verification query above

### Error: "File too large"

**Cause:** Client allows >5MB upload
**Fix:** Already limited in `useImageUpload.ts` line 9

### Images not displaying on site

**Cause:** Public read policy missing
**Fix:** Ensure "Public can view product images" policy exists

---

## Next Steps

1. **Apply Migration** (choose method above)
2. **Verify Setup** (run verification queries)
3. **Test Upload** (create test product as supplier)
4. **Monitor** (check for upload errors in production logs)

---

## Production Deployment

Before deploying to production:

1. ✅ Migration script created
2. ⏳ Apply migration to production database
3. ⏳ Test image upload with real supplier account
4. ⏳ Verify images display on product pages
5. ⏳ Check CDN performance

**Current Status:** Ready for deployment once migration is applied.
