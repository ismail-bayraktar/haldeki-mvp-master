# TEST ACCOUNTS DELETION CHECKLIST

> **BEFORE RUNNING CLEANUP**: Review and confirm each step
> **Last Updated**: 2026-01-10
> **Status**: READY FOR EXECUTION

---

## PRE-DELETION CHECKLIST

### 1. Backup Verification

- [ ] **Database backup created** (Supabase Dashboard > Database > Backups)
- [ ] **Export all test data** to spreadsheet for reference:
  ```sql
  -- Run this and save output
  SELECT email, created_at, raw_user_meta_data
  FROM auth.users
  WHERE email LIKE '%test%' OR email LIKE '%example%';
  ```
- [ ] **Document all active test accounts** with their roles

### 2. SuperAdmin Setup

- [ ] **SuperAdmin migration created**: `20260110000000_create_superadmin.sql`
- [ ] **Password generated and saved securely**: `${SUPERADMIN_PASSWORD}`
- [ ] **Password stored in password manager** (1Password, Bitwarden, etc.)
- [ ] **SuperAdmin will be created after cleanup**

### 3. Critical Accounts to PRESERVE

These accounts MUST NOT be deleted:
- [ ] `admin@haldeki.com` (will become SuperAdmin)
- [ ] Any real user accounts (check `created_at` and `last_sign_in_at`)
- [ ] Any supplier/business accounts in production use

### 4. Test Accounts to DELETE

Check ALL accounts below before deletion:

#### Test Customer Accounts
- [ ] `customer@example.com`
- [ ] `premium@example.com`
- [ ] `test@haldeki.com`
- [ ] `demo@haldeki.com`
- [ ] `testuser@example.com`

#### Test Supplier Accounts
- [ ] `supplier1@haldeki.com`
- [ ] `supplier2@haldeki.com`
- [ ] `supplier3@haldeki.com`
- [ ] `supplier4@haldeki.com`
- [ ] `supplier5@haldeki.com`
- [ ] `supplier6@haldeki.com`
- [ ] `test.bayi@haldeki.com`
- [ ] `test.tedarikci@haldeki.com`

#### Test Admin Accounts
- [ ] `admin@haldeki.local` (NOT admin@haldeki.com!)
- [ ] `content@haldeki.com` (if exists)
- [ ] Any other `*@haldeki.local` accounts

#### Test Domain Accounts
- [ ] All `*@test.haldeki.com` accounts
- [ ] All `*@test.haldeki.local` accounts

---

## DELETION EXECUTION STEPS

### Step 1: Pre-Deletion Audit

Run this query and SAVE THE OUTPUT:

```sql
-- Complete test account inventory
SELECT
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
  p.full_name,
  d.name as dealer_name,
  s.name as supplier_name,
  b.company_name as business_name
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.dealers d ON d.user_id = au.id
LEFT JOIN public.suppliers s ON s.user_id = au.id
LEFT JOIN public.businesses b ON b.user_id = au.id
WHERE
  au.email LIKE '%@test.haldeki.com'
  OR au.email LIKE '%@test.haldeki.local'
  OR au.email LIKE '%test@example%'
  OR au.email LIKE '%@test%'
  OR au.email IN (
    'test.bayi@haldeki.com',
    'test.tedarikci@haldeki.com',
    'test@haldeki.com',
    'admin@haldeki.local',
    'testuser@example.com',
    'customer@example.com',
    'premium@example.com'
  )
GROUP BY
  au.id, au.email, au.created_at, au.last_sign_in_at, au.email_confirmed_at,
  p.full_name, d.name, s.name, b.company_name
ORDER BY au.created_at;
```

**Save output to**: `F:\donusum\haldeki-love\haldeki-market\scripts\test-accounts-inventory-YYYY-MM-DD.csv`

- [ ] Inventory query executed
- [ ] Output saved to file
- [ ] Reviewed all accounts to be deleted
- [ ] Confirmed NO real accounts in deletion list

### Step 2: Run Cleanup Script

Execute the cleanup migration:

```bash
# Via Supabase CLI
supabase db push --db-url "postgresql://..."

# OR via Supabase Dashboard SQL Editor
# Open: https://app.supabase.com/project/[PROJECT_ID]/sql/new
# Paste contents of: scripts/cleanup-test-accounts-production.sql
```

- [ ] Cleanup script executed
- [ ] No errors during execution
- [ ] Deletion count matches expected

### Step 3: Verify Deletion

Run verification query:

```sql
-- Verify no test accounts remain
SELECT COUNT(*) as remaining_test_accounts
FROM auth.users
WHERE
  email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local'
  OR email LIKE '%test@example%'
  OR email LIKE '%@test%'
  OR email IN (
    'test.bayi@haldeki.com',
    'test.tedarikci@haldeki.com',
    'test@haldeki.com',
    'admin@haldeki.local',
    'testuser@example.com'
  );

-- Expected result: 0
```

- [ ] Verification query returns 0
- [ ] All test accounts successfully deleted

### Step 4: Create SuperAdmin

Run SuperAdmin creation migration:

```bash
# Via Supabase CLI
supabase migration up

# OR manually in Supabase Dashboard SQL Editor
# Paste contents of: supabase/migrations/20260110000000_create_superadmin.sql
```

- [ ] SuperAdmin migration executed
- [ ] Admin account `admin@haldeki.com` exists
- [ ] SuperAdmin role assigned
- [ ] Only 1 superadmin exists (verification query in migration)

---

## POST-DELETION CHECKLIST

### 1. SuperAdmin Verification

- [ ] **Login test**: Login as `admin@haldeki.com` with password `${SUPERADMIN_PASSWORD}`
- [ ] **Password changed**: Change password immediately after first login
- [ ] **MFA enabled**: Enable multi-factor authentication in Supabase Dashboard
- [ ] **Role test**: Verify superadmin permissions work correctly

### 2. Database Cleanup

- [ ] **Orphaned records deleted**:
  - [ ] No orphaned `user_roles` records
  - [ ] No orphaned `profiles` records
  - [ ] No orphaned `dealer` records
  - [ ] No orphaned `supplier` records
  - [ ] No orphaned `business` records

Run verification:

```sql
-- Check for orphaned records
SELECT
  (SELECT COUNT(*) FROM public.user_roles ur
   LEFT JOIN auth.users au ON au.id = ur.user_id
   WHERE au.id IS NULL) as orphaned_user_roles,
  (SELECT COUNT(*) FROM public.profiles p
   LEFT JOIN auth.users au ON au.id = p.id
   WHERE au.id IS NULL) as orphaned_profiles,
  (SELECT COUNT(*) FROM public.dealers d
   LEFT JOIN auth.users au ON au.id = d.user_id
   WHERE au.id IS NULL) as orphaned_dealers,
  (SELECT COUNT(*) FROM public.suppliers s
   LEFT JOIN auth.users au ON au.id = s.user_id
   WHERE au.id IS NULL) as orphaned_suppliers;

-- Expected result: All 0
```

### 3. Code Cleanup

- [ ] **Remove RoleSwitcher component**:
  ```bash
  # Delete development-only component
  rm src/components/dev/RoleSwitcher.tsx
  ```

- [ ] **Remove hardcoded credentials**:
  ```bash
  # Search for test passwords
  grep -r "test123" src/
  grep -r "Test1234" src/
  # Expected: 0 results
  ```

- [ ] **Remove test account documentation**:
  ```bash
  # Move or delete TEST_ACCOUNTS.md
  mv docs/TEST_ACCOUNTS.md docs/archive/
  # OR delete if archived elsewhere
  ```

### 4. Security Verification

- [ ] **Scan production build for test credentials**:
  ```bash
  npm run build
  grep -r "test123" dist/
  grep -r "superadmin@haldeki.com" dist/
  # Expected: 0 results
  ```

- [ ] **Review RLS policies**: All user data properly isolated
- [ ] **Test account lockout**: Try 3 failed logins, verify lockout
- [ ] **Audit logging enabled**: Admin actions are logged

### 5. Documentation Update

- [ ] **Update deployment docs** with new SuperAdmin credentials
- [ ] **Archive test account docs**: Move to internal wiki or delete
- [ ] **Create production runbook**: Document admin procedures
- [ ] **Update on-call guide**: Include SuperAdmin access steps

---

## ROLLBACK PLAN (If Something Goes Wrong)

If critical accounts were accidentally deleted:

### Option 1: Restore from Backup

```sql
-- Restore deleted accounts from backup table
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at)
SELECT user_id, email, 'RECOVERED', email_confirmed_at, created_at
FROM public.deleted_test_accounts_backup_20250109
WHERE email = 'admin@haldeki.com';  -- Replace with accidentally deleted email

-- Restore profile
INSERT INTO public.profiles (id, full_name, phone)
SELECT user_id, full_name, phone
FROM public.deleted_test_accounts_backup_20250109
WHERE email = 'admin@haldeki.com'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Restore role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'superadmin'::public.app_role
FROM public.deleted_test_accounts_backup_20250109
WHERE email = 'admin@haldeki.com'
  AND 'superadmin' = ANY(roles);
```

### Option 2: Supabase Dashboard Restore

1. Go to Supabase Dashboard > Database > Backups
2. Select backup from before cleanup
3. Click "Restore" (this will revert ALL changes)

---

## FINAL VERIFICATION

Before marking this task complete:

- [ ] All test accounts deleted (verified with query)
- [ ] SuperAdmin account created and accessible
- [ ] SuperAdmin password changed to new secure value
- [ ] MFA enabled for SuperAdmin
- [ ] No orphaned records in database
- [ ] No hardcoded credentials in code
- [ ] Production build clean (no test passwords)
- [ ] RLS policies tested and working
- [ ] Audit logging enabled and verified
- [ ] Documentation updated

---

## CREDENTIALS (SAVE SECURELY)

### SuperAdmin Access

```
Email: admin@haldeki.com
Initial Password: ${SUPERADMIN_PASSWORD}
Role: superadmin
```

**ACTION REQUIRED AFTER FIRST LOGIN**:
1. Change password to new 16+ character random string
2. Enable MFA (TOTP or hardware key)
3. Store new password in secure password manager
4. Delete this file or move to secure vault

---

## CONTACTS

If issues arise during cleanup:

| Issue | Contact | Method |
|-------|---------|--------|
| Database restore | DevOps | Slack |
| SuperAdmin access | CTO | Phone |
| Code cleanup | Lead Dev | Jira |

---

**Checklist Version**: 1.0
**Last Updated**: 2026-01-10
**Next Review**: After cleanup completion
