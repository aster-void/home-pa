/**
 * @fileoverview Suggestion Scheduler Module
 *
 * Assigns suggestions to gaps using:
 * - Mandatory/optional partitioning
 * - Knapsack DP for optimal subset selection
 * - Permutation enumeration for optimal ordering
 * - Greedy gap assignment
 *
 * Simplified from Python version: no coordinates or travel time calculations.
 * Location matching uses string labels (handled by location-matching.ts).
 */

import type { Gap, Suggestion } from "../../types.js";
import { canFit, findFirstCompatibleGap } from "./location-matching.js";
import {
  calculatePriority,
  MANDATORY_THRESHOLD,
} from "./suggestion-scoring.js";

// ============================================================================
// TYPES
// ============================================================================

/**
 * A scheduled block representing a suggestion assigned to a gap
 */
export interface ScheduledBlock {
  suggestionId: string;
  memoId: string;
  gapId: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration: number; // minutes
}

/**
 * Result of scheduling operation
 */
export interface ScheduleResult {
  scheduled: ScheduledBlock[];
  dropped: Suggestion[];
  totalScheduledMinutes: number;
  totalDroppedMinutes: number;
  permutationsEvaluated: number;
  mandatoryDropped: Suggestion[]; // Warning: mandatory tasks that couldn't fit
}

/**
 * Mutable gap for tracking remaining capacity during scheduling
 */
interface MutableGap {
  gapId: string;
  start: string;
  end: string;
  duration: number;
  remaining: number; // Remaining capacity in minutes
  locationLabel?: string;
  currentStartTime: string; // Tracks where next block should start
}

/**
 * Allocation state for tracking progress through gaps
 */
interface AllocationState {
  gaps: MutableGap[];
  currentGapIndex: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PERMUTATION_LIMIT = 8;
const TOLERANCE = 1e-6;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate score for sorting (need + importance)
 */
function calculateScore(suggestion: Suggestion): number {
  return Math.min(suggestion.need, 1.0) + Math.min(suggestion.importance, 1.0);
}

/**
 * Convert HH:mm time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:mm time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = Math.floor(minutes % 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Add minutes to a time string, returning new time string
 */
function addMinutesToTime(time: string, minutesToAdd: number): string {
  return minutesToTime(timeToMinutes(time) + minutesToAdd);
}

// ============================================================================
// PARTITIONING
// ============================================================================

/**
 * Partition suggestions into mandatory (need >= 1.0) and optional
 */
export function partitionSuggestions(suggestions: Suggestion[]): {
  mandatory: Suggestion[];
  optional: Suggestion[];
} {
  const mandatory: Suggestion[] = [];
  const optional: Suggestion[] = [];

  for (const s of suggestions) {
    if (s.need >= MANDATORY_THRESHOLD - TOLERANCE) {
      mandatory.push(s);
    } else {
      optional.push(s);
    }
  }

  return { mandatory, optional };
}

// ============================================================================
// SORTING
// ============================================================================

/**
 * Sort suggestions by priority (score = need + importance) descending
 */
export function sortByPriority(suggestions: Suggestion[]): Suggestion[] {
  return [...suggestions].sort((a, b) => calculateScore(b) - calculateScore(a));
}

// ============================================================================
// KNAPSACK SELECTION
// ============================================================================

/**
 * Select optimal subset of suggestions using 0/1 Knapsack DP
 * Maximizes total score under capacity constraint
 *
 * @param suggestions - Candidate suggestions
 * @param capacityMinutes - Available time capacity
 * @param resolutionMinutes - Discretization resolution (default 1 minute)
 * @returns Selected suggestions sorted by score descending
 */
export function knapsackSelect(
  suggestions: Suggestion[],
  capacityMinutes: number,
  resolutionMinutes: number = 1.0,
): Suggestion[] {
  if (capacityMinutes <= TOLERANCE || suggestions.length === 0) {
    return [];
  }

  const items = [...suggestions];
  const n = items.length;

  // Convert to integer DP units
  const W = Math.max(0, Math.round(capacityMinutes / resolutionMinutes));
  const weights = items.map((s) =>
    Math.max(1, Math.round(s.duration / resolutionMinutes)),
  );
  const values = items.map((s) => calculateScore(s));

  // DP table: dp[w] = max score achievable with capacity w
  const dp: number[] = new Array(W + 1).fill(0);
  // Track which items are taken at each capacity
  const take: boolean[][] = Array.from({ length: n }, () =>
    new Array(W + 1).fill(false),
  );

  // Fill DP table
  for (let i = 0; i < n; i++) {
    const wi = weights[i];
    const vi = values[i];
    // Iterate backwards to avoid reusing items
    for (let w = W; w >= wi; w--) {
      const candidate = dp[w - wi] + vi;
      if (candidate > dp[w]) {
        dp[w] = candidate;
        take[i][w] = true;
      }
    }
  }

  // Backtrack to find chosen items
  let w = W;
  const chosen: Suggestion[] = [];
  for (let i = n - 1; i >= 0; i--) {
    if (take[i][w]) {
      chosen.push(items[i]);
      w -= weights[i];
    }
  }

  // Sort by score descending
  return chosen.sort((a, b) => calculateScore(b) - calculateScore(a));
}

// ============================================================================
// PERMUTATION ENUMERATION
// ============================================================================

/**
 * Generate all permutations of an array
 */
function* permutations<T>(arr: T[]): Generator<T[]> {
  if (arr.length <= 1) {
    yield [...arr];
    return;
  }

  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [arr[i], ...perm];
    }
  }
}

/**
 * Evaluate a specific ordering of suggestions against gaps
 * Returns number of suggestions that can be scheduled (higher = better)
 *
 * Since we don't have travel time, we just check if suggestions fit in order
 */
function evaluateOrder(
  order: Suggestion[],
  gaps: MutableGap[],
): { schedulable: number; totalDuration: number } {
  // Clone gaps for simulation
  const simGaps = gaps.map((g) => ({ ...g }));
  let gapIndex = 0;
  let schedulable = 0;
  let totalDuration = 0;

  for (const suggestion of order) {
    // Find a gap that can fit this suggestion
    let found = false;
    for (let i = gapIndex; i < simGaps.length; i++) {
      const gap = simGaps[i];
      if (gap.remaining >= suggestion.duration - TOLERANCE) {
        // Check location compatibility
        const tempGap: Gap = {
          gapId: gap.gapId,
          start: gap.currentStartTime,
          end: gap.end,
          duration: gap.remaining,
          locationLabel: gap.locationLabel as any,
        };
        if (canFit(suggestion, tempGap)) {
          // Can fit here
          gap.remaining -= suggestion.duration;
          gap.currentStartTime = addMinutesToTime(
            gap.currentStartTime,
            suggestion.duration,
          );
          schedulable++;
          totalDuration += suggestion.duration;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      // This suggestion can't be scheduled
      break;
    }
  }

  return { schedulable, totalDuration };
}

/**
 * Find the best ordering of suggestions via permutation enumeration
 *
 * @param suggestions - Suggestions to order
 * @param gaps - Available gaps
 * @param permutationLimit - Max suggestions to permute (factorial explosion protection)
 * @returns Best order and number of permutations evaluated
 */
export function enumerateBestOrder(
  suggestions: Suggestion[],
  gaps: MutableGap[],
  permutationLimit: number = DEFAULT_PERMUTATION_LIMIT,
): { order: Suggestion[]; permutationsChecked: number } {
  const n = suggestions.length;

  if (n === 0) {
    return { order: [], permutationsChecked: 0 };
  }

  // If too many suggestions, just use priority sort (can't enumerate)
  if (n > permutationLimit) {
    console.warn(
      `Permutation limit exceeded: ${n} > ${permutationLimit}. Using priority sort.`,
    );
    return { order: sortByPriority(suggestions), permutationsChecked: 0 };
  }

  let bestOrder: Suggestion[] = [...suggestions];
  let bestScore = -1;
  let permutationsChecked = 0;

  for (const perm of permutations(suggestions)) {
    permutationsChecked++;
    const { schedulable, totalDuration } = evaluateOrder(perm, gaps);
    // Score: prioritize more schedulable, then more duration
    const score = schedulable * 10000 + totalDuration;
    if (score > bestScore) {
      bestScore = score;
      bestOrder = perm;
    }
  }

  return { order: bestOrder, permutationsChecked };
}

// ============================================================================
// GAP ALLOCATION
// ============================================================================

/**
 * Create mutable gaps from immutable gaps
 */
function createMutableGaps(gaps: Gap[]): MutableGap[] {
  return gaps.map((g) => ({
    gapId: g.gapId,
    start: g.start,
    end: g.end,
    duration: g.duration,
    remaining: g.duration,
    locationLabel: g.locationLabel,
    currentStartTime: g.start,
  }));
}

/**
 * Calculate total remaining capacity across all gaps
 */
function totalRemainingCapacity(gaps: MutableGap[]): number {
  return gaps.reduce((sum, g) => sum + g.remaining, 0);
}

/**
 * Assign an ordered list of suggestions to gaps
 * Returns scheduled blocks and updated gaps
 */
export function assignOrderToGaps(
  orderedSuggestions: Suggestion[],
  gaps: MutableGap[],
): { blocks: ScheduledBlock[]; dropped: Suggestion[] } {
  const blocks: ScheduledBlock[] = [];
  const dropped: Suggestion[] = [];

  for (const suggestion of orderedSuggestions) {
    let allocated = false;

    for (const gap of gaps) {
      if (gap.remaining < suggestion.duration - TOLERANCE) {
        continue;
      }

      // Check location compatibility
      const tempGap: Gap = {
        gapId: gap.gapId,
        start: gap.currentStartTime,
        end: gap.end,
        duration: gap.remaining,
        locationLabel: gap.locationLabel as any,
      };

      if (!canFit(suggestion, tempGap)) {
        continue;
      }

      // Allocate!
      const startTime = gap.currentStartTime;
      const endTime = addMinutesToTime(startTime, suggestion.duration);

      blocks.push({
        suggestionId: suggestion.id,
        memoId: suggestion.memoId,
        gapId: gap.gapId,
        startTime,
        endTime,
        duration: suggestion.duration,
      });

      // Update gap
      gap.remaining -= suggestion.duration;
      gap.currentStartTime = endTime;
      allocated = true;
      break;
    }

    if (!allocated) {
      dropped.push(suggestion);
    }
  }

  return { blocks, dropped };
}

// ============================================================================
// MAIN SCHEDULER
// ============================================================================

/**
 * Schedule suggestions into gaps
 *
 * Algorithm:
 * 1. Partition into mandatory vs optional
 * 2. Sort mandatory by priority → permute → assign
 * 3. Calculate remaining capacity
 * 4. Knapsack select optimal optional subset
 * 5. Permute selected optional → assign
 * 6. Return results
 *
 * @param suggestions - All suggestions to schedule
 * @param gaps - Available gaps (should be time-sorted)
 * @param options - Scheduler options
 */
export function scheduleSuggestions(
  suggestions: Suggestion[],
  gaps: Gap[],
  options: {
    permutationLimit?: number;
    resolutionMinutes?: number;
  } = {},
): ScheduleResult {
  const {
    permutationLimit = DEFAULT_PERMUTATION_LIMIT,
    resolutionMinutes = 1.0,
  } = options;

  // Initialize result
  const result: ScheduleResult = {
    scheduled: [],
    dropped: [],
    totalScheduledMinutes: 0,
    totalDroppedMinutes: 0,
    permutationsEvaluated: 0,
    mandatoryDropped: [],
  };

  // Handle empty inputs
  if (gaps.length === 0) {
    result.dropped = [...suggestions];
    result.totalDroppedMinutes = suggestions.reduce(
      (sum, s) => sum + s.duration,
      0,
    );
    result.mandatoryDropped = suggestions.filter(
      (s) => s.need >= MANDATORY_THRESHOLD - TOLERANCE,
    );
    return result;
  }

  // Create mutable gaps
  const mutableGaps = createMutableGaps(gaps);

  // Partition suggestions
  const { mandatory, optional } = partitionSuggestions(suggestions);

  // =========================================================================
  // PHASE 1: Schedule mandatory suggestions
  // =========================================================================
  if (mandatory.length > 0) {
    // Find best order via permutation
    const { order: mandatoryOrder, permutationsChecked } = enumerateBestOrder(
      sortByPriority(mandatory),
      mutableGaps,
      permutationLimit,
    );
    result.permutationsEvaluated += permutationsChecked;

    // Assign to gaps
    const { blocks, dropped } = assignOrderToGaps(mandatoryOrder, mutableGaps);
    result.scheduled.push(...blocks);
    result.mandatoryDropped.push(...dropped);
    result.dropped.push(...dropped);
  }

  // =========================================================================
  // PHASE 2: Schedule optional suggestions
  // =========================================================================
  if (optional.length > 0) {
    // Calculate remaining capacity
    const remainingCapacity = totalRemainingCapacity(mutableGaps);

    if (remainingCapacity > TOLERANCE) {
      // Use knapsack to select optimal subset
      const selected = knapsackSelect(
        optional,
        remainingCapacity,
        resolutionMinutes,
      );

      if (selected.length > 0) {
        // Find best order via permutation
        const { order: optionalOrder, permutationsChecked } =
          enumerateBestOrder(selected, mutableGaps, permutationLimit);
        result.permutationsEvaluated += permutationsChecked;

        // Assign to gaps
        const { blocks, dropped } = assignOrderToGaps(
          optionalOrder,
          mutableGaps,
        );
        result.scheduled.push(...blocks);
        result.dropped.push(...dropped);
      }

      // Add unselected optional suggestions to dropped
      const selectedIds = new Set(selected.map((s) => s.id));
      for (const s of optional) {
        if (!selectedIds.has(s.id)) {
          result.dropped.push(s);
        }
      }
    } else {
      // No capacity left, drop all optional
      result.dropped.push(...optional);
    }
  }

  // Calculate totals
  result.totalScheduledMinutes = result.scheduled.reduce(
    (sum, b) => sum + b.duration,
    0,
  );
  result.totalDroppedMinutes = result.dropped.reduce(
    (sum, s) => sum + s.duration,
    0,
  );

  // Sort scheduled blocks by time
  result.scheduled.sort((a, b) => {
    const gapCompare = a.gapId.localeCompare(b.gapId);
    if (gapCompare !== 0) return gapCompare;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  return result;
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { calculateScore, timeToMinutes, minutesToTime, addMinutesToTime };
