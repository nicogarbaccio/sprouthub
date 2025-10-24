/**
 * Shared error handling utilities for hooks
 *
 * Provides consistent error handling patterns across the application
 * to reduce code duplication and ensure uniform user experience.
 */

interface ToastProps {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

type ToastFunction = (props: ToastProps) => void;
type LoggerFunction = (message: string, error: any) => void;

/**
 * Handles API errors with consistent logging and user notification
 *
 * @param error - The error object from the API call
 * @param message - User-friendly error message to display
 * @param toast - Toast notification function
 * @param logger - Optional logging function (defaults to console.error)
 *
 * @example
 * try {
 *   await supabase.from('table').select();
 * } catch (error) {
 *   handleApiError(error, 'Failed to load data', toast);
 *   return false;
 * }
 */
export const handleApiError = (
  error: any,
  message: string,
  toast: ToastFunction,
  logger: LoggerFunction = console.error
): void => {
  const errorMsg = error instanceof Error ? error.message : message;

  logger(message, error);

  toast({
    title: 'Error',
    description: errorMsg,
    variant: 'destructive',
  });
};

/**
 * Handles API success with consistent user notification
 *
 * @param message - Success message to display
 * @param toast - Toast notification function
 * @param description - Optional detailed description
 *
 * @example
 * handleApiSuccess('Profile updated successfully', toast);
 */
export const handleApiSuccess = (
  message: string,
  toast: ToastFunction,
  description?: string
): void => {
  toast({
    title: 'Success',
    description: description || message,
  });
};

/**
 * Handles API warnings with consistent user notification
 *
 * @param message - Warning message to display
 * @param toast - Toast notification function
 * @param description - Optional detailed description
 *
 * @example
 * handleApiWarning('Some data could not be loaded', toast, 'Continuing without member details');
 */
export const handleApiWarning = (
  message: string,
  toast: ToastFunction,
  description?: string
): void => {
  toast({
    title: 'Warning',
    description: description || message,
    variant: 'destructive',
  });
};

/**
 * Extracts a user-friendly error message from various error types
 *
 * @param error - The error object (Error, string, or unknown)
 * @param fallback - Fallback message if error cannot be parsed
 * @returns User-friendly error message
 *
 * @example
 * const message = getErrorMessage(error, 'An unexpected error occurred');
 */
export const getErrorMessage = (
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return fallback;
};

/**
 * Validates and normalizes email addresses
 *
 * @param email - Email address to validate
 * @returns Normalized email (trimmed and lowercase) or null if invalid
 *
 * @example
 * const normalized = validateEmail('  User@Example.COM  ');
 * // Returns: 'user@example.com'
 */
export const validateEmail = (email: string): string | null => {
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalized)) {
    return null;
  }

  return normalized;
};

/**
 * Type guard to check if an error is a Supabase PostgrestError
 *
 * @param error - Error object to check
 * @returns True if error is a PostgrestError
 */
export const isPostgrestError = (error: any): error is {
  code: string;
  message: string;
  details: string;
  hint: string;
} => {
  return (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error
  );
};

/**
 * Checks if a Supabase error indicates "no rows returned"
 *
 * @param error - Error object to check
 * @returns True if error indicates no rows found
 */
export const isNoRowsError = (error: any): boolean => {
  return isPostgrestError(error) && error.code === 'PGRST116';
};
