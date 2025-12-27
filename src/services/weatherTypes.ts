export interface WeatherData {
  current_temp_celsius: number;
  current_humidity_percent: number;
  season: 'winter' | 'spring' | 'summer' | 'fall';
  daylight_hours: number;
  upcoming_rain_probability: number; // 0-100
  is_snowing: boolean;
  weather_condition: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
  }>;
  coord: {
    lat: number;
    lon: number;
  };
  name: string;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  dt: number;
}

export interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
    pop: number; // Probability of precipitation (0-1)
  }>;
}

export interface WeatherError {
  type: 'network' | 'api_limit' | 'invalid_location' | 'permission_denied' | 'unknown';
  message: string;
}

export interface CachedWeatherData {
  data: WeatherData;
  timestamp: number;
  location: LocationData;
}

export interface WeatherServiceOptions {
  cacheTimeout?: number; // in milliseconds, default 1 hour
  useCache?: boolean;
}
