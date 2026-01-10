# Playground Testing Strategy

> Version: 1.0
> Last Updated: 2025-01-10
> Status: Active

## Overview

Comprehensive testing strategy for the Haldeki Market Playground component to ensure visual quality, accessibility, performance, and cross-browser compatibility.

## Priority Actions

| Priority | Task | Status |
|----------|------|--------|
| P0 | Yellow badge contrast verification | Pending |
| P1 | Visual regression setup | Pending |
| P2 | A11y testing implementation | Pending |
| P3 | Performance monitoring | Pending |

---

## 1. Visual Regression Testing

### Goal
Detect unintended visual changes across browsers, devices, and themes.

### Tools

| Tool | Purpose | Cost | Status |
|------|---------|------|--------|
| Playwright Screenshots | Baseline capture | Free (existing) | Ready |
| Percy | Cloud-based comparison | Paid | Optional |
| Chromatic | Storybook integration | Paid | Optional |

### Implementation Plan

#### Phase 1: Screenshot Baseline (Immediate)

```bash
# Create baseline screenshots
npm run test:visual:baseline

# Compare against baseline
npm run test:visual:compare
```

#### Phase 2: Cross-Browser Matrix

| Browser | Versions | Viewports | Priority |
|---------|----------|-----------|----------|
| Chrome | 120+, Latest | Desktop, Tablet, Mobile | P0 |
| Firefox | 120+, Latest | Desktop, Tablet, Mobile | P0 |
| Safari | 16+, 17+ | Desktop, Mobile | P1 |
| Edge | Latest | Desktop | P1 |

### Viewport Targets

```typescript
const VIEWPORTS = {
  'mobile-small': { width: 375, height: 667 },   // iPhone SE
  'mobile': { width: 390, height: 844 },          // iPhone 12/13
  'tablet': { width: 768, height: 1024 },         // iPad
  'desktop': { width: 1920, height: 1080 },       // Full HD
  'desktop-xl': { width: 2560, height: 1440 },    // 2K
};
```

### Test Coverage

| Component | States | Variants |
|-----------|--------|----------|
| Badges | Default, hover, focus | All 6 variants |
| Buttons | Default, hover, active, disabled | 7 variants |
| Cards | Default, hover, shadow | 3 styles |
| Forms | Empty, filled, error, valid | All inputs |
| Price Indicators | Up, down, stable | All states |

### Yellow Badge Contrast Fix Verification

**Target:** `badge-quality-premium` class

**Current CSS:**
```css
.badge-quality-premium {
  @apply badge-quality bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border border-amber-600;
}
```

**WCAG AA Requirements:**
- Normal text (< 18px): 4.5:1 minimum
- Large text (18px+): 3:1 minimum

**Verification Test:**
```typescript
test('badge-quality-premium meets WCAG AA', async ({ page }) => {
  await page.goto('/playground');
  const badge = page.locator('.badge-quality-premium').first();

  // Get computed colors
  const bgColor = await badge.evaluate(el => {
    return getComputedStyle(el).backgroundColor;
  });

  const textColor = await badge.evaluate(el => {
    return getComputedStyle(el).color;
  });

  // Calculate contrast ratio
  const ratio = calculateContrastRatio(bgColor, textColor);

  // Assert WCAG AA compliance
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
```

---

## 2. Accessibility Testing

### Goal
Ensure WCAG 2.1 AA compliance for all playground components.

### Tools

| Tool | Purpose | Integration |
|------|---------|-------------|
| axe-core | Automated a11y | Playwright |
| jest-axe | Unit test a11y | Vitest |
| NVDA/JAWS | Screen reader testing | Manual |
| Keyboard | Navigation testing | Manual |

### Test Coverage Matrix

| Component | Keyboard | ARIA | Screen Reader | Color Contrast |
|-----------|----------|------|---------------|----------------|
| Badges | Tab focus | Labels | Announced | 4.5:1 |
| Buttons | Enter/Space | pressed state | Announced | 4.5:1 |
| Cards | Tab focus | - | - | - |
| Forms | Tab/Arrows | Labels/Errors | Announced | 4.5:1 |
| Price Indicators | - | - | Announced | 4.5:1 |

### Automated A11y Tests

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test.beforeEach(async ({ page }) => {
  await injectAxe(page);
});

test('playground page passes accessibility scan', async ({ page }) => {
  await page.goto('/playground');
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

### Keyboard Navigation Tests

| Component | Expected Behavior | Test Case |
|-----------|-------------------|-----------|
| All focusable | Visible focus ring | `expect(focusVisible).toBe(true)` |
| Buttons | Enter/Space triggers | `await page.keyboard.press('Enter')` |
| Forms | Tab moves logically | Tab order matches visual |
| Modals (if any) | Focus trap | Tab stays inside |

### Color Contrast Thresholds

| Element | WCAG Level | Ratio |
|---------|------------|-------|
| Body text | AA | 4.5:1 |
| Large text (18px+) | AA | 3:1 |
| UI components | AA | 3:1 |
| Body text | AAA | 7:1 |
| Large text | AAA | 4.5:1 |

---

## 3. Performance Testing

### Goal
Maintain fast load times and smooth interactions.

### Metrics

| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Bundle Size (Playground) | < 50KB | webpack-bundle-analyzer |

### Bundle Size Budget

```json
{
  "budgets": [
    {
      "path": "./src/components/playground/**/*",
      "limit": "50 kB",
      "type": "initial"
    }
  ]
}
```

### Lighthouse CI Integration

```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      http://localhost:8080/playground
    budgetPath: ./lighthouse-budget.json
    uploadArtifacts: true
```

### Performance Budget

```json
{
  "budgets": [
    {
      "path": "/*",
      "timings": [
        {
          "metric": "first-contentful-paint",
          "budget": 1500
        },
        {
          "metric": "largest-contentful-paint",
          "budget": 2500
        },
        {
          "metric": "cumulative-layout-shift",
          "budget": 0.1
        },
        {
          "metric": "total-blocking-time",
          "budget": 300
        }
      ]
    }
  ]
}
```

---

## 4. Integration Testing

### Goal
Verify component interactions and state management.

### Test Scenarios

| Scenario | Description | Type |
|----------|-------------|------|
| Badge rendering | All variants display correctly | Component |
| Button interactions | Click, hover, disabled states | Component |
| Form validation | Error messages, success states | Integration |
| Responsive layout | Grid adapts to viewport | Visual |
| Theme switching | Light/dark mode (if applicable) | Visual |

### Example Test

```typescript
import { render, screen } from '@testing-library/react';
import { CoreUI } from '@/components/playground/CoreUI';

describe('CoreUI', () => {
  it('renders all badge variants', () => {
    render(<CoreUI />);

    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
    expect(screen.getByText('Fresh Today')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('badge-quality-premium has correct contrast', () => {
    const { container } = render(<CoreUI />);
    const badge = container.querySelector('.badge-quality-premium');

    const styles = window.getComputedStyle(badge);
    const bgColor = styles.backgroundColor;
    const textColor = styles.color;

    const contrast = calculateContrastRatio(bgColor, textColor);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});
```

---

## 5. Continuous Integration

### Quality Gates

| Gate | Tool | Threshold | Blocker |
|------|------|-----------|---------|
| Lint | ESLint | 0 errors | Yes |
| Type Check | tsc | 0 errors | Yes |
| Unit Tests | Vitest | 80% coverage | Yes |
| Visual Regression | Playwright | 0 diffs | Yes |
| A11y | axe-core | 0 violations | Yes |
| Lighthouse | CI | 90+ score | Warning |
| Bundle Size | bundlesize | +50KB limit | Warning |

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run typecheck",
      "pre-push": "npm run test:unit"
    }
  }
}
```

### CI Pipeline Stages

```yaml
stages:
  - name: lint
    run: npm run lint

  - name: typecheck
    run: npx tsc --noEmit

  - name: unit-tests
    run: npm run test:unit:coverage

  - name: visual-regression
    run: npm run test:visual

  - name: a11y-tests
    run: npm run test:a11y

  - name: lighthouse
    run: npm run test:lighthouse
```

---

## 6. Test Checklist Template

### Before Release

```markdown
## Playground Release Checklist

### Visual
- [ ] All badges render correctly in all browsers
- [ ] Yellow badge contrast verified (4.5:1 minimum)
- [ ] Screenshots match baseline
- [ ] Responsive layout tested (mobile, tablet, desktop)
- [ ] No visual regressions from baseline

### Accessibility
- [ ] axe-core scan passes (0 violations)
- [ ] Keyboard navigation works
- [ ] Screen reader announces all elements
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

### Performance
- [ ] Lighthouse score 90+
- [ ] Bundle size within budget
- [ ] No layout shift (CLS < 0.1)
- [ ] Fast load times (LCP < 2.5s)

### Functionality
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] ESLint passes
```

---

## 7. Quality Metrics

### Coverage Targets

| Type | Target | Current |
|------|--------|---------|
| Statements | 80% | - |
| Branches | 80% | - |
| Functions | 80% | - |
| Lines | 80% | - |

### Score Thresholds

| Metric | Target | Blocker |
|--------|--------|---------|
| Lighthouse Performance | 90+ | No |
| Lighthouse Accessibility | 100 | Yes |
| Lighthouse Best Practices | 90+ | No |
| Lighthouse SEO | 90+ | No |

### Bundle Size Limits

| Component | Limit | Current |
|-----------|-------|---------|
| CoreUI | 10KB | - |
| TokenShowcase | 10KB | - |
| AIReviewPanel | 10KB | - |
| Total Playground | 50KB | - |

---

## 8. Testing Commands

```bash
# Unit tests
npm run test:unit                  # Run unit tests
npm run test:unit:coverage         # Run with coverage

# E2E tests
npm run test:e2e                   # Run E2E tests
npm run test:e2e:ui                # Run with UI
npm run test:e2e:debug             # Debug mode

# Visual regression (to be implemented)
npm run test:visual:baseline       # Create baseline
npm run test:visual:compare        # Compare to baseline

# Accessibility
npm run test:a11y                  # Run a11y tests

# Performance
npm run test:lighthouse            # Run Lighthouse

# All tests
npm run test:all                   # Run all tests
```

---

## 9. Tools & Dependencies

### Required

```json
{
  "devDependencies": {
    "@playwright/test": "^1.57.0",
    "@vitest/coverage-v8": "^4.0.16",
    "vitest": "^4.0.16",
    "axe-playwright": "^1.2.0",
    "jest-axe": "^8.0.0"
  }
}
```

### Optional

```json
{
  "devDependencies": {
    "@percy/cli": "^1.27.0",
    "chromatic": "^10.0.0",
    "lighthouse-ci": "^0.12.0"
  }
}
```

---

## 10. Next Steps

### Immediate (This Week)

1. [ ] Create visual baseline screenshots
2. [ ] Verify yellow badge contrast (PRIORITY)
3. [ ] Set up automated a11y tests
4. [ ] Create CI/CD workflow

### Short-term (This Month)

1. [ ] Implement Playwright visual tests
2. [ ] Add Lighthouse CI
3. [ ] Set up bundle size monitoring
4. [ ] Document test writing guide

### Long-term (This Quarter)

1. [ ] Consider Percy/Chromatic for cloud visual testing
2. [ ] Set up performance monitoring dashboard
3. [ ] Create automated regression testing
4. [ ] Establish test coverage reports

---

## Appendix: Color Contrast Calculator

```typescript
function calculateContrastRatio(fg: string, bg: string): number {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const luminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);

  if (!fgRgb || !bgRgb) return 0;

  const fgLum = luminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = luminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}
```
