import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS, TestUserRole } from '../../helpers/auth';

/**
 * Authentication Flow E2E Tests
 * Tests login functionality for all user roles
 */

test.describe('Authentication Flows', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);
  });

  test.describe('Login - Customer', () => {
    test('should allow customer to login', async ({ page }) => {
      // Arrange
      const homePage = pageFactory.home();
      const authHelper = pageFactory.authHelper();
      await homePage.goto();

      // Act
      await authHelper.loginAs('customer');

      // Assert
      await expect(page).toHaveURL('/');
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
    });

    test('should show error with invalid credentials', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await pageFactory.home().goto();
      await authHelper.openAuthDrawer();
      await authHelper.switchToLoginTab();

      // Act
      await authHelper.fillLoginForm('invalid@example.com', 'wrongpassword');
      await authHelper.submitLogin();

      // Assert
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
    });
  });

  test.describe('Login - Admin', () => {
    test('should allow admin to login and access dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await pageFactory.home().goto();

      // Act
      await authHelper.loginAs('admin');
      await authHelper.navigateToDashboard('admin');

      // Assert
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Login - SuperAdmin', () => {
    test('should allow superadmin to login and access admin panel', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await pageFactory.home().goto();

      // Act
      await authHelper.loginAs('superadmin');
      await authHelper.navigateToDashboard('superadmin');

      // Assert
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Login - Dealer', () => {
    test('should allow approved dealer to login and access dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await pageFactory.home().goto();

      // Act
      await authHelper.loginAs('dealer');
      await authHelper.navigateToDashboard('dealer');

      // Assert
      await expect(page).toHaveURL('/bayi');
      await expect(page.locator('[data-testid="dealer-dashboard"]')).toBeVisible();
    });

    test('should show pending status for unapproved dealer', async ({ page }) => {
      // This test would require setting up a pending dealer first
      // For now, we skip it
      test.skip(true, 'Requires pending dealer setup');
    });
  });

  test.describe('Login - Supplier', () => {
    test('should allow approved supplier to login and access dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await pageFactory.home().goto();

      // Act
      await authHelper.loginAs('supplier');
      await authHelper.navigateToDashboard('supplier');

      // Assert
      await expect(page).toHaveURL('/tedarikci');
      await expect(page.locator('[data-testid="supplier-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Login - Business', () => {
    test('should allow approved business user to login and access dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await pageFactory.home().goto();

      // Act
      await authHelper.loginAs('business');
      await authHelper.navigateToDashboard('business');

      // Assert
      await expect(page).toHaveURL('/isletme');
      await expect(page.locator('[data-testid="business-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should allow user to logout', async ({ page }) => {
      // Arrange - Login first
      const authHelper = pageFactory.authHelper();
      await pageFactory.home().goto();
      await authHelper.loginAs('customer');
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);

      // Act - Logout
      await authHelper.logout();

      // Assert
      await expect(page).toHaveURL('/');
      await expect(authHelper.isLoggedIn()).resolves.toBe(false);
    });
  });

  test.describe('Role-based Access Control', () => {
    const roleAccessTests: Array<{ role: TestUserRole; allowedPaths: string[]; deniedPaths: string[] }> = [
      {
        role: 'customer',
        allowedPaths: ['/hesabim', '/sepet', '/urunler'],
        deniedPaths: ['/admin', '/bayi', '/tedarikci', '/isletme'],
      },
      {
        role: 'dealer',
        allowedPaths: ['/bayi', '/bayi/musteriler'],
        deniedPaths: ['/admin', '/tedarikci', '/isletme'],
      },
      {
        role: 'admin',
        allowedPaths: ['/admin', '/admin/products', '/admin/orders'],
        deniedPaths: [],
      },
    ];

    for (const testCase of roleAccessTests) {
      test(`${testCase.role} should access allowed routes`, async ({ page }) => {
        // Arrange
        const authHelper = pageFactory.authHelper();
        await pageFactory.home().goto();
        await authHelper.loginAs(testCase.role);

        // Act & Assert
        for (const path of testCase.allowedPaths) {
          await page.goto(path);
          // Should not redirect to login
          await expect(page).not.toHaveURL(/\/giris/);
        }
      });
    }
  });
});
