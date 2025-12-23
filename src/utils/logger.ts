/**
 * Centralized logging utility for the application
 *
 * Benefits:
 * - Consistent logging format across the app
 * - Easy to disable logs in production
 * - Can be extended to send logs to external services
 * - Type-safe logging with proper categorization
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV !== 'production', // Only enabled in development by default
      level: 'debug',
      includeTimestamp: true,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): any[] {
    const prefix = this.config.includeTimestamp
      ? `[${new Date().toISOString()}] [${level.toUpperCase()}]`
      : `[${level.toUpperCase()}]`;

    const parts = [prefix, message];
    if (data !== undefined) {
      parts.push(data);
    }

    return parts;
  }

  /**
   * Debug level logging - for detailed debugging information
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('debug', message, data));
    }
  }

  /**
   * Info level logging - for general informational messages
   */
  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message, data));
    }
  }

  /**
   * Warning level logging - for warning messages
   */
  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, data));
    }
  }

  /**
   * Error level logging - for error messages
   * Note: Errors are always logged regardless of config
   */
  error(message: string, error?: any): void {
    // Always log errors, even in production
    console.error(...this.formatMessage('error', message, error));
  }

  /**
   * Group logging - for grouping related log messages
   */
  group(label: string, callback: () => void): void {
    if (this.config.enabled) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Table logging - for displaying tabular data
   */
  table(data: any): void {
    if (this.config.enabled) {
      console.table(data);
    }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for configuration
export type { LoggerConfig, LogLevel };
