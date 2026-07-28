import { WeatherData } from '@/services/weatherTypes';
import { WateringFactors } from '../watering/smartSchedule';
import { formatTemperature } from './temperature';
import { getSeason, resolveHemisphereFromEnvironment } from '@/utils/season';

export interface WeatherMappingResult {
  factors: Pick<WateringFactors, 'temperature' | 'humidity' | 'season'>;
  weatherSource: WeatherData;
  mappingReasons: string[];
}

export interface WeatherToFactorsOptions {
  temperatureThresholds?: {
    cool: number; // Below this temperature is "cool"
    warm: number; // Above this temperature is "warm"
  };
  humidityThresholds?: {
    dry: number; // Below this humidity is "dry"
    humid: number; // Above this humidity is "humid"
  };
}

const DEFAULT_TEMPERATURE_THRESHOLDS = {
  cool: 18, // 64°F
  warm: 24, // 75°F
};

const DEFAULT_HUMIDITY_THRESHOLDS = {
  dry: 40, // Below 40% is dry
  humid: 65, // Above 65% is humid
};

/**
 * Convert weather data to watering factors
 * @param weatherData - Raw weather data from API
 * @param options - Customizable thresholds for mapping
 * @returns Mapped factors with explanations
 */
export function mapWeatherToFactors(
  weatherData: WeatherData,
  options: WeatherToFactorsOptions = {}
): WeatherMappingResult {
  const {
    temperatureThresholds = DEFAULT_TEMPERATURE_THRESHOLDS,
    humidityThresholds = DEFAULT_HUMIDITY_THRESHOLDS,
  } = options;

  const reasons: string[] = [];

  // Map temperature
  let temperature: WateringFactors['temperature'];
  if (weatherData.current_temp_celsius < temperatureThresholds.cool) {
    temperature = 'cool';
    reasons.push(`Cool temperature (${formatTemperature(weatherData.current_temp_celsius)}) slows plant metabolism and water use`);
  } else if (weatherData.current_temp_celsius > temperatureThresholds.warm) {
    temperature = 'warm';
    reasons.push(`Warm temperature (${formatTemperature(weatherData.current_temp_celsius)}) increases plant water consumption`);
  } else {
    temperature = 'normal';
    reasons.push(`Comfortable temperature (${formatTemperature(weatherData.current_temp_celsius)}) for most houseplants`);
  }

  // Map humidity
  let humidity: WateringFactors['humidity'];
  if (weatherData.current_humidity_percent < humidityThresholds.dry) {
    humidity = 'dry';
    // Describes the measured weather, not the plant's room — this is outdoor API data.
    reasons.push(`Low humidity (${weatherData.current_humidity_percent}%) increases plant water needs`);
  } else if (weatherData.current_humidity_percent > humidityThresholds.humid) {
    humidity = 'humid';
    reasons.push(`High humidity (${weatherData.current_humidity_percent}%) reduces plant water needs`);
  } else {
    humidity = 'normal';
    reasons.push(`Comfortable humidity (${weatherData.current_humidity_percent}%) for most houseplants`);
  }

  // Map season (already calculated in weather service based on location)
  const season = weatherData.season;
  const seasonDescriptions = {
    winter: 'Winter season - many houseplants enter slower growth and need less water',
    spring: 'Spring season - plants actively grow and need more water',
    summer: 'Summer season - peak growth period with higher water needs',
    fall: 'Fall season - growth slows as days get shorter',
  };
  reasons.push(seasonDescriptions[season]);

  return {
    factors: {
      temperature,
      humidity,
      season,
    },
    weatherSource: weatherData,
    mappingReasons: reasons,
  };
}

/**
 * Get user-friendly weather summary
 */
export function getWeatherSummary(weatherData: WeatherData): string {
  const temp = weatherData.current_temp_celsius;
  const humidity = weatherData.current_humidity_percent;
  const rain = weatherData.upcoming_rain_probability;

  let summary = `${formatTemperature(temp)}, ${humidity}% humidity`;

  if (rain > 70) {
    summary += `, high chance of ${weatherData.is_snowing ? 'snow' : 'rain'} (${rain}%)`;
  } else if (rain > 30) {
    summary += `, possible ${weatherData.is_snowing ? 'snow' : 'rain'} (${rain}%)`;
  }

  return summary;
}

/**
 * Determine if outdoor watering should be delayed due to expected rain
 * Note: This is primarily for outdoor plants, less relevant for indoor gardening
 */
export function shouldDelayWateringForRain(
  weatherData: WeatherData,
  isOutdoorPlant: boolean,
  rainThreshold: number = 60
): {
  shouldDelay: boolean;
  reason?: string;
} {
  // Rain primarily affects outdoor plants, not relevant for indoor plants
  if (!isOutdoorPlant) {
    return { shouldDelay: false };
  }

  if (weatherData.upcoming_rain_probability >= rainThreshold) {
    const precipType = weatherData.is_snowing ? 'Snow' : 'Rain';
    return {
      shouldDelay: true,
      reason: `${precipType} expected (${weatherData.upcoming_rain_probability}% chance) - outdoor watering can be delayed`,
    };
  }

  return { shouldDelay: false };
}

// `getExtremeWeatherAdjustment` and `getDaylightAdjustment` used to live here. They were
// removed rather than deprecated: both returned a single flat day offset, and the former
// early-returned on the first matching condition so a 32 °C day at 15% humidity reported only
// the heat and silently dropped the dryness.
//
// Their replacement is `getWeatherFactors` in `@/utils/watering/scheduleAdjustment`, which
// composes every out-of-range condition, scales with the plant's interval, and bounds the
// combined result.

/**
 * Calculate growing degree days for more precise seasonal adjustments
 * @param weatherData - Current weather data
 * @param baseTemperature - Base temperature for growth (default 10°C for most plants)
 */
export function calculateGrowingDegreeDays(
  weatherData: WeatherData,
  baseTemperature: number = 10
): number {
  const currentTemp = weatherData.current_temp_celsius;
  return Math.max(0, currentTemp - baseTemperature);
}



/**
 * Create fallback weather data for when API is unavailable
 */
export function createFallbackWeatherData(
  season?: WateringFactors['season']
): WeatherData {
  // Season falls back to the canonical detector rather than a local month check, so fallback
  // weather data does not silently assume the northern hemisphere.
  const fallbackSeason =
    season ?? getSeason(new Date(), resolveHemisphereFromEnvironment().hemisphere);

  // Default values based on season
  const seasonDefaults = {
    winter: { temp: 15, humidity: 45, daylight: 9 },
    spring: { temp: 20, humidity: 50, daylight: 12 },
    summer: { temp: 25, humidity: 55, daylight: 15 },
    fall: { temp: 18, humidity: 60, daylight: 11 },
  };

  const defaults = seasonDefaults[fallbackSeason];

  return {
    current_temp_celsius: defaults.temp,
    current_humidity_percent: defaults.humidity,
    season: fallbackSeason,
    daylight_hours: defaults.daylight,
    upcoming_rain_probability: 20, // Conservative default
    is_snowing: false,
    weather_condition: 'Partly Cloudy',
  };
}
