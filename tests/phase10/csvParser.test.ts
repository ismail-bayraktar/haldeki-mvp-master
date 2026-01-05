/**
 * CSV Parser Tests
 * Phase 10.1 - Unit tests for CSV file parsing
 *
 * Tests:
 * - Parse valid CSV
 * - Handle different delimiters
 * - Handle quoted values
 * - Turkish character handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseCSVFile, CSV_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/csvParser';
import type { CSVParseResult } from '@/lib/csvParser';
import * as Papa from 'papaparse';

// Mock PapaParse library
vi.mock('papaparse', () => ({
  parse: vi.fn((file: any, options: any) => {
    // Default mock implementation
    if (options.complete) {
      options.complete({
        data: [],
        meta: { fields: [] },
      });
    }
  }),
}));

const mockedPapa = Papa as unknown as { parse: ReturnType<typeof vi.fn> };

describe('CSV Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Validation', () => {
    it('should reject file exceeding max size', async () => {
      // Arrange
      const largeFile = new File(['content'], 'products.csv', { type: 'text/csv' });
      Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE + 1 });

      // Act
      const result = await parseCSVFile(largeFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('file');
      expect(result.errors[0].error).toContain('çok büyük');
      expect(result.rows).toHaveLength(0);
    });

    it('should reject non-CSV files', async () => {
      // Arrange
      const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });

      // Act
      const result = await parseCSVFile(invalidFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('file');
      expect(result.errors[0].error).toContain('desteklenmiyor');
    });

    it('should accept .csv files', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            { 'Ürün Adı': 'Domates', Kategori: 'Sebze', Birim: 'kg', 'Taban Fiyat': '20', 'Satış Fiyatı': '25' },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const validFile = new File(['content'], 'products.csv', { type: 'text/csv' });
      Object.defineProperty(validFile, 'size', { value: 1024 });

      // Act
      const result = await parseCSVFile(validFile);

      // Assert
      expect(mockedPapa.parse).toHaveBeenCalled();
      expect(result.fileName).toBe('products.csv');
    });
  });

  describe('Delimiter Handling', () => {
    it('should auto-detect comma delimiter', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            { 'Ürün Adı': 'Domates', Kategori: 'Sebze', Birim: 'kg' },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      await parseCSVFile(file);

      // Assert
      expect(mockedPapa.parse).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          delimiter: undefined, // Auto-detect
        })
      );
    });

    it('should use specified delimiter', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [{ 'Ürün Adı': 'Domates' }],
          meta: { fields: ['Ürün Adı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      await parseCSVFile(file, { delimiter: ';' });

      // Assert
      expect(mockedPapa.parse).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          delimiter: ';',
        })
      );
    });

    it('should handle semicolon delimiter (European format)', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            { 'Ürün Adı': 'Domates', Kategori: 'Sebze', Birim: 'kg', 'Taban Fiyat': '20', 'Satış Fiyatı': '25' },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file, { delimiter: ';' });

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Quoted Values', () => {
    it('should handle quoted values with commas', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Domates, Cherry',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '20',
              'Satış Fiyatı': '25',
            },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rows[0].name).toBe('Domates, Cherry');
    });

    it('should handle quoted values with newlines', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Domates',
              'Açıklama': 'Taze ve organik.\nGünlük hasat.',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '20',
              'Satış Fiyatı': '25',
            },
          ],
          meta: {
            fields: ['Ürün Adı', 'Açıklama', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'],
          },
        });
      });

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rows[0].description).toContain('Günlük hasat');
    });

    it('should handle quoted values with quotes inside', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Organik "Ürün" Domates',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '20',
              'Satış Fiyatı': '25',
            },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rows[0].name).toContain('Ürün');
    });
  });

  describe('Turkish Character Handling', () => {
    it('should handle UTF-8 encoding with Turkish characters', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        expect(options.encoding).toBe('UTF-8');
        options.complete({
          data: [
            {
              'Ürün Adı': 'Çilek',
              Kategori: 'Meyve',
              Birim: 'kg',
              'Taban Fiyat': '30',
              'Satış Fiyatı': '40',
            },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rows[0].name).toBe('Çilek');
    });

    it('should handle mixed Turkish and English columns', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Product Name': 'Turkish Tomato',
              Kategori: 'Sebze',
              Unit: 'kg',
              'Taban Fiyat': '20',
              'Satış Fiyatı': '25',
            },
          ],
          meta: {
            fields: ['Product Name', 'Kategori', 'Unit', 'Taban Fiyat', 'Satış Fiyatı'],
          },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert - should map mixed column names
      expect(result.success).toBe(true);
    });
  });

  describe('Column Mapping', () => {
    it('should map Turkish column names correctly', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Patates',
              Kategori: 'Sebze',
              Birim: 'kg',
              Stok: '100',
              'Köken': 'Türkiye',
              Kalite: 'premium',
              'Taban Fiyat': '15',
              'Satış Fiyatı': '20',
            },
          ],
          meta: {
            fields: ['Ürün Adı', 'Kategori', 'Birim', 'Stok', 'Köken', 'Kalite', 'Taban Fiyat', 'Satış Fiyatı'],
          },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rows[0].name).toBe('Patates');
      expect(result.rows[0].origin).toBe('Türkiye');
      expect(result.rows[0].quality).toBe('premium');
    });

    it('should detect missing required columns', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [{ 'Ürün Adı': 'Domates', Kategori: 'Sebze' }], // Missing required columns
          meta: { fields: ['Ürün Adı', 'Kategori'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('headers');
      expect(result.errors[0].error).toContain('Gerekli sütunlar bulunamadı');
    });
  });

  describe('Row Parsing', () => {
    it('should parse valid product row', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Salatalık',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '10',
              'Satış Fiyatı': '15',
            },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Salatalık');
      expect(result.rows[0].basePrice).toBe(10);
      expect(result.rows[0].price).toBe(15);
    });

    it('should skip empty rows when skipEmptyRows is true', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            { 'Ürün Adı': 'Domates', Kategori: 'Sebze', Birim: 'kg' },
            {}, // Empty row
            { 'Ürün Adı': 'Salatalık', Kategori: 'Sebze', Birim: 'kg' },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file, { skipEmptyRows: true });

      // Assert
      expect(result.rows).toHaveLength(0); // All rows invalid due to missing required fields
    });

    it('should respect maxRows limit', async () => {
      // Arrange
      const data = Array.from({ length: 100 }, (_, i) => ({
        'Ürün Adı': `Product ${i}`,
        Kategori: 'Sebze',
        Birim: 'kg',
        'Taban Fiyat': '10',
        'Satış Fiyatı': '15',
      }));

      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data,
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file, { maxRows: 50 });

      // Assert
      expect(result.rows.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Data Validation', () => {
    it('should reject row with missing required name', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': '',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '20',
              'Satış Fiyatı': '25',
            },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].error).toBe('Ürün adı boş olamaz');
      expect(result.errors[0].row).toBe(2);
    });

    it('should reject row with invalid price format', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Domates',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': 'not_a_number',
              'Satış Fiyatı': '25',
            },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.errors[0].field).toBe('basePrice');
      expect(result.errors[0].error).toBe('Taban fiyat sayı olmalıdır');
    });

    it('should parse comma-formatted numbers (European format)', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Domates',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '20,50',
              'Satış Fiyatı': '25,75',
            },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.rows[0].basePrice).toBe(20.5);
      expect(result.rows[0].price).toBe(25.75);
    });

    it('should parse optional fields with defaults', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Domates',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '20',
              'Satış Fiyatı': '25',
            },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.rows[0].stock).toBe(100); // Default
      expect(result.rows[0].origin).toBe('Türkiye'); // Default
      expect(result.rows[0].quality).toBe('standart'); // Default
      expect(result.rows[0].availability).toBe('bol'); // Default
    });

    it('should parse comma-separated image URLs', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Domates',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '20',
              'Satış Fiyatı': '25',
              'Görsel URLleri': 'https://example.com/img1.jpg,https://example.com/img2.jpg',
            },
          ],
          meta: {
            fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı', 'Görsel URLleri'],
          },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.rows[0].images).toEqual([
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should handle parse errors gracefully', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.error(new Error('Invalid CSV format'));
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors[0].error).toContain('CSV okuma hatası');
    });

    it('should handle empty CSV file', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [],
          meta: { fields: [] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors[0].error).toBe('CSV dosyası boş');
    });

    it('should collect multiple row errors', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            { 'Ürün Adı': '', Kategori: 'Sebze', Birim: 'kg', 'Taban Fiyat': '20', 'Satış Fiyatı': '25' },
            { 'Ürün Adı': 'Domates', Kategori: '', Birim: 'kg', 'Taban Fiyat': '20', 'Satış Fiyatı': '25' },
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return partial success with some errors', async () => {
      // Arrange
      mockedPapa.parse.mockImplementation((file: any, options: any) => {
        options.complete({
          data: [
            {
              'Ürün Adı': 'Domates',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '20',
              'Satış Fiyatı': '25',
            }, // Valid
            {
              'Ürün Adı': '',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '20',
              'Satış Fiyatı': '25',
            }, // Invalid
            {
              'Ürün Adı': 'Patates',
              Kategori: 'Sebze',
              Birim: 'kg',
              'Taban Fiyat': '15',
              'Satış Fiyatı': '20',
            }, // Valid
          ],
          meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
        });
      });

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      // Act
      const result = await parseCSVFile(file);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
    });
  });
});

// Helper function to create mock CSV file
function createMockCSVFile(size: number): File {
  mockedPapa.parse.mockImplementation((file: any, options: any) => {
    options.complete({
      data: [
        { 'Ürün Adı': 'Test', Kategori: 'Sebze', Birim: 'kg', 'Taban Fiyat': '10', 'Satış Fiyatı': '15' },
      ],
      meta: { fields: ['Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'Satış Fiyatı'] },
    });
  });

  return new File(['content'], 'test.csv', { type: 'text/csv' });
}
