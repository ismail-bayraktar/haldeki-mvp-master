/**
 * Picking List Unit Tests
 *
 * Tests for:
 * - Unit conversion (adet → kg)
 * - Aggregation logic
 * - Status filtering (Confirmed+ only)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const WAREHOUSE_EMAIL = 'warehouse@test.haldeki.com';
const WAREHOUSE_PASSWORD = 'Test1234!';

describe('Picking List Aggregation', () => {
  let adminClient: any;
  let warehouseClient: any;
  let warehouseUserId: string | null = null;

  beforeAll(async () => {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get or create warehouse user
    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', WAREHOUSE_EMAIL)
      .single();

    if (existingUser) {
      warehouseUserId = existingUser.id;
    }
  });

  beforeEach(async () => {
    warehouseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: loginError } = await warehouseClient.auth.signInWithPassword({
      email: WAREHOUSE_EMAIL,
      password: WAREHOUSE_PASSWORD,
    });

    if (loginError) throw loginError;
  });

  afterEach(async () => {
    await warehouseClient.auth.signOut();
  });

  describe('Unit Conversion (adet → kg)', () => {
    it('should convert adet to kg using conversion_factor', async () => {
      // Create test products with different units
      const { data: productKg } = await adminClient
        .from('products')
        .insert({
          name: 'Test Domates',
          unit: 'kg',
          conversion_factor: 1.0,
          category: 'sebze',
        })
        .select('id')
        .single();

      const { data: productAdet } = await adminClient
        .from('products')
        .insert({
          name: 'Test Salatalık',
          unit: 'adet',
          conversion_factor: 0.5, // 1 adet = 0.5 kg
          category: 'sebze',
        })
        .select('id')
        .single();

      // Create test orders
      const now = new Date().toISOString();

      // Order 1: 10 kg Domates
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'confirmed',
        total_price: 100,
        items: JSON.stringify([
          {
            product_id: productKg?.id,
            product_name: 'Test Domates',
            quantity: 10,
            unit: 'kg',
            unit_price: 10,
            total_price: 100,
          },
        ]),
        placed_at: now,
      });

      // Order 2: 20 adet Salatalık (should be 10 kg)
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'confirmed',
        total_price: 100,
        items: JSON.stringify([
          {
            product_id: productAdet?.id,
            product_name: 'Test Salatalık',
            quantity: 20,
            unit: 'adet',
            unit_price: 5,
            total_price: 100,
          },
        ]),
        placed_at: now,
      });

      // Get picking list
      const { data, error } = await warehouseClient.rpc('warehouse_get_picking_list', {
        p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const domates = data?.find((item: any) => item.product_name === 'Test Domates');
      const salatalik = data?.find((item: any) => item.product_name === 'Test Salatalık');

      // Domates: 10 kg (no conversion)
      expect(domates?.total_quantity_kg).toBeCloseTo(10, 1);
      expect(domates?.order_count).toBe(1);

      // Salatalık: 20 adet × 0.5kg = 10kg
      expect(salatalik?.total_quantity_kg).toBeCloseTo(10, 1);
      expect(salatalik?.order_count).toBe(1);

      // Cleanup
      await adminClient.from('orders').delete().eq('user_id', warehouseUserId);
      await adminClient.from('products').delete().in('id', [productKg?.id, productAdet?.id]);
    });

    it('should handle missing conversion_factor (default to 1.0)', async () => {
      const { data: product } = await adminClient
        .from('products')
        .insert({
          name: 'Test Avokado',
          unit: 'adet',
          // conversion_factor NOT SET (should default to 1.0)
          category: 'meyve',
        })
        .select('id')
        .single();

      const now = new Date().toISOString();

      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'confirmed',
        total_price: 100,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Avokado',
            quantity: 5,
            unit: 'adet',
            unit_price: 20,
            total_price: 100,
          },
        ]),
        placed_at: now,
      });

      const { data } = await warehouseClient.rpc('warehouse_get_picking_list', {
        p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const avokado = data?.find((item: any) => item.product_name === 'Test Avokado');

      // 5 adet × 1.0 (default) = 5kg
      expect(avokado?.total_quantity_kg).toBeCloseTo(5, 1);

      // Cleanup
      await adminClient.from('orders').delete().eq('user_id', warehouseUserId);
      await adminClient.from('products').delete().eq('id', product?.id);
    });

    it('should aggregate same product across multiple orders', async () => {
      const { data: product } = await adminClient
        .from('products')
        .insert({
          name: 'Test Patates',
          unit: 'kg',
          conversion_factor: 1.0,
          category: 'sebze',
        })
        .select('id')
        .single();

      const now = new Date().toISOString();

      // Order 1: 5 kg
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'confirmed',
        total_price: 50,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Patates',
            quantity: 5,
            unit: 'kg',
            unit_price: 10,
            total_price: 50,
          },
        ]),
        placed_at: now,
      });

      // Order 2: 7 kg
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'confirmed',
        total_price: 70,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Patates',
            quantity: 7,
            unit: 'kg',
            unit_price: 10,
            total_price: 70,
          },
        ]),
        placed_at: now,
      });

      // Order 3: 3 kg
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'confirmed',
        total_price: 30,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Patates',
            quantity: 3,
            unit: 'kg',
            unit_price: 10,
            total_price: 30,
          },
        ]),
        placed_at: now,
      });

      const { data } = await warehouseClient.rpc('warehouse_get_picking_list', {
        p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const patates = data?.find((item: any) => item.product_name === 'Test Patates');

      // 5 + 7 + 3 = 15 kg
      expect(patates?.total_quantity_kg).toBeCloseTo(15, 1);
      expect(patates?.order_count).toBe(3);

      // Cleanup
      await adminClient.from('orders').delete().eq('user_id', warehouseUserId);
      await adminClient.from('products').delete().eq('id', product?.id);
    });
  });

  describe('Status Filtering (Confirmed+ Only)', () => {
    it('should only include Confirmed+ orders (not pending)', async () => {
      const { data: product } = await adminClient
        .from('products')
        .insert({
          name: 'Test Soğan',
          unit: 'kg',
          conversion_factor: 1.0,
          category: 'sebze',
        })
        .select('id')
        .single();

      const now = new Date().toISOString();

      // Pending order (should NOT be in picking list)
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'pending',
        total_price: 50,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Soğan',
            quantity: 5,
            unit: 'kg',
            unit_price: 10,
            total_price: 50,
          },
        ]),
        placed_at: now,
      });

      // Confirmed order (should be in picking list)
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'confirmed',
        total_price: 70,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Soğan',
            quantity: 7,
            unit: 'kg',
            unit_price: 10,
            total_price: 70,
          },
        ]),
        placed_at: now,
      });

      const { data } = await warehouseClient.rpc('warehouse_get_picking_list', {
        p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const sogan = data?.find((item: any) => item.product_name === 'Test Soğan');

      // Only confirmed order counted: 7 kg (NOT 12 kg)
      expect(sogan?.total_quantity_kg).toBeCloseTo(7, 1);
      expect(sogan?.order_count).toBe(1);

      // Cleanup
      await adminClient.from('orders').delete().eq('user_id', warehouseUserId);
      await adminClient.from('products').delete().eq('id', product?.id);
    });

    it('should include preparing and prepared orders', async () => {
      const { data: product } = await adminClient
        .from('products')
        .insert({
          name: 'Test Sarımsak',
          unit: 'kg',
          conversion_factor: 1.0,
          category: 'sebze',
        })
        .select('id')
        .single();

      const now = new Date().toISOString();

      // Preparing order
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'preparing',
        total_price: 30,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Sarımsak',
            quantity: 3,
            unit: 'kg',
            unit_price: 10,
            total_price: 30,
          },
        ]),
        placed_at: now,
      });

      // Prepared order
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'prepared',
        total_price: 40,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Sarımsak',
            quantity: 4,
            unit: 'kg',
            unit_price: 10,
            total_price: 40,
          },
        ]),
        placed_at: now,
      });

      const { data } = await warehouseClient.rpc('warehouse_get_picking_list', {
        p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const sarimsak = data?.find((item: any) => item.product_name === 'Test Sarımsak');

      // 3 + 4 = 7 kg (both included)
      expect(sarimsak?.total_quantity_kg).toBeCloseTo(7, 1);
      expect(sarimsak?.order_count).toBe(2);

      // Cleanup
      await adminClient.from('orders').delete().eq('user_id', warehouseUserId);
      await adminClient.from('products').delete().eq('id', product?.id);
    });
  });

  describe('Time Window Filtering', () => {
    it('should only return orders within time window', async () => {
      const { data: product } = await adminClient
        .from('products')
        .insert({
          name: 'Test Biber',
          unit: 'kg',
          conversion_factor: 1.0,
          category: 'sebze',
        })
        .select('id')
        .single();

      const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const today = new Date().toISOString();

      // Order from yesterday (OUTSIDE window)
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'confirmed',
        total_price: 50,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Biber',
            quantity: 5,
            unit: 'kg',
            unit_price: 10,
            total_price: 50,
          },
        ]),
        placed_at: yesterday,
      });

      // Order from today (INSIDE window)
      await adminClient.from('orders').insert({
        user_id: warehouseUserId,
        status: 'confirmed',
        total_price: 70,
        items: JSON.stringify([
          {
            product_id: product?.id,
            product_name: 'Test Biber',
            quantity: 7,
            unit: 'kg',
            unit_price: 10,
            total_price: 70,
          },
        ]),
        placed_at: today,
      });

      // Query for last 24 hours only
      const { data } = await warehouseClient.rpc('warehouse_get_picking_list', {
        p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const biber = data?.find((item: any) => item.product_name === 'Test Biber');

      // Only today's order: 7 kg (NOT 12 kg)
      expect(biber?.total_quantity_kg).toBeCloseTo(7, 1);
      expect(biber?.order_count).toBe(1);

      // Cleanup
      await adminClient.from('orders').delete().eq('user_id', warehouseUserId);
      await adminClient.from('products').delete().eq('id', product?.id);
    });
  });
});

describe('Warehouse Orders RPC', () => {
  let adminClient: any;
  let warehouseClient: any;
  let warehouseUserId: string | null = null;

  beforeAll(async () => {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', WAREHOUSE_EMAIL)
      .single();

    if (existingUser) {
      warehouseUserId = existingUser.id;
    }
  });

  beforeEach(async () => {
    warehouseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: loginError } = await warehouseClient.auth.signInWithPassword({
      email: WAREHOUSE_EMAIL,
      password: WAREHOUSE_PASSWORD,
    });

    if (loginError) throw loginError;
  });

  afterEach(async () => {
    await warehouseClient.auth.signOut();
  });

  it('should return orders with customer info and items (NO prices)', async () => {
    const now = new Date().toISOString();

    await adminClient.from('orders').insert({
      user_id: warehouseUserId,
      status: 'confirmed',
      total_price: 100,
      items: JSON.stringify([
        {
          product_id: '00000000-0000-0000-0000-000000000001',
          product_name: 'Test Ürün',
          quantity: 5,
          unit: 'kg',
          unit_price: 20,
          total_price: 100,
        },
      ]),
      placed_at: now,
      order_number: 'TEST-001',
    });

    const { data, error } = await warehouseClient.rpc('warehouse_get_orders', {
      p_window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      p_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);

    const order = data[0];

    // Check required fields
    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('order_number');
    expect(order).toHaveProperty('status');
    expect(order).toHaveProperty('placed_at');
    expect(order).toHaveProperty('customer_name');
    expect(order).toHaveProperty('customer_phone');
    expect(order).toHaveProperty('items');

    // Check items structure
    expect(order.items).toBeDefined();
    expect(order.items.length).toBeGreaterThan(0);

    const item = order.items[0];
    expect(item).toHaveProperty('product_id');
    expect(item).toHaveProperty('product_name');
    expect(item).toHaveProperty('quantity');
    expect(item).toHaveProperty('unit');
    expect(item).toHaveProperty('quantity_kg');

    // Check NO prices
    expect(order).not.toHaveProperty('total_price');
    expect(item).not.toHaveProperty('unit_price');
    expect(item).not.toHaveProperty('total_price');

    // Cleanup
    await adminClient.from('orders').delete().eq('user_id', warehouseUserId);
  });
});
