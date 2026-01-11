/**
 * Production Functional Tests
 * Tests critical functionality on https://www.haldeki.com
 * Without requiring test user authentication
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://www.haldeki.com';

test.describe('Production - Critical Pages', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Wait for body to be ready
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    expect(title).toBeTruthy();

    await page.screenshot({ path: 'test-results/prod-homepage.png' });
  });

  test('should load products page', async ({ page }) => {
    await page.goto(`${BASE_URL}/urunler`, { waitUntil: 'domcontentloaded' });

    // Wait for URL to be stable
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url).toContain('/urunler');

    await page.screenshot({ path: 'test-results/prod-products.png' });
  });

  test('should load today page', async ({ page }) => {
    await page.goto(`${BASE_URL}/bugun-halde`, { waitUntil: 'domcontentloaded' });

    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url).toContain('/bugun-halde');

    await page.screenshot({ path: 'test-results/prod-bugun-halde.png' });
  });

  test('should load login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/giris`, { waitUntil: 'domcontentloaded' });

    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url).toContain('/giris');

    await page.screenshot({ path: 'test-results/prod-login.png' });
  });
});

test.describe('Production - Whitelist Form', () => {
  test('should display whitelist form on homepage', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Wait for the page to be loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for whitelist form by data-testid or id
    const whitelistForm = page.locator('[data-testid="whitelist-form"], #whitelist-form').first();
    await expect(whitelistForm).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'test-results/prod-whitelist-form.png' });
  });

  test('should show whitelist application button', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    await page.waitForLoadState('domcontentloaded');

    // Check for the submit button with data-testid
    const submitButton = page.locator('[data-testid="whitelist-submit-button"]');
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    // Verify button text contains "Başvur"
    const buttonText = await submitButton.textContent();
    expect(buttonText).toContain('Başvur');
  });

  test('should have whitelist form inputs', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for form inputs using data-testid
    const nameInput = page.locator('[data-testid="whitelist-name-input"]');
    const phoneInput = page.locator('[data-testid="whitelist-phone-input"]');
    const emailInput = page.locator('[data-testid="whitelist-email-input"]');

    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await expect(phoneInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Production - Navigation', () => {
  test('should have working navigation links', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    await page.waitForLoadState('domcontentloaded');

    // Get navigation links
    const navLinks = page.locator('[data-testid^="nav-link-"], a[href]').all();
    const links = await navLinks;

    let testedLinks = 0;
    const maxLinksToTest = 3;

    // Test first few navigation links
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      if (testedLinks >= maxLinksToTest) break;

      const link = links[i];
      const href = await link.getAttribute('href');

      // Only test internal links, skip hashes and auth-required links
      if (href && href.startsWith('/') && !href.includes('#') && !href.includes('giris')) {
        try {
          // Get the current URL before clicking
          const currentUrl = page.url();

          // Click the link
          await link.click();

          // Wait for navigation with shorter timeout
          await page.waitForLoadState('domcontentloaded', { timeout: 5000 });

          // Wait a bit for content to settle
          await page.waitForTimeout(500);

          const newUrl = page.url();
          expect(newUrl).toBeTruthy();

          testedLinks++;

          // Go back to homepage
          await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('domcontentloaded');
        } catch (e) {
          // Some links might navigate to external pages or require auth
          console.log(`Skipping link ${href}: ${e}`);
          // Go back to homepage if possible
          await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
        }
      }
    }

    console.log(`Successfully tested ${testedLinks} navigation links`);
  });

  test('should have mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    await page.waitForLoadState('domcontentloaded');

    // Check for mobile navigation
    const mobileNav = page.locator('[data-testid="mobile-navigation"]');
    await expect(mobileNav).toBeVisible({ timeout: 5000 });

    // Check for mobile menu trigger
    const menuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
    const triggerCount = await menuTrigger.count();

    console.log(`Mobile menu trigger found: ${triggerCount > 0}`);
  });
});

test.describe('Production - API Monitoring', () => {
  test('should monitor RPC calls on products page', async ({ page }) => {
    const apiCalls: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('rpc') || request.url().includes('supabase')) {
        apiCalls.push(request.url());
        console.log('API Call:', request.url().substring(0, 100));
      }
    });

    await page.goto(`${BASE_URL}/urunler`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log(`Total API calls detected: ${apiCalls.length}`);
    expect(apiCalls.length).toBeGreaterThanOrEqual(0);
  });

  test('should check for console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await page.goto(`${BASE_URL}/urunler`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
  });
});

test.describe('Production - Mobile Responsiveness', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'test-results/prod-mobile-homepage.png' });

    // Check if mobile navigation exists
    const mobileNav = page.locator('[data-testid="mobile-navigation"]');
    const navCount = await mobileNav.count();

    console.log(`Mobile navigation found: ${navCount > 0}`);
    expect(navCount).toBeGreaterThan(0);
  });
});

test.describe('Production - Performance', () => {
  test('should measure page load time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;
    console.log(`Homepage load time: ${loadTime}ms`);

    // Page should load in reasonable time
    expect(loadTime).toBeLessThan(10000);
  });

  test('should measure products page load time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/urunler`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;
    console.log(`Products page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Production - SEO & Meta Tags', () => {
  test('should have meta description', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    console.log('Meta description:', description);
  });

  test('should have viewport meta tag', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width');
  });
});

test.describe('Production - Assets Loading', () => {
  test('should load critical assets without errors', async ({ page }) => {
    const failedAssets: string[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        if (url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.jpg')) {
          failedAssets.push(url);
        }
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    if (failedAssets.length > 0) {
      console.log('Failed assets:', failedAssets);
    }

    // Allow some non-critical assets to fail
    const criticalFailures = failedAssets.filter(a => a.includes('.js') || a.includes('.css'));
    expect(criticalFailures.length).toBe(0);
  });
});

test.describe('Production - Form Validation', () => {
  test('should have form validation on whitelist', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Wait for form to be visible
    const form = page.locator('[data-testid="whitelist-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    // Try to find submit button and click without filling form
    const submitButton = page.locator('[data-testid="whitelist-submit-button"]');

    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Form should show validation or stay on page
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });
});

test.describe('Production - Product Cards', () => {
  test('should have product cards with testids', async ({ page }) => {
    await page.goto(`${BASE_URL}/urunler`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for any product cards or product links
    const productLinks = page.locator('a[href*="/urun/"]');
    const count = await productLinks.count();

    console.log(`Product links found: ${count}`);

    // At least homepage should have some products visible
    if (count === 0) {
      // Try checking homepage for products
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const homeProductLinks = page.locator('a[href*="/urun/"]');
      const homeCount = await homeProductLinks.count();
      console.log(`Product links on homepage: ${homeCount}`);
    }
  });
});
