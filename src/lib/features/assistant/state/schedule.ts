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
 *
 * Suggestion States:
 *   - Pending: Generated suggestions not yet accepted (shown with Accept/Skip UI)
 *   - Accepted: User-accepted suggestions that act as fixed events in gap calculation
 */

import { writable, derived, get } from "svelte/store";
import type { Memo, Gap } from "../../../types.ts";
import type {
  ScheduleResult,
  ScheduledBlock,
  PipelineSummary,
} from "../services/suggestions/index.ts";
import { createEngine } from "../services/suggestions/index.ts";
import { enrichedGaps } from "./gaps.svelte.ts";
import {
  calculateExtension,
  getBlockersFromAccepted,
  timeToMinutes,
  minutesToTime,
} from "../services/suggestion-drag.ts";

// ============================================================================
// Types for Suggestion Management
// ============================================================================

/**
 * An accepted suggestion that acts as a fixed event
 * Extends ScheduledBlock with acceptance metadata
 */
export interface AcceptedSuggestion extends ScheduledBlock {
  acceptedAt: Date;
  /** Original duration before any resizing */
  originalDuration: number;
}

/**
 * A pending suggestion awaiting user action
 */
export interface PendingSuggestion extends ScheduledBlock {
  /** Reason/explanation for the suggestion */
  reason?: string;
}

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
// Suggestion State Stores
// ============================================================================

/**
 * Accepted suggestions that act as fixed events
 * These block their time slots from future suggestions
 */
export const acceptedSuggestions = writable<AcceptedSuggestion[]>([]);

/**
 * Set of suggestion IDs that have been skipped
 * Used to exclude from regeneration
 */
export const skippedSuggestionIds = writable<Set<string>>(new Set());

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
 * Pending suggestions (generated but not yet accepted/skipped)
 * Excludes blocks that are already accepted
 */
export const pendingSuggestions = derived(
  [scheduleResult, acceptedSuggestions, skippedSuggestionIds],
  ([$result, $accepted, $skipped]): PendingSuggestion[] => {
    if (!$result?.scheduled) return [];
    const acceptedIds = new Set($accepted.map((a) => a.suggestionId));
    return $result.scheduled
      .filter(
        (block) =>
          !acceptedIds.has(block.suggestionId) &&
          !$skipped.has(block.suggestionId),
      )
      .map((block) => ({ ...block }));
  },
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
 * Subtract accepted suggestions from gaps to get remaining available gaps
 */
function subtractAcceptedFromGaps(
  gaps: Gap[],
  accepted: AcceptedSuggestion[],
): Gap[] {
  if (accepted.length === 0) return gaps;

  // Group accepted by gapId
  const acceptedByGap = new Map<string, AcceptedSuggestion[]>();
  for (const a of accepted) {
    const list = acceptedByGap.get(a.gapId) || [];
    list.push(a);
    acceptedByGap.set(a.gapId, list);
  }

  const result: Gap[] = [];
  let gapCounter = 0;

  for (const gap of gaps) {
    const blockers = acceptedByGap.get(gap.gapId) || [];
    if (blockers.length === 0) {
      result.push(gap);
      continue;
    }

    // Sort blockers by start time
    blockers.sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    );

    // Find remaining gaps between/around blockers
    let currentStart = timeToMinutes(gap.start);
    const gapEnd = timeToMinutes(gap.end);

    for (const blocker of blockers) {
      const blockerStart = timeToMinutes(blocker.startTime);
      const blockerEnd = timeToMinutes(blocker.endTime);

      // Gap before this blocker
      if (blockerStart > currentStart) {
        const duration = blockerStart - currentStart;
        if (duration >= 5) {
          // Minimum 5 minutes for a viable gap
          result.push({
            gapId: `${gap.gapId}-sub-${gapCounter++}`,
            start: minutesToTime(currentStart),
            end: minutesToTime(blockerStart),
            duration,
            locationLabel: gap.locationLabel,
          });
        }
      }
      currentStart = Math.max(currentStart, blockerEnd);
    }

    // Gap after all blockers
    if (currentStart < gapEnd) {
      const duration = gapEnd - currentStart;
      if (duration >= 5) {
        result.push({
          gapId: `${gap.gapId}-sub-${gapCounter++}`,
          start: minutesToTime(currentStart),
          end: minutesToTime(gapEnd),
          duration,
          locationLabel: gap.locationLabel,
        });
      }
    }
  }

  return result;
}

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
      const previous = get(scheduleResult);
      const previousKey = previous ? stableSerializeSchedule(previous) : null;

      // Get gaps and subtract accepted suggestions
      const rawGaps = options.gaps ?? get(enrichedGaps);
      const accepted = get(acceptedSuggestions);
      const availableGaps = subtractAcceptedFromGaps(rawGaps, accepted);

      // Call engine with available gaps
      const { schedule, summary } = await engine.generateSchedule(
        memos,
        availableGaps,
        {
          skipLLMEnrichment: options.skipLLMEnrichment,
        },
      );

      const nextKey = stableSerializeSchedule(schedule);
      const isSameAsPrevious = previousKey === nextKey;

      if (isSameAsPrevious) {
        // No state change if identical to cached schedule
        console.log("[Schedule] Regeneration skipped (no change)");
        lastScheduleTime.set(new Date());
        lastPipelineSummary.set(summary);
        return schedule;
      }

      // Update stores
      scheduleResult.set(schedule);
      lastPipelineSummary.set(summary);
      lastScheduleTime.set(new Date());

      // Log summary for debugging
      console.log("[Schedule] Generated:", {
        scheduled: schedule.scheduled.length,
        dropped: schedule.dropped.length,
        mandatoryDropped: schedule.mandatoryDropped.length,
        acceptedFixed: accepted.length,
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
   * Accept a suggestion, converting it to a fixed event
   *
   * @param suggestionId - ID of the suggestion to accept
   * @param memos - Current memos for regeneration
   */
  async accept(suggestionId: string, memos: Memo[]): Promise<void> {
    const result = get(scheduleResult);
    if (!result) return;

    const block = result.scheduled.find((b) => b.suggestionId === suggestionId);
    if (!block) {
      console.warn(
        "[Schedule] Cannot accept: suggestion not found",
        suggestionId,
      );
      return;
    }

    // Move to accepted
    const accepted: AcceptedSuggestion = {
      ...block,
      acceptedAt: new Date(),
      originalDuration: block.duration,
    };

    acceptedSuggestions.update((list) => [...list, accepted]);

    console.log("[Schedule] Accepted suggestion:", suggestionId);

    // Regenerate to fill remaining gaps
    await scheduleActions.regenerate(memos);
  },

  /**
   * Skip a suggestion, requesting a new one for that gap
   *
   * @param suggestionId - ID of the suggestion to skip
   * @param memos - Current memos for regeneration
   */
  async skip(suggestionId: string, memos: Memo[]): Promise<void> {
    // Add to skipped set
    skippedSuggestionIds.update((set) => {
      const next = new Set(set);
      next.add(suggestionId);
      return next;
    });

    console.log("[Schedule] Skipped suggestion:", suggestionId);

    // Regenerate to get new suggestion for the gap
    await scheduleActions.regenerate(memos);
  },

  /**
   * Move a pending suggestion to a new time slot
   * Called when user drags a suggestion to a new position
   *
   * @param suggestionId - ID of the suggestion to move
   * @param newStartTime - New start time in HH:mm format
   * @param newEndTime - New end time in HH:mm format
   * @param newGapId - ID of the gap the suggestion is being moved to
   * @param memos - Current memos for regeneration
   */
  async moveSuggestion(
    suggestionId: string,
    newStartTime: string,
    newEndTime: string,
    newGapId: string,
    _memos: Memo[],
  ): Promise<void> {
    const result = get(scheduleResult);
    if (!result) return;

    const blockIndex = result.scheduled.findIndex(
      (b) => b.suggestionId === suggestionId,
    );
    if (blockIndex === -1) {
      console.warn(
        "[Schedule] Cannot move: suggestion not found",
        suggestionId,
      );
      return;
    }

    const block = result.scheduled[blockIndex];

    // Calculate new duration from time range
    const newDuration = timeToMinutes(newEndTime) - timeToMinutes(newStartTime);

    // Update the schedule result with the moved suggestion
    const updatedScheduled = [...result.scheduled];
    updatedScheduled[blockIndex] = {
      ...block,
      startTime: newStartTime,
      endTime: newEndTime,
      duration: newDuration,
      gapId: newGapId,
    };

    // Update the store
    scheduleResult.set({
      ...result,
      scheduled: updatedScheduled,
    });

    console.log("[Schedule] Moved suggestion:", suggestionId, "to", {
      start: newStartTime,
      end: newEndTime,
      gap: newGapId,
    });
  },

  /**
   * Update the duration of an accepted suggestion (drag-to-resize)
   * Uses symmetric extension from midpoint when possible, otherwise one-sided.
   *
   * @param suggestionId - ID of the accepted suggestion
   * @param newDuration - New duration in minutes (must be multiple of 5)
   * @param memos - Current memos for regeneration
   * @param gaps - Optional gaps to use for constraint checking
   * @returns Object with success flag and max allowed duration
   */
  async updateAcceptedDuration(
    suggestionId: string,
    newDuration: number,
    memos: Memo[],
    gaps?: Gap[],
  ): Promise<{ success: boolean; maxAllowed?: number }> {
    const accepted = get(acceptedSuggestions);
    const idx = accepted.findIndex((a) => a.suggestionId === suggestionId);
    if (idx === -1) {
      console.warn(
        "[Schedule] Cannot resize: accepted suggestion not found",
        suggestionId,
      );
      return { success: false };
    }

    const suggestion = accepted[idx];

    // Snap to 5-minute increments
    const snappedDuration = Math.round(newDuration / 5) * 5;
    if (snappedDuration < 5) {
      console.warn("[Schedule] Cannot resize: duration too small");
      return { success: false, maxAllowed: 5 };
    }

    // Get the gap this suggestion belongs to
    const rawGaps = gaps ?? get(enrichedGaps);
    const suggestionGap = rawGaps.find((g) => g.gapId === suggestion.gapId);

    // Calculate current midpoint
    const startMinutes = timeToMinutes(suggestion.startTime);
    const endMinutes = timeToMinutes(suggestion.endTime);
    const midpoint = Math.floor((startMinutes + endMinutes) / 2);

    // Determine gap boundaries
    const gapStart = suggestionGap
      ? timeToMinutes(suggestionGap.start)
      : startMinutes;
    const gapEnd = suggestionGap
      ? timeToMinutes(suggestionGap.end)
      : endMinutes;

    // Get blockers (other accepted suggestions)
    const blockers = getBlockersFromAccepted(accepted, suggestionId);

    // Calculate extension with constraints
    const extensionResult = calculateExtension(
      midpoint,
      suggestion.duration,
      snappedDuration,
      gapStart,
      gapEnd,
      blockers,
    );

    if (extensionResult.blocked) {
      console.warn(
        "[Schedule] Cannot resize:",
        extensionResult.blockReason ?? "blocked by constraints",
      );
      return { success: false, maxAllowed: extensionResult.maxAllowedDuration };
    }

    // Update the suggestion with new times
    acceptedSuggestions.update((list) => {
      const updated = [...list];
      updated[idx] = {
        ...suggestion,
        duration: extensionResult.newDuration,
        startTime: extensionResult.newStartTime,
        endTime: extensionResult.newEndTime,
      };
      return updated;
    });

    console.log(
      "[Schedule] Resized accepted suggestion:",
      suggestionId,
      "to",
      extensionResult.newDuration,
      "min",
      `(${extensionResult.newStartTime} - ${extensionResult.newEndTime})`,
    );

    // Regenerate to reflow other suggestions
    await scheduleActions.regenerate(memos);
    return { success: true, maxAllowed: extensionResult.maxAllowedDuration };
  },

  /**
   * Delete an accepted suggestion, freeing up the gap
   *
   * @param suggestionId - ID of the accepted suggestion to delete
   * @param memos - Current memos for regeneration
   */
  async deleteAccepted(suggestionId: string, memos: Memo[]): Promise<void> {
    acceptedSuggestions.update((list) =>
      list.filter((a) => a.suggestionId !== suggestionId),
    );

    console.log("[Schedule] Deleted accepted suggestion:", suggestionId);

    // Regenerate to fill the freed gap
    await scheduleActions.regenerate(memos);
  },

  /**
   * Clear the current schedule
   * Useful for resetting state
   */
  clear(): void {
    scheduleResult.set(null);
    scheduleError.set(null);
    lastPipelineSummary.set(null);
    acceptedSuggestions.set([]);
    skippedSuggestionIds.set(new Set());
  },

  /**
   * Clear only accepted and skipped state (keep schedule result)
   * Useful for daily reset
   */
  clearAcceptedAndSkipped(): void {
    acceptedSuggestions.set([]);
    skippedSuggestionIds.set(new Set());
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

function stableSerializeSchedule(schedule: ScheduleResult): string {
  const scheduled = [...schedule.scheduled].sort((a, b) => {
    const idCompare = a.suggestionId.localeCompare(b.suggestionId);
    if (idCompare !== 0) return idCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const dropped = [...schedule.dropped].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  const mandatoryDropped = [...schedule.mandatoryDropped].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  return JSON.stringify({
    scheduled,
    dropped,
    mandatoryDropped,
    totalScheduledMinutes: schedule.totalScheduledMinutes,
    totalDroppedMinutes: schedule.totalDroppedMinutes,
  });
}

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
