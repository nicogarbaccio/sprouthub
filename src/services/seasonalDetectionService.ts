import { WeatherData, LocationData } from './weatherTypes';
import { weatherService } from './weatherService';

export type Season = 'winter' | 'spring' | 'summer' | 'fall';

export interface SeasonalTransition {
  from_season: Season;
  to_season: Season;
  transition_date: Date;
  confidence: 'high' | 'medium' | 'low';
  triggering_factors: string[];
}

export interface SeasonDetectionCriteria {
  daylight_hours: number;
  avg_temperature_7day: number;
  temperature_trend: 'rising' | 'falling' | 'stable';
  humidity_change: number;
  location: LocationData;
}

interface WeatherHistoryEntry {
  date: Date;
  weather: WeatherData;
}

class SeasonalDetectionService {
  private readonly STORAGE_KEY = 'sprouthub_weather_history';
  private readonly MAX_HISTORY_DAYS = 30;
  private readonly TRANSITION_STABILITY_DAYS = 14; // Wait 2 weeks after detection

  /**
   * Main method to detect seasonal transitions
   */
  async detectSeasonalTransition(
    currentSeason: Season,
    location: LocationData
  ): Promise<SeasonalTransition | null> {
    try {
      // Get current weather and build criteria
      const currentWeather = await weatherService.getCurrentWeather(location);
      const weatherHistory = this.getWeatherHistory();
      
      if (weatherHistory.length < 7) {
        // Need at least 7 days of data for reliable detection
        return null;
      }

      const criteria = this.buildSeasonDetectionCriteria(currentWeather, weatherHistory, location);
      
      // Check for each possible transition
      const transitions = [
        this.detectSpringOnset(criteria, currentSeason),
        this.detectSummerOnset(criteria, currentSeason),
        this.detectFallOnset(criteria, currentSeason),
        this.detectWinterOnset(criteria, currentSeason)
      ].filter(Boolean) as SeasonalTransition[];

      if (transitions.length === 0) {
        return null;
      }

      // Return the transition with highest confidence
      return transitions.reduce((best, current) => 
        this.getConfidenceScore(current.confidence) > this.getConfidenceScore(best.confidence) 
          ? current 
          : best
      );

    } catch (error) {
      console.error('Error detecting seasonal transition:', error);
      return null;
    }
  }

  /**
   * Detect spring onset
   */
  private detectSpringOnset(
    criteria: SeasonDetectionCriteria,
    currentSeason: Season
  ): SeasonalTransition | null {
    if (currentSeason !== 'winter') return null;

    const factors: string[] = [];
    let confidence: SeasonalTransition['confidence'] = 'low';

    // Daylight hours increasing and > 12 hours
    if (criteria.daylight_hours > 12) {
      factors.push('Daylight hours exceeding 12 hours');
      confidence = 'medium';
    }

    // Temperature rising and consistently above 15°C (59°F)
    if (criteria.avg_temperature_7day > 15 && criteria.temperature_trend === 'rising') {
      factors.push('Temperature consistently above 15°C with rising trend');
      confidence = 'high';
    }

    // Additional spring indicators
    if (criteria.avg_temperature_7day > 10 && criteria.temperature_trend === 'rising') {
      factors.push('Temperature above 10°C with warming trend');
    }

    if (factors.length >= 2) {
      return {
        from_season: 'winter',
        to_season: 'spring',
        transition_date: new Date(),
        confidence,
        triggering_factors: factors
      };
    }

    return null;
  }

  /**
   * Detect summer onset
   */
  private detectSummerOnset(
    criteria: SeasonDetectionCriteria,
    currentSeason: Season
  ): SeasonalTransition | null {
    if (currentSeason !== 'spring') return null;

    const factors: string[] = [];
    let confidence: SeasonalTransition['confidence'] = 'low';

    // High temperature threshold
    if (criteria.avg_temperature_7day > 24) {
      factors.push('Temperature consistently above 24°C');
      confidence = 'high';
    }

    // Long daylight hours
    if (criteria.daylight_hours > 14) {
      factors.push('Daylight hours exceeding 14 hours');
      confidence = confidence === 'high' ? 'high' : 'medium';
    }

    // Heat consistency - no cold snaps
    const recentHistory = this.getWeatherHistory().slice(-7);
    const hasColSnap = recentHistory.some(entry => entry.weather.current_temp_celsius < 18);
    
    if (!hasColSnap && criteria.avg_temperature_7day > 20) {
      factors.push('No cold snaps below 18°C in past week');
    }

    if (factors.length >= 2) {
      return {
        from_season: 'spring',
        to_season: 'summer',
        transition_date: new Date(),
        confidence,
        triggering_factors: factors
      };
    }

    return null;
  }

  /**
   * Detect fall onset
   */
  private detectFallOnset(
    criteria: SeasonDetectionCriteria,
    currentSeason: Season
  ): SeasonalTransition | null {
    if (currentSeason !== 'summer') return null;

    const factors: string[] = [];
    let confidence: SeasonalTransition['confidence'] = 'low';

    // Daylight hours decreasing and < 12 hours
    if (criteria.daylight_hours < 12) {
      factors.push('Daylight hours below 12 hours');
      confidence = 'medium';
    }

    // Temperature falling and below 18°C
    if (criteria.avg_temperature_7day < 18 && criteria.temperature_trend === 'falling') {
      factors.push('Temperature below 18°C with falling trend');
      confidence = 'high';
    }

    // Significant cooling from summer peak
    const summerPeak = this.getSummerPeakTemperature();
    if (summerPeak && (summerPeak - criteria.avg_temperature_7day) > 8) {
      factors.push(`Temperature dropped ${Math.round(summerPeak - criteria.avg_temperature_7day)}°C from summer peak`);
    }

    if (factors.length >= 2) {
      return {
        from_season: 'summer',
        to_season: 'fall',
        transition_date: new Date(),
        confidence,
        triggering_factors: factors
      };
    }

    return null;
  }

  /**
   * Detect winter onset
   */
  private detectWinterOnset(
    criteria: SeasonDetectionCriteria,
    currentSeason: Season
  ): SeasonalTransition | null {
    if (currentSeason !== 'fall') return null;

    const factors: string[] = [];
    let confidence: SeasonalTransition['confidence'] = 'low';

    // Low temperature threshold
    if (criteria.avg_temperature_7day < 10) {
      factors.push('Temperature consistently below 10°C');
      confidence = 'high';
    }

    // Short daylight hours
    if (criteria.daylight_hours < 10) {
      factors.push('Daylight hours below 10 hours');
      confidence = confidence === 'high' ? 'high' : 'medium';
    }

    // Sustained cold - no warm days
    const recentHistory = this.getWeatherHistory().slice(-7);
    const hasWarmDay = recentHistory.some(entry => entry.weather.current_temp_celsius > 15);
    
    if (!hasWarmDay && criteria.avg_temperature_7day < 12) {
      factors.push('No warm days above 15°C in past week');
    }

    if (factors.length >= 2) {
      return {
        from_season: 'fall',
        to_season: 'winter',
        transition_date: new Date(),
        confidence,
        triggering_factors: factors
      };
    }

    return null;
  }

  /**
   * Build criteria for season detection
   */
  private buildSeasonDetectionCriteria(
    currentWeather: WeatherData,
    history: WeatherHistoryEntry[],
    location: LocationData
  ): SeasonDetectionCriteria {
    // Calculate 7-day average temperature
    const recent7Days = history.slice(-7);
    const avg_temperature_7day = recent7Days.reduce(
      (sum, entry) => sum + entry.weather.current_temp_celsius, 
      0
    ) / recent7Days.length;

    // Calculate temperature trend
    const first3Days = recent7Days.slice(0, 3);
    const last3Days = recent7Days.slice(-3);
    
    const first3Avg = first3Days.reduce((sum, entry) => sum + entry.weather.current_temp_celsius, 0) / first3Days.length;
    const last3Avg = last3Days.reduce((sum, entry) => sum + entry.weather.current_temp_celsius, 0) / last3Days.length;
    
    const tempDiff = last3Avg - first3Avg;
    let temperature_trend: 'rising' | 'falling' | 'stable';
    
    if (tempDiff > 2) {
      temperature_trend = 'rising';
    } else if (tempDiff < -2) {
      temperature_trend = 'falling';
    } else {
      temperature_trend = 'stable';
    }

    // Calculate humidity change
    const humidity_change = recent7Days.length > 1 
      ? recent7Days[recent7Days.length - 1].weather.current_humidity_percent - recent7Days[0].weather.current_humidity_percent
      : 0;

    return {
      daylight_hours: currentWeather.daylight_hours,
      avg_temperature_7day,
      temperature_trend,
      humidity_change,
      location
    };
  }

  /**
   * Store weather data for historical analysis
   */
  async storeWeatherData(weather: WeatherData): Promise<void> {
    try {
      const history = this.getWeatherHistory();
      const newEntry: WeatherHistoryEntry = {
        date: new Date(),
        weather
      };

      // Add new entry and limit to MAX_HISTORY_DAYS
      history.push(newEntry);
      const limitedHistory = history.slice(-this.MAX_HISTORY_DAYS);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.warn('Failed to store weather history:', error);
    }
  }

  /**
   * Get stored weather history
   */
  private getWeatherHistory(): WeatherHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const history = JSON.parse(stored) as Array<{
        date: string;
        weather: WeatherData;
      }>;

      return history.map(entry => ({
        date: new Date(entry.date),
        weather: entry.weather
      }));
    } catch (error) {
      console.warn('Failed to load weather history:', error);
      return [];
    }
  }

  /**
   * Get summer peak temperature from history
   */
  private getSummerPeakTemperature(): number | null {
    const history = this.getWeatherHistory();
    if (history.length === 0) return null;

    // Look for peak in last 90 days
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

    const recentHistory = history.filter(entry => entry.date >= threeMonthsAgo);
    if (recentHistory.length === 0) return null;

    return Math.max(...recentHistory.map(entry => entry.weather.current_temp_celsius));
  }

  /**
   * Convert confidence level to numeric score for comparison
   */
  private getConfidenceScore(confidence: SeasonalTransition['confidence']): number {
    switch (confidence) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Check if enough time has passed since transition for stability
   */
  isTransitionStable(transitionDate: Date): boolean {
    const daysSinceTransition = Math.floor(
      (Date.now() - transitionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceTransition >= this.TRANSITION_STABILITY_DAYS;
  }

  /**
   * Clear weather history (useful for testing or reset)
   */
  clearWeatherHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get current season based on calendar and location
   */
  getCurrentSeason(location: LocationData): Season {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const isNorthernHemisphere = location.latitude >= 0;

    let season: Season;
    
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
      const seasonMap: Record<Season, Season> = {
        spring: 'fall',
        summer: 'winter',
        fall: 'spring',
        winter: 'summer',
      };
      season = seasonMap[season];
    }

    return season;
  }
}

// Export singleton instance
export const seasonalDetectionService = new SeasonalDetectionService();
export default seasonalDetectionService;
