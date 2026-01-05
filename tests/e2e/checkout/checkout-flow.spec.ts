import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';

/**
 * Checkout Flow E2E Tests
 * Tests the complete customer journey from product selection to order placement
 */

test.describe('Checkout Flow', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);

    // Login as customer
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('customer');

    // Select region (if modal appears)
    const homePage = pageFactory.home();
    await homePage.selectRegion('Menemen');
  });

  test.describe('Add to Cart', () => {
    test('should add product to cart from products page', async ({ page }) => {
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

    test('should add product to cart from product detail page', async ({ page }) => {
      // Arrange
      const productDetailPage = pageFactory.productDetail();
      const homePage = pageFactory.home();
      await productDetailPage.goto('test-product');

      // Act
      await productDetailPage.addToCart();

      // Assert
      const cartCount = await homePage.getCartItemCount();
      expect(cartCount).toBeGreaterThan(0);
    });
  });

  test.describe('Cart Management', () => {
    test('should display added products in cart', async ({ page }) => {
      // Arrange - Add product to cart
      const productsPage = pageFactory.products();
      const homePage = pageFactory.home();
      await homePage.navigateToProducts();
      await productsPage.addProductToCart('test-product-1');

      // Act - Go to cart
      const cartPage = pageFactory.cart();
      await cartPage.goto();

      // Assert
      await expect(page.locator('[data-testid="cart-item-test-product-1"]')).toBeVisible();
      await expect(cartPage.isEmpty()).resolves.toBe(false);
    });

    test('should update product quantity in cart', async ({ page }) => {
      // Arrange - Add product and go to cart
      const productsPage = pageFactory.products();
      const cartPage = pageFactory.cart();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('test-product-1');
      await cartPage.goto();

      // Act
      await cartPage.updateItemQuantity('test-product-1', 3);

      // Assert
      const quantity = await page.locator('[data-testid="cart-item-test-product-1"]')
        .locator('[data-testid="quantity-input"]')
        .inputValue();
      expect(quantity).toBe('3');
    });

    test('should remove product from cart', async ({ page }) => {
      // Arrange - Add product and go to cart
      const productsPage = pageFactory.products();
      const cartPage = pageFactory.cart();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('test-product-1');
      await cartPage.goto();

      // Act
      await cartPage.removeItem('test-product-1');

      // Assert
      await expect(page.locator('[data-testid="cart-item-test-product-1"]')).not.toBeVisible();
    });
  });

  test.describe('Checkout Process', () => {
    test.beforeEach(async ({ page }) => {
      // Setup: Add products to cart
      const productsPage = pageFactory.products();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('test-product-1');
      await productsPage.addProductToCart('test-product-2');
    });

    test('should proceed to checkout from cart', async ({ page }) => {
      // Arrange
      const cartPage = pageFactory.cart();
      await cartPage.goto();

      // Act
      await cartPage.proceedToCheckout();

      // Assert
      await expect(page).toHaveURL('**/teslimat');
    });

    test('should display order summary at checkout', async ({ page }) => {
      // Arrange
      await pageFactory.cart().goto();
      await pageFactory.cart().proceedToCheckout();
      const checkoutPage = pageFactory.checkout();

      // Act & Assert
      const total = await checkoutPage.getOrderTotal();
      expect(total).toBeTruthy();
      await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    });

    test('should allow adding new address at checkout', async ({ page }) => {
      // Arrange
      await pageFactory.cart().goto();
      await pageFactory.cart().proceedToCheckout();
      const checkoutPage = pageFactory.checkout();

      // Act
      await checkoutPage.addNewAddress({
        title: 'Home',
        district: 'Menemen Merkez',
        fullAddress: 'Test Street 123',
        phone: '+905551234567',
      });

      // Assert
      await expect(page.locator('[data-testid="address-Home"]')).toBeVisible();
    });
  });

  test.describe('Order Placement', () => {
    test.beforeEach(async ({ page }) => {
      // Setup: Add products and proceed to checkout
      const productsPage = pageFactory.products();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('test-product-1');
      await pageFactory.cart().goto();
      await pageFactory.cart().proceedToCheckout();
    });

    test('should require address selection', async ({ page }) => {
      // Act - Try to place order without selecting address
      const checkoutPage = pageFactory.checkout();
      await checkoutPage.placeOrder();

      // Assert - Should show validation error
      await expect(page.locator('[data-testid="address-error"]')).toBeVisible();
    });

    test('should require delivery slot selection', async ({ page }) => {
      // Arrange - Select address first
      const checkoutPage = pageFactory.checkout();
      await checkoutPage.selectAddress('address-1');

      // Act - Try to place order without selecting slot
      await checkoutPage.placeOrder();

      // Assert - Should show validation error
      await expect(page.locator('[data-testid="slot-error"]')).toBeVisible();
    });

    test('should complete order successfully', async ({ page }) => {
      // Arrange
      const checkoutPage = pageFactory.checkout();
      await checkoutPage.addNewAddress({
        title: 'Test Address',
        district: 'Menemen Merkez',
        fullAddress: 'Test Street 123',
        phone: '+905551234567',
      });
      await checkoutPage.selectAddress('Test Address');
      await checkoutPage.selectDeliverySlot('tomorrow-morning');

      // Act
      await checkoutPage.placeOrder();

      // Assert
      await expect(page).toHaveURL('**/siparis-tamamlandi');
      await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-id"]')).toBeVisible();
    });
  });

  test.describe('Post-Order', () => {
    test('should clear cart after successful order', async ({ page }) => {
      // This test would need to place an order first
      // For now, we skip it
      test.skip(true, 'Requires order completion setup');
    });

    test('should show order in account history', async ({ page }) => {
      // This test would need to place an order first
      // For now, we skip it
      test.skip(true, 'Requires order completion setup');
    });
  });

  test.describe('Order Validation', () => {
    test('should validate minimum order amount', async ({ page }) => {
      // Arrange - Add low value item
      const productsPage = pageFactory.products();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart('cheap-product');
      await pageFactory.cart().goto();
      await pageFactory.cart().proceedToCheckout();

      // Assert
      await expect(page.locator('[data-testid="minimum-order-error"]')).toBeVisible();
    });

    test('should validate out of stock items', async ({ page }) => {
      // This would require a product that goes out of stock
      test.skip(true, 'Requires out of stock product setup');
    });

    test('should validate region availability', async ({ page }) => {
      // This would require a product not available in selected region
      test.skip(true, 'Requires region-specific product setup');
    });
  });
});
