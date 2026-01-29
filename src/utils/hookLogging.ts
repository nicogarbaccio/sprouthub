/**
 * Consistent logging utility for React hooks
 *
 * Provides structured logging with hook context and environment awareness.
 * Automatically disabled in production builds for performance and security.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

/**
 * Determines if logging should be enabled based on environment
 */
const isLoggingEnabled = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Formats a log message with hook context
 *
 * @param hookName - Name of the hook (e.g., 'useHouseholds')
 * @param message - Log message
 * @param context - Optional additional context
 * @returns Formatted log message
 */
const formatMessage = (
  hookName: string,
  message: string,
  context?: LogContext
): [string, LogContext?] => {
  const prefix = `[${hookName}]`;
  return context ? [`${prefix} ${message}`, context] : [`${prefix} ${message}`];
};

/**
 * Logs a debug message (development only)
 *
 * @param hookName - Name of the hook
 * @param message - Debug message
 * @param context - Optional additional context data
 *
 * @example
 * hookLogger.debug('useHouseholds', 'Fetching memberships', { userId: user.id });
 */
const debug = (hookName: string, message: string, context?: LogContext): void => {
  if (!isLoggingEnabled()) return;

  const [formattedMessage, logContext] = formatMessage(hookName, message, context);

  if (logContext) {
    console.log(formattedMessage, logContext);
  } else {
    console.log(formattedMessage);
  }
};

/**
 * Logs an informational message (development only)
 *
 * @param hookName - Name of the hook
 * @param message - Info message
 * @param context - Optional additional context data
 *
 * @example
 * hookLogger.info('useProfile', 'Profile updated successfully');
 */
const info = (hookName: string, message: string, context?: LogContext): void => {
  if (!isLoggingEnabled()) return;

  const [formattedMessage, logContext] = formatMessage(hookName, message, context);

  if (logContext) {
    console.info(formattedMessage, logContext);
  } else {
    console.info(formattedMessage);
  }
};

/**
 * Logs a warning message (always enabled)
 *
 * @param hookName - Name of the hook
 * @param message - Warning message
 * @param context - Optional additional context data
 *
 * @example
 * hookLogger.warn('useUserPlants', 'Could not load member details', { error });
 */
const warn = (hookName: string, message: string, context?: LogContext): void => {
  const [formattedMessage, logContext] = formatMessage(hookName, message, context);

  if (logContext) {
    console.warn(formattedMessage, logContext);
  } else {
    console.warn(formattedMessage);
  }
};

/**
 * Logs an error message (always enabled)
 *
 * @param hookName - Name of the hook
 * @param message - Error message
 * @param error - Error object or context data
 *
 * @example
 * hookLogger.error('useHouseholds', 'Failed to fetch households', error);
 */
const error = (hookName: string, message: string, error: any): void => {
  const [formattedMessage] = formatMessage(hookName, message);

  console.error(formattedMessage, error);
};

/**
 * Logs the start of an async operation (development only)
 *
 * @param hookName - Name of the hook
 * @param operation - Name of the operation
 * @param context - Optional context data
 *
 * @example
 * hookLogger.operationStart('useHouseholds', 'fetchHouseholds', { userId });
 */
const operationStart = (
  hookName: string,
  operation: string,
  context?: LogContext
): void => {
  debug(hookName, `Starting: ${operation}`, context);
};

/**
 * Logs the completion of an async operation (development only)
 *
 * @param hookName - Name of the hook
 * @param operation - Name of the operation
 * @param duration - Optional duration in milliseconds
 * @param context - Optional context data
 *
 * @example
 * hookLogger.operationComplete('useHouseholds', 'fetchHouseholds', 245, { count: 3 });
 */
const operationComplete = (
  hookName: string,
  operation: string,
  duration?: number,
  context?: LogContext
): void => {
  const durationText = duration ? ` (${duration}ms)` : '';
  debug(hookName, `Completed: ${operation}${durationText}`, context);
};

/**
 * Logs an operation failure (always enabled)
 *
 * @param hookName - Name of the hook
 * @param operation - Name of the operation
 * @param error - Error object
 *
 * @example
 * hookLogger.operationFailed('useHouseholds', 'fetchHouseholds', error);
 */
const operationFailed = (
  hookName: string,
  operation: string,
  err: any
): void => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  error(hookName, `Failed: ${operation} - ${errorMessage}`, err);
};

/**
 * Hook logger utility object
 */
export const hookLogger = {
  debug,
  info,
  warn,
  error,
  operationStart,
  operationComplete,
  operationFailed,
};

/**
 * Performance tracking helper for hook operations
 *
 * @param hookName - Name of the hook
 * @param operation - Name of the operation
 * @returns Object with complete() method to log completion
 *
 * @example
 * const tracker = trackOperation('useHouseholds', 'fetchHouseholds');
 * // ... do work
 * tracker.complete({ count: households.length });
 */
export const trackOperation = (hookName: string, operation: string) => {
  const startTime = Date.now();
  hookLogger.operationStart(hookName, operation);

  return {
    complete: (context?: LogContext) => {
      const duration = Date.now() - startTime;
      hookLogger.operationComplete(hookName, operation, duration, context);
    },
    fail: (error: any) => {
      hookLogger.operationFailed(hookName, operation, error);
    },
  };
};
