/**
 * Password validation utilities for enhanced security
 * Implements client-side password strength requirements since
 * advanced password policies require Pro plan
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '123456789', 'qwerty',
  'abc123', 'password1', 'admin', 'letmein', 'welcome',
  'monkey', '1234567890', 'password123', 'dragon', 'master',
  'hello', 'login', 'princess', 'qwerty123', 'solo',
  'passw0rd', 'starwars', 'football', 'iloveyou', 'welcome123'
];

// Common patterns to avoid
const WEAK_PATTERNS = [
  /^(\d+)$/, // Only numbers
  /^([a-z]+)$/i, // Only letters
  /^(.)\1+$/, // Repeated characters
  /^(.)\1{2,}$/, // 3+ repeated characters
  /^(.)\1{1,}$/, // 2+ repeated characters
];

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check maximum length (reasonable limit)
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password');
  }

  // Check for weak patterns
  for (const pattern of WEAK_PATTERNS) {
    if (pattern.test(password)) {
      errors.push('Password pattern is too simple. Use a mix of letters, numbers, and symbols');
      break;
    }
  }

  // Check character variety
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;

  if (varietyCount < 2) {
    errors.push('Password must contain at least 2 of: lowercase letters, uppercase letters, numbers, symbols');
  }

  // Calculate strength
  if (password.length >= 12 && varietyCount >= 3) {
    strength = 'strong';
  } else if (password.length >= 8 && varietyCount >= 2) {
    strength = 'medium';
  }

  // Additional strong password requirements
  if (password.length >= 8 && varietyCount >= 3 && !errors.length) {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

export function getPasswordStrengthMessage(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'Password is weak. Consider using a longer password with mixed characters.';
    case 'medium':
      return 'Password is moderately strong. Consider adding more character variety.';
    case 'strong':
      return 'Password is strong!';
    default:
      return '';
  }
}

export function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
