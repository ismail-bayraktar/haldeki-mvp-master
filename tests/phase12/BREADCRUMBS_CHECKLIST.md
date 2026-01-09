# Breadcrumbs Navigation Manual Test Checklist
## Phase 12 Completion - Sprint 2

### Test Environment
- [ ] Test environment setup complete
- [ ] Admin user account ready
- [ ] Browser DevTools available

### Test 1: Admin Dashboard - "/" to "/admin"
**Steps:**
1. Navigate to `/admin`
2. Check page header area

**Expected Results:**
- [ ] Breadcrumb visible: "Ana Sayfa > Dashboard"
- [ ] "Dashboard" is current page (bold, no link)
- [ ] "Ana Sayfa" is clickable link to `/`
- [ ] Home icon visible

### Test 2: Products Page - "/admin/products"
**Steps:**
1. Navigate to `/admin/products`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Ürünler"
- [ ] "Ürünler" is current page (not clickable)
- [ ] Home icon visible

### Test 3: Products Edit - "/admin/products/123/edit"
**Steps:**
1. Navigate to `/admin/products`
2. Click on any product to edit
3. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Ürünler > Düzenle"
- [ ] "Ürünler" is clickable (links to `/admin/products`)
- [ ] "Düzenle" is current page (not clickable)

### Test 4: Orders Page - "/admin/orders"
**Steps:**
1. Navigate to `/admin/orders`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Siparişler"
- [ ] "Siparişler" is current page
- [ ] Navigation works

### Test 5: Orders Edit - "/admin/orders/456/edit"
**Steps:**
1. From Orders page, click any order
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Siparişler > Düzenle"
- [ ] "Siparişler" clickable back link
- [ ] "Düzenle" is current page

### Test 6: Users Page - "/admin/users"
**Steps:**
1. Navigate to `/admin/users`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Kullanıcılar"
- [ ] Displayed correctly

### Test 7: Suppliers Page - "/admin/suppliers"
**Steps:**
1. Navigate to `/admin/suppliers`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Tedarikçiler"
- [ ] Displayed correctly

### Test 8: Businesses Page - "/admin/businesses"
**Steps:**
1. Navigate to `/admin/businesses`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > İşletmeler"
- [ ] Displayed correctly

### Test 9: Dealers Page - "/admin/dealers"
**Steps:**
1. Navigate to `/admin/dealers`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Bayiler"
- [ ] Displayed correctly

### Test 10: Region Products - "/admin/region-products"
**Steps:**
1. Navigate to `/admin/region-products`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Bölge Ürünleri"
- [ ] Displayed correctly

### Test 11: Supplier Offers - "/admin/supplier-offers"
**Steps:**
1. Navigate to `/admin/supplier-offers`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Tedarikçi Teklifleri"
- [ ] Displayed correctly

### Test 12: Warehouse Staff - "/admin/warehouse-staff"
**Steps:**
1. Navigate to `/admin/warehouse-staff`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Depo Personeli"
- [ ] Displayed correctly

### Test 13: Bugün Halde - "/admin/bugun-halde"
**Steps:**
1. Navigate to `/admin/bugun-halde`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Bugün Halde"
- [ ] Displayed correctly

### Test 14: Settings - "/admin/settings"
**Steps:**
1. Navigate to `/admin/settings`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Ayarlar"
- [ ] Displayed correctly

### Test 15: Click Breadcrumb → Navigate
**Steps:**
1. Navigate to `/admin/products/123/edit`
2. Click "Ürünler" breadcrumb
3. Check navigation

**Expected Results:**
- [ ] Navigates to `/admin/products`
- [ ] Page updates correctly
- [ ] URL changes to `/admin/products`

### Test 16: Click Home Icon → Navigate
**Steps:**
1. From any admin page
2. Click home icon in breadcrumbs
3. Check navigation

**Expected Results:**
- [ ] Navigates to `/` (home page)
- [ ] Or to configured homeHref

### Test 17: Breadcrumb Truncation
**Steps:**
1. Navigate to a deep nested page
2. Check long breadcrumb labels

**Expected Results:**
- [ ] Long labels truncated with ellipsis
- [ ] Hover shows full label
- [ ] Max-width respected (200px)

### Test 18: All 11 Pages Show Breadcrumbs
**Steps:**
1. Go through each admin page
2. Verify breadcrumbs visible

**Expected Results:**
- [ ] `/admin` - ✓
- [ ] `/admin/products` - ✓
- [ ] `/admin/orders` - ✓
- [ ] `/admin/users` - ✓
- [ ] `/admin/suppliers` - ✓
- [ ] `/admin/businesses` - ✓
- [ ] `/admin/dealers` - ✓
- [ ] `/admin/region-products` - ✓
- [ ] `/admin/supplier-offers` - ✓
- [ ] `/admin/warehouse-staff` - ✓
- [ ] `/admin/bugun-halde` - ✓
- [ ] `/admin/settings` - ✓

### Test 19: Breadcrumb Icons
**Steps:**
1. Check each breadcrumb item
2. Verify icons render

**Expected Results:**
- [ ] Home icon visible on "Ana Sayfa"
- [ ] Chevron separators between items
- [ ] Icons properly sized (h-4 w-4)
- [ ] No icon overlap or overflow

### Test 20: Breadcrumb Styling
**Steps:**
1. Inspect breadcrumb elements
2. Check CSS classes

**Expected Results:**
- [ ] Current page: `text-foreground font-medium`
- [ ] Clickable: `text-muted-foreground hover:text-foreground`
- [ ] Hover transition effect
- [ ] Responsive layout

### Test 21: Mobile Responsive
**Steps:**
1. Resize browser to mobile width (< 768px)
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumbs still visible
- [ ] Long labels truncated appropriately
- [ ] No horizontal scroll
- [ ] Touch-friendly tap targets

### Test 22: Dynamic Routes with IDs
**Steps:**
1. Navigate to `/admin/products/abc-123-def/edit`
2. Check breadcrumbs

**Expected Results:**
- [ ] ID not shown in breadcrumb
- [ ] Shows: "Ana Sayfa > Ürünler > Düzenle"
- [ ] Click "Ürünler" returns to list

### Test 23: Create New Product
**Steps:**
1. Navigate to `/admin/products/create`
2. Check breadcrumbs

**Expected Results:**
- [ ] Breadcrumb: "Ana Sayfa > Ürünler > Yeni Oluştur"
- [ ] "Ürünler" clickable
- [ ] "Yeni Oluştur" is current page

### Test 24: Breadcrumb Accessibility
**Steps:**
1. Check HTML structure
2. Test with screen reader

**Expected Results:**
- [ ] `<nav>` with `aria-label="Breadcrumb"`
- [ ] Current page has `aria-current="page"`
- [ ] Keyboard navigation works (Tab through)

### Test 25: Deep Nested Routes
**Steps:**
1. Navigate to complex route if exists
2. Check breadcrumb depth

**Expected Results:**
- [ ] All levels shown
- [ ] Proper separators
- [ ] Navigation works at any level

---

## Test Summary

### Pass/Fail Status
- [ ] All tests passed
- [ ] All 11 pages verified
- [ ] Navigation works correctly

### Issues Found
1. ___________
2. ___________
3. ___________

### Pages Missing Breadcrumbs
- [ ] None (all covered)
- Or list: ___________

### Notes
- ___________
- ___________
- ___________

### Tester Signature
- Name: ___________
- Date: ___________
- Browser: ___________
