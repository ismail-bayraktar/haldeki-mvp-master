# Fix Auth 400 Error - Login "Invalid Credentials"

## Problem

Login returns **400 Bad Request** with error message **"Invalid login credentials"** for:
- admin@haldeki.com
- superadmin@test.haldeki.com
- supplier-approved@test.haldeki.com

## Root Cause

The pre-computed bcrypt hashes in the recovery SQL script are **invalid**. They don't actually match the passwords they claim to represent, causing Supabase to reject all login attempts.

## Solution

Use the **Supabase Admin API** to properly reset passwords. This ensures passwords are hashed correctly using Supabase's own hashing algorithm.

---

## Method 1: Automated Fix (Recommended)

### Prerequisites

1. Get your **Service Role Key** from Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/settings/api
   - Copy: `service_role` key (NOT the anon key)
   - Add to `.env.local`:

   ```env
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

2. Install dependencies:

   ```bash
   npm install dotenv
   ```

### Execute Fix

```bash
npx tsx scripts/fix-auth-login.ts
```

### What This Script Does

1. ✅ Confirms all user emails (`email_confirmed_at = NOW()`)
2. ✅ Resets passwords using Supabase Admin API (proper hashing)
3. ✅ Verifies roles are assigned
4. ✅ Tests login with new credentials
5. ✅ Creates audit log entry

### New Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@haldeki.com | `HaldekiAdmin2025!` | superadmin |
| superadmin@test.haldeki.com | `HaldekiSuper2025!` | superadmin |
| supplier-approved@test.haldeki.com | `HaldekiSupplier2025!` | supplier |

**CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN!**

---

## Method 2: Manual Fix (Supabase Dashboard)

If automated script doesn't work, do it manually:

### Step 1: Open SQL Editor

Go to: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/sql/new

### Step 2: Run Diagnostic

```sql
-- Copy contents of:
-- supabase/migrations/20260109210000_diagnose_auth_issue.sql
```

This will show you:
- Which users exist
- Email confirmation status
- Password hash status
- Any other issues

### Step 3: Confirm Emails

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
);
```

### Step 4: Reset Passwords via Dashboard

1. Go to: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/auth/users
2. Click on each user
3. Click "Reset Password"
4. Enter new password (see credentials above)
5. Click "Save"

### Step 5: Test Login

Go to https://haldeki-market.vercel.app and test each user.

---

## Method 3: Node.js Admin API (Fallback)

Create a temporary script `fix-passwords.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixPassword(email, userId, newPassword) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
    email_confirm: true
  });

  if (error) {
    console.error(`❌ ${email}: ${error.message}`);
  } else {
    console.log(`✅ ${email}: Password reset successfully`);
  }
}

// Run for each user
fixPassword('admin@haldeki.com', '<user-id-1>', 'HaldekiAdmin2025!');
fixPassword('superadmin@test.haldeki.com', '<user-id-2>', 'HaldekiSuper2025!');
fixPassword('supplier-approved@test.haldeki.com', '<user-id-3>', 'HaldekiSupplier2025!');
```

Get user IDs from:
```sql
SELECT id, email FROM auth.users WHERE email IN (...);
```

---

## Verification

After fixing, run:

```bash
npm run auth:verify
```

Expected output:
- ✅ 3 users exist
- ✅ All emails confirmed
- ✅ All have roles assigned
- ✅ Login works

---

## Security Checklist

After successful login:

- [ ] Change all passwords immediately
- [ ] Enable MFA for all admin accounts
- [ ] Test all role-based access
- [ ] Review audit logs
- [ ] Delete recovery scripts from git history
- [ ] Rotate service role key if needed

---

## Why the Original Hashes Failed

The recovery SQL used pre-computed bcrypt hashes:

```sql
'$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU9xKxKzJ0Kq'
```

**Problems:**
1. These hashes were never TESTED to verify they match the claimed passwords
2. Bcrypt hashes are one-way - you can't verify them without knowing the original password
3. Supabase might use different hashing parameters (salt, cost factor)

**Solution:** Always use Supabase Admin API for password operations - it handles hashing correctly.

---

## Files Created

1. `supabase/migrations/20260109210000_diagnose_auth_issue.sql` - Diagnostic script
2. `supabase/migrations/20260109220000_fix_auth_login_issue.sql` - SQL fix attempt
3. `scripts/fix-auth-login.ts` - **Automated fix using Admin API** ⭐
4. This README

---

## Prevention

1. **Never** use pre-computed bcrypt hashes in SQL
2. **Always** use Supabase Admin API for password operations
3. **Test** password hashes before committing to production
4. **Verify** auth configuration (email confirm, auto-confirm)

---

## Next Steps

1. ✅ Execute fix (Method 1 recommended)
2. ✅ Test login at https://haldeki-market.vercel.app
3. ✅ Change all passwords
4. ✅ Enable MFA
5. ✅ Test all functionality
6. ✅ Document incident

---

**Status:** Ready for execution
**Priority:** CRITICAL
**Created:** 2026-01-09
