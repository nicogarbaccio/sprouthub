/**
 * Unit tests for authentication form validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateSignUpForm,
  hasValidationErrors,
  type FormData,
  type ValidationErrors
} from '../auth/validation';

describe('validateSignUpForm', () => {
  const validFormData: FormData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  };

  describe('password validation', () => {
    it('should reject passwords shorter than 6 characters', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'pass',
        confirmPassword: 'pass'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBe('Password must be at least 6 characters long');
    });

    it('should accept passwords with exactly 6 characters', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'pass12',
        confirmPassword: 'pass12'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBe('');
    });

    it('should accept passwords longer than 6 characters', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'password123',
        confirmPassword: 'password123'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBe('');
    });

    it('should handle empty passwords', () => {
      const formData: FormData = {
        ...validFormData,
        password: '',
        confirmPassword: ''
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBe('Password must be at least 6 characters long');
    });

    it('should accept passwords with special characters', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'p@ssw0rd!',
        confirmPassword: 'p@ssw0rd!'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBe('');
    });

    it('should accept passwords with spaces', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'my password',
        confirmPassword: 'my password'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBe('');
    });
  });

  describe('confirm password validation', () => {
    it('should reject when passwords do not match', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'password123',
        confirmPassword: 'password456'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.confirmPassword).toBe("Passwords don't match");
    });

    it('should accept when passwords match exactly', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'password123',
        confirmPassword: 'password123'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.confirmPassword).toBe('');
    });

    it('should reject when passwords differ by case', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'Password123',
        confirmPassword: 'password123'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.confirmPassword).toBe("Passwords don't match");
    });

    it('should reject when passwords differ by whitespace', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'password123',
        confirmPassword: 'password123 '
      };
      const errors = validateSignUpForm(formData);
      expect(errors.confirmPassword).toBe("Passwords don't match");
    });

    it('should handle empty confirm password', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'password123',
        confirmPassword: ''
      };
      const errors = validateSignUpForm(formData);
      expect(errors.confirmPassword).toBe("Passwords don't match");
    });

    it('should accept matching passwords with special characters', () => {
      const formData: FormData = {
        ...validFormData,
        password: 'p@ssw0rd!#$',
        confirmPassword: 'p@ssw0rd!#$'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.confirmPassword).toBe('');
    });
  });

  describe('username validation', () => {
    it('should reject usernames shorter than 3 characters', () => {
      const formData: FormData = {
        ...validFormData,
        username: 'ab'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('Username must be at least 3 characters long');
    });

    it('should accept usernames with exactly 3 characters', () => {
      const formData: FormData = {
        ...validFormData,
        username: 'abc'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('');
    });

    it('should accept usernames longer than 3 characters', () => {
      const formData: FormData = {
        ...validFormData,
        username: 'johndoe'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('');
    });

    it('should handle empty usernames', () => {
      const formData: FormData = {
        ...validFormData,
        username: ''
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('Username must be at least 3 characters long');
    });

    it('should accept usernames with numbers', () => {
      const formData: FormData = {
        ...validFormData,
        username: 'user123'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('');
    });

    it('should accept usernames with underscores', () => {
      const formData: FormData = {
        ...validFormData,
        username: 'user_name'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('');
    });

    it('should accept usernames with hyphens', () => {
      const formData: FormData = {
        ...validFormData,
        username: 'user-name'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('');
    });

    it('should accept usernames with special characters', () => {
      const formData: FormData = {
        ...validFormData,
        username: 'user.name'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('');
    });
  });

  describe('email validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@sub.example.com',
        'user123@example.org',
        'a@b.co'
      ];

      validEmails.forEach(email => {
        const formData: FormData = {
          ...validFormData,
          email
        };
        const errors = validateSignUpForm(formData);
        expect(errors.email).toBe('');
      });
    });

    it('should reject emails without @ symbol', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'userexample.com'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should reject emails without domain', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'user@'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should reject emails without username', () => {
      const formData: FormData = {
        ...validFormData,
        email: '@example.com'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should reject emails without top-level domain', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'user@example'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should reject emails with spaces', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'user @example.com'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should reject empty emails', () => {
      const formData: FormData = {
        ...validFormData,
        email: ''
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should reject emails with multiple @ symbols', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'user@@example.com'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should reject emails with invalid characters', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'user name@example.com'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should accept emails with plus addressing', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'user+tag@example.com'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('');
    });

    it('should accept emails with dots in username', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'first.last@example.com'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('');
    });

    it('should accept emails with subdomains', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'user@mail.example.com'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('');
    });
  });

  describe('complete form validation', () => {
    it('should return no errors for a completely valid form', () => {
      const errors = validateSignUpForm(validFormData);
      expect(errors.password).toBe('');
      expect(errors.confirmPassword).toBe('');
      expect(errors.username).toBe('');
      expect(errors.email).toBe('');
    });

    it('should return multiple errors for an invalid form', () => {
      const formData: FormData = {
        firstName: '',
        lastName: '',
        username: 'ab',
        email: 'invalid',
        password: 'pass',
        confirmPassword: 'different'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBeTruthy();
      expect(errors.confirmPassword).toBeTruthy();
      expect(errors.username).toBeTruthy();
      expect(errors.email).toBeTruthy();
    });

    it('should handle all empty fields', () => {
      const formData: FormData = {
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBeTruthy();
      // Empty confirm password doesn't match empty password, so no error
      expect(errors.confirmPassword).toBe('');
      expect(errors.username).toBeTruthy();
      expect(errors.email).toBeTruthy();
    });

    it('should not validate firstName and lastName', () => {
      // The function doesn't validate these fields currently
      const formData: FormData = {
        ...validFormData,
        firstName: '',
        lastName: ''
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBe('');
      expect(errors.confirmPassword).toBe('');
      expect(errors.username).toBe('');
      expect(errors.email).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle very long usernames', () => {
      const formData: FormData = {
        ...validFormData,
        username: 'a'.repeat(100)
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('');
    });

    it('should handle very long emails', () => {
      const formData: FormData = {
        ...validFormData,
        email: 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.email).toBe('');
    });

    it('should handle very long passwords', () => {
      const longPassword = 'a'.repeat(1000);
      const formData: FormData = {
        ...validFormData,
        password: longPassword,
        confirmPassword: longPassword
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBe('');
      expect(errors.confirmPassword).toBe('');
    });

    it('should handle unicode characters in username', () => {
      const formData: FormData = {
        ...validFormData,
        username: 'user日本'
      };
      const errors = validateSignUpForm(formData);
      expect(errors.username).toBe('');
    });

    it('should handle unicode characters in password', () => {
      const password = 'pässwörd123';
      const formData: FormData = {
        ...validFormData,
        password: password,
        confirmPassword: password
      };
      const errors = validateSignUpForm(formData);
      expect(errors.password).toBe('');
      expect(errors.confirmPassword).toBe('');
    });
  });
});

describe('hasValidationErrors', () => {
  it('should return false when there are no errors', () => {
    const errors: ValidationErrors = {
      password: '',
      confirmPassword: '',
      username: '',
      email: ''
    };
    expect(hasValidationErrors(errors)).toBe(false);
  });

  it('should return true when password has an error', () => {
    const errors: ValidationErrors = {
      password: 'Password is too short',
      confirmPassword: '',
      username: '',
      email: ''
    };
    expect(hasValidationErrors(errors)).toBe(true);
  });

  it('should return true when confirmPassword has an error', () => {
    const errors: ValidationErrors = {
      password: '',
      confirmPassword: "Passwords don't match",
      username: '',
      email: ''
    };
    expect(hasValidationErrors(errors)).toBe(true);
  });

  it('should return true when username has an error', () => {
    const errors: ValidationErrors = {
      password: '',
      confirmPassword: '',
      username: 'Username is too short',
      email: ''
    };
    expect(hasValidationErrors(errors)).toBe(true);
  });

  it('should return true when email has an error', () => {
    const errors: ValidationErrors = {
      password: '',
      confirmPassword: '',
      username: '',
      email: 'Email is invalid'
    };
    expect(hasValidationErrors(errors)).toBe(true);
  });

  it('should return true when multiple fields have errors', () => {
    const errors: ValidationErrors = {
      password: 'Password is too short',
      confirmPassword: "Passwords don't match",
      username: 'Username is too short',
      email: 'Email is invalid'
    };
    expect(hasValidationErrors(errors)).toBe(true);
  });

  it('should handle whitespace-only error messages as errors', () => {
    const errors: ValidationErrors = {
      password: ' ',
      confirmPassword: '',
      username: '',
      email: ''
    };
    expect(hasValidationErrors(errors)).toBe(true);
  });
});
