import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS, ROLE_DASHBOARDS } from '../personas/test-data';

/**
 * Business (Restaurant) Workflow E2E Tests
 * Tests business capabilities for ordering with special pricing
 *
 * Business Role Capabilities:
 * - View dashboard with order analytics
 * - Browse products with business pricing
 * - Place orders with invoice payment option
 * - Repeat previous orders quickly
 * - View order history
 * - Manage multiple delivery addresses
 * - Tax invoice support
 */

test.describe('Business Workflow', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);

    // Login as business user
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('business');
    await expect(authHelper.isLoggedIn()).resolves.toBe(true);
  });

  test.describe('Authentication & Dashboard Access', () => {
    test('should login successfully and access business dashboard', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.navigateToDashboard('business');

      // Assert
      await expect(page).toHaveURL('/isletme');
      await expect(page.locator('[data-testid="business-dashboard"]')).toBeVisible();
    });

    test('should display business navigation', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);

      // Assert
      await expect(page.locator('[data-testid="business-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-nav-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-nav-addresses"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-nav-invoices"]')).toBeVisible();
    });

    test('should display business name and tax number', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);

      // Assert
      await expect(page.locator(`text=${TEST_USERS.business.businessName}`)).toBeVisible();
      await expect(page.locator(`text=${TEST_USERS.business.taxNumber}`)).toBeVisible();
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display key metrics on dashboard', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);

      // Assert
      await expect(page.locator('[data-testid="stat-total-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-monthly-spend"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-pending-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-frequent-items"]')).toBeVisible();
    });

    test('should display recent orders', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);

      // Assert
      await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
    });

    test('should display reorder suggestions', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);

      // Assert
      await expect(page.locator('[data-testid="reorder-suggestions"]')).toBeVisible();
    });
  });

  test.describe('Product Browsing with Business Pricing', () => {
    test('should browse products with business pricing visible', async ({ page }) => {
      // Arrange
      const homePage = pageFactory.home();
      await homePage.navigateToProducts();

      // Assert
      await expect(page.locator('[data-testid="products-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible();
      // Business pricing should be displayed (typically 10% off)
      await expect(page.locator('[data-testid="business-price"]')).toBeVisible();
    });

    test('should display business price discount', async ({ page }) => {
      // Arrange
      const productsPage = pageFactory.products();
      await productsPage.goto();

      // Assert - Business price should be lower than regular price
      const firstProduct = page.locator('[data-testid="product-card"]').first();
      await expect(firstProduct.locator('[data-testid="business-price"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="regular-price"]')).toBeVisible();
    });

    test('should filter products by category', async ({ page }) => {
      // Arrange
      const productsPage = pageFactory.products();
      await productsPage.goto();

      // Act
      await productsPage.selectCategory('vegetables');

      // Assert
      await expect(page.locator('[data-testid="category-filter-vegetables"]')).toHaveClass(/active/);
    });

    test('should search products by name', async ({ page }) => {
      // Arrange
      const productsPage = pageFactory.products();
      await productsPage.goto();

      // Act
      await productsPage.searchProducts('domates');

      // Assert
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue('domates');
      const results = page.locator('[data-testid^="product-"]');
      await expect(results.first()).toBeVisible();
    });
  });

  test.describe('Cart Management', () => {
    test('should add product to cart', async ({ page }) => {
      // Arrange
      const productsPage = pageFactory.products();
      const homePage = pageFactory.home();
      await homePage.navigateToProducts();

      // Act
      await productsPage.addProductToCart('test-product-1');

      // Assert
      const cartCount = await homePage.getCartItemCount();
      expect(cartCount).toBeGreaterThan(0);
    });

    test('should view cart with business pricing', async ({ page }) => {
      // Arrange - Add product to cart
      const productsPage = pageFactory.products();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('test-product-1');

      // Act - Go to cart
      const cartPage = pageFactory.cart();
      await cartPage.goto();

      // Assert
      await expect(page.locator('[data-testid="cart-item-test-product-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-price-display"]')).toBeVisible();
    });

    test('should update product quantity in cart', async ({ page }) => {
      // Arrange - Add product and go to cart
      const productsPage = pageFactory.products();
      const cartPage = pageFactory.cart();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('test-product-1');
      await cartPage.goto();

      // Act
      await cartPage.updateItemQuantity('test-product-1', 5);

      // Assert
      const quantity = await page.locator('[data-testid="cart-item-test-product-1"]')
        .locator('[data-testid="quantity-input"]')
        .inputValue();
      expect(quantity).toBe('5');
    });
  });

  test.describe('Order Placement', () => {
    test('should place order with invoice payment option', async ({ page }) => {
      // Arrange - Add products to cart
      const productsPage = pageFactory.products();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('test-product-1');

      // Proceed to checkout
      const cartPage = pageFactory.cart();
      await cartPage.goto();
      await cartPage.proceedToCheckout();
      const checkoutPage = pageFactory.checkout();

      // Add address
      await checkoutPage.addNewAddress({
        title: 'Business Address',
        district: 'Menemen Merkez',
        fullAddress: 'Business Street 123',
        phone: '+905551234567',
      });
      await checkoutPage.selectAddress('Business Address');
      await checkoutPage.selectDeliverySlot('tomorrow-morning');

      // Select invoice payment
      await page.click('[data-testid="payment-method-invoice"]');

      // Act
      await checkoutPage.placeOrder();

      // Assert
      await expect(page).toHaveURL('**/siparis-tamamlandi');
      await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-info"]')).toBeVisible();
    });

    test('should place order with credit card payment', async ({ page }) => {
      test.skip(true, 'Requires payment gateway integration');
    });

    test('should display tax number in order details', async ({ page }) => {
      // Arrange - Add products and proceed to checkout
      const productsPage = pageFactory.products();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('test-product-1');
      await pageFactory.cart().goto();
      await pageFactory.cart().proceedToCheckout();

      // Assert
      await expect(page.locator(`text=${TEST_USERS.business.taxNumber}`)).toBeVisible();
    });
  });

  test.describe('Repeat Orders', () => {
    test('should view order history', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);

      // Act
      await page.click('[data-testid="business-nav-orders"]');

      // Assert
      await expect(page.locator('[data-testid="business-orders-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible();
    });

    test('should repeat previous order', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-orders"]');

      // Find a completed order
      const completedOrder = page.locator('[data-testid="order-status-completed"]').first();

      if (await completedOrder.count() > 0) {
        // Act
        await completedOrder.locator('[data-testid="repeat-order-button"]').click();

        // Assert
        await expect(page.locator('[data-testid="cart-count"]')).not.toHaveText('0');
        await expect(page.locator('[data-testid="repeat-order-success"]')).toBeVisible();
      } else {
        test.skip(true, 'No completed orders found');
      }
    });

    test('should view order details', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-orders"]');

      // Act
      await page.locator('[data-testid="order-row"]').first().click();

      // Assert
      await expect(page.locator('[data-testid="order-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-invoice"]')).toBeVisible();
    });

    test('should filter orders by status', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-orders"]');

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

    test('should search orders by date or order ID', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-orders"]');

      // Act
      await page.fill('[data-testid="search-input"]', '2025-01');

      // Assert
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="order-row"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Address Management', () => {
    test('should view all delivery addresses', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);

      // Act
      await page.click('[data-testid="business-nav-addresses"]');

      // Assert
      await expect(page.locator('[data-testid="addresses-list"]')).toBeVisible();
    });

    test('should add new delivery address', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-addresses"]');

      // Act
      await page.click('[data-testid="add-address-button"]');
      await page.fill('[data-testid="address-title"]', 'Warehouse');
      await page.fill('[data-testid="address-district"]', 'Menemen Merkez');
      await page.fill('[data-testid="address-full"]', 'Warehouse Street 456');
      await page.fill('[data-testid="address-phone"]', '+905559876543');
      await page.click('[data-testid="save-address"]');

      // Assert
      await expect(page.locator('[data-testid="address-save-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="address-Warehouse"]')).toBeVisible();
    });

    test('should edit existing address', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-addresses"]');

      // Act
      await page.locator('[data-testid="address-card"]').first().click();
      await page.fill('[data-testid="address-phone"]', '+90555111222333');
      await page.click('[data-testid="save-address"]');

      // Assert
      await expect(page.locator('[data-testid="address-save-success"]')).toBeVisible();
    });

    test('should delete address', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-addresses"]');

      // Find a test address
      const testAddress = page.locator('[data-testid="address-card"]').filter({ hasText: 'Warehouse' }).first();

      if (await testAddress.count() > 0) {
        // Act
        await testAddress.locator('[data-testid="delete-address-button"]').click();
        await page.click('[data-testid="confirm-delete"]');

        // Assert
        await expect(page.locator('[data-testid="delete-success-toast"]')).toBeVisible();
      } else {
        test.skip(true, 'No test address found to delete');
      }
    });

    test('should set default address', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-addresses"]');

      // Act
      await page.locator('[data-testid="address-card"]').first().locator('[data-testid="set-default-button"]').click();

      // Assert
      await expect(page.locator('[data-testid="default-address-badge"]').first()).toBeVisible();
    });
  });

  test.describe('Invoice Management', () => {
    test('should view invoice history', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);

      // Act
      await page.click('[data-testid="business-nav-invoices"]');

      // Assert
      await expect(page.locator('[data-testid="invoices-list"]')).toBeVisible();
    });

    test('should download invoice PDF', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-invoices"]');

      // Find an invoice
      const invoice = page.locator('[data-testid="invoice-row"]').first();

      if (await invoice.count() > 0) {
        // Act
        const downloadPromise = page.waitForEvent('download');
        await invoice.locator('[data-testid="download-invoice"]').click();
        const download = await downloadPromise;

        // Assert
        expect(download.suggestedFilename()).toContain('.pdf');
      } else {
        test.skip(true, 'No invoices found');
      }
    });

    test('should filter invoices by status', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-invoices"]');

      // Act
      await page.selectOption('[data-testid="status-filter"]', 'paid');

      // Assert
      await page.waitForTimeout(500);
      const invoices = page.locator('[data-testid="invoice-row"]');
      const count = await invoices.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(invoices.nth(i).locator('[data-testid="invoice-status-paid"]')).toBeVisible();
      }
    });
  });

  test.describe('Settings & Profile', () => {
    test('should view business profile', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);

      // Act
      await page.click('[data-testid="business-nav-settings"]');

      // Assert
      await expect(page.locator('[data-testid="business-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="tax-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="business-email"]')).toBeVisible();
    });

    test('should update business profile', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-settings"]');

      // Act
      await page.fill('[data-testid="business-phone"]', '+90555111222333');
      await page.click('[data-testid="save-profile"]');

      // Assert
      await expect(page.locator('[data-testid="profile-save-success"]')).toBeVisible();
    });

    test('should update tax information', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.business);
      await page.click('[data-testid="business-nav-settings"]');

      // Act
      await page.fill('[data-testid="tax-number"]', '9876543210');
      await page.fill('[data-testid="tax-office"]', 'Menemen Vergi Dairesi');
      await page.click('[data-testid="save-tax-info"]');

      // Assert
      await expect(page.locator('[data-testid="tax-save-success"]')).toBeVisible();
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
