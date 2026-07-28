import { getSeason, resolveHemisphereFromEnvironment } from '@/utils/season';
import { clampWateringInterval } from './bounds';
import { getSeasonalFactor } from './scheduleAdjustment';

export interface WateringFactors {
  plantSize: 'small' | 'medium' | 'large';
  lightLevel: 'low' | 'medium' | 'high';
  temperature: 'cool' | 'normal' | 'warm';
  humidity: 'dry' | 'normal' | 'humid';
  season: 'winter' | 'spring' | 'summer' | 'fall';
  careStyle: 'frequent' | 'balanced' | 'minimal';
  soilType: 'regular' | 'draining' | 'retaining';
}

export interface SmartScheduleResult {
  recommendedDays: number;
  baseDays: number;
  adjustmentReasons: string[];
  totalAdjustment: number;
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Calculates a smart watering schedule based on plant and environmental factors
 * @param baseDays - The base watering schedule from plant catalog
 * @param factors - Environmental and care factors
 * @returns SmartScheduleResult with recommended schedule and explanations
 */
export const calculateSmartWateringSchedule = (
  baseDays: number,
  factors: WateringFactors,
  /**
   * Optional plant context. Supplying it lets the seasonal component apply the same
   * drought-tolerance, moisture-sensitivity and outdoor modifiers the seasonal banner uses.
   * Omitting it yields the neutral indoor case.
   */
  plantContext: { plantType?: string; isOutdoor?: boolean } = {}
): SmartScheduleResult => {
  let adjustment = 0;
  const reasons: string[] = [];

  // Plant size adjustments (affects how much water the plant can store)
  switch (factors.plantSize) {
    case 'small':
      adjustment -= 1;
      reasons.push('Small plants have less soil volume and dry out faster');
      break;
    case 'large':
      adjustment += 2;
      reasons.push('Large plants have more soil volume and retain moisture longer');
      break;
    case 'medium':
      // No adjustment - baseline
      break;
  }

  // Light level adjustments (affects photosynthesis and water consumption)
  switch (factors.lightLevel) {
    case 'high':
      adjustment -= 1;
      reasons.push('High light increases photosynthesis and water evaporation');
      break;
    case 'low':
      adjustment += 1;
      reasons.push('Low light reduces plant metabolism and water consumption');
      break;
    case 'medium':
      // No adjustment - baseline
      break;
  }

  // Temperature effects (affects evaporation rate)
  switch (factors.temperature) {
    case 'warm':
      adjustment -= 1;
      reasons.push('Warm temperatures increase evaporation rate');
      break;
    case 'cool':
      adjustment += 1;
      reasons.push('Cool temperatures slow down water evaporation');
      break;
    case 'normal':
      // No adjustment - baseline
      break;
  }

  // Humidity effects (affects transpiration rate)
  switch (factors.humidity) {
    case 'dry':
      adjustment -= 2;
      reasons.push('Dry air increases water loss through transpiration');
      break;
    case 'humid':
      adjustment += 1;
      reasons.push('High humidity reduces water loss');
      break;
    case 'normal':
      // No adjustment - baseline
      break;
  }

  // Seasonal adjustment — delegated to the canonical percentage-based model so the wizard
  // cannot recommend a different interval than the seasonal banner for the same plant and
  // season. This used to be a flat offset table (winter +3, summer -1, fall +1), which meant a
  // 3-day fern and a 45-day Lithops received the same absolute nudge.
  const seasonalFactor = getSeasonalFactor(
    {
      currentScheduleDays: baseDays,
      plantType: plantContext.plantType ?? '',
      isOutdoor: plantContext.isOutdoor ?? false,
    },
    factors.season
  );
  adjustment += seasonalFactor.days;
  reasons.push(seasonalFactor.reason);

  // Care style preferences (user behavior adaptation)
  switch (factors.careStyle) {
    case 'frequent':
      adjustment -= 1;
      reasons.push('Adjusted for hands-on care preference');
      break;
    case 'minimal':
      adjustment += 1;
      reasons.push('Adjusted for low-maintenance care style');
      break;
    case 'balanced':
      // No adjustment - baseline
      break;
  }

  // Soil type effects (affects drainage and moisture retention)
  switch (factors.soilType) {
    case 'draining':
      adjustment -= 1;
      reasons.push('Well-draining soil dries out faster');
      break;
    case 'retaining':
      adjustment += 2;
      reasons.push('Moisture-retaining soil stays wet longer');
      break;
    case 'regular':
      // No adjustment - baseline
      break;
  }

  // Single shared clamp. The previous 45-day ceiling here contradicted both pattern analysis
  // (which allows up to 90) and the catalog, which ships Lithops at exactly 45.
  const recommendedDays = clampWateringInterval(baseDays + adjustment);

  // Determine confidence based on adjustment magnitude
  let confidence: 'low' | 'medium' | 'high';
  const adjustmentMagnitude = Math.abs(adjustment);
  if (adjustmentMagnitude <= 2) {
    confidence = 'high';
  } else if (adjustmentMagnitude <= 4) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    recommendedDays,
    baseDays,
    adjustmentReasons: reasons,
    totalAdjustment: adjustment,
    confidence
  };
};

/**
 * Get the current season for use as a wizard default.
 *
 * Resolves hemisphere from the environment (browser timezone) so a southern-hemisphere user
 * is not pre-filled with the wrong season. This previously derived the season from the month
 * with no hemisphere handling at all, which meant the wizard and the fertilization gate could
 * directly contradict each other for the same user on the same day.
 *
 * Prefer passing an explicitly resolved season where the caller knows the user's latitude.
 */
export const getCurrentSeason = (): WateringFactors['season'] => {
  const { hemisphere } = resolveHemisphereFromEnvironment();
  return getSeason(new Date(), hemisphere);
};

/**
 * Get user-friendly labels for factor options
 */
export const getFactorLabels = () => ({
  plantSize: {
    small: 'Small (up to 6")',
    medium: 'Medium (6" to 2 feet)',
    large: 'Large (2+ feet)'
  },
  lightLevel: {
    low: 'Low Light (North windows, far from windows)',
    medium: 'Medium Light (East/West windows, filtered)',
    high: 'High Light (South windows, direct sun)'
  },
  temperature: {
    cool: 'Cool (60-70°F)',
    normal: 'Normal (70-75°F)',
    warm: 'Warm (75°F+)'
  },
  humidity: {
    dry: 'Dry (< 40%)',
    normal: 'Normal (40-60%)',
    humid: 'Humid (60%+)'
  },
  season: {
    winter: 'Winter (Dormant period)',
    spring: 'Spring (Active growth)',
    summer: 'Summer (Peak growth)',
    fall: 'Fall (Slowing growth)'
  },
  careStyle: {
    frequent: 'I like to check plants frequently',
    balanced: 'I prefer a balanced care routine',
    minimal: 'I want low-maintenance schedules'
  },
  soilType: {
    regular: 'Regular potting mix',
    draining: 'Well-draining/succulent mix',
    retaining: 'Moisture-retaining mix'
  }
}); 