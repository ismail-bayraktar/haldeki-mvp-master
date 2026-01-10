/**
 * Hook: Get lowest price for cart operations
 *
 * Updated for New Pricing System Redesign
 *
 * Finds the best price across:
 * 1. Supplier products (if available) - NEW: Uses calculate_product_price RPC
 * 2. Region products (fallback) - LEGACY: Backward compatible
 *
 * Returns supplier info to pass to addToCart for tracking
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PriceCalculationResult } from '@/types/pricing';

export interface CartPriceInfo {
  supplierId: string;
  supplierProductId: string;
  supplierName: string;
  priceSource: 'supplier' | 'region' | 'product';
  price: number;
  priceResult?: PriceCalculationResult; // New pricing system result
}

export function useLowestPriceForCart(
  productId: string,
  regionId: string | null,
  customerType: 'b2b' | 'b2c' = 'b2c' // Default to B2C
) {
  // Fetch supplier products for this product
  const { data: supplierProducts, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['product-suppliers', productId],
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase.rpc('get_product_suppliers', {
        p_product_id: productId,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch region price as fallback (LEGACY)
  const { data: regionPrice, isLoading: isLoadingRegion } = useQuery({
    queryKey: ['region-product-price', productId, regionId],
    queryFn: async () => {
      if (!productId || !regionId) return null;

      const { data, error } = await supabase
        .from('region_products')
        .select('*')
        .eq('product_id', productId)
        .eq('region_id', regionId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!productId && !!regionId,
    staleTime: 5 * 60 * 1000,
  });

  // Determine lowest price and source
  const priceInfo: CartPriceInfo | null = (() => {
    if (!supplierProducts?.length && !regionPrice) {
      return null;
    }

    // Find lowest price among suppliers using new RPC function
    if (supplierProducts && supplierProducts.length > 0 && regionId) {
      // Try to use new pricing system
      const lowestSupplier = supplierProducts.reduce((min: { price: number }, current: { price: number }) =>
        current.price < min.price ? current : min
      );

      return {
        supplierId: lowestSupplier.supplier_id,
        supplierProductId: lowestSupplier.supplier_product_id,
        supplierName: lowestSupplier.supplier_name,
        priceSource: 'supplier' as const,
        price: lowestSupplier.price, // Base price, final price calculated in RPC
        // Note: PriceCalculationResult should be fetched by caller using useProductPrice
      };
    }

    // Fallback to region price
    if (regionPrice) {
      return {
        supplierId: '',
        supplierProductId: '',
        supplierName: '',
        priceSource: 'region' as const,
        price: regionPrice.price,
      };
    }

    return null;
  })();

  return {
    data: priceInfo,
    isLoading: isLoadingSuppliers || isLoadingRegion,
  };
}
