/**
 * Excel Parser for Product Import
 * Phase 10.1 - Excel Parser
 *
 * Parses Excel files (.xlsx, .xls) and extracts product data
 */

import * as XLSX from 'xlsx';
import type { ProductImportRow, ProductImportVariation } from '@/types/supplier';
import type { ProductVariationType } from '@/types/multiSupplier';

/**
 * Supported Excel file extensions
 */
export const EXCEL_EXTENSIONS = ['.xlsx', '.xls'];

/**
 * Maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Sheet names to look for product data
 */
const PRODUCT_SHEET_NAMES = ['Ürünler', 'Products', 'Uruler', 'Sheet1', 'Worksheet'];

/**
 * Turkish to English column name mapping
 */
const COLUMN_MAP: Record<string, string> = {
  'Ürün Adı': 'name',
  'Urun Adi': 'name',
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
  'Satış Fiyatı': 'price',
  'Satis Fiyati': 'price',
  'Satis Fiyatı': 'price',
  'Sale Price': 'price',
  'Price': 'price',
  'Stok': 'stock',
  'Stock': 'stock',
  'Köken': 'origin',
  'Koken': 'origin',
  'Origin': 'origin',
  'Kalite': 'quality',
  'Quality': 'quality',
  'Durum': 'availability',
  'Status': 'availability',
  'Availability': 'availability',
  'Açıklama': 'description',
  'Aciklama': 'description',
  'Description': 'description',
  'Görsel URLleri': 'images',
  'Gorsel URLleri': 'images',
  'Gorsel URL\'leri': 'images',
  'Image URLs': 'images',
  'Images': 'images',
};

/**
 * Result type for Excel parsing
 */
export interface ExcelParseResult {
  success: boolean;
  rows: ProductImportRow[];
  errors: Array<{
    row: number;
    field: string;
    error: string;
    value: any;
  }>;
  fileName: string;
  sheetName: string;
  totalRows: number;
}

/**
 * Parse Excel file and extract product rows
 */
export async function parseExcelFile(
  file: File,
  options: {
    skipEmptyRows?: boolean;
    maxRows?: number;
  } = {}
): Promise<ExcelParseResult> {
  const { skipEmptyRows = true, maxRows = 1000 } = options;

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      rows: [],
      errors: [{
        row: 0,
        field: 'file',
        error: `Dosya boyutu çok büyük (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        value: file.size,
      }],
      fileName: file.name,
      sheetName: '',
      totalRows: 0,
    };
  }

  // Validate file extension
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!EXCEL_EXTENSIONS.includes(extension)) {
    return {
      success: false,
      rows: [],
      errors: [{
        row: 0,
        field: 'file',
        error: `Dosya formatı desteklenmiyor. Lütfen .xlsx veya .csv kullanın.`,
        value: extension,
      }],
      fileName: file.name,
      sheetName: '',
      totalRows: 0,
    };
  }

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse workbook
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      cellText: false,
    });

    // Find the products sheet
    let sheetName = findProductSheet(workbook.SheetNames);
    let worksheet = workbook.Sheets[sheetName];

    // If no product sheet found, use first sheet
    if (!worksheet) {
      sheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[sheetName];
    }

    if (!worksheet) {
      return {
        success: false,
        rows: [],
        errors: [{
          row: 0,
          field: 'file',
          error: 'Excel dosyası boş veya okunamıyor',
          value: null,
        }],
        fileName: file.name,
        sheetName: '',
        totalRows: 0,
      };
    }

    // Convert sheet to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use array of arrays
      defval: null,
      blankrows: false,
    }) as any[][];

    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        rows: [],
        errors: [{
          row: 0,
          field: 'file',
          error: 'Excel dosyası boş',
          value: null,
        }],
        fileName: file.name,
        sheetName: '',
        totalRows: 0,
      };
    }

    // Extract headers from first row
    const headers = rawData[0] as string[];
    const mappedColumns = mapColumns(headers);

    // Phase 12: Only require price, basePrice is optional (deprecated)
    if (!mappedColumns.name || !mappedColumns.category || !mappedColumns.unit || !mappedColumns.price) {
      return {
        success: false,
        rows: [],
        errors: [{
          row: 1,
          field: 'headers',
          error: 'Gerekli sütunlar bulunamadı: Ürün Adı, Kategori, Birim, Fiyat',
          value: headers,
        }],
        fileName: file.name,
        sheetName,
        totalRows: rawData.length - 1,
      };
    }

    // Parse data rows (starting from row 2, index 1)
    const rows: ProductImportRow[] = [];
    const errors: ExcelParseResult['errors'] = [];

    for (let i = 1; i < rawData.length && rows.length < maxRows; i++) {
      const rawRow = rawData[i];
      const rowIndex = i + 1; // Excel row number (1-based)

      // Skip empty rows
      if (skipEmptyRows && isEmptyRow(rawRow)) {
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

    return {
      success: errors.length === 0 || rows.length > 0,
      rows,
      errors,
      fileName: file.name,
      sheetName,
      totalRows: rawData.length - 1,
    };
  } catch (error) {
    return {
      success: false,
      rows: [],
      errors: [{
        row: 0,
        field: 'file',
        error: `Dosya okuma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        value: null,
      }],
      fileName: file.name,
      sheetName: '',
      totalRows: 0,
    };
  }
}

/**
 * Find the sheet containing product data
 */
function findProductSheet(sheetNames: string[]): string {
  // Try exact match first
  for (const name of PRODUCT_SHEET_NAMES) {
    if (sheetNames.includes(name)) {
      return name;
    }
  }

  // Try partial match
  for (const sheetName of sheetNames) {
    const lowerName = sheetName.toLowerCase();
    if (PRODUCT_SHEET_NAMES.some(s => lowerName.includes(s.toLowerCase()))) {
      return sheetName;
    }
  }

  // Fallback to first sheet
  return sheetNames[0] || '';
}

/**
 * Map Turkish column names to English field names
 * Phase 12.1: Added fuzzy matching for case-insensitive and space-tolerant lookup
 */
function mapColumns(headers: string[]): Record<string, number> {
  const mapped: Record<string, number> = {};

  headers.forEach((header, index) => {
    if (!header) return;

    const normalizedHeader = header.trim();
    let fieldName = COLUMN_MAP[normalizedHeader];

    // Fuzzy matching: Try case-insensitive lookup
    if (!fieldName) {
      const lowerHeader = normalizedHeader.toLowerCase();
      for (const [key, value] of Object.entries(COLUMN_MAP)) {
        if (key.toLowerCase() === lowerHeader) {
          fieldName = value;
          break;
        }
      }
    }

    // Fuzzy matching: Try with extra spaces removed
    if (!fieldName && /\s/.test(normalizedHeader)) {
      const collapsedHeader = normalizedHeader.replace(/\s+/g, '');
      for (const [key, value] of Object.entries(COLUMN_MAP)) {
        if (key.replace(/\s+/g, '') === collapsedHeader) {
          fieldName = value;
          break;
        }
      }
    }

    if (fieldName) {
      mapped[fieldName] = index;
    }
  });

  return mapped;
}

/**
 * Parse a single row
 */
function parseRow(
  rawRow: any[],
  columnMap: Record<string, number>,
  rowIndex: number
): { data?: ProductImportRow; errors: ExcelParseResult['errors'] } {
  const errors: ExcelParseResult['errors'] = [];

  // Helper to get column value
  const getCol = (field: string): any => {
    const index = columnMap[field];
    return index !== undefined ? rawRow[index] : undefined;
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

  // Parse price first (required in Phase 12)
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

  // Phase 12: basePrice is optional, use price if not provided
  const basePriceNum = basePrice !== undefined ? parseNumber(basePrice) : priceNum;
  if (basePrice !== undefined && basePriceNum === null) {
    errors.push({
      row: rowIndex,
      field: 'basePrice',
      error: 'Taban fiyat sayı olmalıdır (opsiyonel)',
      value: basePrice,
    });
  } else if (basePriceNum !== null && basePriceNum <= 0) {
    errors.push({
      row: rowIndex,
      field: 'basePrice',
      error: 'Taban fiyat 0\'dan büyük olmalıdır',
      value: basePrice,
    });
  }

  // If there are errors, return them
  if (errors.length > 0) {
    return { errors };
  }

  // Parse optional fields
  const stockNum = parseNumber(stock);
  const imagesArray = parseImages(images);

  // Extract variations from product name (Phase 12)
  const { variations, baseName } = extractVariations(name!.trim());

  // Validate variations
  const variationValidation = validateVariations(variations);
  if (!variationValidation.valid) {
    variationValidation.errors.forEach(err => {
      errors.push({
        row: rowIndex,
        field: 'variations',
        error: err,
        value: name,
      });
    });
  }

  // Return parsed row with variations
  return {
    data: {
      name: baseName || name!.trim(), // Use base name if variations extracted, otherwise original
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
      variations: variations.length > 0 ? variations : undefined,
    },
    errors: [],
  };
}

/**
 * Parse number from Excel cell
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
 * Parse images from comma-separated string or array
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
 * Check if row is empty
 */
function isEmptyRow(row: any[]): boolean {
  return row.every(cell => cell === null || cell === undefined || cell === '');
}

// ============================================================================
// VARIATION EXTRACTION (Phase 12)
// ============================================================================

/**
 * Variation pattern definitions for extraction
 *
 * Defines regex patterns to identify variations in product names
 * Patterns are applied in order, first match wins
 */
export const VARIATION_PATTERNS: Array<{
  type: ProductVariationType;
  regex: RegExp;
  extractor: (match: RegExpMatchArray) => { value: string; metadata?: Record<string, unknown> };
  order: number;
}> = [
  {
    type: 'size',
    regex: /(\d+[,.]?\d*)\s*(LT|KG|ML|GR|L|K)\b/i,
    extractor: (match) => {
      const value = match[1].replace(',', '.');
      const unit = match[2].toUpperCase().replace('L', 'LT').replace('K', 'KG');
      return {
        value: `${value} ${unit}`,
        metadata: { value, unit: unit === 'L' ? 'LT' : unit === 'K' ? 'KG' : unit },
      };
    },
    order: 1,
  },
  {
    type: 'type',
    regex: /\b(BEYAZ|RENKLI|SIVI|TOZ|KATI|YUVI|AKSKU|YUVARIK)\b/i,
    extractor: (match) => ({
      value: match[1].toUpperCase()
        .replace('İ', 'I')
        .replace('Ğ', 'G')
        .replace('Ü', 'U')
        .replace('Ş', 'S')
        .replace('Ö', 'O')
        .replace('Ç', 'C'),
    }),
    order: 2,
  },
  {
    type: 'scent',
    regex: /\b(LAVANTA|LİMON|GUL|GREYFURT|CILEK|VANILYA|CIKOLATA|PORTAKAL|ELMA|NANE|BERGAMOT|LAVAS|PORES|KARANFIL|MISKET|BAHAR|PORCEL|LOTUS|ORKIDE|LIMON|GÜL|ÇİLEK|VANİLYA|ÇİKOLATA)\b/i,
    extractor: (match) => ({
      value: match[1].toUpperCase()
        .replace('İ', 'I')
        .replace('Ğ', 'G')
        .replace('Ü', 'U')
        .replace('Ş', 'S')
        .replace('Ö', 'O')
        .replace('Ç', 'C'),
    }),
    order: 3,
  },
  {
    type: 'packaging',
    regex: /\*(\d+)\s*$/,
    extractor: (match) => ({
      value: match[1],
      metadata: { count: parseInt(match[1], 10) },
    }),
    order: 4,
  },
  {
    type: 'material',
    regex: /\b(CAM|PLASTIK|METAL|KAGIT|AHŞAP|AGAC|KOROZON|KOROZYON)\b/i,
    extractor: (match) => ({
      value: match[1].toUpperCase()
        .replace('Ş', 'S')
        .replace('Ğ', 'G')
        .replace('İ', 'I'),
    }),
    order: 5,
  },
  {
    type: 'flavor',
    regex: /\b(VANILLA|STRAWBERRY|CHOCOLATE|BANANA|MINT|CARAMEL|HAZELNUT)\b/i,
    extractor: (match) => ({
      value: match[1].toUpperCase(),
    }),
    order: 6,
  },
];

/**
 * Extract variations from product name
 *
 * Parses product name to identify structured variations (size, type, scent, etc.)
 * Returns extracted variations and the cleaned base product name
 */
export function extractVariations(productName: string): {
  variations: ProductImportVariation[];
  baseName: string;
} {
  const variations: ProductImportVariation[] = [];
  let remainingText = productName;

  // Apply each pattern in order
  for (const pattern of VARIATION_PATTERNS) {
    const match = remainingText.match(pattern.regex);
    if (match) {
      const { value, metadata } = pattern.extractor(match);

      // Check for duplicate variation type
      if (!variations.some(v => v.type === pattern.type)) {
        variations.push({
          type: pattern.type,
          value,
          display_order: pattern.order,
          metadata,
        });
      }

      // Remove matched text from remaining
      remainingText = remainingText.replace(match[0], '').trim();
    }
  }

  // Clean up remaining text
  remainingText = remainingText.replace(/\s+/g, ' ').trim();

  return { variations, baseName: remainingText };
}

/**
 * Validate extracted variations
 *
 * Checks for:
 * - Duplicate variations within same product
 * - Invalid variation types
 * - Invalid variation values
 */
export function validateVariations(
  variations: ProductImportVariation[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenTypes = new Set<ProductVariationType>();

  for (const variation of variations) {
    // Check for duplicate types
    if (seenTypes.has(variation.type)) {
      errors.push(`Tekrar varyasyon türü: ${variation.type}`);
      continue;
    }
    seenTypes.add(variation.type);

    // Validate value is not empty
    if (!variation.value || variation.value.trim() === '') {
      errors.push(`Boş varyasyon değeri: ${variation.type}`);
    }

    // Type-specific validation
    switch (variation.type) {
      case 'size':
        if (!/\d+[,.]?\d*\s*(LT|KG|ML|GR)/i.test(variation.value)) {
          errors.push(`Geçersiz boyut formatı: ${variation.value}`);
        }
        break;
      case 'packaging':
        if (!/^\d+$/.test(variation.value)) {
          errors.push(`Geçersiz paket formatı: ${variation.value}`);
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
