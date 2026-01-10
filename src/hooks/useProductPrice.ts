/**
 * Product Price Hook (New Pricing System)
 *
 * Yeni pricing sistemi için ürün fiyatı sorgulama hook'u.
 * Product price query hook for the new pricing system.
 *
 * Uses calculate_product_price RPC function for accurate pricing.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PriceCalculationResult } from '@/types/pricing';
import type { CustomerType } from '@/types/pricing';

/**
 * Hook: Get calculated price for a product
 *
 * Fetches price using calculate_product_price RPC function.
 * Returns complete pricing information including commission breakdown.
 */
export function useProductPrice(params: {
  productId: string;
  regionId: string | null;
  customerType: CustomerType;
  variationId?: string | null;
  supplierId?: string | null;
  enabled?: boolean;
}) {
  const {
    productId,
    regionId,
    customerType,
    variationId,
    supplierId,
    enabled = true,
  } = params;

  return useQuery<PriceCalculationResult>({
    queryKey: ['product-price', productId, regionId, customerType, variationId, supplierId],
    queryFn: async () => {
      // Validate inputs
      if (!productId) {
        throw new Error('Product ID is required');
      }
      if (!regionId) {
        throw new Error('Region ID is required');
      }

      // Call RPC function
      const { data, error } = await supabase.rpc('calculate_product_price', {
        p_product_id: productId,
        p_region_id: regionId,
        p_customer_type: customerType,
        p_variation_id: variationId || null,
        p_supplier_id: supplierId || null,
      });

      if (error) {
        console.error('RPC error calculating product price:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No price data returned');
      }

      // RPC returns a single record or null
      return data as PriceCalculationResult;
    },
    enabled:
      enabled &&
      !!productId &&
      !!regionId &&
      !!customerType &&
      ['b2b', 'b2c'].includes(customerType),
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    retry: 1, // Only retry once
  });
}

/**
 * Hook: Get prices for multiple products (batch)
 *
 * Fetches prices for multiple products in a single query.
 * Useful for product listing pages.
 */
export function useProductPrices(params: {
  productIds: string[];
  regionId: string | null;
  customerType: CustomerType;
  enabled?: boolean;
}) {
  const { productIds, regionId, customerType, enabled = true } = params;

  return useQuery<Record<string, PriceCalculationResult>>({
    queryKey: ['product-prices', productIds, regionId, customerType],
    queryFn: async () => {
      if (!productIds.length || !regionId) {
        return {};
      }

      // Fetch all prices in parallel
      const results = await Promise.allSettled(
        productIds.map((productId) =>
          supabase.rpc('calculate_product_price', {
            p_product_id: productId,
            p_region_id: regionId,
            p_customer_type: customerType,
            p_variation_id: null,
            p_supplier_id: null,
          })
        )
      );

      const prices: Record<string, PriceCalculationResult> = {};

      results.forEach((result, index) => {
        const productId = productIds[index];

        if (result.status === 'fulfilled' && result.value.data) {
          prices[productId] = result.value.data as PriceCalculationResult;
        } else {
          console.warn(`Failed to fetch price for product ${productId}`);
        }
      });

      return prices;
    },
    enabled: enabled && productIds.length > 0 && !!regionId && !!customerType,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Get lowest price for cart operations
 *
 * Finds the best price across all suppliers for a product.
 * Returns supplier info to pass to addToCart for tracking.
 *
 * NOTE: This is an updated version that uses the new pricing system.
 */
export function useLowestPriceForCart(params: {
  productId: string;
  regionId: string | null;
  customerType: CustomerType;
}) {
  const { productId, regionId, customerType } = params;

  return useQuery<{
    supplierId: string;
    supplierName: string;
    supplierProductId: string;
    price: number;
    priceResult: PriceCalculationResult;
  } | null>({
    queryKey: ['lowest-cart-price', productId, regionId, customerType],
    queryFn: async () => {
      if (!productId || !regionId) {
        return null;
      }

      // Get product suppliers first
      const { data: suppliers, error: suppliersError } = await supabase.rpc(
        'get_product_suppliers',
        {
          p_product_id: productId,
        }
      );

      if (suppliersError) {
        console.error('Error fetching product suppliers:', suppliersError);
        return null;
      }

      if (!suppliers || suppliers.length === 0) {
        return null;
      }

      // Calculate price for each supplier and find the lowest
      let lowestPrice: PriceCalculationResult | null = null;
      let lowestSupplier: { supplier_id: string; supplier_name: string } | null = null;

      for (const supplier of suppliers) {
        const { data: priceResult, error } = await supabase.rpc('calculate_product_price', {
          p_product_id: productId,
          p_region_id: regionId,
          p_customer_type: customerType,
          p_supplier_id: supplier.supplier_id,
          p_variation_id: null,
        });

        if (error || !priceResult) {
          console.warn(`Failed to calculate price for supplier ${supplier.supplier_id}`);
          continue;
        }

        if (!lowestPrice || priceResult.final_price < lowestPrice.final_price) {
          lowestPrice = priceResult as PriceCalculationResult;
          lowestSupplier = supplier;
        }
      }

      if (!lowestPrice || !lowestSupplier) {
        return null;
      }

      return {
        supplierId: lowestSupplier.supplier_id,
        supplierName: lowestSupplier.supplier_name,
        supplierProductId: lowestSupplier.supplier_product_id,
        price: lowestPrice.final_price,
        priceResult: lowestPrice,
      };
    },
    enabled: !!productId && !!regionId && !!customerType,
    staleTime: 2 * 60 * 1000,
  });
}
