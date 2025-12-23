/**
 * Plant-related constants
 */
export const PLANT_FALLBACK_IMAGE = "https://res.cloudinary.com/dojdglovh/image/upload/v1748969790/plant-emoji_78370-262_gmqqjg.jpg";

/**
 * Default plant care settings
 */
export const DEFAULT_WATERING_DAYS = 7;
export const DEFAULT_LIGHT_REQUIREMENT = "Medium Light";
export const DEFAULT_CARE_LEVEL = "Easy" as const;

/**
 * Plant categories
 */
export const PLANT_CATEGORIES = [
 "Trees & Large Plants",
 "Flowering Plants",
 "Succulents & Cacti",
 "Hanging & Trailing Plants",
 "Prayer Plants",
 "Palms",
 "Small Plants"
] as const;

/**
 * Timing constants (in milliseconds)
 */
export const TIMING = {
  /** Short delay for UI updates (150ms) */
  UI_SHORT_DELAY: 150,
  /** Medium delay for loading states (300ms) */
  UI_MEDIUM_DELAY: 300,
  /** Delay for data refresh operations (500ms) */
  DATA_REFRESH_DELAY: 500,
  /** Delay for loading screen (600ms) */
  LOADING_SCREEN_DELAY: 600,
  /** Delay for pattern analysis after watering (1000ms) */
  PATTERN_ANALYSIS_DELAY: 1000,
  /** Delay for suggestions refresh (1000ms) */
  SUGGESTIONS_REFRESH_DELAY: 1000,
  /** Delay for showing watering pattern after action (2000ms) */
  WATERING_PATTERN_DELAY: 2000,
  /** Delay for offline indicator display (3000ms) */
  OFFLINE_INDICATOR_DELAY: 3000,
  /** Delay for mobile hint display (3000ms) */
  MOBILE_HINT_DELAY: 3000,
  /** Timeout for auth loading (3000ms) */
  AUTH_LOADING_TIMEOUT: 3000,
  /** Debounce delay for storage writes (500ms) */
  STORAGE_WRITE_DEBOUNCE: 500,
} as const;

/**
 * Notification constants
 */
export const NOTIFICATIONS = {
  /** Maximum number of notifications to keep in storage */
  MAX_NOTIFICATIONS: 50,
  /** Storage version for notifications data */
  STORAGE_VERSION: 1,
} as const;

/**
 * UI/UX constants
 */
export const UI = {
  /** Mobile breakpoint in pixels */
  MOBILE_BREAKPOINT: 768,
  /** Items per page for pagination */
  ITEMS_PER_PAGE: 24,
  /** Maximum toast notifications to show */
  TOAST_LIMIT: 1,
  /** Delay before removing toast (in milliseconds) */
  TOAST_REMOVE_DELAY: 1000000,
  /** Sidebar cookie max age (7 days in seconds) */
  SIDEBAR_COOKIE_MAX_AGE: 60 * 60 * 24 * 7,
} as const;

/**
 * Data retention constants
 */
export const RETENTION = {
  /** Days to keep dismissed suggestions before expiring */
  SUGGESTION_EXPIRY_DAYS: 30,
  /** Days of history to track for seasonal detection */
  SEASONAL_HISTORY_DAYS: 30,
} as const; 