# Supply Chain E2E Testing - Quick Reference Guide

## Quick Start

### Windows Users
```cmd
run-supply-chain-tests.bat
```

### Linux/Mac Users
```bash
chmod +x run-supply-chain-tests.sh
./run-supply-chain-tests.sh
```

## Manual Test Execution

### Run All Tests
```bash
# Supplier + Warehouse (306 tests)
npx playwright test tests/e2e/supplier/ tests/e2e/warehouse/

# Supplier only (126 tests)
npx playwright test tests/e2e/supplier/supplier-workflow.spec.ts

# Warehouse only (180 tests)
npx playwright test tests/e2e/warehouse/warehouse-workflow.spec.ts
```

### Run Specific Categories
```bash
# Authentication tests
npx playwright test tests/e2e/ --grep "Authentication"

# Security tests (Access Control)
npx playwright test tests/e2e/ --grep "Access Control"

# Product management
npx playwright test tests/e2e/supplier/ --grep "Product Management"

# Picking list
npx playwright test tests/e2e/warehouse/ --grep "Picking List"

# Inventory management
npx playwright test tests/e2e/warehouse/ --grep "Inventory Management"
```

### Run with Specific Browser
```bash
# Chromium only
npx playwright test tests/e2e/supplier/ --project=chromium

# Firefox only
npx playwright test tests/e2e/warehouse/ --project=firefox

# WebKit (Safari) only
npx playwright test tests/e2e/ --project=webkit
```

### Debug Mode
```bash
# Run with headed browser
npx playwright test tests/e2e/supplier/ --headed

# Run with debug mode (step through)
npx playwright test tests/e2e/warehouse/ --debug

# Run single test
npx playwright test tests/e2e/supplier/supplier-workflow.spec.ts:33
```

### View Results
```bash
# HTML Report
npx playwright show-report playwright-report

# List all tests
npx playwright test tests/e2e/supplier/ --list

# Run with specific reporter
npx playwright test tests/e2e/ --reporter=line
npx playwright test tests/e2e/ --reporter=json
```

## Test Credentials

### Supplier User
```
Email: test-supplier@haldeki.com
Password: Test123!
Role: supplier
```

### Warehouse Manager
```
Email: test-warehouse@haldeki.com
Password: Test123!
Role: warehouse_manager
```

## Test Structure

### Supplier Tests (126 total)
- Authentication & Dashboard (9 tests)
- Dashboard Overview (6 tests)
- Product Management (15 tests)
- Product Variations (4 tests)
- Import/Export (7 tests)
- Order Management (5 tests)
- Sales Reports (3 tests)
- Settings & Profile (2 tests)
- Access Control (3 tests)
- Logout (1 test)

### Warehouse Tests (180 total)
- Authentication & Dashboard (9 tests)
- Dashboard Overview (6 tests)
- Order Management (7 tests)
- Picking List (9 tests)
- Inventory Management (9 tests)
- Order Fulfillment (3 tests)
- Reports & Analytics (3 tests)
- Settings & Profile (2 tests)
- Access Control (4 tests)
- Logout (1 test)

## Critical Security Tests

### Warehouse Price Security
**P0 Requirement:** Warehouse staff must NOT see product prices.

Test location: `tests/e2e/warehouse/warehouse-workflow.spec.ts`
Test suite: "Access Control" category

Verification:
```typescript
// Warehouse CANNOT access supplier panel
await page.goto('/tedarikci');
await expect(page).not.toHaveURL('/tedarikci');
```

### Access Control Tests
- Supplier cannot access admin panel
- Supplier cannot access dealer panel
- Supplier cannot access warehouse panel
- Warehouse cannot access admin panel
- Warehouse cannot access dealer panel
- Warehouse cannot access supplier panel
- Warehouse cannot access business panel

## Troubleshooting

### Tests Not Running
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Dev Server Not Starting
```bash
# Start dev server manually
npm run dev

# Run tests against existing server
npx playwright test --no-web-server
```

### Tests Timing Out
```bash
# Increase timeout
npx playwright test --timeout=60000

# Run single test for debugging
npx playwright test tests/e2e/supplier/supplier-workflow.spec.ts:33 --headed
```

### Test Data Issues
```bash
# Check test users exist
# Run migration to create test users
# See: SUPPLIER_PANEL_TEST_REPORT.md
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Supply Chain Tests
  run: |
    npx playwright install-deps
    npx playwright install
    npx playwright test tests/e2e/supplier/ tests/e2e/warehouse/
```

### Docker
```bash
docker run -it --rm \
  -v $(pwd):/work \
  -w /work \
  mcr.microsoft.com/playwright:v1.40.0 \
  npx playwright test tests/e2e/supplier/ tests/e2e/warehouse/
```

## Test Reports

### HTML Report
After test run:
```bash
npx playwright show-report playwright-report
```

### JUnit Report
Generated at: `test-results/junit.xml`

### Video Recordings
Located at: `test-results/videos/`
Only for failed tests (config: `video: 'retain-on-failure'`)

### Screenshots
Located at: `test-results/screenshots/`
Only for failures (config: `screenshot: 'only-on-failure'`)

## Best Practices

1. **Run tests frequently** during development
2. **Use data-testid** selectors for stability
3. **Wait for elements** using Playwright auto-wait
4. **Avoid hard-coded waits** (use waitForSelector)
5. **Test behavior, not implementation**
6. **Keep tests isolated** (independent)
7. **One assertion per test** (ideally)
8. **Use descriptive test names** (should do X when Y)

## Support & Documentation

- Playwright Docs: https://playwright.dev
- Test Report: `TEST_RESULTS_SUPPLY_CHAIN.md`
- Test Files: `tests/e2e/supplier/` and `tests/e2e/warehouse/`
- Helper Functions: `tests/helpers/`

---

**Last Updated:** 2026-01-09
**Test Framework:** Playwright
**Total Tests:** 306 (126 Supplier + 180 Warehouse)
