/**
 * Yellow Badge Contrast Verification Script
 *
 * Verifies that the badge-quality-premium class meets WCAG AA requirements
 * (4.5:1 contrast ratio for normal text, 3:1 for large text)
 */

const { chromium } = require('playwright');

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function calculateContrastRatio(color1, color2) {
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

async function verifyYellowBadgeContrast() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    badge: 'badge-quality-premium',
    tests: [],
    passed: false
  };

  try {
    // Navigate to playground
    await page.goto('http://localhost:8080/playground');

    // Wait for the badge to be visible
    await page.waitForSelector('.badge-quality-premium', { timeout: 5000 });

    // Get all premium badges
    const badges = await page.locator('.badge-quality-premium').all();

    for (let i = 0; i < badges.length; i++) {
      const badge = badges[i];

      // Get computed background color
      const bgColor = await badge.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundColor;
      });

      // Get computed text color
      const textColor = await badge.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.color;
      });

      // Get font size
      const fontSize = await badge.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseFloat(styles.fontSize);
      });

      // Calculate contrast ratio
      const contrast = calculateContrastRatio(bgColor, textColor);

      // Determine threshold based on font size
      const threshold = fontSize >= 18 ? 3.0 : 4.5;
      const wcagLevel = fontSize >= 18 ? 'AA (Large Text)' : 'AA (Normal Text)';

      const testResult = {
        badgeIndex: i,
        backgroundColor: bgColor,
        textColor: textColor,
        fontSize: fontSize,
        contrastRatio: contrast,
        threshold: threshold,
        wcagLevel: wcagLevel,
        passed: contrast >= threshold
      };

      results.tests.push(testResult);

      console.log(`\nBadge ${i + 1}:`);
      console.log(`  Background: ${bgColor}`);
      console.log(`  Text: ${textColor}`);
      console.log(`  Font Size: ${fontSize}px`);
      console.log(`  Contrast Ratio: ${contrast.toFixed(2)}:1`);
      console.log(`  Required: ${threshold}:1 (${wcagLevel})`);
      console.log(`  Status: ${contrast >= threshold ? 'PASS' : 'FAIL'}`);
    }

    // Check if all tests passed
    results.passed = results.tests.every(test => test.passed);

    if (results.passed) {
      console.log('\n✅ All contrast tests PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ Some contrast tests FAILED');
      process.exit(1);
    }

  } catch (error) {
    console.error('Error during contrast verification:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run verification
verifyYellowBadgeContrast();
