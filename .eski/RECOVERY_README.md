# User Recovery Instructions

## Current Status

All users have been deleted from the production database. Follow these steps to recover critical accounts.

## Verification

Run this command to check current state:

```bash
npm run auth:verify
```

Output shows:
- 0 users in database
- 0 profiles
- All critical accounts missing

## Recovery Steps

### Step 1: Get Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `epuhjrdqotyrryvkjnrp`
3. Go to Settings → API
4. Copy the `service_role` key (NOT the anon key)
5. Add to `.env` file:

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 2: Execute Recovery SQL

1. In Supabase Dashboard, go to SQL Editor
2. Create a new query
3. Copy the contents of:
   ```
   supabase/migrations/20260109200000_emergency_user_recreation.sql
   ```
4. Paste into SQL Editor
5. Click "Run"
6. Save the displayed credentials

### Step 3: Verify Recovery

```bash
npm run auth:verify
```

Expected output:
- 3 users exist
- All have profiles
- All have roles assigned

## Recovered Accounts

### 1. Production Superadmin
- Email: `admin@haldeki.com`
- Password: `AdminRecovery2025!`
- Role: superadmin

### 2. Test Superadmin
- Email: `superadmin@test.haldeki.com`
- Password: `TestSuperAdmin2025!`
- Role: superadmin

### 3. Test Supplier
- Email: `supplier-approved@test.haldeki.com`
- Password: `TestSupplier2025!`
- Role: supplier
- Company: Toroslu Çiftliği

## Immediate Actions

1. Login to admin panel
2. CHANGE ALL PASSWORDS
3. Enable MFA
4. Test all functionality
5. Remove recovery script from git history

## Password Hashing

To generate new bcrypt hashes:

```bash
npm run auth:hash "NewSecurePassword123!"
```

## Additional Resources

- Full recovery guide: `EMERGENCY_RECOVERY_GUIDE.md`
- Verification script: `scripts/verify-auth-system.ts`
- Hash generator: `scripts/generate-bcrypt-hash.ts`
