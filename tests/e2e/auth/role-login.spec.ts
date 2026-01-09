import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS, TestUserRole, ROLE_DASHBOARDS } from '../personas/test-data';

/**
 * Role-Based Login E2E Tests
 * Tests login functionality for all 7 user roles
 *
 * Roles Tested:
 * 1. Customer (user)
 * 2. Admin
 * 3. SuperAdmin
 * 4. Dealer
 * 5. Supplier
 * 6. Business (Restaurant)
 * 7. Warehouse Manager
 */

test.describe('Role-Based Login Tests', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);
    await pageFactory.home().goto();
  });

  test.describe('Customer Login', () => {
    test('should allow customer to login successfully', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('customer');

      // Assert
      await expect(page).toHaveURL('/');
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
      await expect(page.locator('[data-testid="user-menu-trigger"]')).toBeVisible();
    });

    test('should redirect customer to home after login', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('customer');

      // Assert
      await expect(page).toHaveURL('/');
    });

    test('should display customer name after login', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('customer');
      const userName = await authHelper.getCurrentUserName();

      // Assert
      expect(userName).toContain(TEST_USERS.customer.name);
    });
  });

  test.describe('Admin Login', () => {
    test('should allow admin to login successfully', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('admin');

      // Assert
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
    });

    test('should allow admin to access admin dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('admin');
      await authHelper.navigateToDashboard('admin');

      // Assert
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });

    test('should display admin-specific navigation', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('admin');
      await page.goto('/admin');

      // Assert
      await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    });
  });

  test.describe('SuperAdmin Login', () => {
    test('should allow superadmin to login successfully', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('superadmin');

      // Assert
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
    });

    test('should allow superadmin to access admin panel', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('superadmin');
      await authHelper.navigateToDashboard('superadmin');

      // Assert
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });

    test('should grant superadmin full system access', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('superadmin');
      await page.goto('/admin/users');

      // Assert - Superadmin should have access to user management
      await expect(page.locator('[data-testid="users-list"]')).toBeVisible();
    });
  });

  test.describe('Dealer Login', () => {
    test('should allow dealer to login successfully', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('dealer');

      // Assert
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
    });

    test('should allow dealer to access dealer dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('dealer');
      await authHelper.navigateToDashboard('dealer');

      // Assert
      await expect(page).toHaveURL('/bayi');
      await expect(page.locator('[data-testid="dealer-dashboard"]')).toBeVisible();
    });

    test('should display dealer business name', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('dealer');
      await page.goto('/bayi');

      // Assert
      await expect(page.locator(`text=${TEST_USERS.dealer.businessName}`)).toBeVisible();
    });
  });

  test.describe('Supplier Login', () => {
    test('should allow supplier to login successfully', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('supplier');

      // Assert
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
    });

    test('should allow supplier to access supplier dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('supplier');
      await authHelper.navigateToDashboard('supplier');

      // Assert
      await expect(page).toHaveURL('/tedarikci');
      await expect(page.locator('[data-testid="supplier-dashboard"]')).toBeVisible();
    });

    test('should display supplier business name', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('supplier');
      await page.goto('/tedarikci');

      // Assert
      await expect(page.locator(`text=${TEST_USERS.supplier.businessName}`)).toBeVisible();
    });
  });

  test.describe('Business Login', () => {
    test('should allow business user to login successfully', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('business');

      // Assert
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
    });

    test('should allow business user to access business dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('business');
      await authHelper.navigateToDashboard('business');

      // Assert
      await expect(page).toHaveURL('/isletme');
      await expect(page.locator('[data-testid="business-dashboard"]')).toBeVisible();
    });

    test('should display business name and tax number', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('business');
      await page.goto('/isletme');

      // Assert
      await expect(page.locator(`text=${TEST_USERS.business.businessName}`)).toBeVisible();
      await expect(page.locator(`text=${TEST_USERS.business.taxNumber}`)).toBeVisible();
    });
  });

  test.describe('Warehouse Manager Login', () => {
    test('should allow warehouse manager to login successfully', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('warehouse_manager');

      // Assert
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
    });

    test('should allow warehouse manager to access warehouse dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('warehouse_manager');
      await authHelper.navigateToDashboard('warehouse_manager');

      // Assert
      await expect(page).toHaveURL('/depo');
      await expect(page.locator('[data-testid="warehouse-dashboard"]')).toBeVisible();
    });

    test('should display warehouse manager name', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.loginAs('warehouse_manager');
      await page.goto('/depo');

      // Assert
      await expect(page.locator(`text=${TEST_USERS.warehouse_manager.name}`)).toBeVisible();
    });
  });

  test.describe('Invalid Login Attempts', () => {
    test('should show error with invalid email', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await authHelper.openAuthDrawer();
      await authHelper.switchToLoginTab();

      // Act
      await authHelper.fillLoginForm('invalid@example.com', 'wrongpassword');
      await authHelper.submitLogin();

      // Assert
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
    });

    test('should show error with invalid password', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await authHelper.openAuthDrawer();
      await authHelper.switchToLoginTab();

      // Act
      await authHelper.fillLoginForm(TEST_USERS.customer.email, 'wrongpassword');
      await authHelper.submitLogin();

      // Assert
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
    });

    test('should show error with empty credentials', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await authHelper.openAuthDrawer();
      await authHelper.switchToLoginTab();

      // Act
      await authHelper.fillLoginForm('', '');
      await authHelper.submitLogin();

      // Assert - Should show validation error
      await expect(page.locator('[data-testid="login-email-error"]')).toBeVisible();
    });
  });

  test.describe('Logout Functionality', () => {
    const roles: TestUserRole[] = [
      'customer',
      'admin',
      'superadmin',
      'dealer',
      'supplier',
      'business',
      'warehouse_manager',
    ];

    for (const role of roles) {
      test(`${role} should logout successfully`, async ({ page }) => {
        // Arrange - Login as role
        const authHelper = pageFactory.authHelper();
        await authHelper.loginAs(role);
        await expect(authHelper.isLoggedIn()).resolves.toBe(true);

        // Act - Logout
        await authHelper.logout();

        // Assert
        await expect(page).toHaveURL('/');
        await expect(authHelper.isLoggedIn()).resolves.toBe(false);
        await expect(page.locator('[data-testid="auth-drawer-trigger"]')).toBeVisible();
      });
    }
  });

  test.describe('Session Persistence', () => {
    test('should maintain session after page refresh', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await authHelper.loginAs('customer');
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);

      // Act
      await page.reload();

      // Assert
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
    });

    test('should maintain session after navigation', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();
      await authHelper.loginAs('customer');
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);

      // Act - Navigate away and back
      await page.goto('/about');
      await page.goto('/');

      // Assert
      await expect(authHelper.isLoggedIn()).resolves.toBe(true);
    });
  });

  test.describe('Role Dashboard Access Matrix', () => {
    const dashboardTests: Array<{ role: TestUserRole; dashboard: string; shouldAccess: boolean }> = [
      { role: 'customer', dashboard: '/hesabim', shouldAccess: true },
      { role: 'customer', dashboard: '/admin', shouldAccess: false },
      { role: 'customer', dashboard: '/bayi', shouldAccess: false },
      { role: 'customer', dashboard: '/tedarikci', shouldAccess: false },
      { role: 'customer', dashboard: '/isletme', shouldAccess: false },
      { role: 'customer', dashboard: '/depo', shouldAccess: false },

      { role: 'admin', dashboard: '/admin', shouldAccess: true },
      { role: 'admin', dashboard: '/bayi', shouldAccess: false },
      { role: 'admin', dashboard: '/tedarikci', shouldAccess: false },
      { role: 'admin', dashboard: '/isletme', shouldAccess: false },
      { role: 'admin', dashboard: '/depo', shouldAccess: false },

      { role: 'superadmin', dashboard: '/admin', shouldAccess: true },
      { role: 'superadmin', dashboard: '/bayi', shouldAccess: false },

      { role: 'dealer', dashboard: '/bayi', shouldAccess: true },
      { role: 'dealer', dashboard: '/admin', shouldAccess: false },
      { role: 'dealer', dashboard: '/tedarikci', shouldAccess: false },
      { role: 'dealer', dashboard: '/depo', shouldAccess: false },

      { role: 'supplier', dashboard: '/tedarikci', shouldAccess: true },
      { role: 'supplier', dashboard: '/admin', shouldAccess: false },
      { role: 'supplier', dashboard: '/bayi', shouldAccess: false },
      { role: 'supplier', dashboard: '/depo', shouldAccess: false },

      { role: 'business', dashboard: '/isletme', shouldAccess: true },
      { role: 'business', dashboard: '/admin', shouldAccess: false },
      { role: 'business', dashboard: '/bayi', shouldAccess: false },
      { role: 'business', dashboard: '/tedarikci', shouldAccess: false },
      { role: 'business', dashboard: '/depo', shouldAccess: false },

      { role: 'warehouse_manager', dashboard: '/depo', shouldAccess: true },
      { role: 'warehouse_manager', dashboard: '/admin', shouldAccess: false },
      { role: 'warehouse_manager', dashboard: '/bayi', shouldAccess: false },
      { role: 'warehouse_manager', dashboard: '/tedarikci', shouldAccess: false },
      { role: 'warehouse_manager', dashboard: '/isletme', shouldAccess: false },
    ];

    for (const testCase of dashboardTests) {
      test(`${testCase.role} should ${testCase.shouldAccess ? 'access' : 'be denied'} ${testCase.dashboard}`, async ({ page }) => {
        // Arrange
        const authHelper = pageFactory.authHelper();
        await authHelper.loginAs(testCase.role);

        // Act
        await page.goto(testCase.dashboard);
        await page.waitForTimeout(500); // Wait for redirect

        // Assert
        if (testCase.shouldAccess) {
          await expect(page).toHaveURL(testCase.dashboard);
        } else {
          await expect(page).not.toHaveURL(testCase.dashboard);
        }
      });
    }
  });

  test.describe('Remember Me Functionality', () => {
    test('should remember user after browser restart', async ({ page, context }) => {
      // This test requires checking session persistence across browser sessions
      test.skip(true, 'Requires browser session testing setup');
    });
  });
});
