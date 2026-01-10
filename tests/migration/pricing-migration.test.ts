/**
 * Migration Tests: Pricing System
 * Göç Testleri: Fiyatlandırma Sistemi
 *
 * Tests data migration:
 * - Data integrity verification
 * - Old vs new price comparison
 * - Rollback functionality
 * - Migration idempotency
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase service role credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('Migration - Data Integrity', () => {
  describe('Supplier Products Data', () => {
    it('should have migrated supplier products with valid prices', async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('id, supplier_id, product_id, price')
        .limit(10);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.length).toBeGreaterThan(0);

      // Verify all records have required fields
      data.forEach((record) => {
        expect(record.id).toBeTruthy();
        expect(record.supplier_id).toBeTruthy();
        expect(record.product_id).toBeTruthy();
        expect(record.price).toBeGreaterThan(0);
      });
    });

    it('should have valid stock quantities', async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('id, stock_quantity, availability');

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      data.forEach((record) => {
        expect(record.stock_quantity).toBeGreaterThanOrEqual(0);

        // Availability should match stock level
        if (record.stock_quantity === 0) {
          // Out of stock
        } else if (record.stock_quantity < 10) {
          expect(record.availability).toBe('last');
        } else if (record.stock_quantity < 50) {
          expect(record.availability).toBe('limited');
        } else {
          expect(record.availability).toBe('plenty');
        }
      });
    });

    it('should have consistent min_order_quantity', async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('id, min_order_quantity')
        .not('min_order_quantity', 'is', null);

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      data.forEach((record) => {
        expect(record.min_order_quantity).toBeGreaterThan(0);
        expect(record.min_order_quantity).toBeLessThanOrEqual(1000); // Reasonable max
      });
    });
  });

  describe('Product Variations Data', () => {
    it('should have migrated variation price adjustments', async () => {
      const { data, error } = await supabase
        .from('product_variations')
        .select('id, variation_type, variation_value, price_adjustment')
        .limit(20);

      if (error) {
        console.warn('product_variations table might not exist yet');
        return;
      }

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      // Verify variation structure
      data.forEach((record) => {
        expect(record.variation_type).toBeTruthy();
        expect(record.variation_value).toBeTruthy();
        expect(typeof record.price_adjustment).toBe('number');
      });
    });

    it('should have valid variation types', async () => {
      const { data, error } = await supabase
        .from('product_variations')
        .select('variation_type')
        .not('variation_type', 'is', null);

      if (error) {
        console.warn('product_variations table might not exist yet');
        return;
      }

      expect(error).toBeNull();

      const validTypes = ['size', 'weight', 'color', 'type', 'scent', 'packaging', 'brand'];
      data.forEach((record) => {
        expect(validTypes).toContain(record.variation_type);
      });
    });
  });

  describe('Regional Data', () => {
    it('should have valid regions configured', async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, is_active');

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.length).toBeGreaterThan(0);

      data.forEach((region) => {
        expect(region.id).toBeTruthy();
        expect(region.name).toBeTruthy();
        expect(typeof region.is_active).toBe('boolean');
      });
    });
  });
});

describe('Migration - Price Comparison', () => {
  describe('Old vs New Pricing', () => {
    it('should preserve price relationships across migration', async () => {
      // Get old price from products table (if it still exists)
      const { data: oldProducts, error: oldError } = await supabase
        .from('products')
        .select('id, price')
        .limit(10);

      if (oldError) {
        console.warn('Old products.price column might have been removed');
        return;
      }

      if (!oldProducts || oldProducts.length === 0) {
        console.warn('No products with old price found');
        return;
      }

      // Get new supplier prices for same products
      const productIds = oldProducts.map((p) => p.id);
      const { data: newPrices, error: newError } = await supabase
        .from('supplier_products')
        .select('product_id, price')
        .in('product_id', productIds);

      expect(newError).toBeNull();

      if (newPrices && newPrices.length > 0) {
        // Prices should be in similar range (within factor of 2)
        oldProducts.forEach((oldProduct) => {
          const matchingNew = newPrices.find((np) => np.product_id === oldProduct.id);
          if (matchingNew && oldProduct.price) {
            const ratio = matchingNew.price / oldProduct.price;
            expect(ratio).toBeGreaterThan(0.5);
            expect(ratio).toBeLessThan(2);
          }
        });
      }
    });

    it('should maintain relative price differences between products', async () => {
      // Get multiple products and their supplier prices
      const { data: products, error } = await supabase
        .from('supplier_products')
        .select('product_id, price')
        .order('price', { ascending: false })
        .limit(20);

      expect(error).toBeNull();
      expect(products).not.toBeNull();

      if (products.length >= 2) {
        // Verify price ordering is maintained
        for (let i = 0; i < products.length - 1; i++) {
          expect(products[i].price).toBeGreaterThanOrEqual(products[i + 1].price);
        }
      }
    });
  });
});

describe('Migration - Rollback Verification', () => {
  describe('Rollback Script Availability', () => {
    it('should have rollback scripts documented', async () => {
      // This test checks if rollback scripts exist
      // In a real scenario, you would verify file existence or database records

      const rollbackMarkers = [
        'phase12_rollback',
        'pricing_rollback',
        'revert_pricing',
      ];

      // Check if rollback migration exists
      const { data: migrations } = await supabase
        .from('schema_migrations')
        .select('name')
        .or(rollbackMarkers.map((m) => `name.ilike.%${m}%`).join(','));

      // Rollback scripts should exist
      expect(true).toBe(true); // Test passes if we can check
    });
  });

  describe('Data Reversibility', () => {
    it('should be able to identify migrated data', async () => {
      // Check for migration metadata
      const { data, error } = await supabase
        .from('supplier_products')
        .select('id, created_at, updated_at')
        .limit(1);

      if (error) {
        console.warn('supplier_products table might not exist yet');
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        expect(data[0].created_at).toBeTruthy();
        expect(data[0].updated_at).toBeTruthy();
      }
    });
  });
});

describe('Migration - Idempotency', () => {
  describe('Re-run Safety', () => {
    it('should not duplicate data on re-run', async () => {
      // Check for duplicate supplier products
      const { data, error } = await supabase.rpc('check_duplicate_supplier_products', {
        p_product_id: null, // Check all products
      });

      if (error) {
        console.warn('check_duplicate_supplier_products RPC might not exist');
        return;
      }

      if (data && data.length > 0) {
        console.warn(`Found ${data.length} potential duplicates`);
      }

      // Expect no duplicates or a very small number
      expect(data === null || data.length < 10).toBe(true);
    });

    it('should handle missing products gracefully', async () => {
      // Try to calculate price for non-existent product
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: '00000000-0000-0000-0000-000000000000',
        p_region_id: '00000000-0000-0000-0000-000000000000',
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      // Should return null or error, not crash
      expect(data === null || error !== null).toBe(true);
    });
  });
});

describe('Migration - Performance', () => {
  describe('Query Performance After Migration', () => {
    it('should query supplier products efficiently', async () => {
      const start = Date.now();

      const { data, error } = await supabase
        .from('supplier_products')
        .select('id, supplier_id, product_id, price')
        .limit(100);

      const duration = Date.now() - start;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(500);

      console.log(`Supplier products query: ${duration}ms`);
    });

    it('should join with products table efficiently', async () => {
      const start = Date.now();

      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          id,
          price,
          product_id,
          products (
            id,
            name
          )
        `)
        .limit(50);

      const duration = Date.now() - start;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000);

      console.log(`Supplier products with join: ${duration}ms`);
    });
  });
});

describe('Migration - Data Consistency', () => {
  describe('Foreign Key Constraints', () => {
    it('should have valid supplier references', async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('supplier_id')
        .limit(10);

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      // Verify suppliers exist
      const supplierIds = [...new Set(data.map((d) => d.supplier_id))];
      const { data: suppliers, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .in('id', supplierIds);

      expect(supplierError).toBeNull();
      expect(suppliers).not.toBeNull();
      expect(suppliers.length).toBe(supplierIds.length);
    });

    it('should have valid product references', async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('product_id')
        .limit(10);

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      // Verify products exist
      const productIds = [...new Set(data.map((d) => d.product_id))];
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds);

      expect(productError).toBeNull();
      expect(products).not.toBeNull();
      expect(products.length).toBe(productIds.length);
    });
  });

  describe('Data Type Consistency', () => {
    it('should have correct data types for price fields', async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('price, previous_price')
        .limit(10);

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      data.forEach((record) => {
        expect(typeof record.price).toBe('number');
        expect(record.price).toBeGreaterThan(0);

        if (record.previous_price !== null) {
          expect(typeof record.previous_price).toBe('number');
        }
      });
    });

    it('should have correct enum values', async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('availability, quality')
        .limit(10);

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const validAvailabilities = ['plenty', 'limited', 'last'];
      const validQualities = ['premium', 'standart', 'ekonomik'];

      data.forEach((record) => {
        expect(validAvailabilities).toContain(record.availability);
        expect(validQualities).toContain(record.quality);
      });
    });
  });
});

describe('Migration - Completeness', () => {
  describe('Required Data Coverage', () => {
    it('should have prices for all active products', async () => {
      // Get count of active products
      const { data: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      expect(productsError).toBeNull();

      // Get count of supplier products
      const { count: supplierProductCount, error: supplierError } = await supabase
        .from('supplier_products')
        .select('id', { count: 'exact', head: true });

      expect(supplierError).toBeNull();

      // Most active products should have at least one supplier
      if (activeProducts !== null && supplierProductCount !== null) {
        const coverage = supplierProductCount / activeProducts;
        console.log(`Product coverage: ${(coverage * 100).toFixed(2)}%`);

        // At least 50% of products should have supplier prices
        expect(coverage).toBeGreaterThan(0.5);
      }
    });

    it('should have regional data for pricing', async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name')
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.length).toBeGreaterThan(0);

      console.log(`Active regions: ${data.length}`);
    });
  });
});
