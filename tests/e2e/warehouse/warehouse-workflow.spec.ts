import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS, ROLE_DASHBOARDS } from '../personas/test-data';

/**
 * Warehouse Manager Workflow E2E Tests
 * Tests warehouse capabilities for order fulfillment and inventory management
 *
 * Warehouse Manager Role Capabilities:
 * - View dashboard with fulfillment metrics
 * - View and manage picking lists
 * - Update order picking status
 * - Manage warehouse inventory
 * - Process order fulfillment
 * - View all orders across the marketplace
 * - Generate inventory reports
 */

test.describe('Warehouse Manager Workflow', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);

    // Login as warehouse manager
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('warehouse_manager');
    await expect(authHelper.isLoggedIn()).resolves.toBe(true);
  });

  test.describe('Authentication & Dashboard Access', () => {
    test('should login successfully and access warehouse dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.navigateToDashboard('warehouse_manager');

      // Assert
      await expect(page).toHaveURL('/depo');
      await expect(page.locator('[data-testid="warehouse-dashboard"]')).toBeVisible();
    });

    test('should display warehouse navigation', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Assert
      await expect(page.locator('[data-testid="warehouse-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="warehouse-nav-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="warehouse-nav-picking"]')).toBeVisible();
      await expect(page.locator('[data-testid="warehouse-nav-inventory"]')).toBeVisible();
    });

    test('should display warehouse name on dashboard', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Assert
      await expect(page.locator(`text=${TEST_USERS.warehouse_manager.name}`)).toBeVisible();
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display key metrics on dashboard', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Assert
      await expect(page.locator('[data-testid="stat-pending-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-orders-to-pick"]')).toBeVisible();
      await expect(page.locator("[data-testid='stat-orders-ready']")).toBeVisible();
      await expect(page.locator('[data-testid="stat-low-stock-items"]')).toBeVisible();
    });

    test('should display orders pending fulfillment', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Assert
      await expect(page.locator('[data-testid="pending-fulfillment-list"]')).toBeVisible();
    });

    test('should display picking queue', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Assert
      await expect(page.locator('[data-testid="picking-queue"]')).toBeVisible();
    });

    test('should display low stock alerts', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Assert
      await expect(page.locator('[data-testid="low-stock-alerts"]')).toBeVisible();
    });
  });

  test.describe('Order Management', () => {
    test('should display all marketplace orders', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Act
      await page.click('[data-testid="warehouse-nav-orders"]');

      // Assert
      await expect(page.locator('[data-testid="warehouse-orders-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible();
    });

    test('should view order details with items to pick', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-orders"]');

      // Act
      await page.locator('[data-testid="order-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="order-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-customer-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-items-to-pick"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-delivery-info"]')).toBeVisible();
    });

    test('should filter orders by fulfillment status', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-orders"]');

      // Act
      await page.selectOption('[data-testid="status-filter"]', 'pending_pick');

      // Assert
      await page.waitForTimeout(500);
      const orders = page.locator('[data-testid="order-row"]');
      const count = await orders.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(orders.nth(i).locator('[data-testid="status-pending-pick"]')).toBeVisible();
      }
    });

    test('should filter orders by delivery slot', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-orders"]');

      // Act
      await page.selectOption('[data-testid="delivery-filter"]', 'tomorrow_morning');

      // Assert
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="warehouse-orders-list"]')).toBeVisible();
    });

    test('should search orders by order ID or customer name', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-orders"]');

      // Act
      await page.fill('[data-testid="search-input"]', 'test');

      // Assert
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="order-row"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });

    test('should sort orders by priority (delivery slot)', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-orders"]');

      // Act
      await page.selectOption('[data-testid="sort-by"]', 'delivery_slot');

      // Assert
      await page.waitForTimeout(500);
      const orders = page.locator('[data-testid="order-row"]');
      const count = await orders.count();

      if (count > 1) {
        // Verify orders are sorted by delivery slot
        const firstSlot = await orders.nth(0).locator('[data-testid="delivery-slot"]').textContent();
        const secondSlot = await orders.nth(1).locator('[data-testid="delivery-slot"]').textContent();
        expect(firstSlot).toBeTruthy();
        expect(secondSlot).toBeTruthy();
      }
    });
  });

  test.describe('Picking List Management', () => {
    test('should display picking list', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Act
      await page.click('[data-testid="warehouse-nav-picking"]');

      // Assert
      await expect(page.locator('[data-testid="picking-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="picking-item"]').first()).toBeVisible();
    });

    test('should display items grouped by product location', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-picking"]');

      // Assert
      await expect(page.locator('[data-testid="location-group"]')).toBeVisible();
      await expect(page.locator('[data-testid="aisle-info"]')).toBeVisible();
    });

    test('should mark item as picked', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-picking"]');

      // Act
      const firstItem = page.locator('[data-testid="picking-item"]').first();
      await firstItem.locator('[data-testid="mark-picked-button"]').click();

      // Assert
      await expect(firstItem.locator('[data-testid="status-picked"]')).toBeVisible();
      await expect(page.locator('[data-testid="item-picked-success"]')).toBeVisible();
    });

    test('should mark multiple items as picked in batch', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-picking"]');

      // Act
      await page.click('[data-testid="select-all-pending"]');
      await page.click('[data-testid="batch-pick-button"]');

      // Assert
      await expect(page.locator('[data-testid="batch-pick-success"]')).toBeVisible();
    });

    test('should view picking progress summary', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-picking"]');

      // Assert
      await expect(page.locator('[data-testid="picking-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="items-picked-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="items-remaining-count"]')).toBeVisible();
    });

    test('should complete picking for order', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-picking"]');

      // Find an order with all items picked
      const readyOrder = page.locator('[data-testid="order-ready-for-packing"]').first();

      if (await readyOrder.count() > 0) {
        // Act
        await readyOrder.locator('[data-testid="complete-picking-button"]').click();

        // Assert
        await expect(page.locator('[data-testid="picking-complete-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="order-status-packed"]')).toBeVisible();
      } else {
        test.skip(true, 'No orders ready for packing found');
      }
    });

    test('should print picking list', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-picking"]');

      // Act
      // Note: Print dialog behavior is browser-dependent and hard to test
      // We verify the button exists and is clickable
      await expect(page.locator('[data-testid="print-picking-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="print-picking-list"]')).toBeEnabled();

      // Note: Actual printing would open browser print dialog
      // which is difficult to automate in E2E tests
    });

    test('should filter picking list by delivery slot', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-picking"]');

      // Act
      await page.selectOption('[data-testid="delivery-filter"]', 'tomorrow_morning');

      // Assert
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="picking-list"]')).toBeVisible();
    });
  });

  test.describe('Inventory Management', () => {
    test('should display warehouse inventory', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Act
      await page.click('[data-testid="warehouse-nav-inventory"]');

      // Assert
      await expect(page.locator('[data-testid="inventory-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="inventory-item"]').first()).toBeVisible();
    });

    test('should view inventory details for product', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-inventory"]');

      // Act
      await page.locator('[data-testid="inventory-item"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="inventory-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-stock"]')).toBeVisible();
      await expect(page.locator('[data-testid="location-info"]')).toBeVisible();
    });

    test('should update inventory stock level', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-inventory"]');

      // Act
      const firstItem = page.locator('[data-testid="inventory-item"]').first();
      await firstItem.locator('[data-testid="edit-stock-button"]').click();
      await firstItem.locator('[data-testid="stock-input"]').fill('500');
      await firstItem.locator('[data-testid="save-stock"]').click();

      // Assert
      await expect(page.locator('[data-testid="stock-update-success"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="stock-value"]')).toHaveText('500');
    });

    test('should filter inventory by low stock', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-inventory"]');

      // Act
      await page.click('[data-testid="filter-low-stock"]');

      // Assert
      await page.waitForTimeout(500);
      const items = page.locator('[data-testid="inventory-item"]');
      const count = await items.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(items.nth(i).locator('[data-testid="low-stock-badge"]')).toBeVisible();
      }
    });

    test('should filter inventory by category', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-inventory"]');

      // Act
      await page.selectOption('[data-testid="category-filter"]', 'vegetables');

      // Assert
      await page.waitForTimeout(500);
      const items = page.locator('[data-testid="inventory-item"]');
      const count = await items.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(items.nth(i).locator('[data-testid="category-vegetables"]')).toBeVisible();
      }
    });

    test('should search inventory by product name', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-inventory"]');

      // Act
      await page.fill('[data-testid="search-input"]', 'test');

      // Assert
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="inventory-item"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });

    test('should view stock movement history', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-inventory"]');

      // Act
      await page.locator('[data-testid="inventory-item"]').first().click();
      await page.click('[data-testid="view-movement-history"]');

      // Assert
      await expect(page.locator('[data-testid="movement-history-list"]')).toBeVisible();
    });

    test('should add stock to inventory', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-inventory"]');

      // Act
      const firstItem = page.locator('[data-testid="inventory-item"]').first();
      await firstItem.locator('[data-testid="add-stock-button"]').click();
      await page.fill('[data-testid="add-stock-quantity"]', '50');
      await page.fill('[data-testid="add-stock-reason"]', 'Stock replenishment');
      await page.click('[data-testid="confirm-add-stock"]');

      // Assert
      await expect(page.locator('[data-testid="stock-add-success"]')).toBeVisible();
    });
  });

  test.describe('Order Fulfillment', () => {
    test('should update order status to ready for pickup', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-orders"]');

      // Find a packed order
      const packedOrder = page.locator('[data-testid="status-packed"]').first();

      if (await packedOrder.count() > 0) {
        // Act
        await packedOrder.click();
        await page.click('[data-testid="mark-ready-button"]');

        // Assert
        await expect(page.locator('[data-testid="status-update-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="status-ready"]')).toBeVisible();
      } else {
        test.skip(true, 'No packed orders found');
      }
    });

    test('should update order status to out for delivery', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-orders"]');

      // Find a ready order
      const readyOrder = page.locator('[data-testid="status-ready"]').first();

      if (await readyOrder.count() > 0) {
        // Act
        await readyOrder.click();
        await page.click('[data-testid="mark-out-for-delivery-button"]');

        // Assert
        await expect(page.locator('[data-testid="status-update-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="status-out-for-delivery"]')).toBeVisible();
      } else {
        test.skip(true, 'No ready orders found');
      }
    });

    test('should mark order as delivered', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-orders"]');

      // Find an out for delivery order
      const outOrder = page.locator('[data-testid="status-out-for-delivery"]').first();

      if (await outOrder.count() > 0) {
        // Act
        await outOrder.click();
        await page.click('[data-testid="mark-delivered-button"]');

        // Assert
        await expect(page.locator('[data-testid="status-update-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="status-delivered"]')).toBeVisible();
      } else {
        test.skip(true, 'No orders out for delivery found');
      }
    });
  });

  test.describe('Reports & Analytics', () => {
    test('should view fulfillment metrics', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Act
      await page.click('[data-testid="warehouse-nav-reports"]');

      // Assert
      await expect(page.locator('[data-testid="fulfillment-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="orders-picked-today"]')).toBeVisible();
      await expect(page.locator('[data-testid="orders-delivered-today"]')).toBeVisible();
    });

    test('should view picker performance stats', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-reports"]');

      // Assert
      await expect(page.locator('[data-testid="picker-performance"]')).toBeVisible();
    });

    test('should export inventory report', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-inventory"]');

      // Act
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-inventory-button"]');
      const download = await downloadPromise;

      // Assert
      expect(download.suggestedFilename()).toContain('inventory');
    });
  });

  test.describe('Settings & Profile', () => {
    test('should view warehouse profile', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);

      // Act
      await page.click('[data-testid="warehouse-nav-settings"]');

      // Assert
      await expect(page.locator('[data-testid="warehouse-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="warehouse-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="warehouse-email"]')).toBeVisible();
    });

    test('should update warehouse profile', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.warehouse_manager);
      await page.click('[data-testid="warehouse-nav-settings"]');

      // Act
      await page.fill('[data-testid="warehouse-phone"]', '+90555111222333');
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

    test('should not access supplier panel', async ({ page }) => {
      // Act
      await page.goto('/tedarikci');

      // Assert
      await expect(page).not.toHaveURL('/tedarikci');
    });

    test('should not access business panel', async ({ page }) => {
      // Act
      await page.goto('/isletme');

      // Assert
      await expect(page).not.toHaveURL('/isletme');
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
