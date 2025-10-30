/**
 * Weather-related constants for the application
 */

// Time constants (in milliseconds)
export const ONE_HOUR_MS = 60 * 60 * 1000;
export const FIVE_MINUTES_MS = 5 * 60 * 1000;
export const TEN_SECONDS_MS = 10 * 1000;

// Default cache timeout for weather data (1 hour)
export const DEFAULT_WEATHER_CACHE_TIMEOUT_MS = ONE_HOUR_MS;

// Geolocation timeout (10 seconds)
export const GEOLOCATION_TIMEOUT_MS = TEN_SECONDS_MS;

// Maximum age for cached geolocation data (5 minutes)
export const GEOLOCATION_MAX_AGE_MS = FIVE_MINUTES_MS;

// Maximum distance in kilometers for cache location matching (~10km)
export const WEATHER_CACHE_LOCATION_THRESHOLD_KM = 10;
