# Phase 3 Deployment - Execution Guide

**Date:** 2026-01-08
**Status:** Ready for Deployment
**Estimated Time:** 10-15 minutes

---

## 📋 PRE-DEPLOYMENT SUMMARY

### ✅ What's Already Done

1. **Phase 1** (Admin Panel) - ✅ COMPLETE
   - Migration deployed (user confirmed)
   - Admin panel functional
   - No blocking debt

2. **Phase 2** (Login Logic) - ✅ COMPLETE
   - Phone normalization fixed
   - Data source corrected
   - 31/31 integration tests passing
   - No blocking debt

3. **Phase 3** (Role Trigger) - ⚠️ READY TO DEPLOY
   - Migration file created: `20260110120000_whitelist_role_trigger.sql`
   - Verification script ready
   - Test script ready
   - Documentation complete

### 🎯 What Phase 3 Does

When a whitelist application is **approved**:
1. Trigger fires automatically
2. Finds user by phone number
3. Assigns 'user' role to that user
4. Prevents duplicate roles (idempotent)

**Result:** Users can access `/urunler` immediately after approval, no manual role assignment needed.

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Verify Current Status (2 min)

**Open Supabase Dashboard:**
```
https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/sql
```

**Run this query to check if trigger is already deployed:**

```sql
-- Quick check: Does trigger exist?
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  CASE tgenabled
    WHEN 'O' THEN '✅ Enabled'
    WHEN 'D' THEN '❌ Disabled'
    WHEN 'R' THEN '⚠️ Replica'
  END AS status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE tgname = 'on_whitelist_approved'
AND n.nspname = 'public';
```

**If result shows 1 row with "✅ Enabled":**
- ✅ Trigger is already deployed!
- Skip to Step 3 (Testing)

**If result shows 0 rows or "❌ Disabled":**
- ⚠️ Trigger not deployed or disabled
- Continue to Step 2

---

### Step 2: Deploy Migration (5 min)

**Option A: Supabase Dashboard (RECOMMENDED - Fastest)**

1. **Open:** https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/sql

2. **Click:** "New Query"

3. **Copy content from:** `supabase/migrations/20260110120000_whitelist_role_trigger.sql`

4. **Paste into SQL Editor**

5. **Click:** "Run" (or press Ctrl+Enter)

6. **Expected output:** "Success. No rows returned"

**Option B: Supabase CLI (Alternative)**

```bash
cd F:\donusum\haldeki-love\haldeki-market
npx supabase db push --include-all
```

---

### Step 3: Verify Deployment (2 min)

**Run the full verification script:**

Copy and paste the entire content from `scripts/verify-phase3-trigger.sql` into SQL Editor and run.

**Expected Results:**

| Check | Expected | Pass? |
|-------|----------|-------|
| **1. Trigger exists** | 1 row, enabled = 'O' | ☐ |
| **2. Function exists** | prosecdef = true | ☐ |
| **3. RLS policies** | Policies exist | ☐ |
| **4. whitelist_applications table** | status column exists | ☐ |
| **5. user_roles table** | user_id, role columns | ☐ |
| **6. Function permissions** | can_execute = true | ☐ |
| **7. Recent role assignments** | Query runs (may be empty) | ☐ |

**If all checks pass:** ✅ Deployment successful!
**Continue to Step 4 (Testing)**

---

### Step 4: Test Trigger (5 min)

**Run the test script from:** `scripts/test-phase3-role-assignment.sql`

**Or execute these manual tests:**

#### Test 1: Create Test Application
```sql
-- Create a test whitelist application
INSERT INTO public.whitelist_applications (
  full_name,
  phone,
  email,
  city,
  user_type,
  status
) VALUES (
  'Test User',
  '5551234567',  -- Use 10-digit format
  'test@example.com',
  'İzmir',
  'B2C',
  'pending'
);

-- Get the application ID
SELECT id, phone, status FROM public.whitelist_applications
WHERE phone = '5551234567';
```

#### Test 2: Verify User Exists
```sql
-- Check if user with this phone exists
SELECT id, phone, name FROM public.users WHERE phone = '5551234567';
```

**If user doesn't exist:** Create one first or use existing user's phone

#### Test 3: Approve Application (THIS FIRES TRIGGER)
```sql
-- Approve the application (trigger should assign 'user' role)
UPDATE public.whitelist_applications
SET status = 'approved'
WHERE phone = '5551234567'
AND status = 'pending';

-- Check if role was assigned
SELECT
  u.id AS user_id,
  u.phone,
  u.name,
  ur.role,
  ur.created_at AS role_assigned_at
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.phone = '5551234567';
```

**Expected:** User now has 'user' role ✅

#### Test 4: Test Idempotency (No Duplicates)
```sql
-- Try approving again (should NOT create duplicate role)
UPDATE public.whitelist_applications
SET status = 'approved'
WHERE phone = '5551234567'
AND status = 'approved';

-- Count roles for this user
SELECT COUNT(*) AS role_count
FROM public.user_roles
WHERE user_id = (SELECT id FROM public.users WHERE phone = '5551234567');
```

**Expected:** role_count = 1 (no duplicates) ✅

#### Test 5: Cleanup (Optional)
```sql
-- Remove test data
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM public.users WHERE phone = '5551234567');

DELETE FROM public.whitelist_applications
WHERE phone = '5551234567';
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Step 1: Checked deployment status
- [ ] Step 2: Deployed migration (if needed)
- [ ] Step 3: Verified all 7 checks pass
- [ ] Step 4: Tested trigger with real data
- [ ] Trigger fires on approval
- [ ] Role assigned correctly
- [ ] No duplicate roles (idempotent)
- [ ] Cleanup test data

---

## 🧪 END-TO-END INTEGRATION TEST

After deployment, test the complete flow:

### 1. User Applies for Whitelist
```
1. User visits landing page
2. Fills whitelist application form
3. Submits application
```

### 2. User Logs In
```
4. User logs in
5. Should be redirected to /beklemede
6. Sees "Başvurunuz İnceleniyor" message
```

### 3. Admin Approves
```
7. Admin logs in
8. Goes to /admin/whitelist-applications
9. Finds pending application
10. Clicks "Onayla" (Approve)
```

### 4. Trigger Assigns Role
```
11. Trigger fires automatically
12. User gets 'user' role in user_roles table
```

### 5. User Refreshes
```
13. User refreshes page or logs in again
14. Auto-redirects to /urunler
15. Can browse products
```

**Expected:** Complete flow works end-to-end ✅

---

## ⚠️ TROUBLESHOOTING

### Issue: "Trigger does not exist"
**Solution:** Run Step 2 to deploy migration

### Issue: "Permission denied on user_roles"
**Solution:** Check RLS policies allow trigger:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_roles';
```
Look for policies allowing system/service role inserts.

### Issue: "Role not assigned after approval"
**Debug queries:**
```sql
-- Check if user exists with that phone
SELECT * FROM public.users WHERE phone = '5551234567';

-- Check if application was approved
SELECT * FROM public.whitelist_applications WHERE phone = '5551234567';

-- Check trigger logs (if logging enabled)
SELECT * FROM system_logs WHERE event_type = 'role_assigned';
```

### Issue: "Duplicate roles created"
**Solution:** Verify ON CONFLICT clause in trigger function:
```sql
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'assign_user_role_on_approval';
```
Should contain: `ON CONFLICT (user_id, role) DO NOTHING`

---

## 📊 POST-DEPLOYMENT VERIFICATION

After deployment, verify:

1. **Trigger Status:**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_whitelist_approved';
   ```
   ✅ tgenabled = 'O'

2. **Function Security:**
   ```sql
   SELECT prosecdef FROM pg_proc WHERE proname = 'assign_user_role_on_approval';
   ```
   ✅ prosecdef = true

3. **Recent Role Assignments:**
   ```sql
   SELECT * FROM public.user_roles ORDER BY created_at DESC LIMIT 5;
   ```
   ✅ Shows new roles being assigned

---

## 🚀 ROLLBACK PLAN (If Needed)

If critical issues occur:

### Option 1: Disable Trigger
```sql
-- Disable trigger (keeps function, just stops trigger)
ALTER TRIGGER on_whitelist_approved ON public.whitelist_applications DISABLE;
```

### Option 2: Remove Trigger
```sql
-- Remove trigger completely
DROP TRIGGER IF EXISTS on_whitelist_approved ON public.whitelist_applications;

-- Keep function for manual use
```

### Option 3: Full Rollback
```sql
-- Remove both trigger and function
DROP TRIGGER IF EXISTS on_whitelist_approved ON public.whitelist_applications;
DROP FUNCTION IF EXISTS public.assign_user_role_on_approval();
```

---

## 📈 SUCCESS METRICS

After deployment, monitor:

| Metric | Expected | Actual |
|--------|----------|--------|
| Trigger fires on approval | ✅ Yes | ☐ |
| Role assigned within 1s | ✅ Yes | ☐ |
| No duplicate roles | ✅ 0 duplicates | ☐ |
| User can access /urunler | ✅ Yes | ☐ |
| No errors in logs | ✅ Clean | ☐ |

---

## 📝 DEPLOYMENT LOG

After deployment, complete this:

**Deployed by:** _____________
**Date:** _____________
**Time:** _____________

**Verification Results:**
- Trigger exists: ☐ Yes ☐ No
- Function SECURITY DEFINER: ☐ Yes ☐ No
- RLS policies allow inserts: ☐ Yes ☐ No
- Test case 1 (approval): ☐ Pass ☐ Fail
- Test case 2 (idempotent): ☐ Pass ☐ Fail
- End-to-end test: ☐ Pass ☐ Fail

**Issues Encountered:** _______________________________________________

**Rollback Required:** ☐ Yes ☐ No

**Final Status:** ☐ DEPLOYED ✅ | ☐ ROLLED BACK ❌

---

**Next Steps After Successful Deployment:**
1. Monitor Supabase logs for 1 hour
2. Test with real user applications
3. Verify no performance impact
4. Update deployment documentation

---

**Prepared By:** Claude Code (Orchestration Mode)
**Version:** 1.0
**Last Updated:** 2026-01-08
