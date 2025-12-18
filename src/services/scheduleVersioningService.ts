import { supabase } from '@/integrations/supabase/client';
import { WeatherData } from './weatherTypes';
import { Season } from './seasonalDetectionService';
import type { Database } from '@/integrations/supabase/types';

type PlantSeasonalSchedule = Database['public']['Tables']['plant_seasonal_schedules']['Row'];
type PlantSeasonalScheduleInsert = Database['public']['Tables']['plant_seasonal_schedules']['Insert'];

export interface SeasonalScheduleSuggestion {
  plant_id: string;
  plant_nickname: string;
  current_watering_days: number;
  suggested_days: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  based_on: 'previous_year' | 'weather_conditions' | 'plant_type' | 'hybrid';
  previous_schedule?: {
    year: number;
    days: number;
    performance: 'good' | 'fair' | 'poor'; // Based on user behavior
  };
}

export interface SchedulePerformanceMetrics {
  schedule_id: string;
  user_satisfaction: 'good' | 'fair' | 'poor';
  watering_frequency_actual: number; // Days between waterings from records
  overwatering_incidents: number;
  user_modifications: number;
}

class ScheduleVersioningService {
  /**
   * Generate seasonal schedule suggestions for all user plants
   */
  async generateSeasonalSuggestions(
    userId: string,
    newSeason: Season,
    weatherConditions: WeatherData
  ): Promise<SeasonalScheduleSuggestion[]> {
    try {
      // Get user's plants
      const { data: plants, error: plantsError } = await supabase
        .from('user_plants')
        .select('*')
        .eq('user_id', userId);

      if (plantsError) throw plantsError;
      if (!plants || plants.length === 0) return [];

      const suggestions: SeasonalScheduleSuggestion[] = [];
      const currentYear = new Date().getFullYear();

      for (const plant of plants) {
        // Check if plant needs review before generating suggestion
        const needsReview = await this.needsSeasonalReview(plant.id, newSeason, currentYear);
        if (!needsReview) {
          continue;
        }

        const suggestion = await this.generatePlantSuggestion(
          plant,
          newSeason,
          currentYear,
          weatherConditions
        );
        
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating seasonal suggestions:', error);
      throw error;
    }
  }

  /**
   * Generate suggestion for a specific plant
   */
  private async generatePlantSuggestion(
    plant: Database['public']['Tables']['user_plants']['Row'],
    season: Season,
    year: number,
    weatherConditions: WeatherData
  ): Promise<SeasonalScheduleSuggestion | null> {
    try {
      // Get historical schedules for this plant and season
      const { data: historicalSchedules, error } = await supabase
        .from('plant_seasonal_schedules')
        .select('*')
        .eq('plant_id', plant.id)
        .eq('season', season)
        .order('year', { ascending: false })
        .limit(3);

      if (error) throw error;

      const currentWateringDays = plant.suggested_watering_days || 7;
      let suggestedDays = currentWateringDays;
      let confidence: 'high' | 'medium' | 'low' = 'low';
      let basedOn: SeasonalScheduleSuggestion['based_on'] = 'weather_conditions';
      const reasoning: string[] = [];
      let previousSchedule: SeasonalScheduleSuggestion['previous_schedule'];

      // Check if we have previous year's data
      const lastYearSchedule = historicalSchedules?.find(s => s.year === year - 1);
      
      if (lastYearSchedule) {
        // Base suggestion on previous year
        suggestedDays = lastYearSchedule.watering_days;
        basedOn = 'previous_year';
        confidence = 'high';
        reasoning.push(`Based on last year's ${season} schedule (${lastYearSchedule.watering_days} days)`);
        
        previousSchedule = {
          year: lastYearSchedule.year,
          days: lastYearSchedule.watering_days,
          performance: await this.evaluateSchedulePerformance(lastYearSchedule.id)
        };

        // Adjust based on performance
        if (previousSchedule.performance === 'poor') {
          suggestedDays = this.adjustForPoorPerformance(suggestedDays, season);
          reasoning.push('Adjusted due to poor performance last year');
          confidence = 'medium';
        }
      } else {
        // No historical data, base on weather and plant type
        suggestedDays = this.calculateWeatherBasedSchedule(
          currentWateringDays,
          season,
          weatherConditions,
          plant.is_outdoor_plant
        );
        basedOn = 'weather_conditions';
        confidence = 'medium';
        reasoning.push(`Adjusted for ${season} weather conditions`);
      }

      // Add plant-specific reasoning
      if (plant.is_outdoor_plant) {
        reasoning.push('Outdoor plant - more sensitive to seasonal changes');
      } else {
        reasoning.push('Indoor plant - less seasonal variation needed');
        // Indoor plants need less dramatic adjustments
        const adjustment = Math.abs(suggestedDays - currentWateringDays);
        if (adjustment > 2) {
          suggestedDays = currentWateringDays + Math.sign(suggestedDays - currentWateringDays) * 2;
          reasoning.push('Limited adjustment for indoor conditions');
        }
      }

      // Weather-specific adjustments
      this.addWeatherReasoningAndAdjustments(
        weatherConditions,
        season,
        reasoning,
        plant.is_outdoor_plant
      );

      // Ensure reasonable bounds
      suggestedDays = Math.max(1, Math.min(21, suggestedDays));

      // Only suggest if there's a meaningful change
      if (Math.abs(suggestedDays - currentWateringDays) < 1) {
        return null;
      }

      return {
        plant_id: plant.id,
        plant_nickname: plant.nickname,
        current_watering_days: currentWateringDays,
        suggested_days: Math.round(suggestedDays),
        confidence,
        reasoning,
        based_on: basedOn,
        previous_schedule: previousSchedule
      };

    } catch (error) {
      console.error(`Error generating suggestion for plant ${plant.id}:`, error);
      return null;
    }
  }

  /**
   * Calculate weather-based watering schedule
   */
  private calculateWeatherBasedSchedule(
    currentDays: number,
    season: Season,
    weather: WeatherData,
    isOutdoor: boolean | null
  ): number {
    let adjustment = 0;
    const baseMultiplier = isOutdoor ? 1.5 : 0.8; // Outdoor plants more affected

    switch (season) {
      case 'spring':
        // Moderate temperature, increasing growth
        adjustment = -1 * baseMultiplier; // Water more frequently
        break;
        
      case 'summer':
        // Hot weather, high evaporation
        if (weather.current_temp_celsius > 25) {
          adjustment = -2 * baseMultiplier; // Much more frequent watering
        } else {
          adjustment = -1 * baseMultiplier;
        }
        
        // Consider humidity
        if (weather.current_humidity_percent < 40) {
          adjustment -= 0.5 * baseMultiplier; // Dry air needs more water
        }
        break;
        
      case 'fall':
        // Cooling down, less evaporation
        adjustment = 1 * baseMultiplier; // Water less frequently
        break;
        
      case 'winter':
        // Cold, dormant period
        adjustment = 2 * baseMultiplier; // Much less frequent watering
        
        // Very cold conditions
        if (weather.current_temp_celsius < 5) {
          adjustment += 1 * baseMultiplier;
        }
        break;
    }

    return currentDays + adjustment;
  }

  /**
   * Add weather-specific reasoning and adjustments
   */
  private addWeatherReasoningAndAdjustments(
    weather: WeatherData,
    season: Season,
    reasoning: string[],
    isOutdoor: boolean | null
  ): void {
    // Temperature considerations
    if (weather.current_temp_celsius > 30) {
      reasoning.push('Very hot weather increases water needs');
    } else if (weather.current_temp_celsius < 5) {
      reasoning.push('Cold weather reduces water needs');
    }

    // Humidity considerations
    if (weather.current_humidity_percent < 30) {
      reasoning.push('Low humidity increases evaporation');
    } else if (weather.current_humidity_percent > 80) {
      reasoning.push('High humidity reduces water needs');
    }

    // Rain considerations
    if (isOutdoor && weather.upcoming_rain_probability > 70) {
      reasoning.push('High rain probability for outdoor plants');
    }

    // Daylight considerations
    if (weather.daylight_hours > 14) {
      reasoning.push('Long daylight hours increase photosynthesis');
    } else if (weather.daylight_hours < 8) {
      reasoning.push('Short daylight hours reduce plant activity');
    }
  }

  /**
   * Adjust schedule for poor performance
   */
  private adjustForPoorPerformance(currentDays: number, season: Season): number {
    // If performance was poor, try the opposite direction
    switch (season) {
      case 'spring':
      case 'summer':
        // If watering was too frequent, increase interval
        return Math.min(currentDays + 2, 14);
      case 'fall':
      case 'winter':
        // If watering was too infrequent, decrease interval
        return Math.max(currentDays - 1, 3);
      default:
        return currentDays;
    }
  }

  /**
   * Evaluate schedule performance based on user behavior
   */
  private async evaluateSchedulePerformance(scheduleId: string): Promise<'good' | 'fair' | 'poor'> {
    try {
      // Get the schedule to find the plant and time period
      const { data: schedule, error: scheduleError } = await supabase
        .from('plant_seasonal_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (scheduleError || !schedule) return 'fair';

      // Get watering records during the period this schedule was active
      const seasonStart = new Date(schedule.year, this.getSeasonStartMonth(schedule.season as Season), 1);
      const seasonEnd = new Date(schedule.year, this.getSeasonStartMonth(schedule.season as Season) + 3, 0);

      const { data: wateringRecords, error: recordsError } = await supabase
        .from('watering_records')
        .select('*')
        .eq('plant_id', schedule.plant_id)
        .gte('watered_at', seasonStart.toISOString())
        .lte('watered_at', seasonEnd.toISOString())
        .order('watered_at');

      if (recordsError || !wateringRecords) return 'fair';

      // Calculate actual watering frequency
      if (wateringRecords.length < 2) return 'fair';

      const intervals = [];
      for (let i = 1; i < wateringRecords.length; i++) {
        const prev = new Date(wateringRecords[i - 1].watered_at);
        const curr = new Date(wateringRecords[i].watered_at);
        const daysBetween = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(daysBetween);
      }

      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const scheduledInterval = schedule.watering_days;

      // Good performance: actual interval close to scheduled
      const deviation = Math.abs(avgInterval - scheduledInterval) / scheduledInterval;
      
      if (deviation < 0.2) return 'good';      // Within 20%
      if (deviation < 0.5) return 'fair';      // Within 50%
      return 'poor';                           // More than 50% deviation

    } catch (error) {
      console.error('Error evaluating schedule performance:', error);
      return 'fair';
    }
  }

  /**
   * Get the starting month for a season (0-based)
   */
  private getSeasonStartMonth(season: Season): number {
    switch (season) {
      case 'spring': return 2;  // March
      case 'summer': return 5;  // June
      case 'fall': return 8;    // September
      case 'winter': return 11; // December
    }
  }

  /**
   * Save a seasonal schedule to the database
   */
  async saveSeasonalSchedule(
    plantId: string,
    season: Season,
    wateringDays: number,
    weatherConditions: WeatherData,
    userModified: boolean = false
  ): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();

      const scheduleData: PlantSeasonalScheduleInsert = {
        plant_id: plantId,
        season,
        watering_days: wateringDays,
        year: currentYear,
        weather_conditions: {
          temperature: weatherConditions.current_temp_celsius,
          humidity: weatherConditions.current_humidity_percent,
          daylight_hours: weatherConditions.daylight_hours,
          season: weatherConditions.season
        },
        user_modified: userModified,
        applied_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('plant_seasonal_schedules')
        .upsert(scheduleData, {
          onConflict: 'plant_id,season,year'
        });

      if (error) throw error;

      // Also update the plant's current watering schedule
      const { error: plantError } = await supabase
        .from('user_plants')
        .update({ 
          suggested_watering_days: wateringDays,
          last_schedule_review: new Date().toISOString()
        })
        .eq('id', plantId);

      if (plantError) throw plantError;

    } catch (error) {
      console.error('Error saving seasonal schedule:', error);
      throw error;
    }
  }

  /**
   * Get schedule history for a plant and season
   */
  async getScheduleHistory(
    plantId: string,
    season: Season
  ): Promise<PlantSeasonalSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('plant_seasonal_schedules')
        .select('*')
        .eq('plant_id', plantId)
        .eq('season', season)
        .order('year', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting schedule history:', error);
      throw error;
    }
  }

  /**
   * Get all seasonal schedules for a user's plants
   */
  async getUserSeasonalSchedules(userId: string): Promise<PlantSeasonalSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('plant_seasonal_schedules')
        .select(`
          *,
          user_plants!inner(user_id, nickname, plant_type)
        `)
        .eq('user_plants.user_id', userId)
        .order('year', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user seasonal schedules:', error);
      throw error;
    }
  }

  /**
   * Check if a plant needs seasonal review
   */
  async needsSeasonalReview(
    plantId: string,
    currentSeason: Season,
    currentYear: number
  ): Promise<boolean> {
    try {
      // Check if there's already a schedule for this season/year
      const { data: existingSchedule, error } = await supabase
        .from('plant_seasonal_schedules')
        .select('id')
        .eq('plant_id', plantId)
        .eq('season', currentSeason)
        .eq('year', currentYear)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      
      // If no schedule exists for this season/year, needs review
      return !existingSchedule;
    } catch (error) {
      console.error('Error checking if plant needs review:', error);
      return false;
    }
  }

  /**
   * Mark plants as reviewed for a season
   */
  async markPlantsReviewed(plantIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_plants')
        .update({ last_schedule_review: new Date().toISOString() })
        .in('id', plantIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking plants as reviewed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const scheduleVersioningService = new ScheduleVersioningService();
export default scheduleVersioningService;
