/**
 * Unit Tests: Price Calculation Logic
 * Birim Fiyat Hesaplama Testleri
 *
 * Tests core pricing calculation functions:
 * - Commission rates (B2B %30, B2C %50)
 * - Regional multipliers
 * - Variation adjustments
 * - Complete price calculation
 */

import { describe, it, expect } from 'vitest';
import {
  getCommissionRate,
  calculateCommission,
  calculatePriceWithCommission,
  applyRegionalMultiplier,
  isValidRegionalMultiplier,
  getDefaultRegionalMultiplier,
  applyVariationAdjustment,
  sumVariationAdjustments,
  calculateCustomerPriceClientSide,
  createPriceCalculationResultClientSide,
  calculateCartItemPrice,
  calculateCartTotal,
  validatePriceInput,
  validatePriceResult,
  formatPrice,
  formatPriceChange,
  formatCommissionRate,
} from '@/lib/pricing';
import type { CustomerType, PriceCalculationResult } from '@/types/pricing';
import { DEFAULT_COMMISSION_RATES } from '@/types/pricing';

describe('Pricing Calculation - Commission Rates', () => {
  describe('getCommissionRate', () => {
    it('should return 0.30 for B2B customers', () => {
      const rate = getCommissionRate('b2b');
      expect(rate).toBe(0.30);
    });

    it('should return 0.50 for B2C customers', () => {
      const rate = getCommissionRate('b2c');
      expect(rate).toBe(0.50);
    });

    it('should accept custom commission rates for B2B', () => {
      const rate = getCommissionRate('b2b', { b2b_rate: 0.25 });
      expect(rate).toBe(0.25);
    });

    it('should accept custom commission rates for B2C', () => {
      const rate = getCommissionRate('b2c', { b2c_rate: 0.40 });
      expect(rate).toBe(0.40);
    });

    it('should use default B2B rate when custom rate not provided', () => {
      const rate = getCommissionRate('b2b', { b2c_rate: 0.40 });
      expect(rate).toBe(0.30);
    });

    it('should use default B2C rate when custom rate not provided', () => {
      const rate = getCommissionRate('b2c', { b2b_rate: 0.25 });
      expect(rate).toBe(0.50);
    });
  });

  describe('calculateCommission', () => {
    it('should calculate 30% commission for B2B on 100 TL', () => {
      const commission = calculateCommission(100, 'b2b');
      expect(commission).toBe(30);
    });

    it('should calculate 50% commission for B2C on 100 TL', () => {
      const commission = calculateCommission(100, 'b2c');
      expect(commission).toBe(50);
    });

    it('should handle zero base price', () => {
      const commission = calculateCommission(0, 'b2b');
      expect(commission).toBe(0);
    });

    it('should handle decimal prices correctly', () => {
      const commission = calculateCommission(99.99, 'b2b');
      expect(commission).toBeCloseTo(29.997, 3);
    });

    it('should use custom commission rate when provided', () => {
      const commission = calculateCommission(100, 'b2b', { b2b_rate: 0.20 });
      expect(commission).toBe(20);
    });
  });

  describe('calculatePriceWithCommission', () => {
    it('should add B2B commission to base price', () => {
      const finalPrice = calculatePriceWithCommission(100, 'b2b');
      expect(finalPrice).toBe(130);
    });

    it('should add B2C commission to base price', () => {
      const finalPrice = calculatePriceWithCommission(100, 'b2c');
      expect(finalPrice).toBe(150);
    });

    it('should handle zero base price', () => {
      const finalPrice = calculatePriceWithCommission(0, 'b2b');
      expect(finalPrice).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const finalPrice = calculatePriceWithCommission(99.99, 'b2c');
      expect(finalPrice).toBeCloseTo(149.985, 3);
    });
  });
});

describe('Pricing Calculation - Regional Multipliers', () => {
  describe('applyRegionalMultiplier', () => {
    it('should apply 1.1 multiplier (+10%)', () => {
      const price = applyRegionalMultiplier(100, 1.1);
      expect(price).toBe(110);
    });

    it('should apply 0.9 multiplier (-10%)', () => {
      const price = applyRegionalMultiplier(100, 0.9);
      expect(price).toBe(90);
    });

    it('should return original price when multiplier is 1.0', () => {
      const price = applyRegionalMultiplier(100, 1.0);
      expect(price).toBe(100);
    });

    it('should handle undefined multiplier (defaults to 1.0)', () => {
      const price = applyRegionalMultiplier(100, undefined as any);
      expect(price).toBe(100);
    });

    it('should handle zero multiplier', () => {
      const price = applyRegionalMultiplier(100, 0);
      expect(price).toBe(0);
    });
  });

  describe('isValidRegionalMultiplier', () => {
    it('should accept valid multiplier in range [0.5, 2.0]', () => {
      expect(isValidRegionalMultiplier(1.0)).toBe(true);
      expect(isValidRegionalMultiplier(0.5)).toBe(true);
      expect(isValidRegionalMultiplier(2.0)).toBe(true);
      expect(isValidRegionalMultiplier(1.5)).toBe(true);
    });

    it('should reject multiplier below 0.5', () => {
      expect(isValidRegionalMultiplier(0.4)).toBe(false);
      expect(isValidRegionalMultiplier(0)).toBe(false);
      expect(isValidRegionalMultiplier(-0.5)).toBe(false);
    });

    it('should reject multiplier above 2.0', () => {
      expect(isValidRegionalMultiplier(2.1)).toBe(false);
      expect(isValidRegionalMultiplier(3.0)).toBe(false);
    });

    it('should reject zero multiplier', () => {
      expect(isValidRegionalMultiplier(0)).toBe(false);
    });
  });

  describe('getDefaultRegionalMultiplier', () => {
    it('should return 1.0 as default', () => {
      const multiplier = getDefaultRegionalMultiplier();
      expect(multiplier).toBe(1.0);
    });
  });
});

describe('Pricing Calculation - Variation Adjustments', () => {
  describe('applyVariationAdjustment', () => {
    it('should add positive adjustment to base price', () => {
      const price = applyVariationAdjustment(100, 10);
      expect(price).toBe(110);
    });

    it('should subtract negative adjustment from base price', () => {
      const price = applyVariationAdjustment(100, -10);
      expect(price).toBe(90);
    });

    it('should return base price when adjustment is zero', () => {
      const price = applyVariationAdjustment(100, 0);
      expect(price).toBe(100);
    });

    it('should handle undefined adjustment (defaults to 0)', () => {
      const price = applyVariationAdjustment(100, undefined as any);
      expect(price).toBe(100);
    });
  });

  describe('sumVariationAdjustments', () => {
    it('should sum multiple positive adjustments', () => {
      const total = sumVariationAdjustments([10, 5, 3]);
      expect(total).toBe(18);
    });

    it('should handle mixed positive and negative adjustments', () => {
      const total = sumVariationAdjustments([10, -5, 3, -2]);
      expect(total).toBe(6);
    });

    it('should return 0 for empty array', () => {
      const total = sumVariationAdjustments([]);
      expect(total).toBe(0);
    });

    it('should handle undefined values in array', () => {
      const total = sumVariationAdjustments([10, undefined, 5] as any);
      expect(total).toBe(15);
    });

    it('should handle all zeros', () => {
      const total = sumVariationAdjustments([0, 0, 0]);
      expect(total).toBe(0);
    });
  });
});

describe('Pricing Calculation - Complete Flow', () => {
  describe('calculateCustomerPriceClientSide', () => {
    const defaultInput = {
      supplierPrice: 100,
      customerType: 'b2b' as CustomerType,
    };

    it('should calculate B2B price with 30% commission', () => {
      const price = calculateCustomerPriceClientSide({
        ...defaultInput,
        customerType: 'b2b',
      });
      expect(price).toBe(130);
    });

    it('should calculate B2C price with 50% commission', () => {
      const price = calculateCustomerPriceClientSide({
        ...defaultInput,
        customerType: 'b2c',
      });
      expect(price).toBe(150);
    });

    it('should apply regional multiplier correctly', () => {
      const price = calculateCustomerPriceClientSide({
        ...defaultInput,
        supplierPrice: 100,
        regionalMultiplier: 1.1,
        customerType: 'b2b',
      });
      // 100 * 1.1 = 110, 110 * 1.3 = 143
      expect(price).toBe(143);
    });

    it('should apply variation adjustments correctly', () => {
      const price = calculateCustomerPriceClientSide({
        ...defaultInput,
        supplierPrice: 100,
        variationAdjustments: [10, -5],
        customerType: 'b2b',
      });
      // 100 + 5 = 105, 105 * 1.3 = 136.5
      expect(price).toBe(136.5);
    });

    it('should apply both regional and variation adjustments', () => {
      const price = calculateCustomerPriceClientSide({
        ...defaultInput,
        supplierPrice: 100,
        regionalMultiplier: 1.1,
        variationAdjustments: [5],
        customerType: 'b2c',
      });
      // 100 * 1.1 = 110, 110 + 5 = 115, 115 * 1.5 = 172.5
      expect(price).toBe(172.5);
    });

    it('should round to 2 decimal places', () => {
      const price = calculateCustomerPriceClientSide({
        ...defaultInput,
        supplierPrice: 99.99,
        customerType: 'b2b',
      });
      expect(price).toBeCloseTo(129.987, 3);
    });
  });

  describe('createPriceCalculationResultClientSide', () => {
    const mockSupplierProduct = {
      id: 'sp-123',
      supplier_id: 'sup-1',
      supplier_name: 'Test Supplier',
      price: 100,
      stock_quantity: 50,
      availability: 'plenty' as const,
      min_order_quantity: 10,
    };

    it('should create complete price calculation result for B2B', () => {
      const result = createPriceCalculationResultClientSide({
        productId: 'prod-1',
        regionId: 'reg-1',
        customerType: 'b2b',
        supplierProduct: mockSupplierProduct,
      });

      expect(result.supplier_price).toBe(100);
      expect(result.base_price).toBe(100);
      expect(result.commission_rate).toBe(0.30);
      expect(result.commission_amount).toBe(30);
      expect(result.final_price).toBe(130);
      expect(result.supplier_name).toBe('Test Supplier');
      expect(result.is_available).toBe(true);
      expect(result.min_order_quantity).toBe(10);
    });

    it('should create complete price calculation result for B2C', () => {
      const result = createPriceCalculationResultClientSide({
        productId: 'prod-1',
        regionId: 'reg-1',
        customerType: 'b2c',
        supplierProduct: mockSupplierProduct,
      });

      expect(result.supplier_price).toBe(100);
      expect(result.commission_rate).toBe(0.50);
      expect(result.commission_amount).toBe(50);
      expect(result.final_price).toBe(150);
    });

    it('should handle out of stock products', () => {
      const outOfStockProduct = {
        ...mockSupplierProduct,
        stock_quantity: 0,
      };

      const result = createPriceCalculationResultClientSide({
        productId: 'prod-1',
        regionId: 'reg-1',
        customerType: 'b2b',
        supplierProduct: outOfStockProduct,
      });

      expect(result.is_available).toBe(false);
      expect(result.stock_quantity).toBe(0);
    });

    it('should apply regional multiplier', () => {
      const result = createPriceCalculationResultClientSide({
        productId: 'prod-1',
        regionId: 'reg-1',
        customerType: 'b2b',
        supplierProduct: mockSupplierProduct,
        regionalMultiplier: 1.1,
      });

      expect(result.regional_multiplier).toBe(1.1);
      expect(result.base_price).toBe(110);
      expect(result.final_price).toBe(143);
    });

    it('should apply variation adjustments', () => {
      const result = createPriceCalculationResultClientSide({
        productId: 'prod-1',
        regionId: 'reg-1',
        customerType: 'b2b',
        supplierProduct: mockSupplierProduct,
        variationAdjustments: [10, -5],
      });

      expect(result.variation_adjustment).toBe(5);
      expect(result.base_price).toBe(105);
      expect(result.final_price).toBe(136.5);
    });
  });
});

describe('Pricing Calculation - Cart Operations', () => {
  describe('calculateCartItemPrice', () => {
    const mockPriceResult: PriceCalculationResult = {
      supplier_price: 100,
      regional_multiplier: 1.0,
      variation_adjustment: 0,
      base_price: 100,
      commission_rate: 0.30,
      commission_amount: 30,
      final_price: 130,
      supplier_id: 'sup-1',
      supplier_name: 'Test Supplier',
      supplier_product_id: 'sp-1',
      stock_quantity: 50,
      availability: 'plenty',
      is_available: true,
      min_order_quantity: 10,
    };

    it('should calculate total for single quantity', () => {
      const cartItem = calculateCartItemPrice(mockPriceResult, 1);
      expect(cartItem.total_price).toBe(130);
      expect(cartItem.quantity).toBe(1);
    });

    it('should calculate total for multiple quantities', () => {
      const cartItem = calculateCartItemPrice(mockPriceResult, 5);
      expect(cartItem.total_price).toBe(650);
      expect(cartItem.quantity).toBe(5);
    });

    it('should preserve all price result fields', () => {
      const cartItem = calculateCartItemPrice(mockPriceResult, 2);
      expect(cartItem.supplier_name).toBe('Test Supplier');
      expect(cartItem.final_price).toBe(130);
      expect(cartItem.commission_amount).toBe(30);
    });

    it('should handle zero quantity', () => {
      const cartItem = calculateCartItemPrice(mockPriceResult, 0);
      expect(cartItem.total_price).toBe(0);
    });
  });

  describe('calculateCartTotal', () => {
    it('should sum multiple cart items', () => {
      const items = [
        { total_price: 130 } as any,
        { total_price: 200 } as any,
        { total_price: 70 } as any,
      ];
      const total = calculateCartTotal(items);
      expect(total).toBe(400);
    });

    it('should return 0 for empty cart', () => {
      const total = calculateCartTotal([]);
      expect(total).toBe(0);
    });

    it('should handle single item', () => {
      const items = [{ total_price: 130 } as any];
      const total = calculateCartTotal(items);
      expect(total).toBe(130);
    });

    it('should handle decimal prices', () => {
      const items = [
        { total_price: 99.99 } as any,
        { total_price: 50.50 } as any,
      ];
      const total = calculateCartTotal(items);
      expect(total).toBeCloseTo(150.49, 2);
    });
  });
});

describe('Pricing Calculation - Validation', () => {
  describe('validatePriceInput', () => {
    it('should pass valid B2B input', () => {
      const result = validatePriceInput({
        product_id: 'prod-1',
        region_id: 'reg-1',
        customer_type: 'b2b',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass valid B2C input', () => {
      const result = validatePriceInput({
        product_id: 'prod-1',
        region_id: 'reg-1',
        customer_type: 'b2c',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when product_id is missing', () => {
      const result = validatePriceInput({
        product_id: '',
        region_id: 'reg-1',
        customer_type: 'b2b',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product ID is required');
    });

    it('should fail when region_id is missing', () => {
      const result = validatePriceInput({
        product_id: 'prod-1',
        region_id: null,
        customer_type: 'b2b',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Region ID is required');
    });

    it('should fail when customer_type is invalid', () => {
      const result = validatePriceInput({
        product_id: 'prod-1',
        region_id: 'reg-1',
        customer_type: 'invalid' as any,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid customer type (b2b or b2c) is required');
    });

    it('should report multiple errors', () => {
      const result = validatePriceInput({
        product_id: '',
        region_id: null,
        customer_type: 'invalid' as any,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validatePriceResult', () => {
    const validResult: PriceCalculationResult = {
      supplier_price: 100,
      regional_multiplier: 1.0,
      variation_adjustment: 0,
      base_price: 100,
      commission_rate: 0.30,
      commission_amount: 30,
      final_price: 130,
      supplier_id: 'sup-1',
      supplier_name: 'Test Supplier',
      supplier_product_id: 'sp-1',
      stock_quantity: 50,
      availability: 'plenty',
      is_available: true,
      min_order_quantity: 10,
    };

    it('should pass valid price result', () => {
      const result = validatePriceResult(validResult);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when supplier_price is negative', () => {
      const invalidResult = { ...validResult, supplier_price: -10 };
      const result = validatePriceResult(invalidResult);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Supplier price cannot be negative');
    });

    it('should fail when final_price is negative', () => {
      const invalidResult = { ...validResult, final_price: -10 };
      const result = validatePriceResult(invalidResult);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Final price cannot be negative');
    });

    it('should fail when commission_amount is negative', () => {
      const invalidResult = { ...validResult, commission_amount: -5 };
      const result = validatePriceResult(invalidResult);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Commission amount cannot be negative');
    });

    it('should fail when commission_rate is out of range', () => {
      const invalidResult1 = { ...validResult, commission_rate: -0.1 };
      const result1 = validatePriceResult(invalidResult1);
      expect(result1.isValid).toBe(false);

      const invalidResult2 = { ...validResult, commission_rate: 1.5 };
      const result2 = validatePriceResult(invalidResult2);
      expect(result2.isValid).toBe(false);
    });

    it('should fail when regional_multiplier is not positive', () => {
      const invalidResult = { ...validResult, regional_multiplier: 0 };
      const result = validatePriceResult(invalidResult);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Regional multiplier must be positive');
    });
  });
});

describe('Pricing Calculation - Display Helpers', () => {
  describe('formatPrice', () => {
    it('should format price in Turkish Lira', () => {
      const formatted = formatPrice(100);
      expect(formatted).toContain('100');
      expect(formatted).toContain('₺');
    });

    it('should format decimal prices', () => {
      const formatted = formatPrice(99.99);
      expect(formatted).toContain('99,99');
    });

    it('should format zero price', () => {
      const formatted = formatPrice(0);
      expect(formatted).toContain('0');
    });
  });

  describe('formatPriceChange', () => {
    it('should detect price increase', () => {
      const result = formatPriceChange(110, 100);
      expect(result.type).toBe('increased');
      expect(result.percentage).toBe(10);
    });

    it('should detect price decrease', () => {
      const result = formatPriceChange(90, 100);
      expect(result.type).toBe('decreased');
      expect(result.percentage).toBe(-10);
    });

    it('should detect stable price', () => {
      const result = formatPriceChange(100, 100);
      expect(result.type).toBe('stable');
      expect(result.percentage).toBe(0);
    });

    it('should handle null previous price', () => {
      const result = formatPriceChange(100, null);
      expect(result.type).toBe('stable');
      expect(result.percentage).toBeNull();
      expect(result.formatted).toBe('Yeni fiyat');
    });

    it('should handle zero previous price', () => {
      const result = formatPriceChange(100, 0);
      expect(result.type).toBe('stable');
      expect(result.percentage).toBeNull();
    });
  });

  describe('formatCommissionRate', () => {
    it('should format 0.30 as 30%', () => {
      const formatted = formatCommissionRate(0.30);
      expect(formatted).toBe('%30');
    });

    it('should format 0.50 as 50%', () => {
      const formatted = formatCommissionRate(0.50);
      expect(formatted).toBe('%50');
    });

    it('should round decimal rates', () => {
      const formatted = formatCommissionRate(0.333);
      expect(formatted).toBe('%33');
    });
  });
});
