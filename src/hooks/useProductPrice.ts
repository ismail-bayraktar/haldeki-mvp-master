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

  return useQuery<PriceCalculationResult | null>({
    queryKey: ['product-price', productId, regionId, customerType, variationId, supplierId],
    queryFn: async () => {
      // Validate inputs
      if (!productId) {
        return null;
      }
      if (!regionId) {
        return null;
      }

      try {
        // Call RPC function
        // Note: RPC parameters must match migration schema exactly
        const { data, error } = await supabase.rpc('calculate_product_price', {
          p_product_id: productId,
          p_region_id: regionId,
          p_supplier_id: supplierId || null,
          p_user_role: customerType, // FIXED: was p_customer_type
          p_variation_ids: variationId ? [variationId] : null, // FIXED: was p_variation_id (now array)
        });

        if (error) {
          console.error('RPC error calculating product price:', error);
          // Return null instead of throwing - let component handle fallback
          return null;
        }

        if (!data) {
          console.warn('No price data returned for product:', productId);
          return null;
        }

        // RPC returns a single record or null
        return data as PriceCalculationResult;
      } catch (err) {
        console.error('Error in useProductPrice:', err);
        // Return null instead of throwing - let component handle fallback
        return null;
      }
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

  return useQuery<Record<string, PriceCalculationResult | null>>({
    queryKey: ['product-prices', productIds, regionId, customerType],
    queryFn: async () => {
      if (!productIds.length || !regionId) {
        return {};
      }

      try {
        // Fetch all prices in parallel
        const results = await Promise.allSettled(
          productIds.map((productId) =>
            supabase.rpc('calculate_product_price', {
              p_product_id: productId,
              p_region_id: regionId,
              p_supplier_id: null,
              p_user_role: customerType, // FIXED: was p_customer_type
              p_variation_ids: null, // FIXED: was p_variation_id (now array)
            })
          )
        );

        const prices: Record<string, PriceCalculationResult | null> = {};

        results.forEach((result, index) => {
          const productId = productIds[index];

          if (result.status === 'fulfilled' && result.value.data) {
            prices[productId] = result.value.data as PriceCalculationResult;
          } else {
            console.warn(`Failed to fetch price for product ${productId}`);
            prices[productId] = null;
          }
        });

        return prices;
      } catch (err) {
        console.error('Error in useProductPrices:', err);
        // Return empty object instead of throwing
        return {};
      }
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

      try {
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
          try {
            const { data: priceResult, error } = await supabase.rpc('calculate_product_price', {
              p_product_id: productId,
              p_region_id: regionId,
              p_supplier_id: supplier.supplier_id,
              p_user_role: customerType, // FIXED: was p_customer_type
              p_variation_ids: null, // FIXED: was p_variation_id (now array)
            });

            if (error || !priceResult) {
              console.warn(`Failed to calculate price for supplier ${supplier.supplier_id}`);
              continue;
            }

            if (!lowestPrice || priceResult.final_price < lowestPrice.final_price) {
              lowestPrice = priceResult as PriceCalculationResult;
              lowestSupplier = supplier;
            }
          } catch (err) {
            console.warn(`Error calculating price for supplier ${supplier.supplier_id}:`, err);
            continue;
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
      } catch (err) {
        console.error('Error in useLowestPriceForCart:', err);
        return null;
      }
    },
    enabled: !!productId && !!regionId && !!customerType,
    staleTime: 2 * 60 * 1000,
  });
}
