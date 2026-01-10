# Beta Testing Guide - Haldeki Market

> Complete guide for beta testing the Haldeki Market platform
> Last Updated: 2026-01-09
> Status: Ready for Testing

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Test Setup](#pre-test-setup)
3. [SuperAdmin Testing](#superadmin-testing)
4. [Supplier Testing](#supplier-testing)
5. [Customer Testing](#customer-testing)
6. [Testing Checklist](#testing-checklist)
7. [Issue Reporting](#issue-reporting)
8. [Known Issues](#known-issues)

---

## Overview

### What is Beta Testing?

Beta testing is the final testing phase before public launch. Real users test the system to find bugs, usability issues, and validate business flows.

### Testing Goals

**Primary Goals:**
- Validate core business flows work correctly
- Identify critical bugs affecting users
- Test user experience and usability
- Verify performance under load
- Document all issues for fixing

**Success Criteria:**
- All critical flows working (user creation, ordering, supplier management)
- No critical bugs blocking launch
- Performance acceptable (<3s page loads)
- Security measures validated

### Testing Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| Alpha (Internal) | 3 days | Core functionality |
| Beta (Selected users) | 7 days | Real-world usage |
| Beta (Public) | 14 days | Load testing, feedback |

---

## Pre-Test Setup

### Step 1: Environment Preparation

**Required:**
- [ ] Computer or mobile device
- [ ] Modern browser (Chrome, Firefox, Safari, Edge)
- [ ] Stable internet connection
- [ ] Test account credentials (see SuperAdmin Credentials)

**Recommended:**
- [ ] Multiple devices (desktop, tablet, mobile)
- [ ] Multiple browsers for cross-browser testing
- [ ] Screen recording tool (Loom, OBS)
- [ ] Note-taking tool (Notion, Google Docs)

### Step 2: Browser Setup

**For accurate testing:**

1. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E

2. **Disable extensions:**
   - Ad blockers (may interfere)
   - Password managers (use manual entry)
   - VPN (test with and without)

3. **Open DevTools:**
   - Press F12 or Ctrl+Shift+I
   - Go to Console tab
   - Keep open to spot errors

### Step 3: Test Data Preparation

**Prepare test data:**

- [ ] Test email addresses (use + notation)
- [ ] Test phone numbers
- [ ] Test product data
- [ ] Test addresses for delivery
- [ ] Payment method (test mode)

---

## SuperAdmin Testing

### Login Test

**Test Case: SA-001 - SuperAdmin Login**

**Steps:**
1. Navigate to: `https://haldeki-market.vercel.app`
2. Click "Login" button (top right)
3. Enter email: `admin@haldeki.com`
4. Enter password: `hws8WadKktlvvjO8`
5. Click "Sign In"

**Expected Result:**
- Login successful
- Redirected to home page
- Business Panel link visible in navigation
- User menu shows "SuperAdmin" role

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

### User Creation Test

**Test Case: SA-002 - Create Supplier User**

**Steps:**
1. Login as SuperAdmin
2. Navigate to: Business Panel → Users
3. Click "Create User" button
4. Fill in form:
   - Email: `test-supplier@haldeki.com`
   - Name: `Test Supplier`
   - Role: Select "Supplier"
   - Password: Enter secure password
5. Click "Create"

**Expected Result:**
- User created successfully
- Success message displayed
- User appears in users list
- User receives email notification

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

**Test Case: SA-003 - Create Customer User**

**Steps:**
1. Navigate to: Business Panel → Users
2. Click "Create User"
3. Fill in form:
   - Email: `test-customer@haldeki.com`
   - Name: `Test Customer`
   - Role: Select "Customer"
   - Password: Enter secure password
4. Click "Create"

**Expected Result:**
- Customer created successfully
- Appears in customer list
- Can login with credentials

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

### Supplier Approval Test

**Test Case: SA-004 - Approve Supplier Application**

**Steps:**
1. Create a new supplier user (see SA-002)
2. Navigate to: Business Panel → Suppliers
3. Find supplier in "Pending" list
4. Click on supplier to view details
5. Click "Approve" button
6. Confirm approval

**Expected Result:**
- Supplier status changes to "Active"
- Supplier moved to "Active" list
- Supplier receives notification
- Supplier can now access Supplier Panel

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

### Business Panel Navigation Test

**Test Case: SA-005 - Navigate Business Panel**

**Steps:**
1. Login as SuperAdmin
2. Click "Business Panel" in navigation
3. Test all menu items:
   - Dashboard
   - Users
   - Suppliers
   - Products
   - Orders
   - Audit Logs
4. Verify each page loads correctly

**Expected Result:**
- All pages load without errors
- No console errors in DevTools
- Page load time <3 seconds
- Data displays correctly

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

## Supplier Testing

### Supplier Login Test

**Test Case: SP-001 - Supplier Login**

**Prerequisites:**
- Supplier account created and approved by SuperAdmin

**Steps:**
1. Navigate to: `https://haldeki-market.vercel.app`
2. Click "Login"
3. Enter supplier email (from SuperAdmin)
4. Enter supplier password
5. Click "Sign In"

**Expected Result:**
- Login successful
- Supplier Panel link visible
- User menu shows "Supplier" role
- Can access supplier features

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

### Product Price Update Test

**Test Case: SP-002 - Update Product Price**

**Steps:**
1. Login as Supplier
2. Navigate to: Supplier Panel → Products
3. Click on product to edit
4. Update price field:
   - Old price: 100.00
   - New price: 125.50
5. Click "Save"
6. Verify price changed in list

**Expected Result:**
- Price saved successfully
- Success message displayed
- List view shows new price
- Audit log records change

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

**Test Case: SP-003 - Verify Price Update as Customer**

**Steps:**
1. Logout as Supplier
2. Login as Customer (or browse as guest)
3. Navigate to Products page
4. Find updated product
5. Verify new price is displayed

**Expected Result:**
- New price displayed on product card
- New price shown in product detail
- Old price not displayed anywhere

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

### Product Import Test

**Test Case: SP-004 - Import Products**

**Steps:**
1. Login as Supplier
2. Navigate to: Supplier Panel → Products
3. Click "Import Products"
4. Download template
5. Fill in product data:
   - Product name
   - SKU
   - Price
   - Stock quantity
   - Category
6. Upload filled CSV
7. Click "Import"

**Expected Result:**
- Import process starts
- Progress indicator shows
- Products created in database
- Success message displayed
- Products appear in list

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

### Product Export Test

**Test Case: SP-005 - Export Products**

**Steps:**
1. Login as Supplier
2. Navigate to: Supplier Panel → Products
3. Click "Export Products"
4. Wait for export to complete
5. Download CSV file
6. Open file in spreadsheet app

**Expected Result:**
- Export process completes
- CSV file downloads
- File contains all products
- Data format correct
- No missing products

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

## Customer Testing

### Customer Registration Test

**Test Case: CU-001 - Customer Registration**

**Steps:**
1. Navigate to: `https://haldeki-market.vercel.app`
2. Click "Register" button
3. Fill in registration form:
   - Email: `test-customer+1@haldeki.com`
   - Password: Enter secure password
   - Name: `Test Customer One`
   - Phone: Optional
4. Click "Register"
5. Verify email (if required)

**Expected Result:**
- Registration successful
- Email verification sent (if enabled)
- Logged in automatically
- Redirected to home page
- Welcome message displayed

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

### Browse Products Test

**Test Case: CU-002 - Browse Products**

**Steps:**
1. Login as Customer (or browse as guest)
2. Navigate to: Products page
3. Test filters:
   - Category filter
   - Price range
   - Supplier filter
   - Search bar
4. Click on product to view details

**Expected Result:**
- Products display correctly
- Filters work properly
- Search returns relevant results
- Product detail page loads
- All information visible

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

### Add to Cart Test

**Test Case: CU-003 - Add Product to Cart**

**Steps:**
1. Navigate to Products page
2. Select a product
3. Click "Add to Cart"
4. Verify cart icon updates
5. Click cart icon to view cart
6. Verify product in cart

**Expected Result:**
- Product added to cart
- Cart count increases
- Cart page shows product
- Quantity is 1
- Price is correct

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

### Checkout Test

**Test Case: CU-004 - Complete Checkout**

**Steps:**
1. Add products to cart
2. Click "Checkout"
3. Fill in delivery information:
   - Address
   - Phone
   - Delivery time slot
4. Select payment method
5. Review order
6. Click "Place Order"

**Expected Result:**
- Order created successfully
- Order confirmation displayed
- Order number generated
- Email confirmation sent
- Cart cleared

**Actual Result:** ___________________

**Status:** [ ] Pass [ ] Fail

**Notes:** ___________________

---

## Testing Checklist

### Critical Path Testing

**Must complete before launch:**

**SuperAdmin:**
- [ ] Login successful
- [ ] Create supplier user
- [ ] Create customer user
- [ ] Approve supplier application
- [ ] View all products
- [ ] View all orders
- [ ] Access audit logs

**Supplier:**
- [ ] Login successful
- [ ] Update product price
- [ ] Create new product
- [ ] Import products from CSV
- [ ] Export products to CSV
- [ ] View orders from customers

**Customer:**
- [ ] Register new account
- [ ] Browse products
- [ ] Search products
- [ ] Add to cart
- [ ] Checkout
- [ ] View order history

---

### Cross-Browser Testing

**Test in multiple browsers:**

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (macOS/iOS)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

**For each browser:**
- [ ] Login works
- [ ] Pages load correctly
- [ ] No console errors
- [ ] UI looks correct

---

### Device Testing

**Test on multiple devices:**

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (iPad)
- [ ] Mobile phone (iPhone)
- [ ] Mobile phone (Android)

**For each device:**
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Navigation is usable
- [ ] Text is readable

---

### Performance Testing

**Measure and record:**

- [ ] Page load time (home page): ____ seconds
- [ ] Page load time (products page): ____ seconds
- [ ] Page load time (product detail): ____ seconds
- [ ] Time to complete checkout: ____ seconds
- [ ] API response time: ____ milliseconds

**Performance targets:**
- Page load: <3 seconds
- API response: <500ms
- Checkout: <30 seconds

---

### Security Testing

**Validate security measures:**

- [ ] Login requires correct credentials
- [ ] Failed login shows error message
- [ ] Account locks after 3 failed attempts
- [ ] Cannot access Business Panel without SuperAdmin role
- [ ] Cannot access Supplier Panel without Supplier role
- [ ] Cannot view other users' orders
- [ ] Cannot modify other users' data
- [ ] Password input is masked
- [ ] HTTPS is enforced

---

## Issue Reporting

### How to Report Issues

**For each issue found, document:**

1. **Issue Title:** Brief description
2. **Severity:** Critical / High / Medium / Low
3. **Steps to Reproduce:** Exact steps
4. **Expected Result:** What should happen
5. **Actual Result:** What actually happened
6. **Environment:** Browser, device, OS
7. **Screenshots:** If applicable
8. **Console Errors:** Copy from DevTools

### Issue Severity Levels

**Critical - Blocks launch:**
- Login doesn't work
- Checkout doesn't work
- Data loss
- Security breach
- System crash

**High - Major impact:**
- Key feature broken
- Performance severely degraded
- UI completely broken
- Data corruption possible

**Medium - Moderate impact:**
- Non-critical feature broken
- Performance somewhat degraded
- UI partially broken
- Workaround exists

**Low - Minor impact:**
- Cosmetic issue
- Typo/grammar
- Minor inconvenience
- Nice-to-have improvement

### Issue Report Template

```markdown
## Issue Title: [Brief description]

**Severity:** [Critical / High / Medium / Low]
**Reporter:** [Your name]
**Date:** [YYYY-MM-DD]

### Steps to Reproduce
1.
2.
3.

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Environment
- Browser: [Chrome 120, Firefox 121, etc.]
- Device: [Desktop, iPhone, etc.]
- OS: [Windows 11, macOS Sonoma, iOS 17, etc.]
- Screen Size: [1920x1080, 375x812, etc.]

### Screenshots
[Attach screenshots]

### Console Errors
```
[Paste console errors here]
```

### Additional Notes
[Any other relevant information]
```

---

## Known Issues

### Current Known Issues

**Variation System Issue**
- **Description:** Varyasyon sistemi (variation system) has issues
- **Status:** Documented, not yet fixed
- **Impact:** Medium - affects product variations
- **Workaround:** Avoid complex product variations for now
- **Reference:** See dipnot (footnote) in project documentation

**Test Account Cleanup**
- **Description:** Old test accounts need deletion
- **Status:** Scripts ready, not yet executed
- **Impact:** Low - test data in database
- **Action:** Run cleanup scripts before launch

### Resolved Issues

*(Add resolved issues here as they are fixed)*

---

## Testing Schedule

### Week 1: Internal Testing

| Day | Focus | Tester |
|-----|-------|--------|
| Day 1 | SuperAdmin flows | Internal team |
| Day 2 | Supplier flows | Internal team |
| Day 3 | Customer flows | Internal team |
| Day 4 | Integration testing | Internal team |
| Day 5 | Bug fixing | Dev team |

### Week 2: Beta Testing

| Day | Focus | Tester |
|-----|-------|--------|
| Day 1-2 | Supplier testing | Selected suppliers |
| Day 3-4 | Customer testing | Selected customers |
| Day 5 | Feedback review | Product team |
| Day 6-7 | Bug fixing | Dev team |

### Week 3: Launch Preparation

| Day | Focus | Status |
|-----|-------|--------|
| Day 1 | Critical bug fixes | [ ] |
| Day 2 | Performance optimization | [ ] |
| Day 3 | Security audit | [ ] |
| Day 4 | Final testing | [ ] |
| Day 5 | Launch decision | [ ] |
| Day 6 | Launch or postpone | [ ] |
| Day 7 | Monitoring | [ ] |

---

## Next Steps

### After Testing Complete

1. **Compile Issues:**
   - List all found issues
   - Prioritize by severity
   - Estimate fix time

2. **Fix Critical Issues:**
   - All critical bugs must be fixed
   - High severity issues addressed
   - Medium issues triaged

3. **Re-test Fixes:**
   - Verify all fixes work
   - No regressions introduced
   - Document any workarounds

4. **Launch Decision:**
   - Review all critical issues
   - Assess launch readiness
   - Get stakeholder approval
   - Set launch date

---

## Contact Information

| Role | Name | Email | Telegram |
|------|------|-------|----------|
| Test Coordinator | | | |
| Developer Lead | | | |
| Product Owner | | | |
| System Admin | | | |

**Report Issues To:** [Add issue tracking link or email]

---

## Resources

**Documentation:**
- [SuperAdmin Credentials](./development/SUPERADMIN-CREDENTIALS.md)
- [Test Accounts](./development/TEST_ACCOUNTS.md)
- [Architecture Docs](./architecture.md)
- [API Documentation](./api/README.md)

**Tools:**
- DevTools (F12 in browser)
- Supabase Dashboard
- Vercel Dashboard
- Issue Tracker (GitHub/Jira)

---

**Last Updated:** 2026-01-09
**Version:** 1.0
**Status:** Ready for Beta Testing

**IMPORTANT:** Complete all critical path tests before proceeding to beta launch. Document all findings thoroughly.
