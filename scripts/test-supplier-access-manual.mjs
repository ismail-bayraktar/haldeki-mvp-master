#!/usr/bin/env node

/**
 * Manual Supplier Access Test Script
 * Tests supplier access to /tedarikci route after has_role fix
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://haldeki.com';
const SUPPLIER_EMAIL = 'test-supplier@haldeki.com';
const SUPPLIER_PASSWORD = 'Test1234!';

console.log('='.repeat(60));
console.log('SUPPLIER ACCESS TEST - After has_role Fix');
console.log('='.repeat(60));
console.log(`Base URL: ${BASE_URL}`);
console.log(`Supplier Email: ${SUPPLIER_EMAIL}`);
console.log(`Testing: /tedarikci route access`);
console.log('='.repeat(60));
console.log('');

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Collect console errors
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
    console.log(`[Console Error]: ${msg.text()}`);
  }
});

try {
  // Set region in localStorage to skip modal
  console.log('PRE-TEST: Setting region in localStorage to skip modal...');
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.setItem('selectedRegion', JSON.stringify({
      id: 'menemen',
      name: 'Menemen',
      slug: 'menemen'
    }));
    localStorage.setItem('regionSelected', 'true');
  });
  console.log('✓ Region set in localStorage');
  console.log('');

  // Test 1: Navigate to home page with region set
  console.log('TEST 1: Navigating to home page (with region set)...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for page to fully load
  console.log('✓ Home page loaded');
  console.log('');

  // Test 2: Look for and click login button
  console.log('TEST 2: Looking for login button...');

  // Take screenshot to see current state
  await page.screenshot({ path: 'test-results/01-homepage-with-region.png', fullPage: true });

  // Try to find login button using text content search
  const loginClicked = await page.evaluate(() => {
    // Find all elements
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent || '';
      // Look for login text in short elements
      if (text.toLowerCase().includes('giriş') && text.length < 100) {
        // Check if it's clickable
        const style = window.getComputedStyle(el);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
        const isClickable = el.tagName === 'BUTTON' || el.tagName === 'A' ||
                           el.onclick !== null || el.classList.contains('btn') ||
                           el.role === 'button';

        if (isVisible && isClickable) {
          el.click();
          return { clicked: true, text: text.trim() };
        }
      }
    }
    return { clicked: false };
  });

  if (loginClicked.clicked) {
    console.log(`✓ Login button clicked: "${loginClicked.text}"`);
  } else {
    // Try alternative: Look for specific selectors
    console.log('⚠ First method failed, trying alternative selectors...');

    const altSelectors = [
      'a[href="/giris"]',
      'a[href*="login"]',
      'a[href*="auth"]',
      'button[class*="login"]',
      'button[class*="auth"]',
      '[data-testid*="login"]',
      '[data-testid*="auth"]',
    ];

    let found = false;
    for (const selector of altSelectors) {
      try {
        const el = await page.$(selector);
        if (el) {
          await el.click();
          console.log(`✓ Login button clicked via selector: ${selector}`);
          found = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!found) {
      console.log('✗ Could not find or click login button');
      await page.screenshot({ path: 'test-results/error-no-login.png', fullPage: true });
      throw new Error('Login button not found');
    }
  }
  console.log('');

  // Wait for auth modal/drawer
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/02-auth-modal.png', fullPage: true });

  // Test 3: Fill login form
  console.log('TEST 3: Filling login form...');

  // Find and fill email input
  const emailFilled = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[placeholder*="email" i], input[placeholder*="e-posta" i]');
    for (const input of inputs) {
      if (input.offsetParent !== null) { // Visible
        input.value = 'test-supplier@haldeki.com';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  });

  if (!emailFilled) {
    throw new Error('Email input not found or not fillable');
  }
  console.log('✓ Email filled');

  // Find and fill password input
  const passwordFilled = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="password"], input[name*="password"]');
    for (const input of inputs) {
      if (input.offsetParent !== null) { // Visible
        input.value = 'Test1234!';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  });

  if (!passwordFilled) {
    throw new Error('Password input not found or not fillable');
  }
  console.log('✓ Password filled');
  console.log('');

  // Test 4: Submit login
  console.log('TEST 4: Submitting login form...');

  const loginSubmitted = await page.evaluate(() => {
    // Find submit button
    const buttons = document.querySelectorAll('button[type="submit"]');
    for (const btn of buttons) {
      if (btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }

    // Try pressing Enter on password field
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    for (const input of passwordInputs) {
      if (input.offsetParent !== null) {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        return true;
      }
    }

    return false;
  });

  if (loginSubmitted) {
    console.log('✓ Login submitted');
  } else {
    console.log('⚠ Could not auto-submit login');
  }
  console.log('');

  // Wait for login to complete
  await page.waitForTimeout(3000);

  // Test 5: Navigate to /tedarikci
  console.log('TEST 5: Navigating to /tedarikci dashboard...');
  await page.goto(`${BASE_URL}/tedarikci`, { waitUntil: 'networkidle' });

  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  // Take screenshot
  await page.screenshot({ path: 'test-results/03-supplier-dashboard.png', fullPage: true });
  console.log('✓ Screenshot saved to test-results/03-supplier-dashboard.png');
  console.log('');

  // Test 6: Check for errors
  console.log('TEST 6: Checking for errors...');

  const pageContent = await page.textContent('body');

  const errorStrings = [
    'Tedarikçi kaydı bulunamadı',
    'Erişim reddedildi',
    'Yetkiniz yok',
    'Access Denied',
    'Not Found',
    '404',
  ];

  const errorsFound = [];
  for (const errorStr of errorStrings) {
    if (pageContent.includes(errorStr)) {
      errorsFound.push(errorStr);
    }
  }

  if (errorsFound.length > 0) {
    console.log(`✗ Errors found on page: ${errorsFound.join(', ')}`);
  } else {
    console.log('✓ No error messages found on page');
  }
  console.log('');

  // Test 7: Verify URL
  console.log('TEST 7: Verifying URL...');

  if (currentUrl.includes('/tedarikci')) {
    console.log('✓ Successfully accessed /tedarikci route');
  } else if (currentUrl.includes('/giris')) {
    console.log('✗ Redirected to login page - authentication failed');
  } else {
    console.log(`⚠ Unexpected URL: ${currentUrl}`);
  }
  console.log('');

  // Test 8: Console errors
  console.log('TEST 8: Checking console errors...');

  if (consoleErrors.length > 0) {
    console.log(`⚠ Found ${consoleErrors.length} console errors:`);
    consoleErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  } else {
    console.log('✓ No console errors detected');
  }
  console.log('');

  // Final summary
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const tests = [
    { name: 'Home page loads with region set', passed: true },
    { name: 'Login button clicked', passed: loginClicked.clicked || loginSubmitted },
    { name: 'Email input filled', passed: emailFilled },
    { name: 'Password input filled', passed: passwordFilled },
    { name: 'Login submitted', passed: loginSubmitted },
    { name: '/tedarikci accessible', passed: currentUrl.includes('/tedarikci') },
    { name: 'No error messages', passed: errorsFound.length === 0 },
    { name: 'No console errors', passed: consoleErrors.length === 0 },
  ];

  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;

  tests.forEach(test => {
    const status = test.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${test.name}`);
  });

  console.log('='.repeat(60));
  console.log(`RESULT: ${passedTests}/${totalTests} tests passed`);
  console.log('='.repeat(60));

  if (passedTests === totalTests) {
    console.log('');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('Supplier can successfully access /tedarikci route.');
  } else {
    console.log('');
    console.log('⚠️  SOME TESTS FAILED');
    console.log('Please review the screenshots and errors above.');
  }

} catch (error) {
  console.error('');
  console.error('='.repeat(60));
  console.error('TEST FAILED');
  console.error('='.repeat(60));
  console.error(`Error: ${error.message}`);
  console.error(error.stack);
  console.error('');

  // Take screenshot on error
  await page.screenshot({ path: 'test-results/error-screenshot.png', fullPage: true });
  console.log('Error screenshot saved to test-results/error-screenshot.png');
} finally {
  await browser.close();
}

console.log('');
console.log('Test complete. Screenshots saved to test-results/');
