# Test Accounts Security Audit

> **Date:** 2026-01-09
> **Status:** CRITICAL - Test accounts found in production
> **Database:** Supabase PostgreSQL
> **Tables:** auth.users, public.profiles, public.user_roles

---

## Executive Summary

During security audit, **test accounts with weak passwords** were found in the production database. These accounts use predictable email patterns and simple passwords, posing a **CRITICAL security risk**.

### Risk Level: CRITICAL

- **Test domain:** `@test.haldeki.com` and `@test.haldeki.local`
- **Test password:** `Test1234!` or `DevTest1234!`
- **Total test accounts:** ~11-15 accounts across all roles
- **Admin access:** 2 superadmin/admin accounts with weak passwords

---

## Known Test Accounts

### 1. Superadmin Account

| Field | Value |
|-------|-------|
| **Email** | `superadmin@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `superadmin` |
| **Name** | Süper Yönetici |
| **Phone** | 0532 100 00 01 |
| **Risk** | **CRITICAL** - Full system access |

### 2. Admin Account

| Field | Value |
|-------|-------|
| **Email** | `admin@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `admin` |
| **Name** | Sistem Yöneticisi |
| **Phone** | 0532 100 00 02 |
| **Risk** | **HIGH** - Admin panel access |

### 3. Dealer Accounts

#### 3.1 Approved Dealer

| Field | Value |
|-------|-------|
| **Email** | `dealer-approved@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `dealer` |
| **Name** | Mehmet Yılmaz |
| **Company** | İzmir Yaş Sebze Ticaret |
| **Status** | Approved |
| **Risk** | **MEDIUM** - Business data access |

#### 3.2 Pending Dealer

| Field | Value |
|-------|-------|
| **Email** | `dealer-pending@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `dealer` |
| **Name** | Ayşe Demir |
| **Company** | Ege Gıda Pazarlama |
| **Status** | Pending |
| **Risk** | **LOW** - Limited access |

### 4. Supplier Accounts

#### 4.1 Approved Supplier

| Field | Value |
|-------|-------|
| **Email** | `supplier-approved@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `supplier` |
| **Name** | Ali Kaya |
| **Company** | Toroslu Çiftliği |
| **Status** | Approved |
| **Risk** | **MEDIUM** - Product data access |

#### 4.2 Pending Supplier

| Field | Value |
|-------|-------|
| **Email** | `supplier-pending@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `supplier` |
| **Name** | Zeynep Arslan |
| **Company** | Marmara Tarım Ürünleri |
| **Status** | Pending |
| **Risk** | **LOW** - Limited access |

### 5. Business Accounts

#### 5.1 Approved Business

| Field | Value |
|-------|-------|
| **Email** | `business-approved@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `business` |
| **Name** | Can Öztürk |
| **Company** | Lezzet Durağı Restoran |
| **Status** | Approved |
| **Risk** | **MEDIUM** - B2B pricing access |

#### 5.2 Pending Business

| Field | Value |
|-------|-------|
| **Email** | `business-pending@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `business` |
| **Name** | Elif Şahin |
| **Company** | Güneş Kafe & Pastane |
| **Status** | Pending |
| **Risk** | **LOW** - Limited access |

### 6. Customer Accounts

#### 6.1 Customer 1

| Field | Value |
|-------|-------|
| **Email** | `customer1@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `user` |
| **Name** | Fatma Yıldız |
| **Phone** | 0535 500 00 01 |
| **Risk** | **LOW** - Standard user |

#### 6.2 Customer 2

| Field | Value |
|-------|-------|
| **Email** | `customer2@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `user` |
| **Name** | Hasan Çelik |
| **Phone** | 0535 500 00 02 |
| **Risk** | **LOW** - Standard user |

### 7. Warehouse Staff Account

| Field | Value |
|-------|-------|
| **Email** | `warehouse@test.haldeki.com` |
| **Password** | `Test1234!` |
| **Role** | `warehouse_staff` |
| **Risk** | **MEDIUM** - Inventory operations |

### 8. Local Development Accounts

Additional test accounts for local development (`@test.haldeki.local`):

| Email | Role | Password |
|-------|------|----------|
| `admin-test@haldeki.local` | superadmin | `DevTest1234!` |
| `dealer-test@haldeki.local` | dealer | `DevTest1234!` |
| `supplier-test@haldeki.local` | supplier | `DevTest1234!` |
| `business-test@haldeki.local` | business | `DevTest1234!` |

---

## SQL Audit Queries

### Find All Test Users

```sql
SELECT
  au.id as user_id,
  au.email,
  p.full_name,
  array_agg(ur.role) as roles,
  au.created_at,
  au.last_sign_in_at,
  CASE
    WHEN au.email LIKE '%@test.haldeki.com' THEN 'Production Test'
    WHEN au.email LIKE '%@test.haldeki.local' THEN 'Local Test'
    ELSE 'Other Test Pattern'
  END as test_type
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE
  au.email LIKE '%@test.haldeki.com'
  OR au.email LIKE '%@test.haldeki.local'
GROUP BY
  au.id, au.email, p.full_name, au.created_at, au.last_sign_in_at
ORDER BY au.created_at;
```

### Check Password Hashes (Admin Only)

```sql
-- Check for weak password indicators
-- Note: Passwords are bcrypt hashed, we can only check metadata
SELECT
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at,
  CASE
    WHEN email_confirmed_at IS NULL THEN 'UNCONFIRMED - High Risk'
    WHEN last_sign_in_at IS NULL THEN 'NEVER USED - High Risk'
    ELSE 'Active'
  END as status
FROM auth.users
WHERE email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local';
```

---

## Security Recommendations

### Immediate Actions (Before Beta Launch)

#### 1. Delete ALL Test Accounts (Recommended)

```sql
-- Delete in this order to respect foreign key constraints

-- Step 1: Delete from profiles
DELETE FROM public.profiles
WHERE email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local';

-- Step 2: Delete from user_roles
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
);

-- Step 3: Delete from dealers
DELETE FROM public.dealers
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
);

-- Step 4: Delete from suppliers
DELETE FROM public.suppliers
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
);

-- Step 5: Delete from businesses
DELETE FROM public.businesses
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
);

-- Step 6: Delete from warehouse_staff
DELETE FROM public.warehouse_staff
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
);

-- Step 7: Delete from auth.users (Last)
DELETE FROM auth.users
WHERE email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local';
```

#### 2. Alternative: Change Passwords (If accounts needed)

If you need to keep some test accounts for beta testing:

```sql
-- Option A: Via Supabase Dashboard (Recommended)
-- 1. Go to Authentication > Users
-- 2. Find each test account
-- 3. Click "Reset Password" and set a STRONG password

-- Option B: Via SQL (requires service role key)
-- UPDATE auth.users
-- SET encrypted_password = crypt('NEW_STRONG_PASSWORD', gen_salt('bf'))
-- WHERE email = 'test@example.com';
```

#### 3. Implement Test Account Detection

Add database policies to prevent test accounts in production:

```sql
-- Policy to block test account creation
CREATE POLICY prevent_test_accounts
ON auth.users
FOR INSERT
WITH CHECK (
  email NOT LIKE '%@test.haldeki.com'
  AND email NOT LIKE '%@test.haldeki.local'
  AND email NOT LIKE '%test@example%'
);
```

---

## Beta Preparation Checklist

### Before Beta Launch

- [ ] **Audit all test accounts** using the SQL queries above
- [ ] **Delete all test accounts** OR change passwords to strong values
- [ ] **Create admin accounts** with strong, unique passwords
- [ ] **Document beta test accounts** separately (not in this file)
- [ ] **Enable email verification** for all new accounts
- [ ] **Implement rate limiting** on login endpoints
- [ ] **Set up monitoring** for suspicious login attempts
- [ ] **Review RLS policies** to ensure proper data isolation

### Production Environment

- [ ] **No @test.haldeki.com accounts** in production
- [ ] **No @test.haldeki.local accounts** in production
- [ ] **No weak passwords** (use password strength requirements)
- [ ] **All admin accounts** use 2FA
- [ ] **Regular security audits** scheduled
- [ ] **Test account detection** in place

---

## Monitoring & Detection

### Dashboard Queries

Add to Supabase Dashboard for regular monitoring:

```sql
-- Daily check for test accounts
SELECT COUNT(*) as test_account_count
FROM auth.users
WHERE email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local';
```

### Application Code Check

Add to your authentication logic:

```typescript
// Block test accounts in production
const TEST_DOMAINS = ['@test.haldeki.com', '@test.haldeki.local'];

function isTestAccount(email: string): boolean {
  return TEST_DOMAINS.some(domain => email.endsWith(domain));
}

// In login handler
if (import.meta.env.PROD && isTestAccount(email)) {
  throw new Error('Test accounts are not allowed in production');
}
```

---

## References

- **Audit Script:** `F:\donusum\haldeki-love\haldeki-market\scripts\audit-test-accounts.sql`
- **Test Accounts Doc:** `F:\donusum\haldeki-love\haldeki-market\docs\development\TEST_ACCOUNTS.md`
- **Migration:** `F:\donusum\haldeki-love\haldeki-market\supabase\migrations\20250104200000_comprehensive_test_accounts.sql`
- **Security Audit:** `F:\donusum\haldeki-love\haldeki-market\docs\SECURITY_AUDIT_2026-01-09.md`

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Test Accounts** | ~11-15 |
| **Admin Level Accounts** | 2 (CRITICAL) |
| **Business Accounts** | 6 |
| **Customer Accounts** | 2-4 |
| **Weak Passwords** | All (Test1234! / DevTest1234!) |
| **Risk Level** | CRITICAL |

**Action Required:** Delete all test accounts before beta launch.

---

*Generated: 2026-01-09*
*Database Architect: Claude Code*
