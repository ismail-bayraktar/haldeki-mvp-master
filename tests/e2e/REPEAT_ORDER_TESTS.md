# Repeat Order E2E Tests

Comprehensive end-to-end tests for the repeat order functionality for both business and customer users.

## Test Suites

### 1. Business Repeat Order Tests
**File:** `tests/e2e/business/repeat-order.spec.ts`

Tests the complete repeat order flow for business users including:
- Full repeat order flow with validation
- Unavailable items handling
- Price change warnings
- Region change errors
- Cart validation and merging
- Error handling scenarios
- Dialog interactions
- Accessibility compliance

### 2. Customer Repeat Order Tests
**File:** `tests/e2e/customer/repeat-order.spec.ts`

Tests the repeat order flow for regular customers including:
- Complete repeat order from account page
- Order details display
- Multiple items handling
- Customer-specific pricing
- Error scenarios
- UX and interactions
- Post-repeat order behavior
- Cart integration
- Mobile responsiveness

## Page Object Model

### OrdersPageFactory
Located in `tests/helpers/pages-orders.ts`

Provides helper classes for:
- **BusinessOrdersPage**: Interact with business dashboard orders
- **CustomerOrdersPage**: Interact with customer account orders
- **RepeatOrderDialog**: Interact with the repeat order confirmation dialog

## Test Data Requirements

### Prerequisites

For tests to run successfully, the following test data must exist:

1. **Business User Account**
   - Email: `test-business@haldeki.com`
   - Password: `Test123!`
   - Status: Approved
   - Role: Business

2. **Customer User Account**
   - Email: `test-customer@haldeki.com`
   - Password: `Test123!`
   - Role: User

3. **Test Orders**
   - At least one delivered order per user type
   - Orders with multiple items (2-3 products)
   - Orders with products still available
   - (Optional) Orders with unavailable products for negative testing
   - (Optional) Orders with price changes for price warning testing

### Creating Test Data

Use the provided migration scripts to create test accounts:

```bash
# Run the comprehensive test accounts migration
supabase db push

# Or use the SQL scripts directly
psql -f supabase/migrations/20250104200000_comprehensive_test_accounts.sql
```

### Manual Test Data Setup

For complete testing, you may need to manually create:

1. **Delivered Orders**
   - Create orders via the UI
   - Update status to 'delivered' in database
   - Ensure products are still in stock/available

2. **Orders with Unavailable Items**
   - Create an order
   - Make some products inactive or out of stock
   - Try to repeat the order

3. **Orders with Price Changes**
   - Create an order
   - Update product prices
   - Try to repeat the order

## Running Tests

### Run All Repeat Order Tests
```bash
npx playwright test tests/e2e/business/repeat-order.spec.ts tests/e2e/customer/repeat-order.spec.ts
```

### Run Business Tests Only
```bash
npx playwright test tests/e2e/business/repeat-order.spec.ts
```

### Run Customer Tests Only
```bash
npx playwright test tests/e2e/customer/repeat-order.spec.ts
```

### Run in Headed Mode (Debug)
```bash
npx playwright test tests/e2e/business/repeat-order.spec.ts --headed
```

### Run Specific Test
```bash
npx playwright test -g "should complete repeat order"
```

### Run with Trace Viewer
```bash
npx playwright test --trace on
npx playwright show-trace test-results/[test-name]/trace.zip
```

## Test Coverage

### Business Tests

| Test | Coverage | Status |
|------|----------|--------|
| Full repeat order flow | Complete flow from dashboard to checkout | Active |
| Unavailable items handling | Shows reasons, allows available items | Skipped (needs data) |
| Price change warning | Shows old vs new prices | Skipped (needs data) |
| Region change error | Prevents cross-region repeat | Skipped (needs data) |
| Cart validation | Merges with existing cart | Skipped (needs data) |
| Error handling | Network errors, timeouts | Skipped (needs mocking) |
| Dialog interactions | Cancel, backdrop, ESC key | Skipped (needs data) |
| Accessibility | ARIA labels, keyboard nav | Skipped (needs data) |

### Customer Tests

| Test | Coverage | Status |
|------|----------|--------|
| Regular customer repeat order | Complete flow from account page | Active (if orders exist) |
| Order details display | Shows items, total, date | Active (if orders exist) |
| All items available | Validates availability | Active (if orders exist) |
| Multiple items handling | Handles 2-3 items | Skipped (needs data) |
| Order timeline | Shows delivery timeline | Skipped (needs data) |
| Customer pricing | Uses non-business prices | Skipped (needs comparison) |
| Unauthenticated state | Redirects to login | Skipped (needs setup) |
| Empty order history | Shows empty state | Skipped (needs new account) |
| Loading states | Shows loading indicators | Skipped (needs slow network) |
| Post-repeat behavior | Checkout navigation, cart | Skipped (needs successful repeat) |
| Cart merging | Merges with existing items | Skipped (needs data) |
| Mobile responsive | Works on 375x667 viewport | Skipped (needs data) |

## Known Limitations

1. **Skipped Tests**: Many tests are marked as `test.skip()` because they require specific test data that needs to be set up manually.

2. **Test Data Dependency**: Tests depend on delivered orders existing in the database. If no delivered orders exist, tests will be skipped.

3. **Region Selection**: Tests assume "Menemen" region exists and is selectable.

4. **Network Speed**: Some tests for loading states require network throttling which isn't configured.

## Future Improvements

1. **Test Data Factory**: Create a utility to automatically set up test orders with various states.

2. **API Mocking**: Add MSW or similar to mock API responses for error scenarios.

3. **Visual Regression**: Add screenshot comparison for dialog UI.

4. **Performance Testing**: Add timing assertions for validation and cart updates.

5. **Cross-Browser**: Expand testing beyond Chromium to Firefox and WebKit.

## Debugging Failed Tests

### View Test Results
```bash
npx playwright show-report
```

### View Screenshots
Check `test-results` directory for screenshots taken on failure.

### View Traces
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Debug in VS Code
1. Install Playwright extension for VS Code
2. Click the play button next to test names
3. Use the inspector to inspect elements

## Test Maintenance

When updating the repeat order feature:

1. **UI Changes**: Update selectors in `pages-orders.ts`
2. **New Features**: Add new tests to appropriate suite
3. **Bug Fixes**: Add regression tests for fixed bugs
4. **API Changes**: Update validation flow tests
5. **Data Changes**: Update test data requirements

## Related Files

- `src/components/business/RepeatOrderButton.tsx` - Main component
- `src/components/business/RepeatOrderConfirmDialog.tsx` - Dialog component
- `src/hooks/useRepeatOrder.ts` - Business logic hook
- `src/lib/orderUtils.ts` - Validation utilities
- `src/pages/business/BusinessDashboard.tsx` - Business dashboard
- `src/pages/account/Orders.tsx` - Customer orders page
