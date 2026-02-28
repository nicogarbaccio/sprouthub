import { useState, useEffect, useCallback } from 'react';
import { LocationData, WeatherError } from '@/services/weatherTypes';
import weatherService from '@/services/weatherService';


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

  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    hasPermission: null,
  });

  // Request current location
  const requestLocation = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const location = await weatherService.getCurrentLocation();
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
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: weatherError,
        hasPermission: weatherError.type === 'permission_denied' ? false : prev.hasPermission,
      }));
      throw error;
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
    if (autoRequest && isGeolocationSupported && state.hasPermission === null) {
      requestLocation().catch(() => {
        // Error is already handled in state
      });
    }
  }, [autoRequest, isGeolocationSupported, requestLocation, state.hasPermission]);

  return {
    ...state,
    requestLocation,
    getLocationFromCity,
    isGeolocationSupported,
  };
}
