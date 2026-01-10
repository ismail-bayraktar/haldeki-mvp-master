# Security Fix Action Plan - Haldeki.com

> **Status**: 🔴 CRITICAL - Production Deployment Blocked  
> **Created**: 2026-01-09  
> **Target**: Fix 5 CRITICAL + 20 HIGH security vulnerabilities  
> **Timeline**: 7-10 days

---

## Executive Summary

A comprehensive security audit identified **25 vulnerabilities** that must be resolved before production deployment. This document provides an actionable, step-by-step plan to address all issues systematically.

### Risk Severity Breakdown

| Severity | Count | Risk Level | Timeline |
|----------|-------|------------|----------|
| **CRITICAL** | 5 | 🔴 Production blockers | 24-48 hours |
| **HIGH** | 20 | 🟠 Security risks | 7 days |

### Critical Issues Overview

1. **RoleSwitcher Production Exposure** - Admin account takeover risk
2. **Password XOR Encryption** - Password theft via XSS
3. **Cart Price Manipulation** - Financial fraud
4. **IDOR in Order Management** - Data breach
5. **RLS Policy Bypass** - Privilege escalation

---

## Phase 1: Emergency Fixes (24-48 Hours)

> **Objective**: Address all 5 CRITICAL vulnerabilities that block production deployment

---

### Task 1.1: Remove RoleSwitcher from Production

**Severity**: 🔴 CRITICAL  
**File**: `src/components/dev/RoleSwitcher.tsx`  
**Estimated Time**: 15 minutes  
**Owner**: Frontend Developer

#### Problem
The RoleSwitcher component allows quick login with test accounts using hardcoded credentials. While it has a production check at line 22-24, this is insufficient as:

- Test credentials are hardcoded in source (lines 39, 48, 57, etc.)
- Default password is exposed (line 138)
- Component can potentially be bundled in production builds
- Test email addresses are visible in client-side code

#### Solution

**Step 1: Remove RoleSwitcher from App.tsx**

```typescript
// BEFORE: src/App.tsx
import { RoleSwitcher } from '@/components/dev/RoleSwitcher';

// In your component:
<RoleSwitcher />

// AFTER: src/App.tsx
// Remove the import entirely
// Remove <RoleSwitcher /> from JSX
```

**Step 2: Environment-Safe Import Wrapper**

Create new file `src/components/dev/RoleSwitcher.dev.tsx`:

```typescript
// src/components/dev/RoleSwitcher.dev.tsx
// This file should ONLY be imported in development

import { RoleSwitcher } from './RoleSwitcher';

export { RoleSwitcher };
```

**Step 3: Conditional Import in App.tsx**

```typescript
// src/App.tsx
let RoleSwitcherComponent = null;

if (import.meta.env.DEV) {
  // Dynamic import only in development
  RoleSwitcherComponent = lazy(() => import('./components/dev/RoleSwitcher.dev'));
}

// In JSX:
{import.meta.env.DEV && RoleSwitcherComponent && (
  <Suspense fallback={null}>
    <RoleSwitcherComponent />
  </Suspense>
)}
```

#### Verification Steps

- [ ] Build production bundle: `npm run build`
- [ ] Search dist folder for "RoleSwitcher": Should return 0 results
- [ ] Search dist folder for test emails: Should return 0 results
- [ ] Run app in production mode: RoleSwitcher should not appear
- [ ] Test production build locally: Verify no dev tools visible

---

