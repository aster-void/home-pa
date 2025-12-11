/**
 * @fileoverview State Index - Compatibility Layer
 *
 * Provides backward-compatible exports from Svelte 5 reactive classes.
 * This bridges the gap between old writable store APIs and new reactive classes.
 *
 * MIGRATION NOTE: Import from this file for legacy compatibility.
 * For new code, import directly from the .svelte.ts files.
 */

import type { Event, SuggestionLog, ViewMode } from "../types.ts";
import type { AppView } from "./ui.svelte.ts";
import type { ExpandedOccurrence } from "../features/calendar/state/calendar.svelte.ts";
import type { SimpleMemo } from "./data.svelte.ts";
import type {
  EventFormData,
  EventFormErrors,
} from "../features/calendar/state/eventForm.svelte.ts";

// ============================================================================
// Re-export from Svelte 5 reactive modules
// ============================================================================

export { uiState, type AppView } from "./ui.svelte.ts";

export { dataState, type SimpleMemo } from "./data.svelte.ts";

export { toastState, type Toast, type ToastType } from "./toast.svelte.ts";

export {
  calendarState,
  type ExpandedOccurrence,
} from "../features/calendar/state/calendar.svelte.ts";

export {
  eventFormState,
  type EventFormData,
  type EventFormErrors,
} from "../features/calendar/state/eventForm.svelte.ts";

export {
  memoState,
  type SimpleMemo as MemoType,
  type MemoFormData,
  type MemoFormErrors,
} from "../features/memo/state/memoForm.svelte.ts";

// ============================================================================
// State instances - direct access (no store wrappers)
// ============================================================================

import { uiState } from "./ui.svelte.ts";
import { dataState } from "./data.svelte.ts";
import { calendarState } from "../features/calendar/state/calendar.svelte.ts";
import { toastState } from "./toast.svelte.ts";
import { eventFormState } from "../features/calendar/state/eventForm.svelte.ts";

// Calendar actions wrapper
export const calendarActions = {
  fetchEvents: calendarState.fetchEvents.bind(calendarState),
  createEvent: calendarState.createEvent.bind(calendarState),
  updateEvent: calendarState.updateEvent.bind(calendarState),
  deleteEvent: calendarState.deleteEvent.bind(calendarState),
  importICS: calendarState.importICS.bind(calendarState),
  getExportUrl: calendarState.getExportUrl.bind(calendarState),
  expandRecurringEvents:
    calendarState.expandRecurringEvents.bind(calendarState),
  clear: calendarState.clear.bind(calendarState),
};

// Event form actions wrapper
export const eventFormActions = {
  updateField: eventFormState.updateField.bind(eventFormState),
  updateFields: (updates: Partial<EventFormData>) => {
    for (const [key, value] of Object.entries(updates)) {
      eventFormState.updateField(
        key as keyof EventFormData,
        value as EventFormData[keyof EventFormData],
      );
    }
  },
  setFormForEditing: eventFormState.setForEditing.bind(eventFormState),
  resetForm: eventFormState.reset.bind(eventFormState),
  setCreateMode: eventFormState.setCreateMode.bind(eventFormState),
  initializeForNewEvent:
    eventFormState.initializeForNewEvent.bind(eventFormState),
  validate: eventFormState.validate.bind(eventFormState),
  setFieldError: eventFormState.setFieldError.bind(eventFormState),
  clearFieldError: eventFormState.clearFieldError.bind(eventFormState),
  clearAllErrors: eventFormState.clearAllErrors.bind(eventFormState),
  setGeneralError: eventFormState.setGeneralError.bind(eventFormState),
  setSubmitting: eventFormState.setSubmitting.bind(eventFormState),
  switchTimeLabel: eventFormState.switchTimeLabel.bind(eventFormState),
};

// UI actions wrapper
export const uiActions = {
  setView: uiState.setView.bind(uiState),
  setViewMode: uiState.setViewMode.bind(uiState),
  toggleMemo: uiState.toggleMemo.bind(uiState),
  setMemoOpen: uiState.setMemoOpen.bind(uiState),
  showEventForm: uiState.openEventForm.bind(uiState),
  hideEventForm: uiState.closeEventForm.bind(uiState),
  toggleEventForm: uiState.toggleEventForm.bind(uiState),
  showTimelinePopup: uiState.openTimelinePopup.bind(uiState),
  hideTimelinePopup: uiState.closeTimelinePopup.bind(uiState),
  setCurrentSuggestion: uiState.setCurrentSuggestion.bind(uiState),
  clearCurrentSuggestion: uiState.clearCurrentSuggestion.bind(uiState),
  setLoading: uiState.setLoading.bind(uiState),
  setError: uiState.setError.bind(uiState),
  clearError: uiState.clearError.bind(uiState),
  setSelectedDate: dataState.setSelectedDate.bind(dataState),
  navigateToToday: dataState.goToToday.bind(dataState),
  navigateDate: (days: number) => {
    const current = dataState.selectedDate;
    const newDate = new Date(current);
    newDate.setDate(newDate.getDate() + days);
    dataState.setSelectedDate(newDate);
  },
};

// Event actions - imports from actions file
export { eventActions } from "../features/calendar/state/eventActions.ts";

// Toast actions wrapper
export const toasts = {
  show: toastState.show.bind(toastState),
  success: toastState.success.bind(toastState),
  error: toastState.error.bind(toastState),
  info: toastState.info.bind(toastState),
  dismiss: toastState.dismiss.bind(toastState),
  clear: toastState.clear.bind(toastState),
};

// Memo operations wrapper
export const memoOperations = {
  create: (text: string) => dataState.createMemo(text),
  update: (id: string, text: string) => dataState.updateMemo(id, text),
  delete: (id: string) => dataState.deleteMemo(id),
  get: (id: string) => dataState.getMemo(id),
};

// Suggestion log operations wrapper
export const suggestionLogOperations = {
  create: (log: SuggestionLog) => dataState.createSuggestionLog(log),
};

// Clear all data
export const clearAllData = () => {
  dataState.clearAll();
  calendarState.clear();
  uiState.reset();
};

// ============================================================================
// Re-exports from other state files
// ============================================================================

export {
  dayBoundaries,
  events as gapEvents,
  gapFinder,
  gaps,
  gapStats,
  dayBoundaryActions,
} from "../features/assistant/state/gaps.svelte.ts";

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
} from "../features/assistant/state/schedule.ts";

export { taskActions, tasks } from "../features/tasks/state/taskActions.ts";

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
} from "../features/tasks/state/taskForm.ts";

export { timezone, timezoneActions, timezoneLabel } from "./timezone.ts";
export { devtools, devtoolsEnabled } from "./devtools.ts";
export { formatDate, formatDateTime } from "../utils/date-utils.ts";
