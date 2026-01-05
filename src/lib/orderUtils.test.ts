// orderUtils.test.ts - Complete test suite for order utilities
// Tests: validateOrderForRepeat (12), calculatePriceDifference (6), formatPrice (5), getUnavailableReasonMessage (6)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateOrderForRepeat, calculatePriceDifference, formatPrice, getUnavailableReasonMessage } from './orderUtils';
import type { OrderItem, RepeatOrderValidationResult, Product } from '@/types';

// Mock supabase client - inline to avoid hoisting issues
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn(),
  };
  return {
    supabase: mockSupabase,
  };
});

// Import the mocked supabase
import { supabase } from '@/integrations/supabase/client';

describe('orderUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== validateOrderForRepeat Tests (12) ====================
  describe('validateOrderForRepeat', () => {
    const mockOrderItems: OrderItem[] = [
      {
        productId: 'prod-1',
        productName: 'Domates',
        quantity: 2,
        unitPrice: 50,
        businessUnitPrice: null,
      },
      {
        productId: 'prod-2',
        productName: 'Salatalık',
        quantity: 1,
        unitPrice: 30,
        businessUnitPrice: null,
      },
    ];

    it('should return all items as available when products exist and are in stock', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Domates', unit: 'kg', is_active: true },
        { id: 'prod-2', name: 'Salatalık', unit: 'adet', is_active: true },
      ];

      const mockRegionProducts = [
        {
          product_id: 'prod-1',
          price: 50,
          business_price: null,
          stock_quantity: 100,
          is_active: true,
        },
        {
          product_id: 'prod-2',
          price: 30,
          business_price: null,
          stock_quantity: 50,
          is_active: true,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat(mockOrderItems, 'region-123', false);

      expect(result.canRepeat).toBe(true);
      expect(result.availableItems).toHaveLength(2);
      expect(result.unavailableItems).toHaveLength(0);
      expect(result.priceDifference).toBe(0);
      expect(result.priceIncreased).toBe(false);
    });

    it('should mark item as unavailable when product not found', async () => {
      const mockProducts = [
        { id: 'prod-2', name: 'Salatalık', unit: 'adet', is_active: true },
      ];

      const mockRegionProducts = [
        {
          product_id: 'prod-2',
          price: 30,
          business_price: null,
          stock_quantity: 50,
          is_active: true,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat(mockOrderItems, 'region-123', false);

      expect(result.canRepeat).toBe(true);
      expect(result.availableItems).toHaveLength(1);
      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0]).toMatchObject({
        productId: 'prod-1',
        productName: 'Domates',
        reason: 'not_found',
      });
    });

    it('should mark item as unavailable when product is inactive', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Domates', unit: 'kg', is_active: false },
        { id: 'prod-2', name: 'Salatalık', unit: 'adet', is_active: true },
      ];

      const mockRegionProducts = [
        {
          product_id: 'prod-2',
          price: 30,
          business_price: null,
          stock_quantity: 50,
          is_active: true,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat(mockOrderItems, 'region-123', false);

      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].reason).toBe('inactive');
    });

    it('should mark item as unavailable when product not in region', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Domates', unit: 'kg', is_active: true },
        { id: 'prod-2', name: 'Salatalık', unit: 'adet', is_active: true },
      ];

      const mockRegionProducts = [
        {
          product_id: 'prod-2',
          price: 30,
          business_price: null,
          stock_quantity: 50,
          is_active: true,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat(mockOrderItems, 'region-123', false);

      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].reason).toBe('not_in_region');
    });

    it('should mark item as unavailable when region product is inactive', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Domates', unit: 'kg', is_active: true },
        { id: 'prod-2', name: 'Salatalık', unit: 'adet', is_active: true },
      ];

      const mockRegionProducts = [
        {
          product_id: 'prod-1',
          price: 50,
          business_price: null,
          stock_quantity: 100,
          is_active: false,
        },
        {
          product_id: 'prod-2',
          price: 30,
          business_price: null,
          stock_quantity: 50,
          is_active: true,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat(mockOrderItems, 'region-123', false);

      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].reason).toBe('inactive');
    });

    it('should mark item as unavailable when out of stock', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Domates', unit: 'kg', is_active: true },
        { id: 'prod-2', name: 'Salatalık', unit: 'adet', is_active: true },
      ];

      const mockRegionProducts = [
        {
          product_id: 'prod-1',
          price: 50,
          business_price: null,
          stock_quantity: 0,
          is_active: true,
        },
        {
          product_id: 'prod-2',
          price: 30,
          business_price: null,
          stock_quantity: 50,
          is_active: true,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat(mockOrderItems, 'region-123', false);

      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].reason).toBe('out_of_stock');
    });

    it('should calculate price difference when prices changed', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Domates', unit: 'kg', is_active: true },
        { id: 'prod-2', name: 'Salatalık', unit: 'adet', is_active: true },
      ];

      const mockRegionProducts = [
        {
          product_id: 'prod-1',
          price: 60,
          business_price: null,
          stock_quantity: 100,
          is_active: true,
        },
        {
          product_id: 'prod-2',
          price: 25,
          business_price: null,
          stock_quantity: 50,
          is_active: true,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat(mockOrderItems, 'region-123', false);

      expect(result.totalOldPrice).toBe(130);
      expect(result.totalNewPrice).toBe(145);
      expect(result.priceDifference).toBe(15);
      expect(result.priceIncreased).toBe(true);
    });

    it('should use business price for business users', async () => {
      const mockBusinessOrderItems: OrderItem[] = [
        {
          productId: 'prod-1',
          productName: 'Domates',
          quantity: 5,
          unitPrice: 50,
          businessUnitPrice: 40,
        },
      ];

      const mockProducts = [
        { id: 'prod-1', name: 'Domates', unit: 'kg', is_active: true },
      ];

      const mockRegionProducts = [
        {
          product_id: 'prod-1',
          price: 55,
          business_price: 45,
          stock_quantity: 100,
          is_active: true,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat(mockBusinessOrderItems, 'region-123', true);

      expect(result.availableItems[0].price).toBe(45);
      expect(result.availableItems[0].oldPrice).toBe(40);
      expect(result.availableItems[0].businessPrice).toBe(45);
    });

    it('should return canRepeat false when all items unavailable', async () => {
      const mockProducts: any[] = [];
      const mockRegionProducts: any[] = [];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat(mockOrderItems, 'region-123', false);

      expect(result.canRepeat).toBe(false);
      expect(result.availableItems).toHaveLength(0);
      expect(result.unavailableItems).toHaveLength(2);
    });

    it('should mark item as priceChanged when price differs', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Domates', unit: 'kg', is_active: true },
      ];

      const mockRegionProducts = [
        {
          product_id: 'prod-1',
          price: 55,
          business_price: null,
          stock_quantity: 100,
          is_active: true,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockRegionProducts, error: null })),
            })),
          })),
        } as never);

      const result = await validateOrderForRepeat([mockOrderItems[0]], 'region-123', false);

      expect(result.availableItems[0].priceChanged).toBe(true);
    });

    it('should throw error when products fetch fails', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB Error' } })),
        })),
      } as never);

      await expect(
        validateOrderForRepeat(mockOrderItems, 'region-123', false)
      ).rejects.toThrow('Ürün bilgileri alınamadı');
    });

    it('should throw error when region products fetch fails', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Domates', unit: 'kg', is_active: true },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        } as never)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB Error' } })),
            })),
          })),
        } as never);

      await expect(
        validateOrderForRepeat(mockOrderItems, 'region-123', false)
      ).rejects.toThrow('Bölge ürün bilgileri alınamadı');
    });
  });

  // ==================== calculatePriceDifference Tests (6) ====================
  describe('calculatePriceDifference', () => {
    it('should return zero when prices are the same', () => {
      const oldItems: OrderItem[] = [
        { productId: '1', productName: 'A', quantity: 2, unitPrice: 50 },
      ];
      const newItems = [
        { product: { id: '1', name: 'A', unit: 'kg' } as any, quantity: 2, price: 50 },
      ];

      const result = calculatePriceDifference(oldItems, newItems);
      expect(result).toBe(0);
    });

    it('should return positive value when price increased', () => {
      const oldItems: OrderItem[] = [
        { productId: '1', productName: 'A', quantity: 2, unitPrice: 50 },
      ];
      const newItems = [
        { product: { id: '1', name: 'A', unit: 'kg' } as any, quantity: 2, price: 60 },
      ];

      const result = calculatePriceDifference(oldItems, newItems);
      expect(result).toBe(20);
    });

    it('should return negative value when price decreased', () => {
      const oldItems: OrderItem[] = [
        { productId: '1', productName: 'A', quantity: 2, unitPrice: 50 },
      ];
      const newItems = [
        { product: { id: '1', name: 'A', unit: 'kg' } as any, quantity: 2, price: 40 },
      ];

      const result = calculatePriceDifference(oldItems, newItems);
      expect(result).toBe(-20);
    });

    it('should handle multiple items correctly', () => {
      const oldItems: OrderItem[] = [
        { productId: '1', productName: 'A', quantity: 2, unitPrice: 50 },
        { productId: '2', productName: 'B', quantity: 1, unitPrice: 30 },
      ];
      const newItems = [
        { product: { id: '1', name: 'A', unit: 'kg' } as any, quantity: 2, price: 60 },
        { product: { id: '2', name: 'B', unit: 'adet' } as any, quantity: 1, price: 25 },
      ];

      const result = calculatePriceDifference(oldItems, newItems);
      expect(result).toBe(15);
    });

    it('should use business price when available', () => {
      const oldItems: OrderItem[] = [
        {
          productId: '1',
          productName: 'A',
          quantity: 5,
          unitPrice: 50,
          businessUnitPrice: 40,
        },
      ];
      const newItems = [
        { product: { id: '1', name: 'A', unit: 'kg' } as any, quantity: 5, price: 45 },
      ];

      const result = calculatePriceDifference(oldItems, newItems);
      expect(result).toBe(25);
    });

    it('should handle empty arrays', () => {
      const result = calculatePriceDifference([], []);
      expect(result).toBe(0);
    });
  });

  // ==================== formatPrice Tests (5) ====================
  describe('formatPrice', () => {
    it('should format integer price correctly', () => {
      expect(formatPrice(100)).toBe('₺100.00');
    });

    it('should format decimal price correctly', () => {
      expect(formatPrice(99.99)).toBe('₺99.99');
    });

    it('should format small price correctly', () => {
      expect(formatPrice(0.5)).toBe('₺0.50');
    });

    it('should handle zero', () => {
      expect(formatPrice(0)).toBe('₺0.00');
    });

    it('should format large price correctly', () => {
      expect(formatPrice(9999.99)).toBe('₺9999.99');
    });
  });

  // ==================== getUnavailableReasonMessage Tests (6) ====================
  describe('getUnavailableReasonMessage', () => {
    it('should return message for not_found reason', () => {
      expect(getUnavailableReasonMessage('not_found')).toBe('Bu ürün artık satışta değil');
    });

    it('should return message for not_in_region reason', () => {
      expect(getUnavailableReasonMessage('not_in_region')).toBe('Bu ürün seçili bölgenizde mevcut değil');
    });

    it('should return message for out_of_stock reason', () => {
      expect(getUnavailableReasonMessage('out_of_stock')).toBe('Bu ürün şu anda stokta yok');
    });

    it('should return message for inactive reason', () => {
      expect(getUnavailableReasonMessage('inactive')).toBe('Bu ürün geçici olarak kullanım dışı');
    });

    it('should return message for region_changed reason', () => {
      expect(getUnavailableReasonMessage('region_changed')).toBe('Bölge değişikliği nedeniyle bu ürün mevcut değil');
    });

    it('should return default message for unknown reason', () => {
      expect(getUnavailableReasonMessage('unknown' as any)).toBe('Bu ürün şu anda mevcut değil');
    });
  });
});
