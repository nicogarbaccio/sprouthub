import { useState, useEffect, useCallback } from 'react';
import { WeatherData, LocationData, WeatherError, WeatherServiceOptions } from '@/services/weatherTypes';
import weatherService from '@/services/weatherService';
import { createFallbackWeatherData } from '@/utils/weatherMapping';
import { WateringFactors } from '@/utils/smartWateringSchedule';

export interface WeatherDataState {
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: WeatherError | null;
  isFallback: boolean; // True if using fallback data due to API failure
  lastUpdated: Date | null;
}

export interface UseWeatherDataOptions extends WeatherServiceOptions {
  location?: LocationData | null;
  fallbackSeason?: WateringFactors['season'];
  autoFetch?: boolean; // Automatically fetch weather when location changes
}

export function useWeatherData(options: UseWeatherDataOptions = {}) {
  const {
    location,
    fallbackSeason,
    autoFetch = true,
    cacheTimeout = 60 * 60 * 1000, // 1 hour
    useCache = true,
  } = options;

  const [state, setState] = useState<WeatherDataState>({
    weatherData: null,
    isLoading: false,
    error: null,
    isFallback: false,
    lastUpdated: null,
  });

  // Fetch weather data for a specific location
  const fetchWeather = useCallback(async (targetLocation?: LocationData) => {
    const locationToUse = targetLocation || location;
    
    if (!locationToUse) {
      setState(prev => ({
        ...prev,
        error: { type: 'invalid_location', message: 'No location provided' },
        isLoading: false,
      }));
      return;
    }

    // Check if API is configured
    if (!weatherService.isConfigured()) {
      console.warn('Weather API key not configured, using fallback data');
      const fallbackData = createFallbackWeatherData(fallbackSeason);
      setState({
        weatherData: fallbackData,
        isLoading: false,
        error: null,
        isFallback: true,
        lastUpdated: new Date(),
      });
      return fallbackData;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const weatherData = await weatherService.getCurrentWeather(locationToUse, {
        cacheTimeout,
        useCache,
      });

      setState({
        weatherData,
        isLoading: false,
        error: null,
        isFallback: false,
        lastUpdated: new Date(),
      });

      return weatherData;
    } catch (error) {
      const weatherError = error as WeatherError;
      console.warn('Weather API failed, using fallback data:', weatherError.message);
      
      // Use fallback data when API fails
      const fallbackData = createFallbackWeatherData(fallbackSeason);
      setState({
        weatherData: fallbackData,
        isLoading: false,
        error: weatherError,
        isFallback: true,
        lastUpdated: new Date(),
      });

      return fallbackData;
    }
  }, [location, fallbackSeason, cacheTimeout, useCache]);

  // Refresh weather data (bypass cache)
  const refreshWeather = useCallback(async () => {
    return fetchWeather(location);
  }, [fetchWeather, location]);

  // Clear weather data
  const clearWeather = useCallback(() => {
    setState({
      weatherData: null,
      isLoading: false,
      error: null,
      isFallback: false,
      lastUpdated: null,
    });
  }, []);

  // Get fallback weather data without API call
  const getFallbackWeather = useCallback(() => {
    const fallbackData = createFallbackWeatherData(fallbackSeason);
    setState({
      weatherData: fallbackData,
      isLoading: false,
      error: null,
      isFallback: true,
      lastUpdated: new Date(),
    });
    return fallbackData;
  }, [fallbackSeason]);

  // Auto-fetch weather when location changes
  useEffect(() => {
    if (autoFetch && location) {
      fetchWeather(location);
    }
  }, [autoFetch, location, fetchWeather]);

  // Check if weather data is stale
  const isStale = state.lastUpdated && state.weatherData && !state.isFallback
    ? Date.now() - state.lastUpdated.getTime() > cacheTimeout
    : false;

  return {
    ...state,
    fetchWeather,
    refreshWeather,
    clearWeather,
    getFallbackWeather,
    isStale,
    isConfigured: weatherService.isConfigured(),
  };
}
