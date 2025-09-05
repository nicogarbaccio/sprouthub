import { WeatherData } from '@/services/weatherTypes';
import { shouldDelayWateringForRain } from '@/utils/weatherMapping';

export interface RainDelayResult {
  shouldDelay: boolean;
  delayReason?: string;
  recommendedDelayDays?: number;
  nextCheckDate?: Date;
}

export interface RainDelayOptions {
  rainThreshold?: number; // Minimum rain probability to trigger delay (default: 60%)
  maxDelayDays?: number; // Maximum days to delay watering (default: 3)
  isOutdoorPlant?: boolean; // Whether the plant is outdoors
}

/**
 * Determine if watering should be delayed due to expected rain
 * @param weatherData - Current weather data including rain forecast
 * @param options - Configuration options for rain delay logic
 * @returns Rain delay decision with reasoning
 */
export function calculateRainDelay(
  weatherData: WeatherData | null,
  options: RainDelayOptions = {}
): RainDelayResult {
  const {
    rainThreshold = 60,
    maxDelayDays = 3,
    isOutdoorPlant = false,
  } = options;

  // No delay if no weather data or not an outdoor plant
  if (!weatherData || !isOutdoorPlant) {
    return { shouldDelay: false };
  }

  const rainDelayCheck = shouldDelayWateringForRain(
    weatherData,
    isOutdoorPlant,
    rainThreshold
  );

  if (rainDelayCheck.shouldDelay) {
    // Calculate recommended delay (1-3 days based on rain probability)
    let delayDays = 1;
    if (weatherData.upcoming_rain_probability >= 80) {
      delayDays = 3;
    } else if (weatherData.upcoming_rain_probability >= 70) {
      delayDays = 2;
    }

    delayDays = Math.min(delayDays, maxDelayDays);

    const nextCheckDate = new Date();
    nextCheckDate.setDate(nextCheckDate.getDate() + delayDays);

    return {
      shouldDelay: true,
      delayReason: rainDelayCheck.reason,
      recommendedDelayDays: delayDays,
      nextCheckDate,
    };
  }

  return { shouldDelay: false };
}

/**
 * Get a user-friendly message explaining the rain delay
 */
export function getRainDelayMessage(
  delayResult: RainDelayResult,
  plantName?: string
): string {
  if (!delayResult.shouldDelay) {
    return '';
  }

  const plantRef = plantName ? `${plantName}` : 'your outdoor plant';
  const delayDays = delayResult.recommendedDelayDays || 1;
  const dayText = delayDays === 1 ? 'day' : 'days';

  return `💧 Watering ${plantRef} can be delayed for ${delayDays} ${dayText} due to expected rain. Check again ${delayResult.nextCheckDate?.toLocaleDateString() || 'soon'}.`;
}

/**
 * Check if a plant should show rain delay notification
 */
export function shouldShowRainDelayNotification(
  weatherData: WeatherData | null,
  isOutdoorPlant: boolean,
  daysSinceWatering: number,
  normalWateringInterval: number
): boolean {
  if (!isOutdoorPlant || !weatherData) {
    return false;
  }

  // Only show if the plant is due for watering (within 1 day of schedule)
  const isDue = daysSinceWatering >= (normalWateringInterval - 1);
  
  if (!isDue) {
    return false;
  }

  const delayResult = calculateRainDelay(weatherData, { isOutdoorPlant: true });
  return delayResult.shouldDelay;
}

/**
 * Get rain delay status for multiple plants
 */
export function getBulkRainDelayStatus(
  plants: Array<{
    id: string;
    nickname: string;
    is_outdoor_plant?: boolean;
    days_since_watering?: number;
    suggested_watering_days?: number;
  }>,
  weatherData: WeatherData | null
): Array<{
  plantId: string;
  plantName: string;
  shouldDelay: boolean;
  delayResult: RainDelayResult;
  message?: string;
}> {
  return plants.map(plant => {
    const isOutdoor = plant.is_outdoor_plant || false;
    const delayResult = calculateRainDelay(weatherData, { isOutdoorPlant: isOutdoor });
    
    return {
      plantId: plant.id,
      plantName: plant.nickname,
      shouldDelay: delayResult.shouldDelay,
      delayResult,
      message: delayResult.shouldDelay 
        ? getRainDelayMessage(delayResult, plant.nickname)
        : undefined,
    };
  });
}

/**
 * Calculate adjusted watering schedule considering rain delays
 */
export function getAdjustedWateringSchedule(
  baseDays: number,
  weatherData: WeatherData | null,
  isOutdoorPlant: boolean = false
): {
  adjustedDays: number;
  hasRainAdjustment: boolean;
  rainAdjustmentReason?: string;
} {
  if (!isOutdoorPlant || !weatherData) {
    return {
      adjustedDays: baseDays,
      hasRainAdjustment: false,
    };
  }

  const delayResult = calculateRainDelay(weatherData, { isOutdoorPlant });
  
  if (delayResult.shouldDelay && delayResult.recommendedDelayDays) {
    return {
      adjustedDays: baseDays + delayResult.recommendedDelayDays,
      hasRainAdjustment: true,
      rainAdjustmentReason: delayResult.delayReason,
    };
  }

  return {
    adjustedDays: baseDays,
    hasRainAdjustment: false,
  };
}
