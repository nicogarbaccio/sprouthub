/**
 * Calendar-based seasonal notifications.
 *
 * This service handles the *notification* concerns of seasonal change: when to surface a
 * banner, how to describe the upcoming season, and what guidance copy to show.
 *
 * It no longer implements season detection or schedule adjustment. Those now live in
 * `@/utils/season` and `@/utils/watering/scheduleAdjustment` respectively, so that the
 * watering wizard, the weather-based suggestion path, and the fertilization gate all resolve
 * through the same logic instead of three competing copies.
 */

import {
  getSeason,
  getNextSeasonChange,
  resolveHemisphere,
  formatSeasonName,
  type Season,
} from '@/utils/season';
import {
  calculateScheduleAdjustment,
  type PlantAdjustmentContext,
} from '@/utils/watering/scheduleAdjustment';

export type { Season };

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
  // Number of days before season change to show notification
  private readonly NOTIFICATION_WINDOW_DAYS = 7;

  /**
   * Get the current calendar-based season for a given latitude.
   *
   * Thin wrapper over the canonical season module, kept so existing latitude-based callers
   * keep working. New code should call `getSeason` or `getSeasonForLocation` from
   * `@/utils/season` directly, since those accept a resolved hemisphere and therefore cannot
   * silently assume northern.
   */
  getCurrentSeason(latitude: number, date: Date = new Date()): Season {
    const { hemisphere } = resolveHemisphere({ latitude });
    return getSeason(date, hemisphere);
  }

  /**
   * Check if there's an upcoming season change within the notification window
   */
  checkUpcomingSeasonChange(
    latitude: number,
    currentDate: Date = new Date()
  ): UpcomingSeasonChange | null {
    const { hemisphere } = resolveHemisphere({ latitude });
    const currentSeason = getSeason(currentDate, hemisphere);
    const { date: changeDate, season: nextSeason } = getNextSeasonChange(
      currentDate,
      hemisphere
    );

    const daysUntilChange = Math.ceil(
      (changeDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const shouldNotify =
      daysUntilChange > 0 && daysUntilChange <= this.NOTIFICATION_WINDOW_DAYS;

    return {
      currentSeason,
      nextSeason,
      changeDate,
      daysUntilChange,
      shouldNotify,
    };
  }

  /**
   * Get a seasonal adjustment suggestion for a plant.
   *
   * Delegates to the canonical percentage-based model. See
   * `@/utils/watering/scheduleAdjustment` for why adjustments are proportional rather than
   * flat day offsets, and for the shared 2–90 day clamp.
   */
  getSeasonalAdjustment(
    currentScheduleDays: number,
    targetSeason: Season,
    plantType: string,
    isOutdoor: boolean
  ): SeasonalAdjustmentSuggestion {
    const context: PlantAdjustmentContext = {
      currentScheduleDays,
      plantType,
      isOutdoor,
    };

    const result = calculateScheduleAdjustment(context, { season: targetSeason });

    return {
      season: targetSeason,
      adjustmentDays: result.adjustmentDays,
      direction: result.direction,
      // The seasonal factor is the only one requested here, so its reason is the whole story.
      reasoning: result.reasoning.join('. '),
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

    const seasonName = formatSeasonName(nextSeason);
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
      spring:
        'As we transition to spring, most plants need more frequent watering due to active growth and warming temperatures.',
      summer:
        'Summer heat and longer daylight hours mean most plants need much more frequent watering.',
      fall: 'As we transition to fall, most plants need less frequent watering as temperatures cool and growth slows.',
      winter:
        'Winter dormancy and reduced light mean most plants need much less frequent watering.',
    };

    return guidance[season];
  }
}

// Export singleton instance
export const calendarSeasonalService = new CalendarSeasonalService();
export default calendarSeasonalService;
