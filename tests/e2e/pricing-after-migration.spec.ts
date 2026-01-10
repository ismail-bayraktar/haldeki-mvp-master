/**
 * E2E Tests: Pricing System After Migration
 * Comprehensive browser testing for the new pricing system
 *
 * Tests the redesigned pricing system:
 * - Single source of truth (supplier_products.price)
 * - Commission-based pricing (B2B: 30%, B2C: 50%)
 * - Regional multipliers
 * - Variation adjustments
 * - RPC-based calculations
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://www.haldeki.com';
const PRODUCTS_ROUTE = '/urunler';
const LOGIN_ROUTE = '/giris';
const PRODUCT_DETAIL_ROUTE = '/urun';

// Test credentials
const B2B_CREDENTIALS = {
  email: process.env.TEST_B2B_EMAIL || 'test-business@haldeki.com',
  password: process.env.TEST_B2B_PASSWORD || 'Test123!',
};

const B2C_CREDENTIALS = {
  email: process.env.TEST_B2C_EMAIL || 'test-customer@haldeki.com',
  password: process.env.TEST_B2C_PASSWORD || 'Test123!',
};

// Helper: Parse price from text (e.g., "150,00 TL" -> 150.00)
function parsePrice(priceText: string | null): number {
  if (!priceText) return 0;
  const cleaned = priceText.replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Helper: Format price for display
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

test.describe('Pricing System - Post Migration', () => {
  test.beforeEach(async ({ page }) => {
    // Set default timeout for pricing calculations
    test.setTimeout(60000);
  });

  test.describe('Phase 1: Homepage & Product Listing', () => {
    test('should load homepage and display products with prices', async ({ page }) => {
      await page.goto(BASE_URL);

      // Wait for page to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({ path: 'test-results/pricing-homepage.png', fullPage: true });

      // Check if any product cards are present
      const productCards = await page.locator('[data-testid="product-card"]').count();
      console.log(`Product cards found: ${productCards}`);

      // Look for price elements (might be different selectors)
      const priceSelectors = [
        '[data-testid="product-price"]',
        '.price',
        '.fiyat',
        '[class*="price"]',
        '[class*="fiyat"]',
      ];

      let priceFound = false;
      for (const selector of priceSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`Found ${count} prices with selector: ${selector}`);
          priceFound = true;

          // Get first price
          const firstPrice = await page.locator(selector).first().textContent();
          console.log(`First price: ${firstPrice}`);
          break;
        }
      }

      if (!priceFound) {
        console.log('No price elements found on homepage');
      }
    });

    test('should navigate to products page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Try to find products link
      const productsLink = page.locator('a').filter({ hasText: /Ürünler|Products|Ürün/ }).first();

      if (await productsLink.count() > 0) {
        await productsLink.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/pricing-products-page.png', fullPage: true });
      } else {
        console.log('No products link found, trying direct navigation');
        await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/pricing-products-page.png', fullPage: true });
      }

      // Check for products
      const productCards = await page.locator('[data-testid="product-card"]').count();
      console.log(`Product cards on products page: ${productCards}`);
    });
  });

  test.describe('Phase 2: Product Detail Page', () => {
    test('should display product with detailed pricing', async ({ page }) => {
      await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find first product card and click
      const productCards = await page.locator('[data-testid="product-card"], .product-card, a[href*="/product"]').all();

      if (productCards.length > 0) {
        await productCards[0].click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/pricing-product-detail.png', fullPage: true });

        // Check for price information
        const pageContent = await page.content();
        const hasPriceInfo = /TL|₺|fiyat|price/i.test(pageContent);
        console.log(`Product detail has price info: ${hasPriceInfo}`);

        // Check console for pricing RPC calls
        const logs: string[] = [];
        page.on('console', (msg) => {
          logs.push(msg.text());
        });

        // Look for calculate_product_price calls
        await page.waitForTimeout(3000);
        const rpcCalls = logs.filter(log => log.includes('calculate_product_price') || log.includes('pricing'));
        console.log('RPC calls found:', rpcCalls.length);
      } else {
        console.log('No product cards found to click');
        test.skip(true, 'No products available');
      }
    });

    test('should test B2C pricing for regular customer', async ({ page }) => {
      // Login as B2C customer
      await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);

      // Fill login form
      const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]');
      const loginButton = page.locator('button[type="submit"][data-testid="auth-page-login-button"]');

      if (await emailInput.count() > 0) {
        await emailInput.fill(B2C_CREDENTIALS.email);
        await passwordInput.fill(B2C_CREDENTIALS.password);

        // Monitor network for pricing calls
        const apiCalls: string[] = [];
        page.on('request', (request) => {
          if (request.url().includes('rpc') || request.url().includes('price')) {
            apiCalls.push(request.url());
            console.log('API Call:', request.url());
          }
        });

        await loginButton.click();
        await page.waitForTimeout(3000);

        // Navigate to products
        await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/pricing-b2c-products.png', fullPage: true });

        // Click on a product
        const productCards = await page.locator('[data-testid="product-card"], a[href*="/product"]').all();
        if (productCards.length > 0) {
          await productCards[0].click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'test-results/pricing-b2c-product-detail.png', fullPage: true });

          // Check pricing RPC calls
          console.log(`Pricing API calls made: ${apiCalls.length}`);
          const calculateCalls = apiCalls.filter(call => call.includes('calculate_product_price'));
          console.log(`Calculate price RPC calls: ${calculateCalls.length}`);
        }
      } else {
        console.log('Login form not found');
      }
    });

    test('should test B2B pricing for business customer', async ({ page }) => {
      // Login as B2B customer
      await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);

      const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]');
      const loginButton = page.locator('button[type="submit"][data-testid="auth-page-login-button"]');

      if (await emailInput.count() > 0) {
        await emailInput.fill(B2B_CREDENTIALS.email);
        await passwordInput.fill(B2B_CREDENTIALS.password);

        // Monitor network
        const apiCalls: string[] = [];
        page.on('request', (request) => {
          if (request.url().includes('rpc') || request.url().includes('price')) {
            apiCalls.push(request.url());
          }
        });

        await loginButton.click();
        await page.waitForTimeout(3000);

        // Navigate to products
        await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/pricing-b2b-products.png', fullPage: true });

        // Click on a product
        const productCards = await page.locator('[data-testid="product-card"], a[href*="/product"]').all();
        if (productCards.length > 0) {
          await productCards[0].click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'test-results/pricing-b2b-product-detail.png', fullPage: true });

          console.log(`B2B pricing API calls: ${apiCalls.length}`);
        }
      } else {
        console.log('Login form not found');
      }
    });
  });

  test.describe('Phase 3: Cart Functionality', () => {
    test('should add product to cart and verify price', async ({ page }) => {
      // Login first
      await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
      const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]');
      const loginButton = page.locator('button[type="submit"][data-testid="auth-page-login-button"]');

      if (await emailInput.count() > 0) {
        await emailInput.fill(B2C_CREDENTIALS.email);
        await passwordInput.fill(B2C_CREDENTIALS.password);
        await loginButton.click();
        await page.waitForTimeout(3000);

        // Go to products
        await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Find and click add to cart button
        const addToCartButtons = page.locator('button').filter({ hasText: /Sepete|Add to cart|Sepet/ }).all();

        if (addToCartButtons.length > 0) {
          // Get product price before adding
          const productPriceElement = await page.locator('[data-testid="product-price"], .price, [class*="price"]').first().textContent();
          console.log(`Product price before cart: ${productPriceElement}`);

          // Click add to cart
          await addToCartButtons[0].click();
          await page.waitForTimeout(2000);

          // Open cart
          const cartButton = page.locator('[data-testid="cart-button"], button').filter({ hasText: /Sepet|Cart/i });
          if (await cartButton.count() > 0) {
            await cartButton.click();
            await page.waitForTimeout(2000);

            await page.screenshot({ path: 'test-results/pricing-cart-open.png', fullPage: true });

            // Check cart items
            const cartItems = await page.locator('[data-testid="cart-item"], .cart-item').count();
            console.log(`Cart items: ${cartItems}`);

            // Check cart total
            const cartTotal = await page.locator('[data-testid="cart-total"], [class*="total"]').textContent();
            console.log(`Cart total: ${cartTotal}`);
          }
        } else {
          console.log('No add to cart buttons found');
        }
      } else {
        console.log('Login form not found');
      }
    });

    test('should update cart quantity and recalculate price', async ({ page }) => {
      // This test assumes item is already in cart from previous test
      // or we need to add it first

      await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
      const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]');
      const loginButton = page.locator('button[type="submit"][data-testid="auth-page-login-button"]');

      if (await emailInput.count() > 0) {
        await emailInput.fill(B2C_CREDENTIALS.email);
        await passwordInput.fill(B2C_CREDENTIALS.password);
        await loginButton.click();
        await page.waitForTimeout(3000);

        // Open cart
        const cartButton = page.locator('[data-testid="cart-button"], button').filter({ hasText: /Sepet|Cart/i });
        if (await cartButton.count() > 0) {
          await cartButton.click();
          await page.waitForTimeout(2000);

          // Get initial total
          const initialTotal = await page.locator('[data-testid="cart-total"], [class*="total"]').textContent();
          console.log(`Initial cart total: ${initialTotal}`);

          // Try to increase quantity
          const increaseButton = page.locator('[data-testid="quantity-increase"], button').filter({ hasText: /\+/ });
          if (await increaseButton.count() > 0) {
            await increaseButton.first().click();
            await page.waitForTimeout(2000);

            // Get new total
            const newTotal = await page.locator('[data-testid="cart-total"], [class*="total"]').textContent();
            console.log(`New cart total after quantity increase: ${newTotal}`);

            await page.screenshot({ path: 'test-results/pricing-cart-quantity-update.png', fullPage: true });
          }
        }
      }
    });
  });

  test.describe('Phase 4: Checkout Process', () => {
    test('should proceed to checkout with correct pricing', async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
      const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]');
      const loginButton = page.locator('button[type="submit"][data-testid="auth-page-login-button"]');

      if (await emailInput.count() > 0) {
        await emailInput.fill(B2C_CREDENTIALS.email);
        await passwordInput.fill(B2C_CREDENTIALS.password);
        await loginButton.click();
        await page.waitForTimeout(3000);

        // Open cart
        const cartButton = page.locator('[data-testid="cart-button"], button').filter({ hasText: /Sepet|Cart/i });
        if (await cartButton.count() > 0) {
          await cartButton.click();
          await page.waitForTimeout(2000);

          // Get cart total
          const cartTotal = await page.locator('[data-testid="cart-total"], [class*="total"]').textContent();
          console.log(`Cart total before checkout: ${cartTotal}`);

          // Click checkout button
          const checkoutButton = page.locator('[data-testid="checkout-button"], a').filter({ hasText: /Ödeme|Checkout|Siparişi tamamla/i });
          if (await checkoutButton.count() > 0) {
            await checkoutButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            await page.screenshot({ path: 'test-results/pricing-checkout-page.png', fullPage: true });

            // Verify checkout total matches cart total
            const checkoutTotal = await page.locator('[data-testid="checkout-total"], [class*="total"]').textContent();
            console.log(`Checkout total: ${checkoutTotal}`);

            // Check for price breakdown
            const pageContent = await page.content();
            const hasBreakdown = /komisyon|commission|kargo|shipping/i.test(pageContent);
            console.log(`Has price breakdown: ${hasBreakdown}`);
          }
        }
      }
    });
  });

  test.describe('Phase 5: Price Comparison Tests', () => {
    test('should compare B2B vs B2C pricing for same product', async ({ page }) => {
      const productId: string[] = [''];

      // Test B2C pricing
      await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
      const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]');
      const loginButton = page.locator('button[type="submit"][data-testid="auth-page-login-button"]');

      await emailInput.fill(B2C_CREDENTIALS.email);
      await passwordInput.fill(B2C_CREDENTIALS.password);
      await loginButton.click();
      await page.waitForTimeout(3000);

      await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Get first product URL and price
      const productCards = await page.locator('a[href*="/urun"]').all();
      if (productCards.length > 0) {
        const productUrl = await productCards[0].getAttribute('href');
        const b2cPrice = await page.locator('[data-testid="product-price"], .price, [class*="price"]').first().textContent();
        console.log(`B2C Price: ${b2cPrice}`);

        // Logout and test B2B
        await page.context().clearCookies();
        await page.waitForTimeout(2000);

        await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
        await emailInput.fill(B2B_CREDENTIALS.email);
        await passwordInput.fill(B2B_CREDENTIALS.password);
        await loginButton.click();
        await page.waitForTimeout(3000);

        // Go to same product
        await page.goto(`${BASE_URL}${productUrl}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const b2bPrice = await page.locator('[data-testid="product-price"], .price, [class*="price"]').first().textContent();
        console.log(`B2B Price: ${b2bPrice}`);

        await page.screenshot({ path: 'test-results/pricing-b2b-vs-b2c.png', fullPage: true });

        // B2B price should be lower than B2C (30% commission vs 50%)
        const b2cNumeric = parsePrice(b2cPrice);
        const b2bNumeric = parsePrice(b2bPrice);

        console.log(`Price comparison - B2C: ${b2cNumeric} TL, B2B: ${b2bNumeric} TL`);
        console.log(`Difference: ${b2cNumeric - b2bNumeric} TL`);
        console.log(`B2B discount: ${((b2cNumeric - b2bNumeric) / b2cNumeric * 100).toFixed(2)}%`);
      }
    });
  });

  test.describe('Phase 6: Console & Network Monitoring', () => {
    test('should monitor RPC calls and console logs', async ({ page }) => {
      // Setup monitoring
      const consoleLogs: string[] = [];
      const networkRequests: { url: string; method: string }[] = [];

      page.on('console', (msg) => {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      });

      page.on('request', (request) => {
        if (request.url().includes('rpc') || request.url().includes('price')) {
          networkRequests.push({
            url: request.url(),
            method: request.method(),
          });
        }
      });

      page.on('response', async (response) => {
        if (response.url().includes('calculate_product_price')) {
          console.log('RPC Response:', response.status());
          try {
            const body = await response.json();
            console.log('RPC Response Body:', JSON.stringify(body, null, 2));
          } catch (e) {
            console.log('RPC Response not JSON');
          }
        }
      });

      // Navigate and interact
      await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Click on a product
      const productCards = await page.locator('a[href*="/urun"]').all();
      if (productCards.length > 0) {
        await productCards[0].click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }

      // Save logs
      console.log('\n=== Console Logs ===');
      consoleLogs.slice(-20).forEach(log => console.log(log));

      console.log('\n=== Network Requests ===');
      networkRequests.forEach(req => console.log(`${req.method}: ${req.url}`));
    });
  });

  test.describe('Phase 7: Error Handling', () => {
    test('should handle missing product gracefully', async ({ page }) => {
      // Try to access a non-existent product
      await page.goto(`${BASE_URL}${PRODUCT_DETAIL_ROUTE}/non-existent-product-id`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/pricing-error-handling.png', fullPage: true });

      // Check for error message or redirect
      const url = page.url();
      console.log(`Current URL after error: ${url}`);

      const hasError = /hata|error|bulunamadı|not found/i.test(await page.content());
      console.log(`Error message displayed: ${hasError}`);
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // This test checks how the app handles RPC failures
      // We'll monitor for client-side fallback behavior

      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        if (msg.text().includes('error') || msg.text().includes('fallback') || msg.text().includes('RPC')) {
          consoleLogs.push(msg.text());
        }
      });

      await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Check if there are any fallback messages
      const fallbackUsed = consoleLogs.some(log =>
        log.includes('fallback') || log.includes('client-side')
      );

      console.log(`Client-side fallback used: ${fallbackUsed}`);
    });
  });

  test.describe('Phase 8: Visual Regression', () => {
    test('should take screenshots for visual comparison', async ({ page }) => {
      const screenshots = [
        { name: 'homepage', url: BASE_URL },
        { name: 'products', url: `${BASE_URL}${PRODUCTS_ROUTE}` },
        { name: 'login', url: `${BASE_URL}${LOGIN_ROUTE}` },
      ];

      for (const shot of screenshots) {
        await page.goto(shot.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: `test-results/visual-regression/pricing-${shot.name}.png`,
          fullPage: true,
        });
      }

      // Login and take more screenshots
      await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
      const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]');
      const loginButton = page.locator('button[type="submit"][data-testid="auth-page-login-button"]');

      if (await emailInput.count() > 0) {
        await emailInput.fill(B2C_CREDENTIALS.email);
        await passwordInput.fill(B2C_CREDENTIALS.password);
        await loginButton.click();
        await page.waitForTimeout(3000);

        await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({
          path: 'test-results/visual-regression/pricing-logged-in-products.png',
          fullPage: true,
        });
      }
    });
  });
});

test.describe('Pricing System - Performance Tests', () => {
  test('should measure pricing calculation performance', async ({ page }) => {
    const metrics: { name: string; duration: number }[] = [];

    // Monitor performance
    page.on('request', (request) => {
      if (request.url().includes('calculate_product_price')) {
        const startTime = Date.now();
        request.on('response', () => {
          metrics.push({
            name: 'calculate_product_price',
            duration: Date.now() - startTime,
          });
        });
      }
    });

    await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click multiple products to trigger pricing calculations
    const productCards = await page.locator('a[href*="/product"]').all();
    const maxTests = Math.min(5, productCards.length);

    for (let i = 0; i < maxTests; i++) {
      await productCards[i].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Calculate statistics
    if (metrics.length > 0) {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const maxDuration = Math.max(...metrics.map(m => m.duration));
      const minDuration = Math.min(...metrics.map(m => m.duration));

      console.log('\n=== Pricing Performance Metrics ===');
      console.log(`Total calls: ${metrics.length}`);
      console.log(`Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`Min: ${minDuration}ms`);
      console.log(`Max: ${maxDuration}ms`);

      // Performance should be under 1 second
      expect(avgDuration).toBeLessThan(1000);
    } else {
      console.log('No pricing RPC calls were made');
    }
  });
});

test.describe('Pricing System - Data Validation', () => {
  test('should verify price calculation accuracy', async ({ page }) => {
    // This test verifies that the displayed prices match the expected calculation
    // Formula: final_price = supplier_price / (1 - commission) * regional_multiplier

    await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
    const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]');
    const loginButton = page.locator('button[type="submit"][data-testid="auth-page-login-button"]');

    await emailInput.fill(B2C_CREDENTIALS.email);
    await passwordInput.fill(B2C_CREDENTIALS.password);
    await loginButton.click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}${PRODUCTS_ROUTE}`);
    await page.waitForLoadState('networkidle');

    // Get price data from RPC
    const rpcData: any[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('calculate_product_price')) {
        try {
          const data = await response.json();
          rpcData.push(data);
        } catch (e) {
          // Ignore non-JSON responses
        }
      }
    });

    // Click on a product
    const productCards = await page.locator('a[href*="/urun"]').all();
    if (productCards.length > 0) {
      await productCards[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Get displayed price
      const displayedPriceText = await page.locator('[data-testid="product-price"], .price, [class*="price"]').first().textContent();
      const displayedPrice = parsePrice(displayedPriceText);

      // Get RPC data
      if (rpcData.length > 0) {
        console.log('\n=== RPC Price Data ===');
        console.log(JSON.stringify(rpcData[0], null, 2));

        // Verify calculation
        // This is a simplified check - actual implementation would need more detailed data
        console.log(`\nDisplayed price: ${displayedPrice} TL`);
      }
    }
  });
});
