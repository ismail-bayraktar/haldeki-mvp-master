# E2E Tests

This directory contains end-to-end tests for the Haldeki Market application using Playwright.

## Directory Structure

```
tests/
├── e2e/                    # E2E test files
│   ├── auth/              # Authentication flow tests
│   │   ├── login.spec.ts
│   │   └── registration.spec.ts
│   ├── checkout/          # Checkout flow tests
│   │   └── checkout-flow.spec.ts
│   ├── admin/             # Admin panel tests
│   │   └── admin-approval.spec.ts
│   ├── setup.ts           # Global test setup
│   └── teardown.ts        # Global test teardown
├── helpers/               # Test utilities and helpers
│   ├── auth.ts           # Authentication helpers
│   ├── database.ts       # Database helpers
│   └── pages.ts          # Page object models
├── fixtures.ts            # Custom Playwright fixtures
└── README.md             # This file
```

## Prerequisites

1. **Install Playwright browsers** (first time only):
   ```bash
   npx playwright install
   ```

2. **Set up test environment variables**:
   - Copy `.env.example` to `.env.test`
   - Configure test database URL
   - Configure test Supabase credentials

3. **Create test users**:
   ```bash
   npm run test-users:create
   ```
   Or run the migration:
   ```bash
   supabase db push
   ```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run E2E tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run E2E tests in debug mode
```bash
npm run test:e2e:debug
```

### Run E2E tests in headed mode (show browser)
```bash
npm run test:e2e:headed
```

### Run specific test file
```bash
npx playwright test tests/e2e/auth/login.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test -g "should allow customer to login"
```

## Test Users

The following test users are configured in `tests/helpers/auth.ts`:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Superadmin | test-superadmin@haldeki.com | Test123! | /admin |
| Admin | test-admin@haldeki.com | Test123! | /admin |
| Dealer | test-dealer@haldeki.com | Test123! | /bayi |
| Supplier | test-supplier@haldeki.com | Test123! | /tedarikci |
| Business | test-business@haldeki.com | Test123! | /isletme |
| Customer | test-customer@haldeki.com | Test123! | /hesabim |

## Writing New Tests

### Using Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    const pageFactory = new PageFactory(page);

    // Arrange
    const homePage = pageFactory.home();
    await homePage.goto();

    // Act
    await homePage.navigateToProducts();

    // Assert
    await expect(page).toHaveURL('**/urunler');
  });
});
```

### Using Custom Fixtures

```typescript
import { test, expect } from '../../fixtures';

test('my test', async ({ pageFactory, authHelper }) => {
  const homePage = pageFactory.home();
  await authHelper.loginAs('customer');
  await homePage.goto();
  // ... test logic
});
```

## Test Helpers

### AuthHelper (`tests/helpers/auth.ts`)
- `login(email, password)` - Login with credentials
- `loginAs(role)` - Login as predefined test role
- `logout()` - Logout current user
- `isLoggedIn()` - Check if user is logged in

### DatabaseHelper (`tests/helpers/database.ts`)
- `cleanupTestUser(email)` - Clean up test user data
- `setDealerApprovalStatus(userId, status)` - Set dealer approval status
- `clearCart(userId)` - Clear user's cart

### PageFactory (`tests/helpers/pages.ts`)
- `home()` - HomePage helper
- `products()` - ProductsPage helper
- `cart()` - CartPage helper
- `checkout()` - CheckoutPage helper
- `admin()` - AdminPage helper
- `auth()` - AuthPage helper

## Test Data Attributes

For tests to find elements reliably, add `data-testid` attributes to your React components:

```tsx
<Button data-testid="login-submit">Giriş Yap</Button>
<Input data-testid="login-email" />
```

## Debugging Failed Tests

1. **View trace files**:
   ```bash
   npx playwright show-trace test-results/[test-name]/trace.zip
   ```

2. **Run in headed mode**:
   ```bash
   npm run test:e2e:headed
   ```

3. **Use UI mode**:
   ```bash
   npm run test:e2e:ui
   ```

4. **Enable debug logging**:
   Set `DEBUG=pw:api` environment variable

## Continuous Integration

The tests are configured to:
- Run on 3 browsers (Chromium, Firefox, WebKit)
- Retry failed tests twice
- Capture screenshots on failure
- Record video on failure
- Generate HTML and JUnit reports

## Best Practices

1. **Use data-testid selectors** - More stable than CSS selectors
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Make tests independent** - Each test should work in isolation
4. **Clean up test data** - Use afterEach or database helpers
5. **Test user behavior** - Not implementation details
6. **Wait for elements** - Use Playwright's auto-waiting
7. **Avoid hard-coded waits** - Use `waitForSelector` instead

## Troubleshooting

### Tests fail with "Test account not found"
Run the test user creation script:
```bash
npm run test-users:create
```

### Tests fail with "Region modal not closing"
Make sure test users have a selected region, or mock the region selection.

### Tests timeout
Increase timeout in `playwright.config.ts` or use `test.setTimeout()`.

### Flaky tests
- Use proper waiting strategies
- Ensure test data is properly cleaned up
- Avoid race conditions with `waitForSelector`
