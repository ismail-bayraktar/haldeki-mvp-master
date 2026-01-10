# Password Reset - Quick Reference Card

> **Print this for quick access during password reset**

---

## URLs (Click to Open)

### Supabase
- [Auth Users](https://app.supabase.com/project/epuhjrdqotyrryvkjnrp/auth/users) - Reset passwords here
- [SQL Editor](https://app.supabase.com/project/epuhjrdqotyrryvkjnrp/sql/new) - Run diagnostics
- [API Keys](https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/settings/api) - Get service role key

### Application
- [Login Page](https://haldeki-market.vercel.app/login) - Test login here
- [Home](https://haldeki-market.vercel.app) - Application home

### Deployment
- [Vercel Dashboard](https://vercel.com/ismail-bayraktar/haldeki-market) - Check deployment status
- [GitHub Repo](https://github.com/ismail-bayraktar/haldeki-mvp-master) - View source

---

## Credentials

Copy these passwords exactly:

```
admin@haldeki.com
Password: HaldekiAdmin2025!

superadmin@test.haldeki.com
Password: HaldekiSuper2025!

supplier-approved@test.haldeki.com
Password: HaldekiSupplier2025!
```

---

## Commands

### Reset Passwords (Automated)
```bash
npm run auth:reset
```

### Verify Login
```bash
npm run auth:reset:verify
```

### Interactive Reset
```bash
npm run auth:reset:interactive
```

---

## Step-by-Step

### Method 1: Supabase Dashboard (Recommended)

1. **Open:** https://app.supabase.com/project/epuhjrdqotyrryvkjnrp/auth/users

2. **For each user:**
   - Click user email
   - Click "Reset Password"
   - Paste password (see above)
   - Click "Save"

3. **Verify:**
   ```bash
   npm run auth:reset:verify
   ```

4. **Test:**
   - Go to https://haldeki-market.vercel.app/login
   - Login with each credential
   - Verify access works

### Method 2: Automated Script

1. **Set service role key:**
   ```bash
   # In .env.local
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-key-here
   ```

2. **Run reset:**
   ```bash
   npm run auth:reset
   ```

3. **Verify:**
   ```bash
   npm run auth:reset:verify
   ```

---

## Expected Verification Output

```
✅ admin@haldeki.com: SUCCESS
✅ superadmin@test.haldeki.com: SUCCESS
✅ supplier-approved@test.haldeki.com: SUCCESS

Success: 3/3
All users can log in successfully!
```

---

## Troubleshooting

### Error: "Invalid credentials"
- Check password spelling (case-sensitive)
- Ensure password was reset via Dashboard, not SQL
- Verify email is confirmed

### Error: "API key not found"
- Check `.env.local` exists
- Verify variable name: `VITE_SUPABASE_SERVICE_ROLE_KEY`
- Use `service_role`, not `anon` key

### Error: "User not found"
- Verify email spelling
- Check user exists in Supabase Dashboard
- Ensure user is not deleted

---

## Security Checklist

After successful login:
- [ ] Change all passwords
- [ ] Enable MFA for admins
- [ ] Review audit logs
- [ ] Update test suites
- [ ] Document credentials

---

## Documentation Links

- **Full Guide:** `docs/PASSWORD_RESET_USER_GUIDE.md`
- **Technical:** `docs/AUTH_400_ERROR_FIX.md`
- **Summary:** `PASSWORD_RESET_FINAL_SUMMARY.md`
- **Deployment:** `DEPLOYMENT_VERIFICATION.md`

---

## Support

- **Commit Hash:** d9d2419
- **Branch:** main
- **Date:** 2026-01-09
- **Status:** Complete

---

**Quick Reference v1.0 - 2026-01-09**
