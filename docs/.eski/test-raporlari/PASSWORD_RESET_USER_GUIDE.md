# Password Reset User Guide

> **Complete guide to reset user passwords and restore authentication**

---

## Quick Reference

| Task | Command/Link |
|------|--------------|
| Supabase Dashboard | https://app.supabase.com/project/epuhjrdqotyrryvkjnrp/auth/users |
| Automated Reset | `npm run auth:reset` |
| Verify Login | `npm run auth:reset:verify` |
| Interactive Reset | `npm run auth:reset:interactive` |
| Full Documentation | `docs/AUTH_400_ERROR_FIX.md` |

---

## Part 1: Understanding the Problem

### What Happened?

Your application users cannot log in. They receive:

```
400 Bad Request
Error: "Invalid login credentials"
```

### Root Cause

The password hashes in your database don't match the expected passwords. This can happen when:

- Pre-computed bcrypt hashes were inserted directly into SQL
- Passwords were reset using incorrect hashing methods
- Database was restored from backup with mismatched hashes

### The Fix

Reset passwords using **Supabase Admin API** (not SQL) to ensure proper hashing.

---

## Part 2: Reset Methods

### Method 1: Supabase Dashboard (RECOMMENDED)

**Best for:** Quick reset, no technical setup required

#### Step 1: Open Dashboard

Navigate to:
```
https://app.supabase.com/project/epuhjrdqotyrryvkjnrp/auth/users
```

#### Step 2: Locate Users

Find these users:
- `admin@haldeki.com`
- `superadmin@test.haldeki.com`
- `supplier-approved@test.haldeki.com`

#### Step 3: Reset Password for Each User

For each user:

1. Click on the user email
2. Click **"Reset Password"** button
3. Enter new password (see **Part 3** for credentials)
4. Click **"Save"**
5. Confirm success message

#### Step 4: Verify

Run verification script:
```bash
npm run auth:reset:verify
```

**Expected output:**
```
✅ admin@haldeki.com: SUCCESS
✅ superadmin@test.haldeki.com: SUCCESS
✅ supplier-approved@test.haldeki.com: SUCCESS

Success: 3/3
```

---

### Method 2: Automated Script

**Best for:** Multiple resets, automation

#### Prerequisites

1. Get Service Role Key:
   - Go to: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/settings/api
   - Copy `service_role` key (NOT `anon` key)
   - Add to `.env.local`:

   ```env
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
   ```

2. Install dependencies:
   ```bash
   npm install dotenv
   ```

#### Execute Reset

```bash
npm run auth:reset
```

This will:
- Confirm all user emails
- Reset passwords using Supabase Admin API
- Verify roles are assigned
- Test login with new credentials
- Create audit log entry

#### Verify Results

```bash
npm run auth:reset:verify
```

---

### Method 3: Interactive Script

**Best for:** Testing, development

```bash
npm run auth:reset:interactive
```

Follow the prompts to:
1. Select users to reset
2. Choose password strength
3. Confirm each action
4. View real-time results

---

## Part 3: User Credentials

### Development Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@haldeki.com` | `HaldekiAdmin2025!` | superadmin |
| `superadmin@test.haldeki.com` | `HaldekiSuper2025!` | superadmin |
| `supplier-approved@test.haldeki.com` | `HaldekiSupplier2025!` | supplier |

### Password Requirements

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

**SECURITY WARNING:** These are development passwords only. Change before production deployment.

---

## Part 4: Verification Checklist

### Automated Verification

Run the verification script:

```bash
npm run auth:reset:verify
```

This checks:
- User exists in database
- Email is confirmed
- Role is assigned
- Login works with credentials

### Manual Verification

1. **Open Application**
   ```
   https://haldeki-market.vercel.app/login
   ```

2. **Test Each User**

   For each credential in **Part 3**:
   - Enter email
   - Enter password
   - Click "Login"
   - Verify successful authentication
   - Verify correct role access

3. **Test Role-Based Access**

   - **Superadmin:** Can access admin panel, user management
   - **Supplier:** Can access supplier dashboard, products
   - **Regular User:** Can browse, add to cart

### Expected Results

- All users can log in
- No 400 errors
- Correct role permissions
- Session persistence works

---

## Part 5: Troubleshooting

### Problem: "Invalid login credentials" after reset

**Solution:**
1. Verify password was reset correctly
2. Check for typos in credentials
3. Try resetting again with stronger password
4. Check email confirmation status

### Problem: Script fails with "API key not found"

**Solution:**
1. Verify `.env.local` exists
2. Check variable name: `VITE_SUPABASE_SERVICE_ROLE_KEY`
3. Ensure you're using `service_role`, NOT `anon` key
4. Restart terminal/IDE after env changes

### Problem: User not found in database

**Solution:**
1. Check user exists in Supabase Dashboard
2. Verify email spelling
3. Create user manually if missing
4. Check user status (not deleted/banned)

### Problem: Permission denied

**Solution:**
1. Ensure you're using `service_role` key
2. Check key hasn't been rotated
3. Verify your IP isn't blocked
4. Check Supabase project status

### Problem: Email not confirmed

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Click user → "Confirm email" manually
3. Or run SQL:
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = NOW()
   WHERE email = 'user@example.com';
   ```

---

## Part 6: Post-Reset Security

### Immediate Actions

1. **Change All Passwords**
   - Log in as each user
   - Go to profile/settings
   - Change to unique, strong passwords
   - Store securely (password manager)

2. **Enable MFA** (Multi-Factor Authentication)
   - For admin users especially
   - Use authenticator app (not SMS)
   - Backup codes stored securely

3. **Review Audit Logs**
   - Check for suspicious activity
   - Review login attempts
   - Note any unusual access patterns

4. **Test All Functionality**
   - Login/logout flow
   - Session refresh
   - Role-based access
   - API authentication

### Production Deployment Checklist

- [ ] All passwords changed from defaults
- [ ] MFA enabled for all admins
- [ ] Password policy configured
- [ ] Account lockout enabled
- [ ] Audit logging active
- [ ] SSL/HTTPS enforced
- [ ] Session timeout configured
- [ ] Password complexity requirements set
- [ ] User registration disabled (if not needed)
- [ ] Service role key secured/rotated

---

## Part 7: Prevention

### Best Practices

1. **Never use pre-computed hashes in SQL**
   - Always use Supabase Admin API
   - Let Supabase handle hashing
   - Test password resets in dev first

2. **Use environment variables for secrets**
   - Never commit credentials to git
   - Use `.env.local` for local dev
   - Use Vercel/Netlify env vars for prod

3. **Implement proper password policies**
   - Minimum length: 12 characters
   - Require complexity
   - Expiration: 90 days
   - No password reuse

4. **Monitor authentication**
   - Track failed login attempts
   - Alert on suspicious patterns
   - Review logs regularly
   - Use intrusion detection

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Passwords | Test credentials | Strong, unique |
| MFA | Optional | Required for admins |
| Session timeout | Long (1 day) | Short (1 hour) |
| Password reset | Admin can reset | User self-service |
| Account lockout | Disabled | After 5 failures |

---

## Part 8: Scripts Reference

### Available Scripts

```bash
# Reset all passwords (requires service role key)
npm run auth:reset

# Reset passwords interactively
npm run auth:reset:interactive

# Verify login works
npm run auth:reset:verify

# Diagnose authentication issues
npm run auth:diagnose
```

### Script Files

| File | Purpose |
|------|---------|
| `scripts/fix-auth-credentials.js` | Node.js reset (no build) |
| `scripts/fix-auth-login.ts` | TypeScript with service role |
| `scripts/reset-passwords-interactive.ts` | Interactive CLI |
| `scripts/reset-passwords-supabase-api.ts` | Direct API usage |
| `scripts/verify-password-reset.js` | Login verification |

### Database Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20250109200000_password_reset_fix.sql` | Helper view |
| `supabase/migrations/20260109210000_diagnose_auth_issue.sql` | Diagnostics |
| `supabase/migrations/20260109220000_fix_auth_login_issue.sql` | SQL fix attempt |

---

## Part 9: Getting Help

### Documentation

- **Full Fix Guide:** `docs/AUTH_400_ERROR_FIX.md`
- **Implementation Status:** `PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md`
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth

### Support Resources

- **Supabase Dashboard:** https://app.supabase.com/project/epuhjrdqotyrryvkjnrp
- **Supabase Status:** https://status.supabase.com
- **Supabase Discord:** https://discord.gg/supabase

### Emergency Contacts

If authentication completely fails:

1. Access Supabase Dashboard directly
2. Use "Reset Password" in Authentication → Users
3. Contact hosting provider if dashboard unavailable
4. Restore from backup if necessary

---

## Part 10: Success Criteria

Your password reset is successful when:

- [ ] All users can log in with new credentials
- [ ] No "Invalid credentials" errors
- [ ] Verification script passes (3/3)
- [ ] Role-based access works correctly
- [ ] Sessions persist properly
- [ ] API authentication works
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] All tests pass (if test suite exists)
- [ ] Production deployment checklist complete

---

## Summary

**Quick Steps:**

1. Go to Supabase Dashboard → Authentication → Users
2. For each user: Click → Reset Password → Enter password → Save
3. Run: `npm run auth:reset:verify`
4. Test login at application
5. Change all passwords
6. Enable MFA for admins

**Estimated Time:** 10-15 minutes

**Difficulty:** Easy

**Support:** See `docs/AUTH_400_ERROR_FIX.md` for detailed troubleshooting

---

**Last Updated:** 2026-01-09
**Status:** Ready for use
**Version:** 1.0.0
