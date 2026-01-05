import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { OrdersPageFactory } from '../../helpers/pages-orders';
import { TEST_USERS } from '../../helpers/auth';

/**
 * Customer Repeat Order E2E Tests
 * Tests the complete repeat order flow for regular customers
 */

test.describe('Customer Repeat Order Flow', () => {
  let pageFactory: PageFactory;
  let ordersPageFactory: OrdersPageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);
    ordersPageFactory = new OrdersPageFactory(page);

    // Login as customer
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('customer');

    // Select region if modal appears
    const homePage = pageFactory.home();
    await homePage.selectRegion('Menemen');
  });

  test.describe('Test 5: Regular customer repeat order', () => {
    test('should complete repeat order from account page', async ({ page }) => {
      // Arrange - Navigate to orders page
      const customerOrders = ordersPageFactory.customerOrders();
      await customerOrders.goto();

      // Wait for orders to load
      await page.waitForSelector('[data-testid="orders-container"]');

      // Find a delivered order
      const deliveredOrders = page.locator('[data-testid="order-item"][data-status="delivered"]');
      const count = await deliveredOrders.count();

      // Skip if no delivered orders
      test.skip(count === 0, 'No delivered orders found for testing');

      // Get the first delivered order
      const firstOrder = deliveredOrders.first();
      const orderId = await firstOrder.getAttribute('data-order-id');
      expect(orderId).toBeTruthy();

      // Expand order to see details
      await customerOrders.expandOrder(orderId!);

      // Verify repeat order button is visible
      const isButtonVisible = await customerOrders.isRepeatOrderButtonVisible(orderId!);
      expect(isButtonVisible).toBe(true);

      // Act - Click repeat order button
      await customerOrders.clickRepeatOrder(orderId!);

      // Assert - Validation dialog appears
      const dialog = ordersPageFactory.repeatOrderDialog();
      await dialog.waitForVisible();

      const title = await dialog.getTitle().textContent();
      expect(title).toContain('Tekrar Sipariş Onayı');

      // Assert - Available items are listed
      const availableCount = await dialog.getAvailableItemsCount();
      expect(availableCount).toBeGreaterThan(0);

      // Assert - Price information is displayed
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();

      // Act - Confirm repeat order
      await dialog.clickConfirm();

      // Assert - Dialog closes
      await dialog.waitForHidden();

      // Assert - Success toast appears
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      const toastMessage = await page.locator('[data-testid="toast-success"]').textContent();
      expect(toastMessage).toContain('sepete eklendi');

      // Assert - Cart is populated with correct items
      const cartCount = await pageFactory.home().getCartItemCount();
      expect(cartCount).toBeGreaterThan(0);

      // Assert - Navigation to checkout page
      await expect(page).toHaveURL('**/teslimat');
    });

    test('should show order details before repeat', async ({ page }) => {
      // Arrange
      const customerOrders = ordersPageFactory.customerOrders();
      await customerOrders.goto();

      await page.waitForSelector('[data-testid="orders-container"]');

      // Find a delivered order
      const deliveredOrders = page.locator('[data-testid="order-item"][data-status="delivered"]');
      const count = await deliveredOrders.count();
      test.skip(count === 0, 'No delivered orders found');

      const firstOrder = deliveredOrders.first();
      const orderId = await firstOrder.getAttribute('data-order-id');

      // Act - Expand order
      await customerOrders.expandOrder(orderId!);

      // Assert - Order items are visible
      const orderItems = customerOrders.getOrderItems(orderId!);
      await expect(orderItems).toBeVisible();

      // Assert - Order total is visible
      const orderTotal = await customerOrders.getOrderTotal(orderId!);
      expect(orderTotal).toBeTruthy();
      expect(orderTotal).toContain('₺');

      // Assert - Order date is visible
      await expect(page.locator('[data-testid="order-date"]')).toBeVisible();
    });

    test('should validate all items are available', async ({ page }) => {
      // Arrange
      const customerOrders = ordersPageFactory.customerOrders();
      await customerOrders.goto();

      await page.waitForSelector('[data-testid="orders-container"]');

      const deliveredOrders = page.locator('[data-testid="order-item"][data-status="delivered"]');
      const count = await deliveredOrders.count();
      test.skip(count === 0, 'No delivered orders found');

      const firstOrder = deliveredOrders.first();
      const orderId = await firstOrder.getAttribute('data-order-id');

      // Act
      await customerOrders.clickRepeatOrder(orderId!);

      // Assert
      const dialog = ordersPageFactory.repeatOrderDialog();
      await dialog.waitForVisible();

      // Verify dialog title
      await expect(dialog.getTitle()).toContainText('Tekrar Sipariş Onayı');

      // Verify available items section
      await expect(dialog.getAvailableItems()).toBeVisible();

      // Verify description mentions item count
      const description = await page.locator('[data-testid="repeat-order-dialog-description"]').textContent();
      expect(description).toMatch(/\d+ ürün sepete eklenecek/);
    });

    test('should handle orders with multiple items', async ({ page }) => {
      // Arrange - Find an order with multiple items
      const customerOrders = ordersPageFactory.customerOrders();
      await customerOrders.goto();

      await page.waitForSelector('[data-testid="orders-container"]');

      // Look for orders with item count > 1
      const multiItemOrders = page.locator('[data-testid="order-item"][data-items-count="2"], [data-testid="order-item"][data-items-count="3"]');
      const count = await multiItemOrders.count();

      test.skip(count === 0, 'No multi-item orders found');

      const firstOrder = multiItemOrders.first();
      const orderId = await firstOrder.getAttribute('data-order-id');

      // Act
      await customerOrders.clickRepeatOrder(orderId!);

      // Assert - All items shown in dialog
      const dialog = ordersPageFactory.repeatOrderDialog();
      await dialog.waitForVisible();

      const availableCount = await dialog.getAvailableItemsCount();
      expect(availableCount).toBeGreaterThan(1);
    });

    test('should show order timeline before repeat', async ({ page }) => {
      // This test verifies the order tracking timeline is visible
      // before clicking repeat order

      test.skip(true, 'Requires order with timeline data');

      // Arrange
      const customerOrders = ordersPageFactory.customerOrders();
      await customerOrders.goto();

      const deliveredOrders = page.locator('[data-testid="order-item"][data-status="delivered"]');
      const firstOrder = deliveredOrders.first();
      const orderId = await firstOrder.getAttribute('data-order-id');

      // Act - Expand order and click tracking button
      await customerOrders.expandOrder(orderId!);
      await page.click('[data-testid="order-tracking-button"]');

      // Assert - Order timeline dialog appears
      await expect(page.locator('[data-testid="order-timeline-dialog"]')).toBeVisible();

      // Assert - All timeline steps shown
      await expect(page.locator('[data-testid="timeline-step-pending"]')).toBeVisible();
      await expect(page.locator('[data-testid="timeline-step-delivered"]')).toHaveClass(/completed/);
    });
  });

  test.describe('Customer-specific behaviors', () => {
    test('should use customer variant pricing', async ({ page }) => {
      // Verify that customer prices (not business prices) are used
      test.skip(true, 'Requires price comparison setup');

      // Arrange
      // const customerOrders = ordersPageFactory.customerOrders();
      // await customerOrders.clickRepeatOrder(orderId);

      // const dialog = ordersPageFactory.repeatOrderDialog();
      // await dialog.waitForVisible();

      // Assert - Prices shown are customer prices (not business B2B prices)
      // This would require comparing with known business prices
    });

    test('should not show business-specific fields', async ({ page }) => {
      // Verify business-specific fields are not present for customers
      test.skip(true, 'Requires test order');

      // Assert - No business tax ID field
      // Assert - No business payment terms
    });
  });

  test.describe('Error scenarios for customers', () => {
    test('should handle unauthenticated state', async ({ page }) => {
      // Test that unauthenticated users are redirected to login
      const authHelper = pageFactory.authHelper();
      await authHelper.logout();

      // Try to access orders
      await page.goto('/hesabim/siparisler');

      // Assert - Redirected to login
      await expect(page).toHaveURL('**/giris');
    });

    test('should handle empty order history', async ({ page }) => {
      // This would require a new customer with no orders
      test.skip(true, 'Requires new customer account');

      // Navigate to orders
      await page.goto('/hesabim/siparisler');

      // Assert - Empty state shown
      await expect(page.locator('[data-testid="empty-orders"]')).toBeVisible();
      await expect(page.locator('text=Henüz siparişiniz yok')).toBeVisible();
    });

    test('should show error for invalid order ID', async ({ page }) => {
      // This would involve trying to repeat an order that doesn't exist
      test.skip(true, 'Requires API endpoint testing');
    });
  });

  test.describe('UX and interactions', () => {
    test('should show loading state during validation', async ({ page }) => {
      test.skip(true, 'Requires slow network simulation');

      // Act - Click repeat order
      // Assert - Button shows loading state
      // await expect(page.locator('[data-testid="repeat-order-button"]')).toHaveText(/Kontrol Ediliyor.../);
    });

    test('should disable button while processing', async ({ page }) => {
      test.skip(true, 'Requires test order');

      // Arrange
      // const customerOrders = ordersPageFactory.customerOrders();
      // await customerOrders.clickRepeatOrder(orderId);

      // Assert - Button disabled during validation
      // const button = page.locator('[data-testid="repeat-order-button"]');
      // await expect(button).toBeDisabled();
    });

    test('should show product images in dialog', async ({ page }) => {
      test.skip(true, 'Requires orders with product images');

      // Assert - Product images visible in repeat order dialog
      // await expect(page.locator('[data-testid="product-image"]')).toBeVisible();
    });
  });

  test.describe('Post-repeat order behavior', () => {
    test('should navigate to checkout with items in cart', async ({ page }) => {
      test.skip(true, 'Requires test order and successful repeat');

      // Arrange - Complete repeat order
      // ...

      // Assert - Navigated to checkout
      await expect(page).toHaveURL('**/teslimat');

      // Assert - Cart items visible on checkout
      await expect(page.locator('[data-testid="checkout-items"]')).toBeVisible();

      // Assert - Order summary updated
      await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    });

    test('should allow modifying quantity after repeat', async ({ page }) => {
      test.skip(true, 'Requires successful repeat order');

      // Arrange - Items added to cart via repeat order
      // Navigate to cart instead of checkout
      // const cartPage = pageFactory.cart();
      // await cartPage.goto();

      // Act - Modify quantity
      // await cartPage.updateItemQuantity(productId, 5);

      // Assert - Quantity updated
      // const quantity = await page.locator('[data-testid="quantity-input"]').inputValue();
      // expect(quantity).toBe('5');
    });

    test('should preserve customer address from previous order', async ({ page }) => {
      test.skip(true, 'Requires order with address');

      // Assert - Previous address is pre-selected on checkout
      // await expect(page.locator('[data-testid="selected-address"]')).toBeVisible();
    });
  });

  test.describe('Integration with cart', () => {
    test('should merge with existing cart items', async ({ page }) => {
      // Arrange - Add items to cart first
      const productsPage = pageFactory.products();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('test-product-1');

      const initialCount = await pageFactory.home().getCartItemCount();

      // Act - Repeat order (some items may already be in cart)
      test.skip(true, 'Requires test order');

      // Assert - Cart properly merges items
      // const finalCount = await pageFactory.home().getCartItemCount();
      // expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    });

    test('should clear cart before adding repeat order items', async ({ page }) => {
      // This is an alternative behavior - some implementations might clear cart
      test.skip(true, 'Requires specific cart behavior verification');
    });
  });

  test.describe('Mobile responsiveness', () => {
    test('should work correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      test.skip(true, 'Requires test order');

      // Arrange
      // const customerOrders = ordersPageFactory.customerOrders();
      // await customerOrders.goto();

      // Act - Repeat order
      // await customerOrders.clickRepeatOrder(orderId);

      // Assert - Dialog fits in mobile viewport
      // await expect(page.locator('[data-testid="repeat-order-dialog"]')).toBeVisible();

      // Assert - Scrollable if needed
      // const dialog = page.locator('[data-testid="repeat-order-dialog"]');
      // await expect(dialog).toHaveAttribute('class', /scroll/);
    });

    test('should have touch-friendly buttons on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      test.skip(true, 'Requires test order');

      // Assert - Buttons are large enough for touch (min 44x44px)
      // const button = page.locator('[data-testid="confirm-repeat-order"]');
      // const box = await button.boundingBox();
      // expect(box?.height).toBeGreaterThanOrEqual(44);
    });
  });
});

/**
 * Test data setup helper for customer repeat order tests
 */
async function setupCustomerTestOrder(): Promise<void> {
  // Implementation would:
  // 1. Create a customer user
  // 2. Create products
  // 3. Create an order with those products
  // 4. Mark order as delivered
  // This would typically be done in a global setup or via database migrations
}
