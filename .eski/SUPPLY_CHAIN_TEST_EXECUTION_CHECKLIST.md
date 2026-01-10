# Supply Chain Test Execution Checklist

## Pre-Test Setup

### Environment Verification
- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] Dev server can start (`npm run dev`)
- [ ] Database is running
- [ ] Environment variables configured

### Test Data Setup
- [ ] Test supplier user exists (`test-supplier@haldeki.com`)
- [ ] Test warehouse user exists (`test-warehouse@haldeki.com`)
- [ ] Test products created
- [ ] Test orders in various states
- [ ] Product variations configured

### Database Migration
- [ ] Run test user creation migration
- [ ] Verify RLS policies enabled
- [ ] Verify test user roles assigned
- [ ] Verify test data seeded

## Test Execution

### Phase 1: Supplier Workflow Tests (126 tests)

#### Authentication & Dashboard (9 tests)
- [ ] Login successful
- [ ] Dashboard accessible
- [ ] Navigation visible
- [ ] Business name displayed

#### Product Management (15 tests)
- [ ] Display products
- [ ] Add simple product
- [ ] Add product with variations
- [ ] Edit product
- [ ] Update stock inline
- [ ] Update price inline
- [ ] Toggle status
- [ ] Delete product
- [ ] Filter by category
- [ ] Filter by status
- [ ] Search by name

#### Import/Export (7 tests)
- [ ] Display import/export options
- [ ] Download CSV template
- [ ] Download Excel template
- [ ] Export to CSV
- [ ] Export to Excel
- [ ] Import from CSV
- [ ] Import from Excel

#### Order Management (5 tests)
- [ ] Display incoming orders
- [ ] View order details
- [ ] Filter by status
- [ ] Search by customer

#### Access Control (3 tests) - CRITICAL
- [ ] Cannot access admin panel
- [ ] Cannot access dealer panel
- [ ] Cannot access warehouse panel

### Phase 2: Warehouse Workflow Tests (180 tests)

#### Authentication & Dashboard (9 tests)
- [ ] Login successful
- [ ] Dashboard accessible
- [ ] Navigation visible
- [ ] Warehouse name displayed

#### Order Management (7 tests)
- [ ] Display all marketplace orders
- [ ] View order details
- [ ] Filter by fulfillment status
- [ ] Filter by delivery slot
- [ ] Search by order ID
- [ ] Sort by priority

#### Picking List (9 tests)
- [ ] Display picking list
- [ ] Items grouped by location
- [ ] Mark item as picked
- [ ] Mark multiple items in batch
- [ ] View picking progress
- [ ] Complete picking for order
- [ ] Print picking list
- [ ] Filter by delivery slot

#### Inventory Management (9 tests)
- [ ] Display warehouse inventory
- [ ] View inventory details
- [ ] Update stock level
- [ ] Filter by low stock
- [ ] Filter by category
- [ ] Search by product name
- [ ] View stock movement history
- [ ] Add stock to inventory

#### Order Fulfillment (3 tests)
- [ ] Update to ready for pickup
- [ ] Update to out for delivery
- [ ] Mark as delivered

#### Access Control (4 tests) - SECURITY P0
- [ ] Cannot access admin panel
- [ ] Cannot access dealer panel
- [ ] Cannot access supplier panel (PRICE PRIVACY)
- [ ] Cannot access business panel

## Post-Test Verification

### Test Results Review
- [ ] All tests passed (or review failures)
- [ ] HTML report generated
- [ ] Screenshots captured (if failures)
- [ ] Videos recorded (if failures)
- [ ] JUnit XML generated

### Security Verification
- [ ] Warehouse staff cannot see prices
- [ ] Supplier cannot access warehouse data
- [ ] Warehouse cannot access supplier pricing
- [ ] Role isolation working correctly

### Performance Verification
- [ ] Test execution time acceptable
- [ ] No excessive waits/timeouts
- [ ] All tests completed within timeout

## Test Artifacts

### Generated Files
- [ ] `playwright-report/index.html` - HTML report
- [ ] `test-results/junit.xml` - JUnit report
- [ ] `test-results/screenshots/` - Failure screenshots
- [ ] `test-results/videos/` - Failure videos

### Documentation
- [ ] `TEST_RESULTS_SUPPLY_CHAIN.md` - Detailed results
- [ ] `SUPPLY_CHAIN_TEST_QUICK_REFERENCE.md` - Quick reference
- [ ] `SUPPLY_CHAIN_TEST_MATRIX.md` - Test coverage matrix

## Troubleshooting Guide

### Common Issues

#### Tests Not Running
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

#### Login Failures
```bash
# Verify test users exist in database
# Check migration executed
# Verify passwords: Test123!
```

#### Dev Server Issues
```bash
# Start dev server manually
npm run dev

# Or run tests without webServer
npx playwright test --no-web-server
```

#### Timeout Errors
```bash
# Increase timeout
npx playwright test --timeout=60000

# Run single test
npx playwright test tests/e2e/supplier/supplier-workflow.spec.ts:33
```

#### Missing Test Data
```bash
# Run seed data script
# Create test products
# Create test orders
```

## Quick Commands

### Run All Tests
```bash
npx playwright test tests/e2e/supplier/ tests/e2e/warehouse/
```

### Run Supplier Only
```bash
npx playwright test tests/e2e/supplier/
```

### Run Warehouse Only
```bash
npx playwright test tests/e2e/warehouse/
```

### Security Tests Only
```bash
npx playwright test tests/e2e/ --grep "Access Control"
```

### Critical Path Only
```bash
npx playwright test tests/e2e/ --grep "Authentication|Product Management|Picking|Fulfillment"
```

### View HTML Report
```bash
npx playwright show-report playwright-report
```

## Test Execution Scripts

### Windows
```cmd
run-supply-chain-tests.bat
```

### Linux/Mac
```bash
chmod +x run-supply-chain-tests.sh
./run-supply-chain-tests.sh
```

## Success Criteria

### Must Pass (P0)
- [ ] Authentication for both roles
- [ ] Supplier can manage products
- [ ] Warehouse can manage picking
- [ ] Access control enforced
- [ ] Warehouse cannot see prices

### Should Pass (P1)
- [ ] Import/Export functionality
- [ ] Order management
- [ ] Inventory management
- [ ] Order fulfillment

### Nice to Have (P2)
- [ ] Reports generation
- [ ] Settings updates
- [ ] Advanced filtering

## Sign-off

### Test Execution
- [ ] Tests executed by: _______________
- [ ] Date: _______________
- [ ] Environment: _______________

### Results Summary
- [ ] Total tests: 306
- [ ] Passed: _____
- [ ] Failed: _____
- [ ] Skipped: _____

### Approval
- [ ] Reviewed by: _______________
- [ ] Approved by: _______________
- [ ] Date: _______________

---

## Emergency Contacts

### Test Infrastructure Issues
- Database problems: Check migration logs
- Server issues: Check `npm run dev` output
- Test failures: Check Playwright report

### Resources
- Playwright docs: https://playwright.dev
- Test files: `tests/e2e/supplier/` and `tests/e2e/warehouse/`
- Helper files: `tests/helpers/`

---

**Last Updated:** 2026-01-09
**Version:** 1.0
**Status:** Ready for Execution
