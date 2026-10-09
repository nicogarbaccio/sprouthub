import { useState, useEffect, useCallback } from 'react';
import { LocationData, WeatherError } from '@/services/weatherTypes';
import weatherService from '@/services/weatherService';
import {
  deviceLocationAge,
  loadDeviceLocation,
  saveDeviceLocation,
  setDeviceLocationDenied,
} from '@/utils/weather/savedLocation';


export interface LocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: WeatherError | null;
  hasPermission: boolean | null; // null = not requested, true = granted, false = denied
}

export interface UseLocationOptions {
  autoRequest?: boolean; // Automatically request location on mount
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useLocation(options: UseLocationOptions = {}) {
  const {
    autoRequest = false,
  } = options;

  // Start from the last location this device reported, so callers that only need a location
  // (not a fresh one) don't trigger another permission prompt
  const [state, setState] = useState<LocationState>(() => ({
    location: loadDeviceLocation(),
    isLoading: false,
    error: null,
    hasPermission: null,
  }));

  // Request current location. Resolves to the location, or null if it couldn't be
  // obtained (the reason is in state.error). It doesn't reject: callers fire this from
  // effects and click handlers, and a rejection there surfaces as an unhandled error.
  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const location = await weatherService.getCurrentLocation();
      saveDeviceLocation(location);
      setState(prev => ({
        ...prev,
        location,
        isLoading: false,
        hasPermission: true,
        error: null,
      }));
      return location;
    } catch (error) {
      const weatherError = error as WeatherError;
      if (weatherError.type === 'permission_denied') setDeviceLocationDenied(true);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: weatherError,
        hasPermission: weatherError.type === 'permission_denied' ? false : prev.hasPermission,
      }));
      return null;
    }
  }, []);

  /**
   * Updates the saved location only when that can't show a permission prompt: the browser
   * reports geolocation as already granted, and the saved location is older than maxAgeMs.
   */
  const refreshLocationIfPermitted = useCallback(async (maxAgeMs: number) => {
    const age = deviceLocationAge();
    if (age !== null && age < maxAgeMs) return;

    try {
      const status = await navigator.permissions?.query({ name: 'geolocation' });
      if (status?.state !== 'granted') return;
    } catch {
      // No Permissions API for geolocation here, so there's no way to know it won't prompt
      return;
    }

    try {
      const location = await weatherService.getCurrentLocation();
      saveDeviceLocation(location);
      setState(prev => ({ ...prev, location, hasPermission: true, error: null }));
    } catch {
      // Keep using the saved location
    }
  }, []);

  // Get location from city name
  const getLocationFromCity = useCallback(async (cityName: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const location = await weatherService.getLocationFromCity(cityName);
      setState(prev => ({
        ...prev,
        location,
        isLoading: false,
        error: null,
      }));
      return location;
    } catch (error) {
      const weatherError = error as WeatherError;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: weatherError,
      }));
      throw error;
    }
  }, []);

  // Check if geolocation is supported
  const isGeolocationSupported = 'geolocation' in navigator;

  // Auto-request location on mount if enabled
  useEffect(() => {
    if (autoRequest && isGeolocationSupported && state.hasPermission === null && !state.location) {
      requestLocation();
    }
  }, [autoRequest, isGeolocationSupported, requestLocation, state.hasPermission, state.location]);

  return {
    ...state,
    requestLocation,
    refreshLocationIfPermitted,
    getLocationFromCity,
    isGeolocationSupported,
  };
}
