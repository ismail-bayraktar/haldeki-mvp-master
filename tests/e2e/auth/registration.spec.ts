import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { setupDatabaseHelper, cleanupTestData } from '../../helpers/database';

/**
 * Registration Flow E2E Tests
 * Tests registration for dealers, suppliers, and businesses
 */

test.describe('Registration Flows', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);
  });

  test.describe('Dealer Registration', () => {
    test('should display dealer registration form', async ({ page }) => {
      // Arrange & Act
      const authPage = pageFactory.auth();
      await authPage.gotoDealerRegistration();

      // Assert
      await expect(page.locator('[data-testid="dealer-registration-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="company-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="tax-number-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="phone-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="address-input"]')).toBeVisible();
    });

    test('should submit dealer registration successfully', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoDealerRegistration();

      const timestamp = Date.now();
      const email = `test-dealer-${timestamp}@example.com`;

      // Act - Fill registration form
      await page.fill('[data-testid="name-input"]', 'Test Dealer');
      await page.fill('[data-testid="email-input"]', email);
      await page.fill('[data-testid="password-input"]', 'Test123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Test123!');
      await page.fill('[data-testid="company-name-input"]', 'Test Company');
      await page.fill('[data-testid="tax-number-input"]', '1234567890');
      await page.fill('[data-testid="phone-input"]', '+905551234567');
      await page.fill('[data-testid="address-input"]', 'Test Address');
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="submit-registration"]');

      // Assert
      await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
      await expect(page.locator('text=Başvurunuz alınmıştır')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoDealerRegistration();

      // Act - Submit without filling
      await page.click('[data-testid="submit-registration"]');

      // Assert
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="company-error"]')).toBeVisible();
    });

    test('should validate tax number format', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoDealerRegistration();

      // Act - Fill with invalid tax number
      await page.fill('[data-testid="tax-number-input"]', 'invalid');
      await page.click('[data-testid="submit-registration"]');

      // Assert
      await expect(page.locator('[data-testid="tax-number-error"]')).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoDealerRegistration();

      // Act - Fill with mismatched passwords
      await page.fill('[data-testid="password-input"]', 'Test123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Different123!');
      await page.click('[data-testid="submit-registration"]');

      // Assert
      await expect(page.locator('[data-testid="confirm-password-error"]')).toBeVisible();
    });

    test('should require terms acceptance', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoDealerRegistration();

      // Fill valid data but don't accept terms
      const timestamp = Date.now();
      await page.fill('[data-testid="name-input"]', 'Test Dealer');
      await page.fill('[data-testid="email-input"]', `test-dealer-${timestamp}@example.com`);
      await page.fill('[data-testid="password-input"]', 'Test123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Test123!');
      await page.fill('[data-testid="company-name-input"]', 'Test Company');
      await page.fill('[data-testid="tax-number-input"]', '1234567890');
      await page.fill('[data-testid="phone-input"]', '+905551234567');
      await page.fill('[data-testid="address-input"]', 'Test Address');

      // Act - Submit without accepting terms
      await page.click('[data-testid="submit-registration"]');

      // Assert
      await expect(page.locator('[data-testid="terms-error"]')).toBeVisible();
    });
  });

  test.describe('Supplier Registration', () => {
    test('should display supplier registration form', async ({ page }) => {
      // Arrange & Act
      const authPage = pageFactory.auth();
      await authPage.gotoSupplierRegistration();

      // Assert
      await expect(page.locator('[data-testid="supplier-registration-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="company-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="tax-number-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="categories-select"]')).toBeVisible();
    });

    test('should submit supplier registration successfully', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoSupplierRegistration();

      const timestamp = Date.now();
      const email = `test-supplier-${timestamp}@example.com`;

      // Act - Fill registration form
      await page.fill('[data-testid="name-input"]', 'Test Supplier');
      await page.fill('[data-testid="email-input"]', email);
      await page.fill('[data-testid="password-input"]', 'Test123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Test123!');
      await page.fill('[data-testid="company-name-input"]', 'Test Supplier Co');
      await page.fill('[data-testid="tax-number-input"]', '9876543210');
      await page.fill('[data-testid="phone-input"]', '+905559876543');
      await page.fill('[data-testid="address-input"]', 'Supplier Address');

      // Select categories
      await page.click('[data-testid="categories-select"]');
      await page.click('[data-testid="category-sebze"]');

      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="submit-registration"]');

      // Assert
      await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    });

    test('should require at least one category selection', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoSupplierRegistration();

      // Fill form but don't select categories
      const timestamp = Date.now();
      await page.fill('[data-testid="name-input"]', 'Test Supplier');
      await page.fill('[data-testid="email-input"]', `test-supplier-${timestamp}@example.com`);
      await page.fill('[data-testid="password-input"]', 'Test123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Test123!');
      await page.fill('[data-testid="company-name-input"]', 'Test Supplier Co');
      await page.fill('[data-testid="tax-number-input"]', '9876543210');
      await page.fill('[data-testid="phone-input"]', '+905559876543');
      await page.fill('[data-testid="address-input"]', 'Supplier Address');
      await page.check('[data-testid="terms-checkbox"]');

      // Act
      await page.click('[data-testid="submit-registration"]');

      // Assert
      await expect(page.locator('[data-testid="categories-error"]')).toBeVisible();
    });
  });

  test.describe('Business Registration', () => {
    test('should display business registration form', async ({ page }) => {
      // Arrange & Act
      const authPage = pageFactory.auth();
      await authPage.gotoBusinessRegistration();

      // Assert
      await expect(page.locator('[data-testid="business-registration-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="company-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="tax-number-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-type-select"]')).toBeVisible();
    });

    test('should submit business registration successfully', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoBusinessRegistration();

      const timestamp = Date.now();
      const email = `test-business-${timestamp}@example.com`;

      // Act - Fill registration form
      await page.fill('[data-testid="name-input"]', 'Test Business Owner');
      await page.fill('[data-testid="email-input"]', email);
      await page.fill('[data-testid="password-input"]', 'Test123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Test123!');
      await page.fill('[data-testid="company-name-input"]', 'Test Business Inc');
      await page.fill('[data-testid="tax-number-input"]', '1122334455');
      await page.fill('[data-testid="phone-input"]', '+905551112233');
      await page.fill('[data-testid="address-input"]', 'Business Address');

      // Select business type
      await page.click('[data-testid="business-type-select"]');
      await page.click('[data-testid="type-restaurant"]');

      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="submit-registration"]');

      // Assert
      await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    });

    test('should require business type selection', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoBusinessRegistration();

      // Fill form but don't select business type
      const timestamp = Date.now();
      await page.fill('[data-testid="name-input"]', 'Test Business Owner');
      await page.fill('[data-testid="email-input"]', `test-business-${timestamp}@example.com`);
      await page.fill('[data-testid="password-input"]', 'Test123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Test123!');
      await page.fill('[data-testid="company-name-input"]', 'Test Business Inc');
      await page.fill('[data-testid="tax-number-input"]', '1122334455');
      await page.fill('[data-testid="phone-input"]', '+905551112233');
      await page.fill('[data-testid="address-input"]', 'Business Address');
      await page.check('[data-testid="terms-checkbox"]');

      // Act
      await page.click('[data-testid="submit-registration"]');

      // Assert
      await expect(page.locator('[data-testid="business-type-error"]')).toBeVisible();
    });
  });

  test.describe('Post-Registration Flow', () => {
    test('should show pending status after dealer registration', async ({ page }) => {
      // This test requires registration and then checking the status
      test.skip(true, 'Requires cleanup of test data');
    });

    test('should redirect to home after successful registration', async ({ page }) => {
      // Arrange
      const authPage = pageFactory.auth();
      await authPage.gotoDealerRegistration();

      const timestamp = Date.now();
      const email = `test-dealer-${timestamp}@example.com`;

      // Act - Fill and submit registration
      await page.fill('[data-testid="name-input"]', 'Test Dealer');
      await page.fill('[data-testid="email-input"]', email);
      await page.fill('[data-testid="password-input"]', 'Test123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Test123!');
      await page.fill('[data-testid="company-name-input"]', 'Test Company');
      await page.fill('[data-testid="tax-number-input"]', '1234567890');
      await page.fill('[data-testid="phone-input"]', '+905551234567');
      await page.fill('[data-testid="address-input"]', 'Test Address');
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="submit-registration"]');

      // Wait for success message and redirect
      await page.waitForURL('**/', { timeout: 5000 });
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data if any test created users
    // This would require tracking created users
  });
});
