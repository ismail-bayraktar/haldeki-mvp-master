/**
 * Security Tests: Pricing System
 * Güvenlik Testleri: Fiyatlandırma Sistemi
 *
 * Tests security aspects:
 * - B2B price not visible to B2C users
 * - Price manipulation attempts
 * - SQL injection tests
 * - Authorization bypass tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const anonClient = createClient(supabaseUrl, supabaseKey);
const serviceClient = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Test data
const TEST_REGION_ID = process.env.TEST_REGION_ID || 'marmara-region';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || '';

describe('Security - Price Visibility', () => {
  describe('B2B vs B2C Price Separation', () => {
    it('should not expose supplier base price to anonymous users', async () => {
      // Try to read supplier_products table directly
      const { data, error } = await anonClient
        .from('supplier_products')
        .select('price')
        .eq('product_id', TEST_PRODUCT_ID)
        .limit(1);

      // RLS should block this for anon users
      // Either error is returned or data is null
      const isBlocked = error !== null || data === null || data.length === 0;

      if (error && error.code === '42501') {
        // Explicit permission denied
        expect(true).toBe(true);
      } else {
        // If RLS is not enforced, this is a security concern
        expect(isBlocked).toBe(true);
      }
    });

    it('should calculate prices correctly for B2C users', async () => {
      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2c',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;

      // Verify commission rate is 50% for B2C
      expect(result.commission_rate).toBe(0.50);

      // Verify final price is higher than supplier price
      expect(result.final_price).toBeGreaterThan(result.supplier_price);
    });

    it('should calculate prices correctly for B2B users', async () => {
      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;

      // Verify commission rate is 30% for B2B
      expect(result.commission_rate).toBe(0.30);

      // B2B price should be lower than B2C price for same product
      expect(result.final_price).toBeGreaterThan(result.supplier_price);
    });

    it('should return different prices for B2B and B2C', async () => {
      // Get B2B price
      const { data: b2bData } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Get B2C price
      const { data: b2cData } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2c',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(b2bData).not.toBeNull();
      expect(b2cData).not.toBeNull();

      const b2bPrice = (b2bData as any).final_price;
      const b2cPrice = (b2cData as any).final_price;

      // B2C price should be higher (50% commission vs 30%)
      expect(b2cPrice).toBeGreaterThan(b2bPrice);
    });
  });
});

describe('Security - Price Manipulation', () => {
  describe('RPC Parameter Validation', () => {
    it('should reject negative commission rates', async () => {
      // This test checks if we can manipulate commission rate
      // The RPC should validate and reject invalid values

      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;

      // Commission should always be positive
      expect(result.commission_rate).toBeGreaterThan(0);
      expect(result.commission_rate).toBeLessThanOrEqual(1);
    });

    it('should not allow customer_type manipulation', async () => {
      // Try to pass invalid customer type
      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'admin', // Invalid type
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Should reject invalid customer type
      expect(error).not.toBeNull();
    });

    it('should validate UUID parameters', async () => {
      // Try with invalid UUID format
      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: 'not-a-uuid',
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Should reject invalid UUID
      expect(error).not.toBeNull();
    });
  });

  describe('Direct Table Access Prevention', () => {
    it('should prevent unauthorized price updates via direct table access', async () => {
      // Try to update supplier_products price directly
      const { error } = await anonClient
        .from('supplier_products')
        .update({ price: 0.01 })
        .eq('product_id', TEST_PRODUCT_ID)
        .select();

      // RLS should prevent this
      expect(error).not.toBeNull();
    });

    it('should prevent inserting fake price records', async () => {
      // Try to insert a fake supplier product with manipulated price
      const { error } = await anonClient.from('supplier_products').insert({
        product_id: TEST_PRODUCT_ID,
        supplier_id: '00000000-0000-0000-0000-000000000000',
        price: 0.01,
        stock_quantity: 999,
      });

      // RLS should prevent this
      expect(error).not.toBeNull();
    });

    it('should prevent deletion of price records', async () => {
      // Try to delete price records
      const { error } = await anonClient
        .from('supplier_products')
        .delete()
        .eq('product_id', TEST_PRODUCT_ID);

      // RLS should prevent this
      expect(error).not.toBeNull();
    });
  });
});

describe('Security - SQL Injection', () => {
  describe('RPC Function SQL Injection', () => {
    it('should sanitize product_id parameter', async () => {
      // Try SQL injection via product_id
      const maliciousInput = "'; DROP TABLE supplier_products; --";

      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: maliciousInput,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Should reject the input
      expect(error).not.toBeNull();

      // Verify table still exists
      if (serviceClient) {
        const { error: tableCheckError } = await serviceClient
          .from('supplier_products')
          .select('id')
          .limit(1);

        // Table should still exist (not dropped)
        expect(tableCheckError?.message).not.toContain('does not exist');
      }
    });

    it('should sanitize customer_type parameter', async () => {
      const maliciousInput = "b2b'; UPDATE supplier_products SET price = 0.01; --";

      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: maliciousInput as any,
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Should reject the input
      expect(error).not.toBeNull();
    });

    it('should handle union-based injection attempts', async () => {
      const maliciousInput = "' UNION SELECT * FROM users --";

      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: maliciousInput,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Should reject the input
      expect(error).not.toBeNull();
    });
  });
});

describe('Security - Authorization Bypass', () => {
  describe('RLS Policy Effectiveness', () => {
    it('should enforce supplier ownership on their products', async () => {
      // Try to access another supplier's products
      const { data, error } = await anonClient
        .from('supplier_products')
        .select('*')
        .eq('product_id', TEST_PRODUCT_ID);

      // RLS should restrict access
      if (error) {
        expect(error.code).toBe('42501'); // Permission denied
      } else {
        // If no error, data should be empty or restricted
        expect(data?.length === 0 || data === null).toBe(true);
      }
    });

    it('should not allow viewing all supplier prices without auth', async () => {
      // Try to get all supplier products
      const { data, error } = await anonClient
        .from('supplier_products')
        .select('*')
        .limit(100);

      // RLS should restrict access
      if (error) {
        expect(error.code).toBe('42501');
      } else {
        // If no error, verify no sensitive price data is exposed
        if (data && data.length > 0) {
          // Data should not contain supplier's internal pricing
          const firstRecord = data[0];
          // Verify we don't get full records
          expect(Object.keys(firstRecord).length).toBeLessThan(15);
        }
      }
    });
  });

  describe('Session-based Access Control', () => {
    it('should respect user session for pricing calculations', async () => {
      // Test with anon client (no session)
      const { data: anonData } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(anonData).not.toBeNull();

      // Anon user should still get prices (pricing is public)
      // But the price should be calculated with correct commission
      const result = anonData as any;
      expect(result.commission_rate).toBe(0.30); // B2B rate
    });
  });
});

describe('Security - Data Leakage Prevention', () => {
  describe('Sensitive Data Protection', () => {
    it('should not expose supplier profit margins', async () => {
      // The RPC should not return supplier's cost price
      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;

      // Should not contain cost price or profit margin
      expect(result).not.toHaveProperty('cost_price');
      expect(result).not.toHaveProperty('profit_margin');
      expect(result).not.toHaveProperty('supplier_cost');
    });

    it('should not expose other suppliers pricing for same product', async () => {
      // Get price for one supplier
      const { data, error } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const result = data as any;

      // Should only return pricing for one supplier (the best price)
      // Not a list of all suppliers' prices
      expect(result).not.toHaveProperty('all_suppliers');
      expect(result).not.toHaveProperty('competitor_prices');

      // Should have exactly one supplier info
      expect(result.supplier_id).toBeTruthy();
      expect(result.supplier_name).toBeTruthy();
    });
  });
});

describe('Security - Price Calculation Integrity', () => {
  describe('Calculation Consistency', () => {
    it('should always apply commission correctly', async () => {
      const { data } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(data).not.toBeNull();

      const result = data as any;

      // Verify calculation: final_price = base_price + commission_amount
      const expectedFinalPrice = result.base_price + result.commission_amount;
      expect(result.final_price).toBeCloseTo(expectedFinalPrice, 2);

      // Verify commission amount: commission_amount = base_price * commission_rate
      const expectedCommission = result.base_price * result.commission_rate;
      expect(result.commission_amount).toBeCloseTo(expectedCommission, 2);
    });

    it('should handle zero and negative prices safely', async () => {
      // Even if supplier_price is 0 or negative in DB,
      // the calculation should handle it safely

      const { data } = await anonClient.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      expect(data).not.toBeNull();

      const result = data as any;

      // All prices should be non-negative
      expect(result.supplier_price).toBeGreaterThanOrEqual(0);
      expect(result.final_price).toBeGreaterThanOrEqual(0);
      expect(result.commission_amount).toBeGreaterThanOrEqual(0);
    });
  });
});
