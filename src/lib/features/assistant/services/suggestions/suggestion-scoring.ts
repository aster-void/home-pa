/**
 * @fileoverview Suggestion Scoring Module
 *
 * Calculates need/importance/duration scores for each memo to produce Suggestions.
 * Core of the suggestion engine that determines what tasks to prioritize.
 *
 * Need Score Ranges by Type:
 * - 期限付き (Deadline):  0.1 – 1.0+ (can become mandatory)
 * - ルーティン (Routine): 0.3 – 0.8 (never conflicts with deadlines)
 * - バックログ (Backlog): 0.25 – 0.7 (never conflicts with deadlines)
 *
 * Design Principle:
 * - Routine/Backlog have HIGHER minimums → prioritized when no urgent deadlines
 * - Routine/Backlog have LOWER maximums → never override mandatory deadlines
 * - Only Deadline tasks can reach mandatory status (need >= 1.0)
 */

import type { Memo, Suggestion, ImportanceLevel } from "$lib/types.ts";
import {
  resetPeriodIfNeeded,
  getPeriodProgress,
  isSameDay,
} from "./period-utils.ts";

// ============================================================================
// TYPES
// ============================================================================

export interface ScoreInput {
  memo: Memo;
  currentTime: Date;
  userPreferences?: {
    prioritizeDeadlines?: boolean;
    routineWeight?: number;
  };
}

export interface ScoreOutput {
  need: number; // 0.0–1.0+ (≥1.0 = mandatory)
  importance: number; // 0.0–1.0
  duration: number; // Minutes
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAYS_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Need score ranges by memo type
 *
 * Higher minimums for Routine/Backlog = they get priority when no urgent deadlines
 * Lower maximums for Routine/Backlog = they never block mandatory deadlines
 */
export const NEED_RANGES = {
  deadline: { min: 0.1, max: 1.0 }, // Can exceed 1.0 when overdue
  routine: { min: 0.3, max: 0.8 }, // Higher floor, capped ceiling
  backlog: { min: 0.25, max: 0.7 }, // Higher floor, capped ceiling
} as const;

/** When need >= this value, task is mandatory */
export const MANDATORY_THRESHOLD = 1.0;

/** Duration bounds */
const DEFAULT_SESSION_MINUTES = 30;
const MIN_SESSION_MINUTES = 15;
const MAX_SESSION_MINUTES = 120;

// ============================================================================
// NEED CALCULATION - DEADLINE
// ============================================================================

/**
 * Calculate need for 期限付き (Deadline) tasks
 *
 * Uses gradient from creation date to deadline:
 * - At creation: need = 0.1 (MIN)
 * - At deadline: need = 1.0 (mandatory)
 * - Overdue: need > 1.0 (escalating)
 *
 * Adjusts by remaining work - mostly done tasks have slightly reduced need
 */
export function calculateDeadlineNeed(memo: Memo, currentTime: Date): number {
  if (!memo.deadline) return 0.5;

  const MIN_NEED = NEED_RANGES.deadline.min;
  const MAX_NEED = NEED_RANGES.deadline.max;

  const created = new Date(memo.createdAt);
  const deadline = new Date(memo.deadline);
  const now = currentTime;

  // Total time span from creation to deadline
  const totalSpanMs = deadline.getTime() - created.getTime();

  // Time elapsed since creation
  const elapsedMs = now.getTime() - created.getTime();

  // Progress factor: more work remaining = higher need multiplier
  const progressRatio =
    memo.status.timeSpentMinutes / (memo.totalDurationExpected || 60);
  const remainingWork = 1 - Math.min(progressRatio, 1);

  // Check if overdue
  if (now >= deadline) {
    // Overdue: mandatory, escalating based on days overdue
    const daysOverdue = (now.getTime() - deadline.getTime()) / DAYS_IN_MS;
    return MAX_NEED + Math.min(daysOverdue * 0.1, 0.5); // Cap at 1.5
  }

  // Check if due today (same calendar day)
  if (isSameDay(now, deadline)) {
    return MAX_NEED; // Due today = mandatory
  }

  // Handle edge case: deadline is same as or before creation
  if (totalSpanMs <= 0) {
    return MAX_NEED; // Treat as due immediately
  }

  // Calculate gradient position (0.0 at creation, 1.0 at deadline)
  const gradientPosition = Math.max(0, Math.min(1, elapsedMs / totalSpanMs));

  // Linear interpolation: MIN_NEED → MAX_NEED based on position
  const baseNeed = MIN_NEED + (MAX_NEED - MIN_NEED) * gradientPosition;

  // Adjust by remaining work (if mostly done, reduce need)
  // But minimum is still based on time pressure
  const adjustedNeed = baseNeed * (0.3 + 0.7 * remainingWork);

  return Math.max(MIN_NEED, adjustedNeed);
}

// ============================================================================
// NEED CALCULATION - BACKLOG
// ============================================================================

/**
 * Calculate need for バックログ (Backlog) tasks
 *
 * Based on time since last activity:
 * - Longer neglect = higher need
 * - Range: 0.25 (min) to 0.7 (max) — never conflicts with mandatory deadlines
 * - Higher minimum than deadline tasks = prioritized when no urgent deadlines
 */
export function calculateBacklogNeed(memo: Memo, currentTime: Date): number {
  const { min, max } = NEED_RANGES.backlog;
  const range = max - min;

  const lastActivity = memo.lastActivity ? new Date(memo.lastActivity) : null;

  // Progress factor: more work remaining = higher need multiplier
  const progressRatio =
    memo.status.timeSpentMinutes / (memo.totalDurationExpected || 60);
  const remainingWork = 1 - Math.min(progressRatio, 1);

  // If never worked on, use high-end of range
  if (!lastActivity) {
    return min + range * 0.8 * remainingWork; // ~0.61 if no progress
  }

  const daysSinceActivity =
    (currentTime.getTime() - lastActivity.getTime()) / DAYS_IN_MS;

  // Neglect factor: 0.0 (just worked on) to 1.0 (very neglected)
  let neglectFactor: number;
  if (daysSinceActivity < 1) {
    neglectFactor = 0.0; // Worked on today
  } else if (daysSinceActivity < 3) {
    neglectFactor = 0.3; // Recent activity
  } else if (daysSinceActivity < 7) {
    neglectFactor = 0.6; // Week old
  } else if (daysSinceActivity < 14) {
    neglectFactor = 0.85; // Two weeks
  } else {
    neglectFactor = 1.0; // Very neglected
  }

  // Combine neglect and remaining work
  const combinedFactor = neglectFactor * (0.3 + 0.7 * remainingWork);

  return min + range * combinedFactor;
}

// ============================================================================
// NEED CALCULATION - ROUTINE
// ============================================================================

/**
 * Calculate need for ルーティン (Routine) tasks
 *
 * Based on recurrence goal fulfillment:
 * - { count: 3, period: "week" } with 1 done = behind schedule
 * - Range: 0.3 (min) to 0.8 (max) — never conflicts with mandatory deadlines
 * - Routines can NEVER become mandatory (capped at 0.8)
 */
export function calculateRoutineNeed(memo: Memo, currentTime: Date): number {
  const { min, max } = NEED_RANGES.routine;
  const range = max - min;

  // No recurrence goal? Use mid-range default
  if (!memo.recurrenceGoal) {
    return min + range * 0.4;
  }

  const { count, period } = memo.recurrenceGoal;
  const completions = memo.status.completionsThisPeriod ?? 0;
  const remaining = count - completions;

  // Goal met for this period — use minimum
  if (remaining <= 0) {
    return min;
  }

  // Calculate how much of the period is left
  const periodProgress = getPeriodProgress(currentTime, period);
  const timeRemainingRatio = 1 - periodProgress;
  const completionsNeededRatio = remaining / count;

  // Urgency factor: how behind schedule are we?
  // 1.0 = on track, >1.0 = behind schedule
  const urgencyFactor =
    completionsNeededRatio / Math.max(timeRemainingRatio, 0.1);

  // Map urgency to need within our range
  // urgencyFactor 0.5 (ahead) → low end of range
  // urgencyFactor 1.0 (on track) → middle of range
  // urgencyFactor 2.0+ (very behind) → high end of range (but capped at max)
  const normalizedUrgency = Math.min((urgencyFactor - 0.5) / 1.5, 1.0);
  const clampedUrgency = Math.max(0, normalizedUrgency);

  return min + range * clampedUrgency;
}

// ============================================================================
// MAIN NEED DISPATCH
// ============================================================================

/**
 * Calculate need score based on memo type
 * Dispatches to type-specific calculation
 */
export function calculateNeed(memo: Memo, currentTime: Date): number {
  switch (memo.type) {
    case "期限付き":
      return calculateDeadlineNeed(memo, currentTime);
    case "バックログ":
      return calculateBacklogNeed(memo, currentTime);
    case "ルーティン":
      return calculateRoutineNeed(memo, currentTime);
    default:
      return 0.5; // Default medium need
  }
}

// ============================================================================
// IMPORTANCE CALCULATION
// ============================================================================

/**
 * Convert importance level string to numeric value
 */
export function importanceToNumber(importance: ImportanceLevel): number {
  switch (importance) {
    case "low":
      return 0.3;
    case "medium":
      return 0.6;
    case "high":
      return 0.9;
    default:
      return 0.6;
  }
}

/**
 * Calculate importance score for a memo
 * Currently uses direct conversion; can add modifiers later
 * (e.g., streak bonuses, reaction history adjustments)
 */
export function calculateImportance(memo: Memo): number {
  const base = importanceToNumber(memo.importance || "medium");

  // Future: Add modifiers here based on:
  // - User reaction history (frequently rejected = lower)
  // - Streak bonuses
  // - Time-sensitive adjustments

  return base;
}

// ============================================================================
// DURATION SELECTION
// ============================================================================

/**
 * Clamp a value between min and max bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Select session duration for a memo
 *
 * Priority:
 * 1. Use explicit sessionDuration if set
 * 2. Fallback: totalDurationExpected / 4
 * 3. Default: 30 minutes
 *
 * Always clamped to 15-120 minutes
 */
export function selectDuration(memo: Memo): number {
  // Use explicit session duration if set
  if (memo.sessionDuration && memo.sessionDuration > 0) {
    return clamp(
      memo.sessionDuration,
      MIN_SESSION_MINUTES,
      MAX_SESSION_MINUTES,
    );
  }

  // Fallback: estimate from total expected
  if (memo.totalDurationExpected && memo.totalDurationExpected > 0) {
    // Divide into ~4 sessions
    const estimated = Math.ceil(memo.totalDurationExpected / 4);
    return clamp(estimated, MIN_SESSION_MINUTES, MAX_SESSION_MINUTES);
  }

  return DEFAULT_SESSION_MINUTES;
}

// ============================================================================
// MAIN SCORING FUNCTIONS
// ============================================================================

/**
 * Score a memo to produce need/importance/duration
 * Main entry point for scoring system
 */
export function scoreMemo(input: ScoreInput): ScoreOutput {
  const { memo, currentTime } = input;

  // Reset period counter if needed (for ルーティン)
  const normalizedMemo = resetPeriodIfNeeded(memo, currentTime);

  return {
    need: calculateNeed(normalizedMemo, currentTime),
    importance: calculateImportance(normalizedMemo),
    duration: selectDuration(normalizedMemo),
  };
}

/**
 * Convert a memo with its scores to a Suggestion
 * Creates the final output for the scheduler
 */
export function memoToSuggestion(memo: Memo, score: ScoreOutput): Suggestion {
  return {
    id: `suggestion-${memo.id}-${Date.now()}`,
    memoId: memo.id,
    need: score.need,
    importance: score.importance,
    duration: score.duration,
    locationPreference: memo.locationPreference,
  };
}

/**
 * Score a memo and immediately convert to Suggestion
 * Convenience function combining scoreMemo + memoToSuggestion
 */
export function createSuggestionFromMemo(
  memo: Memo,
  currentTime: Date,
): Suggestion {
  const score = scoreMemo({ memo, currentTime });
  return memoToSuggestion(memo, score);
}

/**
 * Check if a suggestion is mandatory (must be scheduled)
 */
export function isMandatory(suggestion: Suggestion): boolean {
  return suggestion.need >= MANDATORY_THRESHOLD;
}

/**
 * Calculate priority for sorting suggestions
 * Higher priority = scheduled first
 */
export function calculatePriority(suggestion: Suggestion): number {
  return suggestion.need * suggestion.importance;
}
