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
 factors: WateringFactors
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
 
 // Seasonal adjustments (affects growth cycles)
 switch (factors.season) {
 case 'winter':
  adjustment += 3;
  reasons.push('Winter dormancy significantly reduces water needs');
  break;
 case 'summer':
  adjustment -= 1;
  reasons.push('Summer growth phase increases water consumption');
  break;
 case 'spring':
  // Active growing season but moderate
  break;
 case 'fall':
  adjustment += 1;
  reasons.push('Fall season begins to slow plant metabolism');
  break;
 }
 
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
 
 // Calculate final recommendation with bounds
 const recommendedDays = Math.max(2, Math.min(45, baseDays + adjustment));
 
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
 * Get current season based on current date
 * @returns Current season
 */
export const getCurrentSeason = (): WateringFactors['season'] => {
 const month = new Date().getMonth() + 1; // 1-12
 
 if (month >= 3 && month <= 5) return 'spring';
 if (month >= 6 && month <= 8) return 'summer';
 if (month >= 9 && month <= 11) return 'fall';
 return 'winter';
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