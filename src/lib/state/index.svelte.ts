/**
 * @fileoverview Store Index - Svelte 5 Reactive Classes
 *
 * Central export file for all reactive state classes.
 * This provides a single import point for components to access the state architecture.
 *
 * Migration from writable stores to Svelte 5 reactive classes ($state).
 *
 * Usage:
 *   import { uiState, dataState, calendarState } from "$lib/state/index.svelte.js";
 *
 *   // In template: {uiState.currentView}
 *   // In script: uiState.setView("calendar")
 */

// ============================================================================
// Core State Classes
// ============================================================================

// UI State
export { uiState, type AppView } from "./ui.svelte.js";

// Data State (memos, suggestion logs, selected date)
export { dataState, type SimpleMemo } from "./data.svelte.js";

// Toast State
export { toastState, type Toast, type ToastType } from "./toast.svelte.js";

// Calendar State
export { calendarState, type ExpandedOccurrence } from "./calendar.svelte.js";

// Event Form State
export {
  eventFormState,
  type EventFormData,
  type EventFormErrors,
} from "./forms/eventForm.svelte.js";

// Memo State
export {
  memoState,
  type SimpleMemo as MemoType,
  type MemoFormData,
  type MemoFormErrors,
} from "./forms/memoForm.svelte.js";

// ============================================================================
// Utility Exports
// ============================================================================

export { formatDate, formatDateTime } from "../utils/date-utils.js";

// ============================================================================
// Legacy Store Compatibility (will be removed after migration)
// ============================================================================

// These re-exports maintain backward compatibility during migration.
// Components should gradually migrate to use the new reactive classes.

// Re-export from legacy stores for gradual migration
export {
  // Gap stores (not yet migrated)
  dayBoundaries,
  events as gapEvents,
  gapFinder,
  gaps,
  gapStats,
  dayBoundaryActions,
} from "./gaps.js";

// Schedule store (not yet migrated)
export {
  scheduleResult,
  isScheduleLoading,
  scheduleError,
  lastPipelineSummary,
  lastScheduleTime,
  scheduledBlocks,
  pendingSuggestions,
  acceptedSuggestions,
  skippedSuggestionIds,
  droppedSuggestions,
  droppedMandatory,
  nextScheduledBlock,
  hasScheduledTasks,
  totalScheduledMinutes,
  hasMandatoryDropped,
  scheduleActions,
  findBlockByMemoId,
  isMemoScheduled,
  getBlocksForGap,
  type AcceptedSuggestion,
  type PendingSuggestion,
} from "./schedule.js";

// Task actions (not yet migrated)
export { taskActions, tasks } from "./actions/taskActions.js";

// Task form (not yet migrated)
export {
  taskForm,
  taskFormErrors,
  isTaskFormSubmitting,
  isTaskFormOpen,
  isTaskFormValid,
  showDeadlineField,
  showRecurrenceFields,
  taskFormActions,
  type TaskFormData,
  type TaskFormErrors as TaskFormErrorsType,
} from "./forms/taskForm.js";

// Timezone (not yet migrated)
export { timezone, timezoneActions, timezoneLabel } from "./timezone.js";

// Devtools (not yet migrated)
export { devtools, devtoolsEnabled } from "./devtools.js";
