# Pricing System Test Checklist
# Fiyatlandırma Sistemi Test Kontrol Listesi

## Overview

This checklist ensures the pricing system is ready for production deployment after the redesign.

## Pre-Deployment Checklist

### 1. TypeScript Compilation
- [ ] Run `npm run typecheck`
- [ ] No type errors
- [ ] All types properly exported

**Command:**
```bash
npm run typecheck
```

### 2. ESLint Validation
- [ ] Run `npm run lint`
- [ ] No linting errors
- [ ] Code follows clean code principles

**Command:**
```bash
npm run lint
```

### 3. Unit Tests (Vitest)
- [ ] Price calculation logic tests pass
- [ ] Commission rate tests pass (B2B %30, B2C %50)
- [ ] Regional multiplier tests pass
- [ ] Variation adjustment tests pass
- [ ] Validation tests pass
- [ ] Display helper tests pass

**Coverage Target: >80%**

**Command:**
```bash
npm run test:unit:coverage -- tests/unit/pricing-calculation.test.ts
```

### 4. Integration Tests
- [ ] `calculate_product_price` RPC works
- [ ] `calculate_cart_prices` RPC works
- [ ] `get_product_suppliers` RPC works
- [ ] RLS policies enforced correctly
- [ ] B2B vs B2C pricing separation works

**Command:**
```bash
npm run test:unit -- tests/integration/pricing-rpc.test.ts
```

### 5. E2E Tests (Playwright)
- [ ] Customer browsing products
- [ ] Product detail page displays prices
- [ ] Add to cart with correct price
- [ ] Cart total calculation
- [ ] Checkout preserves prices
- [ ] B2B pricing visible to business customers
- [ ] B2C pricing visible to regular customers

**Command:**
```bash
npm run test:e2e -- tests/e2e/pricing-user-flow.spec.ts
```

### 6. Security Tests
- [ ] B2B prices not exposed to B2C users
- [ ] Price manipulation attempts blocked
- [ ] SQL injection tests pass
- [ ] Authorization bypass tests pass
- [ ] RLS policies prevent unauthorized access
- [ ] No sensitive data leakage

**Command:**
```bash
npm run test:unit -- tests/security/pricing-security.test.ts
```

### 7. Performance Tests
- [ ] Single price calculation <200ms
- [ ] Price with variation <300ms
- [ ] Price with supplier <250ms
- [ ] 10 concurrent requests <2000ms
- [ ] Bulk 20 products <5000ms
- [ ] Cart with 10 items <3000ms

**Command:**
```bash
npm run test:unit -- tests/performance/pricing-performance.test.ts
```

### 8. Migration Tests
- [ ] Data integrity verified
- [ ] Old vs new price comparison passes
- [ ] Rollback functionality tested
- [ ] Foreign key constraints valid
- [ ] Data types consistent

**Command:**
```bash
npm run test:unit -- tests/migration/pricing-migration.test.ts
```

## Test Execution Order

Run tests in this order for fastest feedback:

1. **TypeCheck & Lint** (Fast, <1 minute)
   ```bash
   npm run typecheck && npm run lint
   ```

2. **Unit Tests** (Fast, <2 minutes)
   ```bash
   npm run test:unit:coverage
   ```

3. **Integration Tests** (Medium, <5 minutes)
   ```bash
   npm run test:unit -- tests/integration/
   ```

4. **Security & Performance Tests** (Medium, <10 minutes)
   ```bash
   npm run test:unit -- tests/security/ && npm run test:unit -- tests/performance/
   ```

5. **E2E Tests** (Slow, <15 minutes)
   ```bash
   npm run test:e2e -- tests/e2e/pricing-user-flow.spec.ts
   ```

## Running All Tests

Use the provided script to run all tests:

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/test-pricing-system.sh

# Run all tests
./scripts/test-pricing-system.sh

# Run with coverage
./scripts/test-pricing-system.sh --coverage

# Run specific test suite
./scripts/test-pricing-system.sh --unit
./scripts/test-pricing-system.sh --integration
./scripts/test-pricing-system.sh --e2e
./scripts/test-pricing-system.sh --security
./scripts/test-pricing-system.sh --performance
./scripts/test-pricing-system.sh --migration
```

## Required Environment Variables

Set these before running tests:

```bash
# Supabase Configuration
export VITE_SUPABASE_URL="your-supabase-url"
export VITE_SUPABASE_ANON_KEY="your-anon-key"
export VITE_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"  # For migration tests only

# Test Data
export TEST_REGION_ID="marmara-region"
export TEST_PRODUCT_ID="your-test-product-id"
export TEST_SUPPLIER_ID="your-test-supplier-id"

# E2E Tests
export PLAYWRIGHT_TEST_BASE_URL="http://localhost:5173"

# Test Users
export TEST_B2B_EMAIL="test-business@haldeki.com"
export TEST_B2B_PASSWORD="Test123!"
export TEST_B2C_EMAIL="test-customer@haldeki.com"
export TEST_B2C_PASSWORD="Test123!"
```

## Success Criteria

A deployment is ready when:

1. ✅ All TypeScript errors fixed
2. ✅ All linting errors fixed
3. ✅ Unit tests pass with >80% coverage
4. ✅ Integration tests pass
5. ✅ E2E tests pass
6. ✅ Security tests pass
7. ✅ Performance benchmarks met
8. ✅ Migration tests pass
9. ✅ No critical bugs found

## Test Reports

After running tests, review these reports:

1. **Coverage Report:** `coverage/index.html`
2. **E2E Report:** `playwright-report/index.html`
3. **Terminal Output:** Check for failed tests

## Troubleshooting

### Tests Failing

If tests fail:

1. Check test output for error messages
2. Verify environment variables are set
3. Ensure database is accessible
4. Check test data exists
5. Review recent code changes

### Coverage Below 80%

If coverage is below target:

1. Run `npm run test:unit:coverage`
2. Open `coverage/index.html`
3. Find uncovered files (red)
4. Add tests for uncovered code
5. Re-run coverage check

### E2E Tests Flaky

If E2E tests are inconsistent:

1. Check network connectivity
2. Verify dev server is running
3. Increase timeout values
4. Check for race conditions
5. Use more specific selectors

## Post-Deployment Verification

After deployment, verify:

1. **Prices are correct** on production
2. **B2B/B2C pricing** works as expected
3. **Regional pricing** applies correctly
4. **Variation prices** calculate properly
5. **Cart totals** are accurate
6. **No errors** in browser console
7. **No errors** in server logs
8. **Performance** is acceptable

## Rollback Plan

If critical issues found after deployment:

1. Stop traffic to new pricing system
2. Revert database migrations
3. Restore previous code version
4. Verify old system works
5. Investigate root cause
6. Fix issues
7. Test thoroughly
8. Retry deployment

## Contact

For questions or issues:
- Developer: [Your Name]
- Database Architect: [DBA Contact]
- DevOps: [DevOps Contact]
