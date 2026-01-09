# Production Test Accounts Cleanup & SuperAdmin Creation

**SECURITY AUDIT COMPLETED**
**Date:** 2025-01-09
**Status:** Ready for Execution
**Risk Level:** HIGH (requires careful execution)

---

## Overview

This guide removes all test accounts from production and creates a single SuperAdmin account (`admin@haldeki.com`).

**What this does:**
- Deletes 11-15 test accounts matching test domains/patterns
- Creates backup of all deleted accounts
- Assigns SuperAdmin role to `admin@haldeki.com`
- Provides verification steps

**Security Assessment:**
- **CRITICAL:** Test accounts with admin/superadmin privileges present privilege escalation risk
- **HIGH:** Unconfirmed test emails allow account enumeration
- **MEDIUM:** Active test accounts may have been used for testing

---

## Pre-Execution Checklist

### 1. Backup Database
```sql
-- Run in Supabase SQL Editor BEFORE cleanup
SELECT * FROM auth.users;
SELECT * FROM public.profiles;
SELECT * FROM public.user_roles;
```

### 2. Review Test Accounts
```bash
# Run the audit script first
psql -f scripts/audit-test-accounts.sql
```

### 3. Prepare SuperAdmin Password
- **Minimum:** 16 characters
- **Requirements:** Uppercase, lowercase, numbers, symbols
- **Example:** `H4ld3k!S3cur3#2025$Adm1n`
- **DO NOT** use common words or patterns

---

## Execution Steps

### Step 1: Run Audit Script (MANDATORY)

**File:** `scripts/audit-test-accounts.sql`

**What it does:**
- Lists all test accounts that will be deleted
- Shows risk levels and roles
- Identifies admin-privileged test accounts

**Action:** Review output carefully before proceeding

```bash
# In Supabase SQL Editor, open and run:
scripts/audit-test-accounts.sql
```

**Expected Output:**
- Total test accounts: 11-15
- Admin/SuperAdmin accounts: 0-2
- Unconfirmed emails: varies
- Recent logins: varies

---

### Step 2: Run Cleanup Script

**File:** `scripts/cleanup-test-accounts-production.sql`

**What it does:**
1. Creates backup table (`deleted_test_accounts_backup_20250109`)
2. Shows deletion summary with counts
3. Starts transaction with 5-second abort window
4. Deletes test accounts from all tables
5. Commits transaction
6. Assigns SuperAdmin role to `admin@haldeki.com`

**Action:** Run in Supabase SQL Editor

```bash
# Open in Supabase SQL Editor
scripts/cleanup-test-accounts-production.sql
```

**Safety Features:**
- 5-second delay before deletion (Ctrl+C to abort)
- Transaction-based (atomic, rollback if error)
- Comprehensive backup before deletion
- Verification counts after deletion

---

### Step 3: Create SuperAdmin Account

The cleanup script will attempt to assign the superadmin role to `admin@haldeki.com`. If the account doesn't exist, you'll see instructions.

**Option A: Account Already Exists**
- Script automatically assigns superadmin role
- Proceed to Step 4

**Option B: Account Doesn't Exist**

**Create via Supabase Dashboard:**

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter details:
   - **Email:** `admin@haldeki.com`
   - **Password:** [Your 16+ character secure password]
   - **Auto Confirm User:** ✅ Check this box
4. Click **"Create user"**
5. Run this SQL to assign superadmin role:

```sql
-- Assign superadmin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::public.app_role
FROM auth.users
WHERE email = 'admin@haldeki.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

### Step 4: Verify Cleanup

**File:** `scripts/verify-cleanup-and-superadmin.sql`

**What it checks:**
- Test accounts deleted (count = 0)
- SuperAdmin account exists with correct role
- No orphaned records in database
- User role summary

**Action:** Run in Supabase SQL Editor

```bash
# Run verification script
scripts/verify-cleanup-and-superadmin.sql
```

**Expected Output:**
```
TEST ACCOUNT CLEANUP VERIFICATION
Remaining test accounts: 0
STATUS: SUCCESS

SUPERADMIN ACCOUNT VERIFICATION
admin@haldeki.com exists: true
Has superadmin role: true
STATUS: SUCCESS
```

---

## Post-Execution Tasks

### 1. Test SuperAdmin Login
```bash
# Try logging in at your app URL
Email: admin@haldeki.com
Password: [Your secure password]
```

### 2. Enable MFA (Multi-Factor Authentication)
**In Supabase Dashboard:**
1. Go to **Authentication** → **Users**
2. Find `admin@haldeki.com`
3. Enable MFA/2FA if available

### 3. Configure IP Whitelisting (Optional)
**For production environments:**
1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Configure IP restrictions for superadmin access

### 4. Review Audit Logs
**In Supabase Dashboard:**
1. Go to **Logs** → **Auth Logs**
2. Review recent login attempts
3. Check for suspicious activity

### 5. Document Credentials
**Store securely (password manager):**
- Email: `admin@haldeki.com`
- Password: [Your secure password]
- Role: SuperAdmin
- Created: [Date]

### 6. Delete Backup Table (After 30 Days)
```sql
-- Run after 30 days if everything is working
DROP TABLE IF EXISTS public.deleted_test_accounts_backup_20250109;
```

---

## Rollback Procedure

If you need to restore deleted test accounts:

```sql
-- Check backup table
SELECT * FROM public.deleted_test_accounts_backup_20250109;

-- Restore specific account (example)
-- WARNING: This is complex, contact DB admin for assistance
-- The backup table contains all necessary data for manual restoration
```

---

## Security Considerations

### What Was Protected
- Production user data
- Vendor inventory and pricing
- Order history and financial data
- Business credentials and relationships

### Threats Mitigated
- Privilege escalation via test admin accounts
- Account enumeration via unconfirmed test emails
- Credential stuffing using test account passwords
- Unauthorized access to production data

### Ongoing Security
1. **Monitor for new test accounts:** Set up alerts
2. **Regular audits:** Run audit script monthly
3. **MFA enforcement:** Require for all admin accounts
4. **IP whitelisting:** Restrict superadmin access
5. **Session timeout:** Configure appropriate limits

---

## Troubleshooting

### Issue: Script fails with "permission denied"
**Solution:** Ensure you're running as a Supabase admin/owner

### Issue: SuperAdmin role not assigned
**Solution:** Manually run the role assignment SQL from Step 3

### Issue: Test accounts still exist after cleanup
**Solution:**
1. Check verification script output
2. Review Supabase logs for errors
3. Manually delete specific accounts:

```sql
-- Delete specific test account
DELETE FROM public.profiles WHERE email = 'test@example.com';
DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
DELETE FROM auth.users WHERE email = 'test@example.com';
```

### Issue: Cannot login as SuperAdmin
**Solution:**
1. Verify account exists: `SELECT * FROM auth.users WHERE email = 'admin@haldeki.com';`
2. Check email confirmed: `email_confirmed_at` should NOT be null
3. Reset password via Supabase Dashboard if needed

---

## Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `scripts/audit-test-accounts.sql` | List all test accounts | Before cleanup |
| `scripts/cleanup-test-accounts-production.sql` | Delete test accounts + create SuperAdmin | Main cleanup |
| `scripts/verify-cleanup-and-superadmin.sql` | Verify success | After cleanup |

---

## Support

**If you encounter issues:**
1. Check Supabase logs for error details
2. Review backup table: `deleted_test_accounts_backup_20250109`
3. Contact database administrator

**Emergency Rollback:**
- Backup table contains all deleted account data
- Manual restoration requires DB admin assistance
- Test accounts can be recreated from backup data

---

## Summary

**Before:** 11-15 test accounts, various roles, security risk
**After:** 1 SuperAdmin account, secure, verified

**Security Improvements:**
- Removed all test account attack vectors
- Centralized admin access to single SuperAdmin
- Comprehensive backup for disaster recovery
- Verification steps ensure data integrity

---

**Remember:** This is a production database operation. Test in staging first if possible.
