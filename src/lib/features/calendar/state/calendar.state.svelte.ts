/**
 * Calendar State (Svelte 5 reactive class)
 *
 * Manages calendar events with API-backed persistence.
 *
 * Features:
 * - Fetch events from API with date range filtering
 * - Create, update, delete events via API
 * - Import .ics files
 * - Export calendar to .ics
 * - Local caching with reactive updates
 */
import type { Event } from "$lib/types.ts";
import {
  expandRecurrences,
  type ExpandedOccurrence as IcalOccurrence,
} from "$lib/services/calendar/index.ts";
import { toastState } from "$lib/state/index.svelte.ts";
import type {
  CalendarState,
  ExpandedOccurrence,
  ImportResult,
  DateWindow,
} from "./calendar.types.ts";
import {
  fetchEventsApi,
  createEventApi,
  updateEventApi,
  deleteEventApi,
  importIcsApi,
  getExportUrl,
} from "./calendar.remote.ts";

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

// ============================================================================
// CALENDAR STATE CLASS
// ============================================================================

class CalendarStateClass {
  // Reactive state
  events = $state<Event[]>([]);
  occurrences = $state<ExpandedOccurrence[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);
  lastFetched = $state<Date | null>(null);
  currentWindow = $state<DateWindow | null>(null);
  cachedWindow = $state<DateWindow | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  get state(): CalendarState {
    return {
      events: this.events,
      occurrences: this.occurrences,
      loading: this.loading,
      error: this.error,
      lastFetched: this.lastFetched,
      currentWindow: this.currentWindow,
      cachedWindow: this.cachedWindow,
    };
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Fetch events from API
   */
  async fetchEvents(
    start: Date,
    end: Date,
    expandRecurring = true,
  ): Promise<void> {
    // Prevent duplicate fetches
    if (this.loading) {
      return;
    }

    const window: DateWindow = { start, end };

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
        this.currentWindow = window;
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
        this.currentWindow = window;
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
      const events = await fetchEventsApi(window);

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

      this.events = mergedEvents;
      this.occurrences = occurrences;
      this.loading = false;
      this.lastFetched = new Date();
      this.currentWindow = window;
      this.cachedWindow = this.cachedWindow
        ? {
            start: new Date(
              Math.min(this.cachedWindow.start.getTime(), start.getTime()),
            ),
            end: new Date(
              Math.max(this.cachedWindow.end.getTime(), end.getTime()),
            ),
          }
        : window;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch events";
      console.error("[CalendarState] fetchEvents error:", err);
      this.loading = false;
      this.error = errorMsg;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(event: Omit<Event, "id">): Promise<Event | null> {
    try {
      const created = await createEventApi(event);

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

      toastState.show("Event created", "success");
      return created;
    } catch (err) {
      console.error("[CalendarState] createEvent error:", err);
      toastState.show("Failed to create event", "error");
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
      const updated = await updateEventApi(id, updates);

      const newEvents = this.events.map((e) => (e.id === id ? updated : e));
      this.events = newEvents;

      if (this.currentWindow) {
        this.occurrences = this.expandRecurringEvents(
          newEvents,
          this.currentWindow.start,
          this.currentWindow.end,
        );
      }

      toastState.show("Event updated", "success");
      return true;
    } catch (err) {
      console.error("[CalendarState] updateEvent error:", err);
      toastState.show("Failed to update event", "error");
      return false;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      await deleteEventApi(id);

      const newEvents = this.events.filter((e) => e.id !== id);
      this.events = newEvents;

      if (this.currentWindow) {
        this.occurrences = this.expandRecurringEvents(
          newEvents,
          this.currentWindow.start,
          this.currentWindow.end,
        );
      }

      toastState.show("Event deleted", "success");
      return true;
    } catch (err) {
      console.error("[CalendarState] deleteEvent error:", err);
      toastState.show("Failed to delete event", "error");
      return false;
    }
  }

  /**
   * Import events from .ics file
   */
  async importICS(file: File): Promise<ImportResult> {
    try {
      const content = await file.text();
      const result = await importIcsApi(content);

      // Refresh events after import
      if (this.currentWindow) {
        await this.fetchEvents(
          this.currentWindow.start,
          this.currentWindow.end,
        );
      }

      if (result.imported > 0) {
        toastState.show(`Imported ${result.imported} events`, "success");
      }
      if (result.skipped > 0) {
        toastState.show(`Skipped ${result.skipped} duplicates`, "info");
      }
      if (result.errors.length > 0) {
        toastState.show(`${result.errors.length} import errors`, "error");
      }

      return result;
    } catch (err) {
      console.error("[CalendarState] importICS error:", err);
      toastState.show("Import failed", "error");
      throw err;
    }
  }

  /**
   * Get export URL for downloading .ics file
   */
  getExportUrl(start?: Date, end?: Date, name?: string): string {
    return getExportUrl(start, end, name);
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
      // Skip non-recurring events
      if (!event.recurrence || event.recurrence.type === "NONE") {
        continue;
      }

      // Check if this is a forever-recurring event
      const isForever =
        event.recurrence.type === "RRULE" && event.recurrence.rrule
          ? !event.recurrence.rrule.includes("UNTIL=") &&
            !event.recurrence.rrule.includes("COUNT=")
          : false;

      if (event.recurrence.type === "RRULE" && event.recurrence.rrule) {
        try {
          let veventStr: string;

          // Use stored icalData if available
          if (event.icalData) {
            veventStr = event.icalData;
          } else {
            // Fallback: construct VEVENT with proper iCal format
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

          // Calculate event duration for applying to each occurrence
          const durationMs = event.end.getTime() - event.start.getTime();

          // Transform iCal occurrences into rich occurrences with event data
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
        } catch (err) {
          console.warn(
            `[CalendarState] Failed to expand recurring event ${event.id}:`,
            err,
          );
        }
      }
    }

    return allOccurrences;
  }

  /**
   * Clear the calendar state
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
}

// ============================================================================
// EXPORTS
// ============================================================================

export const calendarState = new CalendarStateClass();

// Re-export types
export type { ExpandedOccurrence, CalendarState, ImportResult, DateWindow };
