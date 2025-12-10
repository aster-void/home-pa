/**
 * @fileoverview Period Tracking Utilities
 *
 * Handles period calculations for routine tasks (daily/weekly/monthly cycles).
 * Used by scoring module to determine need based on routine goal completion.
 *
 * @author Personal Assistant Team
 * @version 1.0.0
 */

import type { Memo, RecurrenceGoal } from "../../types.ts";

// ============================================================================
// TYPES
// ============================================================================

export type Period = "day" | "week" | "month";

// ============================================================================
// PERIOD PROGRESS
// ============================================================================

/**
 * Get how far through the current period we are (0.0 - 1.0)
 *
 * @param currentTime - Current time to check
 * @param period - Period type (day/week/month)
 * @returns Progress ratio from 0.0 (start of period) to 1.0 (end of period)
 *
 * @example
 * // Monday 12:00 noon
 * getPeriodProgress(date, "day")   // ~0.5 (halfway through day)
 * getPeriodProgress(date, "week")  // ~0.07 (1/7 of week + half day)
 * getPeriodProgress(date, "month") // depends on day of month
 */
export function getPeriodProgress(currentTime: Date, period: Period): number {
  switch (period) {
    case "day":
      return getDayProgress(currentTime);
    case "week":
      return getWeekProgress(currentTime);
    case "month":
      return getMonthProgress(currentTime);
  }
}

/**
 * Progress through current day (0.0 at midnight, 1.0 at 23:59)
 */
function getDayProgress(time: Date): number {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  return (hours * 60 + minutes) / (24 * 60);
}

/**
 * Progress through current week (0.0 at Sunday midnight, 1.0 at Saturday 23:59)
 * Note: Week starts on Sunday (day 0)
 */
function getWeekProgress(time: Date): number {
  const dayOfWeek = time.getDay(); // 0 = Sunday, 6 = Saturday
  const dayProgress = getDayProgress(time);
  return (dayOfWeek + dayProgress) / 7;
}

/**
 * Progress through current month (0.0 on 1st, 1.0 on last day)
 */
function getMonthProgress(time: Date): number {
  const dayOfMonth = time.getDate(); // 1-31
  const daysInMonth = getDaysInMonth(time);
  const dayProgress = getDayProgress(time);
  return (dayOfMonth - 1 + dayProgress) / daysInMonth;
}

/**
 * Get number of days in the month of the given date
 */
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// ============================================================================
// PERIOD BOUNDARY CHECKING
// ============================================================================

/**
 * Check if we've entered a new period since the last tracking date
 *
 * @param lastPeriodStart - When the tracking period started
 * @param currentTime - Current time to check against
 * @param period - Period type (day/week/month)
 * @returns true if we've crossed into a new period
 *
 * @example
 * // lastPeriodStart = Monday, currentTime = Tuesday
 * isNewPeriod(lastPeriodStart, currentTime, "day")   // true
 * isNewPeriod(lastPeriodStart, currentTime, "week")  // false (same week)
 */
export function isNewPeriod(
  lastPeriodStart: Date,
  currentTime: Date,
  period: Period,
): boolean {
  switch (period) {
    case "day":
      return !isSameDay(lastPeriodStart, currentTime);
    case "week":
      return !isSameWeek(lastPeriodStart, currentTime);
    case "month":
      return !isSameMonth(lastPeriodStart, currentTime);
  }
}

/**
 * Check if two dates are the same calendar day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if two dates are in the same week
 * Week is considered to start on Sunday
 */
function isSameWeek(date1: Date, date2: Date): boolean {
  const week1 = getWeekNumber(date1);
  const week2 = getWeekNumber(date2);
  return date1.getFullYear() === date2.getFullYear() && week1 === week2;
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
  );
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

/**
 * Check if two dates are in the same month
 */
function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

// ============================================================================
// MEMO PERIOD MANAGEMENT
// ============================================================================

/**
 * Reset period counter if we've entered a new period
 * Call this before scoring to ensure fresh counts
 *
 * @param memo - Memo to check and potentially reset
 * @param currentTime - Current time
 * @returns Updated memo (new object if reset, same object if not)
 */
export function resetPeriodIfNeeded(memo: Memo, currentTime: Date): Memo {
  // Only applies to routine memos with recurrence goals
  if (memo.type !== "ルーティン" || !memo.recurrenceGoal) {
    return memo;
  }

  const periodStart = memo.status.periodStartDate;

  // If no period start set, or we've entered a new period, reset
  if (
    !periodStart ||
    isNewPeriod(periodStart, currentTime, memo.recurrenceGoal.period)
  ) {
    return {
      ...memo,
      status: {
        ...memo.status,
        completionsThisPeriod: 0,
        periodStartDate: currentTime,
      },
    };
  }

  return memo;
}

/**
 * Increment completion count when user finishes a session
 * Call this when user accepts/completes a scheduled suggestion
 *
 * @param memo - Memo to update
 * @param currentTime - Current time
 * @returns Updated memo with incremented counter
 */
export function incrementCompletion(memo: Memo, currentTime: Date): Memo {
  // Only applies to routine memos
  if (memo.type !== "ルーティン") {
    return memo;
  }

  // First ensure we're in the right period
  const normalized = resetPeriodIfNeeded(memo, currentTime);

  return {
    ...normalized,
    status: {
      ...normalized.status,
      completionsThisPeriod: (normalized.status.completionsThisPeriod ?? 0) + 1,
    },
    lastActivity: currentTime,
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { isSameDay, isSameWeek, isSameMonth, getWeekNumber, getDaysInMonth };
