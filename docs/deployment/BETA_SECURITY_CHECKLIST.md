# Beta Launch Security Checklist

> **Date:** 2026-01-09
> **Purpose:** Ensure production environment is secure before beta launch
> **Priority:** CRITICAL

---

## Pre-Launch Security Audit

### 1. Test Accounts Cleanup

**Status:** REQUIRED BEFORE LAUNCH

**Test Domains to Remove:**
- `@test.haldeki.com` - Production test accounts
- `@test.haldeki.local` - Local development accounts
- `test@example.com` - Generic test accounts

**Estimated Test Accounts:** ~11-15

**Roles Affected:**
- 2x Admin/Superadmin (CRITICAL)
- 2x Dealers
- 2x Suppliers
- 2x Businesses
- 2x Customers
- 1x Warehouse Staff

**Action Required:**

```bash
# Step 1: Audit current state
psql -f scripts/audit-test-accounts.sql

# Step 2: Review output carefully
# Check the markdown report: docs/security/TEST_ACCOUNTS_AUDIT.md

# Step 3: Run cleanup (if confirmed)
psql -f scripts/cleanup-test-accounts-production.sql
```

**Verification:**

```sql
-- Confirm no test accounts remain
SELECT COUNT(*) FROM auth.users
WHERE email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local';
-- Expected: 0
```

---

### 2. Admin Account Setup

**Status:** REQUIRED

Create proper admin accounts with strong credentials:

| Requirement | Specification |
|-------------|----------------|
| **Count** | 1-2 admin accounts |
| **Email** | Personal/organizational email (not test domain) |
| **Password** | Min 16 chars, mixed case, numbers, symbols |
| **2FA** | Enabled via Supabase Auth |
| **Email Verification** | Required |

**Setup Steps:**

1. Create admin via Supabase Dashboard
2. Set strong password
3. Enable email confirmation
4. Assign `superadmin` role in `user_roles` table
5. Test login and permissions

---

### 3. Password Policy

**Status:** RECOMMENDED

Implement password requirements:

```typescript
// Add to registration/login validation
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  blockCommonPatterns: true, // No "password123", etc.
};
```

**Database Constraints:**

```sql
-- Add check constraint for password strength (application enforced)
-- PostgreSQL doesn't have built-in password validation for bcrypt
-- Implement in application layer
```

---

### 4. Email Verification

**Status:** REQUIRED

Ensure all accounts require email verification:

```sql
-- Check current unverified accounts
SELECT email, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL;
```

**Supabase Settings:**
- Enable email confirmation in Auth settings
- Set email template with verification link
- Block unverified users from sensitive operations

---

### 5. Rate Limiting

**Status:** REQUIRED

Implement rate limiting on auth endpoints:

```typescript
// Supabase Auth has built-in rate limiting
// Configure in Supabase Dashboard:

// Settings > Auth > Rate Limits
- Max sign-in attempts: 5 per 15 minutes
- Max sign-up attempts: 3 per hour
- Max password reset requests: 3 per hour
```

---

### 6. Security Monitoring

**Status:** RECOMMENDED

Set up monitoring for suspicious activity:

```sql
-- Create audit log table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);
```

**Events to Log:**
- Failed login attempts
- Successful admin logins
- Permission escalations
- Bulk data exports
- Role changes

---

### 7. RLS Policy Review

**Status:** REQUIRED

Verify Row Level Security policies:

```sql
-- Check all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Critical Tables to Check:**
- `profiles` - User can only see own profile
- `user_roles` - Only admins can modify
- `dealers` - Dealers see only their data
- `suppliers` - Suppliers see only their data
- `businesses` - Businesses see only their data
- `orders` - Role-based access control

---

### 8. API Key Security

**Status:** CRITICAL

Rotate and secure API keys:

```bash
# Check for exposed keys
grep -r "SUPABASE_ANON_KEY\|SUPABASE_SERVICE_ROLE_KEY" src/
grep -r "eyJ" src/  # JWT tokens

# Ensure service_role key is NEVER in client code
# Service role key bypasses RLS!
```

**Environment Variables:**
```bash
# .env.production (NEVER commit)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-only

# Service role key only on server:
# SUPABASE_SERVICE_ROLE_KEY=never-in-client-code
```

---

### 9. Database Access Control

**Status:** REQUIRED

Review database access permissions:

```sql
-- Check for excessive privileges
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee NOT IN ('postgres', 'postgres')
ORDER BY grantee, table_name;
```

**Best Practices:**
- Use `authenticated` role for logged-in users
- Use `anon` role for public access
- Use service role ONLY for admin operations
- Never expose service role to client

---

### 10. Backup & Recovery

**Status:** REQUIRED

Verify backup strategy:

```bash
# Supabase backups are automatic
# Verify retention settings:

# Via Supabase Dashboard:
# Settings > Database > Backups
# - Daily backups enabled: Yes
# - Retention period: 7+ days
# - Point-in-time recovery: Enabled
```

**Manual Backup Before Launch:**

```bash
# Export all data
pg_dump -F c -f pre-beta-backup.dump "$DATABASE_URL"

# Export schema only
pg_dump -s -f pre-beta-schema.sql "$DATABASE_URL"
```

---

## Launch Day Verification

### Final Checklist

Run these commands on launch day:

```sql
-- 1. Confirm no test accounts
SELECT COUNT(*) as test_accounts FROM auth.users
WHERE email LIKE '%@test.haldeki.com' OR email LIKE '%@test.haldeki.local';
-- Expected: 0

-- 2. Verify admin accounts exist
SELECT email, array_agg(role) as roles
FROM auth.users au
JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.role IN ('admin', 'superadmin')
GROUP BY email;
-- Expected: Your admin email(s)

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
-- Expected: (empty result)

-- 4. Verify email verification required
-- Check Supabase Dashboard > Auth > Settings
-- Expected: "Enable email confirmations" = ON

-- 5. Test login with admin account
-- Expected: Successful login
```

---

## Post-Launch Monitoring

### Daily Checks (First Week)

- [ ] Review failed login attempts
- [ ] Check for new test accounts
- [ ] Monitor error rates
- [ ] Verify backup completion

### Weekly Checks

- [ ] Security audit log review
- [ ] User access review
- [ ] Performance metrics
- [ ] Database size monitoring

### Monthly Reviews

- [ ] Full security audit
- [ ] Access control review
- [ ] Backup test restoration
- [ ] Policy updates

---

## Emergency Procedures

### If Test Accounts Found in Production

```bash
# Immediate action
psql -f scripts/cleanup-test-accounts-production.sql

# Review backup table
SELECT * FROM public.deleted_test_accounts_backup;

# If legitimate accounts were deleted, restore them manually
```

### If Security Breach Suspected

1. **Immediately:**
   - Rotate all API keys
   - Change admin passwords
   - Enable additional rate limiting

2. **Investigation:**
   - Review audit logs
   - Check for unauthorized access
   - Identify affected data

3. **Recovery:**
   - Restore from backup if needed
   - Patch vulnerabilities
   - Notify users if data exposed

---

## Documentation

**Created Files:**

| File | Purpose |
|------|---------|
| `scripts/audit-test-accounts.sql` | Query all test accounts |
| `scripts/cleanup-test-accounts-production.sql` | Delete test accounts safely |
| `docs/security/TEST_ACCOUNTS_AUDIT.md` | Complete audit documentation |
| `docs/deployment/BETA_SECURITY_CHECKLIST.md` | This file |

**References:**

- `docs/development/TEST_ACCOUNTS.md` - Development test accounts
- `docs/SECURITY_AUDIT_2026-01-09.md` - Original security audit
- `supabase/migrations/20250104200000_comprehensive_test_accounts.sql` - Test account creation

---

## Sign-Off

**Before launching to beta:**

- [ ] All test accounts deleted from production
- [ ] Admin accounts created with strong passwords
- [ ] Email verification enabled
- [ ] Rate limiting configured
- [ ] RLS policies verified
- [ ] API keys secured
- [ ] Backups verified
- [ ] Monitoring setup
- [ ] Team trained on security procedures

**Launch Authorization:**

- [ ] Security Lead: ____________________ Date: _______
- [ ] Tech Lead: _________________________ Date: _______
- [ ] Product Owner: _____________________ Date: _______

---

*Generated: 2026-01-09*
*Database Architect: Claude Code*
