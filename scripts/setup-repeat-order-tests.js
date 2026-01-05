/**
 * Setup Script for Repeat Order E2E Tests
 *
 * This script creates test data needed for repeat order testing:
 * - Test orders with various statuses
 * - Orders with multiple items
 * - Orders delivered for repeat functionality
 *
 * Usage:
 *   node scripts/setup-repeat-order-tests.js
 *
 * Prerequisites:
 *   - Supabase CLI installed and configured
 *   - Test users exist (run test accounts migration first)
 *   - Some products exist in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user IDs (these should match the migration)
const TEST_USERS = {
  business: {
    email: 'test-business@haldeki.com',
    id: null, // Will be fetched
  },
  customer: {
    email: 'test-customer@haldeki.com',
    id: null, // Will be fetched
  },
};

// Test regions
const REGIONS = {
  menemen: 'menemen-region-id',
  izmir: 'izmir-region-id',
};

/**
 * Fetch user IDs by email
 */
async function getUserIds() {
  console.log('Fetching test user IDs...');

  for (const [key, user] of Object.entries(TEST_USERS)) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (error) {
      console.error(`Error fetching ${key} user:`, error.message);
      continue;
    }

    if (data) {
      TEST_USERS[key].id = data.id;
      console.log(`✓ ${key} user ID: ${data.id}`);
    }
  }
}

/**
 * Fetch region IDs
 */
async function getRegionIds() {
  console.log('\nFetching region IDs...');

  const { data: regions, error } = await supabase
    .from('regions')
    .select('id, name')
    .in('name', ['Menemen', 'İzmir']);

  if (error) {
    console.error('Error fetching regions:', error.message);
    return;
  }

  for (const region of regions || []) {
    if (region.name === 'Menemen') {
      REGIONS.menemen = region.id;
      console.log(`✓ Menemen region ID: ${region.id}`);
    } else if (region.name === 'İzmir') {
      REGIONS.izmir = region.id;
      console.log(`✓ İzmir region ID: ${region.id}`);
    }
  }
}

/**
 * Fetch available products
 */
async function getAvailableProducts() {
  console.log('\nFetching available products...');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price, unit')
    .eq('is_active', true)
    .limit(5);

  if (error) {
    console.error('Error fetching products:', error.message);
    return [];
  }

  console.log(`✓ Found ${products?.length || 0} available products`);
  return products || [];
}

/**
 * Create a test order
 */
async function createTestOrder(userId, regionId, products, status = 'delivered') {
  const orderItems = products.slice(0, 3).map(product => ({
    productId: product.id,
    productName: product.name,
    quantity: Math.floor(Math.random() * 3) + 1, // 1-3 items
    price: product.price,
    unit: product.unit,
  }));

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingAddress = {
    title: 'Test Address',
    fullAddress: 'Test Street 123, Menemen',
    phone: '+905551234567',
    district: 'Menemen Merkez',
  };

  const now = new Date();
  const deliveredAt = status === 'delivered' ? now.toISOString() : null;

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      region_id: regionId,
      items: orderItems,
      total_amount: totalAmount,
      status: status,
      payment_method: 'cash',
      payment_status: 'paid',
      shipping_address: shippingAddress,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      delivered_at: deliveredAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error.message);
    return null;
  }

  return data;
}

/**
 * Create all test orders
 */
async function createTestOrders() {
  console.log('\n=== Creating Test Orders ===\n');

  const products = await getAvailableProducts();

  if (products.length === 0) {
    console.error('No products found. Please create some products first.');
    return;
  }

  // Business user orders
  if (TEST_USERS.business.id) {
    console.log('\nCreating business user orders...');

    // Order 1: Delivered with 3 items (for repeat order test)
    const order1 = await createTestOrder(
      TEST_USERS.business.id,
      REGIONS.menemen,
      products,
      'delivered'
    );
    if (order1) {
      console.log(`✓ Created delivered order: ${order1.id} (${order1.items.length} items)`);
    }

    // Order 2: Delivered with 2 items
    const order2 = await createTestOrder(
      TEST_USERS.business.id,
      REGIONS.menemen,
      products.slice(2),
      'delivered'
    );
    if (order2) {
      console.log(`✓ Created delivered order: ${order2.id} (${order2.items.length} items)`);
    }

    // Order 3: Active order (not for repeat)
    const order3 = await createTestOrder(
      TEST_USERS.business.id,
      REGIONS.menemen,
      products.slice(1, 3),
      'confirmed'
    );
    if (order3) {
      console.log(`✓ Created active order: ${order3.id} (${order3.items.length} items)`);
    }
  }

  // Customer user orders
  if (TEST_USERS.customer.id) {
    console.log('\nCreating customer user orders...');

    // Order 1: Delivered with 2 items
    const order1 = await createTestOrder(
      TEST_USERS.customer.id,
      REGIONS.menemen,
      products,
      'delivered'
    );
    if (order1) {
      console.log(`✓ Created delivered order: ${order1.id} (${order1.items.length} items)`);
    }

    // Order 2: Delivered single item
    const order2 = await createTestOrder(
      TEST_USERS.customer.id,
      REGIONS.menemen,
      [products[0]],
      'delivered'
    );
    if (order2) {
      console.log(`✓ Created delivered order: ${order2.id} (${order2.items.length} items)`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Repeat Order Test Data Setup ===\n');

  await getUserIds();
  await getRegionIds();
  await createTestOrders();

  console.log('\n=== Setup Complete ===');
  console.log('\nYou can now run the repeat order E2E tests:');
  console.log('  npx playwright test tests/e2e/business/repeat-order.spec.ts');
  console.log('  npx playwright test tests/e2e/customer/repeat-order.spec.ts');
}

main().catch(console.error);
