# Playground Testing Setup - Summary

## Deliverables Created

### 1. Testing Strategy Document
**File:** `docs/TESTING-STRATEGY.md`

Comprehensive testing strategy covering:
- Visual Regression Testing (Percy/Chromatic options)
- Accessibility Testing (WCAG 2.1 AA)
- Performance Testing (Lighthouse CI)
- Integration Testing scenarios
- Continuous Integration pipeline
- Quality Metrics and Gates

### 2. GitHub Actions Workflow
**File:** `.github/workflows/playground-ci.yml`

Multi-stage CI pipeline with:
- **Quality Gate:** Lint + Type Check
- **Unit Tests:** Coverage thresholds (80%)
- **Visual Regression:** Screenshot comparison
- **Accessibility:** axe-core integration
- **Bundle Size:** 50KB limit check
- **Yellow Badge Contrast:** Special verification
- **Lighthouse:** Performance scores
- **Cross-Browser:** Chrome, Firefox, Safari testing
- **Quality Gate Summary:** PR comment with results

### 3. Test Scripts

#### Contrast Verification
**File:** `tests/scripts/verify-contrast.js`

Verifies yellow badge (`badge-quality-premium`) contrast:
- WCAG AA compliance (4.5:1 for normal text)
- Automated contrast ratio calculation
- Console logging of results

#### Visual Regression Tests
**File:** `tests/playground/visual-regression.spec.ts`

Screenshot tests for:
- Full page (mobile, tablet, desktop)
- Component sections (badges, cards, forms, prices)
- Individual badge variants
- Interactive states (hover, focus)
- Responsive layouts

#### Accessibility Tests
**File:** `tests/playground/accessibility.spec.ts`

A11y tests covering:
- Full page axe-core scan
- Color contrast verification
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes validation
- Yellow badge specific tests

#### Unit Tests
**File:** `tests/playground/components.spec.tsx`

Component unit tests:
- CoreUI rendering
- TokenShowcase rendering
- AIReviewPanel rendering
- Badge variant presence
- Color contrast utility

### 4. Configuration Files

#### Lighthouse Budget
**File:** `lighthouse-budget.json`

Performance thresholds:
- Performance: 90+ (error)
- Accessibility: 100 (error)
- Best Practices: 90+ (warn)
- FCP: < 1.5s
- LCP: < 2.5s
- CLS: < 0.1

#### Playwright Config
**File:** `playground.config.ts`

Playwright settings for playground tests:
- Separate test directory
- Multiple devices (Chrome, Firefox, Safari, Mobile, Tablet)
- Screenshots on failure
- Trace on retry

### 5. Package Scripts Updated
**File:** `package.json`

New test commands:
```bash
npm run test:playground      # Run all playground tests
npm run test:visual          # Visual regression only
npm run test:a11y            # Accessibility tests only
npm run test:contrast        # Yellow badge contrast check
npm run test:lighthouse      # Performance audit
npm run typecheck            # TypeScript validation
```

---

## Next Steps to Implement

### Step 1: Install Dependencies
```bash
npm install --save-dev axe-playwright
```

### Step 2: Update Playwright Config
The main `playwright.config.ts` needs to reference the new playground config, or run tests separately:
```bash
# For playground tests specifically
npx playwright test --config=playground.config.ts

# Or add to package.json
"test:playground": "playwright test --config=playground.config.ts"
```

### Step 3: Create Baseline Screenshots
```bash
# Build the app first
npm run build

# Generate baseline screenshots
npm run test:visual -- --update-snapshots
```

### Step 4: Verify Yellow Badge Contrast
```bash
# Start dev server
npm run dev

# In another terminal, run contrast check
npm run test:contrast
```

### Step 5: Run Full Test Suite
```bash
# Run all playground tests
npm run test:playground
```

---

## Priority Actions

| Priority | Task | Command | Status |
|----------|------|---------|--------|
| P0 | Install axe-playwright | `npm i -D axe-playwright` | Pending |
| P0 | Yellow badge contrast | `npm run test:contrast` | Pending |
| P1 | Create visual baseline | `npm run test:visual -- --update-snapshots` | Pending |
| P1 | Run a11y tests | `npm run test:a11y` | Pending |
| P2 | Set up Lighthouse CI | `npm i -D @lhci/cli` | Pending |
| P3 | Configure Percy (optional) | - | Optional |

---

## Yellow Badge Details

**Current Implementation:**
```css
.badge-quality-premium {
  @apply badge-quality bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border border-amber-600;
}
```

**Expected Contrast:**
- Background: `amber-400` (#fbbf24) to `yellow-500` (#eab308)
- Text: `amber-950` (#441c00)
- Expected Ratio: ~7:1 (passes WCAG AAA)

**Verification:**
The contrast test will compute the actual contrast ratio from rendered styles and verify WCAG AA compliance.

---

## File Structure

```
haldeki-market/
├── docs/
│   └── TESTING-STRATEGY.md          # Testing strategy doc
├── .github/workflows/
│   └── playground-ci.yml            # CI/CD workflow
├── tests/
│   ├── playground/
│   │   ├── visual-regression.spec.ts
│   │   ├── accessibility.spec.ts
│   │   └── components.spec.tsx
│   └── scripts/
│       └── verify-contrast.js       # Yellow badge checker
├── playground.config.ts             # Playwright config
├── lighthouse-budget.json           # Performance budgets
└── package.json                     # Updated scripts
```

---

## Quality Gates Summary

| Check | Tool | Threshold | Blocker |
|-------|------|-----------|---------|
| Lint | ESLint | 0 errors | Yes |
| Type Check | tsc | 0 errors | Yes |
| Unit Tests | Vitest | 80% coverage | Yes |
| Visual Regression | Playwright | 0 diffs | Yes |
| Accessibility | axe-core | 0 violations | Yes |
| Contrast | Custom | 4.5:1 | Yes |
| Lighthouse | CI | 90+ score | Warning |
| Bundle Size | Custom | 50KB | Warning |

---

## Expected CI Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Pull Request to main/develop with playground changes      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: Quality Gate                                      │
│  ├─ ESLint (blocks on errors)                              │
│  └─ Type Check (blocks on errors)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 2: Unit Tests                                        │
│  └─ Vitest with 80% coverage threshold                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 3: Visual Regression                                 │
│  └─ Screenshot comparison against baseline                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 4: Accessibility                                     │
│  └─ axe-core scan (blocks on violations)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 5: Yellow Badge Contrast                             │
│  └─ WCAG AA verification (4.5:1)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 6: Performance (Lighthouse)                          │
│  └─ 90+ score required (warning only)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 7: Quality Gate Summary                              │
│  └─ Post results as PR comment                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: axe-playwright not found
**Fix:** `npm install --save-dev axe-playwright`

### Issue: Screenshots don't match baseline
**Fix:** Update baseline with `npm run test:visual -- --update-snapshots`

### Issue: Contrast check fails
**Fix:** Adjust badge colors in `src/index.css` to meet 4.5:1 ratio

### Issue: CI fails on typecheck
**Fix:** Run `npm run typecheck` locally to identify issues

---

## References

- [Testing Strategy](./TESTING-STRATEGY.md) - Full strategy document
- [Playwright Docs](https://playwright.dev/) - Testing framework
- [axe-core Docs](https://www.deque.com/axe/) - Accessibility testing
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - Performance testing
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility standards
