/**
 * @fileoverview Calendar Store - Reactive Class
 *
 * Manages calendar events with API-backed persistence.
 * Replaces the in-memory events store with database-backed storage.
 *
 * Features:
 * - Fetch events from API with date range filtering
 * - Create, update, delete events via API
 * - Import .ics files
 * - Export calendar to .ics
 * - Local caching with reactive updates
 *
 * Migrated from writable stores to Svelte 5 reactive class ($state).
 */

import type { Event } from "../../../types.ts";
import {
  expandRecurrences,
  type ExpandedOccurrence as IcalOccurrence,
} from "../services/index.ts";
import { toastState } from "../../../bootstrap/toast.svelte.ts";
import {
  fetchEvents as fetchEventsRemote,
  createEvent as createEventRemote,
  updateEvent as updateEventRemote,
  deleteEvent as deleteEventRemote,
  importIcs,
} from "./calendar.functions.remote.ts";

// ============================================================================
// TYPES
// ============================================================================

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

interface DateWindow {
  start: Date;
  end: Date;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ============================================================================
// CALENDAR STATE CLASS
// ============================================================================

/**
 * Calendar state reactive class
 */
class CalendarState {
  // ============================================================================
  // Reactive State
  // ============================================================================

  /** All fetched events (masters) - cached across multiple windows */
  events = $state<Event[]>([]);

  /** Expanded recurring event occurrences for current display window */
  occurrences = $state<ExpandedOccurrence[]>([]);

  /** Loading state */
  loading = $state(false);

  /** Error message if any */
  error = $state<string | null>(null);

  /** Last successful fetch timestamp */
  lastFetched = $state<Date | null>(null);

  /** Current window for occurrence expansion */
  currentWindow = $state<DateWindow | null>(null);

  /** Cached window - the date range we've actually fetched events for */
  cachedWindow = $state<DateWindow | null>(null);

  // ============================================================================
  // Derived State (getters)
  // ============================================================================

  /**
   * Whether events are currently being loaded
   */
  get isLoading(): boolean {
    return this.loading;
  }

  /**
   * Whether there's an error
   */
  get hasError(): boolean {
    return this.error !== null;
  }

  /**
   * Number of events
   */
  get eventCount(): number {
    return this.events.length;
  }

  /**
   * Number of occurrences
   */
  get occurrenceCount(): number {
    return this.occurrences.length;
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Fetch events from API
   *
   * @param start - Window start date
   * @param end - Window end date
   * @param expandRecurring - Whether to expand recurring events
   */
  async fetchEvents(
    start: Date,
    end: Date,
    expandRecurring = true,
  ): Promise<void> {
    // Prevent duplicate fetches - don't fetch if already loading
    if (this.loading) {
      return;
    }

    // Smart caching: Check if we already have events that cover this window
    if (this.cachedWindow && this.events.length > 0 && this.lastFetched) {
      const cachedStart = this.cachedWindow.start;
      const cachedEnd = this.cachedWindow.end;

      // Check if cached window fully covers the requested window
      const fullyCovers =
        cachedStart.getTime() <= start.getTime() &&
        cachedEnd.getTime() >= end.getTime();

      if (fullyCovers) {
        // Just re-expand occurrences for the new display window from cached events
        this.occurrences = expandRecurring
          ? this.expandRecurringEvents(this.events, start, end)
          : [];
        this.currentWindow = { start, end };
        return;
      }

      // Check if requested window overlaps significantly with cached window
      const overlapStart = Math.max(cachedStart.getTime(), start.getTime());
      const overlapEnd = Math.min(cachedEnd.getTime(), end.getTime());
      const overlapDuration = Math.max(0, overlapEnd - overlapStart);
      const requestedDuration = end.getTime() - start.getTime();
      const overlapRatio =
        requestedDuration > 0 ? overlapDuration / requestedDuration : 0;

      // If 80%+ of requested window overlaps with cache, use cache
      if (overlapRatio >= 0.8) {
        this.occurrences = expandRecurring
          ? this.expandRecurringEvents(this.events, start, end)
          : [];
        this.currentWindow = { start, end };
        return;
      }
    }

    // Check if this is the exact same window we already loaded
    if (
      this.currentWindow &&
      this.currentWindow.start.getTime() === start.getTime() &&
      this.currentWindow.end.getTime() === end.getTime() &&
      this.lastFetched
    ) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const eventsJson = (await fetchEventsRemote({
        start: start.toISOString(),
        end: end.toISOString(),
      })) as Array<{ start: string; end: string } & Record<string, unknown>>;

      // Convert dates from JSON and preserve icalData
      const events: Event[] = eventsJson.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })) as Event[];

      // Expand recurring events
      const occurrences = expandRecurring
        ? this.expandRecurringEvents(events, start, end)
        : [];

      // Merge with existing events (deduplicate by id)
      const existingEventIds = new Set(this.events.map((e) => e.id));
      const newEvents = events.filter((e) => !existingEventIds.has(e.id));
      const mergedEvents = [...this.events, ...newEvents].sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      );

      // Update state
      this.events = mergedEvents;
      this.occurrences = occurrences;
      this.loading = false;
      this.lastFetched = new Date();
      this.currentWindow = { start, end };
      this.cachedWindow = this.cachedWindow
        ? {
            start: new Date(
              Math.min(this.cachedWindow.start.getTime(), start.getTime()),
            ),
            end: new Date(
              Math.max(this.cachedWindow.end.getTime(), end.getTime()),
            ),
          }
        : { start, end };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch events";
      console.error("[CalendarState] fetchEvents error:", error);
      this.loading = false;
      this.error = errorMsg;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(event: Omit<Event, "id">): Promise<Event | null> {
    try {
      const createdJson = await createEventRemote({
        title: event.title,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        description: event.description,
        address: event.address,
        importance: event.importance,
        timeLabel: event.timeLabel,
        tzid: event.tzid,
        recurrence: event.recurrence,
      });

      const created: Event = {
        ...(createdJson as object),
        start: new Date(createdJson.start as string),
        end: new Date(createdJson.end as string),
      } as Event;

      // Add to local store and re-expand occurrences
      const newEvents = [...this.events, created].sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      );
      this.events = newEvents;

      if (this.currentWindow) {
        this.occurrences = this.expandRecurringEvents(
          newEvents,
          this.currentWindow.start,
          this.currentWindow.end,
        );
      }

      toastState.success("Event created");
      return created;
    } catch (error) {
      console.error("[CalendarState] createEvent error:", error);
      toastState.error("Failed to create event");
      return null;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    id: string,
    updates: Partial<Omit<Event, "id">>,
  ): Promise<boolean> {
    try {
      const updateInput: Record<string, unknown> = {};
      if (updates.title !== undefined) updateInput.title = updates.title;
      if (updates.start !== undefined)
        updateInput.start = updates.start.toISOString();
      if (updates.end !== undefined)
        updateInput.end = updates.end.toISOString();
      if (updates.description !== undefined)
        updateInput.description = updates.description;
      if (updates.address !== undefined) updateInput.address = updates.address;
      if (updates.importance !== undefined)
        updateInput.importance = updates.importance;
      if (updates.timeLabel !== undefined)
        updateInput.timeLabel = updates.timeLabel;
      if (updates.tzid !== undefined) updateInput.tzid = updates.tzid;
      if (updates.recurrence !== undefined)
        updateInput.recurrence = updates.recurrence;

      const updatedJson = await updateEventRemote({
        id,
        updates: updateInput,
      });

      const updated: Event = {
        ...(updatedJson as object),
        start: new Date(updatedJson.start as string),
        end: new Date(updatedJson.end as string),
      } as Event;

      // Update local store
      const newEvents = this.events.map((e) => (e.id === id ? updated : e));
      this.events = newEvents;

      if (this.currentWindow) {
        this.occurrences = this.expandRecurringEvents(
          newEvents,
          this.currentWindow.start,
          this.currentWindow.end,
        );
      }

      toastState.success("Event updated");
      return true;
    } catch (error) {
      console.error("[CalendarState] updateEvent error:", error);
      toastState.error("Failed to update event");
      return false;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      await deleteEventRemote({ id });

      // Remove from local store
      const newEvents = this.events.filter((e) => e.id !== id);
      this.events = newEvents;

      if (this.currentWindow) {
        this.occurrences = this.expandRecurringEvents(
          newEvents,
          this.currentWindow.start,
          this.currentWindow.end,
        );
      }

      toastState.success("Event deleted");
      return true;
    } catch (error) {
      console.error("[CalendarState] deleteEvent error:", error);
      toastState.error("Failed to delete event");
      return false;
    }
  }

  /**
   * Import events from .ics file
   */
  async importICS(file: File): Promise<ImportResult> {
    try {
      const content = await file.text();
      const result = await importIcs(content);

      // Refresh events after import
      if (this.currentWindow) {
        await this.fetchEvents(
          this.currentWindow.start,
          this.currentWindow.end,
        );
      }

      if (result.imported > 0) {
        toastState.success(`Imported ${result.imported} events`);
      }
      if (result.skipped > 0) {
        toastState.info(`Skipped ${result.skipped} duplicates`);
      }
      if (result.errors.length > 0) {
        toastState.error(`${result.errors.length} import errors`);
      }

      return result;
    } catch (error) {
      console.error("[CalendarState] importICS error:", error);
      toastState.error("Import failed");
      throw error;
    }
  }

  /**
   * Get export URL for downloading .ics file
   */
  getExportUrl(start?: Date, end?: Date, name?: string): string {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local variable, not reactive state
    const params = new URLSearchParams();
    if (start) params.set("start", start.toISOString());
    if (end) params.set("end", end.toISOString());
    if (name) params.set("name", name);

    const queryString = params.toString();
    return queryString
      ? `/api/calendar/export?${queryString}`
      : "/api/calendar/export";
  }

  /**
   * Expand recurring events into rich occurrences
   */
  expandRecurringEvents(
    events: Event[],
    windowStart: Date,
    windowEnd: Date,
  ): ExpandedOccurrence[] {
    const allOccurrences: ExpandedOccurrence[] = [];

    for (const event of events) {
      if (!event.recurrence || event.recurrence.type === "NONE") {
        continue;
      }

      const isForever =
        event.recurrence.type === "RRULE" && event.recurrence.rrule
          ? !event.recurrence.rrule.includes("UNTIL=") &&
            !event.recurrence.rrule.includes("COUNT=")
          : false;

      if (event.recurrence.type === "RRULE" && event.recurrence.rrule) {
        try {
          let veventStr: string;

          if (event.icalData) {
            veventStr = event.icalData;
          } else {
            const isAllDay = event.timeLabel === "all-day";
            const dtstartLine = isAllDay
              ? `DTSTART;VALUE=DATE:${formatDateForIcal(event.start, true)}`
              : `DTSTART:${formatDateForIcal(event.start, false)}`;

            const dtendLine = isAllDay
              ? event.start.getTime() !== event.end.getTime()
                ? `DTEND;VALUE=DATE:${formatDateForIcal(event.end, true)}`
                : null
              : `DTEND:${formatDateForIcal(event.end, false)}`;

            const lines = [
              "BEGIN:VEVENT",
              `UID:${event.id}`,
              dtstartLine,
              ...(dtendLine ? [dtendLine] : []),
              `RRULE:${event.recurrence.rrule}`,
              `SUMMARY:${event.title}`,
              "END:VEVENT",
            ];

            veventStr = lines.join("\r\n");
          }

          const icalOccurrences = expandRecurrences(
            veventStr,
            windowStart,
            windowEnd,
          );

          const durationMs = event.end.getTime() - event.start.getTime();

          const richOccurrences: ExpandedOccurrence[] = icalOccurrences.map(
            (occ: IcalOccurrence) => {
              const occStart = occ.startDate;
              const occEnd =
                occ.endDate || new Date(occStart.getTime() + durationMs);

              return {
                id: `${event.id}_${occStart.getTime()}`,
                masterEventId: event.id,
                title: event.title,
                start: occStart,
                end: occEnd,
                description: event.description,
                location: event.address,
                importance: event.importance,
                timeLabel: event.timeLabel,
                isForever,
                recurrenceId: occ.recurrenceId,
              };
            },
          );

          allOccurrences.push(...richOccurrences);
        } catch (error) {
          console.warn(
            `[CalendarState] Failed to expand recurring event ${event.id}:`,
            error,
          );
        }
      }
    }

    return allOccurrences;
  }

  /**
   * Clear the calendar store
   */
  clear(): void {
    this.events = [];
    this.occurrences = [];
    this.loading = false;
    this.error = null;
    this.lastFetched = null;
    this.currentWindow = null;
    this.cachedWindow = null;
  }

  /**
   * Set error message
   */
  setError(error: string | null): void {
    this.error = error;
  }

  /**
   * Get event by ID
   */
  getEvent(id: string): Event | undefined {
    return this.events.find((e) => e.id === id);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format date for iCalendar (YYYYMMDD or YYYYMMDDTHHmmss)
 */
function formatDateForIcal(date: Date, isAllDay: boolean): string {
  if (isAllDay) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Global calendar state instance
 */
export const calendarState = new CalendarState();
