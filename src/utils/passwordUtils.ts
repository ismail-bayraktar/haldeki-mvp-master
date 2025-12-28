/**
 * Password utilities for generating and managing temporary passwords
 */

/**
 * Generates a strong random password
 * @param length - Password length (default: 12)
 * @returns Generated password
 */
export function generatePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Ensure at least one character from each category
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable pattern
  return password.split('').sort(() => Math.random() - 0.5).join('');
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
 * Simple encryption/decryption for temporary passwords
 * Note: This is a simple obfuscation, not true encryption
 * For production, consider using a proper encryption library
 * 
 * @param text - Text to encrypt
 * @param key - Encryption key (should be stored securely)
 * @returns Encrypted text (base64 encoded)
 */
export function encryptPassword(text: string, key: string = 'haldeki-temp-password-key'): string {
  // Simple XOR encryption (not cryptographically secure, but sufficient for temporary passwords)
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted);
}

/**
 * Decrypts a password
 * @param encrypted - Encrypted text (base64 encoded)
 * @param key - Decryption key (same as encryption key)
 * @returns Decrypted text
 */
export function decryptPassword(encrypted: string, key: string = 'haldeki-temp-password-key'): string {
  try {
    const decoded = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  } catch (error) {
    console.error('Password decryption error:', error);
    return '';
  }
}

/**
 * Stores temporary password in localStorage (encrypted)
 * @param userId - User ID
 * @param password - Password to store
 */
export function storeTemporaryPassword(userId: string, password: string): void {
  try {
    const encrypted = encryptPassword(password);
    localStorage.setItem(`temp_password_${userId}`, encrypted);
  } catch (error) {
    console.error('Error storing temporary password:', error);
  }
}

/**
 * Retrieves temporary password from localStorage (decrypted)
 * @param userId - User ID
 * @returns Decrypted password or null
 */
export function getTemporaryPassword(userId: string): string | null {
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

