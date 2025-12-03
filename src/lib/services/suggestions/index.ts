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
} from "./gap-enrichment.js";

export type { EnrichableEvent, EnrichmentConfig } from "./gap-enrichment.js";

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
} from "./period-utils.js";

export type { Period } from "./period-utils.js";

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
} from "./suggestion-scoring.js";

export type { ScoreInput, ScoreOutput } from "./suggestion-scoring.js";

// Location Matching
export {
  isLocationCompatible,
  hasSufficientDuration,
  canFitInGap,
  canFit,
  findCompatibleGaps,
  findFirstCompatibleGap,
  hasCompatibleGap,
} from "./location-matching.js";

export type { CompatibilityResult } from "./location-matching.js";

// Suggestion Scheduler
export {
  partitionSuggestions,
  sortByPriority,
  knapsackSelect,
  enumerateBestOrder,
  assignOrderToGaps,
  scheduleSuggestions,
  calculateScore,
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
} from "./suggestion-scheduler.js";

export type { ScheduledBlock, ScheduleResult } from "./suggestion-scheduler.js";

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
} from "./llm-enrichment.js";

export type {
  EnrichmentResult,
  LLMEnrichmentConfig,
} from "./llm-enrichment.js";

// Suggestion Engine (Main Orchestrator)
export {
  SuggestionEngine,
  createEngine,
  filterActiveMemos,
  resetMemoPeriodsIfNeeded,
  memosToSuggestions,
  isMemoComplete,
  isRoutineGoalReached,
} from "./suggestion-engine.js";

export type {
  EngineConfig,
  GenerateScheduleOptions,
  SessionCompleteInput,
  SessionCompleteResult,
  PipelineSummary,
} from "./suggestion-engine.js";
