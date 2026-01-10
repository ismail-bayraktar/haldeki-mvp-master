# Quick Setup Guide: product-images Storage Bucket

**Status:** ❌ BUCKET DOES NOT EXIST

The `product-images` storage bucket is required for suppliers to upload product photos. This bucket must be created before suppliers can add products with images.

---

## Critical Information

**Current State:** Bucket `product-images` is MISSING from production database
**Impact:** Suppliers CANNOT upload product images
**Priority:** HIGH - Blocks supplier onboarding

---

## Setup Method 1: Supabase Dashboard (RECOMMENDED)

### Step 1: Open SQL Editor

1. Go to: https://supabase.com/dashboard/project/ynatuiwdvkxcmmnmejkl
2. Click "SQL Editor" in left sidebar
3. Click "New query"

### Step 2: Run Migration Script

1. Open file: `supabase/migrations/20260109150000_storage_product_images.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click "Run" (or press Ctrl+Enter)

### Step 3: Verify Success

Run this query to verify:

```sql
SELECT * FROM storage.buckets WHERE id = 'product-images';
```

Expected result: One row with bucket details

---

## Setup Method 2: Supabase CLI

```bash
# From project root
cd F:/donusum/haldeki-love/haldeki-market

# Link to remote project (if not already linked)
npx supabase link --project-ref ynatuiwdvkxcmmnmejkl

# Push migrations to remote
npx supabase db push
```

---

## What the Migration Creates

### Storage Bucket Configuration

| Setting | Value |
|---------|-------|
| **Name** | product-images |
| **Public** | Yes (required for product display) |
| **Max File Size** | 5MB |
| **Allowed Types** | JPEG, PNG, WebP |

### Security Policies (RLS)

1. **Suppliers can upload** - Only to their own folder (`{user_id}/`)
2. **Suppliers can view own** - Only their own uploads
3. **Public can view all** - Required for product display on website
4. **Suppliers can delete own** - Only their own images
5. **Suppliers can update own** - Only their own images

---

## Verification Checklist

After applying migration:

- [ ] Bucket exists: `SELECT * FROM storage.buckets WHERE id = 'product-images';`
- [ ] Bucket is public: Check `public = true`
- [ ] Policies created: Should have 5 policies
- [ ] Test upload: Create product as supplier, upload image
- [ ] Test display: Verify image shows on product page

---

## Troubleshooting

### Error: "relation storage.buckets does not exist"

**Cause:** Storage extension not enabled
**Fix:** Run `CREATE EXTENSION IF NOT EXISTS storage;`

### Error: "bucket already exists"

**Cause:** Migration already applied
**Fix:** This is OK, bucket is ready to use

### Images not displaying on site

**Cause:** Public read policy missing
**Fix:** Re-run migration script

### Upload fails with permission error

**Cause:** Upload policy missing or incorrect
**Fix:** Check policies exist: `SELECT policyname FROM pg_policies WHERE tablename = 'objects';`

---

## Test Procedure

1. **Create Test Supplier**
   - Sign up as new supplier
   - Complete business verification (test environment)

2. **Create Product with Image**
   - Go to supplier panel
   - Create new product
   - Upload test image (JPEG < 5MB)

3. **Verify Upload**
   - Check image appears in product form
   - Check image URL format: `https://.../storage/v1/object/public/product-images/{user_id}/...`

4. **Verify Public Access**
   - Open product page (as customer)
   - Confirm images load and display

---

## Production Deployment

### Before Deploying

1. ✅ Migration script created
2. ⏳ Apply migration to production
3. ⏳ Verify bucket exists
4. ⏳ Test upload flow
5. ⏳ Monitor for errors

### Rollback Plan

If issues occur after migration:

```sql
-- Remove bucket (WARNING: This deletes ALL images)
DELETE FROM storage.objects WHERE bucket_id = 'product-images';
DELETE FROM storage.buckets WHERE id = 'product-images';
```

---

## Files Created

1. **Migration Script**: `supabase/migrations/20260109150000_storage_product_images.sql`
2. **Detailed Report**: `STORAGE_SETUP_REPORT.md`
3. **This Guide**: `QUICK_STORAGE_SETUP.md`
4. **Verification Script**: `scripts/check-storage-bucket.ps1`

---

## Support

For issues or questions:
- Check Supabase Storage docs: https://supabase.com/docs/guides/storage
- Review migration script comments
- Run verification script after setup

---

**Created:** 2026-01-09
**Project:** Haldeki Market Supplier System
