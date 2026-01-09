# Quick Start: Test Account Cleanup

**Ready to execute? Follow these steps in order.**

---

## Step 1: Audit (5 minutes)

**Run in Supabase SQL Editor:**
```sql
-- Open file: scripts/audit-test-accounts.sql
-- Execute entire script
```

**What to look for:**
- Total test accounts: Should be 11-15
- Admin/SuperAdmin test accounts: Note the count
- Review the list before proceeding

**✓ Checklist:**
- [ ] Reviewed all test accounts
- [ ] Confirmed deletion targets
- [ ] Noted any important test data

---

## Step 2: Choose SuperAdmin Password

**Requirements:**
- Minimum 16 characters
- Uppercase letters (A-Z)
- Lowercase letters (a-z)
- Numbers (0-9)
- Symbols (!@#$%^&*)

**Example (DO NOT USE):** `H4ld3k!S3cur3#2025$Adm1n`

**✓ Checklist:**
- [ ] Password chosen (16+ chars, mixed case, numbers, symbols)
- [ ] Password stored in secure password manager
- [ ] NOT shared via chat, email, or plain text

---

## Step 3: Execute Cleanup (10 minutes)

**Run in Supabase SQL Editor:**
```sql
-- Open file: scripts/cleanup-test-accounts-production.sql
-- Execute entire script
-- You have 5 seconds to abort (Ctrl+C)
```

**Expected output:**
```
BACKUP CREATED - DELETION SUMMARY
Total test accounts to delete: [number]
Admin/SuperAdmin accounts: [number]
STATUS: SUCCESS - All test accounts deleted
```

**✓ Checklist:**
- [ ] Backup table created
- [ ] All test accounts deleted
- [ ] No error messages
- [ ] Deletion count matches audit

---

## Step 4: Create SuperAdmin (5 minutes)

**Option A: If account exists**
- Script automatically assigns superadmin role
- Proceed to Step 5

**Option B: If account doesn't exist**

**In Supabase Dashboard:**
1. Authentication → Users → "Add user" → "Create new user"
2. Email: `admin@haldeki.com`
3. Password: [Your secure password from Step 2]
4. ✅ Auto Confirm User
5. Click "Create user"

**Then run this SQL:**
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::public.app_role
FROM auth.users
WHERE email = 'admin@haldeki.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

**✓ Checklist:**
- [ ] admin@haldeki.com account created
- [ ] SuperAdmin role assigned
- [ ] Email confirmed (auto-confirm checked)

---

## Step 5: Verify (5 minutes)

**Run in Supabase SQL Editor:**
```sql
-- Open file: scripts/verify-cleanup-and-superadmin.sql
-- Execute entire script
```

**Expected output:**
```
TEST ACCOUNT CLEANUP VERIFICATION
Remaining test accounts: 0
STATUS: SUCCESS

SUPERADMIN ACCOUNT VERIFICATION
admin@haldeki.com exists: true
Has superadmin role: true
STATUS: SUCCESS
```

**✓ Checklist:**
- [ ] Test accounts: 0 remaining
- [ ] SuperAdmin exists: true
- [ ] SuperAdmin role: assigned
- [ ] No orphaned records: 0

---

## Step 6: Test Login (2 minutes)

**In your application:**
1. Go to login page
2. Email: `admin@haldeki.com`
3. Password: [Your secure password]
4. Click login

**Expected result:** Successful login as SuperAdmin

**✓ Checklist:**
- [ ] Login successful
- [ ] SuperAdmin dashboard accessible
- [ ] Permissions working correctly

---

## Step 7: Post-Cleanup (10 minutes)

**In Supabase Dashboard:**

1. **Enable MFA** (if available)
   - Authentication → Users → Find admin@haldeki.com
   - Enable 2FA/MFA

2. **Review Audit Logs**
   - Logs → Auth Logs
   - Check for suspicious activity

3. **Document Credentials**
   - Store in password manager:
     - Email: admin@haldeki.com
     - Password: [Your secure password]
     - Role: SuperAdmin
     - Created: [Today's date]

**✓ Checklist:**
- [ ] MFA enabled (if available)
- [ ] Audit logs reviewed
- [ ] Credentials documented securely
- [ ] Backup table noted: `deleted_test_accounts_backup_20250109`

---

## Summary Timeline

| Step | Time | Cumulative |
|------|------|------------|
| Audit | 5 min | 5 min |
| Choose password | 2 min | 7 min |
| Execute cleanup | 10 min | 17 min |
| Create SuperAdmin | 5 min | 22 min |
| Verify | 5 min | 27 min |
| Test login | 2 min | 29 min |
| Post-cleanup | 10 min | 39 min |

**Total time: ~40 minutes**

---

## Troubleshooting

**Script fails:**
- Check Supabase logs for errors
- Verify you have admin permissions
- Try running sections individually

**SuperAdmin role not assigned:**
- Manually run the SQL from Step 4
- Verify account exists in auth.users

**Cannot login:**
- Check email is confirmed (email_confirmed_at NOT NULL)
- Reset password via Supabase Dashboard if needed
- Verify user has superadmin role

**Test accounts still exist:**
- Run verification script to check
- Manually delete specific accounts:
  ```sql
  DELETE FROM auth.users WHERE email = 'test@example.com';
  ```

---

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/audit-test-accounts.sql` | Step 1: List test accounts |
| `scripts/cleanup-test-accounts-production.sql` | Step 3: Delete + create SuperAdmin |
| `scripts/verify-cleanup-and-superadmin.sql` | Step 5: Verify success |
| `scripts/PRODUCTION-CLEANUP-GUIDE.md` | Detailed guide |
| `scripts/cleanup-security-report.md` | Security audit report |

---

## Need Help?

1. **Check the detailed guide:** `PRODUCTION-CLEANUP-GUIDE.md`
2. **Review security report:** `cleanup-security-report.md`
3. **Contact database administrator** for critical issues

---

**Ready? Start with Step 1!**
