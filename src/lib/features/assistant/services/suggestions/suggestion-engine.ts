/**
 * Suggestion Engine
 *
 * Orchestrates the entire suggestion pipeline:
 * 1. Filter active memos (not completed)
 * 2. Reset period counters if needed (for routines)
 * 3. Enrich memos with LLM (fill missing fields)
 * 4. Score memos → generate Suggestions
 * 5. Fetch and enrich gaps with location
 * 6. Schedule suggestions into gaps
 *
 * This is a pure service module - no store coupling.
 * Store integration happens in Step 3.2.
 *
 * @example
 * ```ts
 * const engine = createEngine();
 * const schedule = await engine.generateSchedule(memos, gaps);
 * ```
 */

import type { Memo, Gap, Suggestion } from "$lib/types.ts";

// Import from sibling modules
import {
  enrichMemo,
  enrichMemos,
  type LLMEnrichmentConfig,
} from "./llm-enrichment.ts";
import { resetPeriodIfNeeded, incrementCompletion } from "./period-utils.ts";
import { createSuggestionFromMemo } from "./suggestion-scoring.ts";
import {
  scheduleSuggestions,
  type ScheduleResult,
  type DurationExtensionConfig,
  DEFAULT_EXTENSION_CONFIG,
} from "./suggestion-scheduler.ts";
import {
  enrichGapsWithLocation,
  DEFAULT_CONFIG as DEFAULT_GAP_CONFIG,
  type EnrichableEvent,
  type EnrichmentConfig as GapEnrichmentConfig,
} from "./gap-enrichment.ts";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for the suggestion engine
 */
export interface EngineConfig {
  /** LLM enrichment config (optional - falls back to defaults) */
  llm?: Partial<LLMEnrichmentConfig>;

  /** Gap enrichment config (optional) */
  gapEnrichment?: Partial<GapEnrichmentConfig>;

  /** Scheduler config (optional) */
  scheduler?: {
    permutationLimit?: number;
    resolutionMinutes?: number;
  };

  /**
   * Duration extension config (optional)
   * Controls how suggestion durations are extended when extra gap time is available
   *
   * - enabled: Whether to extend durations (default: true)
   * - minExtensionMinutes: Minimum extra gap time before extending (default: 15)
   * - maxExtensionFactor: Maximum multiplier for base duration (default: 2.0)
   * - extensionStepMinutes: Extension granularity (default: 15)
   */
  durationExtension?: Partial<DurationExtensionConfig>;

  /** Enable LLM enrichment (default: true, but gracefully skips if not configured) */
  enableLLMEnrichment?: boolean;

  /** Current time provider (useful for testing) */
  getCurrentTime?: () => Date;
}

/**
 * Options for schedule generation
 */
export interface GenerateScheduleOptions {
  /** Override current time (for testing) */
  currentTime?: Date;

  /** Events for location enrichment (optional) */
  events?: EnrichableEvent[];

  /** Skip LLM enrichment for this call */
  skipLLMEnrichment?: boolean;
}

/**
 * Input for marking a session as complete
 */
export interface SessionCompleteInput {
  /** ID of the memo that was worked on */
  memoId: string;

  /** Minutes spent in this session */
  minutesSpent: number;

  /** Current time (optional, defaults to now) */
  currentTime?: Date;
}

/**
 * Result of marking a session complete
 */
export interface SessionCompleteResult {
  /** Updated memo */
  memo: Memo;

  /** Whether the memo is now fully completed */
  isNowComplete: boolean;

  /** For routines: whether goal for period was just reached */
  goalReached?: boolean;
}

/**
 * Summary of engine pipeline execution
 */
export interface PipelineSummary {
  /** Number of memos processed */
  memosProcessed: number;

  /** Number of active (non-completed) memos */
  activeMemos: number;

  /** Number of suggestions generated */
  suggestionsGenerated: number;

  /** Number of gaps available */
  gapsAvailable: number;

  /** Number of suggestions scheduled */
  suggestionsScheduled: number;

  /** Execution time in ms */
  executionTimeMs: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_ENGINE_CONFIG: Required<EngineConfig> = {
  llm: {},
  gapEnrichment: {},
  scheduler: {},
  durationExtension: DEFAULT_EXTENSION_CONFIG,
  enableLLMEnrichment: true,
  getCurrentTime: () => new Date(),
};

// ============================================================================
// Helper Functions (Pure, Testable)
// ============================================================================

/**
 * Filter memos to only active ones (not completed)
 *
 * @param memos - All memos
 * @returns Only memos where completionState !== "completed"
 */
export function filterActiveMemos(memos: Memo[]): Memo[] {
  return memos.filter((memo) => memo.status.completionState !== "completed");
}

/**
 * Reset period counters for memos if new period has started
 * (e.g., new day/week/month for routines)
 *
 * @param memos - Memos to process
 * @param currentTime - Current time for period checking
 * @returns Memos with reset counters where needed
 */
export function resetMemoPeriodsIfNeeded(
  memos: Memo[],
  currentTime: Date,
): Memo[] {
  return memos.map((memo) => resetPeriodIfNeeded(memo, currentTime));
}

/**
 * Convert memos to suggestions by scoring each one
 *
 * @param memos - Enriched memos to score
 * @param currentTime - Current time for need calculation
 * @returns Suggestion for each memo
 */
export function memosToSuggestions(
  memos: Memo[],
  currentTime: Date,
): Suggestion[] {
  return memos.map((memo) => createSuggestionFromMemo(memo, currentTime));
}

/**
 * Check if a memo is now complete based on time spent
 *
 * @param memo - Memo to check
 * @returns true if timeSpent >= totalDurationExpected
 */
export function isMemoComplete(memo: Memo): boolean {
  const totalExpected = memo.totalDurationExpected ?? 60; // Default 60 min
  return memo.status.timeSpentMinutes >= totalExpected;
}

/**
 * Check if routine goal is reached for current period
 *
 * @param memo - Routine memo to check
 * @returns true if completionsThisPeriod >= recurrenceGoal.count
 */
export function isRoutineGoalReached(memo: Memo): boolean {
  if (memo.type !== "ルーティン" || !memo.recurrenceGoal) {
    return false;
  }
  const completions = memo.status.completionsThisPeriod ?? 0;
  return completions >= memo.recurrenceGoal.count;
}

// ============================================================================
// Suggestion Engine Class
// ============================================================================

/**
 * Main orchestrator for the suggestion system
 *
 * Provides a clean API for:
 * - Generating schedules from memos and gaps
 * - Tracking session completion
 * - Managing memo lifecycle
 */
export class SuggestionEngine {
  private config: Required<EngineConfig>;

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Generate a schedule from memos and gaps
   *
   * Full pipeline:
   * 1. Filter active memos
   * 2. Reset period counters
   * 3. Enrich with LLM (if enabled)
   * 4. Score memos → Suggestions
   * 5. Enrich gaps with location
   * 6. Schedule suggestions into gaps
   *
   * @param memos - All memos (will filter active ones)
   * @param gaps - Available time gaps
   * @param options - Optional overrides
   * @returns Schedule result with summary
   */
  async generateSchedule(
    memos: Memo[],
    gaps: Gap[],
    options: GenerateScheduleOptions = {},
  ): Promise<{ schedule: ScheduleResult; summary: PipelineSummary }> {
    const startTime = performance.now();
    const currentTime = options.currentTime ?? this.config.getCurrentTime();

    // Step 1: Filter active memos
    const activeMemos = filterActiveMemos(memos);

    // Step 2: Reset period counters if needed
    const memosWithResetPeriods = resetMemoPeriodsIfNeeded(
      activeMemos,
      currentTime,
    );

    // Step 3: LLM enrichment (optional)
    let enrichedMemos: Memo[];
    if (this.config.enableLLMEnrichment && !options.skipLLMEnrichment) {
      enrichedMemos = await enrichMemos(memosWithResetPeriods, this.config.llm);
    } else {
      enrichedMemos = memosWithResetPeriods;
    }

    // Step 4: Score memos → Suggestions
    const suggestions = memosToSuggestions(enrichedMemos, currentTime);

    // Step 5: Enrich gaps with location (if events provided)
    let enrichedGaps: Gap[];
    if (options.events && options.events.length > 0) {
      // Merge partial config with defaults
      const gapConfig: GapEnrichmentConfig = {
        ...DEFAULT_GAP_CONFIG,
        ...this.config.gapEnrichment,
      };
      enrichedGaps = enrichGapsWithLocation(gaps, options.events, gapConfig);
    } else {
      enrichedGaps = gaps;
    }

    // Step 6: Schedule suggestions into gaps
    const schedule = scheduleSuggestions(suggestions, enrichedGaps, {
      ...this.config.scheduler,
      durationExtension: this.config.durationExtension,
    });

    // Build summary
    const endTime = performance.now();
    const summary: PipelineSummary = {
      memosProcessed: memos.length,
      activeMemos: activeMemos.length,
      suggestionsGenerated: suggestions.length,
      gapsAvailable: gaps.length,
      suggestionsScheduled: schedule.scheduled.length,
      executionTimeMs: Math.round(endTime - startTime),
    };

    return { schedule, summary };
  }

  /**
   * Mark a session as complete and update memo accordingly
   *
   * Updates:
   * - timeSpentMinutes += minutesSpent
   * - lastActivity = now
   * - completionsThisPeriod++ (for routines)
   * - completionState = "completed" if done
   *
   * @param memo - The memo that was worked on
   * @param input - Session details
   * @returns Updated memo and status flags
   */
  markSessionComplete(
    memo: Memo,
    input: SessionCompleteInput,
  ): SessionCompleteResult {
    const currentTime = input.currentTime ?? this.config.getCurrentTime();

    // Update time spent
    let updatedMemo: Memo = {
      ...memo,
      lastActivity: currentTime,
      status: {
        ...memo.status,
        timeSpentMinutes: memo.status.timeSpentMinutes + input.minutesSpent,
        completionState:
          memo.status.completionState === "not_started"
            ? "in_progress"
            : memo.status.completionState,
      },
    };

    // For routines: increment completion count
    if (updatedMemo.type === "ルーティン") {
      updatedMemo = incrementCompletion(updatedMemo, currentTime);
    }

    // Check if now complete
    const isNowComplete = isMemoComplete(updatedMemo);
    if (isNowComplete) {
      updatedMemo = {
        ...updatedMemo,
        status: {
          ...updatedMemo.status,
          completionState: "completed",
        },
      };
    }

    // Check if routine goal reached
    const goalReached =
      updatedMemo.type === "ルーティン"
        ? isRoutineGoalReached(updatedMemo)
        : undefined;

    return {
      memo: updatedMemo,
      isNowComplete,
      goalReached,
    };
  }

  /**
   * Enrich a single memo with LLM suggestions
   *
   * Useful for enriching on memo creation/update.
   *
   * @param memo - Memo to enrich
   * @returns Enriched memo (or original if LLM disabled/fails)
   */
  async enrichMemo(memo: Memo): Promise<Memo> {
    if (!this.config.enableLLMEnrichment) {
      return memo;
    }
    return enrichMemo(memo, this.config.llm);
  }

  /**
   * Generate suggestions without scheduling
   *
   * Useful for previewing what suggestions would be generated.
   *
   * @param memos - Memos to score
   * @param currentTime - Optional time override
   * @returns Suggestions sorted by priority
   */
  generateSuggestions(memos: Memo[], currentTime?: Date): Suggestion[] {
    const time = currentTime ?? this.config.getCurrentTime();
    const activeMemos = filterActiveMemos(memos);
    const withResetPeriods = resetMemoPeriodsIfNeeded(activeMemos, time);
    return memosToSuggestions(withResetPeriods, time);
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<EngineConfig>> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new suggestion engine instance
 *
 * @example
 * ```ts
 * // Default configuration
 * const engine = createEngine();
 *
 * // Custom configuration
 * const engine = createEngine({
 *   enableLLMEnrichment: false,
 *   scheduler: { permutationLimit: 100 }
 * });
 * ```
 *
 * @param config - Optional configuration overrides
 * @returns New SuggestionEngine instance
 */
export function createEngine(
  config: Partial<EngineConfig> = {},
): SuggestionEngine {
  return new SuggestionEngine(config);
}

// ============================================================================
// Convenience Exports
// ============================================================================

// Re-export commonly used types for convenience
export type { ScheduleResult, ScheduledBlock } from "./suggestion-scheduler.ts";
