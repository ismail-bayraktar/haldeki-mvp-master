# E2E Test Suite for Haldeki Marketplace

Comprehensive Playwright E2E tests covering all 7 user roles and their main workflows.

## Test Structure

```
tests/e2e/
├── auth/
│   ├── login.spec.ts              # Basic login tests
│   ├── registration.spec.ts       # Registration flow tests
│   ├── whitelist-login.spec.ts    # Whitelist application flow
│   └── role-login.spec.ts         # All 7 roles login tests
├── customer/
│   └── customer-workflow.spec.ts  # Customer journey (browse, cart, checkout)
├── admin/
│   ├── admin-workflow.spec.ts     # Admin management (users, products, orders)
│   └── admin-approval.spec.ts     # Whitelist approval workflows
├── supplier/
│   └── supplier-workflow.spec.ts  # Supplier product & inventory management
├── dealer/
│   └── dealer-workflow.spec.ts    # Dealer bulk ordering & customer management
├── business/
│   └── business-workflow.spec.ts  # Business/restaurant ordering & invoices
├── warehouse/
│   └── warehouse-workflow.spec.ts # Warehouse picking, fulfillment & inventory
├── checkout/
│   └── checkout-flow.spec.ts      # Checkout process tests
├── personas/
│   └── test-data.ts               # Test user credentials & data
├── setup.ts                       # Global test setup
├── teardown.ts                    # Global test teardown
└── README.md                      # This file
```

## User Roles

### 1. Customer (user)
**Capabilities:**
- Browse products and categories
- Add products to cart
- Manage cart (update quantities, remove items)
- Checkout with address and delivery slot selection
- View order history
- Add to wishlist
- Compare products

**Dashboard:** `/hesabim`

### 2. Admin
**Capabilities:**
- View dashboard with analytics
- Manage whitelist applications (approve/reject)
- Manage users (view, edit, deactivate)
- Manage products (add, edit, deactivate)
- Manage orders (view, update status)
- View dealers, suppliers, businesses
- Manage regions and categories

**Dashboard:** `/admin`

### 3. SuperAdmin
**Capabilities:**
- All admin capabilities plus:
- Full system access
- User role management
- System configuration

**Dashboard:** `/admin`

### 4. Dealer
**Capabilities:**
- Browse products with dealer pricing
- Place bulk orders for customers
- Manage customer list
- View order history
- Track commissions/earnings

**Dashboard:** `/bayi`

### 5. Supplier
**Capabilities:**
- Manage products (add, edit, deactivate)
- Update stock and pricing
- View incoming orders
- Import/export products via CSV/Excel
- Manage product variations
- View sales reports

**Dashboard:** `/tedarikci`

### 6. Business (Restaurant)
**Capabilities:**
- Browse products with business pricing (10% discount)
- Place orders with invoice payment option
- Repeat previous orders quickly
- View order history
- Manage multiple delivery addresses
- Tax invoice support

**Dashboard:** `/isletme`

### 7. Warehouse Manager
**Capabilities:**
- View picking lists
- Update order picking status
- Manage warehouse inventory
- Process order fulfillment
- View all orders across marketplace
- Generate inventory reports

**Dashboard:** `/depo`

## Test Data

Test user credentials are defined in `tests/e2e/personas/test-data.ts`:

```typescript
export const TEST_USERS = {
  superadmin: {
    email: 'test-superadmin@haldeki.com',
    password: 'Test123!',
  },
  admin: {
    email: 'test-admin@haldeki.com',
    password: 'Test123!',
  },
  dealer: {
    email: 'test-dealer@haldeki.com',
    password: 'Test123!',
  },
  supplier: {
    email: 'test-supplier@haldeki.com',
    password: 'Test123!',
  },
  business: {
    email: 'test-business@haldeki.com',
    password: 'Test123!',
  },
  warehouse_manager: {
    email: 'test-warehouse@haldeki.com',
    password: 'Test123!',
  },
  customer: {
    email: 'test-customer@haldeki.com',
    password: 'Test123!',
  },
};
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test tests/e2e/auth/role-login.spec.ts
```

### Run tests for specific role
```bash
npx playwright test tests/e2e/customer/
npx playwright test tests/e2e/admin/
npx playwright test tests/e2e/supplier/
```

### Run tests in headed mode
```bash
npx playwright test --headed
```

### Run tests with UI
```bash
npx playwright test --ui
```

### Debug tests
```bash
npx playwright test --debug
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Coverage Summary

### Customer Workflow (17 test suites)
- Authentication & Access
- Product Browsing
- Cart Management
- Checkout Process
- Order Management
- Wishlist & Compare
- Account Management
- Logout
- Access Control

### Admin Workflow (12 test suites)
- Authentication & Access
- Dashboard Overview
- Whitelist Management
- User Management
- Product Management
- Order Management
- Dealer Management
- Supplier Management
- Business Management
- Reports & Analytics
- Logout

### Supplier Workflow (9 test suites)
- Authentication & Dashboard Access
- Dashboard Overview
- Product Management
- Product Variations Management
- Import/Export Products
- Order Management
- Sales Reports
- Settings & Profile
- Access Control
- Logout

### Dealer Workflow (9 test suites)
- Authentication & Dashboard Access
- Dashboard Overview
- Product Browsing with Dealer Pricing
- Customer Management
- Bulk Ordering
- Commission & Earnings
- Settings & Profile
- Access Control
- Logout

### Business Workflow (10 test suites)
- Authentication & Dashboard Access
- Dashboard Overview
- Product Browsing with Business Pricing
- Cart Management
- Order Placement
- Repeat Orders
- Address Management
- Invoice Management
- Settings & Profile
- Access Control
- Logout

### Warehouse Workflow (9 test suites)
- Authentication & Dashboard Access
- Dashboard Overview
- Order Management
- Picking List Management
- Inventory Management
- Order Fulfillment
- Reports & Analytics
- Settings & Profile
- Access Control
- Logout

## Test Patterns

### AAA Pattern
All tests follow the Arrange-Act-Assert pattern:

```typescript
test('should add product to cart', async ({ page }) => {
  // Arrange - Setup test conditions
  const productsPage = pageFactory.products();
  await pageFactory.home().navigateToProducts();

  // Act - Execute the action
  await productsPage.addProductToCart('test-product-1');

  // Assert - Verify expected outcome
  const cartCount = await homePage.getCartItemCount();
  expect(cartCount).toBeGreaterThan(0);
});
```

### Page Object Model
Tests use PageFactory to get page-specific helpers:

```typescript
const pageFactory = new PageFactory(page);
const productsPage = pageFactory.products();
const authHelper = pageFactory.authHelper();
const cartPage = pageFactory.cart();
```

### Test Independence
Each test is designed to run independently:
- Uses `beforeEach` for login setup
- Cleans up after itself
- Doesn't depend on other tests

### Test Data Strategy
- Uses realistic test data from `test-data.ts`
- Test users created via database migrations
- Tests use `test.skip()` when data is not available

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for elements** using Playwright's auto-wait
3. **Clean up state** in afterEach or individually
4. **Use descriptive test names** that explain what is being tested
5. **Group related tests** using test.describe()
6. **Share setup** using beforeEach
7. **Skip tests gracefully** when preconditions aren't met
8. **Test behavior, not implementation** - focus on user workflows

## CI/CD Integration

Tests are configured to run in CI with:
- 2 retries on failure
- Screenshot capture on failure
- Video recording on failure
- Trace files on first retry
- HTML test reports

## Troubleshooting

### Tests failing due to missing test data
Ensure test users are created by running the migration:
```sql
-- See: supabase/migrations/20250109100000_phase11_warehouse_test_accounts.sql
```

### Tests failing due to missing data-testid
Add `data-testid` attributes to UI elements that need to be tested.

### Tests timing out
- Increase timeout in playwright.config.ts
- Check for slow network requests
- Verify application is running on correct port

### Flaky tests
- Add proper waiting for elements
- Use `waitForResponse()` for API calls
- Avoid hardcoded delays (`waitForTimeout`)

## Adding New Tests

1. Create test file in appropriate directory
2. Import PageFactory and test data
3. Use test.describe() for grouping
4. Follow AAA pattern
5. Use data-testid selectors
6. Include cleanup in afterEach if needed
7. Run tests locally before committing

Example:
```typescript
import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS } from '../personas/test-data';

test.describe('New Feature Tests', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('customer');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Page Object Model](https://playwright.dev/docs/pom)
