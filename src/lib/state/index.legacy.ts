/**
 * @fileoverview Store Index
 *
 * Central export file for all stores and actions.
 * This provides a single import point for components to access the store architecture.
 *
 * @author Personal Assistant Team
 * @version 2.0.0
 */

// Core data stores
export {
  memos,
  selectedDate,
  memoOperations,
  suggestionLogOperations,
  clearAllData,
} from "./data.ts";

export {
  dayBoundaries,
  events as gapEvents,
  gapFinder,
  gaps,
  gapStats,
  dayBoundaryActions,
} from "./gaps.ts";

export { toasts } from "./toast.ts";
export { formatDate, formatDateTime } from "../utils/date-utils.ts";

// Schedule store (suggestion engine output)
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
} from "./schedule.ts";

// UI state stores
export {
  currentView,
  viewMode,
  isMemoOpen,
  showEventForm,
  showTimelinePopup,
  currentSuggestion,
  isLoading,
  errorMessage,
  isCalendarView,
  isPersonalAssistantView,
  isTasksView,
  uiActions as uiStateActions,
} from "./ui.ts";

export type { AppView } from "./ui.ts";

// Form stores
export {
  eventForm,
  eventFormErrors,
  isSubmitting as eventFormSubmitting,
  hasFormContent as eventFormHasContent,
  hasTimeContent,
  isFormValid as eventFormValid,
  isEditing as eventFormEditing,
  eventFormActions,
} from "./forms/eventForm.ts";

export {
  memoForm,
  memoFormErrors,
  isSubmitting as memoFormSubmitting,
  hasFormContent as memoFormHasContent,
  isFormValid as memoFormValid,
  isEditing as memoFormEditing,
  characterCount,
  wordCount,
  memoFormActions,
} from "./forms/memoForm.ts";

// Action stores
export { eventActions } from "./actions/eventActions.ts";
export { memoActions } from "./actions/memoActions.ts";
export { uiActions } from "./actions/uiActions.ts";
export { suggestionActions } from "./actions/suggestionActions.ts";
export { taskActions, tasks } from "./actions/taskActions.ts";

// Task form
export {
  taskForm,
  taskFormErrors,
  isTaskFormSubmitting,
  isTaskFormOpen,
  isTaskFormValid,
  showDeadlineField,
  showRecurrenceFields,
  taskFormActions,
} from "./forms/taskForm.ts";

export type { TaskFormData, TaskFormErrors } from "./forms/taskForm.ts";

// Timezone
export { timezone, timezoneActions, timezoneLabel } from "./timezone.ts";

// Calendar store (iCalendar-based)
export {
  calendarStore,
  calendarEvents,
  calendarOccurrences,
  calendarLoading,
  calendarError,
  calendarActions,
  type ExpandedOccurrence,
} from "./calendar.ts";

// Devtools
export { devtools, devtoolsEnabled } from "./devtools.ts";
