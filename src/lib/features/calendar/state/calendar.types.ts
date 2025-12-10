/**
 * Calendar store type definitions
 */
import type { Event } from "$lib/types.js";

/**
 * Rich expanded occurrence with full event data
 * This combines the ical.js expansion result with the master event data
 */
export interface ExpandedOccurrence {
  /** Unique ID for this occurrence (masterEventId + date) */
  id: string;
  /** Reference to master event ID */
  masterEventId: string;
  /** Event title */
  title: string;
  /** Occurrence start date */
  start: Date;
  /** Occurrence end date */
  end: Date;
  /** Event description */
  description?: string;
  /** Event location/address */
  location?: string;
  /** Importance level */
  importance?: "low" | "medium" | "high";
  /** Time label type */
  timeLabel: "all-day" | "some-timing" | "timed";
  /** Whether this is a forever-recurring event */
  isForever: boolean;
  /** Recurrence ID from iCal */
  recurrenceId?: string;
}

export interface CalendarState {
  /** All fetched events (masters) - cached across multiple windows */
  events: Event[];
  /** Expanded recurring event occurrences for current display window */
  occurrences: ExpandedOccurrence[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Last successful fetch timestamp */
  lastFetched: Date | null;
  /** Current window for occurrence expansion */
  currentWindow: { start: Date; end: Date } | null;
  /** Cached window - the date range we've actually fetched events for */
  cachedWindow: { start: Date; end: Date } | null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface DateWindow {
  start: Date;
  end: Date;
}
