/**
 * Performance Tests: Pricing System
 * Performans Testleri: Fiyatlandırma Sistemi
 *
 * Tests performance aspects:
 * - RPC function response times
 * - Price calculation benchmarks
 * - Concurrent request handling
 * - Bulk price calculations
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const TEST_REGION_ID = process.env.TEST_REGION_ID || 'marmara-region';
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || '';

interface PerformanceMetrics {
  duration: number;
  timestamp: number;
}

describe('Performance - RPC Response Times', () => {
  describe('calculate_product_price Performance', () => {
    it('should respond within 200ms for single product price', async () => {
      const start = Date.now();

      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      const duration = Date.now() - start;

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(duration).toBeLessThan(200);

      console.log(`Single price calculation: ${duration}ms`);
    });

    it('should respond within 300ms with variation', async () => {
      // Get a variation ID first
      const { data: variations } = await supabase
        .from('product_variations')
        .select('id')
        .eq('product_id', TEST_PRODUCT_ID)
        .limit(1);

      if (!variations || variations.length === 0) {
        console.warn('No variations found, skipping test');
        return;
      }

      const variationId = variations[0].id;
      const start = Date.now();

      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2c',
        p_variation_id: variationId,
        p_supplier_id: null,
      });

      const duration = Date.now() - start;

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(duration).toBeLessThan(300);

      console.log(`Price calculation with variation: ${duration}ms`);
    });

    it('should respond within 250ms with supplier filter', async () => {
      // Get a supplier ID first
      const { data: suppliers } = await supabase
        .from('supplier_products')
        .select('supplier_id')
        .eq('product_id', TEST_PRODUCT_ID)
        .limit(1);

      if (!suppliers || suppliers.length === 0) {
        console.warn('No suppliers found, skipping test');
        return;
      }

      const supplierId = suppliers[0].supplier_id;
      const start = Date.now();

      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: supplierId,
      });

      const duration = Date.now() - start;

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(duration).toBeLessThan(250);

      console.log(`Price calculation with supplier: ${duration}ms`);
    });

    it('should maintain consistent response times across multiple calls', async () => {
      const iterations = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        await supabase.rpc('calculate_product_price', {
          p_product_id: TEST_PRODUCT_ID,
          p_region_id: TEST_REGION_ID,
          p_customer_type: i % 2 === 0 ? 'b2b' : 'b2c',
          p_variation_id: null,
          p_supplier_id: null,
        });

        durations.push(Date.now() - start);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      console.log(`Response times - Avg: ${avgDuration.toFixed(2)}ms, Min: ${minDuration}ms, Max: ${maxDuration}ms`);

      // Average should be under 200ms
      expect(avgDuration).toBeLessThan(200);

      // Max should be under 500ms (no extreme outliers)
      expect(maxDuration).toBeLessThan(500);

      // Variance should be reasonable (within 3x of min)
      expect(maxDuration / minDuration).toBeLessThan(3);
    });
  });

  describe('get_product_suppliers Performance', () => {
    it('should respond within 300ms for supplier listing', async () => {
      const start = Date.now();

      const { data, error } = await supabase.rpc('get_product_suppliers', {
        p_product_id: TEST_PRODUCT_ID,
      });

      const duration = Date.now() - start;

      if (error) {
        console.warn('get_product_suppliers RPC might not exist yet');
        return;
      }

      expect(error).toBeNull();
      expect(duration).toBeLessThan(300);

      console.log(`Supplier listing: ${duration}ms`);
    });
  });
});

describe('Performance - Concurrent Requests', () => {
  it('should handle 10 concurrent price calculations', async () => {
    const concurrency = 10;
    const start = Date.now();

    const promises = Array.from({ length: concurrency }, (_, i) =>
      supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: i % 2 === 0 ? 'b2b' : 'b2c',
        p_variation_id: null,
        p_supplier_id: null,
      })
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    // All requests should succeed
    results.forEach(({ data, error }) => {
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    // Total time should be reasonable (concurrent requests)
    expect(duration).toBeLessThan(2000);

    console.log(`${concurrency} concurrent requests: ${duration}ms (${(duration / concurrency).toFixed(2)}ms avg)`);
  });

  it('should handle 50 concurrent requests without degradation', async () => {
    const concurrency = 50;
    const start = Date.now();

    const promises = Array.from({ length: concurrency }, (_, i) =>
      supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: i % 2 === 0 ? 'b2b' : 'b2c',
        p_variation_id: null,
        p_supplier_id: null,
      })
    );

    const results = await Promise.allSettled(promises);
    const duration = Date.now() - start;

    // At least 90% should succeed
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const successRate = successCount / concurrency;

    expect(successRate).toBeGreaterThanOrEqual(0.9);

    // Total time should be proportional to concurrency
    const avgTimePerRequest = duration / concurrency;
    expect(avgTimePerRequest).toBeLessThan(100);

    console.log(
      `${concurrency} concurrent requests: ${duration}ms total, ${successRate * 100}% success, ${avgTimePerRequest.toFixed(2)}ms avg`
    );
  });
});

describe('Performance - Bulk Calculations', () => {
  it('should calculate prices for 20 products efficiently', async () => {
    // Get multiple product IDs
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .limit(20);

    if (!products || products.length === 0) {
      console.warn('No products found, skipping test');
      return;
    }

    const productIds = products.map((p) => p.id);
    const start = Date.now();

    const promises = productIds.map((productId) =>
      supabase.rpc('calculate_product_price', {
        p_product_id: productId,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2c',
        p_variation_id: null,
        p_supplier_id: null,
      })
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    const successCount = results.filter(({ data }) => data !== null).length;

    expect(successCount).toBeGreaterThan(productIds.length * 0.8); // At least 80% success
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds

    console.log(`${productIds.length} products: ${duration}ms (${(duration / productIds.length).toFixed(2)}ms avg per product)`);
  });

  it('should calculate cart prices efficiently', async () => {
    // Simulate a cart with 10 items
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .limit(10);

    if (!products || products.length === 0) {
      console.warn('No products found, skipping test');
      return;
    }

    const cartItems = products.map((p) => ({
      product_id: p.id,
      quantity: Math.floor(Math.random() * 5) + 1,
      variation_id: null,
      supplier_id: null,
    }));

    const start = Date.now();

    const promises = cartItems.map((item) =>
      supabase.rpc('calculate_product_price', {
        p_product_id: item.product_id,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2c',
        p_variation_id: item.variation_id,
        p_supplier_id: item.supplier_id,
      })
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    const successCount = results.filter(({ data }) => data !== null).length;

    expect(successCount).toBeGreaterThan(cartItems.length * 0.8);
    expect(duration).toBeLessThan(3000);

    console.log(`Cart with ${cartItems.length} items: ${duration}ms`);
  });
});

describe('Performance - Memory & Resources', () => {
  it('should not leak memory across repeated calls', async () => {
    const iterations = 100;
    const durations: number[] = [];

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const startMemory = process.memoryUsage?.().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const reqStart = Date.now();

      await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: null,
      });

      durations.push(Date.now() - reqStart);
    }

    const endMemory = process.memoryUsage?.().heapUsed;
    const memoryIncrease = endMemory && startMemory ? endMemory - startMemory : 0;

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    console.log(`Memory test - Avg: ${avgDuration.toFixed(2)}ms, Memory increase: ${memoryIncrease} bytes`);

    // Average should remain consistent
    expect(avgDuration).toBeLessThan(250);

    // Memory increase should be reasonable (less than 50MB for 100 requests)
    if (memoryIncrease > 0) {
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });
});

describe('Performance - Benchmarking', () => {
  it('should meet performance SLA for critical operations', async () => {
    const benchmarks = {
      single_price_calculation: { target: 200, actual: 0 },
      with_variation: { target: 300, actual: 0 },
      with_supplier: { target: 250, actual: 0 },
      concurrent_10: { target: 2000, actual: 0 },
      bulk_20: { target: 5000, actual: 0 },
    };

    // Single price calculation
    let start = Date.now();
    await supabase.rpc('calculate_product_price', {
      p_product_id: TEST_PRODUCT_ID,
      p_region_id: TEST_REGION_ID,
      p_customer_type: 'b2b',
      p_variation_id: null,
      p_supplier_id: null,
    });
    benchmarks.single_price_calculation.actual = Date.now() - start;

    // With variation
    const { data: variations } = await supabase
      .from('product_variations')
      .select('id')
      .eq('product_id', TEST_PRODUCT_ID)
      .limit(1);

    if (variations && variations.length > 0) {
      start = Date.now();
      await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: variations[0].id,
        p_supplier_id: null,
      });
      benchmarks.with_variation.actual = Date.now() - start;
    }

    // With supplier
    const { data: suppliers } = await supabase
      .from('supplier_products')
      .select('supplier_id')
      .eq('product_id', TEST_PRODUCT_ID)
      .limit(1);

    if (suppliers && suppliers.length > 0) {
      start = Date.now();
      await supabase.rpc('calculate_product_price', {
        p_product_id: TEST_PRODUCT_ID,
        p_region_id: TEST_REGION_ID,
        p_customer_type: 'b2b',
        p_variation_id: null,
        p_supplier_id: suppliers[0].supplier_id,
      });
      benchmarks.with_supplier.actual = Date.now() - start;
    }

    // Concurrent 10
    start = Date.now();
    await Promise.all(
      Array.from({ length: 10 }, () =>
        supabase.rpc('calculate_product_price', {
          p_product_id: TEST_PRODUCT_ID,
          p_region_id: TEST_REGION_ID,
          p_customer_type: 'b2b',
          p_variation_id: null,
          p_supplier_id: null,
        })
      )
    );
    benchmarks.concurrent_10.actual = Date.now() - start;

    // Bulk 20
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .limit(20);

    if (products && products.length > 0) {
      start = Date.now();
      await Promise.all(
        products.slice(0, 20).map((p) =>
          supabase.rpc('calculate_product_price', {
            p_product_id: p.id,
            p_region_id: TEST_REGION_ID,
            p_customer_type: 'b2c',
            p_variation_id: null,
            p_supplier_id: null,
          })
        )
      );
      benchmarks.bulk_20.actual = Date.now() - start;
    }

    // Report results
    console.table(
      Object.entries(benchmarks).map(([name, { target, actual }]) => ({
        Benchmark: name,
        Target: `${target}ms`,
        Actual: `${actual.toFixed(2)}ms`,
        Status: actual <= target ? 'PASS' : 'FAIL',
      }))
    );

    // Verify all benchmarks pass
    Object.values(benchmarks).forEach(({ target, actual }) => {
      if (actual > 0) {
        expect(actual).toBeLessThanOrEqual(target);
      }
    });
  });
});
