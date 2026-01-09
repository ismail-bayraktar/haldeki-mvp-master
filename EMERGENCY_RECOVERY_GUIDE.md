# EMERGENCY USER RECOVERY - EXECUTION GUIDE

> **CRITICAL:** This document contains sensitive recovery credentials. Handle with extreme care.

## STATUS

| Phase | Status |
|-------|--------|
| SQL Script | READY |
| Execution | PENDING |
| Verification | PENDING |
| Commit | PENDING |
| Deploy | PENDING |

---

## PART 1: SUPABASE DASHBOARD EXECUTION

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **SQL Editor** (left sidebar)

### Step 2: Execute Recovery Script

1. Click **New Query**
2. Copy the entire contents of: `supabase/migrations/20260109200000_emergency_user_recreation.sql`
3. Paste into SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Execution Results

**Expected Output:**
```
NOTICE:  Created user: admin@haldeki.com
NOTICE:  Password: AdminRecovery2025!
NOTICE:  User ID: [uuid]

NOTICE:  Created user: superadmin@test.haldeki.com
NOTICE:  Password: TestSuperAdmin2025!
NOTICE:  User ID: [uuid]

NOTICE:  Created user: supplier-approved@test.haldeki.com
NOTICE:  Password: TestSupplier2025!
NOTICE:  User ID: [uuid]

NOTICE:  =============================================================================
NOTICE:  USER RECOVERY VERIFICATION
NOTICE:  =============================================================================
NOTICE:  auth.users counts:
NOTICE:    - admin@haldeki.com: 1
NOTICE:    - superadmin@test.haldeki.com: 1
NOTICE:    - supplier-approved@test.haldeki.com: 1
NOTICE:
NOTICE:  user_roles (superadmin): 2
NOTICE:  =============================================================================
```

**Table Result:**
| id | email | created_at | full_name | phone | role |
|----|-------|------------|-----------|-------|------|
| [uuid] | admin@haldeki.com | [timestamp] | Super Admin | NULL | superadmin |
| [uuid] | superadmin@test.haldeki.com | [timestamp] | Süper Yönetici | 0532 100 00 01 | superadmin |
| [uuid] | supplier-approved@test.haldeki.com | [timestamp] | Ali Kaya | 0533 300 00 01 | supplier |

### Step 4: Manual Verification in Supabase

**Check auth.users:**
```sql
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);
```

**Check profiles:**
```sql
SELECT * FROM public.profiles
WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);
```

**Check user_roles:**
```sql
SELECT ur.*, p.email
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
WHERE p.email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);
```

**Check suppliers:**
```sql
SELECT * FROM public.suppliers
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email = 'supplier-approved@test.haldeki.com'
);
```

---

## PART 2: LOGIN TESTING CHECKLIST

### Test Environment Setup

**Base URL:** https://haldeki-market.vercel.app
**Test Date:** [Fill after execution]

### Test Cases

#### Test 1: Superadmin Login (admin@haldeki.com)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/login` | Login page loads | |
| 2 | Enter email: `admin@haldeki.com` | Email accepted | |
| 3 | Enter password: `AdminRecovery2025!` | Password accepted | |
| 4 | Click login button | Authentication succeeds | |
| 5 | Check redirect | Redirects to `/panel/superadmin` | |
| 6 | Verify session | User is authenticated | |
| 7 | Check role | Role: `superadmin` | |
| 8 | Access admin panel | Can access all admin features | |

**Result:** [PASS/FAIL]

---

#### Test 2: Superadmin Login (superadmin@test.haldeki.com)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/login` | Login page loads | |
| 2 | Enter email: `superadmin@test.haldeki.com` | Email accepted | |
| 3 | Enter password: `TestSuperAdmin2025!` | Password accepted | |
| 4 | Click login button | Authentication succeeds | |
| 5 | Check redirect | Redirects to `/panel/superadmin` | |
| 6 | Verify session | User is authenticated | |
| 7 | Check role | Role: `superadmin` | |
| 8 | Access admin panel | Can access all admin features | |

**Result:** [PASS/FAIL]

---

#### Test 3: Supplier Login (supplier-approved@test.haldeki.com)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/login` | Login page loads | |
| 2 | Enter email: `supplier-approved@test.haldeki.com` | Email accepted | |
| 3 | Enter password: `TestSupplier2025!` | Password accepted | |
| 4 | Click login button | Authentication succeeds | |
| 5 | Check redirect | Redirects to `/panel/supplier` | |
| 6 | Verify session | User is authenticated | |
| 7 | Check role | Role: `supplier` | |
| 8 | Check approval status | Status: `approved` | |
| 9 | Access supplier panel | Can access supplier features | |

**Result:** [PASS/FAIL]

---

#### Test 4: Supplier Record Verification

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Login as supplier | Successfully logged in | |
| 2 | Navigate to supplier profile | Profile loads | |
| 3 | Check supplier name | Shows: "Toroslu Çiftliği" | |
| 4 | Check contact name | Shows: "Ali Kaya" | |
| 5 | Check contact phone | Shows: "0533 300 00 01" | |
| 6 | Check product categories | Shows: ["sebze", "meyve", "yeşillik"] | |
| 7 | Check approval status | Shows: "approved" | |
| 8 | Check active status | Shows: "active" | |

**Result:** [PASS/FAIL]

---

#### Test 5: Role-Based Access Control

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Login as superadmin | Successfully logged in | |
| 2 | Try to access `/panel/admin` | Access granted | |
| 3 | Try to access `/panel/superadmin` | Access granted | |
| 4 | Try to access `/panel/supplier` | Access denied (wrong role) | |
| 5 | Logout | Session cleared | |
| 6 | Login as supplier | Successfully logged in | |
| 7 | Try to access `/panel/supplier` | Access granted | |
| 8 | Try to access `/panel/admin` | Access denied (wrong role) | |

**Result:** [PASS/FAIL]

---

#### Test 6: Password Change Flow

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Login as any user | Successfully logged in | |
| 2 | Navigate to settings | Settings page loads | |
| 3 | Click "Change Password" | Password change form appears | |
| 4 | Enter current password | Field accepts input | |
| 5 | Enter new password | Field accepts input | |
| 6 | Confirm new password | Field accepts input | |
| 7 | Submit form | Password updated | |
| 8 | Logout | Session cleared | |
| 9 | Login with new password | Successfully logged in | |
| 10 | Try old password | Login fails | |

**Result:** [PASS/FAIL]

---

## PART 3: ROLLBACK PROCEDURES

### If SQL Execution Fails

**Error: "permission denied for table auth.users"**
- You need service_role privileges
- Use SQL Editor with service_role key
- Do NOT use migration system

**Error: "duplicate key value violates unique constraint"**
- Users already exist
- Run manual cleanup first:
```sql
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN (...)
);
DELETE FROM public.suppliers WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN (...)
);
DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email IN (...)
);
DELETE FROM auth.users WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);
```

**Error: "relation does not exist"**
- Run schema setup migrations first
- Check database schema matches expectations

### If Login Tests Fail

**Issue: "Invalid login credentials"**
- Verify bcrypt hashes are correct
- Check `encrypted_password` field in auth.users
- Verify email_confirmed_at is not NULL

**Issue: "User not found"**
- Check auth.users table exists
- Verify email matches exactly
- Check for trailing spaces in email

**Issue: "Access denied"**
- Verify user_roles table has correct entries
- Check role matches expected role
- Verify RBAC policies are applied

### Rollback Script

If complete rollback is needed:

```sql
-- Complete rollback of recovery users
BEGIN;

DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN (
    'admin@haldeki.com',
    'superadmin@test.haldeki.com',
    'supplier-approved@test.haldeki.com'
  )
);

DELETE FROM public.suppliers WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN (
    'supplier-approved@test.haldeki.com'
  )
);

DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email IN (
    'admin@haldeki.com',
    'superadmin@test.haldeki.com',
    'supplier-approved@test.haldeki.com'
  )
);

DELETE FROM auth.users WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);

COMMIT;
```

---

## PART 4: SECURITY ACTIONS (POST-RECOVERY)

### IMMEDIATE ACTIONS (Do within 1 hour)

1. **Login Verification**
   - [ ] All 3 users can login
   - [ ] All roles are correct
   - [ ] All permissions work

2. **Password Change**
   - [ ] Force password change for all users
   - [ ] Document new passwords securely
   - [ ] Update any stored credentials

3. **Audit Log Review**
   - [ ] Check admin_audit_log table
   - [ ] Review recovery execution timestamp
   - [ ] Note executing user

### WITHIN 24 HOURS

4. **MFA Setup**
   - [ ] Enable 2FA for all admin accounts
   - [ ] Verify MFA works correctly
   - [ ] Document recovery codes

5. **Access Review**
   - [ ] Review all user permissions
   - [ ] Remove any unnecessary access
   - [ ] Document role assignments

6. **Security Audit**
   - [ ] Check for other unauthorized changes
   - [ ] Review recent login logs
   - [ ] Verify no other users affected

### WITHIN 7 DAYS

7. **Script Cleanup**
   - [ ] Delete recovery SQL file
   - [ ] Remove this guide from repo
   - [ ] Clear any backup copies

8. **Documentation Update**
   - [ ] Update runbooks with lessons learned
   - [ ] Document recovery procedure
   - [ ] Create prevention checklist

9. **Password Policy**
   - [ ] Enforce stronger password requirements
   - [ ] Implement password expiration
   - [ ] Enable password history checking

---

## PART 5: RECOVERY CREDENTIALS

### CRITICAL - SAVE THESE SECURELY

```
User 1: Production Superadmin
Email: admin@haldeki.com
Password: AdminRecovery2025!
Role: superadmin

User 2: Test Superadmin
Email: superadmin@test.haldeki.com
Password: TestSuperAdmin2025!
Role: superadmin

User 3: Test Supplier
Email: supplier-approved@test.haldeki.com
Password: TestSupplier2025!
Role: supplier
Status: approved
Company: Toroslu Çiftliği
Contact: Ali Kaya
Phone: 0533 300 00 01
```

**WARNING:** Change all passwords immediately after first login!

---

## PART 6: EXECUTION LOG

### SQL Execution

- **Date/Time:** [Fill after execution]
- **Executed By:** [Fill after execution]
- **Database:** [Fill after execution]
- **Result:** [Fill after execution]
- **Errors:** [Fill if any]

### Test Results

- **Test Date:** [Fill after execution]
- **Tester:** [Fill after execution]
- **Test 1 (Superadmin 1):** [PASS/FAIL]
- **Test 2 (Superadmin 2):** [PASS/FAIL]
- **Test 3 (Supplier):** [PASS/FAIL]
- **Test 4 (Supplier Record):** [PASS/FAIL]
- **Test 5 (RBAC):** [PASS/FAIL]
- **Test 6 (Password Change):** [PASS/FAIL]

### Issues Found

[List any issues discovered during testing]

### Resolution Status

- [ ] All issues resolved
- [ ] Passwords changed
- [ ] MFA enabled
- [ ] Audit complete
- [ ] Ready for production use

---

## APPENDIX: SQL VERIFICATION QUERIES

### Complete User Audit

```sql
-- Full audit of recovered users
SELECT
  u.id as user_id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  u.last_sign_in_at,
  p.full_name,
  p.phone,
  r.role,
  s.name as supplier_name,
  s.approval_status,
  s.is_active as supplier_active
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles r ON u.id = r.user_id
LEFT JOIN public.suppliers s ON u.id = s.user_id
WHERE u.email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
)
ORDER BY u.email;
```

### Auth Schema Check

```sql
-- Verify auth.users structure
SELECT
  id,
  email,
  aud,
  role,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users
WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);
```

### Public Schema Check

```sql
-- Verify all public tables
SELECT
  'profiles' as table_name,
  COUNT(*) as count
FROM public.profiles
WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
)
UNION ALL
SELECT
  'user_roles' as table_name,
  COUNT(*) as count
FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'admin@haldeki.com',
    'superadmin@test.haldeki.com',
    'supplier-approved@test.haldeki.com'
  )
)
UNION ALL
SELECT
  'suppliers' as table_name,
  COUNT(*) as count
FROM public.suppliers
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email = 'supplier-approved@test.haldeki.com'
);
```

---

**END OF EMERGENCY RECOVERY GUIDE**

**IMPORTANT:** After successful recovery and password changes, delete this file and the SQL migration script from your repository.

---

## ORIGINAL INCIDENT DETAILS
**Impact:** 0 users remain in `auth.users` table
**Status:** EMERGENCY RECOVERY REQUIRED

---

## Quick Recovery Steps

### Option 1: Execute SQL via Supabase Dashboard (RECOMMENDED)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to SQL Editor
4. Copy and paste the contents of:
   ```
   supabase/migrations/20260109200000_emergency_user_recreation.sql
   ```
5. Click "Run" to execute
6. Save the displayed credentials

### Option 2: Run Verification Script

```bash
# Check current state
npx tsx scripts/verify-auth-system.ts

# View report
cat auth-system-report.json
```

---

## Recovered Accounts

### 1. Production Superadmin
- **Email:** admin@haldeki.com
- **Password:** AdminRecovery2025!
- **Role:** superadmin
- **Status:** CHANGE PASSWORD AFTER LOGIN

### 2. Test Superadmin
- **Email:** superadmin@test.haldeki.com
- **Password:** TestSuperAdmin2025!
- **Role:** superadmin
- **Status:** CHANGE PASSWORD AFTER LOGIN

### 3. Test Supplier
- **Email:** supplier-approved@test.haldeki.com
- **Password:** TestSupplier2025!
- **Role:** supplier
- **Status:** approved
- **Company:** Toroslu Çiftliği

---

## Verification Queries

Run these in Supabase SQL Editor to verify recovery:

```sql
-- Check auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);

-- Check profiles
SELECT p.id, p.email, p.full_name, p.phone
FROM public.profiles p
WHERE p.email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);

-- Check roles
SELECT u.email, r.role
FROM auth.users u
JOIN public.user_roles r ON u.id = r.user_id
WHERE u.email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);

-- Check supplier record
SELECT s.name, s.contact_name, s.approval_status, s.is_active
FROM public.suppliers s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'supplier-approved@test.haldeki.com';
```

---

## Post-Recovery Checklist

### Immediate Actions (Within 1 Hour)

- [ ] Login as admin@haldeki.com
- [ ] CHANGE PASSWORD immediately
- [ ] Enable MFA (Multi-Factor Authentication)
- [ ] Verify superadmin access to all panels
- [ ] Test supplier login

### Security Actions (Within 24 Hours)

- [ ] Review audit logs for suspicious activity
- [ ] Check for unauthorized access attempts
- [ ] Update all recovery passwords
- [ ] Remove emergency SQL script from git history
- [ ] Document the incident in internal wiki

### System Verification (Within 48 Hours)

- [ ] Test all user roles
- [ ] Verify RLS policies work correctly
- [ ] Check Edge Functions have access
- [ ] Test supplier panel access
- [ ] Verify dealer panel access
- [ ] Test business panel access
- [ ] Check warehouse staff access

---

## Root Cause Analysis

### What Happened

1. Production cleanup script executed
2. Script targeted test accounts
3. ALL users deleted (not just test accounts)
4. Migration that should have prevented this was NOT executed

### Why Migration Wasn't Executed

The migration `20260110000000_create_superadmin.sql` was created but:
- May not have been applied to production
- Or was applied AFTER the deletion occurred
- Or doesn't have the proper safeguards

### Prevention Measures

1. **Add Safeguards to Cleanup Scripts**
   ```sql
   -- Always check email domain before deletion
   -- Never delete production accounts
   -- Require confirmation for bulk deletions
   ```

2. **Automated Backups**
   - Daily automated backups of auth.users
   - Point-in-time recovery enabled
   - Backup restoration procedure documented

3. **Pre-deployment Checklist**
   - Verify user count before cleanup
   - Test cleanup script on staging first
   - Require approval for destructive operations

---

## Additional Test Accounts

If you need to recreate additional test accounts, see:

- `supabase/migrations/20250104200000_comprehensive_test_accounts.sql`
- `supabase/migrations/20250109100000_phase11_warehouse_test_accounts.sql`

These require creating users via Supabase Dashboard first, then running migrations to assign roles.

---

## Password Hashing Tool

To generate new bcrypt hashes for additional users:

```bash
# Install dependencies
npm install bcrypt @types/bcrypt

# Generate hash for new password
npx tsx scripts/generate-bcrypt-hash.ts "NewSecurePassword123!"
```

Then update the SQL with the new hash:

```sql
'$2b$10$...' -- Replace with generated hash
```

---

## Environment Variables Required

Create `.env` with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**WARNING:** Never commit `.env` to git!

---

## Contact Information

If you need assistance:

1. Check Supabase Dashboard logs
2. Review audit log entries: `public.admin_audit_log`
3. Consult team documentation
4. Contact Supabase support if database issues persist

---

## Security Notes

1. **Passwords are temporary** - All recovery passwords must be changed
2. **Audit everything** - All actions are logged in `admin_audit_log`
3. **Limit access** - Only admins should execute recovery procedures
4. **Monitor logs** - Watch for suspicious login attempts
5. **Clean up** - Delete this guide and recovery scripts after 30 days

---

## Appendix: Technical Details

### Auth Schema Structure

```sql
auth.users
  - id (uuid, PK)
  - email (text, unique)
  - encrypted_password (text)
  - email_confirmed_at (timestamptz)
  - raw_user_meta_data (jsonb)
  - raw_app_meta_data (jsonb)
  - created_at (timestamptz)
  - updated_at (timestamptz)
```

### Public Schema Dependencies

```sql
public.profiles
  - id (uuid, FK to auth.users)
  - email (text)
  - full_name (text)
  - phone (text)

public.user_roles
  - user_id (uuid, FK to auth.users)
  - role (app_role enum)

public.suppliers
  - user_id (uuid, FK to auth.users)
  - name (text)
  - contact_name (text)
  - approval_status (approval_status enum)
  - is_active (boolean)
```

### Bcrypt Configuration

- Rounds: 10 (Supabase standard)
- Algorithm: 2b
- Format: `$2b$10$...`

---

**Document Version:** 1.0
**Created:** 2026-01-09
**Status:** ACTIVE EMERGENCY PROCEDURE
