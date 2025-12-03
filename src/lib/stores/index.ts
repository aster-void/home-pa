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
  events,
  memos,
  selectedDate,
  eventOperations,
  memoOperations,
  suggestionLogOperations,
  todaysEvents,
  clearAllData,
} from "./data.js";

export {
  dayBoundaries,
  events as gapEvents,
  gapFinder,
  gaps,
  gapStats,
  dayBoundaryActions,
} from "./gaps.js";

export {
  recurrenceStore,
  reactiveOccurrences,
  todaysOccurrences,
  getDisplayEventsForDate,
  displayEvents,
  eventsForSelectedDate,
  loadOccurrences,
  getOccurrencesForDate,
  isForeverRecurring,
  foreverRecurringEvents,
  type RecurrenceOccurrence,
  type RecurrenceState,
} from "./recurrence.store.js";

export { toasts } from "./toast.js";
export { formatDate, formatDateTime } from "../utils/date-utils.js";

// Schedule store (suggestion engine output)
export {
  scheduleResult,
  isScheduleLoading,
  scheduleError,
  lastPipelineSummary,
  lastScheduleTime,
  scheduledBlocks,
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
} from "./schedule.js";

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
} from "./ui.js";

export type { AppView } from "./ui.js";

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
} from "./forms/eventForm.js";

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
} from "./forms/memoForm.js";

// Action stores
export { eventActions } from "./actions/eventActions.js";
export { memoActions } from "./actions/memoActions.js";
export { uiActions } from "./actions/uiActions.js";
export { suggestionActions } from "./actions/suggestionActions.js";
export { taskActions, tasks } from "./actions/taskActions.js";

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
} from "./forms/taskForm.js";

export type { TaskFormData, TaskFormErrors } from "./forms/taskForm.js";

// Timezone
export { timezone, timezoneActions, timezoneLabel } from "./timezone.js";

// Devtools
export { devtools, devtoolsEnabled } from "./devtools.js";
