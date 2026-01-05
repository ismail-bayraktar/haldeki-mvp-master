// Hook for repeat order functionality (Faz 8)

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useRegion } from '@/contexts/RegionContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  validateOrderForRepeat,
  formatPrice,
  getUnavailableReasonMessage,
} from '@/lib/orderUtils';
import type { OrderItem, RepeatOrderValidationResult, RepeatOrderResult, Product } from '@/types';

interface UseRepeatOrderReturn {
  validateOrder: (orderId: string) => Promise<RepeatOrderValidationResult>;
  repeatOrder: (validation: RepeatOrderValidationResult) => Promise<RepeatOrderResult>;
  isValidation: boolean;
  isRepeating: boolean;
}

/**
 * Hook for validating and repeating previous orders
 */
export const useRepeatOrder = (): UseRepeatOrderReturn => {
  const [isValidation, setIsValidation] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);

  const { addToCart } = useCart();
  const { selectedRegion } = useRegion();
  const { user, isBusiness } = useAuth();
  const navigate = useNavigate();

  /**
   * Validates an order for repetition
   * @param orderId - ID of the order to validate
   * @returns Validation result with available/unavailable items
   */
  const validateOrder = useCallback(async (orderId: string): Promise<RepeatOrderValidationResult> => {
    if (!user?.id) {
      toast.error('Lütfen önce giriş yapın');
      throw new Error('User not authenticated');
    }

    if (!selectedRegion) {
      toast.error('Lütfen önce bir bölge seçin');
      throw new Error('Region not selected');
    }

    setIsValidation(true);

    try {
      // Fetch order data
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, items, region_id')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        throw new Error('Sipariş bulunamadı');
      }

      const orderItems = Array.isArray(order.items)
        ? (order.items as unknown as OrderItem[])
        : [];

      // Check if region has changed
      if (order.region_id !== selectedRegion.id) {
        return {
          canRepeat: false,
          availableItems: [],
          unavailableItems: orderItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            reason: 'region_changed' as const,
          })),
          totalOldPrice: 0,
          totalNewPrice: 0,
          priceDifference: 0,
          priceIncreased: false,
        };
      }

      // Validate items
      const validation = await validateOrderForRepeat(
        orderItems,
        selectedRegion.id,
        isBusiness
      );

      return validation;
    } catch (error) {
      console.error('Error validating order:', error);
      toast.error('Sipariş doğrulanamadı');
      throw error;
    } finally {
      setIsValidation(false);
    }
  }, [user, selectedRegion, isBusiness]);

  /**
   * Adds validated items to cart
   * @param validation - Validation result from validateOrder
   * @param orderItems - Original order items (for fallback)
   * @returns Result with success status and counts
   */
  const repeatOrder = useCallback(async (
    validation: RepeatOrderValidationResult,
    orderItems: OrderItem[]
  ): Promise<RepeatOrderResult> => {
    if (!validation.canRepeat) {
      return {
        success: false,
        addedToCartCount: 0,
        skippedCount: validation.unavailableItems.length,
        message: 'Tekrar sipariş için uygun ürün bulunamadı',
      };
    }

    setIsRepeating(true);

    try {
      // Fetch product details for available items
      const productIds = validation.availableItems.map(item => item.productId);

      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (!products) {
        throw new Error('Ürün bilgileri alınamadı');
      }

      const productMap = new Map(
        products.map((p: Product) => [p.id, p])
      );

      // Add each available item to cart
      let addedCount = 0;
      const warnings: string[] = [];

      for (const item of validation.availableItems) {
        const product = productMap.get(item.productId);

        if (product) {
          // Check if product already exists in cart
          // Note: addToCart will handle quantity updates internally
          addToCart(product, item.quantity, undefined, item.price);
          addedCount++;
        }
      }

      // Prepare result message
      let message = `${addedCount} ürün sepete eklendi`;

      if (validation.unavailableItems.length > 0) {
        message += `, ${validation.unavailableItems.length} ürün mevcut değil`;
      }

      if (validation.priceDifference !== 0) {
        const priceStr = formatPrice(Math.abs(validation.priceDifference));
        const direction = validation.priceIncreased ? 'arttı' : 'azaldı';
        warnings.push(`Fiyat ${priceStr} ${direction}`);
      }

      // Show success toast
      toast.success(message, {
        description: warnings.length > 0 ? warnings.join(', ') : undefined,
      });

      return {
        success: true,
        addedToCartCount: addedCount,
        skippedCount: validation.unavailableItems.length,
        message,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Error repeating order:', error);
      toast.error('Tekrar sipariş oluşturulamadı');
      return {
        success: false,
        addedToCartCount: 0,
        skippedCount: 0,
        message: 'Bir hata oluştu',
      };
    } finally {
      setIsRepeating(false);
    }
  }, [addToCart]);

  return {
    validateOrder,
    repeatOrder,
    isValidation,
    isRepeating,
  };
};
