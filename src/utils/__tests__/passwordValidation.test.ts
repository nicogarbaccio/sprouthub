/**
 * Unit tests for password validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  getPasswordStrengthMessage,
  generateSecurePassword,
  type PasswordValidationResult
} from '../auth/password';

describe('validatePassword', () => {
  describe('minimum length requirement', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should accept passwords with exactly 8 characters', () => {
      const result = validatePassword('Pass1234!');
      expect(result.errors).not.toContain('Password must be at least 8 characters long');
    });

    it('should accept passwords longer than 8 characters', () => {
      const result = validatePassword('Password123!');
      expect(result.errors).not.toContain('Password must be at least 8 characters long');
    });
  });

  describe('maximum length requirement', () => {
    it('should reject passwords longer than 128 characters', () => {
      const longPassword = 'A'.repeat(129) + '1!';
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters');
    });

    it('should accept passwords with exactly 128 characters', () => {
      const password = 'A'.repeat(125) + '1b!';
      const result = validatePassword(password);
      expect(result.errors).not.toContain('Password must be less than 128 characters');
    });

    it('should accept passwords shorter than 128 characters', () => {
      const result = validatePassword('Password123!');
      expect(result.errors).not.toContain('Password must be less than 128 characters');
    });
  });

  describe('common password detection', () => {
    it('should reject common passwords', () => {
      const commonPasswords = [
        'password',
        'password123',
        '123456',
        'qwerty',
        'admin',
        'welcome',
        'letmein'
      ];

      commonPasswords.forEach(pwd => {
        const result = validatePassword(pwd);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password is too common. Please choose a more unique password');
      });
    });

    it('should reject common passwords regardless of case', () => {
      const variations = ['PASSWORD', 'Password', 'pAsSwOrD', 'QWERTY', 'Admin'];

      variations.forEach(pwd => {
        const result = validatePassword(pwd);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password is too common. Please choose a more unique password');
      });
    });

    it('should accept uncommon passwords', () => {
      const result = validatePassword('MyUn1que!Pass');
      expect(result.errors).not.toContain('Password is too common. Please choose a more unique password');
    });
  });

  describe('weak pattern detection', () => {
    it('should reject passwords with only numbers', () => {
      const result = validatePassword('12345678');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password pattern is too simple. Use a mix of letters, numbers, and symbols');
    });

    it('should reject passwords with only letters', () => {
      const result = validatePassword('abcdefgh');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password pattern is too simple. Use a mix of letters, numbers, and symbols');
    });

    it('should reject passwords with only uppercase letters', () => {
      const result = validatePassword('ABCDEFGH');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password pattern is too simple. Use a mix of letters, numbers, and symbols');
    });

    it('should reject passwords with repeated characters', () => {
      const result = validatePassword('aaaaaaaa');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password pattern is too simple. Use a mix of letters, numbers, and symbols');
    });

    it('should accept passwords with mixed character types', () => {
      const result = validatePassword('Pass123!word');
      expect(result.errors).not.toContain('Password pattern is too simple. Use a mix of letters, numbers, and symbols');
    });
  });

  describe('character variety requirements', () => {
    it('should reject passwords with less than 2 character types', () => {
      const result = validatePassword('abcdefgh');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 2 of: lowercase letters, uppercase letters, numbers, symbols');
    });

    it('should accept passwords with lowercase and uppercase', () => {
      const result = validatePassword('AbCdEfGh');
      expect(result.errors).not.toContain('Password must contain at least 2 of: lowercase letters, uppercase letters, numbers, symbols');
    });

    it('should accept passwords with lowercase and numbers', () => {
      const result = validatePassword('abcdef12');
      expect(result.errors).not.toContain('Password must contain at least 2 of: lowercase letters, uppercase letters, numbers, symbols');
    });

    it('should accept passwords with lowercase and symbols', () => {
      const result = validatePassword('abcdef!@');
      expect(result.errors).not.toContain('Password must contain at least 2 of: lowercase letters, uppercase letters, numbers, symbols');
    });

    it('should accept passwords with 3+ character types', () => {
      const result = validatePassword('Abc123!@');
      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('Password must contain at least 2 of: lowercase letters, uppercase letters, numbers, symbols');
    });
  });

  describe('password strength calculation', () => {
    it('should mark short passwords as weak', () => {
      const result = validatePassword('Abc12!');
      expect(result.strength).toBe('weak');
    });

    it('should mark 8-char passwords with 2 types as medium', () => {
      const result = validatePassword('abcdef12');
      expect(result.strength).toBe('medium');
    });

    it('should mark 8-char passwords with 3+ types as strong', () => {
      const result = validatePassword('Abcde12!');
      expect(result.strength).toBe('strong');
    });

    it('should mark 12+ char passwords with 3+ types as strong', () => {
      const result = validatePassword('MyStr0ng!Pass');
      expect(result.strength).toBe('strong');
    });

    it('should mark 12+ char passwords with 3 types as strong', () => {
      const result = validatePassword('Abcdefghij12');
      expect(result.strength).toBe('strong');
    });

    it('should not mark invalid passwords as strong', () => {
      const result = validatePassword('password');
      expect(result.strength).not.toBe('strong');
    });
  });

  describe('overall validation', () => {
    it('should validate a strong password with all requirements met', () => {
      const result = validatePassword('MySecure!Pass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe('strong');
    });

    it('should return multiple errors for a weak password', () => {
      const result = validatePassword('pass');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle empty passwords', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should handle passwords with special symbols', () => {
      const result = validatePassword('P@ssw0rd!#$%');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should handle passwords with unicode characters', () => {
      const result = validatePassword('Pässw0rd!');
      expect(result.isValid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle passwords with spaces', () => {
      const result = validatePassword('My Pass 123!');
      expect(result.isValid).toBe(true);
    });

    it('should handle passwords with only symbols (if long enough)', () => {
      const result = validatePassword('!@#$%^&*()');
      expect(result.errors).toContain('Password must contain at least 2 of: lowercase letters, uppercase letters, numbers, symbols');
    });

    it('should handle passwords with newlines', () => {
      const result = validatePassword('Pass\n123!');
      expect(result.isValid).toBe(true);
    });

    it('should handle very long valid passwords', () => {
      const longValidPassword = 'MySecurePass123!'.repeat(5);
      const result = validatePassword(longValidPassword);
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });
  });
});

describe('getPasswordStrengthMessage', () => {
  it('should return correct message for weak passwords', () => {
    const message = getPasswordStrengthMessage('weak');
    expect(message).toBe('Password is weak. Consider using a longer password with mixed characters.');
  });

  it('should return correct message for medium passwords', () => {
    const message = getPasswordStrengthMessage('medium');
    expect(message).toBe('Password is moderately strong. Consider adding more character variety.');
  });

  it('should return correct message for strong passwords', () => {
    const message = getPasswordStrengthMessage('strong');
    expect(message).toBe('Password is strong!');
  });

  it('should return empty string for invalid strength', () => {
    // @ts-expect-error - testing invalid input
    const message = getPasswordStrengthMessage('invalid');
    expect(message).toBe('');
  });
});

describe('generateSecurePassword', () => {
  it('should generate password with default length of 12', () => {
    const password = generateSecurePassword();
    expect(password.length).toBe(12);
  });

  it('should generate password with specified length', () => {
    const password = generateSecurePassword(16);
    expect(password.length).toBe(16);
  });

  it('should generate password with minimum 4 characters', () => {
    const password = generateSecurePassword(4);
    expect(password.length).toBe(4);
  });

  it('should generate password that passes validation', () => {
    const password = generateSecurePassword();
    const result = validatePassword(password);
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('strong');
  });

  it('should generate password with lowercase letters', () => {
    const password = generateSecurePassword();
    expect(/[a-z]/.test(password)).toBe(true);
  });

  it('should generate password with uppercase letters', () => {
    const password = generateSecurePassword();
    expect(/[A-Z]/.test(password)).toBe(true);
  });

  it('should generate password with numbers', () => {
    const password = generateSecurePassword();
    expect(/\d/.test(password)).toBe(true);
  });

  it('should generate password with symbols', () => {
    const password = generateSecurePassword();
    expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true);
  });

  it('should generate different passwords on each call', () => {
    const password1 = generateSecurePassword();
    const password2 = generateSecurePassword();
    expect(password1).not.toBe(password2);
  });

  it('should generate long passwords correctly', () => {
    const password = generateSecurePassword(32);
    expect(password.length).toBe(32);
    const result = validatePassword(password);
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('strong');
  });

  it('should not generate common passwords', () => {
    // Generate multiple passwords and ensure none are common
    for (let i = 0; i < 10; i++) {
      const password = generateSecurePassword();
      const result = validatePassword(password);
      expect(result.errors).not.toContain('Password is too common. Please choose a more unique password');
    }
  });

  it('should not generate passwords with weak patterns', () => {
    // Generate multiple passwords and ensure none have weak patterns
    for (let i = 0; i < 10; i++) {
      const password = generateSecurePassword();
      const result = validatePassword(password);
      expect(result.errors).not.toContain('Password pattern is too simple. Use a mix of letters, numbers, and symbols');
    }
  });
});
