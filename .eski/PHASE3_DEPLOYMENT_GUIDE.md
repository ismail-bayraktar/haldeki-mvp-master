# Phase 3 Deployment Guide
## Whitelist Role Assignment Trigger

**Migration:** `20260110120000_whitelist_role_trigger.sql`
**Purpose:** Auto-assign 'user' role when whitelist application is approved

---

## Prerequisites

- Supabase project access
- Admin privileges (for function creation with SECURITY DEFINER)
- Backup of current database (recommended)

---

## Deployment Options

### Option 1: Supabase Dashboard (Recommended for quick deployment)

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy contents of `supabase/migrations/20260110120000_whitelist_role_trigger.sql`
6. Paste into SQL Editor
7. Click **Run** (or press `Ctrl+Enter`)
8. Check for success message

**Verify deployment:**
```sql
-- Run this verification query
SELECT tgname AS trigger_name, tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'on_whitelist_approved';
```

---

### Option 2: Supabase CLI (Recommended for production)

**Step 1: Install Supabase CLI (if not installed)**
```bash
npm install -g supabase
```

**Step 2: Link to your project**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**Step 3: Deploy migration**
```bash
npx supabase db push
```

**Step 4: Verify deployment**
```bash
# Run verification script
npx supabase db remote commit --schema public
```

---

## Post-Deployment Verification

### 1. Check Trigger Status

```sql
SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
  END AS status
FROM pg_trigger
WHERE tgname = 'on_whitelist_approved';
```

**Expected Result:** 1 row, status = 'ENABLED'

---

### 2. Check Function Security

```sql
SELECT
  proname AS function_name,
  prosecdef AS security_definer
FROM pg_proc
WHERE proname = 'assign_user_role_on_approval';
```

**Expected Result:** security_definer = true (enables RLS bypass)

---

### 3. Check RLS Policies

```sql
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'user_roles';
```

**Expected Result:** Policies allowing inserts (for trigger)

---

## Testing

### Manual Test

1. Create a test user with phone number
2. Create pending whitelist application
3. Approve the application
4. Verify role is assigned in `user_roles` table

```sql
-- Quick test
DO $$
DECLARE
  test_user_id UUID;
  test_phone TEXT := '+905550000000';
BEGIN
  -- Create test user
  INSERT INTO public.users (id, phone, name, created_at)
  VALUES (gen_random_uuid(), test_phone, 'Trigger Test', NOW())
  ON CONFLICT (phone) DO NOTHING;

  -- Create application
  INSERT INTO public.whitelist_applications (phone, status, created_at)
  VALUES (test_phone, 'pending', NOW())
  ON CONFLICT (phone) DO NOTHING;

  -- Approve (triggers role assignment)
  UPDATE public.whitelist_applications
  SET status = 'approved'
  WHERE phone = test_phone;

  -- Verify
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.phone = test_phone AND ur.role = 'user'
  ) THEN
    RAISE NOTICE 'SUCCESS: Trigger works!';
  ELSE
    RAISE NOTICE 'FAILED: Trigger did not assign role';
  END IF;

  -- Cleanup
  DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM public.users WHERE phone = test_phone);
  DELETE FROM public.whitelist_applications WHERE phone = test_phone;
  DELETE FROM public.users WHERE phone = test_phone;
END $$;
```

---

## Troubleshooting

### Issue: Trigger not found

**Solution:** Migration not deployed. Run deployment steps above.

---

### Issue: Permission denied

**Solution:** Ensure you have admin privileges. The function requires SECURITY DEFINER which needs elevated permissions.

---

### Issue: Role not assigned

**Check:**
1. User exists with matching phone number
2. Application status actually changed to 'approved'
3. User doesn't already have 'user' role

```sql
-- Debug query
SELECT
  u.id AS user_id,
  u.phone,
  u.name,
  wa.status AS whitelist_status,
  ur.role AS current_role
FROM public.users u
LEFT JOIN public.whitelist_applications wa ON u.phone = wa.phone
LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.role = 'user'
ORDER BY u.created_at DESC;
```

---

### Issue: Function creates duplicate roles

**Solution:** Migration has idempotency built in (`ON CONFLICT DO NOTHING`). If you see duplicates, there may be another issue.

---

## Rollback

If needed, remove the trigger:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS on_whitelist_approved ON public.whitelist_applications;

-- Remove function
DROP FUNCTION IF EXISTS public.assign_user_role_on_approval();
```

**Note:** This does not remove already-assigned roles. To clean up:

```sql
-- Remove roles assigned by trigger (after X date)
DELETE FROM public.user_roles
WHERE role = 'user'
AND created_at > '2026-01-08';
```

---

## Security Notes

1. **SECURITY DEFINER:** Function runs with elevated privileges to bypass RLS
2. **Idempotent:** Multiple approvals won't create duplicate roles
3. **One-way:** Trigger only assigns roles, never removes them
4. **Phone matching:** Links applications to users via phone number

---

## Files Reference

- **Migration:** `supabase/migrations/20260110120000_whitelist_role_trigger.sql`
- **Verification:** `scripts/verify-phase3-trigger.sql`
- **Test Suite:** `scripts/test-phase3-role-assignment.sql`
