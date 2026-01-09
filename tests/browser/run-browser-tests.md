# Browser Test Execution Guide

## Automated Test Execution

This guide provides step-by-step instructions for executing the Phase 12 browser tests.

---

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Apply Database Migrations**
   ```bash
   # Ensure all Phase 12 migrations are applied
   supabase db push
   ```

3. **Start Dev Server**
   ```bash
   npm run dev
   ```

   Server should start on `http://localhost:5173`

---

## Manual Testing Steps

### 1. Admin Login

1. Navigate to: `http://localhost:5173/login`
2. Enter credentials:
   - Email: `admin@haldeki.com`
   - Password: `[your admin password]`
3. Click "Giriş Yap"

### 2. Test Bugün Halde Page

1. Navigate to: `http://localhost:5173/admin/bugun-halde`
2. Open Chrome DevTools (F12)
3. **Console Tests**:
   ```javascript
   // Check for errors
   console.clear();

   // Check React Query state
   setTimeout(() => {
     const cache = window.__REACT_QUERY_CLIENT__?.getQueryCache();
     const queries = cache?.getAll() || [];
     console.table(
       queries.map(q => ({
         key: q.queryKey.join('/'),
         status: q.state.status,
         data: q.state.data?.length || 0
       }))
     );
   }, 2000);
   ```

4. **Network Tests**:
   - Switch to Network tab
   - Filter by "Fetch/XHR"
   - Look for `bugun_halde_comparison` queries
   - Verify status is 200
   - Check response time

5. **UI Tests**:
   - Verify summary cards show numbers
   - Click "Filtreler" button
   - Test category filter
   - Test search box
   - Test min suppliers filter
   - Click "Filtreleri Temizle"

6. **Responsive Tests**:
   - Press Ctrl+Shift+M (Device Toolbar)
   - Test: iPhone SE (375px)
   - Test: iPad (768px)
   - Test: Desktop (1920px)

### 3. Test Supplier Assignment

1. Navigate to: `http://localhost:5173/admin/products`
2. **Table Tests**:
   - Verify "Tedarikçiler" column exists
   - Click "Yönet" button on any product

3. **Dialog Tests**:
   - Verify product detail dialog opens
   - Click "Tedarikçiler" tab
   - Check supplier count badge
   - Click "Tedarikçi Ekle"

4. **Form Tests**:
   - **Test Validation**:
     - Try to submit without selecting supplier
     - Enter -1 for price
     - Enter 0 for min order quantity
     - Verify error messages appear

   - **Test Fields**:
     - Select supplier from dropdown
     - Enter price: 50.50
     - Enter stock: 100
     - Select availability: "Bol"
     - Select quality: "Standart"
     - Enter origin: "Antalya"
     - Enter min order: 10
     - Enter delivery days: 2
     - Toggle "Öne Çıkan"
     - Toggle "Aktif"

   - **Submit Test** (Optional - can skip actual DB write):
     - Click "Ekle" button
     - Verify loading state
     - **Close dialog** to avoid actual save

### 4. Test Supplier Variations

1. **Logout and Login as Supplier**:
   ```
   Email: supplier@test.halde.com
   Password: [supplier password]
   ```

2. Navigate to: `http://localhost:5173/tedarikci/urunler`

3. **Product Card Tests**:
   - Verify product cards display
   - Look for variation tags on cards
   - Verify tag colors are correct

4. **Variation Selector Tests**:
   - Click "Düzenle" on any product
   - Find "Varyasyon Ekle" button
   - Click to open popover
   - Test variation type selection
   - Test common value selection
   - Test custom value input

5. **Variation Tag Color Tests**:
   ```javascript
   // Run in console to check colors
   const tags = document.querySelectorAll('[class*="variation"]');
   tags.forEach(tag => {
     const styles = window.getComputedStyle(tag);
     console.log('Tag:', tag.textContent, 'BG:', styles.backgroundColor);
   });
   ```

### 5. Test Excel Import

1. On supplier products page
2. Click "İçe Aktar" button
3. Verify modal opens
4. Check download template link
5. (Optional) Test with actual Excel file

---

## Console Test Scripts

### Test 1: Check for Errors
```javascript
// Run this after each page load
console.log('=== Error Check ===');
const errors = [];
const originalError = console.error;
console.error = function(...args) {
  errors.push(args);
  originalError.apply(console, args);
};
// After interacting with page
console.log('Errors found:', errors.length);
if (errors.length > 0) {
  console.table(errors);
}
```

### Test 2: Check React Query
```javascript
// Check if data is loaded
setTimeout(() => {
  const client = window.__REACT_QUERY_CLIENT__;
  if (!client) {
    console.error('React Query client not found!');
    return;
  }

  const cache = client.getQueryCache();
  const queries = cache.getAll();

  console.log('=== React Query State ===');
  queries.forEach(q => {
    console.log('Query:', q.queryKey);
    console.log('  Status:', q.state.status);
    console.log('  Data:', q.state.data);
    console.log('  Error:', q.state.error);
  });
}, 2000);
```

### Test 3: Check Component Renders
```javascript
// Check for key components
setTimeout(() => {
  console.log('=== Component Check ===');

  // Bugün Halde
  const comparisonCards = document.querySelectorAll('[class*="comparison"]');
  console.log('Comparison cards:', comparisonCards.length);

  // Supplier dialog
  const supplierDialog = document.querySelector('[class*="supplier"]');
  console.log('Supplier dialog:', supplierDialog ? 'Found' : 'Not found');

  // Variations
  const variationTags = document.querySelectorAll('[class*="variation"]');
  console.log('Variation tags:', variationTags.length);

  // Forms
  const forms = document.querySelectorAll('form');
  console.log('Forms:', forms.length);
}, 1000);
```

### Test 4: Check Network Requests
```javascript
// Monitor network requests
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'resource') {
      console.log('Resource:', entry.name);
      console.log('  Duration:', entry.duration + 'ms');
      console.log('  Size:', (entry.transferSize / 1024).toFixed(2) + 'KB');
    }
  }
});
observer.observe({ entryTypes: ['resource'] });
```

---

## Screenshot Guide

### Manual Screenshots

1. **Bugün Halde Page**
   - Full page (with filters open)
   - Comparison cards
   - Mobile view (375px)

2. **Supplier Assignment**
   - Products table
   - Assignment dialog
   - Form validation errors

3. **Variations**
   - Product card with variations
   - Variation selector popover
   - Variation tag colors

### Automated Screenshots (using Puppeteer)

```javascript
// Save as: tests/browser/screenshots.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Navigate to Bugün Halde
  await page.goto('http://localhost:5173/admin/bugun-halde');
  await page.waitForSelector('[class*="comparison"]');
  await page.screenshot({ path: 'bugun-halde.png', fullPage: true });

  // Navigate to Products
  await page.goto('http://localhost:5173/admin/products');
  await page.waitForSelector('table');
  await page.screenshot({ path: 'products.png', fullPage: true });

  await browser.close();
})();
```

---

## Test Results Template

Copy and paste this template to record results:

```markdown
## Test Results - [Date]

### Environment
- Browser: Chrome [Version]
- OS: [Windows/Mac/Linux]
- URL: http://localhost:5173
- Time: [Start Time] - [End Time]

### Test Suite 1: Bugün Halde
| Test | Status | Notes |
|------|--------|-------|
| 1.1 Page Load | ✅/❌ | |
| 1.2 Filter Functionality | ✅/❌ | |
| 1.3 ComparisonCard Display | ✅/❌ | |
| 1.4 Responsive Design | ✅/❌ | |

**Console Errors**: [List]
**Network Issues**: [List]
**Screenshots**: [Links]

### Test Suite 2: Supplier Assignment
| Test | Status | Notes |
|------|--------|-------|
| 2.1 Supplier Column | ✅/❌ | |
| 2.2 Assignment Dialog | ✅/❌ | |
| 2.3 Form Validation | ✅/❌ | |
| 2.4 Supplier Selection | ✅/❌ | |
| 2.5 Field Interactions | ✅/❌ | |
| 2.6 Submit Flow | ✅/❌ | |

**Console Errors**: [List]
**Network Issues**: [List]
**Screenshots**: [Links]

### Test Suite 3: Variations
| Test | Status | Notes |
|------|--------|-------|
| 3.1 Products Page | ✅/❌ | |
| 3.2 VariationSelector | ✅/❌ | |
| 3.3 VariationTag Colors | ✅/❌ | |
| 3.4 VariationList | ✅/❌ | |

**Console Errors**: [List]
**Network Issues**: [List]
**Screenshots**: [Links]

### Summary
- **Total Tests**: X
- **Passed**: Y
- **Failed**: Z
- **Pass Rate**: (Y/X * 100)%

### Issues Found
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

### Recommendations
[Improvement suggestions]
```

---

## Quick Reference

### URLs
- Admin: `http://localhost:5173/admin`
- Bugün Halde: `http://localhost:5173/admin/bugun-halde`
- Products: `http://localhost:5173/admin/products`
- Supplier Products: `http://localhost:5173/tedarikci/urunler`

### Test Accounts
- Admin: `admin@haldeki.com`
- Supplier: `supplier@test.halde.com`

### DevTools Shortcuts
- F12: Open DevTools
- Ctrl+Shift+M: Device Toolbar
- Ctrl+Shift+C: Element inspector
- Ctrl+R: Hard refresh
- Ctrl+Shift+J: Console tab

---

## Troubleshooting

### Issue: Page won't load
**Solution**:
1. Check dev server is running
2. Check browser console for errors
3. Try hard refresh (Ctrl+Shift+R)
4. Clear browser cache

### Issue: No data showing
**Solution**:
1. Check database migrations applied
2. Check network tab for failed requests
3. Verify Supabase connection
4. Check authentication state

### Issue: Forms not submitting
**Solution**:
1. Check validation errors in console
2. Verify all required fields filled
3. Check network tab for request details
4. Verify user permissions

---

## Next Steps

After testing:

1. **Document Results**
   - Fill out test results template
   - Attach screenshots
   - List all issues found

2. **Prioritize Issues**
   - Critical: Blocks functionality
   - High: Major usability issue
   - Medium: Minor UX problem
   - Low: Nice to have

3. **Create Bug Reports**
   - Use issue template
   - Include steps to reproduce
   - Attach screenshots/console logs

4. **Retest After Fixes**
   - Run failed tests again
   - Verify fixes work
   - No regressions

---

**Happy Testing!**
