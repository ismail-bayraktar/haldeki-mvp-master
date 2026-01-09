/**
 * Test User Personas for E2E Testing
 * Provides test credentials and data for all 7 user roles
 */

export const TEST_USERS = {
  superadmin: {
    email: 'test-superadmin@haldeki.com',
    password: 'Test1234!',
    role: 'superadmin',
    name: 'Test Süper Yönetici',
    permissions: ['full_system_access', 'manage_all_users', 'view_all_data'],
  },
  admin: {
    email: 'test-admin@haldeki.com',
    password: 'Test1234!',
    role: 'admin',
    name: 'Test Yönetici',
    permissions: ['manage_whitelist', 'manage_products', 'manage_orders', 'view_users'],
  },
  dealer: {
    email: 'test-dealer@haldeki.com',
    password: 'Test1234!',
    role: 'dealer',
    name: 'Test Bayi',
    businessName: 'Test Bayilik Ltd.',
    permissions: ['bulk_ordering', 'view_customer_pricing', 'manage_customers'],
  },
  supplier: {
    email: 'test-supplier@haldeki.com',
    password: 'Test1234!',
    role: 'supplier',
    name: 'Test Tedarikçi',
    businessName: 'Test Tarım Ürünleri',
    permissions: ['manage_products', 'update_stock', 'view_orders', 'import_export'],
  },
  business: {
    email: 'test-business@haldeki.com',
    password: 'Test1234!',
    role: 'business',
    name: 'Test İşletme',
    businessName: 'Test Restoran',
    taxNumber: '1122334455',
    permissions: ['business_pricing', 'repeat_orders', 'invoice_payment'],
  },
  warehouse_manager: {
    email: 'test-warehouse@haldeki.com',
    password: 'Test1234!',
    role: 'warehouse_manager',
    name: 'Test Depo Sorumlusu',
    permissions: ['manage_inventory', 'update_picking', 'view_all_orders'],
  },
  customer: {
    email: 'test-customer@haldeki.com',
    password: 'Test1234!',
    role: 'user',
    name: 'Test Müşteri',
    permissions: ['browse_products', 'add_to_cart', 'checkout'],
  },
} as const;

export type TestUserRole = keyof typeof TEST_USERS;

/**
 * Dashboard paths for each role
 */
export const ROLE_DASHBOARDS: Record<TestUserRole, string> = {
  superadmin: '/admin',
  admin: '/admin',
  dealer: '/bayi',
  supplier: '/tedarikci',
  business: '/isletme',
  warehouse_manager: '/depo',
  customer: '/hesabim',
};

/**
 * Role-specific navigation selectors
 */
export const ROLE_SELECTORS = {
  superadmin: {
    dashboard: '[data-testid="admin-dashboard"]',
    nav: '[data-testid="admin-sidebar"]',
  },
  admin: {
    dashboard: '[data-testid="admin-dashboard"]',
    nav: '[data-testid="admin-sidebar"]',
  },
  dealer: {
    dashboard: '[data-testid="dealer-dashboard"]',
    nav: '[data-testid="dealer-sidebar"]',
  },
  supplier: {
    dashboard: '[data-testid="supplier-dashboard"]',
    nav: '[data-testid="supplier-sidebar"]',
  },
  business: {
    dashboard: '[data-testid="business-dashboard"]',
    nav: '[data-testid="business-sidebar"]',
  },
  warehouse_manager: {
    dashboard: '[data-testid="warehouse-dashboard"]',
    nav: '[data-testid="warehouse-sidebar"]',
  },
  customer: {
    dashboard: '[data-testid="customer-dashboard"]',
    nav: '[data-testid="customer-nav"]',
  },
};

/**
 * Test product data
 */
export const TEST_PRODUCTS = {
  simple: {
    id: 'test-product-1',
    name: 'Test Product 1',
    slug: 'test-product-1',
    price: 50,
    category: 'vegetables',
  },
  variable: {
    id: 'test-product-2',
    name: 'Test Product with Variations',
    slug: 'test-product-2',
    variations: ['1kg', '2kg', '5kg'],
  },
  outOfStock: {
    id: 'out-of-stock-product',
    name: 'Out of Stock Product',
    slug: 'out-of-stock-product',
    stock: 0,
  },
};

/**
 * Test regions
 */
export const TEST_REGIONS = ['Menemen', 'Aliaga', 'Bornova'];

/**
 * Test addresses
 */
export const TEST_ADDRESSES = {
  menemen: {
    title: 'Home',
    district: 'Menemen Merkez',
    fullAddress: 'Atatürk Caddesi No: 123',
    phone: '+905551234567',
  },
  bornova: {
    title: 'Office',
    district: 'Bornova Merkez',
    fullAddress: 'Ergene Caddesi No: 456',
    phone: '+905559876543',
  },
};

/**
 * Test order data
 */
export const TEST_ORDERS = {
  minimumAmount: 100, // Minimum order amount in TL
  smallOrder: {
    items: [{ productId: 'test-product-1', quantity: 1 }],
    expectedTotal: 50,
    shouldFail: true,
  },
  validOrder: {
    items: [
      { productId: 'test-product-1', quantity: 2 },
      { productId: 'test-product-2', quantity: 1 },
    ],
    expectedTotal: 150,
    shouldFail: false,
  },
};

/**
 * Permission matrix for access control tests
 * Format: [role, path, shouldHaveAccess]
 */
export const PERMISSION_TESTS: Array<{
  role: TestUserRole;
  path: string;
  shouldHaveAccess: boolean;
  description: string;
}> = [
  // Customer permissions
  { role: 'customer', path: '/urunler', shouldHaveAccess: true, description: 'Customer can browse products' },
  { role: 'customer', path: '/sepet', shouldHaveAccess: true, description: 'Customer can access cart' },
  { role: 'customer', path: '/hesabim', shouldHaveAccess: true, description: 'Customer can access account' },
  { role: 'customer', path: '/admin', shouldHaveAccess: false, description: 'Customer cannot access admin' },
  { role: 'customer', path: '/bayi', shouldHaveAccess: false, description: 'Customer cannot access dealer panel' },
  { role: 'customer', path: '/tedarikci', shouldHaveAccess: false, description: 'Customer cannot access supplier panel' },
  { role: 'customer', path: '/depo', shouldHaveAccess: false, description: 'Customer cannot access warehouse' },

  // Admin permissions
  { role: 'admin', path: '/admin', shouldHaveAccess: true, description: 'Admin can access admin panel' },
  { role: 'admin', path: '/admin/users', shouldHaveAccess: true, description: 'Admin can manage users' },
  { role: 'admin', path: '/admin/products', shouldHaveAccess: true, description: 'Admin can manage products' },
  { role: 'admin', path: '/admin/orders', shouldHaveAccess: true, description: 'Admin can manage orders' },
  { role: 'admin', path: '/bayi', shouldHaveAccess: false, description: 'Admin cannot access dealer panel' },

  // SuperAdmin permissions (same as admin but with additional access)
  { role: 'superadmin', path: '/admin', shouldHaveAccess: true, description: 'SuperAdmin can access admin panel' },
  { role: 'superadmin', path: '/admin/users', shouldHaveAccess: true, description: 'SuperAdmin can manage users' },

  // Dealer permissions
  { role: 'dealer', path: '/bayi', shouldHaveAccess: true, description: 'Dealer can access dealer panel' },
  { role: 'dealer', path: '/bayi/musteriler', shouldHaveAccess: true, description: 'Dealer can manage customers' },
  { role: 'dealer', path: '/urunler', shouldHaveAccess: true, description: 'Dealer can browse products' },
  { role: 'dealer', path: '/tedarikci', shouldHaveAccess: false, description: 'Dealer cannot access supplier panel' },
  { role: 'dealer', path: '/admin', shouldHaveAccess: false, description: 'Dealer cannot access admin' },

  // Supplier permissions
  { role: 'supplier', path: '/tedarikci', shouldHaveAccess: true, description: 'Supplier can access supplier panel' },
  { role: 'supplier', path: '/tedarikci/urunler', shouldHaveAccess: true, description: 'Supplier can manage products' },
  { role: 'supplier', path: '/tedarikci/siparisler', shouldHaveAccess: true, description: 'Supplier can view orders' },
  { role: 'supplier', path: '/bayi', shouldHaveAccess: false, description: 'Supplier cannot access dealer panel' },
  { role: 'supplier', path: '/admin', shouldHaveAccess: false, description: 'Supplier cannot access admin' },

  // Business permissions
  { role: 'business', path: '/isletme', shouldHaveAccess: true, description: 'Business can access business panel' },
  { role: 'business', path: '/isletme/siparisler', shouldHaveAccess: true, description: 'Business can view orders' },
  { role: 'business', path: '/urunler', shouldHaveAccess: true, description: 'Business can browse products' },
  { role: 'business', path: '/tedarikci', shouldHaveAccess: false, description: 'Business cannot access supplier panel' },
  { role: 'business', path: '/admin', shouldHaveAccess: false, description: 'Business cannot access admin' },

  // Warehouse Manager permissions
  { role: 'warehouse_manager', path: '/depo', shouldHaveAccess: true, description: 'Warehouse can access warehouse panel' },
  { role: 'warehouse_manager', path: '/depo/siparisler', shouldHaveAccess: true, description: 'Warehouse can view orders' },
  { role: 'warehouse_manager', path: '/depo/toplama-listesi', shouldHaveAccess: true, description: 'Warehouse can access picking list' },
  { role: 'warehouse_manager', path: '/admin', shouldHaveAccess: false, description: 'Warehouse cannot access admin' },
  { role: 'warehouse_manager', path: '/tedarikci', shouldHaveAccess: false, description: 'Warehouse cannot access supplier panel' },
];
