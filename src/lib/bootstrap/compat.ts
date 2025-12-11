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
// Legacy store compatibility wrappers
// ============================================================================

import { uiState } from "./ui.svelte.ts";
import { dataState } from "./data.svelte.ts";
import { calendarState } from "../features/calendar/state/calendar.svelte.ts";
import { toastState } from "./toast.svelte.ts";
import { eventFormState } from "../features/calendar/state/eventForm.svelte.ts";

// UI State - writable store wrappers
export const currentView = {
  subscribe: (fn: (value: string) => void) => {
    fn(uiState.currentView);
    return $effect.root(() => {
      $effect(() => fn(uiState.currentView));
      return () => {};
    });
  },
  set: (value: string) => uiState.setView(value as AppView),
  update: (fn: (value: string) => string) =>
    uiState.setView(fn(uiState.currentView) as AppView),
};

export const viewMode = {
  subscribe: (fn: (value: string) => void) => {
    fn(uiState.viewMode);
    return $effect.root(() => {
      $effect(() => fn(uiState.viewMode));
      return () => {};
    });
  },
  set: (value: string) => uiState.setViewMode(value as ViewMode),
  update: (fn: (value: string) => string) =>
    uiState.setViewMode(fn(uiState.viewMode) as ViewMode),
};

export const isMemoOpen = {
  subscribe: (fn: (value: boolean) => void) => {
    fn(uiState.isMemoOpen);
    return $effect.root(() => {
      $effect(() => fn(uiState.isMemoOpen));
      return () => {};
    });
  },
  set: (value: boolean) => uiState.setMemoOpen(value),
  update: (fn: (value: boolean) => boolean) =>
    uiState.setMemoOpen(fn(uiState.isMemoOpen)),
};

export const showEventForm = {
  subscribe: (fn: (value: boolean) => void) => {
    fn(uiState.showEventForm);
    return $effect.root(() => {
      $effect(() => fn(uiState.showEventForm));
      return () => {};
    });
  },
  set: (value: boolean) => {
    if (value) {
      uiState.openEventForm();
    } else {
      uiState.closeEventForm();
    }
  },
  update: (fn: (value: boolean) => boolean) => {
    const newVal = fn(uiState.showEventForm);
    if (newVal) {
      uiState.openEventForm();
    } else {
      uiState.closeEventForm();
    }
  },
};

export const showTimelinePopup = {
  subscribe: (fn: (value: boolean) => void) => {
    fn(uiState.showTimelinePopup);
    return $effect.root(() => {
      $effect(() => fn(uiState.showTimelinePopup));
      return () => {};
    });
  },
  set: (value: boolean) => {
    if (value) {
      uiState.openTimelinePopup();
    } else {
      uiState.closeTimelinePopup();
    }
  },
  update: (fn: (value: boolean) => boolean) => {
    const newVal = fn(uiState.showTimelinePopup);
    if (newVal) {
      uiState.openTimelinePopup();
    } else {
      uiState.closeTimelinePopup();
    }
  },
};

export const currentSuggestion = {
  subscribe: (fn: (value: unknown) => void) => {
    fn(uiState.currentSuggestion);
    return $effect.root(() => {
      $effect(() => fn(uiState.currentSuggestion));
      return () => {};
    });
  },
  set: (value: unknown) => uiState.setCurrentSuggestion(value),
  update: (fn: (value: unknown) => unknown) =>
    uiState.setCurrentSuggestion(fn(uiState.currentSuggestion)),
};

export const isLoading = {
  subscribe: (fn: (value: boolean) => void) => {
    fn(uiState.isLoading);
    return $effect.root(() => {
      $effect(() => fn(uiState.isLoading));
      return () => {};
    });
  },
  set: (value: boolean) => uiState.setLoading(value),
  update: (fn: (value: boolean) => boolean) =>
    uiState.setLoading(fn(uiState.isLoading)),
};

export const errorMessage = {
  subscribe: (fn: (value: string | null) => void) => {
    fn(uiState.errorMessage);
    return $effect.root(() => {
      $effect(() => fn(uiState.errorMessage));
      return () => {};
    });
  },
  set: (value: string | null) => uiState.setError(value),
  update: (fn: (value: string | null) => string | null) =>
    uiState.setError(fn(uiState.errorMessage)),
};

// Data State - writable store wrappers
export const selectedDate = {
  subscribe: (fn: (value: Date) => void) => {
    fn(dataState.selectedDate);
    return $effect.root(() => {
      $effect(() => fn(dataState.selectedDate));
      return () => {};
    });
  },
  set: (value: Date) => dataState.setSelectedDate(value),
  update: (fn: (value: Date) => Date) =>
    dataState.setSelectedDate(fn(dataState.selectedDate)),
};

export const memos = {
  subscribe: (fn: (value: SimpleMemo[]) => void) => {
    fn(dataState.memos);
    return $effect.root(() => {
      $effect(() => fn(dataState.memos));
      return () => {};
    });
  },
};

export const suggestionLogs = {
  subscribe: (fn: (value: SuggestionLog[]) => void) => {
    fn(dataState.suggestionLogs);
    return $effect.root(() => {
      $effect(() => fn(dataState.suggestionLogs));
      return () => {};
    });
  },
};

// Calendar State - writable store wrappers
export const calendarEvents = {
  subscribe: (fn: (value: Event[]) => void) => {
    fn(calendarState.events);
    return $effect.root(() => {
      $effect(() => fn(calendarState.events));
      return () => {};
    });
  },
};

export const calendarOccurrences = {
  subscribe: (fn: (value: ExpandedOccurrence[]) => void) => {
    fn(calendarState.occurrences);
    return $effect.root(() => {
      $effect(() => fn(calendarState.occurrences));
      return () => {};
    });
  },
};

export const calendarLoading = {
  subscribe: (fn: (value: boolean) => void) => {
    fn(calendarState.loading);
    return $effect.root(() => {
      $effect(() => fn(calendarState.loading));
      return () => {};
    });
  },
};

export const calendarError = {
  subscribe: (fn: (value: string | null) => void) => {
    fn(calendarState.error);
    return $effect.root(() => {
      $effect(() => fn(calendarState.error));
      return () => {};
    });
  },
};

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

// Event form store wrapper
export const eventForm = {
  subscribe: (fn: (value: EventFormData) => void) => {
    fn(eventFormState.formData);
    return $effect.root(() => {
      $effect(() => fn(eventFormState.formData));
      return () => {};
    });
  },
};

export const eventFormErrors = {
  subscribe: (fn: (value: EventFormErrors) => void) => {
    fn(eventFormState.errors);
    return $effect.root(() => {
      $effect(() => fn(eventFormState.errors));
      return () => {};
    });
  },
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
} from "../features/assistant/state/gaps.ts";

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

// Derived state (computed from reactive state)
export const isCalendarView = {
  subscribe: (fn: (value: boolean) => void) => {
    fn(uiState.isCalendarView);
    return $effect.root(() => {
      $effect(() => fn(uiState.isCalendarView));
      return () => {};
    });
  },
};

export const isPersonalAssistantView = {
  subscribe: (fn: (value: boolean) => void) => {
    fn(uiState.isPersonalAssistantView);
    return $effect.root(() => {
      $effect(() => fn(uiState.isPersonalAssistantView));
      return () => {};
    });
  },
};

export const isTasksView = {
  subscribe: (fn: (value: boolean) => void) => {
    fn(uiState.isTasksView);
    return $effect.root(() => {
      $effect(() => fn(uiState.isTasksView));
      return () => {};
    });
  },
};
