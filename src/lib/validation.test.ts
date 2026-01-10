// Tests for validation utilities

import { describe, it, expect } from 'vitest';
import {
  isValidImageUrl,
  sanitizeImageUrl,
  isValidPrice,
  isValidStock,
  clampPrice,
  clampStock,
  MAX_PRICE,
  MAX_STOCK,
  isValidProductName,
  sanitizeProductName,
  isValidCategory,
  isValidUnit,
} from './validation';

describe('validation', () => {
  describe('isValidImageUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
      expect(isValidImageUrl('https://cdn.example.com/path/to/image.png')).toBe(true);
    });

    it('should accept valid HTTP URLs', () => {
      expect(isValidImageUrl('http://example.com/image.jpg')).toBe(true);
    });

    it('should reject javascript: URLs (XSS prevention)', () => {
      expect(isValidImageUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject data: URLs', () => {
      expect(isValidImageUrl('data:image/svg+xml,<script>alert(1)</script>')).toBe(false);
    });

    it('should reject protocol-relative URLs', () => {
      expect(isValidImageUrl('//evil.com/image.jpg')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidImageUrl('')).toBe(false);
      expect(isValidImageUrl('   ')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isValidImageUrl('not-a-url')).toBe(false);
      expect(isValidImageUrl('ftp://example.com/image.jpg')).toBe(false);
    });
  });

  describe('sanitizeImageUrl', () => {
    it('should return valid URLs', () => {
      expect(sanitizeImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
      expect(sanitizeImageUrl('  https://example.com/image.jpg  ')).toBe('https://example.com/image.jpg');
    });

    it('should return null for invalid URLs', () => {
      expect(sanitizeImageUrl('javascript:alert(1)')).toBe(null);
      expect(sanitizeImageUrl('')).toBe(null);
      expect(sanitizeImageUrl('not-a-url')).toBe(null);
    });
  });

  describe('isValidPrice', () => {
    it('should accept valid prices', () => {
      expect(isValidPrice(0)).toBe(true);
      expect(isValidPrice(10)).toBe(true);
      expect(isValidPrice(100.5)).toBe(true);
      expect(isValidPrice(1000.99)).toBe(true);
    });

    it('should reject negative prices', () => {
      expect(isValidPrice(-1)).toBe(false);
      expect(isValidPrice(-100)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(isValidPrice(NaN)).toBe(false);
    });

    it('should reject prices above MAX_PRICE', () => {
      expect(isValidPrice(MAX_PRICE + 1)).toBe(false);
      expect(isValidPrice(Infinity)).toBe(false);
    });

    it('should reject prices with more than 2 decimal places', () => {
      expect(isValidPrice(10.123)).toBe(false);
      expect(isValidPrice(100.999)).toBe(false);
    });
  });

  describe('isValidStock', () => {
    it('should accept valid stock values', () => {
      expect(isValidStock(0)).toBe(true);
      expect(isValidStock(1)).toBe(true);
      expect(isValidStock(100)).toBe(true);
    });

    it('should reject negative stock', () => {
      expect(isValidStock(-1)).toBe(false);
    });

    it('should reject non-integers', () => {
      expect(isValidStock(1.5)).toBe(false);
      expect(isValidStock(10.9)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(isValidStock(NaN)).toBe(false);
    });

    it('should reject stock above MAX_STOCK', () => {
      expect(isValidStock(MAX_STOCK + 1)).toBe(false);
      expect(isValidStock(Infinity)).toBe(false);
    });
  });

  describe('clampPrice', () => {
    it('should return value within range', () => {
      expect(clampPrice(100)).toBe(100);
      expect(clampPrice(0)).toBe(0);
    });

    it('should clamp negative values to 0', () => {
      expect(clampPrice(-100)).toBe(0);
    });

    it('should clamp values above MAX_PRICE', () => {
      expect(clampPrice(MAX_PRICE + 1000)).toBe(MAX_PRICE);
    });
  });

  describe('clampStock', () => {
    it('should return value within range', () => {
      expect(clampStock(100)).toBe(100);
      expect(clampStock(0)).toBe(0);
    });

    it('should clamp negative values to 0', () => {
      expect(clampStock(-100)).toBe(0);
    });

    it('should clamp values above MAX_STOCK', () => {
      expect(clampStock(MAX_STOCK + 1000)).toBe(MAX_STOCK);
    });

    it('should floor decimal values', () => {
      expect(clampStock(10.9)).toBe(10);
      expect(clampStock(100.5)).toBe(100);
    });
  });

  describe('isValidProductName', () => {
    it('should accept valid product names', () => {
      expect(isValidProductName('Apple')).toBe(true);
      expect(isValidProductName('Organic Banana 500g')).toBe(true);
    });

    it('should reject empty names', () => {
      expect(isValidProductName('')).toBe(false);
      expect(isValidProductName('   ')).toBe(false);
    });

    it('should reject names over 200 characters', () => {
      const longName = 'a'.repeat(201);
      expect(isValidProductName(longName)).toBe(false);
    });
  });

  describe('sanitizeProductName', () => {
    it('should trim whitespace', () => {
      expect(sanitizeProductName('  Apple  ')).toBe('Apple');
    });

    it('should limit to 200 characters', () => {
      const longName = 'a'.repeat(250);
      expect(sanitizeProductName(longName).length).toBe(200);
    });

    it('should return empty string for invalid input', () => {
      expect(sanitizeProductName('')).toBe('');
      expect(sanitizeProductName('   ')).toBe('');
    });
  });

  describe('isValidCategory', () => {
    it('should accept valid categories', () => {
      expect(isValidCategory('Vegetables')).toBe(true);
      expect(isValidCategory('Fruits')).toBe(true);
    });

    it('should reject empty categories', () => {
      expect(isValidCategory('')).toBe(false);
      expect(isValidCategory('   ')).toBe(false);
    });

    it('should reject categories over 100 characters', () => {
      const longCategory = 'a'.repeat(101);
      expect(isValidCategory(longCategory)).toBe(false);
    });
  });

  describe('isValidUnit', () => {
    it('should accept valid units', () => {
      expect(isValidUnit('kg')).toBe(true);
      expect(isValidUnit('pieces')).toBe(true);
      expect(isValidUnit('500g')).toBe(true);
    });

    it('should reject empty units', () => {
      expect(isValidUnit('')).toBe(false);
      expect(isValidUnit('   ')).toBe(false);
    });

    it('should reject units over 50 characters', () => {
      const longUnit = 'a'.repeat(51);
      expect(isValidUnit(longUnit)).toBe(false);
    });
  });
});
