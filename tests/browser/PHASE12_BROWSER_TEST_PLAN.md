# Phase 12 Browser Test Plan

## Overview
Comprehensive browser testing plan for Phase 12 (Multi-Supplier Product Management) implementation.

## Test Environment
- **Browser**: Chrome/Edge (latest)
- **DevTools**: Console, Network, Elements
- **Test URL**: http://localhost:5173

---

## Test Suite 1: Admin Panel - Bugün Halde

### Test 1.1: Page Load
**URL**: `/admin/bugun-halde`

**Steps**:
1. Navigate to `/admin/bugun-halde`
2. Open DevTools Console tab
3. Open DevTools Network tab

**Expected Results**:
- ✅ Page loads without errors
- ✅ No console errors or warnings
- ✅ Network tab shows successful RPC calls:
  - `bugun_halde_comparison` view query
  - Category queries
- ✅ Summary cards display:
  - Karşılaştırılabilir Ürün count
  - Toplam Teklif count
  - Kategori count

**Console Checks**:
```javascript
// Check for React Query data
console.log('Grouped products:', window.__REACT_QUERY_CLIENT__?.getQueryData(['bugun-halde-grouped']))
```

---

### Test 1.2: Filter Functionality

**Steps**:
1. Click "Filtreler" button
2. Test Category filter:
   - Select a category from dropdown
   - Verify results update
3. Test Search filter:
   - Type product name in search box
   - Verify results filter
4. Test Min Suppliers filter:
   - Change "Min. Tedarikçi Sayısı" value
   - Verify results update
5. Test "Sadece en iyi fiyatlar" checkbox

**Expected Results**:
- ✅ Filter panel opens/closes smoothly
- ✅ Category dropdown shows available categories
- ✅ Search filters by product name (case-insensitive)
- ✅ Min Suppliers filters correctly (shows only products with N+ suppliers)
- ✅ Checkbox filters to show only lowest prices
- ✅ "Filtreleri Temizle" button resets all filters
- ✅ Results update reactively (no page reload)
- ✅ Loading states show during filter changes

**Network Monitoring**:
- Each filter change should trigger new query
- Query params should reflect filter values
- Response time < 500ms for local DB

---

### Test 1.3: ComparisonCard Display

**Steps**:
1. Find a product with multiple suppliers
2. Verify ComparisonCard renders correctly
3. Check price stats badges

**Expected Results**:
- ✅ Product image displays
- ✅ Product name and category visible
- ✅ Multiple supplier cards shown side-by-side
- ✅ Price stats badges:
  - Min. Fiyat (green badge)
  - Max. Fiyat (red badge)
  - Ortalama (gray badge)
- ✅ "En İyi Fiyat" badge on lowest price supplier
- ✅ "Öne Çıkan" badge visible if applicable
- ✅ Supplier info displays correctly:
  - Supplier name
  - Price
  - Stock status
  - Quality badge
  - Origin

**UI Validation**:
```javascript
// Check for ComparisonCard components
document.querySelectorAll('[class*="comparison"]').forEach(card => {
  console.log('Card found:', card.textContent)
})
```

---

### Test 1.4: Responsive Design

**Steps**:
1. Open Chrome DevTools Device Toolbar (Ctrl+Shift+M)
2. Test on mobile viewports:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)

**Expected Results**:
- ✅ Mobile (375px):
  - Summary cards stack vertically
  - Filter panel is full-width
  - ComparisonCard suppliers stack
  - Touch targets >= 44px
- ✅ Tablet (768px):
  - 2-column summary card grid
  - Filters in 2x2 grid
  - ComparisonCard readable
- ✅ Desktop (>1024px):
  - 3-column summary card grid
  - Filters in 4-column grid
  - Optimal spacing

---

## Test Suite 2: Admin Panel - Supplier Assignment

### Test 2.1: Products Page - Supplier Column

**URL**: `/admin/products`

**Steps**:
1. Navigate to `/admin/products`
2. Scroll to products table
3. Find "Tedarikçiler" column

**Expected Results**:
- ✅ "Tedarikçiler" column header visible
- ✅ Each product row has "Yönet" button with Users icon
- ✅ Button is clickable
- ✅ Badge shows supplier count in detail view

---

### Test 2.2: Supplier Assignment Dialog

**Steps**:
1. Click "Yönet" button on any product
2. Product detail dialog opens
3. Click "Tedarikçiler" tab
4. Click "Tedarikçi Ekle" button

**Expected Results**:
- ✅ Product detail dialog opens
- ✅ Two tabs visible: "Ürün Bilgileri" and "Tedarikçiler (X)"
- ✅ Suppliers tab shows:
  - Existing supplier cards (if any)
  - "Tedarikçi Ekle" button at top
  - Empty state if no suppliers
- ✅ "Tedarikçi Ekle" opens assignment dialog

---

### Test 2.3: Assignment Form Validation

**Steps**:
1. With assignment dialog open, test form validation:
   - Try to submit without selecting supplier
   - Enter negative price
   - Enter zero for min order quantity
   - Leave required fields empty

**Expected Results**:
- ✅ "Tedarikçi" field shows error when empty
- ✅ "Fiyat" field shows error for negative/zero values
- ✅ "Min. Sipariş Miktarı" shows error for zero/negative
- ✅ Form does NOT submit with errors
- ✅ Error messages are in Turkish
- ✅ Error messages are clear and specific

**Validation Rules**:
```javascript
// Required validations:
- supplier_id: required
- price: positive number
- stock_quantity: non-negative integer
- min_order_quantity: >= 1
- delivery_days: >= 1
- origin: min 2 characters
```

---

### Test 2.4: Supplier Selection

**Steps**:
1. Click "Tedarikçi" dropdown
2. Scroll through supplier list
3. Select a supplier

**Expected Results**:
- ✅ Dropdown shows only active suppliers
- ✅ Only approved suppliers shown
- ✅ Already assigned suppliers excluded
- ✅ Checkmark badge shows approval status
- ✅ ScrollArea works if list is long
- ✅ Selected supplier persists after close/reopen

---

### Test 2.5: Field Interactions

**Steps**:
1. Test all form fields:
   - Supplier dropdown
   - Price input
   - Stock quantity
   - Availability dropdown
   - Quality dropdown
   - Origin input
   - Min order quantity
   - Delivery days
   - Is Featured switch
   - Is Active switch

**Expected Results**:
- ✅ All fields accept input correctly
- ✅ Dropdowns show correct options:
  - Availability: Bol, Sınırlı, Son Stok
  - Quality: Premium, Standart, Ekonomik
- ✅ Switches toggle correctly
- ✅ Number inputs validate min/max
- ✅ Form state persists during interaction

---

### Test 2.6: Submit Flow (UI Only)

**Steps**:
1. Fill form with valid data
2. Click "Ekle" button
3. Observe button state
4. **Do NOT actually submit** - just check UI behavior

**Expected Results**:
- ✅ "Ekle" button shows Check icon
- ✅ Button shows loading spinner when clicked
- ✅ Button disabled during submission
- ✅ "İptal" button available to close
- ✅ Form resets after successful submit (if testing with real data)
- ✅ Dialog closes after success (if testing with real data)
- ✅ Success toast/notification shows (if testing with real data)

**Note**: This test focuses on UI behavior only. Actual database submission is optional.

---

## Test Suite 3: Supplier Panel - Variations

### Test 3.1: Supplier Products Page

**URL**: `/tedarikci/urunler`

**Steps**:
1. Login as supplier (or use existing supplier account)
2. Navigate to `/tedarikci/urunler`
3. Verify product cards display

**Expected Results**:
- ✅ Page loads without errors
- ✅ Product grid displays
- ✅ Each product shows:
  - Product image
  - Product name
  - Category
  - Price
  - Stock status
  - **Variation tags** (new in Phase 12)
- ✅ Mobile-responsive layout

---

### Test 3.2: VariationSelector Component

**Steps**:
1. Navigate to product edit page: `/tedarikci/urunler/{id}/duzenle`
2. Find "Varyasyon Ekle" button
3. Click button to open popover
4. Test variation type selection
5. Test common value selection
6. Test custom value input

**Expected Results**:
- ✅ "Varyasyon Ekle" button visible and clickable
- ✅ Popover opens on click
- ✅ Variation type dropdown shows:
  - Büyüklük (size)
  - Tür (type)
  - Koku (scent)
  - Paketleme (packaging)
  - Malzeme (material)
  - Aroma (flavor)
  - Diğer (other)
- ✅ Common values display based on selected type
- ✅ "Özel değer ekle" button shows custom input
- ✅ Custom input field accepts text
- ✅ Enter key submits custom value
- ✅ Popover closes after selection

---

### Test 3.3: VariationTag Display

**Steps**:
1. On product card or edit page
2. Find variation tags
3. Verify color coding
4. Check truncation for long lists

**Expected Results**:
- ✅ Variation tags display with correct colors:
  - Size: Blue (#3B82F6)
  - Type: Purple (#8B5CF6)
  - Scent: Pink (#EC4899)
  - Packaging: Orange (#F97316)
  - Material: Green (#10B981)
  - Flavor: Yellow (#EAB308)
  - Other: Gray (#6B7280)
- ✅ Tag shows both type and value (if showType=true)
- ✅ Tags are clickable for removal (on edit page)
- ✅ Long tag lists truncate with "+N" badge
- ✅ Hover effects work

**Color Verification**:
```css
/* Expected tag colors */
.variation-tag.size { background: #3B82F6; }
.variation-tag.type { background: #8B5CF6; }
.variation-tag.scent { background: #EC4899; }
.variation-tag.packaging { background: #F97316; }
.variation-tag.material { background: #10B981; }
.variation-tag.flavor { background: #EAB308; }
.variation-tag.other { background: #6B7280; }
```

---

### Test 3.4: VariationList Component

**Steps**:
1. On product detail/edit page
2. Find grouped variations list
3. Verify grouping by type

**Expected Results**:
- ✅ Variations grouped by type
- ✅ Each group shows:
  - Type label (e.g., "Büyüklük")
  - List of values
  - Remove buttons for each value
- ✅ Group order matches VARIATION_TYPES array
- ✅ Empty state displays if no variations
- ✅ UI is responsive on mobile

---

## Test Suite 4: Excel Import with Variations

### Test 4.1: Import Modal

**Steps**:
1. On supplier products page
2. Click "İçe Aktar" button
3. Verify import modal opens

**Expected Results**:
- ✅ Import modal opens
- ✅ File upload area visible
- ✅ Download template link available
- ✅ Drag & drop zone works
- ✅ File validation works

---

### Test 4.2: Variation Extraction from Excel

**Steps**:
1. Prepare Excel file with variation data
2. Format: Column with variation string like "Büyüklük:4 LT, Tür:BEYAZ"
3. Upload file
4. Check preview

**Expected Results**:
- ✅ Excel parser extracts variation strings correctly
- ✅ Variations parsed into type-value pairs
- ✅ Preview shows extracted variations:
  - Type: Büyüklük, Value: 4 LT
  - Type: Tür, Value: BEYAZ
- ✅ Invalid variations show errors
- ✅ Duplicate values are skipped
- ✅ Preview allows editing before import

---

### Test 4.3: Import Confirmation

**Steps**:
1. After preview shows correct data
2. Click "İçe Aktar" button
3. Monitor progress

**Expected Results**:
- ✅ Progress indicator shows
- ✅ Success message displays
- ✅ Product list updates
- ✅ New variations visible on product cards
- ✅ No console errors during import

---

## Test Suite 5: Error Handling

### Test 5.1: Network Errors

**Steps**:
1. Open DevTools Network tab
2. Throttle network to "Offline"
3. Try to load pages
4. Restore network
5. Try again

**Expected Results**:
- ✅ App shows error state
- ✅ Retry mechanism works
- ✅ No white screen of death
- ✅ User-friendly error messages

---

### Test 5.2: Validation Errors

**Steps**:
1. Submit forms with invalid data
2. Check error messages

**Expected Results**:
- ✅ Field-level errors show
- ✅ Error messages are clear
- ✅ Error messages in Turkish
- ✅ Form prevents submission

---

### Test 5.3: Empty States

**Steps**:
1. Navigate to pages with no data
2. Check empty states

**Expected Results**:
- ✅ Bugün Halde: "Henüz birden fazla tedarikçisi olan ürün yok"
- ✅ Products: "Henüz ürün eklenmemiş"
- ✅ Suppliers: "Henüz tedarikçi atanmamış"
- ✅ Appropriate icons display
- ✅ Call-to-action buttons shown

---

## Test Suite 6: Performance

### Test 6.1: Load Time

**Steps**:
1. Open DevTools Performance tab
2. Record page load
3. Analyze metrics

**Expected Results**:
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Largest Contentful Paint < 2.5s
- ✅ No long tasks (>50ms)

---

### Test 6.2: React Query Performance

**Steps**:
1. Monitor React Query DevTools
2. Check cache behavior
3. Verify refetch intervals

**Expected Results**:
- ✅ Data cached properly
- ✅ Stale time configured (2-5 min)
- ✅ Refetch on window focus
- ✅ Optimistic updates work

---

## Test Suite 7: Accessibility

### Test 7.1: Keyboard Navigation

**Steps**:
1. Navigate pages using Tab key
2. Verify focus order
3. Test Enter/Space on buttons

**Expected Results**:
- ✅ Logical tab order
- ✅ Visible focus indicators
- ✅ All features accessible via keyboard
- ✅ No keyboard traps

---

### Test 7.2: Screen Reader

**Steps**:
1. Enable screen reader (NVDA/VoiceOver)
2. Navigate pages
3. Verify labels and announcements

**Expected Results**:
- ✅ All images have alt text
- ✅ Buttons labeled correctly
- ✅ Form fields have labels
- ✅ Errors announced
- ✅ State changes announced

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Dev server running: `npm run dev`
- [ ] Database migrations applied
- [ ] Test data seeded
- [ ] Admin account ready
- [ ] Supplier account ready

### Execute Tests
- [ ] Test Suite 1: Bugün Halde (1.1-1.4)
- [ ] Test Suite 2: Supplier Assignment (2.1-2.6)
- [ ] Test Suite 3: Variations (3.1-3.4)
- [ ] Test Suite 4: Excel Import (4.1-4.3)
- [ ] Test Suite 5: Error Handling (5.1-5.3)
- [ ] Test Suite 6: Performance (6.1-6.2)
- [ ] Test Suite 7: Accessibility (7.1-7.2)

### Post-Test
- [ ] Collect console logs
- [ ] Collect screenshots
- [ ] Document issues
- [ ] Create bug reports for failures

---

## Test Report Template

```markdown
## Browser Test Results - Phase 12

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [Browser/OS]
**Dev Server**: http://localhost:5173

### Test Suite 1: Bugün Halde

| Test ID | Test Name | Status | Notes | Screenshot |
|---------|-----------|--------|-------|------------|
| 1.1 | Page Load | ✅/❌ | | |
| 1.2 | Filter Functionality | ✅/❌ | | |
| 1.3 | ComparisonCard Display | ✅/❌ | | |
| 1.4 | Responsive Design | ✅/❌ | | |

### Test Suite 2: Supplier Assignment

| Test ID | Test Name | Status | Notes | Screenshot |
|---------|-----------|--------|-------|------------|
| 2.1 | Supplier Column | ✅/❌ | | |
| 2.2 | Assignment Dialog | ✅/❌ | | |
| 2.3 | Form Validation | ✅/❌ | | |
| 2.4 | Supplier Selection | ✅/❌ | | |
| 2.5 | Field Interactions | ✅/❌ | | |
| 2.6 | Submit Flow | ✅/❌ | | |

### Test Suite 3: Variations

| Test ID | Test Name | Status | Notes | Screenshot |
|---------|-----------|--------|-------|------------|
| 3.1 | Products Page | ✅/❌ | | |
| 3.2 | VariationSelector | ✅/❌ | | |
| 3.3 | VariationTag Colors | ✅/❌ | | |
| 3.4 | VariationList | ✅/❌ | | |

### Test Suite 4: Excel Import

| Test ID | Test Name | Status | Notes | Screenshot |
|---------|-----------|--------|-------|------------|
| 4.1 | Import Modal | ✅/❌ | | |
| 4.2 | Variation Extraction | ✅/❌ | | |
| 4.3 | Import Confirmation | ✅/❌ | | |

### Summary

- **Total Tests**: X
- **Passed**: Y
- **Failed**: Z
- **Pass Rate**: (Y/X * 100)%

### Issues Found

1. **[Severity]** Issue Title
   - Location: [Component/Page]
   - Description: [What's wrong]
   - Steps to Reproduce: [How to trigger]
   - Expected: [What should happen]
   - Screenshot: [if applicable]

### Console Errors

```javascript
// List any console errors found
```

### Network Issues

```javascript
// List any failed requests or slow responses
```

### Recommendations

[Improvement suggestions]
```

---

## Quick Test Commands

```javascript
// Console: Check React Query state
window.__REACT_QUERY_CLIENT__?.getQueryCache().getAll().forEach(q => {
  console.log('Query:', q.queryKey, 'State:', q.state.status)
})

// Console: Check for errors
console.error('Test for errors')

// Console: Check viewport
console.log('Viewport:', window.innerWidth, 'x', window.innerHeight)

// Console: Force refetch
window.__REACT_QUERY_CLIENT__?.refetchQueries(['bugun-halde'])
```

---

## Success Criteria

Phase 12 is considered **READY FOR PRODUCTION** when:

- ✅ All critical tests pass (100%)
- ✅ No blocking bugs
- ✅ Console is clean (no errors)
- ✅ All features work as specified
- ✅ Responsive design verified
- ✅ Performance metrics met
- ✅ Accessibility baseline met

---

**Document Version**: 1.0
**Last Updated**: 2025-01-09
**Test Phase**: Phase 12 - Multi-Supplier Product Management
