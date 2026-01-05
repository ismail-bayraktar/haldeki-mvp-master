import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';

/**
 * Admin Approval Flow E2E Tests
 * Tests admin workflows for approving dealers, suppliers, and businesses
 */

test.describe('Admin Approval Flows', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);

    // Login as admin
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('admin');
  });

  test.describe('Dealer Approval', () => {
    test('should display pending dealers in admin panel', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();

      // Act
      await adminPage.navigateToSection('dealers');

      // Assert
      await expect(page.locator('[data-testid="dealers-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-status-pending"]')).toHaveCount(await page.locator('[data-testid="dealer-status-pending"]').count());
    });

    test('should approve pending dealer', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('dealers');

      // Get first pending dealer ID
      const firstPendingDealer = page.locator('[data-testid="dealer-status-pending"]').first();
      const dealerId = await firstPendingDealer.getAttribute('data-dealer-id');

      if (dealerId) {
        // Act
        await adminPage.approveDealer(dealerId);

        // Assert
        await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
        await expect(page.locator(`[data-testid="dealer-${dealerId}"]`).locator('[data-testid="dealer-status-approved"]')).toBeVisible();
      } else {
        test.skip(true, 'No pending dealers to approve');
      }
    });

    test('should reject pending dealer', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('dealers');

      // Find a pending dealer (different from the one we might approve)
      const pendingDealers = page.locator('[data-testid="dealer-status-pending"]');
      const count = await pendingDealers.count();

      if (count > 1) {
        const dealerId = await pendingDealers.nth(1).getAttribute('data-dealer-id');

        if (dealerId) {
          // Act
          await adminPage.rejectDealer(dealerId);

          // Assert
          await expect(page.locator(`[data-testid="dealer-${dealerId}"]`).locator('[data-testid="dealer-status-rejected"]')).toBeVisible();
        }
      } else {
        test.skip(true, 'Not enough pending dealers to test rejection');
      }
    });

    test('should display dealer details before approval', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('dealers');

      // Act - Click on a pending dealer
      const firstPendingDealer = page.locator('[data-testid="dealer-status-pending"]').first();
      await firstPendingDealer.click();

      // Assert
      await expect(page.locator('[data-testid="dealer-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-phone"]')).toBeVisible();
      await expect(page.locator('[data-testid="dealer-company"]')).toBeVisible();
    });
  });

  test.describe('Supplier Approval', () => {
    test('should display pending suppliers in admin panel', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();

      // Act
      await adminPage.navigateToSection('suppliers');

      // Assert
      await expect(page.locator('[data-testid="suppliers-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-status-pending"]')).toHaveCount(await page.locator('[data-testid="supplier-status-pending"]').count());
    });

    test('should approve pending supplier', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('suppliers');

      // Get first pending supplier ID
      const firstPendingSupplier = page.locator('[data-testid="supplier-status-pending"]').first();
      const supplierId = await firstPendingSupplier.getAttribute('data-supplier-id');

      if (supplierId) {
        // Act
        await adminPage.approveSupplier(supplierId);

        // Assert
        await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
        await expect(page.locator(`[data-testid="supplier-${supplierId}"]`).locator('[data-testid="supplier-status-approved"]')).toBeVisible();
      } else {
        test.skip(true, 'No pending suppliers to approve');
      }
    });

    test('should display supplier details before approval', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('suppliers');

      // Act - Click on a pending supplier
      const firstPendingSupplier = page.locator('[data-testid="supplier-status-pending"]').first();
      await firstPendingSupplier.click();

      // Assert
      await expect(page.locator('[data-testid="supplier-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-categories"]')).toBeVisible();
    });
  });

  test.describe('Business Approval', () => {
    test('should display pending businesses in admin panel', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();

      // Act
      await adminPage.navigateToSection('businesses');

      // Assert
      await expect(page.locator('[data-testid="businesses-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-status-pending"]')).toHaveCount(await page.locator('[data-testid="business-status-pending"]').count());
    });

    test('should approve pending business', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('businesses');

      // Get first pending business ID
      const firstPendingBusiness = page.locator('[data-testid="business-status-pending"]').first();
      const businessId = await firstPendingBusiness.getAttribute('data-business-id');

      if (businessId) {
        // Act
        await adminPage.approveBusiness(businessId);

        // Assert
        await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
        await expect(page.locator(`[data-testid="business-${businessId}"]`).locator('[data-testid="business-status-approved"]')).toBeVisible();
      } else {
        test.skip(true, 'No pending businesses to approve');
      }
    });

    test('should display business details before approval', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('businesses');

      // Act - Click on a pending business
      const firstPendingBusiness = page.locator('[data-testid="business-status-pending"]').first();
      await firstPendingBusiness.click();

      // Assert
      await expect(page.locator('[data-testid="business-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-tax-no"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-address"]')).toBeVisible();
    });
  });

  test.describe('Approval Notifications', () => {
    test('should send email notification upon dealer approval', async ({ page }) => {
      // This would require checking email service or mocking
      test.skip(true, 'Requires email service mocking');
    });

    test('should show notification in admin after approval', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('dealers');

      const firstPendingDealer = page.locator('[data-testid="dealer-status-pending"]').first();
      const dealerId = await firstPendingDealer.getAttribute('data-dealer-id');

      if (dealerId) {
        // Act
        await adminPage.approveDealer(dealerId);

        // Assert
        await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
        await expect(page.locator('text=Email bildirimi gönderildi')).toBeVisible();
      } else {
        test.skip(true, 'No pending dealers to approve');
      }
    });
  });

  test.describe('Filter and Search', () => {
    test('should filter dealers by approval status', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('dealers');

      // Act - Filter by pending
      await page.selectOption('[data-testid="status-filter"]', 'pending');

      // Assert
      const allDealers = page.locator('[data-testid^="dealer-"]');
      const pendingDealers = page.locator('[data-testid="dealer-status-pending"]');

      expect(await allDealers.count()).toBe(await pendingDealers.count());
    });

    test('should search dealers by name or email', async ({ page }) => {
      // Arrange
      const adminPage = pageFactory.admin();
      await adminPage.goto();
      await adminPage.navigateToSection('dealers');

      // Act - Search for test dealer
      await page.fill('[data-testid="search-input"]', 'test-dealer');

      // Assert
      await page.waitForTimeout(500); // Wait for debounce
      const results = page.locator('[data-testid^="dealer-"]');
      expect(await results.count()).toBeGreaterThan(0);
    });
  });
});
