# Security Fix Summary - Haldeki.com

## Quick Reference Guide

This document provides a condensed version of the full security fix action plan for quick reference during implementation.

---

## Critical Fixes (Phase 1 - 24-48 Hours)

### 1. RoleSwitcher Removal ✅
**File**: `src/components/dev/RoleSwitcher.tsx`  
**Time**: 15 minutes | **Owner**: Frontend Developer

**Actions**:
- Create `src/components/dev/RoleSwitcher.dev.tsx` wrapper
- Update `src/App.tsx` with conditional import
- Create `scripts/check-prod-build.js` validation script
- Update `package.json` build script

**Verification**:
```bash
npm run build
grep -r "RoleSwitcher" dist/  # Should return empty
```

---

### 2. Password Encryption Replacement ✅
**File**: `src/utils/passwordUtils.ts` (lines 65-94)  
**Time**: 2 hours | **Owner**: Backend Developer

**Actions**:
- Remove `encryptPassword`, `decryptPassword`, `storeTemporaryPassword`, `getTemporaryPassword`
- Create `src/lib/passwordReset.ts` with Supabase reset flow
- Update all 9 importing files
- Remove all localStorage password operations

**Verification**:
```bash
npm run build
grep -r "encryptPassword\|temp_password_" dist/  # Should return empty
```

---

### 3. Cart Price Validation ✅
**Files**: `src/contexts/CartContext.tsx`, `src/pages/Checkout.tsx`  
**Time**: 3 hours | **Owner**: Full-Stack Developer

**Actions**:
- Create migration: `supabase/migrations/20260111000000_validate_order_prices.sql`
- Run: `npx supabase db push`
- Update `Checkout.tsx` to use `create_validated_order` RPC
- Add price mismatch warning toast

**Verification**:
```javascript
// Manual test:
// 1. Add product to cart
// 2. Tamper price in localStorage
// 3. Checkout - should use correct server price
```

---

### 4. IDOR Fix in Dashboard ✅
**File**: `src/pages/admin/Dashboard.tsx` (lines 52-56)  
**Time**: 1.5 hours | **Owner**: Backend Developer

**Actions**:
- Add client-side role verification with `useAuth()`
- Implement role-based filtering for warehouse managers
- Test: admin=access, user=blocked, warehouse=regions only

**Verification**:
```javascript
// Test as regular user - should redirect to home
// Test as warehouse manager - should see only assigned regions
```

---

### 5. RLS Policy Hardening ✅
**File**: `src/contexts/AuthContext.tsx` (lines 114-132)  
**Database**: `public.user_roles`  
**Time**: 2 hours | **Owner**: Database Architect + Backend Developer

**Actions**:
- Create migration: `supabase/migrations/20260111000002_force_user_roles_rls.sql`
- Apply `FORCE ROW LEVEL SECURITY`
- Create `get_user_roles` RPC with access control
- Update `AuthContext.tsx` to use secure RPC

**Verification**:
```bash
psql $DATABASE_URL -c "
SELECT tablename, rowsecurity, forcerowsecurity 
FROM pg_tables WHERE tablename = 'user_roles';"
```

---

## High Priority Fixes (Phase 2 - Days 1-7)

### Day 1-2: RLS Policy Fixes
- [ ] Audit all RLS policies (4h)
- [ ] Enable RLS on: `supplier_products`, `region_products`, `dealers`, `suppliers`, `businesses` (6h)
- [ ] Add RLS policies for: `product_variations`, `warehouse_staff`, `admin_audit_log` (4h)

### Day 3-4: Rate Limiting
- [ ] Create `rate_limit` table and check function (6h)
- [ ] Implement user-based rate limiting with backoff (4h)
- [ ] Create monitoring dashboard and alerts (4h)

### Day 5-6: Credential Cleanup
- [ ] Remove all hardcoded API keys to env vars (3h)
- [ ] Remove test credentials from source (2h)
- [ ] Verify no hardcoded connection strings (2h)

### Day 7: Testing
- [ ] Run automated security scans (6h)
- [ ] Conduct penetration testing (4h)
- [ ] Performance testing with RLS (4h)

---

## Deployment Checklist

### Pre-Deployment
```bash
# 1. Database backup
npx supabase db dump -f backup-before-security-fixes.sql

# 2. Test migrations in staging
npx supabase db push

# 3. Create git tag
git tag -a v1.3.0-security-fixes -m "Security fixes"
git push origin v1.3.0-security-fixes
```

### Deployment
```bash
# 1. Build with security checks
npm run build

# 2. Verify no test code
node scripts/check-prod-build.js

# 3. Deploy
npm run deploy

# 4. Smoke tests
curl https://haldeki.com/health
curl https://haldeki.com/api/health
```

### Post-Deployment
- [ ] Test login flow
- [ ] Test admin panel
- [ ] Test order creation with price validation
- [ ] Monitor error logs for 1 hour
- [ ] Check RLS violation alerts

---

## Rollback Plan

### If Migration Fails
```bash
psql $DATABASE_URL < backup-before-security-fixes.sql
```

### If Application Fails
```bash
git checkout tags/v1.2.3
npm run build
npm run deploy
```

---

## Team Contacts

| Role | Name | Contact |
|------|------|---------|
| Project Manager | - | - |
| Frontend Developer | - | - |
| Backend Developer | - | - |
| Database Architect | - | - |
| DevOps Engineer | - | - |

---

## Success Metrics

- [ ] 5 CRITICAL vulnerabilities resolved
- [ ] 20 HIGH vulnerabilities resolved
- [ ] No hardcoded credentials in production
- [ ] Server-side price validation active
- [ ] RLS policies enforced
- [ ] Production deployment successful

---

**Document Status**: 🟢 Ready for Implementation  
**Last Updated**: 2026-01-09  
**Full Plan**: See `SECURITY_FIX_ACTION_PLAN.md`
