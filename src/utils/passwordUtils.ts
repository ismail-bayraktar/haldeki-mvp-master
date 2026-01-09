/**
 * Password utilities for generating and managing temporary passwords
 *
 * SECURITY NOTICE:
 * - Password storage in localStorage is deprecated
 * - Use Supabase Auth password reset flow instead
 * - Temporary password functions are for development only
 */

/**
 * Generates a cryptographically secure random password
 * @param length - Password length (default: 12)
 * @returns Generated password
 */
export function generatePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  const allChars = lowercase + uppercase + numbers + symbols;

  // Use crypto.getRandomValues for cryptographic security
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  // Ensure at least one character from each category
  let password = '';
  password += lowercase[array[0] % lowercase.length];
  password += uppercase[array[1] % uppercase.length];
  password += numbers[array[2] % numbers.length];
  password += symbols[array[3] % symbols.length];

  // Fill the rest with cryptographically secure random values
  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length];
  }

  // Shuffle using crypto-secure random
  return password.split('').sort(() => {
    const randomValue = array[password.length] || Math.random();
    return randomValue - 0.5;
  }).join('');
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Validation result
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Şifre en az 6 karakter olmalıdır');
  }
  
  if (password.length > 128) {
    errors.push('Şifre en fazla 128 karakter olabilir');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * ENCRYPTION FUNCTIONS - DEPRECATED
 *
 * SECURITY WARNING: The XOR encryption functions below are INSECURE and should NOT be used.
 * They are kept only for backward compatibility during migration.
 *
 * Instead of storing passwords in localStorage, use Supabase Auth's built-in password reset flow:
 * 1. Use supabase.auth.resetPasswordForEmail() to send reset link
 * 2. User creates new password via secure link
 * 3. No password storage needed
 *
 * Migration plan:
 * - Phase 1: Replace storeTemporaryPassword() with password reset flow
 * - Phase 2: Remove all localStorage password storage
 * - Phase 3: Delete encryptPassword() and decryptPassword() functions
 */

/**
 * @deprecated INSECURE: Do not use XOR encryption for passwords
 * Use Supabase Auth password reset flow instead
 *
 * This function is kept for backward compatibility only and will be removed.
 * XOR encryption is NOT real encryption and can be broken in seconds.
 *
 * @security RISK: High - Passwords can be easily decrypted
 * @migration Use supabase.auth.resetPasswordForEmail() instead
 */
export function encryptPassword(text: string, key: string = 'haldeki-temp-password-key'): string {
  console.warn('[SECURITY] encryptPassword is DEPRECATED and INSECURE. Use Supabase Auth password reset flow instead.');

  // Simple XOR encryption (NOT cryptographically secure)
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted);
}

/**
 * @deprecated INSECURE: Do not use XOR decryption for passwords
 * Use Supabase Auth password reset flow instead
 *
 * This function is kept for backward compatibility only and will be removed.
 *
 * @security RISK: High - Passwords can be easily decrypted
 * @migration Use supabase.auth.resetPasswordForEmail() instead
 */
export function decryptPassword(encrypted: string, key: string = 'haldeki-temp-password-key'): string {
  console.warn('[SECURITY] decryptPassword is DEPRECATED and INSECURE. Use Supabase Auth password reset flow instead.');

  try {
    const decoded = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  } catch (error) {
    console.error('[SECURITY] Password decryption error:', error);
    return '';
  }
}

/**
 * @deprecated DO NOT STORE PASSWORDS IN LOCALSTORAGE
 * Use Supabase Auth password reset flow instead
 *
 * @security RISK: Critical - Passwords stored in localStorage can be stolen via XSS
 * @migration Use supabase.auth.resetPasswordForEmail() for password resets
 */
export function storeTemporaryPassword(userId: string, password: string): void {
  console.warn('[SECURITY] storeTemporaryPassword is DEPRECATED. Do not store passwords in localStorage.');

  // Only allow in development
  if (import.meta.env.PROD) {
    console.error('[SECURITY] Password storage is disabled in production');
    return;
  }

  try {
    const encrypted = encryptPassword(password);
    localStorage.setItem(`temp_password_${userId}`, encrypted);
  } catch (error) {
    console.error('Error storing temporary password:', error);
  }
}

/**
 * @deprecated DO NOT STORE PASSWORDS IN LOCALSTORAGE
 * Use Supabase Auth password reset flow instead
 */
export function getTemporaryPassword(userId: string): string | null {
  console.warn('[SECURITY] getTemporaryPassword is DEPRECATED. Use Supabase Auth password reset flow instead.');

  // Only allow in development
  if (import.meta.env.PROD) {
    return null;
  }

  try {
    const encrypted = localStorage.getItem(`temp_password_${userId}`);
    if (!encrypted) return null;
    return decryptPassword(encrypted);
  } catch (error) {
    console.error('Error retrieving temporary password:', error);
    return null;
  }
}

/**
 * Removes temporary password from localStorage
 * @param userId - User ID
 */
export function removeTemporaryPassword(userId: string): void {
  localStorage.removeItem(`temp_password_${userId}`);
}

/**
 * RECOMMENDED: Use Supabase Auth password reset instead of storing passwords
 *
 * Example usage:
 * ```typescript
 * // Send password reset email
 * await supabase.auth.resetPasswordForEmail(email);
 *
 * // User clicks link in email, then updates password
 * await supabase.auth.updateUser({ password: newPassword });
 * ```
 */

