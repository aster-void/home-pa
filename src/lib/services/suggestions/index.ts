/**
 * @fileoverview Suggestions Module Index
 *
 * Central export for all suggestion-related services.
 * Import from this index for clean imports.
 */

// Gap Enrichment
export {
  enrichGapsWithLocation,
  findPrecedingEvent,
  findFollowingEvent,
  deriveLocationLabel,
  DEFAULT_CONFIG,
} from "./gap-enrichment.ts";

export type { EnrichableEvent, EnrichmentConfig } from "./gap-enrichment.ts";

// Period Tracking
export {
  getPeriodProgress,
  isNewPeriod,
  resetPeriodIfNeeded,
  incrementCompletion,
  isSameDay,
  isSameWeek,
  isSameMonth,
  getWeekNumber,
  getDaysInMonth,
} from "./period-utils.ts";

export type { Period } from "./period-utils.ts";

// Suggestion Scoring
export {
  calculateDeadlineNeed,
  calculateBacklogNeed,
  calculateRoutineNeed,
  calculateNeed,
  importanceToNumber,
  calculateImportance,
  clamp,
  selectDuration,
  scoreMemo,
  memoToSuggestion,
  createSuggestionFromMemo,
  isMandatory,
  calculatePriority,
  NEED_RANGES,
  MANDATORY_THRESHOLD,
} from "./suggestion-scoring.ts";

export type { ScoreInput, ScoreOutput } from "./suggestion-scoring.ts";

// Location Matching
export {
  isLocationCompatible,
  hasSufficientDuration,
  canFitInGap,
  canFit,
  findCompatibleGaps,
  findFirstCompatibleGap,
  hasCompatibleGap,
} from "./location-matching.ts";

export type { CompatibilityResult } from "./location-matching.ts";

// Suggestion Scheduler
export {
  partitionSuggestions,
  sortByPriority,
  knapsackSelect,
  enumerateBestOrder,
  assignOrderToGaps,
  scheduleSuggestions,
  calculateScore,
  calculateExtendedDuration,
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  DEFAULT_EXTENSION_CONFIG,
} from "./suggestion-scheduler.ts";

export type {
  ScheduledBlock,
  ScheduleResult,
  DurationExtensionConfig,
  SchedulerOptions,
} from "./suggestion-scheduler.ts";

// LLM Enrichment
export {
  enrichMemo,
  enrichMemos,
  getFallbackEnrichment,
  buildPrompt,
  parseResponse,
  isGeminiConfigured,
  clearEnrichmentCache,
  invalidateCacheEntry,
  getCacheStats,
} from "./llm-enrichment.ts";

export type {
  EnrichmentResult,
  LLMEnrichmentConfig,
} from "./llm-enrichment.ts";

// Suggestion Engine (Main Orchestrator)
export {
  SuggestionEngine,
  createEngine,
  filterActiveMemos,
  resetMemoPeriodsIfNeeded,
  memosToSuggestions,
  isMemoComplete,
  isRoutineGoalReached,
} from "./suggestion-engine.ts";

export type {
  EngineConfig,
  GenerateScheduleOptions,
  SessionCompleteInput,
  SessionCompleteResult,
  PipelineSummary,
} from "./suggestion-engine.ts";
