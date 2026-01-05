# Repeat Order E2E Tests - Summary

## What Was Created

### Test Files

1. **`tests/e2e/business/repeat-order.spec.ts`**
   - 8 test suites covering business user repeat order scenarios
   - Full flow testing, error handling, accessibility

2. **`tests/e2e/customer/repeat-order.spec.ts`**
   - 6 test suites covering customer repeat order scenarios
   - Mobile responsiveness, cart integration, UX testing

### Page Objects

3. **`tests/helpers/pages-orders.ts`**
   - `BusinessOrdersPage` - Business dashboard orders interaction
   - `CustomerOrdersPage` - Customer account orders interaction
   - `RepeatOrderDialog` - Confirmation dialog interaction
   - `OrdersPageFactory` - Factory for instantiating page objects

### Setup & Documentation

4. **`tests/e2e/REPEAT_ORDER_TESTS.md`**
   - Complete documentation of test suites
   - Test data requirements
   - Running instructions
   - Known limitations

5. **`scripts/setup-repeat-order-tests.js`**
   - Automated test data creation
   - Creates delivered orders for testing
   - Sets up business and customer test orders

## Test Coverage

### Business User Tests

| Suite | Tests | Description |
|-------|-------|-------------|
| Full repeat order flow | 2 | Complete flow from dashboard to checkout |
| Unavailable items | 3 | Handles out-of-stock, inactive products |
| Price changes | 3 | Shows warnings for price differences |
| Region errors | 1 | Prevents cross-region repeats |
| Cart validation | 2 | Merges with existing cart items |
| Error handling | 2 | Network errors, timeouts |
| Dialog interactions | 3 | Cancel, backdrop, keyboard |
| Accessibility | 2 | ARIA labels, keyboard nav |

### Customer Tests

| Suite | Tests | Description |
|-------|-------|-------------|
| Regular flow | 5 | Account page to checkout |
| Customer behaviors | 2 | Pricing, non-business fields |
| Error scenarios | 3 | Auth, empty history, invalid ID |
| UX interactions | 3 | Loading states, button states |
| Post-repeat | 3 | Checkout nav, quantity mods |
| Cart integration | 2 | Merging, clearing behavior |
| Mobile | 2 | Responsive design, touch targets |

## Quick Start

### 1. Set up test users
```bash
npm run test-users:create
```

### 2. Create test orders
```bash
npm run test-orders:create
```

### 3. Run tests
```bash
# All repeat order tests
npm run test:repeat-order

# Business only
npm run test:repeat-order:business

# Customer only
npm run test:repeat-order:customer

# With UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

## Architecture

```
tests/
├── e2e/
│   ├── business/
│   │   └── repeat-order.spec.ts      # Business user tests
│   ├── customer/
│   │   └── repeat-order.spec.ts      # Customer tests
│   └── REPEAT_ORDER_TESTS.md         # Documentation
├── helpers/
│   ├── pages.ts                      # Core page objects
│   ├── pages-orders.ts               # Order-specific pages
│   └── auth.ts                       # Authentication helpers
└── fixtures.ts                       # Test fixtures
```

## Test Data Requirements

### Must Have
- Business user account (test-business@haldeki.com)
- Customer user account (test-customer@haldeki.com)
- At least 2 delivered orders per user
- Products with stock available
- Menemen region configured

### Optional (for full coverage)
- Orders with unavailable items
- Orders with price changes
- Orders from different regions
- Empty cart state
- Mobile viewport testing

## Test Status

### Active Tests
- Tests that will run with basic test data
- Marked as `test()` in files

### Skipped Tests
- Tests requiring specific data scenarios
- Marked as `test.skip(true, 'reason')`
- Can be enabled when test data is available

### Coverage Goal
- **Critical Path**: 100%
- **Error Scenarios**: 80%
- **Edge Cases**: 60%

## Selector Strategy

Tests use `data-testid` attributes for stable selectors:

```tsx
// Order items
[data-testid="order-item"]
[data-testid="order-{id}"]

// Repeat order button
[data-testid="repeat-order-button"]

// Dialog
[data-testid="repeat-order-dialog"]
[data-testid="available-items"]
[data-testid="unavailable-items"]
[data-testid="price-change-warning"]

// Actions
[data-testid="confirm-repeat-order"]
[data-testid="cancel-repeat-order"]
```

## Best Practices Applied

1. **AAA Pattern** - Arrange, Act, Assert structure
2. **Page Objects** - Reusable page interaction classes
3. **Independent Tests** - Each test can run alone
4. **Descriptive Names** - Test names describe behavior
5. **Stable Selectors** - Using data-testid not CSS classes
6. **Explicit Waits** - waitForVisible, waitForURL
7. **Error Messages** - Clear failure descriptions

## Future Enhancements

1. **Visual Regression** - Add screenshot comparison
2. **API Mocking** - Use MSW for error scenarios
3. **Performance** - Add timing assertions
4. **Cross-Browser** - Expand to Firefox, WebKit
5. **Data Factory** - Automated test data generation
6. **CI Integration** - Automated runs on push

## Troubleshooting

### Tests Fail with "No delivered orders found"
**Solution**: Run `npm run test-orders:create` to create test orders

### Tests Fail with "User not found"
**Solution**: Run `npm run test-users:create` to create test users

### Tests Timeout on Login
**Solution**: Check Supabase connection and credentials

### Dialog Not Appearing
**Solution**: Verify RepeatOrderButton component has data-testid attributes

### Region Selection Fails
**Solution**: Ensure Menemen region exists in database

## Related Code

- `src/components/business/RepeatOrderButton.tsx`
- `src/components/business/RepeatOrderConfirmDialog.tsx`
- `src/hooks/useRepeatOrder.ts`
- `src/lib/orderUtils.ts`
- `src/pages/business/BusinessDashboard.tsx`
- `src/pages/account/Orders.tsx`

## Support

For issues or questions:
1. Check REPEAT_ORDER_TESTS.md for detailed docs
2. Run with `--debug` flag for troubleshooting
3. Check Playwright trace files in `test-results/`
4. Review screenshots in `test-results/` directory
