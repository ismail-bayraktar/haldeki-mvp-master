// Validation utilities for supplier product inputs
// Security: Prevents excessive values and validates URLs

// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_PRICE = 1000000; // 1 million TL
export const MAX_STOCK = 1000000; // 1 million units
export const MAX_DECIMAL_PLACES = 2;

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Validates if a string is a safe URL
 * - Must use http:// or https:// protocol
 * - Blocks javascript: and data: URLs (XSS prevention)
 * - Blocks protocol-relative URLs (//evil.com)
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmed = url.trim();

  // Must start with http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes image URL by removing potentially dangerous content
 * - Strips whitespace
 * - Validates protocol
 * - Returns null if invalid
 */
export function sanitizeImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  if (!isValidImageUrl(trimmed)) {
    return null;
  }

  return trimmed;
}

// ============================================================================
// NUMBER VALIDATION
// ============================================================================

/**
 * Validates price input
 * - Must be positive number
 * - Cannot exceed MAX_PRICE
 * - Max 2 decimal places
 */
export function isValidPrice(value: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }

  if (value < 0) {
    return false;
  }

  if (value > MAX_PRICE) {
    return false;
  }

  // Check decimal places
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  if (decimalPlaces > MAX_DECIMAL_PLACES) {
    return false;
  }

  return true;
}

/**
 * Validates stock quantity input
 * - Must be non-negative integer
 * - Cannot exceed MAX_STOCK
 */
export function isValidStock(value: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }

  if (!Number.isInteger(value)) {
    return false;
  }

  if (value < 0) {
    return false;
  }

  if (value > MAX_STOCK) {
    return false;
  }

  return true;
}

/**
 * Clamps price to valid range
 */
export function clampPrice(value: number): number {
  return Math.max(0, Math.min(value, MAX_PRICE));
}

/**
 * Clamps stock to valid range
 */
export function clampStock(value: number): number {
  return Math.max(0, Math.min(Math.floor(value), MAX_STOCK));
}

// ============================================================================
// STRING VALIDATION
// ============================================================================

/**
 * Validates product name
 * - Not empty
 * - Max 200 characters
 */
export function isValidProductName(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 200;
}

/**
 * Sanitizes product name
 */
export function sanitizeProductName(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, 200);
}

/**
 * Validates category name
 * - Not empty
 * - Max 100 characters
 */
export function isValidCategory(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
}

/**
 * Validates unit name
 * - Not empty
 * - Max 50 characters
 */
export function isValidUnit(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
}
