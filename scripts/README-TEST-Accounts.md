# Test Accounts SQL Scripts - Quick Reference

## Overview

This directory contains SQL scripts for auditing and cleaning up test accounts from the database.

---

## Available Scripts

### 1. audit-test-accounts.sql

**Purpose:** Find and document all test accounts in the database

**Usage:**
```bash
# Via psql
psql "$DATABASE_URL" -F scripts/audit-test-accounts.sql

# Or run each section manually in Supabase Dashboard SQL Editor
```

**Sections:**
1. All test users summary
2. Test users with roles and details
3. Warehouse staff test accounts
4. Test accounts count by role
5. Security risk assessment
6. Delete commands (reference only)

**Output:** Complete list of all test accounts with roles, status, and risk level

---

### 2. cleanup-test-accounts-production.sql

**Purpose:** Safely delete ALL test accounts from production

**Features:**
- Creates backup table before deletion
- Shows confirmation prompt (5 second delay)
- Deletes in correct order (respects foreign keys)
- Verifies deletion success
- Provides summary report

**Usage:**
```bash
# WARNING: This will permanently delete test accounts
psql "$DATABASE_URL" -f scripts/cleanup-test-accounts-production.sql
```

**What Gets Deleted:**
- All emails matching `%@test.haldeki.com`
- All emails matching `%@test.haldeki.local`
- All emails matching `%test@example%`
- Associated records in: profiles, user_roles, dealers, suppliers, businesses, warehouse_staff

**Backup:** Creates `public.deleted_test_accounts_backup` table before deletion

---

## Quick Queries

### Check for Test Accounts

```sql
-- Quick count
SELECT COUNT(*) as test_accounts
FROM auth.users
WHERE email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local';
-- Expected: 0 in production

-- List all test accounts
SELECT email, created_at, last_sign_in_at
FROM auth.users
WHERE email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local'
ORDER BY created_at;
```

### Verify Cleanup Success

```sql
-- Should return 0
SELECT COUNT(*) as remaining_test_accounts
FROM auth.users
WHERE email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local';

-- Should return your admin accounts
SELECT email, array_agg(role) as roles
FROM auth.users au
JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.role IN ('admin', 'superadmin')
GROUP BY email;
```

### Review Backup Table

```sql
-- If you ran cleanup script, check the backup
SELECT * FROM public.deleted_test_accounts_backup;

-- Drop backup when safe to do so
DROP TABLE IF EXISTS public.deleted_test_accounts_backup;
```

---

## Common Workflows

### Workflow 1: Audit Before Launch

```bash
# Step 1: Run audit
psql "$DATABASE_URL" -f scripts/audit-test-accounts.sql > test-account-audit.txt

# Step 2: Review the output
cat test-account-audit.txt

# Step 3: Check documentation
cat docs/security/TEST_ACCOUNTS_AUDIT.md

# Step 4: Decide on cleanup
# If test accounts found, proceed to Workflow 2
```

### Workflow 2: Production Cleanup

```bash
# Step 1: Make sure you have database backup!
# Supabase auto-backups should be enabled

# Step 2: Run cleanup script
psql "$DATABASE_URL" -f scripts/cleanup-test-accounts-production.sql

# Step 3: Verify success
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@test.haldeki.com';"
# Should return 0

# Step 4: Create new admin accounts
# Via Supabase Dashboard: Authentication > Users > Add user
```

### Workflow 3: Development Setup

```bash
# For local development, you WANT test accounts
# Run the test accounts migration

# Via Supabase CLI
supabase db reset

# Or run migration
supabase migration up

# Test accounts will be created in local database
# Emails: admin-test@haldeki.local, etc.
# Password: DevTest1234!
```

---

## Test Account Details

### Production Test Accounts (@test.haldeki.com)

| Role | Email | Password | Risk |
|------|-------|----------|------|
| superadmin | superadmin@test.haldeki.com | Test1234! | CRITICAL |
| admin | admin@test.haldeki.com | Test1234! | HIGH |
| dealer | dealer-approved@test.haldeki.com | Test1234! | MEDIUM |
| dealer | dealer-pending@test.haldeki.com | Test1234! | LOW |
| supplier | supplier-approved@test.haldeki.com | Test1234! | MEDIUM |
| supplier | supplier-pending@test.haldeki.com | Test1234! | LOW |
| business | business-approved@test.haldeki.com | Test1234! | MEDIUM |
| business | business-pending@test.haldeki.com | Test1234! | LOW |
| user | customer1@test.haldeki.com | Test1234! | LOW |
| user | customer2@test.haldeki.com | Test1234! | LOW |
| warehouse | warehouse@test.haldeki.com | Test1234! | MEDIUM |

### Local Development Accounts (@test.haldeki.local)

| Role | Email | Password |
|------|-------|----------|
| superadmin | admin-test@haldeki.local | DevTest1234! |
| dealer | dealer-test@haldeki.local | DevTest1234! |
| supplier | supplier-test@haldeki.local | DevTest1234! |
| business | business-test@haldeki.local | DevTest1234! |

---

## Safety Checks

### Before Running Cleanup

- [ ] Database backup is enabled (Supabase auto-backups)
- [ ] You have admin access to recreate accounts if needed
- [ ] You've reviewed the audit output
- [ ] Test accounts are not needed for beta testing
- [ ] Team is notified about the cleanup

### After Running Cleanup

- [ ] Verify test accounts are gone (count = 0)
- [ ] Create proper admin accounts
- [ ] Test admin login
- [ ] Review backup table contents
- [ ] Update documentation

---

## Troubleshooting

### Issue: Cleanup script fails with foreign key error

**Solution:** The script deletes in correct order, but if you have custom tables, add them:

```sql
-- Add before auth.users deletion
DELETE FROM your_custom_table
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
);
```

### Issue: Can't delete from auth.users

**Solution:** Use Supabase Dashboard or service role key:

```sql
-- Via SQL Editor in Dashboard (works)
DELETE FROM auth.users WHERE email LIKE '%@test.haldeki.com';

-- Via psql with service role
psql "service_role_key_here" -c "DELETE FROM auth.users WHERE email LIKE '%@test.haldeki.com';"
```

### Issue: Need to restore deleted accounts

**Solution:** Check the backup table:

```sql
-- View backup
SELECT * FROM public.deleted_test_accounts_backup;

-- Manually recreate needed accounts
-- Via Supabase Dashboard: Authentication > Users > Add user
```

---

## Related Documentation

- `docs/security/TEST_ACCOUNTS_AUDIT.md` - Detailed audit documentation
- `docs/security/TEST_ACCOUNTS_REPORT.md` - Executive summary
- `docs/deployment/BETA_SECURITY_CHECKLIST.md` - Pre-launch checklist
- `docs/development/TEST_ACCOUNTS.md` - Development setup guide

---

## Security Notes

**CRITICAL:**
- Never commit test passwords to production code
- Never use test accounts in production environment
- Never share test credentials via email/chat
- Always use strong passwords for admin accounts
- Always enable 2FA where available

**Development:**
- Test accounts are acceptable in development
- Use @test.haldeki.local domain for clarity
- Keep passwords simple for convenience
- Document all test accounts in one place

---

*Last Updated: 2026-01-09*
*Database Architect: Claude Code*
