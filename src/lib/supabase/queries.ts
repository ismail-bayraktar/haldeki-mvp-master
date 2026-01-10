/**
 * Supabase Queries - New Pricing System
 *
 * Yeni pricing sistemi için Supabase sorguları.
 * Supabase queries for the new pricing system.
 *
 * Uses calculate_product_price RPC function as the single source of truth.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  PriceCalculationResult,
  CustomerType,
  CartPriceCalculationResult,
} from '@/types/pricing';

// ============================================================================
// RPC FUNCTION WRAPPERS
// ============================================================================

/**
 * Calculate product price using RPC function
 *
 * This is the PRIMARY method for price calculation.
 * All client-side price calculations should use this function.
 *
 * RPC Function: calculate_product_price
 * Returns: Complete price breakdown with commission
 */
export async function calculateProductPrice(params: {
  productId: string;
  regionId: string;
  customerType: CustomerType;
  variationId?: string | null;
  supplierId?: string | null;
}): Promise<PriceCalculationResult> {
  const { productId, regionId, customerType, variationId, supplierId } = params;

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
    throw new Error('No price data returned from RPC');
  }

  return data as PriceCalculationResult;
}

/**
 * Calculate cart prices using RPC function
 *
 * Calculates prices for all cart items in a single call.
 * More efficient than calling calculateProductPrice for each item.
 *
 * RPC Function: calculate_cart_prices
 * Returns: Array of price calculations for cart items
 */
export async function calculateCartPrices(params: {
  cartItems: Array<{
    productId: string;
    quantity: number;
    variationId?: string | null;
    supplierId?: string | null;
  }>;
  regionId: string;
  customerType: CustomerType;
}): Promise<CartPriceCalculationResult[]> {
  const { cartItems, regionId, customerType } = params;

  const { data, error } = await supabase.rpc('calculate_cart_prices', {
    p_cart_items: cartItems,
    p_region_id: regionId,
    p_customer_type: customerType,
  });

  if (error) {
    console.error('RPC error calculating cart prices:', error);
    throw error;
  }

  if (!data || !Array.isArray(data)) {
    throw new Error('No cart price data returned from RPC');
  }

  return data as CartPriceCalculationResult[];
}

/**
 * Get product suppliers with pricing
 *
 * Returns all suppliers for a product with their prices.
 * Used for price comparison and finding lowest price.
 *
 * RPC Function: get_product_suppliers
 */
export async function getProductSuppliers(productId: string) {
  const { data, error } = await supabase.rpc('get_product_suppliers', {
    p_product_id: productId,
  });

  if (error) {
    console.error('RPC error getting product suppliers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get lowest price for a product
 *
 * Finds the supplier with the lowest price for a given product.
 * Convenience function that calls get_product_suppliers and finds minimum.
 *
 * @returns Lowest price supplier info or null
 */
export async function getLowestProductPrice(params: {
  productId: string;
  regionId: string;
  customerType: CustomerType;
}): Promise<PriceCalculationResult | null> {
  const { productId, regionId, customerType } = params;

  // Get all suppliers
  const suppliers = await getProductSuppliers(productId);

  if (!suppliers || suppliers.length === 0) {
    return null;
  }

  // Calculate price for each supplier
  const pricePromises = suppliers.map((supplier: any) =>
    calculateProductPrice({
      productId,
      regionId,
      customerType,
      supplierId: supplier.supplier_id,
    })
  );

  const prices = await Promise.all(pricePromises);

  // Find lowest price
  const lowestPrice = prices.reduce((min, current) =>
    current.final_price < min.final_price ? current : min
  );

  return lowestPrice;
}

// ============================================================================
// REGIONAL MULTIPLIER QUERIES
// ============================================================================

/**
 * Get regional multiplier for a region
 *
 * Returns the price multiplier for a specific region.
 * Default multiplier is 1.0 (no adjustment).
 */
export async function getRegionalMultiplier(regionId: string): Promise<number> {
  const { data, error } = await supabase
    .from('regional_multipliers')
    .select('multiplier')
    .eq('region_id', regionId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching regional multiplier:', error);
    return 1.0; // Default on error
  }

  return data?.multiplier || 1.0; // Default if not found
}

/**
 * Set regional multiplier for a region
 *
 * Updates the price multiplier for a specific region.
 * Admin function.
 */
export async function setRegionalMultiplier(params: {
  regionId: string;
  multiplier: number;
}): Promise<void> {
  const { regionId, multiplier } = params;

  const { error } = await supabase
    .from('regional_multipliers')
    .upsert({ region_id: regionId, multiplier });

  if (error) {
    console.error('Error setting regional multiplier:', error);
    throw error;
  }
}

// ============================================================================
// COMMISSION RATE QUERIES
// ============================================================================

/**
 * Get commission rates from system settings
 *
 * Returns current B2B and B2C commission rates.
 * Admin-configurable.
 */
export async function getCommissionRates(): Promise<{
  b2b_rate: number;
  b2c_rate: number;
}> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('settings')
    .eq('key', 'commission_rates')
    .maybeSingle();

  if (error) {
    console.error('Error fetching commission rates:', error);
    return { b2b_rate: 0.3, b2c_rate: 0.5 }; // Defaults
  }

  if (!data?.settings) {
    return { b2b_rate: 0.3, b2c_rate: 0.5 }; // Defaults
  }

  return data.settings as { b2b_rate: number; b2c_rate: number };
}

/**
 * Set commission rates
 *
 * Updates B2B and B2C commission rates.
 * Admin function.
 */
export async function setCommissionRates(params: {
  b2bRate: number;
  b2cRate: number;
}): Promise<void> {
  const { b2bRate, b2cRate } = params;

  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key: 'commission_rates',
      settings: { b2b_rate: b2bRate, b2c_rate: b2cRate },
    });

  if (error) {
    console.error('Error setting commission rates:', error);
    throw error;
  }
}

// ============================================================================
// SUPPLIER PRODUCT QUERIES (Price Authority)
// ============================================================================

/**
 * Get supplier product price (base price source)
 *
 * Returns the supplier's base price for a product.
 * This is the authoritative source for all pricing calculations.
 */
export async function getSupplierProductPrice(params: {
  supplierId: string;
  productId: string;
}): Promise<{
  id: string;
  supplier_id: string;
  product_id: string;
  price: number;
  stock_quantity: number;
  availability: 'plenty' | 'limited' | 'last';
  min_order_quantity: number;
} | null> {
  const { supplierId, productId } = params;

  const { data, error } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('product_id', productId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching supplier product price:', error);
    return null;
  }

  return data;
}

/**
 * Update supplier product price
 *
 * Updates the supplier's base price for a product.
 * Supplier function.
 */
export async function updateSupplierProductPrice(params: {
  supplierProductId: string;
  price: number;
  previousPrice?: number;
}): Promise<void> {
  const { supplierProductId, price, previousPrice } = params;

  const price_change = previousPrice
    ? price > previousPrice
      ? 'increased'
      : price < previousPrice
      ? 'decreased'
      : 'stable'
    : 'stable';

  const { error } = await supabase
    .from('supplier_products')
    .update({
      price,
      previous_price: previousPrice || null,
      price_change,
      last_price_update: new Date().toISOString(),
    })
    .eq('id', supplierProductId);

  if (error) {
    console.error('Error updating supplier product price:', error);
    throw error;
  }
}

// ============================================================================
// VARIATION PRICE QUERIES
// ============================================================================

/**
 * Get variation price adjustments for a supplier product
 *
 * Returns all price adjustments for variations of a supplier product.
 */
export async function getVariationPriceAdjustments(
  supplierProductId: string
): Promise<
  Array<{
    variation_id: string;
    variation_type: string;
    variation_value: string;
    price_adjustment: number;
    stock_quantity: number;
  }>
> {
  const { data, error } = await supabase
    .from('supplier_product_variations')
    .select(`
      variation_id,
      product_variations (
        variation_type,
        variation_value
      ),
      price_adjustment,
      stock_quantity
    `)
    .eq('supplier_product_id', supplierProductId);

  if (error) {
    console.error('Error fetching variation price adjustments:', error);
    return [];
  }

  return (
    data?.map((item: any) => ({
      variation_id: item.variation_id,
      variation_type: item.product_variations?.variation_type,
      variation_value: item.product_variations?.variation_value,
      price_adjustment: item.price_adjustment,
      stock_quantity: item.stock_quantity,
    })) || []
  );
}

/**
 * Update variation price adjustment
 *
 * Updates the price adjustment for a specific variation.
 * Supplier function.
 */
export async function updateVariationPriceAdjustment(params: {
  supplierProductVariationId: string;
  priceAdjustment: number;
}): Promise<void> {
  const { supplierProductVariationId, priceAdjustment } = params;

  const { error } = await supabase
    .from('supplier_product_variations')
    .update({ price_adjustment: priceAdjustment })
    .eq('id', supplierProductVariationId);

  if (error) {
    console.error('Error updating variation price adjustment:', error);
    throw error;
  }
}
