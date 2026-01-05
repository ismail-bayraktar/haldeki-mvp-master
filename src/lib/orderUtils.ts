// Order utilities for repeat order functionality (Faz 8)

import { supabase } from '@/integrations/supabase/client';
import type { OrderItem, RepeatOrderValidationResult, Product } from '@/types';

/**
 * Validates if an order can be repeated with current product data
 * @param orderItems - Items from the previous order
 * @param userRegionId - User's current selected region
 * @param isBusinessUser - Whether user is a business customer (for business pricing)
 * @returns Validation result with available/unavailable items
 */
export async function validateOrderForRepeat(
  orderItems: OrderItem[],
  userRegionId: string,
  isBusinessUser: boolean = false
): Promise<RepeatOrderValidationResult> {
  const availableItems: RepeatOrderValidationResult['availableItems'] = [];
  const unavailableItems: RepeatOrderValidationResult['unavailableItems'] = [];

  // Extract product IDs from order items
  const productIds = orderItems.map(item => item.productId);

  // Fetch current product data
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, unit, is_active')
    .in('id', productIds);

  if (productsError) {
    console.error('Error fetching products for repeat order:', productsError);
    throw new Error('Ürün bilgileri alınamadı');
  }

  // Create a map for quick lookup
  const productMap = new Map(products?.map(p => [p.id, p]) || []);

  // Fetch region products for user's region
  const { data: regionProducts, error: regionError } = await supabase
    .from('region_products')
    .select('product_id, price, business_price, stock_quantity, is_active')
    .eq('region_id', userRegionId)
    .in('product_id', productIds);

  if (regionError) {
    console.error('Error fetching region products:', regionError);
    throw new Error('Bölge ürün bilgileri alınamadı');
  }

  // Create a map for region products
  const regionProductMap = new Map(
    regionProducts?.map(rp => [rp.product_id, rp]) || []
  );

  // Validate each order item
  for (const item of orderItems) {
    const product = productMap.get(item.productId);
    const regionProduct = regionProductMap.get(item.productId);

    // Check if product still exists
    if (!product) {
      unavailableItems.push({
        productId: item.productId,
        productName: item.productName,
        reason: 'not_found',
      });
      continue;
    }

    // Check if product is active
    if (!product.is_active) {
      unavailableItems.push({
        productId: item.productId,
        productName: item.productName,
        reason: 'inactive',
      });
      continue;
    }

    // Check if product is available in user's region
    if (!regionProduct) {
      unavailableItems.push({
        productId: item.productId,
        productName: item.productName,
        reason: 'not_in_region',
      });
      continue;
    }

    // Check if region product is active
    if (!regionProduct.is_active) {
      unavailableItems.push({
        productId: item.productId,
        productName: item.productName,
        reason: 'inactive',
      });
      continue;
    }

    // Check if in stock
    if (regionProduct.stock_quantity <= 0) {
      unavailableItems.push({
        productId: item.productId,
        productName: item.productName,
        reason: 'out_of_stock',
      });
      continue;
    }

    // Product is available - calculate current price
    const currentPrice = isBusinessUser && regionProduct.business_price
      ? regionProduct.business_price
      : regionProduct.price;

    const oldPrice = item.businessUnitPrice || item.unitPrice;
    const priceChanged = currentPrice !== oldPrice;

    availableItems.push({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: currentPrice,
      oldPrice: oldPrice,
      priceChanged,
      businessPrice: regionProduct.business_price || undefined,
    });
  }

  // Calculate totals
  const totalOldPrice = orderItems.reduce((sum, item) => {
    const price = item.businessUnitPrice || item.unitPrice;
    return sum + (price * item.quantity);
  }, 0);

  const totalNewPrice = availableItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const priceDifference = totalNewPrice - totalOldPrice;
  const priceIncreased = priceDifference > 0;

  // Can repeat if at least one item is available
  const canRepeat = availableItems.length > 0;

  return {
    canRepeat,
    availableItems,
    unavailableItems,
    totalOldPrice,
    totalNewPrice,
    priceDifference,
    priceIncreased,
  };
}

/**
 * Calculates the price difference between old and new items
 * @param oldItems - Original order items
 * @param newItems - Current available items with new pricing
 * @returns Price difference (positive = increase, negative = decrease)
 */
export function calculatePriceDifference(
  oldItems: OrderItem[],
  newItems: Array<{ product: Product; quantity: number; price: number }>
): number {
  const oldTotal = oldItems.reduce((sum, item) => {
    const price = item.businessUnitPrice || item.unitPrice;
    return sum + (price * item.quantity);
  }, 0);

  const newTotal = newItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  return newTotal - oldTotal;
}

/**
 * Format price for display
 * @param price - Price in numeric format
 * @returns Formatted price string (e.g., "₺150.00")
 */
export function formatPrice(price: number): string {
  return `₺${price.toFixed(2)}`;
}

/**
 * Get user-friendly reason message for unavailable item
 * @param reason - Machine-readable reason code
 * @returns Human-readable Turkish message
 */
export function getUnavailableReasonMessage(reason: RepeatOrderValidationResult['unavailableItems'][0]['reason']): string {
  const messages: Record<string, string> = {
    not_found: 'Bu ürün artık satışta değil',
    not_in_region: 'Bu ürün seçili bölgenizde mevcut değil',
    out_of_stock: 'Bu ürün şu anda stokta yok',
    inactive: 'Bu ürün geçici olarak kullanım dışı',
    region_changed: 'Bölge değişikliği nedeniyle bu ürün mevcut değil',
  };

  return messages[reason] || 'Bu ürün şu anda mevcut değil';
}
