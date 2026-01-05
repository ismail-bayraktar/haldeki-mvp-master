import { describe, it, expect } from 'vitest';
import { mergeProductsWithRegion, sortByAvailability, getStockLabel } from './productUtils';
import { Product, RegionProductInfo, ProductWithRegionInfo } from '../types';

describe('productUtils', () => {
  describe('mergeProductsWithRegion', () => {
    it('should correctly merge products with region info', () => {
      const mockProducts: Product[] = [
        { id: '1', name: 'Apple', slug: 'apple', categoryId: 'fruits', categoryName: 'Fruits', price: 10, unit: 'kg', origin: 'TR', quality: 'standart', arrivalDate: '', availability: 'plenty', isBugunHalde: false, priceChange: 'stable', images: [] },
        { id: '2', name: 'Banana', slug: 'banana', categoryId: 'fruits', categoryName: 'Fruits', price: 20, unit: 'kg', origin: 'TR', quality: 'standart', arrivalDate: '', availability: 'plenty', isBugunHalde: false, priceChange: 'stable', images: [] },
      ];

      const mockRegionProducts: RegionProductInfo[] = [
        { id: 'rp1', region_id: 'reg1', product_id: '1', price: 12, business_price: 11, previous_price: 15, price_change: 'down', availability: 'plenty', stock_quantity: 100, is_active: true },
      ];

      const result = mergeProductsWithRegion(mockProducts, mockRegionProducts);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].regionInfo).not.toBeNull();
      expect(result[0].regionInfo?.price).toBe(12);
      expect(result[0].regionInfo?.businessPrice).toBe(11);
      expect(result[1].id).toBe('2');
      expect(result[1].regionInfo).toBeNull();
    });
  });

  describe('sortByAvailability', () => {
    it('should sort products correctly: in region first, then by stock', () => {
      const mockProducts: ProductWithRegionInfo[] = [
        { id: '1', name: 'No Region', regionInfo: null } as any,
        { id: '2', name: 'In Stock', regionInfo: { stockQuantity: 10, isAvailable: true } } as any,
        { id: '3', name: 'Out of Stock', regionInfo: { stockQuantity: 0, isAvailable: false } } as any,
      ];

      const result = sortByAvailability(mockProducts);

      expect(result[0].id).toBe('2'); // In Stock
      expect(result[1].id).toBe('3'); // Out of Stock
      expect(result[2].id).toBe('1'); // No Region
    });
  });

  describe('getStockLabel', () => {
    it('should return correct label for different stock levels', () => {
      expect(getStockLabel(0, 'kg')).toBe('Tükendi');
      expect(getStockLabel(5, 'kg')).toBe('Son 5 kg');
      expect(getStockLabel(15, 'kg')).toBe('Stok: 15 kg');
    });
  });
});
