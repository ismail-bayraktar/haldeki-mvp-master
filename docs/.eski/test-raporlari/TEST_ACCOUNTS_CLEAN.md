# Test Accounts (Cleaned)

> **Last Updated**: 2026-01-09
> **Status**: Cleaned - Only essential test accounts retained
> **Production Admin**: `admin@haldeki.com`

---

## Overview

After cleanup, only **3 accounts** are retained for testing and production:

| Account | Role | Purpose | Status |
|---------|------|---------|--------|
| `admin@haldeki.com` | superadmin | Production superadmin | ✅ Active |
| `superadmin@test.haldeki.com` | superadmin | Test superadmin | ✅ Active |
| `supplier-approved@test.haldeki.com` | supplier | Test supplier (approved) | ✅ Active |

---

## Account Details

### Production Admin

**Email**: `admin@haldeki.com`
**Role**: `superadmin`
**Password**: Set manually via Supabase Dashboard
**Status**: Email confirmed, never signed in
**Created**: 2026-01-09

**Usage**:
- Primary superadmin account for production
- Use this account to manage users, roles, and system settings
- DO NOT delete this account

### Test Superadmin

**Email**: `superadmin@test.haldeki.com`
**Role**: `superadmin`
**Password**: `Test1234!`
**Status**: Email confirmed, active
**Created**: 2026-01-04

**Usage**:
- Testing superadmin functionality
- Testing user management workflows
- Can be deleted after beta testing

### Test Supplier (Approved)

**Email**: `supplier-approved@test.haldeki.com`
**Role**: `supplier`
**Password**: `Test1234!`
**Status**: Email confirmed, active, approved
**Created**: 2026-01-04

**Usage**:
- Testing approved supplier workflows
- Testing supplier product management
- Testing supplier order processing

---

## Cleanup Summary

**Deleted Accounts** (0 found, already clean):
- ❌ All other `@test.haldeki.com` accounts were already removed

**Kept Accounts** (3 retained):
- ✅ `admin@haldeki.com` (production superadmin)
- ✅ `superadmin@test.haldeki.com` (test superadmin)
- ✅ `supplier-approved@test.haldeki.com` (test supplier)

---

## Environment Variables

Updated `.env.local` with cleaned accounts:

```env
# Test Superadmin Account - Role: superadmin
VITE_TEST_ADMIN_EMAIL=superadmin@test.haldeki.com
VITE_TEST_ADMIN_PASS=Test1234!

# Test Supplier Account - Role: supplier (approved)
VITE_TEST_SUPPLIER_EMAIL=supplier-approved@test.haldeki.com
VITE_TEST_SUPPLIER_PASS=Test1234!

# Production Admin Account - Role: superadmin
VITE_PROD_ADMIN_EMAIL=admin@haldeki.com
```

---

## Verification Scripts

### Verify Accounts Exist

```bash
node scripts/verify-accounts.cjs
```

### Verify User Roles

```bash
node scripts/verify-roles.cjs
```

### Run Cleanup (if needed)

```bash
node scripts/cleanup-keep-specific-accounts.cjs
```

---

## Security Notes

1. **Test passwords are weak** (`Test1234!`) - OK for testing only
2. **Production admin password** should be strong and unique
3. **Test accounts** should be removed before public launch
4. **Enable MFA** for `admin@haldeki.com` in Supabase Dashboard

---

## Post-Beta Cleanup (Future)

After beta testing is complete:

1. **Delete test accounts**:
   - `superadmin@test.haldeki.com`
   - `supplier-approved@test.haldeki.com`

2. **Keep production account**:
   - `admin@haldeki.com` (never delete)

3. **Update documentation**:
   - Remove test credentials from all files
   - Update `.env.local` to remove test accounts

---

## Supabase Dashboard Access

**Project URL**: https://ynatuiwdvkxcmmnmejkl.supabase.co
**Project ID**: `ynatuiwdvkxcmmnmejkl`

**Manage Users**: Authentication → Users
**Manage Database**: Database → Tables
**View Logs**: Database → Logs

---

**End of Cleaned Test Accounts Documentation**
