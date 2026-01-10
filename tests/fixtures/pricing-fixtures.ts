/**
 * Test Fixtures: Pricing System
 * Test Verileri: Fiyatlandırma Sistemi
 *
 * Provides mock data for pricing tests
 */

import type { PriceCalculationResult, CartPriceCalculationResult, CustomerType } from '@/types/pricing';

// Mock commission rates
export const MOCK_COMMISSION_RATES = {
  b2b_rate: 0.30,
  b2c_rate: 0.50,
};

// Mock regional multipliers
export const MOCK_REGIONAL_MULTIPLIERS = {
  marmara: 1.0,
  ege: 1.1,
  akdeniz: 1.15,
  ic_anadolu: 1.05,
};

// Mock products
export const MOCK_PRODUCTS = {
  standard: {
    id: 'prod-001',
    name: 'Standard Product',
    supplier_price: 100,
  },
  premium: {
    id: 'prod-002',
    name: 'Premium Product',
    supplier_price: 250,
  },
  economy: {
    id: 'prod-003',
    name: 'Economy Product',
    supplier_price: 50,
  },
};

// Mock suppliers
export const MOCK_SUPPLIERS = {
  supplier1: {
    id: 'sup-001',
    name: 'Test Supplier A',
  },
  supplier2: {
    id: 'sup-002',
    name: 'Test Supplier B',
  },
  supplier3: {
    id: 'sup-003',
    name: 'Test Supplier C',
  },
};

// Mock regions
export const MOCK_REGIONS = {
  marmara: {
    id: 'reg-001',
    name: 'Marmara Bölgesi',
    multiplier: 1.0,
  },
  ege: {
    id: 'reg-002',
    name: 'Ege Bölgesi',
    multiplier: 1.1,
  },
  akdeniz: {
    id: 'reg-003',
    name: 'Akdeniz Bölgesi',
    multiplier: 1.15,
  },
};

// Mock variations
export const MOCK_VARIATIONS = {
  size_1lt: {
    id: 'var-001',
    type: 'size',
    value: '1 LT',
    price_adjustment: 0,
  },
  size_4lt: {
    id: 'var-002',
    type: 'size',
    value: '4 LT',
    price_adjustment: 20,
  },
  size_10lt: {
    id: 'var-003',
    type: 'size',
    value: '10 LT',
    price_adjustment: 50,
  },
  scent_lavender: {
    id: 'var-004',
    type: 'scent',
    value: 'Lavanta',
    price_adjustment: 5,
  },
  scent_lemon: {
    id: 'var-005',
    type: 'scent',
    value: 'Limon',
    price_adjustment: 0,
  },
};

/**
 * Create mock price calculation result
 */
export function createMockPriceResult(overrides?: Partial<PriceCalculationResult>): PriceCalculationResult {
  return {
    supplier_price: 100,
    regional_multiplier: 1.0,
    variation_adjustment: 0,
    base_price: 100,
    commission_rate: 0.30,
    commission_amount: 30,
    final_price: 130,
    supplier_id: MOCK_SUPPLIERS.supplier1.id,
    supplier_name: MOCK_SUPPLIERS.supplier1.name,
    supplier_product_id: 'sp-001',
    stock_quantity: 50,
    availability: 'plenty',
    is_available: true,
    min_order_quantity: 10,
    ...overrides,
  };
}

/**
 * Create mock price result for B2B
 */
export function createMockB2BPriceResult(
  supplierPrice: number = 100,
  overrides?: Partial<PriceCalculationResult>
): PriceCalculationResult {
  return createMockPriceResult({
    supplier_price: supplierPrice,
    base_price: supplierPrice,
    commission_rate: MOCK_COMMISSION_RATES.b2b_rate,
    commission_amount: supplierPrice * MOCK_COMMISSION_RATES.b2b_rate,
    final_price: supplierPrice * (1 + MOCK_COMMISSION_RATES.b2b_rate),
    ...overrides,
  });
}

/**
 * Create mock price result for B2C
 */
export function createMockB2CPriceResult(
  supplierPrice: number = 100,
  overrides?: Partial<PriceCalculationResult>
): PriceCalculationResult {
  return createMockPriceResult({
    supplier_price: supplierPrice,
    base_price: supplierPrice,
    commission_rate: MOCK_COMMISSION_RATES.b2c_rate,
    commission_amount: supplierPrice * MOCK_COMMISSION_RATES.b2c_rate,
    final_price: supplierPrice * (1 + MOCK_COMMISSION_RATES.b2c_rate),
    ...overrides,
  });
}

/**
 * Create mock cart item result
 */
export function createMockCartItemResult(
  quantity: number = 1,
  overrides?: Partial<PriceCalculationResult>
): CartPriceCalculationResult {
  const priceResult = createMockPriceResult(overrides);
  return {
    ...priceResult,
    quantity,
    total_price: priceResult.final_price * quantity,
  };
}

/**
 * Create mock cart with multiple items
 */
export function createMockCart(itemCount: number = 3): CartPriceCalculationResult[] {
  const items: CartPriceCalculationResult[] = [];

  for (let i = 0; i < itemCount; i++) {
    const quantity = Math.floor(Math.random() * 5) + 1;
    const supplierPrice = 50 + Math.floor(Math.random() * 200);

    items.push(createMockCartItemResult(quantity, {
      supplier_price: supplierPrice,
      base_price: supplierPrice,
      commission_amount: supplierPrice * MOCK_COMMISSION_RATES.b2c_rate,
      final_price: supplierPrice * (1 + MOCK_COMMISSION_RATES.b2c_rate),
    }));
  }

  return items;
}

/**
 * Calculate expected price for testing
 */
export function calculateExpectedPrice(
  supplierPrice: number,
  customerType: CustomerType,
  regionalMultiplier: number = 1.0,
  variationAdjustment: number = 0
): number {
  const commissionRate = customerType === 'b2b' ? MOCK_COMMISSION_RATES.b2b_rate : MOCK_COMMISSION_RATES.b2c_rate;

  const afterRegional = supplierPrice * regionalMultiplier;
  const basePrice = afterRegional + variationAdjustment;
  const finalPrice = basePrice * (1 + commissionRate);

  return Math.round(finalPrice * 100) / 100;
}

/**
 * Get test scenarios for price calculation
 */
export const PRICE_CALCULATION_SCENARIOS = {
  b2b_standard: {
    description: 'B2B standard pricing',
    supplierPrice: 100,
    customerType: 'b2b' as CustomerType,
    regionalMultiplier: 1.0,
    variationAdjustment: 0,
    expectedPrice: 130,
  },
  b2c_standard: {
    description: 'B2C standard pricing',
    supplierPrice: 100,
    customerType: 'b2c' as CustomerType,
    regionalMultiplier: 1.0,
    variationAdjustment: 0,
    expectedPrice: 150,
  },
  b2b_with_region: {
    description: 'B2B with regional markup',
    supplierPrice: 100,
    customerType: 'b2b' as CustomerType,
    regionalMultiplier: 1.1,
    variationAdjustment: 0,
    expectedPrice: 143,
  },
  b2c_with_variation: {
    description: 'B2C with variation adjustment',
    supplierPrice: 100,
    customerType: 'b2c' as CustomerType,
    regionalMultiplier: 1.0,
    variationAdjustment: 20,
    expectedPrice: 180,
  },
  b2b_complex: {
    description: 'B2B with region and variation',
    supplierPrice: 100,
    customerType: 'b2b' as CustomerType,
    regionalMultiplier: 1.15,
    variationAdjustment: 10,
    expectedPrice: 156.75,
  },
};

/**
 * Mock supplier products for testing
 */
export const MOCK_SUPPLIER_PRODUCTS = [
  {
    id: 'sp-001',
    supplier_id: MOCK_SUPPLIERS.supplier1.id,
    supplier_name: MOCK_SUPPLIERS.supplier1.name,
    product_id: MOCK_PRODUCTS.standard.id,
    price: 100,
    previous_price: null,
    price_change: 'stable' as const,
    stock_quantity: 50,
    availability: 'plenty' as const,
    min_order_quantity: 10,
    delivery_days: 2,
    is_active: true,
    is_featured: true,
    quality: 'standart' as const,
    origin: 'Türkiye',
  },
  {
    id: 'sp-002',
    supplier_id: MOCK_SUPPLIERS.supplier2.id,
    supplier_name: MOCK_SUPPLIERS.supplier2.name,
    product_id: MOCK_PRODUCTS.standard.id,
    price: 95,
    previous_price: 100,
    price_change: 'decreased' as const,
    stock_quantity: 30,
    availability: 'limited' as const,
    min_order_quantity: 15,
    delivery_days: 3,
    is_active: true,
    is_featured: false,
    quality: 'standart' as const,
    origin: 'Türkiye',
  },
  {
    id: 'sp-003',
    supplier_id: MOCK_SUPPLIERS.supplier3.id,
    supplier_name: MOCK_SUPPLIERS.supplier3.name,
    product_id: MOCK_PRODUCTS.premium.id,
    price: 250,
    previous_price: 230,
    price_change: 'increased' as const,
    stock_quantity: 5,
    availability: 'last' as const,
    min_order_quantity: 5,
    delivery_days: 1,
    is_active: true,
    is_featured: true,
    quality: 'premium' as const,
    origin: 'İthal',
  },
];

/**
 * Test user credentials
 */
export const TEST_USERS = {
  b2b_customer: {
    email: 'test-business@haldeki.com',
    password: 'Test123!',
    role: 'business',
    expectedCommission: 0.30,
  },
  b2c_customer: {
    email: 'test-customer@haldeki.com',
    password: 'Test123!',
    role: 'customer',
    expectedCommission: 0.50,
  },
  supplier: {
    email: 'test-supplier@haldeki.com',
    password: 'Test123!',
    role: 'supplier',
  },
  admin: {
    email: 'admin@haldeki.com',
    password: 'admin123',
    role: 'admin',
  },
};

/**
 * Expected test results
 */
export const EXPECTED_RESULTS = {
  b2b_cheaper_than_b2c: true,
  regional_affects_price: true,
  variation_affects_price: true,
  commission_calculated_correctly: true,
  stock_available_check: true,
};

/**
 * Performance benchmarks
 */
export const PERFORMANCE_BENCHMARKS = {
  single_price_calculation_max_ms: 200,
  with_variation_max_ms: 300,
  with_supplier_max_ms: 250,
  concurrent_10_max_ms: 2000,
  bulk_20_max_ms: 5000,
  cart_10_items_max_ms: 3000,
};
