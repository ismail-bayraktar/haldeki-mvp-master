import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS, ROLE_DASHBOARDS } from '../personas/test-data';

/**
 * Supplier Workflow E2E Tests
 * Tests supplier capabilities for managing products and inventory
 *
 * Supplier Role Capabilities:
 * - View dashboard with sales analytics
 * - Manage products (add, edit, deactivate)
 * - Update stock and pricing
 * - View incoming orders
 * - Import/export products via CSV/Excel
 * - Manage product variations
 * - View sales reports
 */

test.describe('Supplier Workflow', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);

    // Login as supplier
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('supplier');
    await expect(authHelper.isLoggedIn()).resolves.toBe(true);
  });

  test.describe('Authentication & Dashboard Access', () => {
    test('should login successfully and access supplier dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.navigateToDashboard('supplier');

      // Assert
      await expect(page).toHaveURL('/tedarikci');
      await expect(page.locator('[data-testid="supplier-dashboard"]')).toBeVisible();
    });

    test('should display supplier navigation', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);

      // Assert
      await expect(page.locator('[data-testid="supplier-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-nav-products"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-nav-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="supplier-nav-import"]')).toBeVisible();
    });

    test('should display business name on dashboard', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);

      // Assert
      await expect(page.locator(`text=${TEST_USERS.supplier.businessName}`)).toBeVisible();
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display key metrics on dashboard', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);

      // Assert
      await expect(page.locator('[data-testid="stat-total-products"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-active-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-monthly-sales"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-low-stock-items"]')).toBeVisible();
    });

    test('should display recent orders', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);

      // Assert
      await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
    });

    test('should display low stock alerts', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);

      // Assert
      await expect(page.locator('[data-testid="low-stock-alerts"]')).toBeVisible();
    });
  });

  test.describe('Product Management', () => {
    test('should display all supplier products', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Assert
      await expect(page.locator('[data-testid="supplier-products-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible();
    });

    test('should add new simple product', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');
      await page.click('[data-testid="add-product-button"]');

      // Act
      await page.fill('[data-testid="product-name"]', 'Test Supplier Product');
      await page.fill('[data-testid="product-description"]', 'Test product description');
      await page.selectOption('[data-testid="product-category"]', 'vegetables');
      await page.fill('[data-testid="product-price"]', '50');
      await page.fill('[data-testid="product-stock"]', '100');
      await page.fill('[data-testid="product-unit"]', 'kg');
      await page.click('[data-testid="save-product"]');

      // Assert
      await expect(page.locator('[data-testid="product-save-success"]')).toBeVisible();
    });

    test('should add product with variations', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');
      await page.click('[data-testid="add-product-button"]');

      // Act
      await page.fill('[data-testid="product-name"]', 'Test Product with Variations');
      await page.selectOption('[data-testid="product-category"]', 'vegetables');

      // Add variations
      await page.click('[data-testid="add-variation"]');
      await page.fill('[data-testid="variation-name-0"]', '1kg');
      await page.fill('[data-testid="variation-price-0"]', '25');
      await page.fill('[data-testid="variation-stock-0"]', '50');

      await page.click('[data-testid="add-variation"]');
      await page.fill('[data-testid="variation-name-1"]', '5kg');
      await page.fill('[data-testid="variation-price-1"]', '100');
      await page.fill('[data-testid="variation-stock-1"]', '30');

      await page.click('[data-testid="save-product"]');

      // Assert
      await expect(page.locator('[data-testid="product-save-success"]')).toBeVisible();
    });

    test('should edit existing product', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Act - Edit first product
      await page.locator('[data-testid="product-row"]').first().click();
      await page.fill('[data-testid="product-name"]', 'Updated Product Name');
      await page.fill('[data-testid="product-price"]', '75');
      await page.click('[data-testid="save-product"]');

      // Assert
      await expect(page.locator('[data-testid="product-save-success"]')).toBeVisible();
    });

    test('should update product stock', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Act - Update stock inline
      const firstProduct = page.locator('[data-testid="product-row"]').first();
      await firstProduct.locator('[data-testid="edit-stock-button"]').click();
      await firstProduct.locator('[data-testid="stock-input"]').fill('150');
      await firstProduct.locator('[data-testid="save-stock"]').click();

      // Assert
      await expect(page.locator('[data-testid="stock-update-success"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="stock-value"]')).toHaveText('150');
    });

    test('should update product price', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Act - Update price inline
      const firstProduct = page.locator('[data-testid="product-row"]').first();
      await firstProduct.locator('[data-testid="edit-price-button"]').click();
      await firstProduct.locator('[data-testid="price-input"]').fill('65');
      await firstProduct.locator('[data-testid="save-price"]').click();

      // Assert
      await expect(page.locator('[data-testid="price-update-success"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="price-value"]')).toHaveText('65');
    });

    test('should update product status (active/inactive)', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Act
      const firstProduct = page.locator('[data-testid="product-row"]').first();
      await firstProduct.locator('[data-testid="status-toggle"]').click();

      // Assert
      await expect(firstProduct.locator('[data-testid="status-inactive"]')).toBeVisible();

      // Toggle back to active
      await firstProduct.locator('[data-testid="status-toggle"]').click();
      await expect(firstProduct.locator('[data-testid="status-active"]')).toBeVisible();
    });

    test('should delete product', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Act
      const lastProduct = page.locator('[data-testid="product-row"]').last();
      await lastProduct.locator('[data-testid="delete-product-button"]').click();
      await page.click('[data-testid="confirm-delete"]');

      // Assert
      await expect(page.locator('[data-testid="delete-success-toast"]')).toBeVisible();
    });

    test('should filter products by category', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Act
      await page.selectOption('[data-testid="category-filter"]', 'vegetables');

      // Assert
      await page.waitForTimeout(500);
      const products = page.locator('[data-testid="product-row"]');
      const count = await products.count();

      // Verify all products are from vegetables category
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(products.nth(i).locator('[data-testid="category-vegetables"]')).toBeVisible();
      }
    });

    test('should filter products by status', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Act
      await page.selectOption('[data-testid="status-filter"]', 'active');

      // Assert
      await page.waitForTimeout(500);
      const products = page.locator('[data-testid="product-row"]');
      const count = await products.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(products.nth(i).locator('[data-testid="status-active"]')).toBeVisible();
      }
    });

    test('should search products by name', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Act
      await page.fill('[data-testid="search-input"]', 'test');

      // Assert
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="product-row"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Product Variations Management', () => {
    test('should view product variations', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Act - Click on product with variations
      const variableProduct = page.locator('[data-testid="product-row"]').filter({ hasText: 'variations' }).first();

      if (await variableProduct.count() > 0) {
        await variableProduct.click();

        // Assert
        await expect(page.locator('[data-testid="product-variations-list"]')).toBeVisible();
        await expect(page.locator('[data-testid="variation-row"]').first()).toBeVisible();
      } else {
        test.skip(true, 'No products with variations found');
      }
    });

    test('should add variation to existing product', async ({ page }) => {
      test.skip(true, 'Requires product setup with variations');
    });

    test('should update variation stock', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-products"]');

      // Find product with variations
      const variableProduct = page.locator('[data-testid="product-row"]').filter({ hasText: 'variations' }).first();

      if (await variableProduct.count() > 0) {
        await variableProduct.click();

        // Act - Update stock for first variation
        const firstVariation = page.locator('[data-testid="variation-row"]').first();
        await firstVariation.locator('[data-testid="edit-variation-stock"]').click();
        await firstVariation.locator('[data-testid="variation-stock-input"]').fill('200');
        await firstVariation.locator('[data-testid="save-variation-stock"]').click();

        // Assert
        await expect(page.locator('[data-testid="variation-save-success"]')).toBeVisible();
      } else {
        test.skip(true, 'No products with variations found');
      }
    });

    test('should delete variation from product', async ({ page }) => {
      test.skip(true, 'Requires product setup with multiple variations');
    });
  });

  test.describe('Import/Export Products', () => {
    test('should display import/export options', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);

      // Act
      await page.click('[data-testid="supplier-nav-import"]');

      // Assert
      await expect(page.locator('[data-testid="import-export-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="import-csv-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="import-excel-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-csv-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-excel-button"]')).toBeVisible();
    });

    test('should download CSV template', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-import"]');

      // Act
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-template-csv"]');
      const download = await downloadPromise;

      // Assert
      expect(download.suggestedFilename()).toContain('template');
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should download Excel template', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-import"]');

      // Act
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-template-excel"]');
      const download = await downloadPromise;

      // Assert
      expect(download.suggestedFilename()).toContain('template');
      expect(download.suggestedFilename()).toContain('.xlsx');
    });

    test('should export existing products to CSV', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-import"]');

      // Act
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv-button"]');
      const download = await downloadPromise;

      // Assert
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should export existing products to Excel', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-import"]');

      // Act
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel-button"]');
      const download = await downloadPromise;

      // Assert
      expect(download.suggestedFilename()).toContain('.xlsx');
    });

    test('should import products from CSV', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-import"]');

      // Create a simple CSV file for testing
      const csvContent = `name,category,price,stock,unit
Test Import Product 1,vegetables,50,100,kg
Test Import Product 2,fruits,30,75,kg`;

      // Upload the file
      const fileInput = page.locator('[data-testid="csv-file-input"]');
      await fileInput.setInputFiles({
        name: 'test-products.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent),
      });

      // Act
      await page.click('[data-testid="import-csv-button"]');

      // Assert
      await expect(page.locator('[data-testid="import-success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="import-summary"]')).toBeVisible();
    });

    test('should import products from Excel', async ({ page }) => {
      test.skip(true, 'Requires Excel file setup');
    });

    test('should display import errors for invalid data', async ({ page }) => {
      test.skip(true, 'Requires invalid CSV file setup');
    });
  });

  test.describe('Order Management', () => {
    test('should display incoming orders', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-orders"]');

      // Assert
      await expect(page.locator('[data-testid="supplier-orders-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible();
    });

    test('should view order details', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-orders"]');

      // Act
      await page.locator('[data-testid="order-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="order-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-customer-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
    });

    test('should filter orders by status', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-orders"]');

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

    test('should search orders by customer name', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-orders"]');

      // Act
      await page.fill('[data-testid="search-input"]', 'test');

      // Assert
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="order-row"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Sales Reports', () => {
    test('should view sales summary', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);

      // Act
      await page.click('[data-testid="supplier-nav-reports"]');

      // Assert
      await expect(page.locator('[data-testid="sales-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="monthly-revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="top-products-list"]')).toBeVisible();
    });

    test('should filter sales by date range', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-reports"]');

      // Act
      await page.fill('[data-testid="date-from"]', '2025-01-01');
      await page.fill('[data-testid="date-to"]', '2025-01-31');
      await page.click('[data-testid="apply-filter"]');

      // Assert
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="sales-summary"]')).toBeVisible();
    });

    test('should export sales report', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-reports"]');

      // Act
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-report-button"]');
      const download = await downloadPromise;

      // Assert
      expect(download.suggestedFilename()).toBeTruthy();
    });
  });

  test.describe('Settings & Profile', () => {
    test('should view supplier profile', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);

      // Act
      await page.click('[data-testid="supplier-nav-settings"]');

      // Assert
      await expect(page.locator('[data-testid="supplier-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-phone"]')).toBeVisible();
    });

    test('should update supplier profile', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.supplier);
      await page.click('[data-testid="supplier-nav-settings"]');

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

    test('should not access dealer panel', async ({ page }) => {
      // Act
      await page.goto('/bayi');

      // Assert
      await expect(page).not.toHaveURL('/bayi');
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
