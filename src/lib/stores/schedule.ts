/**
 * Schedule Store
 *
 * Holds the output of the suggestion scheduler.
 * This is the result of running the engine on memos + gaps.
 *
 * Data flow:
 *   memos + gaps → engine.generateSchedule() → scheduleResult
 *
 * Usage:
 *   1. Call scheduleActions.regenerate() when you want a new schedule
 *   2. Read $scheduleResult to display scheduled blocks
 *   3. Use $nextScheduledBlock for quick access to the next task
 */

import { writable, derived, get } from "svelte/store";
import type { Memo, Gap } from "../types.js";
import type {
  ScheduleResult,
  ScheduledBlock,
  PipelineSummary,
} from "../services/suggestions/index.js";
import { createEngine } from "../services/suggestions/index.js";
import { enrichedGaps } from "./gaps.js";

// ============================================================================
// Engine Instance (Singleton)
// ============================================================================

/**
 * Single engine instance for the app
 * Reused across all schedule regenerations
 */
const engine = createEngine({
  enableLLMEnrichment: true, // Will gracefully skip if not configured
});

// ============================================================================
// Core Stores
// ============================================================================

/**
 * The schedule result from the last engine run
 * null = no schedule generated yet
 */
export const scheduleResult = writable<ScheduleResult | null>(null);

/**
 * Whether the schedule is currently being generated
 */
export const isScheduleLoading = writable<boolean>(false);

/**
 * Error message if schedule generation failed
 * null = no error
 */
export const scheduleError = writable<string | null>(null);

/**
 * Summary of the last pipeline execution
 * Useful for debugging and UI feedback
 */
export const lastPipelineSummary = writable<PipelineSummary | null>(null);

/**
 * Timestamp of the last successful schedule generation
 */
export const lastScheduleTime = writable<Date | null>(null);

// ============================================================================
// Derived Stores
// ============================================================================

/**
 * All scheduled blocks from the current schedule
 * Returns empty array if no schedule
 */
export const scheduledBlocks = derived(
  scheduleResult,
  ($result) => $result?.scheduled ?? [],
);

/**
 * All dropped suggestions (couldn't fit in gaps)
 */
export const droppedSuggestions = derived(
  scheduleResult,
  ($result) => $result?.dropped ?? [],
);

/**
 * Mandatory tasks that were dropped (high priority issue!)
 */
export const droppedMandatory = derived(
  scheduleResult,
  ($result) => $result?.mandatoryDropped ?? [],
);

/**
 * The next scheduled block (first one in the list)
 * Most useful for "what should I do next?" UI
 */
export const nextScheduledBlock = derived(
  scheduleResult,
  ($result): ScheduledBlock | null => {
    if (!$result?.scheduled.length) return null;
    return $result.scheduled[0];
  },
);

/**
 * Whether there are any scheduled tasks
 */
export const hasScheduledTasks = derived(
  scheduleResult,
  ($result) => ($result?.scheduled.length ?? 0) > 0,
);

/**
 * Total minutes scheduled
 */
export const totalScheduledMinutes = derived(
  scheduleResult,
  ($result) => $result?.totalScheduledMinutes ?? 0,
);

/**
 * Whether any mandatory tasks were dropped
 * This is a warning condition
 */
export const hasMandatoryDropped = derived(
  scheduleResult,
  ($result) => ($result?.mandatoryDropped.length ?? 0) > 0,
);

// ============================================================================
// Actions
// ============================================================================

/**
 * Schedule management actions
 */
export const scheduleActions = {
  /**
   * Regenerate the schedule from current memos and gaps
   *
   * Call this when:
   * - User requests a new schedule
   * - Memos change significantly
   * - Time moves forward (new gaps available)
   *
   * @param memos - Current memos (pass from your memo store)
   * @param options - Optional overrides
   */
  async regenerate(
    memos: Memo[],
    options: {
      gaps?: Gap[];
      skipLLMEnrichment?: boolean;
    } = {},
  ): Promise<ScheduleResult | null> {
    // Set loading state
    isScheduleLoading.set(true);
    scheduleError.set(null);

    try {
      // Get gaps (use provided or from store)
      const gaps = options.gaps ?? get(enrichedGaps);

      // Call engine
      const { schedule, summary } = await engine.generateSchedule(memos, gaps, {
        skipLLMEnrichment: options.skipLLMEnrichment,
      });

      // Update stores
      scheduleResult.set(schedule);
      lastPipelineSummary.set(summary);
      lastScheduleTime.set(new Date());

      // Log summary for debugging
      console.log("[Schedule] Generated:", {
        scheduled: schedule.scheduled.length,
        dropped: schedule.dropped.length,
        mandatoryDropped: schedule.mandatoryDropped.length,
        executionMs: summary.executionTimeMs,
      });

      return schedule;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Schedule] Generation failed:", error);
      scheduleError.set(message);
      return null;
    } finally {
      isScheduleLoading.set(false);
    }
  },

  /**
   * Clear the current schedule
   * Useful for resetting state
   */
  clear(): void {
    scheduleResult.set(null);
    scheduleError.set(null);
    lastPipelineSummary.set(null);
  },

  /**
   * Mark a session as complete and update the memo
   *
   * @param memo - The memo that was worked on
   * @param minutesSpent - How long the user worked
   * @returns Updated memo with new status
   */
  markSessionComplete(memo: Memo, minutesSpent: number): Memo {
    const result = engine.markSessionComplete(memo, {
      memoId: memo.id,
      minutesSpent,
    });

    console.log("[Schedule] Session complete:", {
      memoId: memo.id,
      minutesSpent,
      isNowComplete: result.isNowComplete,
      goalReached: result.goalReached,
    });

    return result.memo;
  },

  /**
   * Get the engine for advanced usage
   * (e.g., enriching a single memo)
   */
  getEngine() {
    return engine;
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a scheduled block by memo ID
 */
export function findBlockByMemoId(memoId: string): ScheduledBlock | null {
  const result = get(scheduleResult);
  if (!result) return null;
  return result.scheduled.find((b) => b.memoId === memoId) ?? null;
}

/**
 * Check if a memo is scheduled
 */
export function isMemoScheduled(memoId: string): boolean {
  return findBlockByMemoId(memoId) !== null;
}

/**
 * Get all blocks for a specific gap
 */
export function getBlocksForGap(gapId: string): ScheduledBlock[] {
  const result = get(scheduleResult);
  if (!result) return [];
  return result.scheduled.filter((b) => b.gapId === gapId);
}
