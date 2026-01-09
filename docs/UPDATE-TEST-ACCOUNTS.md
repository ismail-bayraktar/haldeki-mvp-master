# UPDATE-TEST-ACCOUNTS.md

> **Migration Guide** - Moving from old test accounts to new SuperAdmin system
> **Created**: 2026-01-09
> **Status**: Active

---

## Important Changes

### New SuperAdmin Credentials

**Old credentials are deprecated. Use the new SuperAdmin account:**

| Field | Old Value | New Value |
|-------|-----------|-----------|
| **Email** | `superadmin@haldeki.com` | `admin@haldeki.com` |
| **Password** | `test123` | `hws8WadKktlvvjO8` |
| **Role** | superadmin | superadmin |
| **Status** | TO BE DELETED | ACTIVE |
| **Documentation** | TEST_ACCOUNTS.md | SUPERADMIN-CREDENTIALS.md |

---

## Action Items

### Immediate Actions Required

**1. Update .gitignore**
```bash
# Add these lines to .gitignore:
docs/development/SUPERADMIN-CREDENTIALS.md
docs/BETA-TESTING-GUIDE.md
```

**2. Update TEST_ACCOUNTS.md**
- Mark old `superadmin@haldeki.com` as TO BE DELETED
- Mark old `admin@haldeki.com` as now SuperAdmin
- Mark all supplier accounts as TO BE DELETED
- Mark all customer accounts as TO BE DELETED
- Add reference to new SUPERADMIN-CREDENTIALS.md

**3. Create New Test Accounts**
Using the new SuperAdmin panel, create fresh test accounts:
- Login as `admin@haldeki.com` / `hws8WadKktlvvjO8`
- Navigate to Business Panel → Users
- Create new test users as needed

---

## Old Test Accounts Status

### Accounts to Delete

| Email | Old Role | Status | Action |
|-------|----------|--------|--------|
| `superadmin@haldeki.com` | superadmin | DEPRECATED | DELETE |
| `content@haldeki.com` | admin | DEPRECATED | DELETE |
| `supplier1@haldeki.com` | supplier | OLD | DELETE |
| `supplier2@haldeki.com` | supplier | OLD | DELETE |
| `supplier3@haldeki.com` | supplier | OLD | DELETE |
| `supplier4@haldeki.com` | supplier | OLD | DELETE |
| `supplier5@haldeki.com` | supplier | OLD | DELETE |
| `supplier6@haldeki.com` | supplier | OLD | DELETE |
| `customer@example.com` | customer | OLD | DELETE |
| `premium@example.com` | customer | OLD | DELETE |

### Accounts to Update

| Email | Old Role | New Role | New Password | Action |
|-------|----------|----------|--------------|--------|
| `admin@haldeki.com` | admin | **superadmin** | `hws8WadKktlvvjO8` | KEEP |

---

## New Workflow

### Creating Test Users

**Old Way (DO NOT USE):**
- Manually create users in database
- Use hardcoded credentials in code
- Share passwords via email/chat

**New Way (USE THIS):**
1. Login as SuperAdmin (`admin@haldeki.com`)
2. Go to Business Panel → Users
3. Click "Create User"
4. Fill in user details
5. System generates secure password
6. Share credentials via secure channel

---

## Cleanup Process

### Step 1: Backup Current Data

```sql
-- Backup old test accounts before deletion
CREATE TABLE auth.users_backup_20260109 AS
SELECT * FROM auth.users
WHERE email LIKE '%@haldeki.com'
   OR email LIKE '%@example.com';
```

### Step 2: Delete Old Test Accounts

```sql
-- Delete old test accounts
DELETE FROM auth.users
WHERE email IN (
  'superadmin@haldeki.com',
  'content@haldeki.com',
  'supplier1@haldeki.com',
  'supplier2@haldeki.com',
  'supplier3@haldeki.com',
  'supplier4@haldeki.com',
  'supplier5@haldeki.com',
  'supplier6@haldeki.com',
  'customer@example.com',
  'premium@example.com'
)
AND email != 'admin@haldeki.com'; -- Keep the new SuperAdmin
```

### Step 3: Verify Deletion

```sql
-- Verify only admin@haldeki.com remains
SELECT email, role, created_at
FROM auth.users
WHERE email LIKE '%@haldeki.com'
   OR email LIKE '%@example.com'
ORDER BY email;
```

**Expected result:**
- Only `admin@haldeki.com` should remain

---

## Testing Workflow

### For Beta Testing

**1. SuperAdmin Testing:**
- Use `admin@haldeki.com` / `hws8WadKktlvvjO8`
- Test Business Panel features
- Create test users as needed
- Approve supplier applications

**2. Supplier Testing:**
- Create new test supplier via SuperAdmin panel
- Or have supplier register normally
- Approve via SuperAdmin panel
- Test supplier features with new account

**3. Customer Testing:**
- Create new test customer via SuperAdmin panel
- Or have customer register normally
- Test customer features with new account

**4. Clean Up After Testing:**
- Delete all test accounts created during testing
- Keep only `admin@haldeki.com` for production
- Verify database is clean

---

## Documentation Updates

### Files Created

1. **SUPERADMIN-CREDENTIALS.md**
   - Location: `docs/development/SUPERADMIN-CREDENTIALS.md`
   - Contains: Production SuperAdmin credentials
   - Status: Not in .gitignore (add it!)
   - Access: Restricted to authorized personnel

2. **BETA-TESTING-GUIDE.md**
   - Location: `docs/BETA-TESTING-GUIDE.md`
   - Contains: Complete testing workflow
   - Status: Not in .gitignore (add it!)
   - Access: Testing team

3. **UPDATE-TEST-ACCOUNTS.md**
   - Location: `docs/UPDATE-TEST-ACCOUNTS.md` (this file)
   - Contains: Migration guide
   - Status: Can be committed
   - Access: Development team

### Files Updated

1. **TEST_ACCOUNTS.md**
   - Status: Outdated, kept for reference
   - Action: Mark as SUPERSEDED
   - Add link to SUPERADMIN-CREDENTIALS.md
   - Mark all old accounts as TO BE DELETED

2. **.gitignore**
   - Add: `docs/development/SUPERADMIN-CREDENTIALS.md`
   - Add: `docs/BETA-TESTING-GUIDE.md`
   - Prevents committing sensitive credentials

---

## Security Reminders

**CRITICAL SECURITY PRACTICES:**

1. **NEVER commit SuperAdmin credentials to git**
2. **NEVER share passwords via email/chat**
3. **ALWAYS use secure channels for credentials**
4. **CHANGE password immediately if compromised**
5. **ENABLE 2FA on SuperAdmin account**
6. **LOG OUT after each admin session**
7. **USE HTTPS only** (no HTTP)
8. **CLEAR browser cache after admin work**

---

## Next Steps

### For System Administrator

- [x] Create new SuperAdmin account
- [x] Generate secure password
- [x] Create SUPERADMIN-CREDENTIALS.md
- [x] Create BETA-TESTING-GUIDE.md
- [x] Create UPDATE-TEST-ACCOUNTS.md
- [ ] Add new files to .gitignore
- [ ] Commit .gitignore changes
- [ ] Share SUPERADMIN-CREDENTIALS.md with authorized users
- [ ] Schedule cleanup of old test accounts
- [ ] Run cleanup script

### For Testers

- [ ] Read BETA-TESTING-GUIDE.md
- [ ] Obtain SuperAdmin credentials from secure source
- [ ] Login as SuperAdmin
- [ ] Create fresh test accounts
- [ ] Perform testing
- [ ] Document issues found
- [ ] Report issues via proper channels

### For Developers

- [ ] Update code to use new SuperAdmin email
- [ ] Remove hardcoded old credentials
- [ ] Update test scripts
- [ ] Verify RLS policies work with new account
- [ ] Test all admin functions

---

## Rollback Plan

**If issues occur with new SuperAdmin:**

1. **Immediate rollback:**
   ```sql
   -- Restore old superadmin from backup
   INSERT INTO auth.users
   SELECT * FROM auth.users_backup_20260109
   WHERE email = 'superadmin@haldeki.com';
   ```

2. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   ```

3. **Notify team:**
   - Send alert to all users
   - Document rollback reason
   - Plan fix for issues

---

## Support

| Issue | Contact | Method |
|-------|---------|--------|
| Cannot login | System Admin | Secure channel |
| Password reset | System Admin | Supabase dashboard |
| Account creation | SuperAdmin | Business Panel |
| Technical issues | Developer | Issue tracker |

---

**Last Updated:** 2026-01-09
**Version:** 1.0
**Status:** Active Migration

**IMPORTANT:** Complete migration before starting beta testing. All old test accounts should be deleted before production launch.
