# Test Accounts Documentation

> **SECURITY ALERT** - This document contains sensitive test credentials
> **NOT FOR PRODUCTION** - These accounts must be removed or secured before beta launch
> **Last Updated**: 2026-01-09
> **Status**: ACTION REQUIRED

---

## Table of Contents

1. [Security Warning](#security-warning)
2. [Test Accounts Inventory](#test-accounts-inventory)
3. [Account Usage Guide](#account-usage-guide)
4. [Beta Launch Checklist](#beta-launch-checklist)
5. [Secure Password Storage](#secure-password-storage)
6. [Post-Beta Cleanup](#post-beta-cleanup)
7. [Audit SQL Queries](#audit-sql-queries)

---

## Security Warning

### CRITICAL SECURITY ISSUES DETECTED

**Risk Level**: 🔴 CRITICAL
**Impact**: Full system compromise, data breach, privilege escalation
**Action Required**: Immediate

### Current Vulnerabilities

1. **Weak Passwords**: All test accounts use simple passwords (test123, Test1234!)
2. **Hardcoded Credentials**: Test emails and passwords in source code
3. **XOR Encryption**: Passwords encrypted with reversible XOR (not real encryption)
4. **RoleSwitcher Exposure**: Dev tool accessible in production builds
5. **No Rate Limiting**: Brute-force attacks possible on test accounts

### Security Risk Matrix

| Account Type | Risk Level | Impact | Priority |
|--------------|------------|--------|----------|
| Superadmin | 🔴 CRITICAL | Full system access | Immediate |
| Admin | 🔴 CRITICAL | Data manipulation | Immediate |
| Supplier | 🟠 HIGH | Business logic bypass | 24h |
| Customer | 🟡 MEDIUM | PII exposure | 48h |

### .gitignore Configuration

**Add to `.gitignore` immediately:**

```gitignore
# Test credentials
docs/TEST_ACCOUNTS.md
.env.test
*.test.credentials.json

# Dev tools with hardcoded credentials
src/components/dev/RoleSwitcher.tsx
```

---

## Test Accounts Inventory

### Account Summary

| Role | Count | Password Strength | Status |
|------|-------|-------------------|--------|
| Superadmin | 1 | 🔴 Weak | Active |
| Admin | 2 | 🔴 Weak | Active |
| Supplier | 6-8 | 🔴 Weak | Active |
| Customer | 2-4 | 🔴 Weak | Active |
| **TOTAL** | **11-15** | **100% Weak** | **Active** |

### Detailed Account List

#### 1. Superadmin Account

| Field | Value |
|-------|-------|
| **Email** | `superadmin@haldeki.com` |
| **Password** | `test123` |
| **UUID** | `00000000-0000-0000-0000-000000000000` (placeholder) |
| **Role** | superadmin |
| **Created** | 2025-01-10 |
| **Last Login** | [Check database] |
| **Status** | 🔴 CRITICAL RISK |
| **Permissions** | Full system access, user management, all operations |

**Use Case**: Development testing of admin features, user management

**Security Issues**:
- Password: Only 6 characters, all lowercase, dictionary word
- No MFA enabled
- Account lockout not configured
- Password encrypted with XOR (reversible)

**Action Required**:
- [ ] Change password to strong 16+ character random string
- [ ] Enable MFA (TOTP or hardware key)
- [ ] Configure account lockout after 3 failed attempts
- [ ] Add IP whitelist for admin access
- [ ] Enable audit logging for all actions

---

#### 2. Admin Accounts

##### Admin 1 - Business Admin

| Field | Value |
|-------|-------|
| **Email** | `admin@haldeki.com` |
| **Password** | `Test1234!` |
| **UUID** | [Query from database] |
| **Role** | admin |
| **Created** | 2025-01-10 |
| **Status** | 🔴 HIGH RISK |
| **Permissions** | Product management, order management, supplier approval |

**Use Case**: Business operations testing

**Security Issues**:
- Password: 8 characters (barely meets minimum)
- Pattern-based (Test + numbers + special char)
- No account lockout
- No IP restriction

**Action Required**:
- [ ] Change password to 16+ character random string
- [ ] Enable MFA
- [ ] Implement IP whitelist
- [ ] Add session timeout (15 minutes)

##### Admin 2 - Content Admin

| Field | Value |
|-------|-------|
| **Email** | `content@haldeki.com` |
| **Password** | `test123` |
| **UUID** | [Query from database] |
| **Role** | admin |
| **Created** | 2025-01-10 |
| **Status** | 🔴 HIGH RISK |
| **Permissions** | Content management, product catalog |

**Use Case**: Content management testing

**Action Required**:
- [ ] See Admin 1 requirements

---

#### 3. Supplier Accounts

##### Supplier 1 - Main Supplier

| Field | Value |
|-------|-------|
| **Email** | `supplier1@haldeki.com` |
| **Password** | `test123` |
| **UUID** | [Query from database] |
| **Role** | supplier |
| **Company** | Test Supplier A |
| **Status** | 🟠 MEDIUM RISK |
| **Permissions** | Product management, order fulfillment |

**Use Case**: Supplier portal testing, product import/export

**Action Required**:
- [ ] Change password to 12+ character random string
- [ ] Enable MFA (recommended for suppliers)

##### Supplier 2-6

| Email | Password | Company | Status |
|-------|----------|---------|--------|
| `supplier2@haldeki.com` | `test123` | Test Supplier B | 🟠 MEDIUM |
| `supplier3@haldeki.com` | `test123` | Test Supplier C | 🟠 MEDIUM |
| `supplier4@haldeki.com` | `test123` | Test Supplier D | 🟠 MEDIUM |
| `supplier5@haldeki.com` | `test123` | Test Supplier E | 🟠 MEDIUM |
| `supplier6@haldeki.com` | `test123` | Test Supplier F | 🟠 MEDIUM |

**Use Case**: Multi-supplier testing, competition scenarios

**Action Required**:
- [ ] Change all passwords to unique 12+ character random strings
- [ ] Document which supplier is which for testing
- [ ] Consider creating supplier-specific test scenarios

---

#### 4. Customer Accounts

##### Customer 1 - Regular Customer

| Field | Value |
|-------|-------|
| **Email** | `customer@example.com` |
| **Password** | `test123` |
| **UUID** | [Query from database] |
| **Role** | customer |
| **Status** | 🟡 LOW-MEDIUM RISK |
| **Permissions** | Browse, cart, checkout, order history |

**Use Case**: Standard customer journey testing

**Action Required**:
- [ ] Change password to 10+ character random string
- [ ] Implement account lockout

##### Customer 2 - Premium Customer

| Field | Value |
|-------|-------|
| **Email** | `premium@example.com` |
| **Password** | `test123` |
| **UUID** | [Query from database] |
| **Role** | customer |
| **Status** | 🟡 LOW-MEDIUM RISK |
| **Permissions** | Standard customer + premium features |

**Use Case**: Premium features testing

**Action Required**:
- [ ] See Customer 1 requirements

---

### Additional Test Accounts (May Exist)

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `test@haldeki.com` | `test123` | ? | General testing |
| `demo@haldeki.com` | `test123` | ? | Demo accounts |
| `api-test@haldeki.com` | `test123` | ? | API testing |

**Action Required**:
- [ ] Audit database for all test accounts
- [ ] Document any additional accounts found
- [ ] Delete unused accounts

---

## Account Usage Guide

### When to Use Each Account

#### Development Phase (Current)

| Account | Purpose | Frequency |
|---------|---------|-----------|
| Superadmin | Admin panel development, user management | Daily |
| Admin | Business operations testing | Daily |
| Supplier | Supplier portal testing | Weekly |
| Customer | User journey testing | Weekly |

#### Beta Phase (Upcoming)

| Account | Purpose | Action |
|---------|---------|--------|
| Superadmin | Beta monitoring, user support | **SECURE** - Change password |
| Admin | Beta operations, content moderation | **SECURE** - Change password |
| Supplier | Beta supplier onboarding | **DELETE** - Create real supplier accounts |
| Customer | **DO NOT USE** | **DELETE** - Real customers will sign up |

#### Production Phase (Post-Launch)

| Account | Purpose | Action |
|---------|---------|--------|
| All test accounts | **NOT FOR PRODUCTION** | **DELETE ALL** |

### Testing Scenarios

#### Scenario 1: User Management
```
Account: superadmin@haldeki.com
Purpose: Test user creation, role changes, bans
Steps:
1. Login as superadmin
2. Navigate to Users page
3. Create test user
4. Change user role
5. Ban/unban user
6. Delete test user
```

#### Scenario 2: Supplier Onboarding
```
Account: supplier1@haldeki.com
Purpose: Test supplier registration, product import
Steps:
1. Login as supplier
2. Register company details
3. Import product catalog
4. Set pricing
5. Receive test order
6. Update order status
```

#### Scenario 3: Customer Journey
```
Account: customer@example.com
Purpose: Test full purchase flow
Steps:
1. Browse products
2. Add to cart
3. Checkout
4. Payment (test mode)
5. View order
6. Request refund
```

---

## Beta Launch Checklist

### Pre-Launch Actions (Required)

#### Password Security

- [ ] **Change all superadmin passwords** to 16+ character random strings
- [ ] **Change all admin passwords** to 16+ character random strings
- [ ] **Change all supplier passwords** to 12+ character random strings
- [ ] **Implement bcrypt hashing** (replace XOR encryption)
- [ ] **Enable MFA** for all admin accounts
- [ ] **Configure account lockout** (3 attempts, 15-minute timeout)

#### Access Control

- [ ] **Remove RoleSwitcher from production builds**
- [ ] **Implement IP whitelisting** for admin access
- [ ] **Configure session timeouts** (15 minutes for admins)
- [ ] **Enable audit logging** for all admin actions
- [ ] **Test RLS policies** for all user roles

#### Test Account Decision

**Option A: Keep Test Accounts (Not Recommended)**
- [ ] Change all passwords to strong random strings
- [ ] Store passwords in secure vault (NOT in code)
- [ ] Add "TEST" prefix to all test emails
- [ ] Implement test account IP restrictions
- [ ] Disable test accounts after beta
- **Risk**: Test accounts could be compromised

**Option B: Delete Test Accounts (Recommended)**
- [ ] Delete all customer test accounts
- [ ] Delete all supplier test accounts
- [ ] Keep only 1 admin account for beta monitoring
- [ ] Create new admin account with strong password
- [ ] Document admin credentials in secure vault
- **Risk**: Need to recreate accounts for testing

**Option C: Separate Environment (Best Practice)**
- [ ] Keep test accounts in development/staging only
- [ ] Use separate database for production
- [ ] No test accounts in production database
- [ ] Create new admin account for production
- [ ] Use environment-specific configuration
- **Risk**: Requires infrastructure setup

#### Code Cleanup

- [ ] **Remove hardcoded credentials** from source code
- [ ] **Remove RoleSwitcher component** from production
- [ ] **Add .gitignore rules** for test credentials
- [ ] **Rotate all API keys** used in development
- [ ] **Audit environment variables** for secrets

### Launch Day Verification

- [ ] **Verify no test accounts in production database**
- [ ] **Scan production build for hardcoded passwords**
- [ ] **Test admin login with new secure password**
- [ ] **Verify MFA is working**
- [ ] **Test account lockout (3 failed logins)**
- [ ] **Verify RLS policies prevent cross-user access**
- [ ] **Check audit logs are recording**

### Post-Launch Monitoring

- [ ] **Monitor for failed login attempts** (alert on 5+ failures)
- [ ] **Review audit logs daily** for first week
- [ ] **Check for suspicious admin actions**
- [ ] **Verify no test accounts exist** in production
- [ ] **Test password reset flow** with real users

---

## Secure Password Storage

### Current Issues

```typescript
// ❌ CURRENT: XOR "encryption" (not secure)
function encryptPassword(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}
```

**Problems**:
- XOR is encoding, not encryption
- Easily reversible by attackers
- Key is hardcoded in source
- No salt or IV (cryptographically weak)

### Recommended Solution

#### Option 1: One-Way Hashing (Best for Auth)

```typescript
// ✅ Use bcrypt for authentication
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12); // 12 rounds = secure
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Usage
const hashedPassword = await hashPassword('test123');
// Result: $2a$12$abcdefghijklmnopqrstuvwxyz...

// Verification
const isValid = await verifyPassword('test123', hashedPassword);
// Result: true or false
```

**Advantages**:
- One-way hash (cannot decrypt even if database is stolen)
- Built-in salt (prevents rainbow table attacks)
- Industry standard (used by Laravel, WordPress, etc.)
- No key management needed

**Migration Steps**:
```sql
-- Step 1: Add new column for hashed passwords
ALTER TABLE auth.users ADD COLUMN password_hash_bcrypt TEXT;

-- Step 2: Reset all user passwords and send email reset links
-- (Cannot recover original passwords from XOR)

-- Step 3: Update auth to use bcrypt
-- Step 4: Remove old password column after verification
```

#### Option 2: Secure Encryption (If Password Retrieval Needed)

```typescript
// ✅ Use AES-256-GCM for reversible encryption
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

// Derive key from password
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

// Encrypt password
export function encryptPassword(plaintext: string, encryptionKey: string): {
  encrypted: string;
  iv: string;
  salt: string;
  tag: string;
} {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(encryptionKey, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex')
  };
}

// Decrypt password
export function decryptPassword(
  encryptedData: { encrypted: string; iv: string; salt: string; tag: string },
  encryptionKey: string
): string {
  const key = deriveKey(encryptionKey, Buffer.from(encryptedData.salt, 'hex'));
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Usage**:
```typescript
// In .env file (never commit this!)
ENCRYPTION_KEY=random-32-character-hex-string-from-secure-generator

// Encrypt
const encrypted = encryptPassword('test123', process.env.ENCRYPTION_KEY!);

// Store in database as JSON
{
  "encrypted": "a1b2c3...",
  "iv": "d4e5f6...",
  "salt": "7890ab...",
  "tag": "cdef12..."
}

// Decrypt
const decrypted = decryptPassword(encrypted, process.env.ENCRYPTION_KEY!);
```

**Advantages**:
- AES-256-GCM is US government approved
- Authenticated encryption (detects tampering)
- Unique salt for each password
- Industry standard

**Disadvantages**:
- Requires secure key management
- If key is lost, passwords are unrecoverable
- More complex than hashing

### Secure Storage Best Practices

#### Password Generation

```typescript
// Generate secure random passwords
import crypto from 'crypto';

export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomBytes = crypto.randomBytes(length);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

// Usage
const adminPassword = generateSecurePassword(16);
// Example: "aB3$xY9@kL2&mN7pQ"
```

#### Environment Variables

```bash
# .env.production (NEVER commit this file)
SUPERADMIN_PASSWORD=generated-16-char-random-string
ADMIN_PASSWORD=generated-16-char-random-string
ENCRYPTION_KEY=generated-64-char-hex-string
```

#### Password Storage in Development

```typescript
// Store in password manager, not code
// 1password, LastPass, Bitwarden, etc.

// For team sharing, use secure secrets manager:
// - AWS Secrets Manager
// - HashiCorp Vault
// - Azure Key Vault
// - Google Secret Manager
```

---

## Post-Beta Cleanup

### Immediate Actions (Day 1 After Launch)

#### Delete Test Accounts

```sql
-- Delete all test customer accounts
DELETE FROM auth.users
WHERE email IN (
  'customer@example.com',
  'premium@example.com',
  'test@haldeki.com',
  'demo@haldeki.com'
);

-- Delete all test supplier accounts
DELETE FROM auth.users
WHERE email LIKE 'supplier%@haldeki.com'
  AND email IN (
    'supplier1@haldeki.com',
    'supplier2@haldeki.com',
    'supplier3@haldeki.com',
    'supplier4@haldeki.com',
    'supplier5@haldeki.com',
    'supplier6@haldeki.com'
  );

-- Delete test orders
DELETE FROM public.orders
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@example.com'
    OR email LIKE 'test%@haldeki.com'
);

-- Delete test products
DELETE FROM public.supplier_products
WHERE supplier_id IN (
  SELECT id FROM public.suppliers
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE email LIKE 'supplier%@haldeki.com'
  )
);

-- Verify deletion
SELECT email, created_at
FROM auth.users
WHERE email LIKE '%@example.com'
   OR email LIKE 'test%@haldeki.com'
   OR email LIKE 'demo%@haldeki.com';
-- Should return 0 rows
```

#### Rotate Admin Credentials

```sql
-- Option 1: Delete test admin, create new one
DELETE FROM auth.users WHERE email = 'admin@haldeki.com';
DELETE FROM auth.users WHERE email = 'content@haldeki.com';

-- Create new admin via Supabase dashboard or signup
-- Then assign role:
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'new-admin@haldeki.com');

-- Option 2: Change password via Supabase dashboard
-- 1. Go to Supabase dashboard
-- 2. Navigate to Authentication > Users
-- 3. Select admin user
-- 4. Click "Reset Password"
-- 5. Set strong random password
-- 6. Force password change on next login
```

#### Remove Development Code

```bash
# Remove RoleSwitcher from production
rm src/components/dev/RoleSwitcher.tsx
rm src/components/dev/RoleSwitcher.dev.tsx

# Remove from App.tsx
# Delete these lines:
# import { RoleSwitcher } from '@/components/dev/RoleSwitcher';
# <RoleSwitcher />

# Verify removal
grep -r "RoleSwitcher" src/
# Should return 0 results

# Remove from build
grep -r "test123" dist/
# Should return 0 results
```

### Week 1 Actions

#### Audit Database for Test Data

```sql
-- Find all users with weak passwords (if stored)
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%test%'
   OR email LIKE '%example%'
   OR email LIKE '%demo%'
   OR email LIKE '%@haldeki.com'
ORDER BY created_at;

-- Find all orders from test accounts
SELECT o.id, o.user_id, u.email, o.total_amount, o.created_at
FROM public.orders o
JOIN auth.users u ON u.id = o.user_id
WHERE u.email LIKE '%test%'
   OR u.email LIKE '%example%'
   OR u.email LIKE '%demo%';

-- Find all products from test suppliers
SELECT sp.id, s.name as supplier, p.name as product, sp.price
FROM public.supplier_products sp
JOIN public.suppliers s ON s.id = sp.supplier_id
JOIN public.products p ON p.id = sp.product_id
JOIN auth.users u ON u.id = s.user_id
WHERE u.email LIKE 'supplier%@haldeki.com';
```

#### Clean Up Test Data

```sql
-- Delete test products and their variations
WITH test_products AS (
  SELECT p.id
  FROM public.products p
  JOIN public.supplier_products sp ON sp.product_id = p.id
  JOIN public.suppliers s ON s.id = sp.supplier_id
  JOIN auth.users u ON u.id = s.user_id
  WHERE u.email LIKE 'supplier%@haldeki.com'
)
DELETE FROM public.product_variations
WHERE product_id IN (SELECT id FROM test_products);

DELETE FROM public.products
WHERE id IN (SELECT id FROM test_products);

-- Delete test suppliers
DELETE FROM public.suppliers
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE 'supplier%@haldeki.com'
);

-- Delete test user profiles
DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%test%'
     OR email LIKE '%example%'
     OR email LIKE '%demo%'
);
```

### Ongoing Monitoring

#### Automated Cleanup Script

```typescript
// scripts/cleanup-test-accounts.ts
import { createClient } from '@supabase/supabase-js';

const TEST_EMAIL_PATTERNS = [
  '%test%',
  '%example%',
  '%demo%',
  '%@haldeki.com' // Except real admin
];

const PROTECTED_EMAILS = [
  'superadmin@haldeki.com',
  'admin@haldeki.com'
];

export async function cleanupTestAccounts() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find test accounts
  const { data: testUsers, error } = await supabase
    .from('auth.users')
    .select('id, email')
    .or(TEST_EMAIL_PATTERNS.map(p => `email.like.${p}`).join(','));

  if (error) {
    console.error('Error fetching test users:', error);
    return;
  }

  // Filter out protected accounts
  const usersToDelete = testUsers.filter(
    u => !PROTECTED_EMAILS.includes(u.email)
  );

  console.log(`Found ${usersToDelete.length} test accounts to delete`);

  // Delete each user
  for (const user of usersToDelete) {
    await supabase.auth.admin.deleteUser(user.id);
    console.log(`Deleted: ${user.email}`);
  }

  console.log('Cleanup complete');
}
```

#### Monitoring Query

```sql
-- Run weekly to check for new test accounts
SELECT
  COUNT(*) as test_account_count,
  MAX(created_at) as latest_created
FROM auth.users
WHERE email LIKE '%test%'
   OR email LIKE '%example%'
   OR email LIKE '%demo%';

-- Alert if count > 0
```

---

## Audit SQL Queries

### Find All Test Accounts

```sql
-- Complete test account audit
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  p.role,
  COUNT(DISTINCT o.id) as order_count,
  COUNT(DISTINCT sp.id) as product_count
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.orders o ON o.user_id = u.id
LEFT JOIN public.supplier_products sp ON sp.supplier_id IN (
  SELECT s.id FROM public.suppliers s WHERE s.user_id = u.id
)
WHERE u.email LIKE '%test%'
   OR u.email LIKE '%example%'
   OR u.email LIKE '%demo%'
   OR u.email LIKE 'supplier%@haldeki.com'
   OR u.email LIKE 'admin%@haldeki.com'
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, p.role
ORDER BY p.role, u.created_at;
```

### Check Password Strength (If Stored)

```sql
-- Check for weak password indicators
-- Note: Only works if passwords are stored (not recommended for production)
SELECT
  email,
  LENGTH(encrypted_password::text) as password_length,
  CASE
    WHEN encrypted_password::text ~ '[0-9]' THEN 'Has number'
    ELSE 'No number'
  END as has_number,
  CASE
    WHEN encrypted_password::text ~ '[A-Z]' THEN 'Has uppercase'
    ELSE 'No uppercase'
  END as has_uppercase,
  CASE
    WHEN encrypted_password::text ~ '[a-z]' THEN 'Has lowercase'
    ELSE 'No lowercase'
  END as has_lowercase,
  CASE
    WHEN encrypted_password::text ~ '[!@#$%^&*]' THEN 'Has special'
    ELSE 'No special'
  END as has_special
FROM auth.users
WHERE email LIKE '%test%'
   OR email LIKE '%example%';
```

### Find Recently Created Test Accounts

```sql
-- Test accounts created in last 7 days
SELECT
  id,
  email,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
  AND (email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%demo%')
ORDER BY created_at DESC;
```

### Check for Hardcoded Passwords in Code

```bash
# Search for common test passwords in source code
grep -r "test123" src/ --include="*.ts" --include="*.tsx" --include="*.js"
grep -r "Test1234" src/ --include="*.ts" --include="*.tsx" --include="*.js"
grep -r "password" src/ --include="*.ts" --include="*.tsx" --include="*.js" | grep -i "test"
grep -r "haldeki" src/ --include="*.ts" --include="*.tsx" --include="*.js" | grep -i "password"

# Check for RoleSwitcher references
grep -r "RoleSwitcher" src/ --include="*.ts" --include="*.tsx"
grep -r "role-switcher" src/ --include="*.ts" --include="*.tsx"
```

### Check Production Build for Test Credentials

```bash
# After building, scan dist/ folder
grep -r "test123" dist/
grep -r "Test1234" dist/
grep -r "@haldeki.com" dist/ | grep -v "haldeki.com"
grep -r "superadmin" dist/
grep -r "RoleSwitcher" dist/

# All should return 0 results
```

### Verify RLS Policies for Test Accounts

```sql
-- Check if test accounts can access data they shouldn't
-- (Run as test user to verify RLS is working)

-- Test 1: Customer accessing admin data
SET LOCAL jwt.claims.sub = 'customer-user-id';
SELECT * FROM public.admin_products;
-- Should return 0 rows

-- Test 2: Supplier accessing competitor products
SET LOCAL jwt.claims.sub = 'supplier1-user-id';
SELECT * FROM public.supplier_products
WHERE supplier_id IN (
  SELECT id FROM public.suppliers WHERE user_id != 'supplier1-user-id'
);
-- Should return 0 rows

-- Test 3: User accessing other users' orders
SET LOCAL jwt.claims.sub = 'customer1-user-id';
SELECT * FROM public.orders WHERE user_id != 'customer1-user-id';
-- Should return 0 rows
```

---

## Quick Reference

### Emergency Contacts

| Issue | Contact | Method |
|-------|---------|--------|
| Security breach | CTO | Phone + Slack |
| Test account lockout | DevOps | Slack |
| Database cleanup | DBA | Jira ticket |
| Code removal | Lead Dev | PR review |

### Password Generator

```bash
# Generate 16-character random password
openssl rand -base64 16 | tr -d "=+/" | cut -c1-16

# Generate 32-character hex key
openssl rand -hex 32
```

### Verification Checklist

- [ ] No test accounts in production database
- [ ] No hardcoded passwords in source code
- [ ] No test credentials in production build
- [ ] All admin passwords are 16+ characters
- [ ] MFA enabled for all admin accounts
- [ ] Account lockout configured (3 attempts)
- [ ] RLS policies verified and tested
- [ ] Audit logging enabled for admin actions
- [ .gitignore updated for test credentials
- [ ] RoleSwitcher removed from production
- [ ] Documentation updated (remove this file or move to internal wiki)

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Created** | 2026-01-09 |
| **Last Updated** | 2026-01-09 |
| **Owner** | Security Team |
| **Review Date** | 2026-02-09 |
| **Classification** | Confidential |
| **Distribution** | Development Team, Security Team, DevOps |

---

**WARNING**: This document contains sensitive information.
1. Do not commit to version control
2. Store in internal wiki or secure vault
3. Delete after beta launch
4. Regenerate all credentials if leaked

**Next Review**: Before beta launch (estimate: 2026-02-01)
