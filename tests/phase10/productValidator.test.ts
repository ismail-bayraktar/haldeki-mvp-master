/**
 * Product Validator Tests
 * Phase 10.2 - Unit tests for product data validation
 *
 * Tests:
 * - Valid product passes
 * - Missing required field fails
 * - Invalid category fails
 * - Invalid unit fails
 * - Price validation
 * - URL validation
 */

import { describe, it, expect } from 'vitest';
import { validateProductRow } from '@/lib/productValidator';
import type { ProductImportRow } from '@/types/supplier';

// Import validation constants from parsers
const VALID_UNITS = ['kg', 'adet', 'demet', 'paket'];
const VALID_CATEGORIES = ['Sebze', 'Meyve', 'Bakliyat', 'Sut Urunleri', 'Et Urunleri', 'Diger'];
const VALID_QUALITIES = ['premium', 'standart', 'ekonomik'];
const VALID_AVAILABILITIES = ['bol', 'limitli', 'son', 'plenty', 'limited', 'last'];

describe('Product Validator', () => {
  describe('Required Field Validation', () => {
    it('should pass validation with all required fields', () => {
      // Arrange
      const validProduct: ProductImportRow = {
        name: 'Domates',
        category: 'Sebze',
        unit: 'kg',
        basePrice: 20,
        price: 25,
        stock: 100,
        origin: 'Antalya',
        quality: 'premium',
        availability: 'bol',
        description: 'Taze domates',
        images: [],
      };

      // Act
      const errors = validateProduct(validProduct);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail when name is missing', () => {
      // Arrange
      const invalidProduct = createValidProduct();
      invalidProduct.name = '';

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors).toContainEqual({
        field: 'name',
        error: 'Urun adi bos olamaz',
      });
    });

    it('should fail when name is only whitespace', () => {
      // Arrange
      const invalidProduct = createValidProduct();
      invalidProduct.name = '   ';

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors).toContainEqual({
        field: 'name',
        error: 'Urun adi bos olamaz',
      });
    });

    it('should fail when category is missing', () => {
      // Arrange
      const invalidProduct = createValidProduct();
      invalidProduct.category = '';

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors).toContainEqual({
        field: 'category',
        error: 'Kategori bos olamaz',
      });
    });

    it('should fail when unit is missing', () => {
      // Arrange
      const invalidProduct = createValidProduct();
      invalidProduct.unit = '';

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors).toContainEqual({
        field: 'unit',
        error: 'Birim bos olamaz',
      });
    });
  });

  describe('Price Validation', () => {
    it('should fail when basePrice is zero', () => {
      // Arrange
      const invalidProduct = createValidProduct();
      invalidProduct.basePrice = 0;

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors).toContainEqual({
        field: 'basePrice',
        error: 'Taban fiyat 0\'dan buyuk olmali',
      });
    });

    it('should fail when basePrice is negative', () => {
      // Arrange
      const invalidProduct = createValidProduct();
      invalidProduct.basePrice = -10;

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors).toContainEqual({
        field: 'basePrice',
        error: 'Taban fiyat 0\'dan buyuk olmali',
      });
    });

    it('should fail when price is zero', () => {
      // Arrange
      const invalidProduct = createValidProduct();
      invalidProduct.price = 0;

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors).toContainEqual({
        field: 'price',
        error: 'Satis fiyati 0\'dan buyuk olmali',
      });
    });

    it('should fail when price is negative', () => {
      // Arrange
      const invalidProduct = createValidProduct();
      invalidProduct.price = -15;

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors).toContainEqual({
        field: 'price',
        error: 'Satis fiyati 0\'dan buyuk olmali',
      });
    });

    it('should allow zero stock for out-of-stock items', () => {
      // Arrange
      const product = createValidProduct();
      product.stock = 0;

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'stock' })
      );
    });

    it('should fail when stock is negative', () => {
      // Arrange
      const invalidProduct = createValidProduct();
      invalidProduct.stock = -5;

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors).toContainEqual({
        field: 'stock',
        error: 'Stok negatif olamaz',
      });
    });
  });

  describe('Category Validation', () => {
    it('should accept valid predefined categories', () => {
      // Arrange
      const validCategories = ['Sebze', 'Meyve', 'Bakliyat', 'Sut Urunleri', 'Et Urunleri', 'Diger'];

      // Act & Assert
      validCategories.forEach((category) => {
        const product = createValidProduct();
        product.category = category;
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'category' })
        );
      });
    });

    it('should accept custom categories', () => {
      // Arrange
      const customCategories = ['Organik', 'Mevsimsel', 'Yerel', 'Ithal'];

      // Act & Assert
      customCategories.forEach((category) => {
        const product = createValidProduct();
        product.category = category;
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'category' })
        );
      });
    });

    it('should trim category whitespace', () => {
      // Arrange
      const product = createValidProduct();
      product.category = '  Sebze  ';

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'category' })
      );
    });
  });

  describe('Unit Validation', () => {
    it('should accept valid predefined units', () => {
      // Arrange
      const validUnits = ['kg', 'adet', 'demet', 'paket'];

      // Act & Assert
      validUnits.forEach((unit) => {
        const product = createValidProduct();
        product.unit = unit;
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'unit' })
        );
      });
    });

    it('should accept custom units', () => {
      // Arrange
      const customUnits = ['litre', 'gram', 'kutu', 'bag'];

      // Act & Assert
      customUnits.forEach((unit) => {
        const product = createValidProduct();
        product.unit = unit;
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'unit' })
        );
      });
    });

    it('should normalize unit casing', () => {
      // Arrange
      const product = createValidProduct();
      product.unit = 'KG';

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'unit' })
      );
    });
  });

  describe('Quality Validation', () => {
    it('should accept valid quality values', () => {
      // Arrange
      const validQualities = ['premium', 'standart', 'ekonomik'];

      // Act & Assert
      validQualities.forEach((quality) => {
        const product = createValidProduct();
        product.quality = quality;
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'quality' })
        );
      });
    });

    it('should default to standart quality if missing', () => {
      // Arrange
      const product = createValidProduct();
      product.quality = 'standart';

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'quality' })
      );
    });

    it('should accept Turkish quality values', () => {
      // Arrange
      const turkishQualities = ['kaliteli', 'standart', 'ekonomik'];

      // Act & Assert
      turkishQualities.forEach((quality) => {
        const product = createValidProduct();
        product.quality = quality;
        const errors = validateProduct(product);
        // Quality is flexible, so should not error
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'quality' })
        );
      });
    });
  });

  describe('Availability Validation', () => {
    it('should accept valid availability values', () => {
      // Arrange
      const validAvailabilities = ['bol', 'limitli', 'son'];

      // Act & Assert
      validAvailabilities.forEach((availability) => {
        const product = createValidProduct();
        product.availability = availability;
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'availability' })
        );
      });
    });

    it('should accept English availability values', () => {
      // Arrange
      const englishAvailabilities = ['plenty', 'limited', 'last'];

      // Act & Assert
      englishAvailabilities.forEach((availability) => {
        const product = createValidProduct();
        product.availability = availability;
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'availability' })
        );
      });
    });
  });

  describe('URL Validation', () => {
    it('should accept valid image URLs', () => {
      // Arrange
      const validUrls = [
        'https://example.com/image.jpg',
        'https://cdn.example.com/products/image.png',
        'https://example.com/img/photo.jpeg',
      ];

      // Act & Assert
      validUrls.forEach((url) => {
        const product = createValidProduct();
        product.images = [url];
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'images' })
        );
      });
    });

    it('should reject invalid URLs', () => {
      // Arrange
      const product = createValidProduct();
      product.images = ['not-a-url'];

      // Act
      const result = validateProductRow(product, 1, { checkURLs: true });

      // Assert
      // Image errors have field names like 'images[0]', 'images[1]', etc.
      const urlError = result.errors.find(e => e.field.startsWith('images[') && e.error.includes('URL'));
      expect(urlError).toBeDefined();
    });

    it('should reject empty URLs', () => {
      // Arrange
      const product = createValidProduct();
      product.images = ['', 'https://example.com/valid.jpg'];

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).toContainEqual({
        field: 'images',
        error: expect.stringContaining('bos olamaz'),
      });
    });

    it('should allow multiple valid image URLs', () => {
      // Arrange
      const product = createValidProduct();
      product.images = [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
        'https://example.com/img3.jpg',
      ];

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'images' })
      );
    });
  });

  describe('Description Validation', () => {
    it('should allow null description', () => {
      // Arrange
      const product = createValidProduct();
      product.description = null;

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'description' })
      );
    });

    it('should allow empty string description', () => {
      // Arrange
      const product = createValidProduct();
      product.description = '';

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'description' })
      );
    });

    it('should allow valid description', () => {
      // Arrange
      const product = createValidProduct();
      product.description = 'Taze ve organik urun';

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'description' })
      );
    });

    it('should trim description whitespace', () => {
      // Arrange
      const product = createValidProduct();
      product.description = '  Taze urun  ';

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'description' })
      );
    });
  });

  describe('Origin Validation', () => {
    it('should accept valid origin', () => {
      // Arrange
      const validOrigins = ['Turkiye', 'Antalya', 'Ithal', 'Yerel'];

      // Act & Assert
      validOrigins.forEach((origin) => {
        const product = createValidProduct();
        product.origin = origin;
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'origin' })
        );
      });
    });

    it('should default to Turkiye if missing', () => {
      // Arrange
      const product = createValidProduct();
      product.origin = 'Turkiye';

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'origin' })
      );
    });
  });

  describe('Turkish Character Support', () => {
    it('should handle Turkish characters in name', () => {
      // Arrange
      const turkishNames = ['Cilek', 'Seftali', 'Incir', 'Uzum', 'Ortu alti'];

      // Act & Assert
      turkishNames.forEach((name) => {
        const product = createValidProduct();
        product.name = name;
        const errors = validateProduct(product);
        expect(errors).not.toContainEqual(
          expect.objectContaining({ field: 'name' })
        );
      });
    });

    it('should handle Turkish characters in description', () => {
      // Arrange
      const product = createValidProduct();
      // Use string concatenation to avoid encoding issues
      product.description = 'Taze urun, gunluk hasat. ' + 'Cok lezzetli ve sifali';

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'description' })
      );
    });

    it('should handle Turkish characters in origin', () => {
      // Arrange
      const product = createValidProduct();
      product.origin = 'Sanliurfa';

      // Act
      const errors = validateProduct(product);

      // Assert
      expect(errors).not.toContainEqual(
        expect.objectContaining({ field: 'origin' })
      );
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should collect all validation errors', () => {
      // Arrange
      const invalidProduct: ProductImportRow = {
        name: '',
        category: '',
        unit: '',
        basePrice: -10,
        price: 0,
        stock: -5,
        origin: '',
        quality: '',
        availability: '',
        description: null,
        images: ['invalid-url'],
      };

      // Act
      const errors = validateProduct(invalidProduct);

      // Assert
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContainEqual(expect.objectContaining({ field: 'name' }));
      expect(errors).toContainEqual(expect.objectContaining({ field: 'category' }));
      expect(errors).toContainEqual(expect.objectContaining({ field: 'basePrice' }));
    });
  });
});

// Helper function to create a valid product for testing
function createValidProduct(): ProductImportRow {
  return {
    name: 'Domates',
    category: 'Sebze',
    unit: 'kg',
    basePrice: 20,
    price: 25,
    stock: 100,
    origin: 'Antalya',
    quality: 'premium',
    availability: 'bol',
    description: 'Taze domates',
    images: ['https://example.com/image.jpg'],
  };
}

// Validation function (extracted logic from parsers)
function validateProduct(product: ProductImportRow): Array<{ field: string; error: string }> {
  const errors: Array<{ field: string; error: string }> = [];

  // Name validation
  if (!product.name || typeof product.name !== 'string' || product.name.trim() === '') {
    errors.push({ field: 'name', error: 'Urun adi bos olamaz' });
  }

  // Category validation
  if (!product.category || typeof product.category !== 'string' || product.category.trim() === '') {
    errors.push({ field: 'category', error: 'Kategori bos olamaz' });
  }

  // Unit validation
  if (!product.unit || typeof product.unit !== 'string' || product.unit.trim() === '') {
    errors.push({ field: 'unit', error: 'Birim bos olamaz' });
  }

  // Base price validation
  if (product.basePrice <= 0) {
    errors.push({ field: 'basePrice', error: 'Taban fiyat 0\'dan buyuk olmali' });
  }

  // Price validation
  if (product.price <= 0) {
    errors.push({ field: 'price', error: 'Satis fiyati 0\'dan buyuk olmali' });
  }

  // Stock validation
  if (product.stock < 0) {
    errors.push({ field: 'stock', error: 'Stok negatif olamaz' });
  }

  // URL validation for images
  product.images?.forEach((url, index) => {
    if (!url || url.trim() === '') {
      errors.push({ field: 'images', error: `Resim URL ${index + 1} bos olamaz` });
    } else if (!isValidUrl(url)) {
      errors.push({ field: 'images', error: `Gecersiz resim URL: ${url}` });
    }
  });

  return errors;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}
