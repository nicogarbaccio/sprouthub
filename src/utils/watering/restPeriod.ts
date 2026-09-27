/**
 * Rest periods: seasons when a species should get no regular watering (Lithops in winter,
 * Cyclamen in summer). The catalog lists them; the app offers to pause the plant's watering
 * reminders until the season ends, by setting `user_plants.watering_paused_until`.
 */

import { getNextSeasonChange, getSeason, type Hemisphere, type Season } from '@/utils/season';

export { parseDateOnly } from './schedule';

export interface RestPeriod {
  season: Season;
  note: string;
}

export interface ActiveRestPeriod extends RestPeriod {
  /** First day of the next season, when regular watering resumes */
  endsOn: Date;
}

/** The rest period the plant is in right now, if any. */
export function getActiveRestPeriod(
  restPeriods: RestPeriod[] | undefined,
  hemisphere: Hemisphere,
  now: Date = new Date()
): ActiveRestPeriod | null {
  if (!restPeriods?.length) return null;
  const season = getSeason(now, hemisphere);
  const period = restPeriods.find((p) => p.season === season);
  if (!period) return null;
  return { ...period, endsOn: getNextSeasonChange(now, hemisphere).date };
}

/** A local calendar date as YYYY-MM-DD, the format `watering_paused_until` is stored in. */
export function toDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * notification_acknowledgements key for "keep reminding me" on a rest suggestion. Keyed by
 * the year the rest ends, so a winter spanning New Year has one key.
 */
export function restSuggestionKey(period: ActiveRestPeriod): string {
  return `rest_suggestion:${period.season}-${period.endsOn.getFullYear()}`;
}
