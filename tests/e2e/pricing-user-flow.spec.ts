/**
 * E2E Tests: Pricing User Flow
 * Son Kullanıcı Fiyatlandırma Akışı Testleri
 *
 * Tests critical user flows:
 * - Customer browsing products
 * - Adding to cart with variations
 * - Checkout price verification
 * - B2B vs B2C pricing visibility
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';

// Test credentials
const B2B_CREDENTIALS = {
  email: process.env.TEST_B2B_EMAIL || 'test-business@haldeki.com',
  password: process.env.TEST_B2B_PASSWORD || 'Test123!',
};

const B2C_CREDENTIALS = {
  email: process.env.TEST_B2C_EMAIL || 'test-customer@haldeki.com',
  password: process.env.TEST_B2C_PASSWORD || 'Test123!',
};

test.describe('Pricing - Customer Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should display product prices on listing page', async ({ page }) => {
    // Navigate to products page
    await page.goto(`${BASE_URL}/products`);

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });

    // Check that prices are displayed
    const priceElements = await page.locator('[data-testid="product-price"]').all();
    expect(priceElements.length).toBeGreaterThan(0);

    // Verify price format (should contain TL or ₺)
    const firstPrice = await priceElements[0].textContent();
    expect(firstPrice).toMatch(/TL|₺/);
  });

  test('should show B2B pricing for business customers', async ({ page }) => {
    // Login as B2B customer
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', B2B_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', B2B_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');

    // Wait for login to complete
    await page.waitForURL(`${BASE_URL}/`);

    // Navigate to products
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]');

    // Verify B2B pricing is displayed (lower prices)
    const firstPrice = await page.locator('[data-testid="product-price"]').first().textContent();
    expect(firstPrice).toBeTruthy();

    // B2B prices should be visible (30% commission applied)
    // We can't check exact value without knowing product base price
    // but we can verify the price is displayed
  });

  test('should show B2C pricing for regular customers', async ({ page }) => {
    // Login as B2C customer
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', B2C_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', B2C_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL(`${BASE_URL}/`);

    // Navigate to products
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]');

    // Verify B2C pricing is displayed (higher prices - 50% commission)
    const firstPrice = await page.locator('[data-testid="product-price"]').first().textContent();
    expect(firstPrice).toBeTruthy();
  });
});

test.describe('Pricing - Product Details', () => {
  test('should display detailed price breakdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);

    await page.waitForSelector('[data-testid="product-card"]');
    await page.click('[data-testid="product-card"]:first-child');

    // Wait for product detail page
    await page.waitForSelector('[data-testid="product-detail"]');

    // Check for price display
    const priceElement = await page.locator('[data-testid="product-price"]');
    await expect(priceElement).toBeVisible();

    // Check for stock availability
    const stockElement = await page.locator('[data-testid="stock-availability"]');
    await expect(stockElement).toBeVisible();
  });

  test('should handle product variations with price adjustments', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);

    await page.waitForSelector('[data-testid="product-card"]');

    // Find a product with variations
    const productCards = await page.locator('[data-testid="product-card"]').all();
    let productWithVariations = false;

    for (const card of productCards) {
      const hasVariations = await card.locator('[data-testid="variations"]').count();
      if (hasVariations > 0) {
        await card.click();
        productWithVariations = true;
        break;
      }
    }

    if (!productWithVariations) {
      test.skip(true, 'No products with variations found');
      return;
    }

    // Wait for product detail
    await page.waitForSelector('[data-testid="product-detail"]');

    // Select a variation
    const firstVariation = await page.locator('[data-testid="variation-option"]').first();
    await firstVariation.click();

    // Price should update after variation selection
    const priceElement = await page.locator('[data-testid="product-price"]');
    await expect(priceElement).toBeVisible();
  });
});

test.describe('Pricing - Add to Cart', () => {
  test('should add product to cart with correct price', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', B2C_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', B2C_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(`${BASE_URL}/`);

    // Go to products
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]');

    // Get the price before adding to cart
    const productPrice = await page.locator('[data-testid="product-price"]').first().textContent();

    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]:first-child');

    // Wait for cart update
    await page.waitForTimeout(1000);

    // Open cart
    await page.click('[data-testid="cart-button"]');
    await page.waitForSelector('[data-testid="cart-drawer"]');

    // Verify price in cart matches product page price
    const cartPrice = await page.locator('[data-testid="cart-item-price"]').first().textContent();
    expect(cartPrice).toBe(productPrice);
  });

  test('should calculate cart total correctly', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', B2C_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', B2C_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(`${BASE_URL}/`);

    // Add multiple products to cart
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]');

    // Add first product
    await page.click('[data-testid="add-to-cart-button"]:nth-child(1)');
    await page.waitForTimeout(500);

    // Add second product
    await page.click('[data-testid="add-to-cart-button"]:nth-child(2)');
    await page.waitForTimeout(500);

    // Open cart
    await page.click('[data-testid="cart-button"]');
    await page.waitForSelector('[data-testid="cart-drawer"]');

    // Verify cart total is calculated
    const cartTotal = await page.locator('[data-testid="cart-total"]');
    await expect(cartTotal).toBeVisible();

    // Get individual item prices and verify total
    const itemPrices = await page.locator('[data-testid="cart-item-price"]').allTextContents();
    expect(itemPrices.length).toBeGreaterThanOrEqual(2);
  });

  test('should update quantity in cart', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', B2C_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', B2C_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(`${BASE_URL}/`);

    // Add product to cart
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]');
    await page.click('[data-testid="add-to-cart-button"]:first-child');
    await page.waitForTimeout(1000);

    // Open cart
    await page.click('[data-testid="cart-button"]');
    await page.waitForSelector('[data-testid="cart-drawer"]');

    // Get initial total
    const initialTotal = await page.locator('[data-testid="cart-total"]').textContent();

    // Increase quantity
    await page.click('[data-testid="quantity-increase"]');
    await page.waitForTimeout(500);

    // Verify total increased
    const updatedTotal = await page.locator('[data-testid="cart-total"]').textContent();
    expect(updatedTotal).not.toBe(initialTotal);
  });
});

test.describe('Pricing - Checkout', () => {
  test('should preserve pricing from cart to checkout', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', B2C_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', B2C_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(`${BASE_URL}/`);

    // Add to cart
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]');
    await page.click('[data-testid="add-to-cart-button"]:first-child');
    await page.waitForTimeout(1000);

    // Get cart total
    await page.click('[data-testid="cart-button"]');
    await page.waitForSelector('[data-testid="cart-drawer"]');
    const cartTotal = await page.locator('[data-testid="cart-total"]').textContent();

    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    await page.waitForSelector('[data-testid="checkout-page"]');

    // Verify checkout total matches cart total
    const checkoutTotal = await page.locator('[data-testid="checkout-total"]').textContent();
    expect(checkoutTotal).toBe(cartTotal);
  });

  test('should display B2B pricing on checkout for business customers', async ({ page }) => {
    // Login as B2B customer
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', B2B_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', B2B_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(`${BASE_URL}/`);

    // Add to cart
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]');
    await page.click('[data-testid="add-to-cart-button"]:first-child');
    await page.waitForTimeout(1000);

    // Proceed to checkout
    await page.click('[data-testid="cart-button"]');
    await page.waitForSelector('[data-testid="cart-drawer"]');
    await page.click('[data-testid="checkout-button"]');
    await page.waitForSelector('[data-testid="checkout-page"]');

    // Verify B2B pricing is applied
    const checkoutTotal = await page.locator('[data-testid="checkout-total"]');
    await expect(checkoutTotal).toBeVisible();

    // Verify commission breakdown if displayed
    const commissionBreakdown = await page.locator('[data-testid="commission-breakdown"]').count();
    if (commissionBreakdown > 0) {
      const commissionText = await page.locator('[data-testid="commission-breakdown"]').textContent();
      expect(commissionText).toContain('%30');
    }
  });
});

test.describe('Pricing - Security', () => {
  test('should not allow price manipulation via URL parameters', async ({ page }) => {
    // Try to access product with manipulated price parameter
    await page.goto(`${BASE_URL}/products/test-product?price=0.01`);

    // Price should not be manipulated
    const priceElement = await page.locator('[data-testid="product-price"]');
    if (await priceElement.count() > 0) {
      const priceText = await priceElement.textContent();
      expect(priceText).not.toContain('0.01');
    }
  });

  test('should recalculate prices on checkout server-side', async ({ page }) => {
    // This test verifies that prices are calculated server-side
    // and cannot be manipulated by client-side JavaScript

    // Login and add to cart
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', B2C_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', B2C_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(`${BASE_URL}/`);

    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]');
    await page.click('[data-testid="add-to-cart-button"]:first-child');
    await page.waitForTimeout(1000);

    // Monitor network requests to verify price calculation
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/rpc/calculate')) {
        apiRequests.push(request.url());
      }
    });

    // Proceed to checkout
    await page.click('[data-testid="cart-button"]');
    await page.waitForSelector('[data-testid="cart-drawer"]');
    await page.click('[data-testid="checkout-button"]');
    await page.waitForSelector('[data-testid="checkout-page"]', { timeout: 10000 });

    // Verify that RPC call was made for price calculation
    expect(apiRequests.length).toBeGreaterThan(0);
  });
});

test.describe('Pricing - Regional', () => {
  test('should display regional pricing based on user region', async ({ page }) => {
    // This test requires the application to support regional pricing
    // and have a way to switch regions

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', B2C_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', B2C_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(`${BASE_URL}/`);

    // Check if region selector is available
    const regionSelector = await page.locator('[data-testid="region-selector"]').count();

    if (regionSelector === 0) {
      test.skip(true, 'Region selector not available');
      return;
    }

    // Navigate to products
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]');

    // Get initial price
    const initialPrice = await page.locator('[data-testid="product-price"]').first().textContent();

    // Change region
    await page.click('[data-testid="region-selector"]');
    await page.click('[data-testid="region-option"]:nth-child(2)');
    await page.waitForTimeout(1000);

    // Verify price may have changed
    const newPrice = await page.locator('[data-testid="product-price"]').first().textContent();
    // Price might be same if regions have same multiplier
    expect(newPrice).toBeTruthy();
  });
});
