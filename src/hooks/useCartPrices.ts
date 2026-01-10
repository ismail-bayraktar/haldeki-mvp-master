/**
 * Cart Prices Hook (New Pricing System)
 *
 * Yeni pricing sistemi için sepet fiyat hesaplama hook'u.
 * Cart price calculation hook for the new pricing system.
 *
 * Uses calculate_cart_prices RPC function for accurate pricing.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CartPriceCalculationResult } from '@/types/pricing';

export interface CartItemInput {
  productId: string;
  quantity: number;
  variationId?: string | null;
  supplierId?: string | null;
}

export function useCartPrices(params: {
  regionId: string | null;
  customerType: 'b2b' | 'b2c';
  cartItems: CartItemInput[];
  enabled?: boolean;
}) {
  const { regionId, customerType, cartItems, enabled = true } = params;

  return useQuery<CartPriceCalculationResult[]>({
    queryKey: ['cart-prices', regionId, customerType, cartItems],
    queryFn: async () => {
      if (!regionId || cartItems.length === 0) {
        return [];
      }

      // Call RPC function for each cart item
      const results = await Promise.allSettled(
        cartItems.map((item) =>
          supabase.rpc('calculate_product_price', {
            p_product_id: item.productId,
            p_region_id: regionId,
            p_customer_type: customerType,
            p_variation_id: item.variationId || null,
            p_supplier_id: item.supplierId || null,
          })
        )
      );

      const cartPrices: CartPriceCalculationResult[] = [];

      results.forEach((result, index) => {
        const cartItem = cartItems[index];

        if (result.status === 'fulfilled' && result.value.data) {
          const priceResult = result.value.data as PriceCalculationResult;
          cartPrices.push({
            ...priceResult,
            quantity: cartItem.quantity,
            total_price: priceResult.final_price * cartItem.quantity,
          });
        } else {
          console.warn(`Failed to calculate price for cart item ${cartItem.productId}`);
        }
      });

      return cartPrices;
    },
    enabled: enabled && !!regionId && cartItems.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    retry: 1, // Only retry once
  });
}

/**
 * Hook: Get cart total using new pricing system
 */
export function useCartTotal(params: {
  regionId: string | null;
  customerType: 'b2b' | 'b2c';
  cartItems: CartItemInput[];
  enabled?: boolean;
}) {
  const { data: cartPrices = [] } = useCartPrices(params);

  const cartTotal = cartPrices.reduce((sum, item) => sum + item.total_price, 0);

  return {
    cartTotal,
    cartPrices,
    isLoading: params.enabled && params.regionId !== null && params.cartItems.length > 0,
  };
}
