/**
 * Hook: Get lowest price for cart operations
 *
 * Phase 12 Cart Context Migration - Task 1.2
 *
 * Finds the best price across:
 * 1. Supplier products (if available)
 * 2. Region products (fallback)
 *
 * Returns supplier info to pass to addToCart for tracking
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CartPriceInfo {
  supplierId: string;
  supplierProductId: string;
  supplierName: string;
  priceSource: 'supplier' | 'region';
  price: number;
}

export function useLowestPriceForCart(productId: string, regionId: string | null) {
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

  // Fetch region price as fallback
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

    // Find lowest price among suppliers
    const lowestSupplier = supplierProducts && supplierProducts.length > 0
      ? supplierProducts.reduce((min: any, current: any) =>
          current.price < min.price ? current : min
        )
      : null;

    // Compare with region price
    const regionPriceValue = regionPrice?.price ?? Infinity;

    if (lowestSupplier && lowestSupplier.price <= regionPriceValue) {
      return {
        supplierId: lowestSupplier.supplier_id,
        supplierProductId: lowestSupplier.supplier_product_id,
        supplierName: lowestSupplier.supplier_name,
        priceSource: 'supplier' as const,
        price: lowestSupplier.price,
      };
    }

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
