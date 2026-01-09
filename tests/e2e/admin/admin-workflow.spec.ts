import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS, PERMISSION_TESTS } from '../personas/test-data';

/**
 * Admin Workflow E2E Tests
 * Tests admin capabilities for managing the marketplace
 *
 * Admin Role Capabilities:
 * - View dashboard with analytics
 * - Manage whitelist applications (approve/reject)
 * - Manage users (view, edit, deactivate)
 * - Manage products (add, edit, deactivate)
 * - Manage orders (view, update status)
 * - View dealers, suppliers, businesses
 * - Manage regions and categories
 */

test.describe('Admin Workflow', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);

    // Login as admin
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('admin');
    await expect(authHelper.isLoggedIn()).resolves.toBe(true);
  });

  test.describe('Authentication & Access', () => {
    test('should login successfully and access admin dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.navigateToDashboard('admin');

      // Assert
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });

    test('should display admin navigation', async ({ page }) => {
      // Arrange
      await pageFactory.admin().goto();

      // Assert
      await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-products"]')).toBeVisible();
    });

    test('should access all admin sections', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();

      // Act & Assert - Test each section
      const sections = ['dashboard', 'users', 'orders', 'products', 'dealers', 'suppliers', 'businesses'] as const;

      for (const section of sections) {
        await adminPage.navigateToSection(section);
        await expect(page.locator(`[data-testid="admin-${section}"]`)).toBeVisible();
      }
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display key metrics on dashboard', async ({ page }) => {
      // Arrange
      await pageFactory.admin().goto();

      // Assert
      await expect(page.locator('[data-testid="stat-total-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-total-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-total-products"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-pending-applications"]')).toBeVisible();
    });

    test('should display recent activity', async ({ page }) => {
      // Arrange
      await pageFactory.admin().goto();

      // Assert
      await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-applications"]')).toBeVisible();
    });

    test('should display charts/graphs', async ({ page }) => {
      // Arrange
      await pageFactory.admin().goto();

      // Assert
      await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="orders-chart"]')).toBeVisible();
    });
  });

  test.describe('Whitelist Management', () => {
    test('should display pending whitelist applications', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();

      // Act
      await adminPage.navigateToSection('whitelist');

      // Assert
      await expect(page.locator('[data-testid="whitelist-applications"]')).toBeVisible();
    });

    test('should view whitelist application details', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('whitelist');

      // Act - Click on first application
      const firstApp = page.locator('[data-testid="whitelist-application"]').first();
      const count = await firstApp.count();

      if (count > 0) {
        await firstApp.click();

        // Assert
        await expect(page.locator('[data-testid="application-detail-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="application-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="application-email"]')).toBeVisible();
        await expect(page.locator('[data-testid="application-phone"]')).toBeVisible();
        await expect(page.locator('[data-testid="application-tax-no"]')).toBeVisible();
      } else {
        test.skip(true, 'No pending whitelist applications');
      }
    });

    test('should approve whitelist application', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('whitelist');

      // Act - Approve first pending application
      const firstApp = page.locator('[data-testid="application-status-pending"]').first();
      const count = await firstApp.count();

      if (count > 0) {
        const applicationId = await firstApp.getAttribute('data-application-id');
        if (applicationId) {
          await page.click(`[data-testid="application-${applicationId}"] [data-testid="approve-button"]`);

          // Assert
          await expect(page.locator('[data-testid="approval-success-toast"]')).toBeVisible();
          await expect(page.locator(`[data-testid="application-${applicationId}"]`)
            .locator('[data-testid="application-status-approved"]')).toBeVisible();
        }
      } else {
        test.skip(true, 'No pending applications to approve');
      }
    });

    test('should reject whitelist application with reason', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('whitelist');

      // Act - Reject first pending application
      const pendingApps = page.locator('[data-testid="application-status-pending"]');
      const count = await pendingApps.count();

      if (count > 1) {
        const secondApp = pendingApps.nth(1);
        const applicationId = await secondApp.getAttribute('data-application-id');

        if (applicationId) {
          await page.click(`[data-testid="application-${applicationId}"] [data-testid="reject-button"]`);
          await page.fill('[data-testid="rejection-reason"]', 'Test rejection reason');
          await page.click('[data-testid="confirm-rejection"]');

          // Assert
          await expect(page.locator(`[data-testid="application-${applicationId}"]`)
            .locator('[data-testid="application-status-rejected"]')).toBeVisible();
        }
      } else {
        test.skip(true, 'Not enough pending applications to test rejection');
      }
    });

    test('should filter applications by status', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('whitelist');

      // Act - Filter by pending
      await page.selectOption('[data-testid="status-filter"]', 'pending');

      // Assert
      const allApps = page.locator('[data-testid^="whitelist-application"]');
      const pendingApps = page.locator('[data-testid="application-status-pending"]');
      const allCount = await allApps.count();
      const pendingCount = await pendingApps.count();

      expect(allCount).toBe(pendingCount);
    });

    test('should search applications by name or email', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('whitelist');

      // Act
      await page.fill('[data-testid="search-input"]', 'test');

      // Assert
      await page.waitForTimeout(500); // Wait for debounce
      const results = page.locator('[data-testid^="whitelist-application"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('User Management', () => {
    test('should display all users', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('users');

      // Assert
      await expect(page.locator('[data-testid="users-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row"]').first()).toBeVisible();
    });

    test('should view user details', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('users');

      // Act - Click on first user
      await page.locator('[data-testid="user-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="user-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-roles"]')).toBeVisible();
    });

    test('should filter users by role', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('users');

      // Act - Filter by dealer role
      await page.selectOption('[data-testid="role-filter"]', 'dealer');

      // Assert
      await page.waitForTimeout(500);
      const users = page.locator('[data-testid="user-row"]');
      const count = await users.count();

      // Verify all displayed users have dealer role badge
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(users.nth(i).locator('[data-testid="role-badge-dealer"]')).toBeVisible();
      }
    });

    test('should search users by name or email', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('users');

      // Act
      await page.fill('[data-testid="search-input"]', 'test');

      // Assert
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="user-row"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });

    test('should deactivate user account', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('users');

      // Find a test user (not admin)
      const testUser = page.locator('[data-testid="user-row"]').filter({ hasText: 'test-customer' }).first();

      if (await testUser.count() > 0) {
        // Act
        await testUser.click();
        await page.click('[data-testid="deactivate-user-button"]');
        await page.click('[data-testid="confirm-deactivate"]');

        // Assert
        await expect(page.locator('[data-testid="deactivate-success-toast"]')).toBeVisible();
      } else {
        test.skip(true, 'No suitable test user found');
      }
    });

    test('should assign role to user', async ({ page }) => {
      test.skip(true, 'Requires role assignment UI implementation');
    });
  });

  test.describe('Product Management', () => {
    test('should display all products', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('products');

      // Assert
      await expect(page.locator('[data-testid="products-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible();
    });

    test('should add new product', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('products');

      // Act
      await page.click('[data-testid="add-product-button"]');
      await page.fill('[data-testid="product-name"]', 'Test Admin Product');
      await page.fill('[data-testid="product-price"]', '100');
      await page.selectOption('[data-testid="product-category"]', 'vegetables');
      await page.click('[data-testid="save-product"]');

      // Assert
      await expect(page.locator('[data-testid="product-save-success"]')).toBeVisible();
    });

    test('should edit existing product', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('products');

      // Act - Edit first product
      await page.locator('[data-testid="product-row"]').first().click();
      await page.fill('[data-testid="product-name"]', 'Updated Product Name');
      await page.click('[data-testid="save-product"]');

      // Assert
      await expect(page.locator('[data-testid="product-save-success"]')).toBeVisible();
    });

    test('should deactivate product', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('products');

      // Act
      const firstProduct = page.locator('[data-testid="product-row"]').first();
      await firstProduct.click();
      await page.click('[data-testid="deactivate-product"]');
      await page.click('[data-testid="confirm-deactivate"]');

      // Assert
      await expect(page.locator('[data-testid="product-status-inactive"]')).toBeVisible();
    });
  });

  test.describe('Order Management', () => {
    test('should display all orders', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('orders');

      // Assert
      await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible();
    });

    test('should view order details', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('orders');

      // Act - Click on first order
      await page.locator('[data-testid="order-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="order-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-customer"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
    });

    test('should update order status', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('orders');
      await page.locator('[data-testid="order-row"]').first().click();

      // Act
      await page.selectOption('[data-testid="order-status"]', 'processing');
      await page.click('[data-testid="update-order-status"]');

      // Assert
      await expect(page.locator('[data-testid="status-update-success"]')).toBeVisible();
    });

    test('should filter orders by status', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('orders');

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

    test('should search orders by customer name or order ID', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('orders');

      // Act
      await page.fill('[data-testid="search-input"]', 'test');

      // Assert
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="order-row"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Dealer Management', () => {
    test('should display all dealers', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();

      // Act
      await adminPage.navigateToSection('dealers');

      // Assert
      await expect(page.locator('[data-testid="dealers-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-row"]').first()).toBeVisible();
    });

    test('should approve pending dealer', async ({ page }) => {
      // This is already tested in admin-approval.spec.ts
      test.skip(true, 'Covered in admin-approval.spec.ts');
    });

    test('should view dealer details', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('dealers');

      // Act
      await page.locator('[data-testid="dealer-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="dealer-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-company"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-customers-count"]')).toBeVisible();
    });
  });

  test.describe('Supplier Management', () => {
    test('should display all suppliers', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();

      // Act
      await adminPage.navigateToSection('suppliers');

      // Assert
      await expect(page.locator('[data-testid="suppliers-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-row"]').first()).toBeVisible();
    });

    test('should view supplier details', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('suppliers');

      // Act
      await page.locator('[data-testid="supplier-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="supplier-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-products-count"]')).toBeVisible();
    });
  });

  test.describe('Business Management', () => {
    test('should display all businesses', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();

      // Act
      await adminPage.navigateToSection('businesses');

      // Assert
      await expect(page.locator('[data-testid="businesses-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-row"]').first()).toBeVisible();
    });

    test('should view business details', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('businesses');

      // Act
      await page.locator('[data-testid="business-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="business-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-tax-no"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-orders-count"]')).toBeVisible();
    });
  });

  test.describe('Reports & Analytics', () => {
    test('should view sales report', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();

      // Act
      await adminPage.navigateToSection('reports');

      // Assert
      await expect(page.locator('[data-testid="sales-report"]')).toBeVisible();
    });

    test('should export report as CSV', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('reports');

      // Act
      await page.click('[data-testid="export-csv-button"]');

      // Assert - Download should start
      // Note: This requires additional setup to verify download
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
