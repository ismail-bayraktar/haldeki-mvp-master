/**
 * Test Helpers for Warehouse Tests
 *
 * Utilities for setting up test data, logging in as warehouse users,
 * and cleaning up after tests.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface WarehouseTestContext {
  adminClient: SupabaseClient;
  warehouseClient: SupabaseClient | null;
  testUser: TestUser | null;
  cleanup: () => Promise<void>;
}

/**
 * Create admin client with service role privileges
 */
export function createAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create warehouse test user and login
 */
export async function setupWarehouseTest(): Promise<WarehouseTestContext> {
  const adminClient = createAdminClient();
  const timestamp = Date.now();

  const testUser: TestUser = {
    id: '',
    email: `warehouse-test-${timestamp}@test.haldeki.com`,
    password: 'Test1234!',
    fullName: 'Test Warehouse Staff',
    role: 'warehouse_manager',
  };

  // Create auth user
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email: testUser.email,
    password: testUser.password,
    email_confirm: true,
    user_metadata: {
      full_name: testUser.fullName,
      role: testUser.role,
    },
  });

  if (userError) throw userError;
  if (!userData.user) throw new Error('Failed to create test user');

  testUser.id = userData.user.id;

  // Create profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: testUser.id,
    email: testUser.email,
    full_name: testUser.fullName,
    phone: `0532 ${timestamp.toString().slice(-6)}`,
  });

  if (profileError) throw profileError;

  // Assign role
  const { error: roleError } = await adminClient.from('user_roles').insert({
    user_id: testUser.id,
    role: testUser.role,
  });

  if (roleError) throw roleError;

  // Get Menemen region
  const { data: region } = await adminClient
    .from('regions')
    .select('id')
    .eq('slug', 'menemen')
    .single();

  // Add to warehouse_staff
  const { error: staffError } = await adminClient.from('warehouse_staff').insert({
    user_id: testUser.id,
    vendor_id: testUser.id, // Self-vendor for testing
    warehouse_id: region?.id || '00000000-0000-0000-0000-000000000000',
    is_active: true,
  });

  if (staffError) throw staffError;

  // Login as warehouse user
  const warehouseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: loginError } = await warehouseClient.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password,
  });

  if (loginError) throw loginError;

  // Cleanup function
  const cleanup = async () => {
    await warehouseClient.auth.signOut();

    // Delete in reverse order of dependency
    await adminClient.from('warehouse_staff').delete().eq('user_id', testUser.id);
    await adminClient.from('user_roles').delete().eq('user_id', testUser.id);
    await adminClient.from('profiles').delete().eq('id', testUser.id);
    await adminClient.auth.admin.deleteUser(testUser.id);
  };

  return {
    adminClient,
    warehouseClient,
    testUser,
    cleanup,
  };
}

/**
 * Login as existing warehouse user
 */
export async function loginAsWarehouseManager(
  email: string = 'warehouse@test.haldeki.com',
  password: string = 'Test1234!'
): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return client;
}

/**
 * Create test order with items
 */
export async function createTestOrder(
  adminClient: SupabaseClient,
  userId: string,
  overrides: Partial<{
    status: string;
    items: any[];
    placed_at: string;
    total_price: number;
  }> = {}
): Promise<string> {
  const { data, error } = await adminClient
    .from('orders')
    .insert({
      user_id: userId,
      status: overrides.status || 'confirmed',
      total_price: overrides.total_price || 100,
      items: JSON.stringify(
        overrides.items || [
          {
            product_id: '00000000-0000-0000-0000-000000000001',
            product_name: 'Test Product',
            quantity: 5,
            unit: 'kg',
            unit_price: 20,
            total_price: 100,
          },
        ]
      ),
      placed_at: overrides.placed_at || new Date().toISOString(),
      order_number: `TEST-${Date.now()}`,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Create test product with unit conversion
 */
export async function createTestProduct(
  adminClient: SupabaseClient,
  overrides: Partial<{
    name: string;
    unit: string;
    conversion_factor: number;
    category: string;
  }> = {}
): Promise<string> {
  const { data, error } = await adminClient
    .from('products')
    .insert({
      name: overrides.name || `Test Product ${Date.now()}`,
      unit: overrides.unit || 'kg',
      conversion_factor: overrides.conversion_factor || 1.0,
      category: overrides.category || 'sebze',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Get time window for testing (last 24 hours)
 */
export function getDefaultTimeWindow(): { start: string; end: string } {
  return {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Assert that object has NO price fields
 */
export function assertNoPriceFields(obj: any): void {
  const priceFields = [
    'price',
    'unit_price',
    'total_price',
    'subtotal',
    'discount',
    'tax',
    'shipping',
    'fee',
    'cost',
    'amount',
  ];

  priceFields.forEach((field) => {
    expect(obj).not.toHaveProperty(field);
  });
}

/**
 * Assert that error is a permission/security error
 */
export function assertPermissionError(error: any): void {
  expect(error).toBeDefined();
  expect(error.message).toMatch(/permission denied|insufficient privilege|unauthorized|not.*allowed/i);
}

/**
 * Clean up test data
 */
export async function cleanupTestData(
  adminClient: SupabaseClient,
  userId: string
): Promise<void> {
  await adminClient.from('orders').delete().eq('user_id', userId);
  await adminClient.from('profiles').delete().eq('id', userId);
  await adminClient.from('user_roles').delete().eq('user_id', userId);
}
