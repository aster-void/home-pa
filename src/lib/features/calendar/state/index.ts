/**
 * Calendar state barrel export
 */
export {
  calendarState,
  type ExpandedOccurrence,
  type CalendarState,
  type ImportResult,
  type DateWindow,
} from "./calendar.state.svelte.ts";

// Re-export API functions for direct usage
export {
  fetchEventsApi,
  createEventApi,
  updateEventApi,
  deleteEventApi,
  importIcsApi,
  getExportUrl,
} from "./calendar.remote.ts";
