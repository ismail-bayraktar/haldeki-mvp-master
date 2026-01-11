/**
 * Fiyat Hesaplama Utilitesi
 * Price Calculation Utility
 *
 * Yeni pricing sistemi için fiyat hesaplama fonksiyonları.
 * Price calculation functions for the new pricing system.
 */

import type {
  CommissionRates,
  CustomerType,
  PriceCalculationInput,
  PriceCalculationResult,
  CartPriceCalculationResult,
  RegionalPricingConfig,
} from '@/types/pricing';
import { DEFAULT_COMMISSION_RATES } from '@/types/pricing';

// ============================================================================
// COMMISSION HELPERS
// ============================================================================

/**
 * Müşteri tipine göre komisyon oranını döndürür
 * Returns commission rate for customer type
 */
export function getCommissionRate(
  customerType: CustomerType,
  customRates?: Partial<CommissionRates>
): number {
  const rates = { ...DEFAULT_COMMISSION_RATES, ...customRates };
  return customerType === 'b2b' ? rates.b2b_rate : rates.b2c_rate;
}

/**
 * Komisyon tutarını hesaplar
 * Calculates commission amount
 */
export function calculateCommission(
  basePrice: number,
  customerType: CustomerType,
  customRates?: Partial<CommissionRates>
): number {
  const rate = getCommissionRate(customerType, customRates);
  return basePrice * rate;
}

/**
 * Komisyon eklenmiş fiyatı hesaplar
 * Calculates price with commission
 */
export function calculatePriceWithCommission(
  basePrice: number,
  customerType: CustomerType,
  customRates?: Partial<CommissionRates>
): number {
  const commission = calculateCommission(basePrice, customerType, customRates);
  return basePrice + commission;
}

// ============================================================================
// REGIONAL PRICING HELPERS
// ============================================================================

/**
 * Bölgesel çarpan uygulanmış fiyatı hesaplar
 * Calculates price with regional multiplier
 */
export function applyRegionalMultiplier(
  basePrice: number,
  multiplier: number
): number {
  const result = basePrice * (multiplier || 1.0);
  return Math.round(result * 100) / 100;
}

/**
 * Bölgesel çarpanı doğrular
 * Validates regional multiplier
 */
export function isValidRegionalMultiplier(multiplier: number): boolean {
  return multiplier >= 0.5 && multiplier <= 2.0 && multiplier !== 0;
}

/**
 * Varsayılan bölgesel çarpan döndürür
 * Returns default regional multiplier
 */
export function getDefaultRegionalMultiplier(): number {
  return 1.0;
}

// ============================================================================
// VARIATION PRICE HELPERS
// ============================================================================

/**
 * Varyasyon fiyat ayarlamasını toplama dahil eder
 * Includes variation price adjustment in total
 */
export function applyVariationAdjustment(
  basePrice: number,
  adjustment: number
): number {
  return basePrice + (adjustment || 0);
}

/**
 * Birden fazla varyasyon ayarlamasını toplar
 * Sums multiple variation adjustments
 */
export function sumVariationAdjustments(adjustments: number[]): number {
  return adjustments.reduce((sum, adj) => sum + (adj || 0), 0);
}

// ============================================================================
// COMPLETE PRICE CALCULATION (Client-side)
// ============================================================================

/**
 * Müşteri fiyatını hesaplar (Client-side fallback)
 * Calculates customer price (client-side fallback)
 *
 * NOT: Bu fonksiyon sadece RPC çağrısı başarısız olduğunda kullanılır.
 * Normal şartlarda calculate_product_price RPC fonksiyonu kullanılmalıdır.
 *
 * WARNING: This function is only a fallback when RPC call fails.
 * Normally, use calculate_product_price RPC function.
 */
export function calculateCustomerPriceClientSide(input: {
  supplierPrice: number;
  regionalMultiplier?: number;
  variationAdjustments?: number[];
  customerType: CustomerType;
  customRates?: Partial<CommissionRates>;
}): number {
  const {
    supplierPrice,
    regionalMultiplier = 1.0,
    variationAdjustments = [],
    customerType,
    customRates,
  } = input;

  // Step 1: Apply regional multiplier
  const afterRegional = applyRegionalMultiplier(supplierPrice, regionalMultiplier);

  // Step 2: Apply variation adjustments
  const totalVariationAdjustment = sumVariationAdjustments(variationAdjustments);
  const basePrice = applyVariationAdjustment(afterRegional, totalVariationAdjustment);

  // Step 3: Apply commission
  const finalPrice = calculatePriceWithCommission(basePrice, customerType, customRates);

  return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Tam fiyat hesaplama sonucu oluşturur (Client-side fallback)
 * Creates complete price calculation result (client-side fallback)
 *
 * NOT: Bu fonksiyon sadece RPC çağrısı başarısız olduğunda kullanılır.
 */
export function createPriceCalculationResultClientSide(input: {
  productId: string;
  productName: string;
  regionId: string | null;
  regionName: string | null;
  customerType: CustomerType;
  supplierProduct: {
    id: string;
    supplier_id: string;
    supplier_name: string;
    price: number;
    stock_quantity: number;
    availability: 'plenty' | 'limited' | 'last';
    is_featured?: boolean;
  };
  regionalMultiplier?: number;
  variationAdjustments?: number[];
  customRates?: Partial<CommissionRates>;
}): PriceCalculationResult {
  const {
    productId,
    productName,
    regionId,
    regionName,
    customerType,
    supplierProduct,
    regionalMultiplier = 1.0,
    variationAdjustments = [],
    customRates,
  } = input;

  const totalVariationAdjustment = sumVariationAdjustments(variationAdjustments);
  const afterRegional = applyRegionalMultiplier(supplierProduct.price, regionalMultiplier);
  const basePrice = applyVariationAdjustment(afterRegional, totalVariationAdjustment);
  const commissionRate = getCommissionRate(customerType, customRates);
  const finalPrice = calculatePriceWithCommission(basePrice, customerType, customRates);

  // Calculate both B2B and B2C prices
  const b2bRate = getCommissionRate('b2b', customRates);
  const b2cRate = getCommissionRate('b2c', customRates);
  const b2bPrice = calculatePriceWithCommission(basePrice, 'b2b', customRates);
  const b2cPrice = calculatePriceWithCommission(basePrice, 'b2c', customRates);

  return {
    // Product info
    product_id: productId,
    product_name: productName,
    supplier_id: supplierProduct.supplier_id,
    supplier_name: supplierProduct.supplier_name,
    region_id: regionId,
    region_name: regionName,

    // Base pricing
    supplier_price: supplierProduct.price,
    regional_multiplier: regionalMultiplier,
    variation_adjustment: totalVariationAdjustment,
    commission_rate: commissionRate,

    // Final prices
    b2b_price: Math.round(b2bPrice * 100) / 100,
    b2c_price: Math.round(b2cPrice * 100) / 100,
    final_price: Math.round(finalPrice * 100) / 100,

    // Metadata
    price_calculation_mode: 'markup',
    regional_pricing_mode: 'multiplier',
    calculated_at: new Date().toISOString(),

    // Availability
    availability: supplierProduct.availability,
    stock_quantity: supplierProduct.stock_quantity,
    is_featured: supplierProduct.is_featured ?? false,
    price_rank: 1,
  };
}

// ============================================================================
// CART PRICE CALCULATION
// ============================================================================

/**
 * Sepet öğesi için toplam fiyatı hesaplar
 * Calculates total price for cart item
 */
export function calculateCartItemPrice(
  priceResult: PriceCalculationResult,
  quantity: number
): CartPriceCalculationResult {
  const total_price = Math.round(priceResult.final_price * quantity * 100) / 100;

  return {
    ...priceResult,
    quantity,
    total_price,
  };
}

/**
 * Sepet toplamını hesaplar
 * Calculates cart total
 */
export function calculateCartTotal(items: CartPriceCalculationResult[]): number {
  return items.reduce((sum, item) => sum + item.total_price, 0);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Fiyat hesaplama girdilerini doğrular
 * Validates price calculation inputs
 */
export function validatePriceInput(input: PriceCalculationInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.product_id) {
    errors.push('Product ID is required');
  }

  if (!input.region_id) {
    errors.push('Region ID is required');
  }

  if (!input.customer_type || !['b2b', 'b2c'].includes(input.customer_type)) {
    errors.push('Valid customer type (b2b or b2c) is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Fiyat sonucunu doğrular
 * Validates price calculation result
 */
export function validatePriceResult(result: PriceCalculationResult): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (result.supplier_price < 0) {
    errors.push('Supplier price cannot be negative');
  }

  if (result.final_price < 0) {
    errors.push('Final price cannot be negative');
  }

  if (result.commission_amount < 0) {
    errors.push('Commission amount cannot be negative');
  }

  if (result.commission_rate < 0 || result.commission_rate > 1) {
    errors.push('Commission rate must be between 0 and 1');
  }

  if (result.regional_multiplier <= 0) {
    errors.push('Regional multiplier must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Fiyatı Türk Lirası formatında gösterir
 * Formats price as Turkish Lira
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Fiyat değişimini gösterir (artış/azalış)
 * Displays price change (increase/decrease)
 */
export function formatPriceChange(
  currentPrice: number,
  previousPrice: number | null
): {
  type: 'increased' | 'decreased' | 'stable';
  percentage: number | null;
  formatted: string;
} {
  if (previousPrice === null || previousPrice === 0) {
    return {
      type: 'stable',
      percentage: null,
      formatted: 'Yeni fiyat',
    };
  }

  const percentage = ((currentPrice - previousPrice) / previousPrice) * 100;
  const type = percentage > 0 ? 'increased' : percentage < 0 ? 'decreased' : 'stable';

  const formatted =
    type === 'increased'
      ? `%%${Math.round(percentage)} artış`
      : type === 'decreased'
      ? `%%${Math.round(Math.abs(percentage))} düşüş`
      : 'Değişmedi';

  return {
    type,
    percentage: Math.round(percentage * 100) / 100,
    formatted,
  };
}

/**
 * Komisyon oranını yüzde formatında gösterir
 * Displays commission rate as percentage
 */
export function formatCommissionRate(rate: number): string {
  return `%${Math.round(rate * 100)}`;
}
