import { describe, it, expect, vi } from 'vitest';
import { generatePassword, validatePassword, encryptPassword, decryptPassword } from './passwordUtils';

describe('passwordUtils', () => {
  describe('generatePassword', () => {
    it('should generate a password of specified length', () => {
      const length = 15;
      const password = generatePassword(length);
      expect(password).toHaveLength(length);
    });

    it('should generate a password with mixed characters', () => {
      const password = generatePassword(12);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[!@#$%^&*]/.test(password)).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should return valid for passwords >= 6 chars', () => {
      expect(validatePassword('123456').valid).toBe(true);
    });

    it('should return invalid for passwords < 6 chars', () => {
      const result = validatePassword('12345');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Şifre en az 6 karakter olmalıdır');
    });
  });

  describe('encryption', () => {
    it('should correctly encrypt and decrypt a password', () => {
      const password = 'TestPassword123!';
      const encrypted = encryptPassword(password);
      expect(encrypted).not.toBe(password);
      
      const decrypted = decryptPassword(encrypted);
      expect(decrypted).toBe(password);
    });

    it('should fail to decrypt with wrong key', () => {
      const password = 'TestPassword123!';
      const encrypted = encryptPassword(password, 'key1');
      const decrypted = decryptPassword(encrypted, 'key2');
      expect(decrypted).not.toBe(password);
    });
  });
});
