import {
  WeatherData,
  LocationData,
  OpenWeatherResponse,
  OpenWeatherForecastResponse,
  WeatherError,
  CachedWeatherData,
  WeatherServiceOptions,
} from './weatherTypes';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const CACHE_KEY = 'sprouthub_weather_cache';
const DEFAULT_CACHE_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

class WeatherService {
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  /**
   * Get current weather data for a location
   */
  async getCurrentWeather(
    location: LocationData,
    options: WeatherServiceOptions = {}
  ): Promise<WeatherData> {
    const { cacheTimeout = DEFAULT_CACHE_TIMEOUT, useCache = true } = options;

    // Check cache first
    if (useCache) {
      const cachedData = this.getCachedWeather(location, cacheTimeout);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      // Fetch current weather
      const currentWeatherUrl = `${this.baseUrl}/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      
      const currentResponse = await fetch(currentWeatherUrl);
      if (!currentResponse.ok) {
        throw this.createWeatherError(currentResponse.status, 'Failed to fetch current weather');
      }

      const currentData: OpenWeatherResponse = await currentResponse.json();

      // Fetch forecast for rain probability
      const forecastUrl = `${this.baseUrl}/forecast?lat=${location.latitude}&lon=${location.longitude}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=8`; // Next 24 hours (3-hour intervals)
      
      const forecastResponse = await fetch(forecastUrl);
      let rainProbability = 0;
      
      if (forecastResponse.ok) {
        const forecastData: OpenWeatherForecastResponse = await forecastResponse.json();
        // Calculate max rain probability in next 24 hours
        rainProbability = Math.max(...forecastData.list.map(item => item.pop * 100));
      }

      // Convert to our WeatherData format
      const weatherData: WeatherData = {
        current_temp_celsius: Math.round(currentData.main.temp),
        current_humidity_percent: currentData.main.humidity,
        season: this.calculateSeason(new Date(), location.latitude),
        daylight_hours: this.calculateDaylightHours(currentData.sys.sunrise, currentData.sys.sunset),
        upcoming_rain_probability: Math.round(rainProbability),
      };

      // Cache the result
      if (useCache) {
        this.cacheWeatherData(weatherData, location);
      }

      return weatherData;
    } catch (error) {
      if (error instanceof Error) {
        throw this.handleWeatherError(error);
      }
      throw this.createWeatherError('unknown', 'Unknown error occurred');
    }
  }

  /**
   * Get user's current location using browser geolocation API
   */
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(this.createWeatherError('permission_denied', 'Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorType: WeatherError['type'] = 'unknown';
          let message = 'Failed to get location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorType = 'permission_denied';
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorType = 'unknown';
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorType = 'network';
              message = 'Location request timed out';
              break;
          }

          reject(this.createWeatherError(errorType, message));
        },
        {
          timeout: 10000, // 10 seconds
          enableHighAccuracy: false,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  /**
   * Get location from city name
   */
  async getLocationFromCity(cityName: string): Promise<LocationData> {
    try {
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw this.createWeatherError(response.status === 404 ? 'invalid_location' : 'network', 'Failed to find location');
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        throw this.createWeatherError('invalid_location', 'City not found');
      }

      const location = data[0];
      return {
        latitude: location.lat,
        longitude: location.lon,
        city: location.name,
        country: location.country,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw this.handleWeatherError(error);
      }
      throw this.createWeatherError('unknown', 'Unknown error occurred');
    }
  }

  /**
   * Calculate season based on date and hemisphere
   */
  private calculateSeason(date: Date, latitude: number): WeatherData['season'] {
    const month = date.getMonth() + 1; // 1-12
    const isNorthernHemisphere = latitude >= 0;

    let season: WeatherData['season'];
    
    if (month >= 3 && month <= 5) {
      season = 'spring';
    } else if (month >= 6 && month <= 8) {
      season = 'summer';
    } else if (month >= 9 && month <= 11) {
      season = 'fall';
    } else {
      season = 'winter';
    }

    // Flip seasons for southern hemisphere
    if (!isNorthernHemisphere) {
      const seasonMap: Record<WeatherData['season'], WeatherData['season']> = {
        spring: 'fall',
        summer: 'winter',
        fall: 'spring',
        winter: 'summer',
      };
      season = seasonMap[season];
    }

    return season;
  }

  /**
   * Calculate daylight hours from sunrise/sunset timestamps
   */
  private calculateDaylightHours(sunrise: number, sunset: number): number {
    const daylightSeconds = sunset - sunrise;
    return Math.round((daylightSeconds / 3600) * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get cached weather data if still valid
   */
  private getCachedWeather(location: LocationData, cacheTimeout: number): WeatherData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cachedData: CachedWeatherData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - cachedData.timestamp > cacheTimeout) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // Check if location is close enough (within ~10km)
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        cachedData.location.latitude,
        cachedData.location.longitude
      );

      if (distance > 10) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      // If cache is corrupted, remove it
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  /**
   * Cache weather data
   */
  private cacheWeatherData(data: WeatherData, location: LocationData): void {
    try {
      const cachedData: CachedWeatherData = {
        data,
        location,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
    } catch (error) {
      // Silently fail if localStorage is not available
      console.warn('Failed to cache weather data:', error);
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Create a standardized weather error
   */
  private createWeatherError(type: WeatherError['type'] | number, message: string): WeatherError {
    if (typeof type === 'number') {
      // Convert HTTP status codes to error types
      if (type === 401 || type === 403) {
        return { type: 'api_limit', message: 'Weather API access denied or quota exceeded' };
      } else if (type === 404) {
        return { type: 'invalid_location', message: 'Location not found' };
      } else if (type >= 500) {
        return { type: 'network', message: 'Weather service temporarily unavailable' };
      } else {
        return { type: 'network', message: `Weather API error: ${type}` };
      }
    }
    return { type, message };
  }

  /**
   * Handle and convert various error types
   */
  private handleWeatherError(error: Error): WeatherError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createWeatherError('network', 'Network connection failed');
    }
    
    return this.createWeatherError('unknown', error.message);
  }

  /**
   * Clear cached weather data
   */
  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!OPENWEATHER_API_KEY;
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
export default weatherService;
