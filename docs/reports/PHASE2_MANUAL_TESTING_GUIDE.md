# Phase 2: Whitelist Login - Manual Testing Guide

**Purpose:** Step-by-step manual testing for Phase 2 whitelist integration
**Time Required:** ~30 minutes
**Prerequisites:** Test data setup completed

---

## Pre-Test Setup

### 1. Create Test Users

```bash
# Run the script to create auth users
npx tsx scripts/create-whitelist-test-users.ts
```

### 2. Setup Database Records

```bash
# Run SQL script in Supabase SQL Editor
# File: scripts/setup-whitelist-test-data.sql
```

### 3. Verify Test Data

Run this query in Supabase SQL Editor:

```sql
SELECT
  u.email,
  u.phone,
  wa.status as whitelist_status
FROM users u
LEFT JOIN whitelist_applications wa ON u.phone = wa.phone
WHERE u.email LIKE 'test-%@haldeki.com'
ORDER BY u.email;
```

Expected output:

| email | phone | whitelist_status |
|-------|-------|------------------|
| test-pending@haldeki.com | 5551234567 | pending |
| test-approved@haldeki.com | 5551234568 | approved |
| test-rejected@haldeki.com | 5551234569 | rejected |
| test-duplicate@haldeki.com | 5551234570 | duplicate |
| test-no-whitelist@haldeki.com | 5551234571 | null |
| test-no-phone@haldeki.com | null | null |

---

## Test Cases

### Test 1: Pending Application Flow

**Purpose:** Verify user with pending application is redirected to `/beklemede`

**Steps:**
1. Open browser (incognito mode)
2. Navigate to `http://localhost:5173`
3. Click login button
4. Enter credentials:
   - Email: `test-pending@haldeki.com`
   - Password: `Test123!`
5. Click "Giriş Yap"

**Expected Results:**
- ✅ See "Giriş başarılı!" toast message
- ✅ Page redirects to `/beklemede`
- ✅ See "Başvurunuz İnceleniyor" message
- ✅ See "Erken Erişim" badge
- ✅ See phone number: "5551234567"
- ✅ See "Çıkış Yap" button

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

### Test 2: Approved Application Flow

**Purpose:** Verify user with approved application logs in normally

**Steps:**
1. Open browser (incognito mode)
2. Navigate to `http://localhost:5173`
3. Click login button
4. Enter credentials:
   - Email: `test-approved@haldeki.com`
   - Password: `Test123!`
5. Click "Giriş Yap"

**Expected Results:**
- ✅ See "Giriş başarılı!" toast message
- ✅ Page redirects to `/urunler` (not `/beklemede`)
- ✅ User can browse products
- ✅ No whitelist-related messages

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

### Test 3: Rejected Application Flow

**Purpose:** Verify user with rejected application sees error and is logged out

**Steps:**
1. Open browser (incognito mode)
2. Navigate to `http://localhost:5173`
3. Click login button
4. Enter credentials:
   - Email: `test-rejected@haldeki.com`
   - Password: `Test123!`
5. Click "Giriş Yap"

**Expected Results:**
- ✅ See error toast: "Başvurunuz reddedildi. Detaylar için iletişime geçin."
- ✅ Page redirects to `/` (home page)
- ✅ User is NOT logged in (no user menu)
- ✅ Auth drawer closes

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

### Test 4: Duplicate Application Flow

**Purpose:** Verify user with duplicate status sees appropriate error

**Steps:**
1. Open browser (incognito mode)
2. Navigate to `http://localhost:5173`
3. Click login button
4. Enter credentials:
   - Email: `test-duplicate@haldeki.com`
   - Password: `Test123!`
5. Click "Giriş Yap"

**Expected Results:**
- ✅ See error toast: "Bu telefon numarası için zaten bir başvuru mevcut."
- ✅ Page redirects to `/` (home page)
- ✅ User is NOT logged in

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

### Test 5: No Whitelist Application Flow

**Purpose:** Verify user with phone but no application logs in normally

**Steps:**
1. Open browser (incognito mode)
2. Navigate to `http://localhost:5173`
3. Click login button
4. Enter credentials:
   - Email: `test-no-whitelist@haldeki.com`
   - Password: `Test123!`
5. Click "Giriş Yap"

**Expected Results:**
- ✅ See "Giriş başarılı!" toast message
- ✅ Page redirects to `/` (normal flow for user role)
- ✅ No whitelist check performed
- ✅ User can browse site normally

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

### Test 6: User Without Phone Flow

**Purpose:** Verify user without phone skips whitelist check

**Steps:**
1. Open browser (incognito mode)
2. Navigate to `http://localhost:5173`
3. Click login button
4. Enter credentials:
   - Email: `test-no-phone@haldeki.com`
   - Password: `Test123!`
5. Click "Giriş Yap"

**Expected Results:**
- ✅ See "Giriş başarılı!" toast message
- ✅ Page redirects to `/` (normal flow)
- ✅ No whitelist check performed
- ✅ User can browse site normally

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

### Test 7: Pending User - Polling Behavior

**Purpose:** Verify pending page polls for status changes

**Steps:**
1. Login as `test-pending@haldeki.com`
2. Wait on `/beklemede` page
3. Open browser DevTools (F12)
4. Go to Network tab
5. Filter by "whitelist_applications"
6. Wait for 20-30 seconds

**Expected Results:**
- ✅ See network requests every ~10 seconds
- ✅ Each request queries `whitelist_applications` table
- ✅ Page remains on `/beklemede` while status is pending
- ✅ No errors in console

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

### Test 8: Pending User - Approval While Polling

**Purpose:** Verify auto-redirect when approved while on `/beklemede`

**Steps:**
1. Login as `test-pending@haldeki.com`
2. Keep `/beklemede` page open
3. Open another tab/browser
4. Login as admin
5. Go to `/admin/whitelist-applications`
6. Find "Test Pending User" (5551234567)
7. Click "Onayla" (Approve)
8. Go back to first tab (pending user)
9. Wait 10-20 seconds

**Expected Results:**
- ✅ Polling detects status change to "approved"
- ✅ Page shows "Başvurunuz Onaylandı!" message
- ✅ Auto-redirects to `/urunler` after 2 seconds
- ✅ User can now browse products

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

### Test 9: Logout from Pending Page

**Purpose:** Verify logout button works on `/beklemede`

**Steps:**
1. Login as `test-pending@haldeki.com`
2. Wait for redirect to `/beklemede`
3. Click "Çıkış Yap" button

**Expected Results:**
- ✅ Polling stops (check network tab)
- ✅ See "Çıkış yapıldı" toast message
- ✅ Page redirects to `/`
- ✅ User is logged out

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

## Edge Case Tests

### Test 10: Network Failure During Polling

**Purpose:** Verify graceful handling of network errors

**Steps:**
1. Login as `test-pending@haldeki.com`
2. Wait on `/beklemede` page
3. Open DevTools
4. Go to Network tab
5. Select "Offline" from throttling dropdown
6. Wait 10-15 seconds
7. Select "Online" again

**Expected Results:**
- ✅ No infinite loop or crashes
- ✅ Page shows "Erişim Yok" or continues polling
- ✅ After reconnecting, polling resumes

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

### Test 11: Multiple Login Attempts (Rejected)

**Purpose:** Verify rejected user can't bypass by retrying

**Steps:**
1. Login as `test-rejected@haldeki.com`
2. Verify error message
3. Immediately try to login again (same user)
4. Repeat 3 times

**Expected Results:**
- ✅ Each attempt shows same error
- ✅ No way to bypass rejection
- ✅ Consistent behavior

**Actual Results:**
- [ ] Pass / [ ] Fail

**Notes:** ________________________________

---

## Performance Tests

### Test 12: Login Speed

**Purpose:** Verify login completes within acceptable time

**Steps:**
1. Open DevTools Network tab
2. Login as `test-approved@haldeki.com`
3. Measure time from "Giriş Yap" click to redirect

**Expected Results:**
- ✅ Total time < 1 second
- ✅ All queries complete successfully

**Actual Results:**
- [ ] Pass / [ ] Fail
- Time taken: _______ ms

**Notes:** ________________________________

---

## Cross-Browser Testing

Test on multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile (Chrome Mobile, Safari Mobile)

**Notes:** ________________________________

---

## Test Summary

| Test | Status | Issues Found |
|------|--------|--------------|
| Test 1: Pending Flow | [ ] P / [ ] F | |
| Test 2: Approved Flow | [ ] P / [ ] F | |
| Test 3: Rejected Flow | [ ] P / [ ] F | |
| Test 4: Duplicate Flow | [ ] P / [ ] F | |
| Test 5: No Application | [ ] P / [ ] F | |
| Test 6: No Phone | [ ] P / [ ] F | |
| Test 7: Polling | [ ] P / [ ] F | |
| Test 8: Approval Polling | [ ] P / [ ] F | |
| Test 9: Logout | [ ] P / [ ] F | |
| Test 10: Network Failure | [ ] P / [ ] F | |
| Test 11: Retry Rejected | [ ] P / [ ] F | |
| Test 12: Performance | [ ] P / [ ] F | |

**Total Passed:** _____ / 12

**Overall Status:**
- [ ] ✅ READY FOR PRODUCTION
- [ ] ⚠️ NEEDS FIXES
- [ ] ❌ NOT READY

---

## Bug Report Format

If any test fails, document:

```markdown
### Bug #[NUMBER]

**Test:** Test Name
**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
-

**Actual Behavior:**
-

**Screenshots:**
(attach if applicable)

**Console Errors:**
(paste from DevTools)

**Network Requests:**
(paste from DevTools)
```

---

## Cleanup

After testing, clean up test data:

```sql
-- Delete test users from database
DELETE FROM user_roles WHERE user_id LIKE '00000000-0000-0000-0000-000000000%';
DELETE FROM whitelist_applications WHERE phone LIKE '555123%';
DELETE FROM users WHERE email LIKE 'test-%@haldeki.com';

-- Delete from auth (via dashboard or script)
-- See: scripts/cleanup-whitelist-test-users.ts
```

---

**Testing Completed By:** _________________
**Date:** _________________
**Signature:** _________________
