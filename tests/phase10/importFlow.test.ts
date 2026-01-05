/**
 * Import Flow Integration Tests
 * Phase 10.4 - Integration tests for complete import workflow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateProductRows, normalizeProductRow } from '@/lib/productValidator';
import type { ProductImportRow } from '@/types/supplier';

describe('Import Flow Integration', () => {
  describe('Data Normalization', () => {
    it('should normalize product data from import', () => {
      const rawRow: ProductImportRow = {
        name: '  Domates  ',
        category: 'sebzeler',
        unit: 'kg',
        basePrice: 25.5,
        price: 30,
        stock: 100,
        origin: 'türkiye',
        quality: 'standart',
        availability: 'plenty',
        description: ' Taze domates ',
        images: ['http://img.jpg', 'http://img2.jpg'],
      };

      const normalized = normalizeProductRow(rawRow);

      expect(normalized.name).toBe('Domates');
      expect(normalized.category).toBe('sebzeler');
      expect(normalized.unit).toBe('kg');
      expect(normalized.origin).toBe('türkiye'); // Origin is trimmed but not capitalized
      expect(normalized.quality).toBe('standart');
      expect(normalized.availability).toBe('plenty');
      expect(normalized.description).toBe('Taze domates');
      expect(normalized.images).toEqual(['http://img.jpg', 'http://img2.jpg']);
    });

    it('should handle missing optional fields', () => {
      const rawRow: ProductImportRow = {
        name: 'Test',
        category: 'diger',
        unit: 'adet',
        basePrice: 10,
        price: 15,
        stock: 50,
        origin: '',
        quality: '',
        availability: '',
        description: null,
        images: [],
      };

      const normalized = normalizeProductRow(rawRow);

      expect(normalized.origin).toBe('Türkiye'); // Origin defaults to 'Türkiye' when empty
      expect(normalized.quality).toBe('standart');
      expect(normalized.availability).toBe('plenty');
      expect(normalized.description).toBeNull();
    });
  });

  describe('Validation Flow', () => {
    it('should validate multiple rows and return all errors', () => {
      const rows: ProductImportRow[] = [
        {
          name: 'Valid Product',
          category: 'sebzeler',
          unit: 'kg',
          basePrice: 10,
          price: 15,
          stock: 100,
          origin: 'türkiye',
          quality: 'standart',
          availability: 'plenty',
          description: null,
          images: [],
        },
        {
          name: '', // Invalid: empty name
          category: 'sebzeler',
          unit: 'kg',
          basePrice: 10,
          price: 15,
          stock: 100,
          origin: 'türkiye',
          quality: 'standart',
          availability: 'plenty',
          description: null,
          images: [],
        },
        {
          name: 'Another Valid',
          category: 'meyveler',
          unit: 'adet',
          basePrice: 5,
          price: 8,
          stock: 50,
          origin: 'türkiye',
          quality: 'premium',
          availability: 'limited',
          description: 'Good quality',
          images: [],
        },
      ];

      const result = validateProductRows(rows);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].row).toBe(3); // Row 3 (header + 2 data rows, array index 1)
    });

    it('should return valid result for all good rows', () => {
      const rows: ProductImportRow[] = [
        {
          name: 'Product 1',
          category: 'sebzeler',
          unit: 'kg',
          basePrice: 10,
          price: 15,
          stock: 100,
          origin: 'türkiye',
          quality: 'standart',
          availability: 'plenty',
          description: null,
          images: [],
        },
        {
          name: 'Product 2',
          category: 'meyveler',
          unit: 'adet',
          basePrice: 5,
          price: 8,
          stock: 50,
          origin: 'türkiye',
          quality: 'premium',
          availability: 'limited',
          description: 'Good',
          images: [],
        },
      ];

      const result = validateProductRows(rows);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Turkish Character Handling', () => {
    it('should handle Turkish characters in validation', () => {
      const rows: ProductImportRow[] = [
        {
          name: 'Çilek',
          category: 'meyveler',
          unit: 'kg',
          basePrice: 50,
          price: 60,
          stock: 100,
          origin: 'türkiye',
          quality: 'standart',
          availability: 'plenty',
          description: 'Taze çilek',
          images: [],
        },
        {
          name: 'Yoğurt',
          category: 'sut-urunleri',
          unit: 'kg',
          basePrice: 40,
          price: 50,
          stock: 80,
          origin: 'türkiye',
          quality: 'standart',
          availability: 'plenty',
          description: null,
          images: [],
        },
      ];

      const result = validateProductRows(rows);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Complete Import Simulation', () => {
    it('should simulate successful import flow', () => {
      // Simulate Excel file content
      const excelData: ProductImportRow[] = [
        {
          name: 'Domates',
          category: 'sebzeler',
          unit: 'kg',
          basePrice: 25,
          price: 30,
          stock: 100,
          origin: 'türkiye',
          quality: 'standart',
          availability: 'plenty',
          description: 'Taze domates',
          images: ['http://img1.jpg'],
        },
        {
          name: 'Patates',
          category: 'sebzeler',
          unit: 'kg',
          basePrice: 15,
          price: 20,
          stock: 200,
          origin: 'türkiye',
          quality: 'ekonomik',
          availability: 'plenty',
          description: null,
          images: [],
        },
      ];

      // Step 1: Validate
      const validationResult = validateProductRows(excelData);
      expect(validationResult.isValid).toBe(true);

      // Step 2: Normalize
      const normalized = excelData.map(normalizeProductRow);
      expect(normalized[0].category).toBe('sebzeler');
      expect(normalized[1].quality).toBe('ekonomik');

      // Step 3: Prepare for database (simulate)
      const dbRecords = normalized.map(row => ({
        name: row.name,
        category: row.category,
        base_price: row.basePrice,
        price: row.price,
        unit: row.unit,
        stock: row.stock,
        origin: row.origin,
        quality: row.quality,
        availability: row.availability,
        description: row.description,
        images: row.images,
        is_active: true,
      }));

      expect(dbRecords).toHaveLength(2);
      expect(dbRecords[0].name).toBe('Domates');
    });

    it('should handle partial success scenario', () => {
      const mixedData: ProductImportRow[] = [
        {
          name: 'Valid Product',
          category: 'sebzeler',
          unit: 'kg',
          basePrice: 10,
          price: 15,
          stock: 100,
          origin: 'türkiye',
          quality: 'standart',
          availability: 'plenty',
          description: null,
          images: [],
        },
        {
          name: '', // Invalid
          category: 'sebzeler',
          unit: 'kg',
          basePrice: -5, // Invalid
          price: 15,
          stock: 100,
          origin: 'türkiye',
          quality: 'standart',
          availability: 'plenty',
          description: null,
          images: [],
        },
        {
          name: 'Another Valid',
          category: 'meyveler',
          unit: 'adet',
          basePrice: 5,
          price: 8,
          stock: 50,
          origin: 'türkiye',
          quality: 'premium',
          availability: 'limited',
          description: null,
          images: [],
        },
      ];

      const result = validateProductRows(mixedData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // First and third products are valid, middle one has errors
    });
  });
});
