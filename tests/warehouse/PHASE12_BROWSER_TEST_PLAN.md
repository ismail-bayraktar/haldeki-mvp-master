# Phase 12 Browser Test Plan

**Dev Server:** http://localhost:8083
**Date:** 2025-01-10

---

## Pre-Test Setup

1. **Open Browser:** Navigate to http://localhost:8083
2. **Login:** Use admin credentials
3. **Open DevTools:**
   - Press F12 (Chrome/Edge) or Ctrl+Shift+I
   - Go to Console tab
   - Go to Network tab

---

## Test Case 1: Admin Bugün Halde Page

### URL
```
http://localhost:8083/admin/bugun-halde
```

### Expected Behavior

#### 1. Page Load
- [ ] Page loads without white screen
- [ ] No console errors (red text)
- [ ] Loading spinner appears briefly
- [ ] Product cards render after data fetch

#### 2. Data Display
- [ ] Products show in grid/list layout
- [ ] Each product shows:
  - Product name
  - Product image
  - Multiple supplier cards (if applicable)
  - Price comparison badges

#### 3. Price Statistics Badges
For each product, check if badges show:
- [ ] "En Düşük: XX TL" (green badge)
- [ ] "En Yüksek: XX TL" (red badge)
- [ ] "Ortalama: XX TL" (blue badge)
- [ ] "X Tedarikçi" count badge

#### 4. Supplier Cards
Each supplier card should display:
- [ ] Supplier name
- [ ] Supplier price (prominent)
- [ ] Availability status (plenty/limited/last)
- [ ] Quality grade (premium/standart/ekonomik)
- [ ] Delivery days
- [ ] "En Düşük Fiyat" badge if applicable

#### 5. Filters
Test each filter:
- [ ] **Search:** Type product name, results filter in real-time
- [ ] **Category:** Dropdown shows categories, selection filters
- [ ] **Price Range:** Min/Max inputs work
- [ ] **Min Suppliers:** Input defaults to 2, changing updates results
- [ ] **Availability:** Dropdown filters by stock status
- [ ] **Quality:** Dropdown filters by grade
- [ ] **"Sadece En İyi"** toggle: Shows only lowest price options
- [ ] **"Öne Çıkanlar"** toggle: Shows only featured products
- [ ] **Clear Filters:** Resets all filters to defaults

#### 6. Network Requests
In Network tab, check for:
- [ ] Request to `bugun_halde_comparison` view
- [ ] Response 200 OK
- [ ] Response contains JSON data with products
- [ ] No failed requests (red status codes)

---

## Test Case 2: Admin Products Page (Supplier Assignment)

### URL
```
http://localhost:8083/admin/products
```

### Expected Behavior

#### 1. Product List
- [ ] Products load in table/grid
- [ ] Each product shows current suppliers count
- [ ] "Tedarikçi Ata" button visible

#### 2. Supplier Assignment
- [ ] Click "Tedarikçi Ata" on a product
- [ ] Dialog opens with:
  - Supplier list
  - Price input
  - Stock quantity input
  - Availability dropdown
  - Quality grade selector
  - Delivery days input

#### 3. Assignment Action
- [ ] Select supplier from dropdown
- [ ] Enter price (e.g., 50.00)
- [ ] Enter stock quantity
- [ ] Select availability
- [ ] Click "Kaydet"
- [ ] Success message appears
- [ ] Dialog closes
- [ ] Product card updates with new supplier count

---

## Test Case 3: Supplier Products Page

### URL
```
http://localhost:8083/tedarikci/urunler
```

### Expected Behavior

#### 1. Product Catalog
- [ ] Products load in grid layout
- [ ] Each product shows:
  - Product name
  - Current price
  - Stock quantity
  - Availability badge

#### 2. Product Variations
- [ ] Variation tags appear below product name
- [ ] Size variations (e.g., "1 KG") in blue badges
- [ ] Type variations (e.g., "BEYAZ") in purple badges
- [ ] Multiple variations can show on same product

#### 3. Edit Functionality
- [ ] Click product card
- [ ] Edit panel/dialog opens
- [ ] Can modify price
- [ ] Can update stock quantity
- [ ] Can change availability
- [ ] Save updates product card

---

## Console Error Checklist

**Check for these errors (should NOT appear):**

❌ `relation "bugun_halde_comparison" does not exist`
❌ `column "xyz" does not exist`
❌ `permission denied for table supplier_products`
❌ `invalid input value for enum`
❌ `Network request failed`
❌ `500 Internal Server Error`

**Acceptable warnings:**
⚠️ React warnings (if any)
⚠️ Deprecated API warnings (non-blocking)

---

## Success Criteria

### Critical (Must Pass)
- ✅ No blocking errors in console
- ✅ Bugün Halde page loads and displays data
- ✅ Price statistics calculate correctly
- ✅ Filters work without errors

### Important (Should Pass)
- ✅ UI renders correctly (no layout issues)
- ✅ Supplier assignment dialog works
- ✅ Variation badges display with correct colors

### Nice to Have
- ✅ Smooth animations
- ✅ Responsive design on mobile
- ✅ Empty states show helpful messages

---

## Test Results Template

```
### Test Case 1: Bugün Halde Page
Status: ✅ PASS / ❌ FAIL
Notes:
- [List any issues found]
- [Console errors if any]

### Test Case 2: Products Page
Status: ✅ PASS / ❌ FAIL
Notes:
- [List any issues found]

### Test Case 3: Supplier Products Page
Status: ✅ PASS / ❌ FAIL
Notes:
- [List any issues found]

### Overall Assessment
Phase 12 Browser Testing: ✅ READY FOR PRODUCTION / ❌ NEEDS FIXES

Critical Issues: [List]
Minor Issues: [List]
```

---

## Quick Smoke Test (5 minutes)

If time is limited, run this quick test:

1. Open http://localhost:8083/admin/bugun-halde
2. Verify page loads without errors
3. Check console is clean (no red errors)
4. Verify at least 1 product shows with supplier pricing
5. Try search filter - type any product name
6. Verify results filter correctly
7. **PASS** if all above ✅

---

**Generated for:** Phase 12 Deployment
**Test Engineer:** Maestro AI Test Agent
