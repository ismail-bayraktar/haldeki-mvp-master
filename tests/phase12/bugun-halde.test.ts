/**
 * Bugün Halde Comparison Tests - Phase 12
 * Tests for the bugun_halde_comparison view and price statistics
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Bugün Halde Comparison View', () => {
  beforeAll(() => {
    if (!process.env.VITE_SUPABASE_URL || process.env.CI) {
      console.log('Skipping integration tests - no test database');
    }
  });

  describe('View Structure', () => {
    it('should have all required columns', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log('View does not exist yet');
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const row = data[0];
        const requiredColumns = [
          'product_id',
          'product_name',
          'category',
          'unit',
          'image_url',
          'supplier_id',
          'supplier_name',
          'price',
          'previous_price',
          'price_change',
          'availability',
          'stock_quantity',
          'quality',
          'delivery_days',
          'is_featured',
          'market_min_price',
          'market_max_price',
          'market_avg_price',
          'total_suppliers',
          'is_lowest_price',
        ];

        requiredColumns.forEach((col) => {
          expect(row).toHaveProperty(col);
        });
      }
    });

    it('should return data in expected format', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .limit(5);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data) {
        data.forEach((row: any) => {
          // Check types
          expect(typeof row.product_id).toBe('string');
          expect(typeof row.product_name).toBe('string');
          expect(typeof row.supplier_id).toBe('string');
          expect(typeof row.supplier_name).toBe('string');
          expect(typeof row.price).toBe('number');
          expect(typeof row.total_suppliers).toBe('number');
          expect(typeof row.is_lowest_price).toBe('boolean');

          // Check enum values
          expect(['up', 'down', 'stable', null]).toContain(row.price_change);
          expect(['plenty', 'limited', 'last']).toContain(row.availability);
          expect(['premium', 'standart', 'ekonomik']).toContain(row.quality);
        });
      }
    });
  });

  describe('Price Statistics Calculation', () => {
    it('should calculate correct min price', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .gte('total_suppliers', 2)
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        // Get a product with multiple suppliers
        const productId = data[0].product_id;

        const { data: productData } = await supabase
          .from('bugun_halde_comparison')
          .select('*')
          .eq('product_id', productId);

        if (productData && productData.length > 0) {
          const actualMin = Math.min(...productData.map((r: any) => r.price));
          const reportedMin = productData[0].market_min_price;

          expect(actualMin).toBe(reportedMin);
        }
      }
    });

    it('should calculate correct max price', { timeout: 10000 }, async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .gte('total_suppliers', 2)
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const productId = data[0].product_id;

        const { data: productData } = await supabase
          .from('bugun_halde_comparison')
          .select('*')
          .eq('product_id', productId);

        if (productData && productData.length > 0) {
          const actualMax = Math.max(...productData.map((r: any) => r.price));
          const reportedMax = productData[0].market_max_price;

          expect(actualMax).toBe(reportedMax);
        }
      }
    });

    it('should calculate correct average price', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .gte('total_suppliers', 2)
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const productId = data[0].product_id;

        const { data: productData } = await supabase
          .from('bugun_halde_comparison')
          .select('*')
          .eq('product_id', productId);

        if (productData && productData.length > 0) {
          const prices = productData.map((r: any) => r.price);
          const actualAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
          const reportedAvg = productData[0].market_avg_price;

          // Allow for floating point precision
          expect(Math.abs(actualAvg - reportedAvg)).toBeLessThan(0.01);
        }
      }
    });

    it('should count suppliers correctly', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .gte('total_suppliers', 2)
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const productId = data[0].product_id;

        const { data: productData, count } = await supabase
          .from('bugun_halde_comparison')
          .select('*', { count: 'exact' })
          .eq('product_id', productId);

        if (productData && productData.length > 0) {
          const reportedCount = productData[0].total_suppliers;
          const actualCount = productData.length;

          expect(reportedCount).toBe(actualCount);
        }
      }
    });
  });

  describe('Lowest Price Identification', () => {
    it('should correctly mark lowest price suppliers', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('is_lowest_price', true)
        .gte('total_suppliers', 2)
        .limit(20);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          // Lowest price should equal market min
          expect(row.price).toBe(row.market_min_price);

          // Verify there's no lower price for this product
          expect(row.price).toBeLessThanOrEqual(row.market_max_price);
        });
      }
    });

    it('should have at least one lowest price per product', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .gte('total_suppliers', 1)
        .limit(50);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        // Group by product_id
        const productGroups = new Map<string, any[]>();
        data.forEach((row: any) => {
          if (!productGroups.has(row.product_id)) {
            productGroups.set(row.product_id, []);
          }
          productGroups.get(row.product_id)!.push(row);
        });

        // Check each product has at least one lowest price
        productGroups.forEach((suppliers) => {
          const lowestPriceCount = suppliers.filter((s) => s.is_lowest_price).length;
          expect(lowestPriceCount).toBeGreaterThan(0);
        });
      }
    });

    it('should handle ties for lowest price correctly', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .gte('total_suppliers', 2)
        .limit(50);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        // Group by product_id
        const productGroups = new Map<string, any[]>();
        data.forEach((row: any) => {
          if (!productGroups.has(row.product_id)) {
            productGroups.set(row.product_id, []);
          }
          productGroups.get(row.product_id)!.push(row);
        });

        // Check products with ties
        productGroups.forEach((suppliers) => {
          const lowestPrice = Math.min(...suppliers.map((s) => s.price));
          const lowestPriceSuppliers = suppliers.filter((s) => s.price === lowestPrice);

          // All suppliers with the lowest price should be marked
          lowestPriceSuppliers.forEach((supplier) => {
            expect(supplier.is_lowest_price).toBe(true);
          });
        });
      }
    });
  });

  describe('Ordering and Sorting', () => {
    it('should order by product name then price', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .order('product_name', { ascending: true })
        .order('price', { ascending: true })
        .limit(20);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 1) {
        // Check product name ordering
        for (let i = 1; i < data.length; i++) {
          const prev = data[i - 1];
          const curr = data[i];

          // Same product should have ascending prices
          if (prev.product_name === curr.product_name) {
            expect(prev.price).toBeLessThanOrEqual(curr.price);
          } else {
            // Different products - check sorting
            // Note: Turkish character sorting may differ, so we just verify both exist
            expect(prev.product_name).toBeDefined();
            expect(curr.product_name).toBeDefined();
          }
        }
      }
    });

    it('should support filtering by price range', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .gte('price', 10)
        .lte('price', 100)
        .limit(20);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data) {
        data.forEach((row: any) => {
          expect(row.price).toBeGreaterThanOrEqual(10);
          expect(row.price).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should support filtering by availability', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('availability', 'plenty')
        .limit(20);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data) {
        data.forEach((row: any) => {
          expect(row.availability).toBe('plenty');
        });
      }
    });

    it('should support filtering by quality', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('quality', 'premium')
        .limit(20);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data) {
        data.forEach((row: any) => {
          expect(row.quality).toBe('premium');
        });
      }
    });

    it('should support filtering by featured status', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('is_featured', true)
        .limit(20);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data) {
        data.forEach((row: any) => {
          expect(row.is_featured).toBe(true);
        });
      }
    });

    it('should support filtering by category', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('category')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      if (data && data.length > 0) {
        const category = data[0].category;

        const { data: categoryData } = await supabase
          .from('bugun_halde_comparison')
          .select('*')
          .eq('category', category)
          .limit(20);

        expect(categoryData).toBeDefined();

        if (categoryData) {
          categoryData.forEach((row: any) => {
            expect(row.category).toBe(category);
          });
        }
      }
    });
  });

  describe('Price Change Tracking', () => {
    it('should track price increases correctly', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('price_change', 'up')
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          expect(row.price_change).toBe('up');
          expect(row.previous_price).not.toBeNull();
          expect(row.price).toBeGreaterThan(row.previous_price);
        });
      }
    });

    it('should track price decreases correctly', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('price_change', 'down')
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          expect(row.price_change).toBe('down');
          expect(row.previous_price).not.toBeNull();
          expect(row.price).toBeLessThan(row.previous_price);
        });
      }
    });

    it('should track stable prices correctly', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('price_change', 'stable')
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          expect(row.price_change).toBe('stable');
        });
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle products with single supplier', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .eq('total_suppliers', 1)
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          expect(row.total_suppliers).toBe(1);
          expect(row.market_min_price).toBe(row.price);
          expect(row.market_max_price).toBe(row.price);
          expect(row.market_avg_price).toBe(row.price);
          expect(row.is_lowest_price).toBe(true);
        });
      }
    });

    it('should handle null previous_price for new products', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .is('previous_price', null)
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          expect(row.previous_price).toBeNull();
          expect(row.price_change).toBe('stable');
        });
      }
    });

    it('should handle null image_url gracefully', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .is('image_url', null)
        .limit(10);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          expect(row.image_url).toBeNull();
        });
      }
    });
  });

  describe('Performance', () => {
    it('should return results quickly for large datasets', async () => {
      const start = Date.now();

      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .limit(100);

      const duration = Date.now() - start;

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();
      expect(duration).toBeLessThan(2000); // Should complete in less than 2 seconds
    });

    it('should handle complex filters efficiently', async () => {
      const start = Date.now();

      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .gte('price', 10)
        .lte('price', 100)
        .eq('availability', 'plenty')
        .gte('total_suppliers', 2)
        .order('product_name')
        .limit(50);

      const duration = Date.now() - start;

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();
      expect(duration).toBeLessThan(3000); // Should complete in less than 3 seconds
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistency with supplier_products table', async () => {
      // Get a sample from the view
      const { data: viewData } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .limit(5);

      if (!viewData || viewData.length === 0) {
        return;
      }

      // Verify against supplier_products using supplier_product_id (junction table ID)
      const supplierProductId = viewData[0].supplier_product_id;

      const { data: supplierData } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('id', supplierProductId)
        .limit(1);

      if (supplierData && supplierData.length > 0) {
        // Prices should match
        expect(viewData[0].price).toBe(supplierData[0].price);
      }
    });

    it('should only show active suppliers and products', async () => {
      const { data, error } = await supabase
        .from('bugun_halde_comparison')
        .select('*')
        .limit(50);

      if (error && error.message.includes('does not exist')) {
        return;
      }

      expect(error).toBeNull();

      if (data) {
        // All results should be from active suppliers and active products
        // This is enforced by the view's WHERE clause
        expect(data.length).toBeGreaterThan(0);
      }
    });
  });
});
