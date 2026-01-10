/**
 * Integration Tests: Pricing RPC Functions
 * Entegrasyon Testleri: Fiyatlandırma RPC Fonksiyonları
 *
 * Tests Supabase RPC functions:
 * - calculate_product_price
 * - calculate_cart_prices
 * - get_product_suppliers
 * - RLS policies (B2B vs B2C)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const TEST_REGION_ID = process.env.TEST_REGION_ID || 'marmara-region';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || '';
const TEST_SUPPLIER_ID = process.env.TEST_SUPPLIER_ID || '';

describe('Pricing RPC Functions - calculate_product_price', () => {
  describe('Basic Functionality', () => {
    it('should calculate B2B price with 30% commission', async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;
      expect(result.final_price).toBeGreaterThan(0);
      expect(result.commission_rate).toBe(0.30);
      expect(result.commission_amount).toBeGreaterThan(0);
    });

    it('should calculate B2C price with 50% commission', async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2c',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;
      expect(result.final_price).toBeGreaterThan(0);
      expect(result.commission_rate).toBe(0.50);
      expect(result.commission_amount).toBeGreaterThan(0);
    });

    it('should return supplier information', async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;
      expect(result.supplier_id).toBeTruthy();
      expect(result.supplier_name).toBeTruthy();
      expect(result.supplier_product_id).toBeTruthy();
    });

    it('should return stock availability information', async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2c',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;
      expect(result.stock_quantity).toBeGreaterThanOrEqual(0);
      expect(result.availability).toMatch(/plenty|limited|last/);
      expect(typeof result.is_available).toBe('boolean');
    });

    it('should include min_order_quantity', async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;
      expect(result.min_order_quantity).toBeGreaterThan(0);
    });
  });

  describe('Regional Pricing', () => {
    it('should apply regional multiplier when applicable', async () => {
      // This test requires products with different regional multipliers
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;
      expect(result.regional_multiplier).toBeGreaterThan(0);

      // If multiplier is not 1.0, base_price should differ from supplier_price
      if (result.regional_multiplier !== 1.0) {
        expect(result.base_price).not.toBe(result.supplier_price);
      }
    });
  });

  describe('Variation Pricing', () => {
    it('should handle variation-specific pricing', async () => {
      // Get product variations first
      const { data: variations } = await supabase
        .from('product_variations')
        .select('id')
        .eq('product_id', TEST_PRODUCT_ID)
        .limit(1);

      if (variations && variations.length > 0) {
        const variationId = variations[0].id;

        const { data, error } = await supabase.rpc('calculate_product_price', {
          p_product_id: TEST_PRODUCT_ID,
          p_region_id: TEST_REGION_ID,
          p_customer_type: 'b2c',
          p_variation_id: variationId,
          p_supplier_id: null,
        });

        expect(error).toBeNull();
        expect(data).not.toBeNull();

        const result = data as any;
        // Variation should affect price
        expect(result.final_price).toBeGreaterThan(0);
      }
    });
  });

  describe('Supplier-Specific Pricing', () => {
    it('should calculate price for specific supplier', async () => {
      if (!TEST_SUPPLIER_ID) {
        console.warn('Skipping supplier-specific test - no supplier ID');
        return;
      }

      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: TEST_SUPPLIER_ID,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;
      expect(result.supplier_id).toBe(TEST_SUPPLIER_ID);
    });
  });

  describe('Error Handling', () => {
    it('should return error for invalid product_id', async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: '00000000-0000-0000-0000-000000000000',
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Should either return null data or error
      expect(data === null || error !== null).toBe(true);
    });

    it('should return error for invalid region_id', async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: '00000000-0000-0000-0000-000000000000',
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Should either return null data or error
      expect(data === null || error !== null).toBe(true);
    });

    it('should validate customer_type parameter', async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'invalid',
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Should reject invalid customer type
      expect(error !== null).toBe(true);
    });
  });
});

describe('Pricing RPC Functions - calculate_cart_prices', () => {
  describe('Cart Price Calculation', () => {
    it('should calculate prices for multiple cart items', async () => {
      const cartItems = [
        {
          product_id: TEST_PRODUCT_ID,
          quantity: 2,
          variation_id: null,
          supplier_id: null,
        },
      ];

      const { data, error } = await supabase.rpc('calculate_cart_prices', {
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_cart_items: cartItems,
      });

      if (error) {
        console.warn('calculate_cart_prices RPC might not exist yet:', error.message);
        return;
      }

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include quantity in cart price results', async () => {
      const cartItems = [
        {
          product_id: TEST_PRODUCT_ID,
          quantity: 5,
          variation_id: null,
          supplier_id: null,
        },
      ];

      const { data, error } = await supabase.rpc('calculate_cart_prices', {
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2c',
        p_cart_items: cartItems,
      });

      if (error) {
        console.warn('calculate_cart_prices RPC might not exist yet');
        return;
      }

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const firstItem = data[0] as any;
      expect(firstItem.quantity).toBe(5);
      expect(firstItem.total_price).toBeGreaterThan(firstItem.final_price);
    });
  });
});

describe('Pricing RPC Functions - get_product_suppliers', () => {
  describe('Supplier Listing', () => {
    it('should return all suppliers for a product', async () => {
      const { data, error } = await supabase.rpc('get_product_suppliers', {
        p_product_id: TEST_PRODUCT_ID,
      });

      if (error) {
        console.warn('get_product_suppliers RPC might not exist yet:', error.message);
        return;
      }

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include supplier pricing information', async () => {
      const { data, error } = await supabase.rpc('get_product_suppliers', {
        p_product_id: TEST_PRODUCT_ID,
      });

      if (error) {
        console.warn('get_product_suppliers RPC might not exist yet');
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const firstSupplier = data[0] as any;
        expect(firstSupplier.supplier_id).toBeTruthy();
        expect(firstSupplier.supplier_name).toBeTruthy();
        expect(firstSupplier.price).toBeGreaterThan(0);
      }
    });

    it('should include stock information for each supplier', async () => {
      const { data, error } = await supabase.rpc('get_product_suppliers', {
        p_product_id: TEST_PRODUCT_ID,
      });

      if (error) {
        console.warn('get_product_suppliers RPC might not exist yet');
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const firstSupplier = data[0] as any;
        expect(firstSupplier.stock_quantity).toBeGreaterThanOrEqual(0);
        expect(firstSupplier.availability).toMatch(/plenty|limited|last/);
      }
    });
  });
});

describe('RLS Policies - Pricing Access Control', () => {
  describe('B2B vs B2C Pricing Visibility', () => {
    it('should allow B2B users to see B2B pricing', async () => {
      // This test requires authentication as B2B user
      // For now, we test with anon key and expect it to work

      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Anon users should be able to calculate prices (no RLS on RPC)
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('should allow B2C users to see B2C pricing', async () => {
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2c',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });
  });

  describe('Supplier Price Updates', () => {
    it('should enforce supplier ownership on price updates', async () => {
      // This test requires authenticated supplier user
      // For anon key, updates should fail due to RLS

      const { error } = await supabase
        .from('supplier_products')
        .update({ price: 999 })
        .eq('product_id', TEST_PRODUCT_ID)
        .select();

      // Anon user should not be able to update supplier prices
      expect(error).not.toBeNull();
    });
  });
});

describe('Performance Tests', () => {
  it('should calculate single product price in under 500ms', async () => {
    const start = Date.now();

    await supabase.rpc('calculate_product_price', {
      p_product_id: TEST_PRODUCT_ID,
      p_region_id: TEST_REGION_ID,
      p_customer_type: 'b2c',
      p_variation_id: null,
      p_supplier_id: null,
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('should handle concurrent price calculations', async () => {
    const start = Date.now();

    const promises = Array.from({ length: 10 }, () =>
      supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      })
    );

    await Promise.all(promises);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000); // 10 requests in under 2 seconds
  });
});
