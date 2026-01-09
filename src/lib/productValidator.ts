/**
 * Product Validator for Import System
 * Phase 10.1 - Product Validator
 *
 * Validates product data from import files
 */

import type { ProductImportRow, ImportError } from '@/types/supplier';

/**
 * Valid categories in the system
 */
export const VALID_CATEGORIES = [
  'sebzeler',
  'meyveler',
  'yesillikler',
  'kokulu-bitkiler',
  'bakliyatlar',
  'zeytinyagli',
  'sut-urunleri',
  'yumurta',
  'et-urunleri',
  'balik-urunleri',
  'diger',
] as const;

/**
 * Valid units
 */
export const VALID_UNITS = ['kg', 'adet', 'demet', 'paket'] as const;

/**
 * Valid quality grades
 */
export const VALID_QUALITY = ['premium', 'standart', 'ekonomik'] as const;

/**
 * Valid availability statuses
 */
export const VALID_AVAILABILITY = ['plenty', 'limited', 'last', 'bol', 'limited', 'son'] as const;

/**
 * Validation options
 */
export interface ValidationOptions {
  requireImages?: boolean;
  maxDescriptionLength?: number;
  maxImages?: number;
  checkURLs?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
}

/**
 * Validate a single product import row
 */
export function validateProductRow(
  row: ProductImportRow,
  rowIndex: number,
  options: ValidationOptions = {}
): ValidationResult {
  const {
    requireImages = false,
    maxDescriptionLength = 1000,
    maxImages = 10,
    checkURLs = true,
  } = options;

  const errors: ImportError[] = [];
  const warnings: ValidationResult['warnings'] = [];

  // === Validate name ===
  if (!row.name || typeof row.name !== 'string') {
    errors.push({
      row: rowIndex,
      field: 'name',
      error: 'Ürün adı gereklidir',
      value: row.name,
    });
  } else if (row.name.trim().length === 0) {
    errors.push({
      row: rowIndex,
      field: 'name',
      error: 'Ürün adı boş olamaz',
      value: row.name,
    });
  } else if (row.name.length > 200) {
    errors.push({
      row: rowIndex,
      field: 'name',
      error: 'Ürün adı maksimum 200 karakter olabilir',
      value: row.name,
    });
  }

  // === Validate category ===
  if (!row.category || typeof row.category !== 'string') {
    errors.push({
      row: rowIndex,
      field: 'category',
      error: 'Kategori gereklidir',
      value: row.category,
    });
  } else {
    const normalizedCategory = row.category.toLowerCase().trim();
    if (!VALID_CATEGORIES.includes(normalizedCategory as any)) {
      errors.push({
        row: rowIndex,
        field: 'category',
        error: `Geçersiz kategori. Geçerli kategoriler: ${VALID_CATEGORIES.join(', ')}`,
        value: row.category,
      });
    }
  }

  // === Validate unit ===
  if (!row.unit || typeof row.unit !== 'string') {
    errors.push({
      row: rowIndex,
      field: 'unit',
      error: 'Birim gereklidir',
      value: row.unit,
    });
  } else {
    const normalizedUnit = row.unit.toLowerCase().trim();
    if (!VALID_UNITS.includes(normalizedUnit as any)) {
      errors.push({
        row: rowIndex,
        field: 'unit',
        error: `Geçersiz birim. Geçerli birimler: ${VALID_UNITS.join(', ')}`,
        value: row.unit,
      });
    }
  }

  // === Validate base price ===
  if (typeof row.basePrice !== 'number' || isNaN(row.basePrice)) {
    errors.push({
      row: rowIndex,
      field: 'basePrice',
      error: 'Taban fiyat sayı olmalıdır',
      value: row.basePrice,
    });
  } else if (row.basePrice <= 0) {
    errors.push({
      row: rowIndex,
      field: 'basePrice',
      error: 'Taban fiyat 0\'dan büyük olmalıdır',
      value: row.basePrice,
    });
  } else if (row.basePrice > 1000000) {
    warnings.push({
      row: rowIndex,
      field: 'basePrice',
      message: 'Taban fiyat çok yüksek (max 1,000,000 TL önerilir)',
      value: row.basePrice,
    });
  }

  // === Validate price ===
  if (typeof row.price !== 'number' || isNaN(row.price)) {
    errors.push({
      row: rowIndex,
      field: 'price',
      error: 'Satış fiyatı sayı olmalıdır',
      value: row.price,
    });
  } else if (row.price <= 0) {
    errors.push({
      row: rowIndex,
      field: 'price',
      error: 'Satış fiyatı 0\'dan büyük olmalıdır',
      value: row.price,
    });
  } else if (row.price < row.basePrice) {
    warnings.push({
      row: rowIndex,
      field: 'price',
      message: 'Satış fiyatı taban fiyattan düşük',
      value: row.price,
    });
  }

  // === Validate stock ===
  if (row.stock !== undefined && row.stock !== null) {
    if (typeof row.stock !== 'number' || isNaN(row.stock)) {
      errors.push({
        row: rowIndex,
        field: 'stock',
        error: 'Stok sayı olmalıdır',
        value: row.stock,
      });
    } else if (row.stock < 0) {
      errors.push({
        row: rowIndex,
        field: 'stock',
        error: 'Stok negatif olamaz',
        value: row.stock,
      });
    } else if (row.stock > 1000000) {
      warnings.push({
        row: rowIndex,
        field: 'stock',
        message: 'Stok miktarı çok yüksek (max 1,000,000 önerilir)',
        value: row.stock,
      });
    }
  }

  // === Validate origin ===
  if (row.origin !== undefined && row.origin !== null) {
    if (typeof row.origin !== 'string') {
      errors.push({
        row: rowIndex,
        field: 'origin',
        error: 'Köken metin olmalıdır',
        value: row.origin,
      });
    } else if (row.origin.length > 100) {
      errors.push({
        row: rowIndex,
        field: 'origin',
        error: 'Köken maksimum 100 karakter olabilir',
        value: row.origin,
      });
    }
  }

  // === Validate quality ===
  if (row.quality !== undefined && row.quality !== null) {
    if (typeof row.quality !== 'string') {
      errors.push({
        row: rowIndex,
        field: 'quality',
        error: 'Kalite metin olmalıdır',
        value: row.quality,
      });
    } else {
      const normalizedQuality = row.quality.toLowerCase().trim();
      // Map Turkish to English
      const qualityMap: Record<string, string> = {
        'premium': 'premium',
        'standart': 'standart',
        'ekonomik': 'ekonomik',
      };

      const mappedQuality = qualityMap[normalizedQuality] || normalizedQuality;
      if (!VALID_QUALITY.includes(mappedQuality as any)) {
        errors.push({
          row: rowIndex,
          field: 'quality',
          error: `Geçersiz kalite. Geçerli değerler: ${VALID_QUALITY.join(', ')}`,
          value: row.quality,
        });
      }
    }
  }

  // === Validate availability ===
  if (row.availability !== undefined && row.availability !== null) {
    if (typeof row.availability !== 'string') {
      errors.push({
        row: rowIndex,
        field: 'availability',
        error: 'Durum metin olmalıdır',
        value: row.availability,
      });
    } else {
      const normalizedAvailability = row.availability.toLowerCase().trim();
      // Map Turkish to English
      const availabilityMap: Record<string, string> = {
        'bol': 'plenty',
        'plenty': 'plenty',
        'limited': 'limited',
        'son': 'last',
        'last': 'last',
      };

      const mappedAvailability = availabilityMap[normalizedAvailability] || normalizedAvailability;
      if (!VALID_AVAILABILITY.includes(mappedAvailability as any)) {
        errors.push({
          row: rowIndex,
          field: 'availability',
          error: `Geçersiz durum. Geçerli değerler: plenty, limited, last`,
          value: row.availability,
        });
      }
    }
  }

  // === Validate description ===
  if (row.description !== undefined && row.description !== null) {
    if (typeof row.description !== 'string') {
      errors.push({
        row: rowIndex,
        field: 'description',
        error: 'Açıklama metin olmalıdır',
        value: row.description,
      });
    } else if (row.description.length > maxDescriptionLength) {
      errors.push({
        row: rowIndex,
        field: 'description',
        error: `Açıklama maksimum ${maxDescriptionLength} karakter olabilir`,
        value: row.description,
      });
    }
  }

  // === Validate images ===
  if (requireImages && (!row.images || row.images.length === 0)) {
    errors.push({
      row: rowIndex,
      field: 'images',
      error: 'En az bir görsel gereklidir',
      value: row.images,
    });
  }

  if (row.images && Array.isArray(row.images)) {
    if (row.images.length > maxImages) {
      errors.push({
        row: rowIndex,
        field: 'images',
        error: `Maksimum ${maxImages} görsel olabilir`,
        value: row.images.length,
      });
    }

    // Validate each image URL
    if (checkURLs) {
      row.images.forEach((imageUrl, index) => {
        if (typeof imageUrl !== 'string') {
          errors.push({
            row: rowIndex,
            field: `images[${index}]`,
            error: 'Görsel URL metin olmalıdır',
            value: imageUrl,
          });
        } else if (!isValidURL(imageUrl)) {
          errors.push({
            row: rowIndex,
            field: `images[${index}]`,
            error: 'Geçersiz görsel URL formatı',
            value: imageUrl,
          });
        } else if (!imageUrl.startsWith('https://')) {
          warnings.push({
            row: rowIndex,
            field: `images[${index}]`,
            message: 'Görsel URL HTTPS olmalıdır',
            value: imageUrl,
          });
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple product rows
 */
export function validateProductRows(
  rows: ProductImportRow[],
  options: ValidationOptions = {}
): ValidationResult {
  const allErrors: ImportError[] = [];
  const allWarnings: ValidationResult['warnings'] = [];

  rows.forEach((row, index) => {
    const result = validateProductRow(row, index + 2, options); // +2 because row 1 is header
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Check if string is valid URL
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize and map values to database format
 */
export function normalizeProductRow(row: ProductImportRow): ProductImportRow {
  return {
    name: row.name.trim(),
    category: row.category.toLowerCase().trim(),
    unit: row.unit.toLowerCase().trim(),
    basePrice: row.basePrice,
    price: row.price,
    stock: row.stock ?? 100,
    origin: row.origin?.trim() || 'Türkiye',
    quality: row.quality?.toLowerCase().trim() || 'standart',
    availability: row.availability?.toLowerCase().trim() || 'plenty',
    description: row.description?.trim() || null,
    images: row.images || [],
  };
}
