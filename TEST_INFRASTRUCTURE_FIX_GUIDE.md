# Test Infrastructure Fix Guide

## Critical Missing Elements

This guide provides exact locations where `data-testid` attributes need to be added to make the E2E tests functional.

## Priority 1: Authentication Flow (HIGHEST)

### 1.1 Auth Drawer Trigger

**Location:** Find the login/signup button in the header
**File:** Likely `src/components/layout/Header.tsx` or similar

```tsx
// BEFORE
<button onClick={openAuthDrawer}>
  Giriş Yap
</button>

// AFTER
<button
  data-testid="auth-drawer-trigger"
  onClick={openAuthDrawer}
>
  Giriş Yap
</button>
```

### 1.2 Auth Drawer Modal

**Location:** Find the auth modal/drawer component
**File:** Likely `src/components/auth/AuthDrawer.tsx` or similar

```tsx
// BEFORE
<Drawer open={isOpen} onClose={closeAuthDrawer}>
  {/* Auth content */}
</Drawer>

// AFTER
<Drawer
  data-testid="auth-drawer"
  open={isOpen}
  onClose={closeAuthDrawer}
>
  {/* Auth content */}
</Drawer>
```

### 1.3 Login Form Elements

**Location:** Login form component
**File:** Likely `src/components/auth/LoginForm.tsx` or similar

```tsx
// BEFORE
<form onSubmit={handleSubmit}>
  <input type="email" name="email" />
  <input type="password" name="password" />
  <button type="submit">Giriş Yap</button>
</form>

// AFTER
<form data-testid="login-form" onSubmit={handleSubmit}>
  <input
    data-testid="login-email"
    type="email"
    name="email"
  />
  <input
    data-testid="login-password"
    type="password"
    name="password"
  />
  <button
    data-testid="login-submit"
    type="submit"
  >
    Giriş Yap
  </button>
</form>
```

### 1.4 Signup Form Elements

```tsx
// AFTER
<form data-testid="signup-form" onSubmit={handleSubmit}>
  <input
    data-testid="signup-name"
    type="text"
    name="name"
  />
  <input
    data-testid="signup-email"
    type="email"
    name="email"
  />
  <input
    data-testid="signup-password"
    type="password"
    name="password"
  />
  <button
    data-testid="signup-submit"
    type="submit"
  >
    Kayıt Ol
  </button>
</form>
```

### 1.5 Auth Tabs

```tsx
// AFTER
<TabGroup>
  <Tab
    data-testid="auth-login-tab"
    onClick={() => setActiveTab('login')}
  >
    Giriş Yap
  </Tab>
  <Tab
    data-testid="auth-signup-tab"
    onClick={() => setActiveTab('signup')}
  >
    Kayıt Ol
  </Tab>
</TabGroup>
```

### 1.6 User Menu (After Login)

**Location:** Header component, shown when user is logged in

```tsx
// AFTER
<button
  data-testid="user-menu-trigger"
  onClick={toggleMenu}
>
  {user.name}
</button>

{isOpen && (
  <Menu data-testid="user-menu">
    <MenuItem data-testid="logout-button" onClick={logout}>
      Çıkış Yap
    </MenuItem>
  </Menu>
)}
```

## Priority 2: Admin Panel (HIGH)

### 2.1 Admin Dashboard

**Location:** `src/pages/admin/Dashboard.tsx` or `src/pages/admin/index.tsx`

```tsx
// AFTER
<div data-testid="admin-dashboard">
  {/* Dashboard content */}
</div>
```

### 2.2 Admin Sidebar/Navigation

**Location:** `src/components/admin/AdminSidebar.tsx`

```tsx
// AFTER
<nav data-testid="admin-sidebar">
  <NavLink
    data-testid="admin-nav-dashboard"
    to="/admin"
  >
    Dashboard
  </NavLink>
  <NavLink
    data-testid="admin-nav-users"
    to="/admin/users"
  >
    Users
  </NavLink>
  <NavLink
    data-testid="admin-nav-orders"
    to="/admin/orders"
  >
    Orders
  </NavLink>
  <NavLink
    data-testid="admin-nav-products"
    to="/admin/products"
  >
    Products
  </NavLink>
  <NavLink
    data-testid="admin-nav-dealers"
    to="/admin/dealers"
  >
    Dealers
  </NavLink>
  <NavLink
    data-testid="admin-nav-suppliers"
    to="/admin/suppliers"
  >
    Suppliers
  </NavLink>
  <NavLink
    data-testid="admin-nav-businesses"
    to="/admin/businesses"
  >
    Businesses
  </NavLink>
  <NavLink
    data-testid="admin-nav-whitelist"
    to="/admin/whitelist"
  >
    Whitelist
  </NavLink>
  <NavLink
    data-testid="admin-nav-reports"
    to="/admin/reports"
  >
    Reports
  </NavLink>
</nav>
```

### 2.3 Dashboard Stats

**Location:** `src/pages/admin/Dashboard.tsx`

```tsx
// AFTER
<div className="stats-grid">
  <StatCard data-testid="stat-total-users">
    <StatValue>{userCount}</StatValue>
    <StatLabel>Total Users</StatLabel>
  </StatCard>

  <StatCard data-testid="stat-total-orders">
    <StatValue>{orderCount}</StatValue>
    <StatLabel>Total Orders</StatLabel>
  </StatCard>

  <StatCard data-testid="stat-total-products">
    <StatValue>{productCount}</StatValue>
    <StatLabel>Total Products</StatLabel>
  </StatCard>

  <StatCard data-testid="stat-pending-applications">
    <StatValue>{applicationCount}</StatValue>
    <StatLabel>Pending Applications</StatLabel>
  </StatCard>
</div>

<div data-testid="recent-orders">
  {/* Recent orders list */}
</div>

<div data-testid="recent-applications">
  {/* Recent applications list */}
</div>

<div data-testid="sales-chart">
  {/* Sales chart */}
</div>

<div data-testid="orders-chart">
  {/* Orders chart */}
</div>
```

## Priority 3: Whitelist Management (CRITICAL)

### 3.1 Whitelist Applications List

**Location:** `src/pages/admin/Whitelist.tsx` or similar

```tsx
// AFTER
<div data-testid="whitelist-applications">
  {applications.map((app) => (
    <div
      key={app.id}
      data-testid={`whitelist-application`}
      data-application-id={app.id}
    >
      <div data-testid={`application-${app.id}`}>
        <span data-testid="application-name">{app.name}</span>
        <span data-testid="application-email">{app.email}</span>
        <span data-testid="application-phone">{app.phone}</span>
        <span data-testid="application-tax-no">{app.taxNo}</span>

        <Badge
          data-testid={`application-status-${app.status}`}
        >
          {app.status}
        </Badge>

        <Button
          data-testid="approve-button"
          onClick={() => approve(app.id)}
        >
          Approve
        </Button>

        <Button
          data-testid="reject-button"
          onClick={() => reject(app.id)}
        >
          Reject
        </Button>
      </div>
    </div>
  ))}
</div>
```

### 3.2 Whitelist Filters

```tsx
// AFTER
<Select
  data-testid="status-filter"
  onChange={(e) => filterByStatus(e.target.value)}
>
  <option value="all">All</option>
  <option value="pending">Pending</option>
  <option value="approved">Approved</option>
  <option value="rejected">Rejected</option>
</Select>

<Input
  data-testid="search-input"
  placeholder="Search by name or email"
  onChange={(e) => search(e.target.value)}
/>
```

### 3.3 Whitelist Detail Modal

```tsx
// AFTER
<Modal
  data-testid="application-detail-modal"
  isOpen={isModalOpen}
  onClose={closeModal}
>
  <h2 data-testid="application-name">{application.name}</h2>
  <p data-testid="application-email">{application.email}</p>
  <p data-testid="application-phone">{application.phone}</p>
  <p data-testid="application-tax-no">{application.taxNo}</p>
</Modal>
```

### 3.4 Whitelist Actions

```tsx
// AFTER - After approval
{showSuccessToast && (
  <Toast data-testid="approval-success-toast">
    Application approved successfully
  </Toast>
)}

{showRejectInput && (
  <div>
    <Textarea
      data-testid="rejection-reason"
      placeholder="Reason for rejection"
    />
    <Button
      data-testid="confirm-rejection"
      onClick={confirmRejection}
    >
      Confirm Rejection
    </Button>
  </div>
)}
```

## Priority 4: User Management

**Location:** `src/pages/admin/Users.tsx`

```tsx
// AFTER
<div data-testid="users-list">
  {users.map((user) => (
    <div
      key={user.id}
      data-testid="user-row"
      data-user-id={user.id}
    >
      <span data-testid="user-name">{user.name}</span>
      <span data-testid="user-email">{user.email}</span>

      {user.roles.map((role) => (
        <Badge
          key={role}
          data-testid={`role-badge-${role}`}
        >
          {role}
        </Badge>
      ))}

      <Button
        data-testid="deactivate-user-button"
        onClick={() => deactivate(user.id)}
      >
        Deactivate
      </Button>
    </div>
  ))}
</div>

<Select
  data-testid="role-filter"
  onChange={(e) => filterByRole(e.target.value)}
>
  <option value="all">All Roles</option>
  <option value="admin">Admin</option>
  <option value="dealer">Dealer</option>
  {/* etc */}
</Select>

{/* User Detail Modal */}
<Modal
  data-testid="user-detail-modal"
  isOpen={isOpen}
>
  <h2 data-testid="user-name">{user.name}</h2>
  <p data-testid="user-email">{user.email}</p>
  <div data-testid="user-roles">
    {user.roles.map((role) => (
      <Badge key={role}>{role}</Badge>
    ))}
  </div>
</Modal>

{showSuccessToast && (
  <Toast data-testid="deactivate-success-toast">
    User deactivated successfully
  </Toast>
)}
```

## Priority 5: Product Management

**Location:** `src/pages/admin/Products.tsx`

```tsx
// AFTER
<div data-testid="products-list">
  {products.map((product) => (
    <div
      key={product.id}
      data-testid="product-row"
      data-product-id={product.id}
    >
      <span>{product.name}</span>
      <span>{product.price}</span>
      <Badge data-testid={`product-status-${product.status}`}>
        {product.status}
      </Badge>
    </div>
  ))}
</div>

<Button
  data-testid="add-product-button"
  onClick={openAddModal}
>
  Add Product
</Button>

{/* Add/Edit Form */}
<form data-testid="product-form">
  <Input
    data-testid="product-name"
    name="name"
  />
  <Input
    data-testid="product-price"
    type="number"
    name="price"
  />
  <Select
    data-testid="product-category"
    name="category"
  >
    <option value="vegetables">Vegetables</option>
    <option value="fruits">Fruits</option>
    {/* etc */}
  </Select>
  <Button
    data-testid="save-product"
    type="submit"
  >
    Save
  </Button>
</form>

{showSuccessToast && (
  <Toast data-testid="product-save-success">
    Product saved successfully
  </Toast>
)}

<Button
  data-testid="deactivate-product"
  onClick={deactivate}
>
  Deactivate
</Button>
```

## Priority 6: Order Management

**Location:** `src/pages/admin/Orders.tsx`

```tsx
// AFTER
<div data-testid="orders-list">
  {orders.map((order) => (
    <div
      key={order.id}
      data-testid="order-row"
      data-order-id={order.id}
    >
      <span>{order.id}</span>
      <Badge data-testid={`order-status-${order.status}`}>
        {order.status}
      </Badge>
    </div>
  ))}
</div>

{/* Order Detail Modal */}
<Modal
  data-testid="order-detail-modal"
  isOpen={isOpen}
>
  <h2 data-testid="order-customer">{order.customer.name}</h2>
  <div data-testid="order-items">
    {order.items.map((item) => (
      <div key={item.id}>
        {item.product.name} x {item.quantity}
      </div>
    ))}
  </div>
  <p data-testid="order-total">{order.total}</p>
</Modal>

<Select
  data-testid="order-status"
  onChange={(e) => updateStatus(e.target.value)}
>
  <option value="pending">Pending</option>
  <option value="processing">Processing</option>
  <option value="shipped">Shipped</option>
  <option value="delivered">Delivered</option>
</Select>

<Button
  data-testid="update-order-status"
  onClick={saveStatus}
>
  Update Status
</Button>

{showSuccessToast && (
  <Toast data-testid="status-update-success">
    Status updated successfully
  </Toast>
)}

<Select
  data-testid="status-filter"
  onChange={(e) => filterByStatus(e.target.value)}
>
  <option value="all">All</option>
  <option value="pending">Pending</option>
  {/* etc */}
</Select>
```

## Priority 7: Dealer/Supplier/Business Management

**Location:** `src/pages/admin/Dealers.tsx`, `Suppliers.tsx`, `Businesses.tsx`

```tsx
// AFTER - Dealers
<div data-testid="dealers-list">
  {dealers.map((dealer) => (
    <div
      key={dealer.id}
      data-testid="dealer-row"
      data-dealer-id={dealer.id}
    >
      <span>{dealer.name}</span>
      <Badge data-testid={`dealer-status-${dealer.status}`}>
        {dealer.status}
      </Badge>
    </div>
  ))}
</div>

<Modal
  data-testid="dealer-detail-modal"
  isOpen={isOpen}
>
  <h2 data-testid="dealer-name">{dealer.name}</h2>
  <p data-testid="dealer-email">{dealer.email}</p>
  <p data-testid="dealer-phone">{dealer.phone}</p>
  <p data-testid="dealer-company">{dealer.company}</p>
  <p data-testid="dealer-customers-count">{dealer.customersCount}</p>
</Modal>

{showSuccessToast && (
  <Toast data-testid="approval-success">
    Dealer approved successfully
  </Toast>
)}

// AFTER - Suppliers
<div data-testid="suppliers-list">
  {suppliers.map((supplier) => (
    <div
      key={supplier.id}
      data-testid="supplier-row"
      data-supplier-id={supplier.id}
    >
      <span>{supplier.name}</span>
    </div>
  ))}
</div>

<Modal
  data-testid="supplier-detail-modal"
  isOpen={isOpen}
>
  <h2 data-testid="supplier-name">{supplier.name}</h2>
  <p data-testid="supplier-email">{supplier.email}</p>
  <p data-testid="supplier-products-count">{supplier.productsCount}</p>
</Modal>

// AFTER - Businesses
<div data-testid="businesses-list">
  {businesses.map((business) => (
    <div
      key={business.id}
      data-testid="business-row"
      data-business-id={business.id}
    >
      <span>{business.name}</span>
    </div>
  ))}
</div>

<Modal
  data-testid="business-detail-modal"
  isOpen={isOpen}
>
  <h2 data-testid="business-name">{business.name}</h2>
  <p data-testid="business-tax-no">{business.taxNo}</p>
  <p data-testid="business-address">{business.address}</p>
  <p data-testid="business-orders-count">{business.ordersCount}</p>
</Modal>
```

## Priority 8: Reports

**Location:** `src/pages/admin/Reports.tsx`

```tsx
// AFTER
<div data-testid="sales-report">
  {/* Sales report content */}
</div>

<Button
  data-testid="export-csv-button"
  onClick={exportCSV}
>
  Export as CSV
</Button>
```

## Additional Notes

### Error Handling

Add test IDs to error messages and validation states:

```tsx
{errors.email && (
  <span data-testid="login-email-error">
    {errors.email}
  </span>
)}

{showError && (
  <Toast data-testid="toast-error" type="error">
    {errorMessage}
  </Toast>
)}
```

### Loading States

```tsx
{isLoading && (
  <Spinner data-testid="loading-spinner" />
)}
```

### Empty States

```tsx
{users.length === 0 && (
  <div data-testid="empty-users">
    No users found
  </div>
)}
```

## Implementation Strategy

### Phase 1: Authentication (Day 1)
1. Add auth drawer trigger
2. Add auth modal
3. Add login form elements
4. Add signup form elements
5. Add auth tabs
6. Add user menu

**Test:** Run `role-login.spec.ts` tests

### Phase 2: Admin Navigation (Day 1-2)
1. Add admin dashboard
2. Add admin sidebar
3. Add section navigation links

**Test:** Verify admin can login and access dashboard

### Phase 3: Whitelist Management (Day 2)
1. Add whitelist applications list
2. Add filters and search
3. Add detail modal
4. Add approve/reject buttons
5. Add success toasts

**Test:** Run `admin-approval.spec.ts` tests

### Phase 4: User Management (Day 2)
1. Add users list
2. Add user detail modal
3. Add role badges
4. Add filters

**Test:** Verify user management tests pass

### Phase 5: Other Admin Sections (Day 3)
1. Products management
2. Orders management
3. Dealers/Suppliers/Businesses
4. Reports

**Test:** Run full `admin-workflow.spec.ts` suite

## Verification

After adding test IDs, verify with:

```bash
# Run specific test suite
npx playwright test tests/e2e/auth/role-login.spec.ts --project=chromium

# Run all admin tests
npx playwright test tests/e2e/admin/ --project=chromium

# Run with UI
npx playwright test --ui

# Run with debug
npx playwright test --debug
```

## Best Practices

1. **Use kebab-case for test IDs:** `data-testid="auth-drawer-trigger"`
2. **Be specific:** `data-testid="admin-nav-users"` not `data-testid="nav"`
3. **Group related elements:** Use parent container test IDs
4. **Test user-facing strings:** Use test IDs for user-visible text
5. **Don't test implementation:** Test behavior, not CSS classes or internal state

---

**Estimated Total Time:** 2-3 days
**Priority:** CRITICAL
**Impact:** Enables all 190+ E2E tests to run
