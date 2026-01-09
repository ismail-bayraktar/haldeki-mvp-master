# Phase 2 Whitelist Login Fixes - Manual Test Guide

## Overview
This document provides step-by-step manual testing procedures for the Phase 2 whitelist login fixes.

**Critical Issues Fixed:**
1. Phone normalization - Various Turkish phone formats now normalized
2. Data source fix - `Beklemede.tsx` now queries from `users` table instead of `user_metadata`

**Files Modified:**
- `src/lib/phoneNormalizer.ts` (NEW) - Phone normalization utility
- `src/contexts/AuthContext.tsx` - Updated `checkWhitelistStatus()` to normalize phones
- `src/pages/Beklemede.tsx` - Fixed to query users table and normalize phones

---

## Prerequisites

### Database Setup
1. Ensure `whitelist_applications` table exists with test data
2. Ensure `users` table exists with phone numbers
3. Have test user accounts ready

### Test Accounts Needed
- Pending whitelist user (various phone formats in database)
- Approved whitelist user
- Rejected whitelist user
- Normal user (no whitelist)

---

## Test Cases

### Test Case 1: Login with Phone Format Variations

**Purpose:** Verify phone normalization works during login flow

**Steps:**
1. Create a whitelist application with phone: `5551234567`
2. Create a user account with the same phone in `users` table as `0555 123 45 67`
3. Attempt to login with this user

**Expected Results:**
- User should be redirected to `/beklemede` page
- Status should show "Başvurunuz İnceleniyor" (pending)
- No "Erişim Yok" error should appear
- User's application details should display correctly

**Variations to Test:**
| Users Table Phone Format | Whitelist Phone Format | Should Match? |
|--------------------------|------------------------|---------------|
| `0555 123 45 67` | `5551234567` | Yes |
| `+905551234567` | `5551234567` | Yes |
| `0555-123-45-67` | `5551234567` | Yes |
| `555-123-4567` | `5551234567` | Yes |
| `90 555 123 45 67` | `5551234567` | Yes |
| `0555 123 45 67` | `+905551234567` | Yes |
| `0555 123 45 67` | `0555 123 45 68` | No |

**Test Result Template:**
```
Format Variation: [Users table format] → [Whitelist format]
Status: [PASS / FAIL]
Details: [Any errors or unexpected behavior]
```

---

### Test Case 2: Beklemede Page Displays Correctly

**Purpose:** Verify Beklemede page queries `users` table and displays correct info

**Steps:**
1. Login as a pending whitelist user
2. Observe the `/beklemede` page display
3. Check browser console for any errors

**Expected Results:**
- User should see "Başvurunuz İnceleniyor" (pending) status
- Phone number should display in the normalized format
- Name should display from whitelist application
- No console errors related to phone queries
- No "Erişim Yok" (Access Denied) should appear

**Data Verification:**
Open browser DevTools → Console → Check for:
- No errors like "Error fetching user phone"
- No errors related to undefined phone values
- Successful whitelist query completion

**Test Result Template:**
```
Status Display: [Correct / Incorrect]
Phone Display: [Shown / Not Shown]
Console Errors: [None / Specify]
```

---

### Test Case 3: Auto-Redirect on Approval

**Purpose:** Verify user is auto-redirected when status changes to approved

**Steps:**
1. Login as a pending whitelist user
2. Stay on `/beklemede` page
3. In Supabase dashboard, change application status to `approved`
4. Wait up to 10 seconds for polling to detect change
5. Observe auto-redirect behavior

**Expected Results:**
- Page detects status change within 10 seconds
- Status updates to "Başvurunuz Onaylandı!" (approved)
- Auto-redirect countdown starts (2 seconds)
- User is redirected to `/urunler` (products page)
- Success toast/message appears

**Browser Console Check:**
- Polling interval should be 10000ms (10 seconds)
- No polling errors in console
- Navigation event should be logged

**Test Result Template:**
```
Polling Detection: [Working / Not Working]
Auto-Redirect: [Yes / No]
Redirect Delay: [2 seconds / Other]
Redirect Target: [/urunler / Other]
```

---

### Test Case 4: Rejected User Handling

**Purpose:** Verify rejected users see appropriate error and are logged out

**Steps:**
1. Create a whitelist application with status `rejected`
2. Create a user account with matching phone
3. Attempt to login

**Expected Results:**
- Login attempt should fail
- Toast error message: "Başvurunuz reddedildi. Detaylar için iletişime geçin."
- User should be automatically signed out
- Redirected to home page
- No access to any protected routes

**Variations to Test:**
- Rejected with phone format: `0555 123 45 67`
- Rejected with phone format: `+905551234567`
- Rejected with phone format: `5551234567`

**Test Result Template:**
```
Error Message: [Shown / Not Shown]
Auto-Logout: [Yes / No]
Redirect: [Home / Other]
```

---

### Test Case 5: Duplicate Application Handling

**Purpose:** Verify duplicate application status is handled correctly

**Steps:**
1. Create a whitelist application with status `duplicate`
2. Create a user account with matching phone
3. Attempt to login

**Expected Results:**
- Login attempt should fail
- Toast error message: "Bu telefon numarası için zaten bir başvuru mevcut."
- User should be automatically signed out
- Redirected to home page

**Test Result Template:**
```
Error Message: [Correct / Incorrect]
Auto-Logout: [Yes / No]
```

---

### Test Case 6: No Whitelist Record (Normal User)

**Purpose:** Verify users without whitelist records login normally

**Steps:**
1. Create a user account with phone number
2. Do NOT create any whitelist application
3. Attempt to login

**Expected Results:**
- Login should succeed
- User should NOT be redirected to `/beklemede`
- User should be redirected based on their role (e.g., `/` for customer)
- Access to their normal routes should work
- No whitelist-related errors in console

**Test Result Template:**
```
Login Success: [Yes / No]
Redirect Path: [Expected / Actual]
Whitelist Check: [Skipped / Attempted]
```

---

### Test Case 7: Invalid Phone Numbers

**Purpose:** Verify invalid phone numbers are handled gracefully

**Test Scenarios:**

| Scenario | Users Phone | Expected Behavior |
|----------|-------------|-------------------|
| Too short | `555123` | Null normalized, whitelist check skipped |
| Too long | `0555 123 45 67 89` | Null normalized, whitelist check skipped |
| Invalid chars | `abcdef` | Null normalized, whitelist check skipped |
| Empty string | `""` | Null normalized, whitelist check skipped |
| Null | `null` | Null normalized, whitelist check skipped |
| Missing phone column | Column doesn't exist | Graceful fallback, no crash |

**Expected Results:**
- No crashes or errors
- Login continues normally (if phone is invalid)
- Console warnings for invalid formats
- No blocking of user login due to invalid phone

**Test Result Template:**
```
Invalid Input: [Test case]
Normalized Result: [null / value]
Login Blocked: [Yes / No]
Console Warning: [Yes / No]
```

---

### Test Case 8: Multiple Applications (Latest Takes Priority)

**Purpose:** Verify when multiple applications exist, latest one is used

**Steps:**
1. Create 2-3 whitelist applications for same phone
2. Set different statuses for each
3. Create user with matching phone
4. Login and check which status is shown

**Expected Results:**
- Latest application (by `created_at`) should be used
- `ORDER BY created_at DESC` + `LIMIT(1)` ensures latest
- Status should match the latest application

**Test Result Template:**
```
Application Count: [Number]
Latest Status: [Expected / Actual]
Correct Application Used: [Yes / No]
```

---

### Test Case 9: Users Table vs user_metadata Comparison

**Purpose:** Verify phone data comes from `users` table, not `user_metadata`

**Steps:**
1. Create user account
2. Set different phone values:
   - `users.phone`: `0555 123 45 67`
   - `user_metadata.phone`: `9999999999` (wrong)
3. Create whitelist application matching `users.phone`
4. Login and check status

**Expected Results:**
- Login should use phone from `users` table (`0555 123 45 67`)
- Whitelist match should work (status shown correctly)
- `user_metadata.phone` should be ignored
- This proves the data source fix is working

**Verification:**
Open browser DevTools → Network Tab:
- Find the API call to `users` table
- Verify phone field is retrieved
- Find the whitelist query
- Verify normalized phone matches

**Test Result Template:**
```
Users Table Phone: [Value]
user_metadata Phone: [Value]
Whitelist Match: [Success / Fail]
Correct Source Used: [Yes / No]
```

---

### Test Case 10: Polling Behavior and Cleanup

**Purpose:** Verify polling works correctly and cleans up on unmount

**Steps:**
1. Login as pending whitelist user
2. Stay on `/beklemede` page for 30+ seconds
3. Navigate away from page
4. Come back to `/beklemede`
5. Check console for multiple polling intervals

**Expected Results:**
- Polling should run every 10 seconds
- Only one polling interval should be active at a time
- Navigating away should clear the interval (cleanup)
- Returning should start a new polling interval
- No "leaked" intervals (multiple concurrent polls)

**Browser Console Check:**
```javascript
// In browser console on /beklemede page
// Check for polling logs
// No multiple "setInterval" warnings
```

**Test Result Template:**
```
Polling Interval: [10 seconds / Other]
Cleanup on Navigate: [Working / Not Working]
Multiple Intervals: [None / Detected]
```

---

## Regression Tests

### Regression 1: Existing User Login (No Phone)

**Purpose:** Ensure users without phones can still login

**Steps:**
1. Create user without phone in `users` table
2. Attempt login

**Expected Results:**
- Login should succeed
- No whitelist check should run
- Normal role-based redirect should occur

---

### Regression 2: Admin/Staff Login

**Purpose:** Ensure admin/staff login still works

**Steps:**
1. Login as admin/superadmin
2. Verify access to admin panel

**Expected Results:**
- Login should succeed
- Redirect to `/admin` should occur
- Admin panel should be accessible

---

### Regression 3: Dealer/Supplier/Business Approval

**Purpose:** Ensure existing approval flows still work

**Steps:**
1. Create pending dealer/supplier/business
2. Login and verify `/beklemede` shows correct approval type

**Expected Results:**
- Should show respective approval type (Dealer/Tedarikçi/İşletme)
- Phone normalization should not break dealer approval checks
- Status polling should work for all approval types

---

## Performance Tests

### Performance 1: Phone Normalization Speed

**Purpose:** Verify normalization is fast and doesn't block UI

**Test:**
- Run 1000 normalizations in browser console
- Measure time taken

```javascript
// Browser console test
console.time('normalize');
for (let i = 0; i < 1000; i++) {
  normalizePhoneNumber('0555 123 45 67');
}
console.timeEnd('normalize');
```

**Expected:** < 50ms for 1000 operations

---

### Performance 2: Database Query Performance

**Purpose:** Verify queries are optimized

**Checks:**
- `users` table query by `id` (indexed by default)
- `whitelist_applications` query by `phone` (should have index)
- Query should use `maybeSingle()` (not full array fetch)

**Expected:**
- Queries should complete in < 100ms
- No full table scans

---

## Browser Compatibility Tests

### Browsers to Test:
1. Chrome/Edge (Chromium)
2. Firefox
3. Safari (if available)
4. Mobile browsers (Chrome Mobile, Safari Mobile)

**Focus Areas:**
- Phone input handling
- Redirect behavior
- Polling functionality
- Toast notifications

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Backup database before testing
- [ ] Ensure test accounts exist
- [ ] Clear browser cache/cookies
- [ ] Open browser DevTools (Console + Network)

### Test Execution
- [ ] Test Case 1: Phone format variations (ALL variations)
- [ ] Test Case 2: Beklemede page display
- [ ] Test Case 3: Auto-redirect on approval
- [ ] Test Case 4: Rejected user handling
- [ ] Test Case 5: Duplicate application handling
- [ ] Test Case 6: No whitelist record (normal user)
- [ ] Test Case 7: Invalid phone numbers (ALL scenarios)
- [ ] Test Case 8: Multiple applications
- [ ] Test Case 9: Data source verification
- [ ] Test Case 10: Polling behavior
- [ ] Regression tests (1-3)
- [ ] Performance tests (1-2)
- [ ] Browser compatibility (if available)

### Post-Test
- [ ] Document all test results
- [ ] Report any failures with details
- [ ] Take screenshots of failures
- [ ] Check production readiness

---

## Test Report Template

### Summary
- **Date:** [Test Date]
- **Tester:** [Your Name]
- **Environment:** [Development/Staging]
- **Browser:** [Browser + Version]

### Results Overview
- **Total Tests:** [Number]
- **Passed:** [Number]
- **Failed:** [Number]
- **Blocked:** [Number]

### Failed Tests Detail
| Test Case | Issue | Severity | Screenshot |
|-----------|-------|----------|------------|
| [Test Name] | [Description] | [High/Medium/Low] | [Link] |

### Production Readiness Assessment
- **Ready for Production:** [Yes/No]
- **Known Issues:** [List any non-blocking issues]
- **Recommendations:** [Any suggestions]

---

## Contact Information

**Questions or Issues Found?**
- Document in test report
- Attach console logs
- Include screenshots
- Note exact reproduction steps

**Next Steps After Testing:**
1. Review test results
2. Fix any critical issues
3. Re-test fixes
4. Approve for production deployment
