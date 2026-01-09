import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS, ROLE_DASHBOARDS, TEST_PRODUCTS, TEST_REGIONS } from '../personas/test-data';

/**
 * Customer Workflow E2E Tests
 * Tests the complete customer journey from browsing to checkout
 *
 * Customer Role Capabilities:
 * - Browse products and categories
 * - Add products to cart
 * - Manage cart (update quantities, remove items)
 * - Checkout with address and delivery slot selection
 * - View order history
 * - Add to wishlist
 * - Compare products
 */

test.describe('Customer Workflow', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);

    // Login as customer
    const authHelper = pageFactory.authHelper();
    await pageFactory.home().goto();
    await authHelper.loginAs('customer');
    await expect(authHelper.isLoggedIn()).resolves.toBe(true);

    // Select region (if modal appears)
    const homePage = pageFactory.home();
    await homePage.selectRegion(TEST_REGIONS[0]);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Clear cart after each test
    const cartPage = pageFactory.cart();
    await cartPage.goto();
    const isEmpty = await cartPage.isEmpty();
    if (!isEmpty) {
      // Remove all items (implementation depends on UI)
      await page.goto('/');
    }
  });

  test.describe('Authentication', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      // Assert
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="user-menu-trigger"]')).toBeVisible();
    });

    test('should display customer name after login', async ({ page }) => {
      // Arrange
      const authHelper = pageFactory.authHelper();

      // Act
      const userName = await authHelper.getCurrentUserName();

      // Assert
      expect(userName).toContain(TEST_USERS.customer.name);
    });

    test('should redirect to login when accessing protected routes without auth', async ({ page, context }) => {
      // Arrange - Logout
      const authHelper = pageFactory.authHelper();
      await authHelper.logout();

      // Act - Try to access account page
      await page.goto('/hesabim');

      // Assert - Should redirect to login or show auth drawer
      await expect(page.locator('[data-testid="auth-drawer"]')).toBeVisible();
    });
  });

  test.describe('Product Browsing', () => {
    test('should browse products on home page', async ({ page }) => {
      // Act
      await pageFactory.home().navigateToProducts();

      // Assert
      await expect(page).toHaveURL('**/urunler');
      await expect(page.locator('[data-testid^="product-"]').first()).toBeVisible();
    });

    test('should display product details', async ({ page }) => {
      // Arrange
      const productDetailPage = pageFactory.productDetail();
      await productDetailPage.goto(TEST_PRODUCTS.simple.slug);

      // Assert
      await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-to-cart"]')).toBeVisible();
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
      // Verify search results are displayed
      const results = page.locator('[data-testid^="product-"]');
      await expect(results.first()).toBeVisible();
    });
  });

  test.describe('Cart Management', () => {
    test('should add product to cart from products page', async ({ page }) => {
      // Arrange
      const productsPage = pageFactory.products();
      const homePage = pageFactory.home();
      await homePage.navigateToProducts();

      // Act
      await productsPage.addProductToCart(TEST_PRODUCTS.simple.id);

      // Assert
      const cartCount = await homePage.getCartItemCount();
      expect(cartCount).toBeGreaterThan(0);
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText(String(cartCount));
    });

    test('should add product to cart from detail page', async ({ page }) => {
      // Arrange
      const productDetailPage = pageFactory.productDetail();
      const homePage = pageFactory.home();
      await productDetailPage.goto(TEST_PRODUCTS.simple.slug);

      // Act
      await productDetailPage.addToCart();

      // Assert
      const cartCount = await homePage.getCartItemCount();
      expect(cartCount).toBeGreaterThan(0);
    });

    test('should display cart contents', async ({ page }) => {
      // Arrange - Add product to cart
      const productsPage = pageFactory.products();
      const homePage = pageFactory.home();
      await homePage.navigateToProducts();
      await productsPage.addProductToCart(TEST_PRODUCTS.simple.id);

      // Act - Go to cart
      const cartPage = pageFactory.cart();
      await cartPage.goto();

      // Assert
      await expect(page.locator(`[data-testid="cart-item-${TEST_PRODUCTS.simple.id}"]`)).toBeVisible();
      await expect(cartPage.isEmpty()).resolves.toBe(false);
    });

    test('should update product quantity in cart', async ({ page }) => {
      // Arrange - Add product and go to cart
      const productsPage = pageFactory.products();
      const cartPage = pageFactory.cart();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart(TEST_PRODUCTS.simple.id);
      await cartPage.goto();

      // Act - Update quantity
      await cartPage.updateItemQuantity(TEST_PRODUCTS.simple.id, 3);

      // Assert
      const quantity = await page.locator(`[data-testid="cart-item-${TEST_PRODUCTS.simple.id}"]`)
        .locator('[data-testid="quantity-input"]')
        .inputValue();
      expect(quantity).toBe('3');
    });

    test('should remove product from cart', async ({ page }) => {
      // Arrange - Add product and go to cart
      const productsPage = pageFactory.products();
      const cartPage = pageFactory.cart();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart(TEST_PRODUCTS.simple.id);
      await cartPage.goto();

      // Act - Remove item
      await cartPage.removeItem(TEST_PRODUCTS.simple.id);

      // Assert
      await expect(page.locator(`[data-testid="cart-item-${TEST_PRODUCTS.simple.id}"]`)).not.toBeVisible();
    });

    test('should display correct cart total', async ({ page }) => {
      // Arrange - Add multiple products
      const productsPage = pageFactory.products();
      const cartPage = pageFactory.cart();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart(TEST_PRODUCTS.simple.id);
      await productsPage.addProductToCart(TEST_PRODUCTS.simple.id);
      await cartPage.goto();

      // Act & Assert
      const total = await cartPage.getCartTotal();
      expect(total).toBeTruthy();
      expect(total).toContain('TL');
    });
  });

  test.describe('Checkout Process', () => {
    test.beforeEach(async ({ page }) => {
      // Setup: Add products to cart
      const productsPage = pageFactory.products();
      await pageFactory.home().navigateToProducts();
      await productsPage.addProductToCart(TEST_PRODUCTS.simple.id);
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

    test('should select existing address', async ({ page }) => {
      // Arrange
      await pageFactory.cart().goto();
      await pageFactory.cart().proceedToCheckout();
      const checkoutPage = pageFactory.checkout();

      // Act - Add and select address
      await checkoutPage.addNewAddress({
        title: 'Test Address',
        district: 'Menemen Merkez',
        fullAddress: 'Test Street 123',
        phone: '+905551234567',
      });
      await checkoutPage.selectAddress('Test Address');

      // Assert
      await expect(page.locator('[data-testid="address-Test Address"].selected')).toBeVisible();
    });

    test('should validate minimum order amount', async ({ page }) => {
      // This test requires a product with price below minimum
      test.skip(true, 'Requires low-value product setup');
    });

    test('should require address selection before placing order', async ({ page }) => {
      // Arrange
      await pageFactory.cart().goto();
      await pageFactory.cart().proceedToCheckout();
      const checkoutPage = pageFactory.checkout();

      // Act - Try to place order without selecting address
      await checkoutPage.placeOrder();

      // Assert - Should show validation error
      await expect(page.locator('[data-testid="address-error"]')).toBeVisible();
    });

    test('should require delivery slot selection', async ({ page }) => {
      // Arrange
      await pageFactory.cart().goto();
      await pageFactory.cart().proceedToCheckout();
      const checkoutPage = pageFactory.checkout();
      await checkoutPage.addNewAddress({
        title: 'Test Address',
        district: 'Menemen Merkez',
        fullAddress: 'Test Street 123',
        phone: '+905551234567',
      });
      await checkoutPage.selectAddress('Test Address');

      // Act - Try to place order without selecting delivery slot
      await checkoutPage.placeOrder();

      // Assert - Should show validation error
      await expect(page.locator('[data-testid="slot-error"]')).toBeVisible();
    });

    test('should complete order successfully', async ({ page }) => {
      // Arrange
      await pageFactory.cart().goto();
      await pageFactory.cart().proceedToCheckout();
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

  test.describe('Order Management', () => {
    test('should view order history', async ({ page }) => {
      // Arrange - This requires an existing order
      test.skip(true, 'Requires existing order setup');
    });

    test('should view order details', async ({ page }) => {
      test.skip(true, 'Requires existing order setup');
    });

    test('should track order status', async ({ page }) => {
      test.skip(true, 'Requires existing order setup');
    });
  });

  test.describe('Wishlist & Compare', () => {
    test('should add product to wishlist', async ({ page }) => {
      // Arrange
      const productDetailPage = pageFactory.productDetail();
      await productDetailPage.goto(TEST_PRODUCTS.simple.slug);

      // Act
      await productDetailPage.addToWishlist();

      // Assert
      await expect(page.locator('[data-testid="wishlist-success"]')).toBeVisible();
    });

    test('should add product to compare', async ({ page }) => {
      // Arrange
      const productDetailPage = pageFactory.productDetail();
      await productDetailPage.goto(TEST_PRODUCTS.simple.slug);

      // Act
      await productDetailPage.addToCompare();

      // Assert
      await expect(page.locator('[data-testid="compare-count"]')).toBeVisible();
    });

    test('should view wishlist', async ({ page }) => {
      // Act
      await page.goto('/favorilerim');

      // Assert
      await expect(page.locator('[data-testid="wishlist-page"]')).toBeVisible();
    });

    test('should view compare page', async ({ page }) => {
      // Act
      await page.goto('/karsilastir');

      // Assert
      await expect(page.locator('[data-testid="compare-page"]')).toBeVisible();
    });
  });

  test.describe('Account Management', () => {
    test('should view account dashboard', async ({ page }) => {
      // Act
      await page.goto(ROLE_DASHBOARDS.customer);

      // Assert
      await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
    });

    test('should view profile information', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.customer);

      // Act
      await page.click('[data-testid="nav-profile"]');

      // Assert
      await expect(page.locator('[data-testid="profile-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="profile-email"]')).toBeVisible();
    });

    test('should update profile information', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.customer);
      await page.click('[data-testid="nav-profile"]');

      // Act
      await page.fill('[data-testid="profile-phone"]', '+90555111222333');
      await page.click('[data-testid="save-profile"]');

      // Assert
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });

    test('should manage addresses', async ({ page }) => {
      // Arrange
      await page.goto(ROLE_DASHBOARDS.customer);

      // Act
      await page.click('[data-testid="nav-addresses"]');

      // Assert
      await expect(page.locator('[data-testid="addresses-list"]')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Arrange - Login is done in beforeEach
      const authHelper = pageFactory.authHelper();

      // Act
      await authHelper.logout();

      // Assert
      await expect(page).toHaveURL('/');
      await expect(authHelper.isLoggedIn()).resolves.toBe(false);
      await expect(page.locator('[data-testid="auth-drawer-trigger"]')).toBeVisible();
    });
  });

  test.describe('Access Control', () => {
    test('should not access admin panel', async ({ page }) => {
      // Act
      await page.goto('/admin');

      // Assert - Should redirect to home or show access denied
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
});
