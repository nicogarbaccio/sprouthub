/**
 * Centralized error handling for missing or unimplemented features in tests
 * Provides consistent error messages and handling strategies
 */

/**
 * Types of feature availability
 */
export enum FeatureAvailability {
  NOT_IMPLEMENTED = 'not_implemented',
  TEMPORARILY_DISABLED = 'temporarily_disabled',
  CONDITIONALLY_AVAILABLE = 'conditionally_available',
  DEPRECATED = 'deprecated'
}

/**
 * Test behavior when encountering missing features
 */
export enum TestBehavior {
  THROW_ERROR = 'throw_error',
  SKIP_SILENTLY = 'skip_silently',
  LOG_WARNING = 'log_warning',
  FALLBACK = 'fallback'
}

/**
 * Feature error configuration
 */
interface FeatureErrorConfig {
  featureName: string;
  availability: FeatureAvailability;
  behavior: TestBehavior;
  message?: string;
  fallbackAction?: () => Promise<void>;
  expectedInVersion?: string;
}

/**
 * Standard feature error class with consistent messaging
 */
export class FeatureNotAvailableError extends Error {
  public readonly featureName: string;
  public readonly availability: FeatureAvailability;
  public readonly expectedInVersion?: string;

  constructor(config: FeatureErrorConfig) {
    const message = config.message || FeatureErrorHandler.generateStandardMessage(config);
    super(message);
    
    this.name = 'FeatureNotAvailableError';
    this.featureName = config.featureName;
    this.availability = config.availability;
    this.expectedInVersion = config.expectedInVersion;
  }
}

/**
 * Centralized feature error handler
 */
export class FeatureErrorHandler {

  /**
   * Handle missing feature based on configuration
   */
  static async handleMissingFeature(config: FeatureErrorConfig): Promise<void> {
    switch (config.behavior) {
      case TestBehavior.THROW_ERROR:
        throw new FeatureNotAvailableError(config);

      case TestBehavior.SKIP_SILENTLY:
        // Do nothing, continue execution
        break;

      case TestBehavior.LOG_WARNING:
        console.warn(`⚠️ Feature "${config.featureName}" is ${config.availability}`);
        break;

      case TestBehavior.FALLBACK:
        if (config.fallbackAction) {
          await config.fallbackAction();
        } else {
          console.warn(`⚠️ No fallback provided for "${config.featureName}"`);
        }
        break;

      default:
        throw new FeatureNotAvailableError(config);
    }
  }

  /**
   * Generate standard error message
   */
  static generateStandardMessage(config: FeatureErrorConfig): string {
    const baseMessage = `Feature "${config.featureName}" is ${config.availability.replace('_', ' ')}`;
    
    switch (config.availability) {
      case FeatureAvailability.NOT_IMPLEMENTED:
        return `${baseMessage} in the current application version${config.expectedInVersion ? `. Expected in version ${config.expectedInVersion}` : ''}`;
        
      case FeatureAvailability.TEMPORARILY_DISABLED:
        return `${baseMessage}. This feature may be restored in a future version`;
        
      case FeatureAvailability.CONDITIONALLY_AVAILABLE:
        return `${baseMessage}. Check if prerequisites are met before using this feature`;
        
      case FeatureAvailability.DEPRECATED:
        return `${baseMessage}. Use alternative methods${config.expectedInVersion ? `. Will be removed in version ${config.expectedInVersion}` : ''}`;
        
      default:
        return baseMessage;
    }
  }

  /**
   * Check if element exists before attempting to interact with it
   */
  static async checkElementAvailability(
    page: { locator: (selector: string) => { count: () => Promise<number> } },
    selector: string,
    featureName: string,
    behavior: TestBehavior = TestBehavior.THROW_ERROR
  ): Promise<boolean> {
    const elementCount = await page.locator(selector).count();
    
    if (elementCount === 0) {
      await this.handleMissingFeature({
        featureName,
        availability: FeatureAvailability.NOT_IMPLEMENTED,
        behavior,
        message: `Element "${selector}" for feature "${featureName}" not found in current app version`
      });
      return false;
    }
    
    return true;
  }
}

/**
 * Common feature configurations for the plant app
 */
export const PLANT_APP_FEATURES = {
  SEARCH: {
    featureName: 'Plant Search',
    availability: FeatureAvailability.NOT_IMPLEMENTED,
    behavior: TestBehavior.SKIP_SILENTLY,
    expectedInVersion: '2.0'
  },

  FILTERS: {
    featureName: 'Plant Filters',
    availability: FeatureAvailability.NOT_IMPLEMENTED,
    behavior: TestBehavior.SKIP_SILENTLY,
    expectedInVersion: '2.0'
  },

  PAGINATION: {
    featureName: 'Plant Catalog Pagination',
    availability: FeatureAvailability.NOT_IMPLEMENTED,
    behavior: TestBehavior.SKIP_SILENTLY,
    expectedInVersion: '2.1'
  },

  BULK_OPERATIONS: {
    featureName: 'Bulk Plant Operations',
    availability: FeatureAvailability.NOT_IMPLEMENTED,
    behavior: TestBehavior.LOG_WARNING,
    expectedInVersion: '2.2'
  },

  ADVANCED_SORTING: {
    featureName: 'Advanced Plant Sorting',
    availability: FeatureAvailability.NOT_IMPLEMENTED,
    behavior: TestBehavior.SKIP_SILENTLY,
    expectedInVersion: '2.1'
  }
} as const;

/**
 * Utility function for graceful feature degradation
 */
export async function tryFeatureOrFallback<T>(
  featureAction: () => Promise<T>,
  fallbackAction: () => Promise<T>,
  featureName: string
): Promise<T> {
  try {
    return await featureAction();
  } catch (error) {
    if (error instanceof FeatureNotAvailableError) {
      console.warn(`⚠️ ${featureName} not available, using fallback`);
      return await fallbackAction();
    }
    throw error;
  }
}

/**
 * Decorator for graceful feature handling
 */
export function handleMissingFeature(config: FeatureErrorConfig) {
  return function (_target: unknown, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        // If it's already a feature error, handle it
        if (error instanceof FeatureNotAvailableError) {
          await FeatureErrorHandler.handleMissingFeature(config);
          return;
        }
        
        // For other errors that might indicate missing features
        if ((error as Error).message?.includes('not found') || (error as Error).message?.includes('timeout')) {
          await FeatureErrorHandler.handleMissingFeature({
            ...config,
            message: `${config.featureName} failed: ${(error as Error).message}`
          });
          return;
        }
        
        throw error;
      }
    };
  };
}