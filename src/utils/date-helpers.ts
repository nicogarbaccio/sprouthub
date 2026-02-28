/**
 * Centralized date utility helpers using date-fns
 *
 * **Date Handling Conventions:**
 * - Store dates in database as ISO strings (YYYY-MM-DD or ISO 8601)
 * - Use Date objects for calculations and comparisons
 * - Use date-fns for all date formatting and manipulation
 * - Always assume UTC for stored dates unless timezone-specific
 *
 * **Common Patterns:**
 * - `new Date()` - Current timestamp
 * - `date.toISOString()` - Convert to ISO string for storage
 * - `new Date(isoString)` - Parse ISO string from database
 * - `format(date, pattern)` - Display formatting
 */

import {
  format,
  formatDistanceToNow,
  differenceInDays,
  addDays,
  subDays,
  isAfter,
  isBefore,
  isPast,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';

/**
 * Common date format patterns
 */
export const DATE_FORMATS = {
  /** Full date with time: "Jan 15, 2025 at 2:30 PM" */
  FULL: "MMM d, yyyy 'at' h:mm a",
  /** Short date: "Jan 15, 2025" */
  SHORT: 'MMM d, yyyy',
  /** Numeric date: "01/15/2025" */
  NUMERIC: 'MM/dd/yyyy',
  /** ISO date only: "2025-01-15" */
  ISO_DATE: 'yyyy-MM-dd',
  /** Time only: "2:30 PM" */
  TIME: 'h:mm a',
  /** Relative time: "2 hours ago" */
  RELATIVE: 'relative',
} as const;

/**
 * Format a date for display using a predefined format
 *
 * @example
 * ```ts
 * formatDate(new Date(), DATE_FORMATS.SHORT) // "Jan 15, 2025"
 * formatDate(new Date(), DATE_FORMATS.RELATIVE) // "2 hours ago"
 * ```
 */
export function formatDate(
  date: Date | string,
  formatPattern: keyof typeof DATE_FORMATS | string = DATE_FORMATS.SHORT
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (formatPattern === 'relative') {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  }

  const pattern = DATE_FORMATS[formatPattern as keyof typeof DATE_FORMATS] || formatPattern;
  return format(dateObj, pattern as string);
}

/**
 * Get the number of days between two dates
 *
 * @example
 * ```ts
 * getDaysBetween(new Date('2025-01-01'), new Date('2025-01-10')) // 9
 * ```
 */
export function getDaysBetween(startDate: Date | string, endDate: Date | string = new Date()): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return Math.abs(differenceInDays(end, start));
}

/**
 * Add days to a date
 *
 * @example
 * ```ts
 * addDaysToDate(new Date(), 7) // Date 7 days from now
 * ```
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, days);
}

/**
 * Subtract days from a date
 *
 * @example
 * ```ts
 * subtractDaysFromDate(new Date(), 7) // Date 7 days ago
 * ```
 */
export function subtractDaysFromDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return subDays(dateObj, days);
}

/**
 * Check if a date is overdue (in the past)
 *
 * @example
 * ```ts
 * isOverdue(new Date('2020-01-01')) // true
 * isOverdue(new Date('2030-01-01')) // false
 * ```
 */
export function isOverdue(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isPast(dateObj) && !isToday(dateObj);
}

/**
 * Check if a date is today
 *
 * @example
 * ```ts
 * isToday(new Date()) // true
 * ```
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = startOfDay(new Date());
  const checkDate = startOfDay(dateObj);
  return checkDate.getTime() === today.getTime();
}

/**
 * Convert a date to ISO string for database storage
 *
 * @example
 * ```ts
 * toISOString(new Date()) // "2025-01-15T14:30:00.000Z"
 * ```
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse an ISO string from the database
 *
 * @example
 * ```ts
 * fromISOString("2025-01-15T14:30:00.000Z") // Date object
 * ```
 */
export function fromISOString(isoString: string): Date {
  return parseISO(isoString);
}

/**
 * Get the start of day for a given date (00:00:00)
 *
 * @example
 * ```ts
 * getStartOfDay(new Date()) // Today at 00:00:00
 * ```
 */
export function getStartOfDay(date: Date | string = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
}

/**
 * Get the end of day for a given date (23:59:59)
 *
 * @example
 * ```ts
 * getEndOfDay(new Date()) // Today at 23:59:59
 * ```
 */
export function getEndOfDay(date: Date | string = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
}

/**
 * Compare two dates
 *
 * @returns 1 if date1 is after date2, -1 if before, 0 if equal
 *
 * @example
 * ```ts
 * compareDates(new Date('2025-01-15'), new Date('2025-01-10')) // 1
 * ```
 */
export function compareDates(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;

  if (isAfter(d1, d2)) return 1;
  if (isBefore(d1, d2)) return -1;
  return 0;
}
