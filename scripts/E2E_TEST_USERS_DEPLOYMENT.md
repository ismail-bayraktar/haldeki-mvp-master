# E2E Test Users Deployment Guide

## Overview

This migration creates 7 test user accounts for E2E testing with proper role assignments and supporting data (dealer, supplier, business, warehouse records).

## Test User Accounts

| Email | Role | Password | Purpose |
|-------|------|----------|---------|
| `test-customer@haldeki.com` | user | Test1234! | Regular customer testing |
| `test-admin@haldeki.com` | admin | Test1234! | Admin panel testing |
| `test-superadmin@haldeki.com` | superadmin | Test1234! | Superadmin testing |
| `test-dealer@haldeki.com` | dealer | Test1234! | Dealer panel testing |
| `test-supplier@haldeki.com` | supplier | Test1234! | Supplier panel testing |
| `test-business@haldeki.com` | business | Test1234! | Business panel testing |
| `test-warehouse@haldeki.com` | warehouse_manager | Test1234! | Warehouse operations testing |

## Deployment Methods

### Method 1: TypeScript Script (Recommended)

Uses Supabase Admin API for secure user creation.

```bash
# Install dependencies
npm install bcrypt @types/bcrypt

# Create test users
SUPABASE_URL="your-project-url" \
SUPABASE_SERVICE_ROLE_KEY="your-service-key" \
tsx scripts/generate-e2e-test-users.ts create

# Verify users created
SUPABASE_URL="your-project-url" \
SUPABASE_SERVICE_ROLE_KEY="your-service-key" \
tsx scripts/generate-e2e-test-users.ts verify

# Delete test users (when needed)
SUPABASE_URL="your-project-url" \
SUPABASE_SERVICE_ROLE_KEY="your-service-key" \
tsx scripts/generate-e2e-test-users.ts delete
```

### Method 2: Supabase Dashboard (Manual)

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" for each test account:
   - Email: `test-{role}@haldeki.com`
   - Password: `Test1234!`
   - Auto Confirm: ON
   - User Metadata:
     ```json
     {
       "full_name": "Test {Role Name}",
       "phone": "0532 100 00 XX",
       "test": true
     }
     ```
3. Run migration to link to profiles/roles:
   ```bash
   npx supabase db push
   ```

### Method 3: Direct SQL (With Generated Hash)

Generate bcrypt hash first:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Test1234!', 10).then(h => console.log(h));"
```

Replace `$2b$10$YourBcryptHashHere` in migration with generated hash.

Then:

```bash
npx supabase db push
```

## Verification

After deployment, run these queries:

```sql
-- Check auth users
SELECT email, raw_user_meta_data->>'test' as is_test
FROM auth.users
WHERE email LIKE '%@haldeki.com'
ORDER BY email;

-- Check profiles and roles
SELECT p.email, p.full_name, r.role
FROM public.profiles p
JOIN public.user_roles r ON p.id = r.user_id
WHERE p.email LIKE '%@haldeki.com'
ORDER BY p.email;

-- Check supporting data
SELECT 'dealers' as table_name, COUNT(*) as count
FROM public.dealers WHERE contact_email LIKE '%@haldeki.com'
UNION ALL
SELECT 'suppliers', COUNT(*)
FROM public.suppliers WHERE contact_email LIKE '%@haldeki.com'
UNION ALL
SELECT 'businesses', COUNT(*)
FROM public.businesses WHERE contact_email LIKE '%@haldeki.com'
UNION ALL
SELECT 'warehouse_staff', COUNT(*)
FROM public.warehouse_staff ws
JOIN auth.users u ON ws.user_id = u.id
WHERE u.email LIKE '%@haldeki.com';
```

## Cleanup (Before Production)

```sql
-- Delete in correct order (respecting foreign keys)

-- 1. Delete warehouse_staff
DELETE FROM public.warehouse_staff
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@haldeki.com'
);

-- 2. Delete business records
DELETE FROM public.businesses
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@haldeki.com'
);

-- 3. Delete supplier records
DELETE FROM public.suppliers
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@haldeki.com'
);

-- 4. Delete dealer records
DELETE FROM public.dealers
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@haldeki.com'
);

-- 5. Delete role assignments
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@haldeki.com'
);

-- 6. Delete profiles
DELETE FROM public.profiles
WHERE email LIKE '%@haldeki.com';

-- 7. Delete auth users (via Dashboard or Admin API)
-- In Supabase Dashboard: Authentication → Users → Filter by @haldeki.com → Delete all
-- OR use TypeScript script: tsx scripts/generate-e2e-test-users.ts delete

-- 8. Drop helper function
DROP FUNCTION IF EXISTS public.get_or_create_test_user;
```

## Security Notes

- All test accounts use `@haldeki.com` domain for easy identification
- Password: `Test1234!` for all accounts
- All marked with `test: true` in user_metadata
- Delete these accounts before production deployment
- Never commit actual bcrypt hashes to version control

## Files Created

1. `supabase/migrations/20260109200000_create_e2e_test_users.sql` - Migration file
2. `scripts/generate-e2e-test-users.ts` - TypeScript deployment script
3. `scripts/E2E_TEST_USERS_DEPLOYMENT.md` - This documentation

## Testing Integration

Use in your E2E tests:

```typescript
const TEST_USERS = {
  customer: {
    email: 'test-customer@haldeki.com',
    password: 'Test1234!',
    role: 'user'
  },
  admin: {
    email: 'test-admin@haldeki.com',
    password: 'Test1234!',
    role: 'admin'
  },
  // ... etc
};
```

## Troubleshooting

### Users not appearing in auth.users
- Check if bcrypt hash is correct
- Ensure migration ran without errors
- Verify auth.users table is accessible

### Role assignments missing
- Check user_roles table for conflicts
- Verify app_role enum includes all roles
- Run verification queries

### Foreign key errors on delete
- Delete in correct order (see cleanup section)
- Or use CASCADE deletes from auth.users
