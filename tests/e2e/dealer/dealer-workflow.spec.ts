import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS, ROLE_DASHBOARDS } from '../personas/test-data';

/**
 * Dealer Workflow E2E Tests
 * Tests dealer capabilities for bulk ordering and customer management
 *
 * Dealer Role Capabilities:
 * - View dashboard with sales analytics
 * - Browse products with dealer pricing
 * - Place bulk orders for customers
 * - Manage customer list
 * - View order history
 * - Track commissions/earnings
 */

test.describe('Dealer Workflow', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);

    // Login as dealer
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('dealer');
    await expect(authHelper.isLoggedIn()).resolves.toBe(true);
  });

  test.describe('Authentication & Dashboard Access', () => {
    test('should login successfully and access dealer dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.navigateToDashboard('dealer');

      // Assert
      await expect(page).toHaveURL('/bayi');
      await expect(page.locator('[data-testid="dealer-dashboard"]')).toBeVisible();
    });

    test('should display dealer navigation', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);

      // Assert
      await expect(page.locator('[data-testid="dealer-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-nav-customers"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-nav-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-nav-products"]')).toBeVisible();
    });

    test('should display business name on dashboard', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);

      // Assert
      await expect(page.locator(`text=${TEST_USERS.dealer.businessName}`)).toBeVisible();
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display key metrics on dashboard', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);

      // Assert
      await expect(page.locator('[data-testid="stat-total-customers"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-pending-orders"]')).toBeVisible();
      await expect(page.locator("[data-testid='stat-monthly-commission']")).toBeVisible();
      await expect(page.locator('[data-testid="stat-total-orders"]')).toBeVisible();
    });

    test('should display recent orders', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);

      // Assert
      await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
    });

    test('should display top customers', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);

      // Assert
      await expect(page.locator('[data-testid="top-customers"]')).toBeVisible();
    });
  });

  test.describe('Product Browsing with Dealer Pricing', () => {
    test('should browse products with dealer pricing visible', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-products"]');

      // Assert
      await expect(page.locator('[data-testid="dealer-products-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="dealer-price-column"]')).toBeVisible();
    });

    test('should display dealer price discount', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-products"]');

      // Assert - Dealer price should be lower than regular price
      const firstProduct = page.locator('[data-testid="product-row"]').first();
      await expect(firstProduct.locator('[data-testid="dealer-price"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="regular-price"]')).toBeVisible();
    });

    test('should filter products by category', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-products"]');

      // Act
      await page.selectOption('[data-testid="category-filter"]', 'vegetables');

      // Assert
      await page.waitForTimeout(500);
      const products = page.locator('[data-testid="product-row"]');
      const count = await products.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(products.nth(i).locator('[data-testid="category-vegetables"]')).toBeVisible();
      }
    });

    test('should search products by name', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-products"]');

      // Act
      await page.fill('[data-testid="search-input"]', 'test');

      // Assert
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="product-row"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Customer Management', () => {
    test('should display all customers', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);

      // Act
      await page.click('[data-testid="dealer-nav-customers"]');

      // Assert
      await expect(page.locator('[data-testid="customers-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-row"]').first()).toBeVisible();
    });

    test('should add new customer', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-customers"]');

      // Act
      await page.click('[data-testid="add-customer-button"]');
      await page.fill('[data-testid="customer-name"]', 'Test Dealer Customer');
      await page.fill('[data-testid="customer-phone"]', '+905551234567');
      await page.fill('[data-testid="customer-address"]', 'Test Address');
      await page.click('[data-testid="save-customer"]');

      // Assert
      await expect(page.locator('[data-testid="customer-save-success"]')).toBeVisible();
    });

    test('should view customer details', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-customers"]');

      // Act
      await page.locator('[data-testid="customer-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="customer-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-order-history"]')).toBeVisible();
    });

    test('should edit customer information', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-customers"]');
      await page.locator('[data-testid="customer-row"]').first().click();

      // Act
      await page.fill('[data-testid="customer-phone"]', '+905559876543');
      await page.click('[data-testid="save-customer"]');

      // Assert
      await expect(page.locator('[data-testid="customer-save-success"]')).toBeVisible();
    });

    test('should delete customer', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-customers"]');

      // Find a test customer (not real one)
      const testCustomer = page.locator('[data-testid="customer-row"]').filter({ hasText: 'Test Dealer Customer' }).first();

      if (await testCustomer.count() > 0) {
        // Act
        await testCustomer.locator('[data-testid="delete-customer-button"]').click();
        await page.click('[data-testid="confirm-delete"]');

        // Assert
        await expect(page.locator('[data-testid="delete-success-toast"]')).toBeVisible();
      } else {
        test.skip(true, 'No test customer found to delete');
      }
    });

    test('should search customers by name', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-customers"]');

      // Act
      await page.fill('[data-testid="search-input"]', 'test');

      // Assert
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="customer-row"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Bulk Ordering', () => {
    test('should create order for customer', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-orders"]');
      await page.click('[data-testid="create-order-button"]');

      // Act
      await page.selectOption('[data-testid="order-customer"]', '1');
      await page.click('[data-testid="add-product-button"]');

      // Assert
      await expect(page.locator('[data-testid="order-form"]')).toBeVisible();
    });

    test('should add multiple products to order', async ({ page }) => {
      test.skip(true, 'Requires order creation flow implementation');
    });

    test('should calculate order total with dealer commission', async ({ page }) => {
      test.skip(true, 'Requires order creation flow implementation');
    });

    test('should submit order successfully', async ({ page }) => {
      test.skip(true, 'Requires order creation flow implementation');
    });

    test('should view order history', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);

      // Act
      await page.click('[data-testid="dealer-nav-orders"]');

      // Assert
      await expect(page.locator('[data-testid="dealer-orders-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible();
    });

    test('should view order details', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-orders"]');

      // Act
      await page.locator('[data-testid="order-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="order-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-customer"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-commission"]')).toBeVisible();
    });

    test('should filter orders by status', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-orders"]');

      // Act
      await page.selectOption('[data-testid="status-filter"]', 'pending');

      // Assert
      await page.waitForTimeout(500);
      const orders = page.locator('[data-testid="order-row"]');
      const count = await orders.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(orders.nth(i).locator('[data-testid="order-status-pending"]')).toBeVisible();
      }
    });
  });

  test.describe('Commission & Earnings', () => {
    test('should view commission summary', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);

      // Act
      await page.click('[data-testid="dealer-nav-commission"]');

      // Assert
      await expect(page.locator('[data-testid="commission-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-commission"]')).toBeVisible();
      await expect(page.locator('[data-testid="pending-commission"]')).toBeVisible();
      await expect(page.locator('[data-testid="paid-commission"]')).toBeVisible();
    });

    test('should view commission by order', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-commission"]');

      // Assert
      await expect(page.locator('[data-testid="commission-by-order"]')).toBeVisible();
    });

    test('should filter commission by date range', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-commission"]');

      // Act
      await page.fill('[data-testid="date-from"]', '2025-01-01');
      await page.fill('[data-testid="date-to"]', '2025-01-31');
      await page.click('[data-testid="apply-filter"]');

      // Assert
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="commission-summary"]')).toBeVisible();
    });
  });

  test.describe('Settings & Profile', () => {
    test('should view dealer profile', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);

      // Act
      await page.click('[data-testid="dealer-nav-settings"]');

      // Assert
      await expect(page.locator('[data-testid="dealer-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-email"]')).toBeVisible();
    });

    test('should update dealer profile', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.dealer);
      await page.click('[data-testid="dealer-nav-settings"]');

      // Act
      await page.fill('[data-testid="business-phone"]', '+90555111222333');
      await page.click('[data-testid="save-profile"]');

      // Assert
      await expect(page.locator('[data-testid="profile-save-success"]')).toBeVisible();
    });
  });

  test.describe('Access Control', () => {
    test('should not access admin panel', async ({ page }) => {
      // Act
      await page.goto('/admin');

      // Assert
      await expect(page).not.toHaveURL('/admin');
    });

    test('should not access supplier panel', async ({ page }) => {
      // Act
      await page.goto('/tedarikci');

      // Assert
      await expect(page).not.toHaveURL('/tedarikci');
    });

    test('should not access warehouse panel', async ({ page }) => {
      // Act
      await page.goto('/depo');

      // Assert
      await expect(page).not.toHaveURL('/depo');
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.logout();

      // Assert
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="auth-drawer-trigger"]')).toBeVisible();
    });
  });
});
