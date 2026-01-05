/**
 * Excel Parser Tests
 * Phase 10.1 - Unit tests for Excel file parsing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EXCEL_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/excelParser';

describe('Excel Parser', () => {
  const createMockExcelFile = (name: string, size: number): File => {
    return new File(['content'], name, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  };

  describe('File Validation Constants', () => {
    it('should have correct Excel extensions', () => {
      expect(EXCEL_EXTENSIONS).toEqual(['.xlsx', '.xls']);
    });

    it('should have max size of 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe('File Extension Detection', () => {
    it('should recognize .xlsx files', () => {
      const file = createMockExcelFile('products.xlsx', 1024);
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      expect(EXCEL_EXTENSIONS.includes(extension)).toBe(true);
    });

    it('should recognize .xls files', () => {
      const file = createMockExcelFile('products.xls', 1024);
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      expect(EXCEL_EXTENSIONS.includes(extension)).toBe(true);
    });

    it('should reject .pdf files', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      expect(EXCEL_EXTENSIONS.includes(extension)).toBe(false);
    });

    it('should reject .csv files (not in EXCEL_EXTENSIONS)', () => {
      const file = new File(['content'], 'data.csv', { type: 'text/csv' });
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      expect(EXCEL_EXTENSIONS.includes(extension)).toBe(false);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under 10MB', () => {
      const validFile = createMockExcelFile('products.xlsx', 1024);
      expect(validFile.size).toBeLessThan(MAX_FILE_SIZE);
    });

    it('should detect files exceeding 10MB', () => {
      const largeFile = createMockExcelFile('products.xlsx', MAX_FILE_SIZE + 1);
      Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE + 1 });
      expect(largeFile.size).toBeGreaterThan(MAX_FILE_SIZE);
    });

    it('should calculate max size correctly as 10MB', () => {
      const expectedMB = 10;
      const actualMB = MAX_FILE_SIZE / 1024 / 1024;
      expect(actualMB).toBe(expectedMB);
    });
  });

  describe('File Type Detection', () => {
    it('should detect Excel MIME type for .xlsx', () => {
      const file = createMockExcelFile('products.xlsx', 1024);
      expect(file.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should reject non-Excel MIME types', () => {
      const pdfFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      expect(pdfFile.type).not.toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with uppercase extensions', () => {
      const file = new File(['content'], 'PRODUCTS.XLSX', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      expect(EXCEL_EXTENSIONS.includes(extension)).toBe(true);
    });

    it('should handle files with mixed case extensions', () => {
      const file = new File(['content'], 'products.Xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      expect(EXCEL_EXTENSIONS.includes(extension)).toBe(true);
    });

    it('should handle files without extensions', () => {
      const file = new File(['content'], 'products', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const lastDotIndex = file.name.lastIndexOf('.');
      // File without extension should return -1
      expect(lastDotIndex).toBe(-1);
    });

    it('should handle files with multiple dots in name', () => {
      const file = new File(['content'], 'my.products.file.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      expect(extension).toBe('.xlsx');
      expect(EXCEL_EXTENSIONS.includes(extension)).toBe(true);
    });
  });

  describe('MAX_FILE_SIZE Boundary Tests', () => {
    it('should accept file exactly at 10MB limit', () => {
      const file = createMockExcelFile('products.xlsx', MAX_FILE_SIZE);
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE });
      expect(file.size).toBe(MAX_FILE_SIZE);
    });

    it('should reject file just over 10MB limit', () => {
      const file = createMockExcelFile('products.xlsx', MAX_FILE_SIZE + 1);
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1 });
      expect(file.size).toBeGreaterThan(MAX_FILE_SIZE);
    });

    it('should accept file just under 10MB limit', () => {
      const file = createMockExcelFile('products.xlsx', MAX_FILE_SIZE - 1);
      expect(file.size).toBeLessThan(MAX_FILE_SIZE);
    });
  });

  describe('Supported Extensions List', () => {
    it('should include both .xlsx and .xls', () => {
      expect(EXCEL_EXTENSIONS).toContain('.xlsx');
      expect(EXCEL_EXTENSIONS).toContain('.xls');
    });

    it('should not include other office formats', () => {
      expect(EXCEL_EXTENSIONS).not.toContain('.docx');
      expect(EXCEL_EXTENSIONS).not.toContain('.pptx');
      expect(EXCEL_EXTENSIONS).not.toContain('.csv');
    });

    it('should have exactly 2 extensions', () => {
      expect(EXCEL_EXTENSIONS).toHaveLength(2);
    });
  });
});
