import { Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Database helper for E2E tests
 * Provides utilities for seeding and cleaning test data
 */
export class DatabaseHelper {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Clean up test data by email
   */
  async cleanupTestUser(email: string): Promise<void> {
    // Get user by email
    const { data: users } = await this.client
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (users && users.length > 0) {
      const userId = users[0].id;

      // Clean up related data in correct order due to foreign keys
      await this.client.from('cart_items').delete().eq('user_id', userId);
      await this.client.from('orders').delete().eq('user_id', userId);
      await this.client.from('addresses').delete().eq('user_id', userId);
      await this.client.from('dealers').delete().eq('user_id', userId);
      await this.client.from('suppliers').delete().eq('user_id', userId);
      await this.client.from('businesses').delete().eq('user_id', userId);
      await this.client.from('user_roles').delete().eq('user_id', userId);
      await this.client.from('profiles').delete().eq('id', userId);
    }
  }

  /**
   * Clean up all test users
   */
  async cleanupAllTestUsers(): Promise<void> {
    const testEmails = [
      'test-superadmin@haldeki.com',
      'test-admin@haldeki.com',
      'test-dealer@haldeki.com',
      'test-supplier@haldeki.com',
      'test-business@haldeki.com',
      'test-customer@haldeki.com',
    ];

    for (const email of testEmails) {
      await this.cleanupTestUser(email);
    }
  }

  /**
   * Create a test user with specific role
   */
  async createTestUser(
    email: string,
    password: string,
    name: string,
    role: string
  ): Promise<{ userId: string; error: string | null }> {
    try {
      // Create auth user (this would typically be done via Supabase Admin API)
      // For E2E tests, we assume test users are already created via migration

      // Get the user ID from profiles
      const { data: profile } = await this.client
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!profile) {
        return { userId: '', error: 'Profile not found' };
      }

      // Assign role
      const { error: roleError } = await this.client
        .from('user_roles')
        .insert({ user_id: profile.id, role });

      if (roleError) {
        return { userId: '', error: roleError.message };
      }

      return { userId: profile.id, error: null };
    } catch (e) {
      return { userId: '', error: (e as Error).message };
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return null;
    }
    return data;
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error || !data) {
      return [];
    }
    return data.map(r => r.role);
  }

  /**
   * Set dealer approval status
   */
  async setDealerApprovalStatus(
    userId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<void> {
    await this.client
      .from('dealers')
      .update({ approval_status: status })
      .eq('user_id', userId);
  }

  /**
   * Set supplier approval status
   */
  async setSupplierApprovalStatus(
    userId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<void> {
    await this.client
      .from('suppliers')
      .update({ approval_status: status })
      .eq('user_id', userId);
  }

  /**
   * Set business approval status
   */
  async setBusinessApprovalStatus(
    userId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<void> {
    await this.client
      .from('businesses')
      .update({ approval_status: status })
      .eq('user_id', userId);
  }

  /**
   * Create test region product
   */
  async createTestRegionProduct(
    regionId: string,
    productId: string,
    price: number,
    stockQuantity: number
  ): Promise<void> {
    await this.client.from('region_products').insert({
      region_id: regionId,
      product_id: productId,
      price,
      business_price: price * 0.9,
      previous_price: null,
      price_change: 'stable',
      availability: stockQuantity > 10 ? 'plenty' : stockQuantity > 0 ? 'limited' : 'last',
      stock_quantity: stockQuantity,
      is_active: true,
    });
  }

  /**
   * Clear cart for user
   */
  async clearCart(userId: string): Promise<void> {
    await this.client.from('cart_items').delete().eq('user_id', userId);
  }

  /**
   * Get cart items count
   */
  async getCartItemCount(userId: string): Promise<number> {
    const { data, error } = await this.client
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return data?.length || 0;
  }

  /**
   * Create test order
   */
  async createTestOrder(userId: string, total: number): Promise<string> {
    const { data, error } = await this.client
      .from('orders')
      .insert({
        user_id: userId,
        total,
        status: 'pending',
        delivery_slot: null,
        delivery_address: null,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error('Failed to create test order');
    }
    return data.id;
  }

  /**
   * Delete test order
   */
  async deleteTestOrder(orderId: string): Promise<void> {
    // First delete order items
    await this.client.from('order_items').delete().eq('order_id', orderId);
    // Then delete the order
    await this.client.from('orders').delete().eq('id', orderId);
  }

  /**
   * Reset database to clean state for tests
   */
  async resetDatabase(): Promise<void> {
    // Clean up test data
    await this.cleanupAllTestUsers();

    // Note: We don't clean up products, categories, regions
    // as those are seeded via migrations and should be stable
  }
}

/**
 * Database fixture setup
 */
export async function setupDatabaseHelper(): Promise<DatabaseHelper> {
  return new DatabaseHelper();
}

/**
 * Run database cleanup before/after tests
 */
export async function cleanupTestData(email: string): Promise<void> {
  const db = await setupDatabaseHelper();
  await db.cleanupTestUser(email);
}
