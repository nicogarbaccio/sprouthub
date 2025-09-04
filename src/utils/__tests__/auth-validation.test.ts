import { describe, it, expect } from 'vitest';
import { validateSignUpForm, hasValidationErrors, type FormData, type ValidationErrors } from '../auth-validation';

describe('validateSignUpForm', () => {
 // Helper function to create test form data
 const createFormData = (overrides: Partial<FormData> = {}): FormData => ({
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  email: 'john@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  ...overrides
 });

 describe('password validation', () => {
  it('accepts valid passwords with 6+ characters', () => {
   const formData = createFormData({ password: 'password123', confirmPassword: 'password123' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('');
  });

  it('accepts long passwords', () => {
   const longPassword = 'this-is-a-very-long-password-with-many-characters-1234567890';
   const formData = createFormData({ password: longPassword, confirmPassword: longPassword });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('');
  });

  it('accepts exactly 6 character passwords', () => {
   const formData = createFormData({ password: '123456', confirmPassword: '123456' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('');
  });

  it('rejects empty passwords', () => {
   const formData = createFormData({ password: '', confirmPassword: '' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('Password must be at least 6 characters long');
  });

  it('rejects passwords with 1 character', () => {
   const formData = createFormData({ password: 'a', confirmPassword: 'a' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('Password must be at least 6 characters long');
  });

  it('rejects passwords with 5 characters', () => {
   const formData = createFormData({ password: '12345', confirmPassword: '12345' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('Password must be at least 6 characters long');
  });

  it('accepts passwords with special characters', () => {
   const formData = createFormData({ 
    password: 'p@ssw0rd!', 
    confirmPassword: 'p@ssw0rd!' 
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('');
  });

  it('accepts passwords with mixed case and numbers', () => {
   const formData = createFormData({ 
    password: 'MyP4ssw0rd', 
    confirmPassword: 'MyP4ssw0rd' 
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('');
  });
 });

 describe('confirm password validation', () => {
  it('accepts matching passwords', () => {
   const formData = createFormData({ 
    password: 'password123', 
    confirmPassword: 'password123' 
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.confirmPassword).toBe('');
  });

  it('rejects non-matching passwords', () => {
   const formData = createFormData({ 
    password: 'password123', 
    confirmPassword: 'different123' 
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.confirmPassword).toBe("Passwords don't match");
  });

  it('rejects when confirm password is empty but password is not', () => {
   const formData = createFormData({ 
    password: 'password123', 
    confirmPassword: '' 
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.confirmPassword).toBe("Passwords don't match");
  });

  it('rejects when password is empty but confirm password is not', () => {
   const formData = createFormData({ 
    password: '', 
    confirmPassword: 'password123' 
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.confirmPassword).toBe("Passwords don't match");
  });

  it('rejects case-sensitive password differences', () => {
   const formData = createFormData({ 
    password: 'Password123', 
    confirmPassword: 'password123' 
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.confirmPassword).toBe("Passwords don't match");
  });

  it('rejects whitespace differences', () => {
   const formData = createFormData({ 
    password: 'password123', 
    confirmPassword: 'password123 ' 
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.confirmPassword).toBe("Passwords don't match");
  });
 });

 describe('username validation', () => {
  it('accepts valid usernames with 3+ characters', () => {
   const formData = createFormData({ username: 'johndoe' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.username).toBe('');
  });

  it('accepts exactly 3 character usernames', () => {
   const formData = createFormData({ username: 'joe' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.username).toBe('');
  });

  it('accepts long usernames', () => {
   const formData = createFormData({ username: 'verylongusernamewithlotsocharacters' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.username).toBe('');
  });

  it('accepts usernames with numbers', () => {
   const formData = createFormData({ username: 'user123' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.username).toBe('');
  });

  it('accepts usernames with underscores and hyphens', () => {
   const formData = createFormData({ username: 'user_name-123' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.username).toBe('');
  });

  it('rejects empty usernames', () => {
   const formData = createFormData({ username: '' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.username).toBe('Username must be at least 3 characters long');
  });

  it('rejects usernames with 1 character', () => {
   const formData = createFormData({ username: 'a' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.username).toBe('Username must be at least 3 characters long');
  });

  it('rejects usernames with 2 characters', () => {
   const formData = createFormData({ username: 'ab' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.username).toBe('Username must be at least 3 characters long');
  });
 });

 describe('email validation', () => {
  it('accepts valid email addresses', () => {
   const validEmails = [
    'user@example.com',
    'test.email@domain.co.uk',
    'user+tag@example.org',
    'firstname.lastname@company.com',
    'user123@test-domain.net'
   ];

   validEmails.forEach(email => {
    const formData = createFormData({ email });
    const errors = validateSignUpForm(formData);
    
    expect(errors.email).toBe('');
   });
  });

  it('accepts emails with numbers in domain', () => {
   const formData = createFormData({ email: 'user@example123.com' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('');
  });

  it('accepts emails with dots in username', () => {
   const formData = createFormData({ email: 'first.last@example.com' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('');
  });

  it('accepts emails with plus signs', () => {
   const formData = createFormData({ email: 'user+test@example.com' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('');
  });

  it('accepts emails with hyphens in domain', () => {
   const formData = createFormData({ email: 'user@test-domain.com' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('');
  });

  it('rejects emails without @ symbol', () => {
   const formData = createFormData({ email: 'userexample.com' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('Please enter a valid email address');
  });

  it('rejects emails without domain', () => {
   const formData = createFormData({ email: 'user@' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('Please enter a valid email address');
  });

  it('rejects emails without TLD', () => {
   const formData = createFormData({ email: 'user@domain' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('Please enter a valid email address');
  });

  it('rejects emails with multiple @ symbols', () => {
   const formData = createFormData({ email: 'user@@example.com' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('Please enter a valid email address');
  });

  it('rejects emails with spaces', () => {
   const formData = createFormData({ email: 'user @example.com' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('Please enter a valid email address');
  });

  it('rejects empty emails', () => {
   const formData = createFormData({ email: '' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('Please enter a valid email address');
  });

  it('rejects emails without username', () => {
   const formData = createFormData({ email: '@example.com' });
   const errors = validateSignUpForm(formData);
   
   expect(errors.email).toBe('Please enter a valid email address');
  });
 });

 describe('combined validation scenarios', () => {
  it('returns no errors for completely valid form data', () => {
   const formData = createFormData();
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('');
   expect(errors.confirmPassword).toBe('');
   expect(errors.username).toBe('');
   expect(errors.email).toBe('');
  });

  it('returns multiple errors for multiple invalid fields', () => {
   const formData = createFormData({
    username: 'ab',
    email: 'invalid-email',
    password: '123',
    confirmPassword: '456'
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.username).toBe('Username must be at least 3 characters long');
   expect(errors.email).toBe('Please enter a valid email address');
   expect(errors.password).toBe('Password must be at least 6 characters long');
   expect(errors.confirmPassword).toBe("Passwords don't match");
  });

  it('validates password length and mismatch separately', () => {
   const formData = createFormData({
    password: '123',
    confirmPassword: '456'
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('Password must be at least 6 characters long');
   expect(errors.confirmPassword).toBe("Passwords don't match");
  });

  it('handles edge case where short passwords match', () => {
   const formData = createFormData({
    password: '123',
    confirmPassword: '123'
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe('Password must be at least 6 characters long');
   expect(errors.confirmPassword).toBe(''); // They match, so no confirm error
  });

  it('handles edge case where valid passwords do not match', () => {
   const formData = createFormData({
    password: 'validpassword1',
    confirmPassword: 'validpassword2'
   });
   const errors = validateSignUpForm(formData);
   
   expect(errors.password).toBe(''); // Valid length
   expect(errors.confirmPassword).toBe("Passwords don't match");
  });
 });
});

describe('hasValidationErrors', () => {
 it('returns false for empty errors object', () => {
  const errors: ValidationErrors = {
   password: '',
   confirmPassword: '',
   username: '',
   email: ''
  };
  
  expect(hasValidationErrors(errors)).toBe(false);
 });

 it('returns true when password has error', () => {
  const errors: ValidationErrors = {
   password: 'Password must be at least 6 characters long',
   confirmPassword: '',
   username: '',
   email: ''
  };
  
  expect(hasValidationErrors(errors)).toBe(true);
 });

 it('returns true when confirmPassword has error', () => {
  const errors: ValidationErrors = {
   password: '',
   confirmPassword: "Passwords don't match",
   username: '',
   email: ''
  };
  
  expect(hasValidationErrors(errors)).toBe(true);
 });

 it('returns true when username has error', () => {
  const errors: ValidationErrors = {
   password: '',
   confirmPassword: '',
   username: 'Username must be at least 3 characters long',
   email: ''
  };
  
  expect(hasValidationErrors(errors)).toBe(true);
 });

 it('returns true when email has error', () => {
  const errors: ValidationErrors = {
   password: '',
   confirmPassword: '',
   username: '',
   email: 'Please enter a valid email address'
  };
  
  expect(hasValidationErrors(errors)).toBe(true);
 });

 it('returns true when multiple fields have errors', () => {
  const errors: ValidationErrors = {
   password: 'Password must be at least 6 characters long',
   confirmPassword: "Passwords don't match",
   username: 'Username must be at least 3 characters long',
   email: 'Please enter a valid email address'
  };
  
  expect(hasValidationErrors(errors)).toBe(true);
 });

 it('handles whitespace-only errors as valid errors', () => {
  const errors: ValidationErrors = {
   password: '  ',
   confirmPassword: '',
   username: '',
   email: ''
  };
  
  expect(hasValidationErrors(errors)).toBe(true);
 });
});
