
/**
 * Validation utilities for authentication forms
 */
export interface ValidationErrors {
 password: string;
 confirmPassword: string;
 username: string;
 email: string;
}

export interface FormData {
 firstName: string;
 lastName: string;
 username: string;
 email: string;
 password: string;
 confirmPassword: string;
}

/**
 * Validates the signup form data and returns validation errors
 */
export const validateSignUpForm = (formData: FormData): ValidationErrors => {
 const errors: ValidationErrors = {
  password: "",
  confirmPassword: "",
  username: "",
  email: "",
 };

 // Password validation
 if (formData.password.length < 6) {
  errors.password = "Password must be at least 6 characters long";
 }

 // Confirm password validation
 if (formData.password !== formData.confirmPassword) {
  errors.confirmPassword = "Passwords don't match";
 }

 // Username validation (basic)
 if (formData.username.length < 3) {
  errors.username = "Username must be at least 3 characters long";
 }

 // Email validation (basic)
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!emailRegex.test(formData.email)) {
  errors.email = "Please enter a valid email address";
 }

 return errors;
};

/**
 * Checks if the form has any validation errors
 */
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
 return Object.values(errors).some(error => error !== "");
};
