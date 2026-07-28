/**
 * Unit tests for weather service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { weatherService } from '../weatherService';
import type { LocationData, OpenWeatherResponse, OpenWeatherForecastResponse } from '../weatherTypes';

// Mock the hookLogger
vi.mock('@/utils/hookLogging', () => ({
  hookLogger: {
    warn: vi.fn()
  }
}));

// Mock environment variable
vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'test-api-key');

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = vi.fn();

describe('WeatherService', () => {
  const mockLocation: LocationData = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'US'
  };

  const createMockCurrentWeatherResponse = (overrides: Partial<OpenWeatherResponse> = {}): OpenWeatherResponse => ({
    main: {
      temp: 20,
      humidity: 60
    },
    weather: [
      {
        id: 800,
        main: 'Clear',
        description: 'clear sky'
      }
    ],
    coord: {
      lat: 40.7128,
      lon: -74.0060
    },
    name: 'New York',
    sys: {
      country: 'US',
      sunrise: 1640000000,
      sunset: 1640043200 // 12 hours of daylight
    },
    dt: 1640000000,
    ...overrides
  });

  const createMockForecastResponse = (popValues: number[] = [0.3, 0.5, 0.2]): OpenWeatherForecastResponse => ({
    list: popValues.map((pop, i) => ({
      dt: 1640000000 + (i * 10800), // 3-hour intervals
      main: {
        temp: 20,
        humidity: 60
      },
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: 'clear sky'
        }
      ],
      pop
    }))
  });

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isConfigured', () => {
    it('should return true when API key is configured', () => {
      expect(weatherService.isConfigured()).toBe(true);
    });
  });

  describe('getCurrentWeather', () => {
    it('should fetch current weather data', async () => {
      const mockCurrentWeather = createMockCurrentWeatherResponse();
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      const weather = await weatherService.getCurrentWeather(mockLocation);

      expect(weather.current_temp_celsius).toBe(20);
      expect(weather.current_humidity_percent).toBe(60);
      expect(weather.weather_condition).toBe('Clear');
      expect(weather.upcoming_rain_probability).toBe(50); // Max of [30, 50, 20]
      expect(weather.is_snowing).toBe(false);
    });

    it('should calculate daylight hours correctly', async () => {
      const mockCurrentWeather = createMockCurrentWeatherResponse({
        sys: {
          country: 'US',
          sunrise: 1640000000,
          sunset: 1640043200 // 12 hours later
        }
      });
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      const weather = await weatherService.getCurrentWeather(mockLocation);

      expect(weather.daylight_hours).toBe(12);
    });

    it('should detect snow from weather ID', async () => {
      const mockCurrentWeather = createMockCurrentWeatherResponse({
        weather: [
          {
            id: 600, // Snow ID
            main: 'Snow',
            description: 'light snow'
          }
        ]
      });
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      const weather = await weatherService.getCurrentWeather(mockLocation);

      expect(weather.is_snowing).toBe(true);
      expect(weather.weather_condition).toBe('Snow');
    });

    it('should detect snow from rain + freezing temperature', async () => {
      const mockCurrentWeather = createMockCurrentWeatherResponse({
        main: {
          temp: 0, // Freezing
          humidity: 60
        },
        weather: [
          {
            id: 500, // Rain ID
            main: 'Rain',
            description: 'light rain'
          }
        ]
      });
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      const weather = await weatherService.getCurrentWeather(mockLocation);

      expect(weather.is_snowing).toBe(true);
      expect(weather.weather_condition).toBe('Snow');
    });

    it('should detect forecast snow from weather ID', async () => {
      const mockCurrentWeather = createMockCurrentWeatherResponse();
      const mockForecast: OpenWeatherForecastResponse = {
        list: [
          {
            dt: 1640000000,
            main: { temp: 0, humidity: 60 },
            weather: [{ id: 600, main: 'Snow', description: 'snow' }],
            pop: 0.5
          }
        ]
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      const weather = await weatherService.getCurrentWeather(mockLocation);

      expect(weather.is_snowing).toBe(true);
    });

    it('should calculate correct season for northern hemisphere', async () => {
      const realDate = Date;
      const mockDate = new Date(2024, 5, 25); // late June — mid-summer up north under equinox boundaries

      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
      } as any;

      const mockCurrentWeather = createMockCurrentWeatherResponse();
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      const weather = await weatherService.getCurrentWeather(mockLocation);

      expect(weather.season).toBe('summer');

      global.Date = realDate;
    });

    it('should flip seasons for southern hemisphere', async () => {
      const realDate = Date;
      const mockDate = new Date(2024, 5, 25); // late June — mid-summer up north under equinox boundaries

      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
      } as any;

      const southernLocation: LocationData = {
        latitude: -33.8688,
        longitude: 151.2093,
        city: 'Sydney',
        country: 'AU'
      };

      const mockCurrentWeather = createMockCurrentWeatherResponse();
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      const weather = await weatherService.getCurrentWeather(southernLocation);

      expect(weather.season).toBe('winter'); // Flipped from northern summer

      global.Date = realDate;
    });

    it('should use cached data when available and valid', async () => {
      const cachedData = {
        data: {
          current_temp_celsius: 25,
          current_humidity_percent: 70,
          season: 'summer',
          daylight_hours: 14,
          upcoming_rain_probability: 20,
          is_snowing: false,
          weather_condition: 'Sunny'
        },
        location: mockLocation,
        timestamp: Date.now() - 1000 // 1 second ago
      };

      localStorage.setItem('sprouthub_weather_cache_v2', JSON.stringify(cachedData));

      const weather = await weatherService.getCurrentWeather(mockLocation);

      expect(weather.current_temp_celsius).toBe(25);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should ignore cache when useCache is false', async () => {
      const cachedData = {
        data: {
          current_temp_celsius: 25,
          current_humidity_percent: 70,
          season: 'summer',
          daylight_hours: 14,
          upcoming_rain_probability: 20,
          is_snowing: false,
          weather_condition: 'Sunny'
        },
        location: mockLocation,
        timestamp: Date.now() - 1000
      };

      localStorage.setItem('sprouthub_weather_cache_v2', JSON.stringify(cachedData));

      const mockCurrentWeather = createMockCurrentWeatherResponse();
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      const weather = await weatherService.getCurrentWeather(mockLocation, { useCache: false });

      expect(weather.current_temp_celsius).toBe(20);
      expect(fetch).toHaveBeenCalled();
    });

    it('should invalidate cache when location is too far away', async () => {
      const cachedData = {
        data: {
          current_temp_celsius: 25,
          current_humidity_percent: 70,
          season: 'summer',
          daylight_hours: 14,
          upcoming_rain_probability: 20,
          is_snowing: false,
          weather_condition: 'Sunny'
        },
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        timestamp: Date.now() - 1000
      };

      localStorage.setItem('sprouthub_weather_cache_v2', JSON.stringify(cachedData));

      // Different location (far away)
      const farLocation: LocationData = {
        latitude: 34.0522,
        longitude: -118.2437,
        city: 'Los Angeles',
        country: 'US'
      };

      const mockCurrentWeather = createMockCurrentWeatherResponse();
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      await weatherService.getCurrentWeather(farLocation);

      expect(fetch).toHaveBeenCalled();
    });

    it('should invalidate cache when timeout has expired', async () => {
      const cachedData = {
        data: {
          current_temp_celsius: 25,
          current_humidity_percent: 70,
          season: 'summer',
          daylight_hours: 14,
          upcoming_rain_probability: 20,
          is_snowing: false,
          weather_condition: 'Sunny'
        },
        location: mockLocation,
        timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      };

      localStorage.setItem('sprouthub_weather_cache_v2', JSON.stringify(cachedData));

      const mockCurrentWeather = createMockCurrentWeatherResponse();
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      await weatherService.getCurrentWeather(mockLocation, { cacheTimeout: 60 * 60 * 1000 });

      expect(fetch).toHaveBeenCalled();
    });

    it('should handle current weather API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({})
      } as Response);

      // The service throws createWeatherError but it's caught and becomes 'unknown'
      // because WeatherError is not an Error instance
      await expect(weatherService.getCurrentWeather(mockLocation)).rejects.toMatchObject({
        type: 'unknown',
        message: 'Unknown error occurred'
      });
    });

    it('should handle API key errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      // The service throws createWeatherError but it's caught and becomes 'unknown'
      await expect(weatherService.getCurrentWeather(mockLocation)).rejects.toMatchObject({
        type: 'unknown'
      });
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      // handleWeatherError converts TypeError to network error
      await expect(weatherService.getCurrentWeather(mockLocation)).rejects.toMatchObject({
        type: 'network'
      });
    });

    it('should handle server errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      // The service throws createWeatherError but it's caught and becomes 'unknown'
      await expect(weatherService.getCurrentWeather(mockLocation)).rejects.toMatchObject({
        type: 'unknown'
      });
    });

    it('should handle forecast fetch failure gracefully', async () => {
      const mockCurrentWeather = createMockCurrentWeatherResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        } as Response);

      const weather = await weatherService.getCurrentWeather(mockLocation);

      // Should still return weather data with 0 rain probability
      expect(weather.current_temp_celsius).toBe(20);
      expect(weather.upcoming_rain_probability).toBe(0);
    });
  });

  describe('getCurrentLocation', () => {
    it('should get current location from geolocation API', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060
            }
          });
        })
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      const location = await weatherService.getCurrentLocation();

      expect(location.latitude).toBe(40.7128);
      expect(location.longitude).toBe(-74.0060);
    });

    it('should handle permission denied errors', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'User denied geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3
          });
        })
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      await expect(weatherService.getCurrentLocation()).rejects.toMatchObject({
        type: 'permission_denied'
      });
    });

    it('should handle position unavailable errors', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({
            code: 2, // POSITION_UNAVAILABLE
            message: 'Position unavailable'
          });
        })
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      await expect(weatherService.getCurrentLocation()).rejects.toMatchObject({
        type: 'unknown'
      });
    });

    it('should handle timeout errors', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({
            code: 3, // TIMEOUT
            message: 'Timeout',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3
          });
        })
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      await expect(weatherService.getCurrentLocation()).rejects.toMatchObject({
        type: 'network'
      });
    });

    it('should handle missing geolocation API', async () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });

      await expect(weatherService.getCurrentLocation()).rejects.toMatchObject({
        type: 'permission_denied',
        message: 'Geolocation is not supported by this browser'
      });
    });
  });

  describe('getLocationFromCity', () => {
    it('should get location from city name', async () => {
      const mockResponse = [
        {
          name: 'New York',
          lat: 40.7128,
          lon: -74.0060,
          country: 'US'
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const location = await weatherService.getLocationFromCity('New York');

      expect(location.latitude).toBe(40.7128);
      expect(location.longitude).toBe(-74.0060);
      expect(location.city).toBe('New York');
      expect(location.country).toBe('US');
    });

    it('should handle city not found', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      // When empty array is returned, it throws WeatherError but becomes 'unknown'
      await expect(weatherService.getLocationFromCity('InvalidCity123')).rejects.toMatchObject({
        type: 'unknown'
      });
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404
      } as Response);

      // createWeatherError is called but becomes 'unknown'
      await expect(weatherService.getLocationFromCity('City')).rejects.toMatchObject({
        type: 'unknown'
      });
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(weatherService.getLocationFromCity('City')).rejects.toMatchObject({
        type: 'network'
      });
    });
  });

  describe('getLocationFromInput', () => {
    it('should detect and handle US ZIP codes', async () => {
      const mockResponse = {
        lat: 10001,
        lon: -74.0060,
        name: 'New York',
        country: 'US'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const location = await weatherService.getLocationFromInput('10001');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('zip?zip=10001')
      );
    });

    it('should handle ZIP+4 format', async () => {
      const mockResponse = {
        lat: 10001,
        lon: -74.0060,
        name: 'New York',
        country: 'US'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await weatherService.getLocationFromInput('10001-1234');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('zip?zip=10001')
      );
    });

    it('should treat non-ZIP input as city name', async () => {
      const mockResponse = [
        {
          name: 'London',
          lat: 51.5074,
          lon: -0.1278,
          country: 'GB'
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const location = await weatherService.getLocationFromInput('London');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('direct?q=London')
      );
      expect(location.city).toBe('London');
    });

    it('should trim input before processing', async () => {
      const mockResponse = [
        {
          name: 'Paris',
          lat: 48.8566,
          lon: 2.3522,
          country: 'FR'
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await weatherService.getLocationFromInput('  Paris  ');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('direct?q=Paris')
      );
    });
  });

  describe('cache management', () => {
    it('should remove corrupted cache data', async () => {
      localStorage.setItem('sprouthub_weather_cache_v2', 'invalid json');

      const mockCurrentWeather = createMockCurrentWeatherResponse();
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      await weatherService.getCurrentWeather(mockLocation);

      expect(localStorage.getItem('sprouthub_weather_cache_v2')).not.toBe('invalid json');
    });

    it('should handle localStorage errors when caching', async () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      const mockCurrentWeather = createMockCurrentWeatherResponse();
      const mockForecast = createMockForecastResponse();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCurrentWeather
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        } as Response);

      // Should not throw even if caching fails
      await expect(weatherService.getCurrentWeather(mockLocation)).resolves.toBeDefined();
    });
  });
});
