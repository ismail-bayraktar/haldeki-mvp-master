import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';

/**
 * SuperAdmin Access to Supplier Dashboard - Production E2E Test
 *
 * Tests SuperAdmin's ability to access /tedarikci route after has_role fix
 *
 * Prerequisites:
 * - SuperAdmin test account must exist in production
 * - has_role() function must have SuperAdmin cascading permissions
 *
 * Run with:
 *   npx playwright test tests/e2e/supplier/superadmin-access.spec.ts --headed
 */

test.describe('SuperAdmin Supplier Dashboard Access', () => {
  let pageFactory: PageFactory;

  // Configure for production
  test.beforeAll(async () => {
    // These should match production SuperAdmin credentials
    process.env.SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@haldeki.com';
    process.env.SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || '';
  });

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);
  });

  test('should allow SuperAdmin to access /tedarikci dashboard', async ({ page }) => {
    // Arrange
    const authHelper = pageFactory.authHelper();
    const superadminEmail = process.env.SUPERADMIN_EMAIL;
    const superadminPassword = process.env.SUPERADMIN_PASSWORD;

    if (!superadminPassword) {
      test.skip(true, 'SUPERADMIN_PASSWORD environment variable not set');
    }

    // Act - Navigate to production site
    await page.goto('https://haldeki.com');
    await page.waitForLoadState('networkidle');

    // Login as SuperAdmin
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(superadminEmail, superadminPassword);
    await authHelper.submitLogin();

    // Wait for login to complete
    await page.waitForTimeout(2000);

    // Navigate to supplier dashboard
    await page.goto('https://haldeki.com/tedarikci');
    await page.waitForLoadState('networkidle');

    // Assert - Check URL
    await expect(page).toHaveURL(/\/tedarikci/);

    // Assert - Check for error message
    const errorMessage = page.locator('text=/Tedarikçi kaydı bulunamadı/i');
    const isVisible = await errorMessage.isVisible().catch(() => false);
    expect(isVisible).toBe(false);

    // Assert - Check for dashboard elements
    const dashboardElement = page.locator('[data-testid="supplier-dashboard"], h1, h2').filter({ hasText: /tedarikçi|supplier/i });
    await expect(dashboardElement.first()).toBeVisible({ timeout: 5000 });

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/superadmin-supplier-access.png', fullPage: true });
  });

  test('should show supplier data to SuperAdmin', async ({ page }) => {
    // Arrange
    const authHelper = pageFactory.authHelper();
    const superadminEmail = process.env.SUPERADMIN_EMAIL;
    const superadminPassword = process.env.SUPERADMIN_PASSWORD;

    if (!superadminPassword) {
      test.skip(true, 'SUPERADMIN_PASSWORD environment variable not set');
    }

    // Act - Login and navigate
    await page.goto('https://haldeki.com');
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(superadminEmail, superadminPassword);
    await authHelper.submitLogin();
    await page.waitForTimeout(2000);

    await page.goto('https://haldeki.com/tedarikci');
    await page.waitForLoadState('networkidle');

    // Assert - Should see supplier-related content
    // This could be supplier list, metrics, or supplier management UI
    const content = page.locator('body');
    const textContent = await content.textContent();

    // Check that we're not seeing the "not found" error
    expect(textContent).not.toMatch(/Tedarikçi kaydı bulunamadı/);

    // Check that we have some meaningful content
    expect(textContent?.length).toBeGreaterThan(100);

    // Take screenshot
    await page.screenshot({ path: 'test-results/superadmin-supplier-data.png', fullPage: true });
  });

  test('should have no console errors when accessing /tedarikci', async ({ page }) => {
    // Arrange
    const authHelper = pageFactory.authHelper();
    const superadminEmail = process.env.SUPERADMIN_EMAIL;
    const superadminPassword = process.env.SUPERADMIN_PASSWORD;

    if (!superadminPassword) {
      test.skip(true, 'SUPERADMIN_PASSWORD environment variable not set');
    }

    // Collect console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Act
    await page.goto('https://haldeki.com');
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(superadminEmail, superadminPassword);
    await authHelper.submitLogin();
    await page.waitForTimeout(2000);

    await page.goto('https://haldeki.com/tedarikci');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow time for any async errors

    // Assert
    expect(errors).toHaveLength(0);

    // Log any warnings
    const warnings: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    if (warnings.length > 0) {
      console.log('Console warnings:', warnings);
    }
  });

  test('should handle direct navigation to /tedarikci', async ({ page }) => {
    // Arrange
    const authHelper = pageFactory.authHelper();
    const superadminEmail = process.env.SUPERADMIN_EMAIL;
    const superadminPassword = process.env.SUPERADMIN_PASSWORD;

    if (!superadminPassword) {
      test.skip(true, 'SUPERADMIN_PASSWORD environment variable not set');
    }

    // Act - Direct navigation to supplier dashboard
    await page.goto('https://haldeki.com');
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(superadminEmail, superadminPassword);
    await authHelper.submitLogin();
    await page.waitForTimeout(2000);

    // Direct URL navigation
    await page.goto('https://haldeki.com/tedarikci');
    await page.waitForLoadState('networkidle');

    // Assert - Should successfully load
    await expect(page).toHaveURL(/\/tedarikci/);

    // Should not redirect away
    const currentUrl = page.url();
    expect(currentUrl).toContain('tedarikci');
    expect(currentUrl).not.toContain('giris');
    expect(currentUrl).not.toContain('beklemede');

    // Screenshot
    await page.screenshot({ path: 'test-results/superadmin-direct-navigation.png', fullPage: true });
  });
});

/**
 * Test Environment Setup
 *
 * To run these tests against production:
 *
 * 1. Set environment variables:
 *    export SUPERADMIN_EMAIL="admin@haldeki.com"
 *    export SUPERADMIN_PASSWORD="your-password"
 *
 * 2. Run tests:
 *    npx playwright test tests/e2e/supplier/superadmin-access.spec.ts --headed
 *
 * 3. Or create a .env.test file:
 *    SUPERADMIN_EMAIL=admin@haldeki.com
 *    SUPERADMIN_PASSWORD=your-password
 *
 * Note: These credentials should match a real SuperAdmin account in production.
 */
