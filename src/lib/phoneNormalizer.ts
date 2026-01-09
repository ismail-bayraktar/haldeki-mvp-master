/**
 * Normalize Turkish phone numbers for consistent database matching
 *
 * Handles various input formats:
 * - "+90 555 123 4567"
 * - "0555 123 45 67"
 * - "555-123-4567"
 * - "+90(555)1234567"
 *
 * All normalized to: "5551234567" (10 digits, no country code, no leading zero)
 *
 * Normalization steps:
 * 1. Remove all non-digit characters
 * 2. Remove Turkish country code (90 or +90)
 * 3. Remove leading zero (0)
 * 4. Validate length (must be exactly 10 digits)
 */

export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  let digitsOnly = phone.replace(/\D/g, '');

  // Handle Turkish country code (+90 or 90)
  if (digitsOnly.startsWith('90')) {
    digitsOnly = digitsOnly.substring(2);
  }

  // Remove leading zero (0) if present
  // Turkish format: 0XXX XXX XX XX -> XXX XXX XX XX
  if (digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.substring(1);
  }

  // Turkish mobile numbers are 10 digits (5xx xxx xx xx)
  // If we have more than 10 digits, something is wrong
  if (digitsOnly.length > 10) {
    console.warn(`Phone number too long after normalization: ${phone} -> ${digitsOnly}`);
    return null;
  }

  // If we have fewer than 10 digits, it's incomplete
  if (digitsOnly.length < 10) {
    console.warn(`Phone number too short after normalization: ${phone} -> ${digitsOnly}`);
    return null;
  }

  return digitsOnly;
}

/**
 * Check if two phone numbers match (with normalization)
 */
export function phoneNumbersMatch(phone1: string | null, phone2: string | null): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);

  if (!normalized1 || !normalized2) return false;
  return normalized1 === normalized2;
}
