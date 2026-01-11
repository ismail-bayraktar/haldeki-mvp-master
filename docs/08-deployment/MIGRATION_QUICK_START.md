# SuperAdmin Migration - Quick Execution

## Status: READY TO EXECUTE

Migration files are prepared and ready. Choose execution method below.

---

## FASTEST OPTION (5 minutes)

### Go to Supabase Dashboard and execute SQL:

**1. Create SuperAdmin:**
- URL: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/auth/users
- Add User → Create New User
- Email: `admin@haldeki.com`
- Password: `${SUPERADMIN_PASSWORD}` (set via environment variable)
- Check "Auto Confirm User"

**2. Assign SuperAdmin Role:**
- URL: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/sql/new
- Run SQL from: `docs/MIGRATION_EXECUTION_GUIDE.md` (Step 2)

**3. Cleanup Test Accounts:**
- Same SQL Editor
- Run SQL from: `docs/MIGRATION_EXECUTION_GUIDE.md` (Step 3)

---

## AUTOMATED OPTION (Requires DB Access)

**1. Get Connection String:**
- URL: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/settings/database
- Copy "Connection String" → "URI" format

**2. Run Scripts:**
```bash
# Set DB URL
export SUPABASE_DB_URL="postgresql://postgres:[password]@..."

# Create SuperAdmin
node scripts/execute-superadmin-migration.js

# Cleanup test accounts
node scripts/execute-cleanup-test-accounts.js
```

---

## Credentials

**Email:** admin@haldeki.com
**Password:** ${SUPERADMIN_PASSWORD} (see .env)
**Role:** superadmin

**IMPORTANT:** Change password after first login!

---

## Files Created

1. `supabase/migrations/20260110000000_create_superadmin.sql` - Migration file
2. `scripts/cleanup-test-accounts-production.sql` - Cleanup SQL
3. `scripts/execute-superadmin-migration.js` - Automated migration
4. `scripts/execute-cleanup-test-accounts.js` - Automated cleanup
5. `docs/MIGRATION_EXECUTION_GUIDE.md` - Full guide
6. `docs/MIGRATION_QUICK_START.md` - This file

---

## Next Steps After Execution

1. **Verify:**
   - Login as admin@haldeki.com
   - Change password
   - Enable MFA
   - Test permissions

2. **Commit:**
   ```bash
   git add .
   git commit -m "feat: Execute SuperAdmin migration and cleanup test accounts

   - Create admin@haldeki.com with superadmin role
   - Cleanup all test accounts
   - Backup deleted accounts to recovery table
   - Setup automated migration scripts

   Credentials:
   - Email: admin@haldeki.com
   - Password: ${SUPERADMIN_PASSWORD} (set in environment variables)
   - Role: superadmin"
   ```

3. **Push & Deploy:**
   ```bash
   git push
   vercel --prod
   ```

---

## Verification SQL

```sql
-- Check SuperAdmin exists
SELECT
  au.email,
  array_agg(ur.role) as roles,
  p.full_name
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'admin@haldeki.com'
GROUP BY au.id, au.email, p.full_name;

-- Check test accounts deleted
SELECT COUNT(*) as remaining_test_accounts
FROM auth.users
WHERE email LIKE '%@test%' OR email LIKE '%test.example%';

-- User summary
SELECT
  ur.role,
  COUNT(DISTINCT ur.user_id) as user_count
FROM public.user_roles ur
GROUP BY ur.role
ORDER BY user_count DESC;
```

---

## Support

Full guide: `docs/MIGRATION_EXECUTION_GUIDE.md`
