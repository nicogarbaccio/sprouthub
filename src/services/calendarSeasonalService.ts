/**
 * Calendar-based seasonal detection service
 *
 * This service provides seasonal change notifications based purely on calendar dates,
 * without requiring weather data or API access. It's designed to work for all users
 * regardless of whether they have weather features enabled.
 */

export type Season = 'winter' | 'spring' | 'summer' | 'fall';

export interface SeasonalDate {
  month: number; // 0-11 (JavaScript Date month)
  day: number;   // 1-31
}

export interface UpcomingSeasonChange {
  currentSeason: Season;
  nextSeason: Season;
  changeDate: Date;
  daysUntilChange: number;
  shouldNotify: boolean; // True if within notification window
}

export interface SeasonalAdjustmentSuggestion {
  season: Season;
  adjustmentDays: number;
  direction: 'increase' | 'decrease' | 'maintain';
  reasoning: string;
}

class CalendarSeasonalService {
  // Northern Hemisphere season start dates
  private readonly NORTHERN_SEASONS: Record<Season, SeasonalDate> = {
    spring: { month: 2, day: 20 },   // March 20
    summer: { month: 5, day: 21 },   // June 21
    fall: { month: 8, day: 22 },     // September 22
    winter: { month: 11, day: 21 },  // December 21
  };

  // Number of days before season change to show notification
  private readonly NOTIFICATION_WINDOW_DAYS = 7;

  /**
   * Get the current calendar-based season for a given location
   */
  getCurrentSeason(latitude: number, date: Date = new Date()): Season {
    const isNorthern = latitude >= 0;
    const month = date.getMonth();
    const day = date.getDate();

    // Determine season based on calendar dates
    let season: Season;

    // Spring: Mar 20 - Jun 20
    if ((month === 2 && day >= 20) || month === 3 || month === 4 || (month === 5 && day < 21)) {
      season = 'spring';
    }
    // Summer: Jun 21 - Sep 21
    else if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day < 22)) {
      season = 'summer';
    }
    // Fall: Sep 22 - Dec 20
    else if ((month === 8 && day >= 22) || month === 9 || month === 10 || (month === 11 && day < 21)) {
      season = 'fall';
    }
    // Winter: Dec 21 - Mar 19
    else {
      season = 'winter';
    }

    // Flip seasons for Southern Hemisphere
    if (!isNorthern) {
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

  /**
   * Calculate the date of the next season change
   */
  private getNextSeasonChangeDate(latitude: number, fromDate: Date = new Date()): { date: Date; season: Season } {
    const isNorthern = latitude >= 0;
    const year = fromDate.getFullYear();
    // Get season dates (use Northern or flip for Southern)
    const seasonDates = isNorthern
      ? this.NORTHERN_SEASONS
      : {
          spring: this.NORTHERN_SEASONS.fall,
          summer: this.NORTHERN_SEASONS.winter,
          fall: this.NORTHERN_SEASONS.spring,
          winter: this.NORTHERN_SEASONS.summer,
        };

    // Check each season start date to find the next one
    const seasons: Season[] = ['spring', 'summer', 'fall', 'winter'];

    for (const season of seasons) {
      const seasonDate = seasonDates[season];
      const thisYearDate = new Date(year, seasonDate.month, seasonDate.day);

      // If this season's date is in the future this year, use it
      if (thisYearDate > fromDate) {
        return { date: thisYearDate, season };
      }
    }

    // If we're past all season changes this year, use the first one next year
    const firstSeason = seasons[0];
    const nextYearDate = new Date(
      year + 1,
      seasonDates[firstSeason].month,
      seasonDates[firstSeason].day
    );

    return { date: nextYearDate, season: firstSeason };
  }

  /**
   * Check if there's an upcoming season change within the notification window
   */
  checkUpcomingSeasonChange(latitude: number, currentDate: Date = new Date()): UpcomingSeasonChange | null {
    const currentSeason = this.getCurrentSeason(latitude, currentDate);
    const { date: changeDate, season: nextSeason } = this.getNextSeasonChangeDate(latitude, currentDate);

    const daysUntilChange = Math.ceil((changeDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const shouldNotify = daysUntilChange > 0 && daysUntilChange <= this.NOTIFICATION_WINDOW_DAYS;

    return {
      currentSeason,
      nextSeason,
      changeDate,
      daysUntilChange,
      shouldNotify,
    };
  }

  /**
   * Get seasonal adjustment suggestion based on plant characteristics
   */
  getSeasonalAdjustment(
    currentScheduleDays: number,
    targetSeason: Season,
    plantType: string,
    isOutdoor: boolean
  ): SeasonalAdjustmentSuggestion {
    // Base adjustment multiplier for indoor vs outdoor
    const multiplier = isOutdoor ? 1.5 : 1.0;

    // Get base adjustment for season
    let baseAdjustment = 0;
    let reasoning = '';
    switch (targetSeason) {
      case 'spring':
        baseAdjustment = -1;
        reasoning = 'Spring brings active growth and warmer temperatures, requiring more frequent watering';
        break;
      case 'summer':
        baseAdjustment = -2;
        reasoning = 'Summer heat and longer days increase water needs significantly';
        break;
      case 'fall':
        baseAdjustment = 1;
        reasoning = 'Fall brings cooler temperatures and less evaporation, so soil stays moist longer';
        break;
      case 'winter':
        baseAdjustment = 2;
        reasoning = 'Winter dormancy and reduced light mean plants need much less water';
        break;
    }

    // Adjust for plant type
    const lowerPlantType = plantType.toLowerCase();

    if (lowerPlantType.includes('succulent') || lowerPlantType.includes('cactus')) {
      baseAdjustment *= 0.5; // Less dramatic changes for drought-tolerant plants
      reasoning += '. Succulents need minimal adjustment';
    } else if (lowerPlantType.includes('tropical') || lowerPlantType.includes('fern')) {
      baseAdjustment *= 1.3; // More sensitive to seasonal changes
      reasoning += '. Tropical plants are more sensitive to seasonal changes';
    }

    // Apply indoor/outdoor multiplier
    const adjustmentDays = Math.round(baseAdjustment * multiplier);

    // Add outdoor context to reasoning
    if (isOutdoor) {
      reasoning += '. Outdoor plants experience more dramatic seasonal changes';
    } else {
      reasoning += '. Indoor plants need gentler adjustments';
    }

    // Ensure we don't suggest going below 1 day or above 45 days
    const suggestedDays = Math.max(1, Math.min(45, currentScheduleDays + adjustmentDays));
    const actualAdjustment = suggestedDays - currentScheduleDays;

    return {
      season: targetSeason,
      adjustmentDays: actualAdjustment,
      direction: actualAdjustment < 0 ? 'decrease' : actualAdjustment > 0 ? 'increase' : 'maintain',
      reasoning,
    };
  }

  /**
   * Get a user-friendly description of the season change
   */
  getSeasonChangeDescription(nextSeason: Season, daysUntilChange: number): string {
    const seasonEmoji: Record<Season, string> = {
      spring: '🌸',
      summer: '☀️',
      fall: '🍂',
      winter: '❄️',
    };

    const seasonName = nextSeason.charAt(0).toUpperCase() + nextSeason.slice(1);
    const emoji = seasonEmoji[nextSeason];

    if (daysUntilChange === 0) {
      return `${emoji} ${seasonName} begins today!`;
    } else if (daysUntilChange === 1) {
      return `${emoji} ${seasonName} starts tomorrow`;
    } else {
      return `${emoji} ${seasonName} starts in ${daysUntilChange} days`;
    }
  }

  /**
   * Get general seasonal watering guidance
   */
  getSeasonalGuidance(season: Season): string {
    const guidance: Record<Season, string> = {
      spring: 'As we transition to spring, most plants need more frequent watering due to active growth and warming temperatures.',
      summer: 'Summer heat and longer daylight hours mean most plants need much more frequent watering.',
      fall: 'As we transition to fall, most plants need less frequent watering as temperatures cool and growth slows.',
      winter: 'Winter dormancy and reduced light mean most plants need much less frequent watering.',
    };

    return guidance[season];
  }
}

// Export singleton instance
export const calendarSeasonalService = new CalendarSeasonalService();
export default calendarSeasonalService;
