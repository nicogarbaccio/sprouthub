/**
 * Centralized timeout configuration for Playwright tests
 * All timeout values in milliseconds
 */

export const TIMEOUTS = {
  // Page navigation and loading
  NAVIGATION: 3000, // Reduced from 5000
  PAGE_LOAD: 5000, // Reduced from 10000
  DOMCONTENT_LOADED: 3000, // Reduced from 5000
  NETWORK_IDLE: 5000,
  ELEMENT_WAIT: 2000, // Reduced from 3000
  SELECTOR_WAIT: 2000, // Reduced from 3000

  // UI interactions
  CLICK: 1000, // Reduced from 3000
  FORM_FILL: 1000, // Reduced from 2000
  TAB_TRANSITION: 300, // Reduced from 500
  ANIMATION: 100,
  SHORT_WAIT: 100,

  // Dialog and modal operations
  DIALOG_OPEN: 2000, // Reduced from 3000
  DIALOG_CLOSE: 2000, // Reduced from 3000
  MODAL_TRANSITION: 2000, // Reduced from 3000

  // Plant operations
  WATERING: 1000,
  HOVER: 500,

  // Toast notifications
  TOAST_APPEAR: 2000,
  TOAST_DISAPPEAR: 3000,

  // Smart actions
  SMART_CLICK: 1000,
  SMART_FILL: 1000,
  SMART_WAIT: 25,
  MICRO_WAIT: 10,

  // Extended timeouts for complex operations
  BULK_OPERATION: 3000, // Reduced from 5000
  SETUP_TEARDOWN: 5000, // Reduced from 10000

  // Pattern detection and analysis
  PATTERN_ANALYSIS: 5000, // Reduced from 8000
  PATTERN_DIALOG: 3000, // Reduced from 5000

  // Default timeouts for utility functions
  DEFAULT_WAIT: 1500, // Reduced from 2000
  DEFAULT_INTERACTION: 1000, // Reduced from 1500
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
 * Use sparingly - tests should work without multipliers
 */
export function getTimeout(timeoutKey: keyof typeof TIMEOUTS, multiplier: number = 1): number {
  return TIMEOUTS[timeoutKey] * multiplier;
}

// Removed getTimeoutMultiplier() and getEnvTimeout()
// Tests should work the same in CI and locally without special handling
// If tests are flaky in CI, fix the tests, don't add multipliers