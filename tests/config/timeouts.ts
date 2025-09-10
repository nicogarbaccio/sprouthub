/**
 * Centralized timeout configuration for Playwright tests
 * All timeout values in milliseconds
 */

export const TIMEOUTS = {
  // Page navigation and loading
  NAVIGATION: 5000,
  PAGE_LOAD: 10000,
  DOMCONTENT_LOADED: 5000,
  NETWORK_IDLE: 5000,
  ELEMENT_WAIT: 3000,
  SELECTOR_WAIT: 3000,

  // UI interactions
  CLICK: 3000,
  FORM_FILL: 2000,
  TAB_TRANSITION: 500,
  ANIMATION: 100,
  SHORT_WAIT: 100,

  // Dialog and modal operations
  DIALOG_OPEN: 3000,
  DIALOG_CLOSE: 3000,
  MODAL_TRANSITION: 3000,

  // Plant operations
  WATERING: 1000,
  HOVER: 500,

  // Toast notifications
  TOAST_APPEAR: 2000,
  TOAST_DISAPPEAR: 3000,

  // Smart actions (reduced for faster tests)
  SMART_CLICK: 1000,
  SMART_FILL: 1000,
  SMART_WAIT: 25,
  MICRO_WAIT: 10,

  // Extended timeouts for complex operations
  BULK_OPERATION: 5000,
  SETUP_TEARDOWN: 10000,

  // Default timeouts for utility functions
  DEFAULT_WAIT: 2000,
  DEFAULT_INTERACTION: 1500,
} as const;

/**
 * Animation and transition durations for CSS (in milliseconds)
 * Used when disabling animations in tests
 */
export const ANIMATION_DURATIONS = {
  DISABLED: 0.01, // Minimal duration when animations are disabled
} as const;

/**
 * Helper function to get timeout with optional multiplier
 * Useful for CI environments that might need longer timeouts
 */
export function getTimeout(timeoutKey: keyof typeof TIMEOUTS, multiplier: number = 1): number {
  return TIMEOUTS[timeoutKey] * multiplier;
}

/**
 * Environment-aware timeout multiplier
 * Can be used to adjust timeouts based on CI/local environment
 */
export function getTimeoutMultiplier(): number {
  if (process.env.CI) {
    return 1.5; // 50% longer timeouts in CI
  }
  return 1;
}

/**
 * Get environment-adjusted timeout
 */
export function getEnvTimeout(timeoutKey: keyof typeof TIMEOUTS): number {
  return getTimeout(timeoutKey, getTimeoutMultiplier());
}