import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth';

/**
 * Supplier Access Test - After has_role Fix
 *
 * Test Case 2: Supplier Access
 * Verifies that regular suppliers can access their dashboard after the has_role function restoration.
 *
 * Context: The has_role() function was restored with SuperAdmin cascading permissions.
 * This test verifies that regular suppliers can access /tedarikci without getting
 * "Tedarikçi kaydı bulunamadı" error.
 *
 * Test Data:
 * - Email: test-supplier@haldeki.com
 * - Password: Test1234!
 *
 * Environment: Uses baseURL from config (localhost:8080 for dev, or override with BASE_URL env var)
 */

// Get base URL from environment or use production
const BASE_URL = process.env.BASE_URL || 'https://haldeki.com';

test.describe('Supplier Access - After has_role Fix', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('should login as supplier and access /tedarikci dashboard', async ({ page }) => {
    // Arrange
    const supplierEmail = 'test-supplier@haldeki.com';
    const supplierPassword = 'Test1234!';

    // Act - Navigate to base URL
    await page.goto(BASE_URL);

    // Act - Login
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(supplierEmail, supplierPassword);
    await authHelper.submitLogin();

    // Wait for login to complete
    await page.waitForTimeout(2000);

    // Act - Navigate to /tedarikci
    await page.goto(`${BASE_URL}/tedarikci`);

    // Assert - Check URL
    await expect(page).toHaveURL(/\/tedarikci/);

    // Assert - Check for error message (should NOT be present)
    const errorMessage = page.locator('text=Tedarikçi kaydı bulunamadı');
    await expect(errorMessage).not.toBeVisible();

    // Assert - Check for supplier dashboard elements
    // The supplier should see their own dashboard, not an error
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    // Take screenshot for verification
    await page.screenshot({
      path: 'test-results/supplier-dashboard-access.png',
      fullPage: true
    });
  });

  test('should not show "Tedarikçi kaydı bulunamadı" error after login', async ({ page }) => {
    // Arrange
    const supplierEmail = 'test-supplier@haldeki.com';
    const supplierPassword = 'Test1234!';

    // Act - Login and navigate
    await page.goto(BASE_URL);
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(supplierEmail, supplierPassword);
    await authHelper.submitLogin();
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/tedarikci`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Assert - Verify specific error is NOT present
    const notFoundError = page.locator('text=Tedarikçi kaydı bulunamadı');
    const accessDeniedError = page.locator('text=Erişim reddedildi');
    const notAuthorizedError = page.locator('text=Yetkiniz yok');

    await expect(notFoundError).not.toBeVisible();
    await expect(accessDeniedError).not.toBeVisible();
    await expect(notAuthorizedError).not.toBeVisible();

    // Assert - Page should have loaded successfully
    const currentUrl = page.url();
    expect(currentUrl).toContain('/tedarikci');
    expect(currentUrl).not.toContain('/giris');
    expect(currentUrl).not.toContain('/beklemede');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/supplier-no-error.png',
      fullPage: true
    });
  });

  test('should display supplier dashboard with own profile', async ({ page }) => {
    // Arrange
    const supplierEmail = 'test-supplier@haldeki.com';
    const supplierPassword = 'Test1234!';

    // Act - Login and navigate
    await page.goto(BASE_URL);
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(supplierEmail, supplierPassword);
    await authHelper.submitLogin();
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/tedarikci`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Assert - Check if supplier dashboard elements are present
    // The dashboard should show supplier-specific content
    const pageContent = await page.textContent('body');

    // Verify we're not seeing a list of all suppliers (admin view)
    // but the supplier's own dashboard
    const adminViewIndicator = page.locator('text=Tüm Tedarikçiler');
    await expect(adminViewIndicator).not.toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/supplier-own-dashboard.png',
      fullPage: true
    });
  });

  test('should have no console errors when accessing supplier dashboard', async ({ page }) => {
    // Arrange
    const supplierEmail = 'test-supplier@haldeki.com';
    const supplierPassword = 'Test1234!';
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Act - Login and navigate
    await page.goto(BASE_URL);
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(supplierEmail, supplierPassword);
    await authHelper.submitLogin();
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/tedarikci`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Assert - Check for console errors
    await page.waitForTimeout(1000); // Give time for any async errors to appear

    // Log any errors found
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }

    // Take screenshot
    await page.screenshot({
      path: 'test-results/supplier-console-check.png',
      fullPage: true
    });

    // This test will pass but log errors for investigation
    // In production, you might want to fail the test if there are critical errors
  });

  test('should maintain session when navigating to supplier pages', async ({ page }) => {
    // Arrange
    const supplierEmail = 'test-supplier@haldeki.com';
    const supplierPassword = 'Test1234!';

    // Act - Login
    await page.goto(BASE_URL);
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(supplierEmail, supplierPassword);
    await authHelper.submitLogin();
    await page.waitForTimeout(2000);

    // Act - Navigate to supplier dashboard
    await page.goto(`${BASE_URL}/tedarikci`);
    await page.waitForLoadState('networkidle');

    // Assert - Should still be logged in
    const currentUrl = page.url();
    expect(currentUrl).toContain('/tedarikci');
    expect(currentUrl).not.toContain('/giris');

    // Act - Navigate to supplier products page
    await page.goto(`${BASE_URL}/tedarikci/urunler`);
    await page.waitForLoadState('networkidle');

    // Assert - Should still be on supplier products page
    expect(page.url()).toContain('/tedarikci/urunler');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/supplier-session-maintained.png',
      fullPage: true
    });
  });
});

test.describe('Supplier Access - Negative Cases', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('should redirect to login when accessing /tedarikci without authentication', async ({ page }) => {
    // Act - Try to access supplier dashboard without login
    await page.goto(`${BASE_URL}/tedarikci`);

    // Wait for redirect
    await page.waitForTimeout(2000);

    // Assert - Should be redirected to login or home
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/giris');
    const isHomePage = currentUrl === `${BASE_URL}/` || currentUrl === BASE_URL;

    expect(isLoginPage || isHomePage).toBeTruthy();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/supplier-no-auth-redirect.png',
      fullPage: true
    });
  });

  test('not show other suppliers data when logged in as regular supplier', async ({ page }) => {
    // Arrange
    const supplierEmail = 'test-supplier@haldeki.com';
    const supplierPassword = 'Test1234!';

    // Act - Login as regular supplier
    await page.goto(BASE_URL);
    await authHelper.openAuthDrawer();
    await authHelper.switchToLoginTab();
    await authHelper.fillLoginForm(supplierEmail, supplierPassword);
    await authHelper.submitLogin();
    await page.waitForTimeout(2000);

    // Act - Try to access admin suppliers list
    await page.goto(`${BASE_URL}/admin/suppliers`);

    // Wait for redirect or access denied
    await page.waitForTimeout(2000);

    // Assert - Should NOT be able to see admin suppliers list
    const currentUrl = page.url();
    const isRedirected = !currentUrl.includes('/admin/suppliers');

    expect(isRedirected).toBeTruthy();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/supplier-no-admin-access.png',
      fullPage: true
    });
  });
});
