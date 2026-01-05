/**
 * CSV Parser for Product Import
 * Phase 10.1 - CSV Parser
 *
 * Parses CSV files and extracts product data
 */

import * as Papa from 'papaparse';
import type { ProductImportRow } from '@/types/supplier';

/**
 * Supported CSV file extensions
 */
export const CSV_EXTENSIONS = ['.csv'];

/**
 * Maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Result type for CSV parsing
 */
export interface CSVParseResult {
  success: boolean;
  rows: ProductImportRow[];
  errors: Array<{
    row: number;
    field: string;
    error: string;
    value: any;
  }>;
  fileName: string;
  totalRows: number;
}

/**
 * Turkish to English column name mapping
 */
const COLUMN_MAP: Record<string, string> = {
  'Urun Adi': 'name',
  'Ürün Adı': 'name',
  'Urun Adı': 'name',
  'Ürün Adi': 'name',
  'Product Name': 'name',
  'Kategori': 'category',
  'Category': 'category',
  'Birim': 'unit',
  'Unit': 'unit',
  'Taban Fiyat': 'basePrice',
  'Taban Fiyati': 'basePrice',
  'Base Price': 'basePrice',
  'Satis Fiyati': 'price',
  'Satış Fiyatı': 'price',
  'Satis Fiyatı': 'price',
  'Sale Price': 'price',
  'Price': 'price',
  'Stok': 'stock',
  'Stock': 'stock',
  'Koken': 'origin',
  'Köken': 'origin',
  'Origin': 'origin',
  'Kalite': 'quality',
  'Quality': 'quality',
  'Durum': 'availability',
  'Status': 'availability',
  'Availability': 'availability',
  'Aciklama': 'description',
  'Açıklama': 'description',
  'Description': 'description',
  'Gorsel URLleri': 'images',
  'Görsel URLleri': 'images',
  'Gorsel URL\'leri': 'images',
  'Image URLs': 'images',
  'Images': 'images',
};

/**
 * Required columns
 */
const REQUIRED_COLUMNS = ['name', 'category', 'unit', 'basePrice', 'price'];

/**
 * Parse CSV file and extract product rows
 */
export function parseCSVFile(
  file: File,
  options: {
    skipEmptyRows?: boolean;
    maxRows?: number;
    delimiter?: string;
  } = {}
): Promise<CSVParseResult> {
  const { skipEmptyRows = true, maxRows = 1000, delimiter = '' } = options;

  return new Promise((resolve) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      resolve({
        success: false,
        rows: [],
        errors: [{
          row: 0,
          field: 'file',
          error: `Dosya boyutu çok büyük (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
          value: file.size,
        }],
        fileName: file.name,
        totalRows: 0,
      });
      return;
    }

    // Validate file extension
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!CSV_EXTENSIONS.includes(extension)) {
      resolve({
        success: false,
        rows: [],
        errors: [{
          row: 0,
          field: 'file',
          error: `Dosya formatı desteklenmiyor. Lütfen .xlsx veya .csv kullanın.`,
          value: extension,
        }],
        fileName: file.name,
        totalRows: 0,
      });
      return;
    }

    // Parse CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: skipEmptyRows ? 'greedy' : false,
      delimiter: delimiter || undefined, // Auto-detect if not specified
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          // Get data
          const data = results.data as any[];

          if (!data || data.length === 0) {
            resolve({
              success: false,
              rows: [],
              errors: [{
                row: 0,
                field: 'file',
                error: 'CSV dosyası boş',
                value: null,
              }],
              fileName: file.name,
              totalRows: 0,
            });
            return;
          }

          // Map columns
          const headers = results.meta.fields || [];
          const mappedColumns = mapColumns(headers);

          // Check required columns
          const missingColumns = REQUIRED_COLUMNS.filter(col => !mappedColumns[col]);
          if (missingColumns.length > 0) {
            resolve({
              success: false,
              rows: [],
              errors: [{
                row: 1,
                field: 'headers',
                error: `Gerekli sütunlar bulunamadı: ${missingColumns.join(', ')}`,
                value: headers,
              }],
              fileName: file.name,
              totalRows: data.length,
            });
            return;
          }

          // Parse rows
          const rows: ProductImportRow[] = [];
          const errors: CSVParseResult['errors'] = [];

          for (let i = 0; i < data.length && rows.length < maxRows; i++) {
            const rawRow = data[i];
            const rowIndex = i + 2; // CSV row number (1-based, header is row 1)

            // Skip empty rows
            if (skipEmptyRows && isEmptyObject(rawRow)) {
              continue;
            }

            // Parse row
            const parsedRow = parseRow(rawRow, mappedColumns, rowIndex);

            if (parsedRow.errors.length > 0) {
              errors.push(...parsedRow.errors);
            } else {
              rows.push(parsedRow.data);
            }
          }

          resolve({
            success: errors.length === 0 || rows.length > 0,
            rows,
            errors,
            fileName: file.name,
            totalRows: data.length,
          });
        } catch (error) {
          resolve({
            success: false,
            rows: [],
            errors: [{
              row: 0,
              field: 'file',
              error: `CSV ayrıştırma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
              value: null,
            }],
            fileName: file.name,
            totalRows: 0,
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          rows: [],
          errors: [{
            row: 0,
            field: 'file',
            error: `CSV okuma hatası: ${error.message}`,
            value: null,
          }],
          fileName: file.name,
          totalRows: 0,
        });
      },
    });
  });
}

/**
 * Map Turkish column names to English field names
 */
function mapColumns(headers: string[]): Record<string, string> {
  const mapped: Record<string, string> = {};

  headers.forEach(header => {
    if (!header) return;

    const normalizedHeader = header.trim();
    const fieldName = COLUMN_MAP[normalizedHeader];

    if (fieldName) {
      mapped[fieldName] = normalizedHeader;
    }
  });

  return mapped;
}

/**
 * Parse a single row
 */
function parseRow(
  rawRow: Record<string, any>,
  columnMap: Record<string, string>,
  rowIndex: number
): { data?: ProductImportRow; errors: CSVParseResult['errors'] } {
  const errors: CSVParseResult['errors'] = [];

  // Helper to get column value
  const getCol = (field: string): any => {
    const columnName = columnMap[field];
    return columnName !== undefined ? rawRow[columnName] : undefined;
  };

  // Extract values
  const name = getCol('name');
  const category = getCol('category');
  const unit = getCol('unit');
  const basePrice = getCol('basePrice');
  const price = getCol('price');
  const stock = getCol('stock');
  const origin = getCol('origin');
  const quality = getCol('quality');
  const availability = getCol('availability');
  const description = getCol('description');
  const images = getCol('images');

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'name',
      error: 'Ürün adı boş olamaz',
      value: name,
    });
  }

  if (!category || typeof category !== 'string' || category.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'category',
      error: 'Kategori boş olamaz',
      value: category,
    });
  }

  if (!unit || typeof unit !== 'string' || unit.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'unit',
      error: 'Birim boş olamaz',
      value: unit,
    });
  }

  const basePriceNum = parseNumber(basePrice);
  if (basePriceNum === null) {
    errors.push({
      row: rowIndex,
      field: 'basePrice',
      error: 'Taban fiyat sayı olmalıdır',
      value: basePrice,
    });
  } else if (basePriceNum <= 0) {
    errors.push({
      row: rowIndex,
      field: 'basePrice',
      error: 'Taban fiyat 0\'dan büyük olmalıdır',
      value: basePrice,
    });
  }

  const priceNum = parseNumber(price);
  if (priceNum === null) {
    errors.push({
      row: rowIndex,
      field: 'price',
      error: 'Satış fiyatı sayı olmalıdır',
      value: price,
    });
  } else if (priceNum <= 0) {
    errors.push({
      row: rowIndex,
      field: 'price',
      error: 'Satış fiyatı 0\'dan büyük olmalıdır',
      value: price,
    });
  }

  // If there are errors, return them
  if (errors.length > 0) {
    return { errors };
  }

  // Parse optional fields
  const stockNum = parseNumber(stock);
  const imagesArray = parseImages(images);

  // Return parsed row
  return {
    data: {
      name: name!.trim(),
      category: category!.trim(),
      unit: unit!.trim(),
      basePrice: basePriceNum!,
      price: priceNum!,
      stock: stockNum ?? 100,
      origin: origin?.trim() || 'Türkiye',
      quality: quality?.trim() || 'standart',
      availability: availability?.trim() || 'bol',
      description: description?.trim() || null,
      images: imagesArray,
    },
    errors: [],
  };
}

/**
 * Parse number from CSV value
 */
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    // Remove common number formatting
    const cleaned = value
      .replace(/,/g, '.') // Replace comma with dot
      .replace(/\s/g, '') // Remove spaces
      .replace(/[^\d.-]/g, ''); // Remove non-numeric except dot and minus

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Parse images from comma-separated string
 */
function parseImages(value: any): string[] {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(v => typeof v === 'string' && v.trim() !== '').map(v => v.trim());
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(v => v !== '');
  }

  return [];
}

/**
 * Check if object is empty
 */
function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.values(obj).every(v => v === null || v === undefined || v === '');
}
