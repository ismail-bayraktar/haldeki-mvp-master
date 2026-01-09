/**
 * Price Masking Negative Tests (P0 Security)
 *
 * CRITICAL: These tests verify warehouse staff CANNOT see prices
 * at ANY layer - DB, RPC, or UI
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test credentials
const WAREHOUSE_EMAIL = 'warehouse@test.haldeki.com';
const WAREHOUSE_PASSWORD = 'Test1234!';

interface TestContext {
  warehouseUserId: string | null;
  adminClient: any;
  warehouseClient: any;
}

describe('Warehouse Price Masking (P0 Security)', () => {
  const ctx: TestContext = {
    warehouseUserId: null,
    adminClient: null,
    warehouseClient: null,
  };

  beforeAll(async () => {
    // Setup admin client (service role)
    ctx.adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  afterAll(async () => {
    if (ctx.warehouseClient) {
      await ctx.warehouseClient.auth.signOut();
    }
  });

  beforeEach(async () => {
    // Create or get warehouse test user
    const { data: existingUser } = await ctx.adminClient
      .from('profiles')
      .select('id')
      .eq('email', WAREHOUSE_EMAIL)
      .single();

    if (existingUser) {
      ctx.warehouseUserId = existingUser.id;
    } else {
      // Create warehouse test user
      const { data: newUser, error: createError } = await ctx.adminClient.auth.admin.createUser({
        email: WAREHOUSE_EMAIL,
        password: WAREHOUSE_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Warehouse Staff',
          role: 'warehouse_manager',
        },
      });

      if (createError) throw createError;
      ctx.warehouseUserId = newUser.user.id;

      // Create profile
      await ctx.adminClient.from('profiles').insert({
        id: ctx.warehouseUserId,
        email: WAREHOUSE_EMAIL,
        full_name: 'Test Warehouse Staff',
        phone: '0532 999 99 99',
      });

      // Assign role
      await ctx.adminClient.from('user_roles').insert({
        user_id: ctx.warehouseUserId,
        role: 'warehouse_manager',
      });

      // Get Menemen region
      const { data: region } = await ctx.adminClient
        .from('regions')
        .select('id')
        .eq('slug', 'menemen')
        .single();

      // Add to warehouse_staff
      await ctx.adminClient.from('warehouse_staff').insert({
        user_id: ctx.warehouseUserId,
        vendor_id: ctx.warehouseUserId, // Self-vendor for testing
        warehouse_id: region?.id || '00000000-0000-0000-0000-000000000000',
        is_active: true,
      });
    }

    // Login as warehouse user
    ctx.warehouseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: loginError } = await ctx.warehouseClient.auth.signInWithPassword({
      email: WAREHOUSE_EMAIL,
      password: WAREHOUSE_PASSWORD,
    });

    if (loginError) throw loginError;
  });

  afterEach(async () => {
    // Logout after each test
    if (ctx.warehouseClient) {
      await ctx.warehouseClient.auth.signOut();
    }
  });

  describe('Direct Table Access (BLOCKED)', () => {
    it('should NOT allow direct SELECT from orders table', async () => {
      const { data, error } = await ctx.warehouseClient
        .from('orders')
        .select('*')
        .limit(1);

      // MUST fail - warehouse should only use RPC
      expect(error || !data || data.length === 0).toBeTruthy();

      if (error) {
        expect(error.message).toMatch(/permission denied|insufficient privilege|does not exist/i);
      }
    });

    it('should NOT allow direct UPDATE on orders table', async () => {
      // First create a test order via admin
      const { data: testOrder } = await ctx.adminClient
        .from('orders')
        .insert({
          user_id: ctx.warehouseUserId,
          status: 'confirmed',
          total_price: 100,
          items: [],
          placed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      // Try to update as warehouse
      const { error } = await ctx.warehouseClient
        .from('orders')
        .update({ status: 'prepared' })
        .eq('id', testOrder?.id);

      // MUST fail - use RPC instead
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/permission denied|insufficient privilege/i);

      // Cleanup
      await ctx.adminClient.from('orders').delete().eq('id', testOrder?.id);
    });

    it('should NOT allow direct INSERT on orders table', async () => {
      const { error } = await ctx.warehouseClient
        .from('orders')
        .insert({
          user_id: ctx.warehouseUserId,
          status: 'pending',
          total_price: 0,
          items: [],
        });

      expect(error).toBeDefined();
      expect(error?.message).toMatch(/permission denied|insufficient privilege/i);
    });

    it('should NOT allow direct DELETE on orders table', async () => {
      const { error } = await ctx.warehouseClient
        .from('orders')
        .delete()
        .limit(1);

      expect(error).toBeDefined();
      expect(error?.message).toMatch(/permission denied|insufficient privilege/i);
    });
  });

  describe('RPC Price Masking', () => {
    it('should NOT expose prices in warehouse_get_orders response', async () => {
      // Create test order with prices
      const { data: testOrder } = await ctx.adminClient
        .from('orders')
        .insert({
          user_id: ctx.warehouseUserId,
          status: 'confirmed',
          total_price: 250.50,
          items: JSON.stringify([
            {
              product_id: '00000000-0000-0000-0000-000000000001',
              product_name: 'Domates',
              quantity: 10,
              unit: 'kg',
              unit_price: 25.05,
              total_price: 250.50,
            },
          ]),
          placed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      const { data, error } = await ctx.warehouseClient.rpc('warehouse_get_orders', {
        p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        const order = data[0];

        // NO price fields at order level
        expect(order).not.toHaveProperty('total_price');
        expect(order).not.toHaveProperty('subtotal');
        expect(order).not.toHaveProperty('discount');
        expect(order).not.toHaveProperty('tax');

        // Items also NO prices
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            expect(item).not.toHaveProperty('unit_price');
            expect(item).not.toHaveProperty('total_price');
            expect(item).not.toHaveProperty('price');
            expect(item).not.toHaveProperty('discount');
          });
        }
      }

      // Cleanup
      await ctx.adminClient.from('orders').delete().eq('id', testOrder?.id);
    });

    it('should NOT expose prices in warehouse_get_picking_list response', async () => {
      const { data, error } = await ctx.warehouseClient.rpc('warehouse_get_picking_list', {
        p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      if (data && data.length > 0) {
        data.forEach((item: any) => {
          // Only quantity, NO prices
          expect(item).toHaveProperty('product_id');
          expect(item).toHaveProperty('product_name');
          expect(item).toHaveProperty('total_quantity_kg');
          expect(item).toHaveProperty('order_count');

          expect(item).not.toHaveProperty('unit_price');
          expect(item).not.toHaveProperty('total_price');
          expect(item).not.toHaveProperty('revenue');
        });
      }
    });

    it('should allow status update via warehouse_mark_prepared RPC ONLY', async () => {
      // Create test order
      const { data: testOrder } = await ctx.adminClient
        .from('orders')
        .insert({
          user_id: ctx.warehouseUserId,
          status: 'confirmed',
          total_price: 100,
          items: [],
          placed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      // Update via RPC (should work)
      const { error: rpcError } = await ctx.warehouseClient.rpc('warehouse_mark_prepared', {
        p_order_id: testOrder?.id,
      });

      // If error, it should be about order not found, NOT permission
      if (rpcError) {
        expect(rpcError.message).not.toMatch(/permission|unauthorized|denied/i);
      }

      // Verify status changed
      const { data: updatedOrder } = await ctx.adminClient
        .from('orders')
        .select('status')
        .eq('id', testOrder?.id)
        .single();

      expect(updatedOrder?.status).toBe('prepared');

      // Cleanup
      await ctx.adminClient.from('orders').delete().eq('id', testOrder?.id);
    });
  });

  describe('UI Layer Price Protection', () => {
    it('should NOT have any price-related TypeScript types in WarehouseOrder interface', async () => {
      // This test verifies the type definition itself
      // Read the useWarehouseOrders hook file
      const fs = await import('fs');
      const path = await import('path');

      const hookPath = path.join(process.cwd(), 'src/hooks/useWarehouseOrders.ts');
      const hookContent = fs.readFileSync(hookPath, 'utf-8');

      // Verify NO price fields in interface
      expect(hookContent).not.toMatch(/unit_price\s*:/);
      expect(hookContent).not.toMatch(/total_price\s*:/);
      expect(hookContent).not.toMatch(/price\s*:/s);

      // Verify price masking comment exists
      expect(hookContent).toMatch(/NO price fields/i);
    });

    it('should NOT display price-related text in warehouse components', async () => {
      const fs = await import('fs');
      const path = await import('path');

      // Check PickingListCard
      const pickingListPath = path.join(process.cwd(), 'src/pages/warehouse/PickingListCard.tsx');
      const pickingListContent = fs.readFileSync(pickingListPath, 'utf-8');

      expect(pickingListContent).not.toMatch(/TL|₺|price|fiyat|tutar/i);

      // Check OrdersList
      const ordersListPath = path.join(process.cwd(), 'src/pages/warehouse/OrdersList.tsx');
      const ordersListContent = fs.readFileSync(ordersListPath, 'utf-8');

      expect(ordersListContent).not.toMatch(/TL|₺|unit_price|total_price/i);
    });
  });
});

describe('Warehouse Tenant Isolation (P0 Security)', () => {
  const ctx: TestContext = {
    warehouseUserId: null,
    adminClient: null,
    warehouseClient: null,
  };

  beforeAll(async () => {
    ctx.adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  afterAll(async () => {
    if (ctx.warehouseClient) {
      await ctx.warehouseClient.auth.signOut();
    }
  });

  beforeEach(async () => {
    // Create Vendor A warehouse staff
    const { data: existingUser } = await ctx.adminClient
      .from('profiles')
      .select('id')
      .eq('email', WAREHOUSE_EMAIL)
      .single();

    if (existingUser) {
      ctx.warehouseUserId = existingUser.id;
    }

    ctx.warehouseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: loginError } = await ctx.warehouseClient.auth.signInWithPassword({
      email: WAREHOUSE_EMAIL,
      password: WAREHOUSE_PASSWORD,
    });

    if (loginError) throw loginError;
  });

  afterEach(async () => {
    if (ctx.warehouseClient) {
      await ctx.warehouseClient.auth.signOut();
    }
  });

  it('should NOT allow seeing other vendor orders (when vendor_id column exists)', async () => {
    const { data } = await ctx.warehouseClient.rpc('warehouse_get_orders', {
      p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // When vendor_id column exists in orders table, this will only return
    // orders for the vendor specified in warehouse_staff
    expect(data).toBeDefined();

    // TODO: Add assertion when vendor_id column exists
    // For now, this test documents the requirement
  });

  it('should validate warehouse_staff membership in RPC functions', async () => {
    // Try to call RPC without warehouse_staff membership
    // (user has role but no warehouse_staff record)

    // Create user with role but NO warehouse_staff record
    const { data: tempUser } = await ctx.adminClient.auth.admin.createUser({
      email: `temp-${Date.now()}@test.haldeki.com`,
      password: WAREHOUSE_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Temp Warehouse',
        role: 'warehouse_manager',
      },
    });

    if (tempUser) {
      await ctx.adminClient.from('profiles').insert({
        id: tempUser.user.id,
        email: `temp-${Date.now()}@test.haldeki.com`,
        full_name: 'Temp Warehouse',
        phone: '0532 000 00 00',
      });

      await ctx.adminClient.from('user_roles').insert({
        user_id: tempUser.user.id,
        role: 'warehouse_manager',
      });

      // Login as temp user
      const tempClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      await tempClient.auth.signInWithPassword({
        email: `temp-${Date.now()}@test.haldeki.com`,
        password: WAREHOUSE_PASSWORD,
      });

      // Try to call RPC - should fail because no warehouse_staff record
      const { error } = await tempClient.rpc('warehouse_get_orders', {
        p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeDefined();
      expect(error?.message).toMatch(/unauthorized|not.*warehouse staff/i);

      // Cleanup
      await ctx.adminClient.auth.admin.deleteUser(tempUser.user.id);
      await tempClient.auth.signOut();
    }
  });
});
