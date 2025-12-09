/**
 * Calendar Store
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
 */

import { writable, derived, get } from "svelte/store";
import type { Event } from "../types.js";
import {
  expandRecurrences,
  type ExpandedOccurrence as IcalOccurrence,
} from "../services/calendar/index.js";
import { toasts } from "./toast.js";

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

interface CalendarState {
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

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: CalendarState = {
  events: [],
  occurrences: [],
  loading: false,
  error: null,
  lastFetched: null,
  currentWindow: null,
  cachedWindow: null,
};

// ============================================================================
// STORES
// ============================================================================

/** Main calendar state store */
export const calendarStore = writable<CalendarState>(initialState);

/** Just the events array */
export const calendarEvents = derived(calendarStore, ($state) => $state.events);

/** Loading indicator */
export const calendarLoading = derived(
  calendarStore,
  ($state) => $state.loading,
);

/** Error message */
export const calendarError = derived(calendarStore, ($state) => $state.error);

/** Expanded occurrences for recurring events */
export const calendarOccurrences = derived(
  calendarStore,
  ($state) => $state.occurrences,
);

// ============================================================================
// ACTIONS
// ============================================================================

export const calendarActions = {
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
    const currentState = get(calendarStore);
    if (currentState.loading) {
      return; // Already loading, skip
    }

    // Smart caching: Check if we already have events that cover this window
    if (
      currentState.cachedWindow &&
      currentState.events.length > 0 &&
      currentState.lastFetched
    ) {
      const cachedStart = currentState.cachedWindow.start;
      const cachedEnd = currentState.cachedWindow.end;

      // Check if cached window fully covers the requested window
      const fullyCovers =
        cachedStart.getTime() <= start.getTime() &&
        cachedEnd.getTime() >= end.getTime();

      if (fullyCovers) {
        // Just re-expand occurrences for the new display window from cached events
        const occurrences = expandRecurring
          ? calendarActions.expandRecurringEvents(
              currentState.events,
              start,
              end,
            )
          : [];

        calendarStore.update((s) => ({
          ...s,
          occurrences,
          currentWindow: { start, end },
          // Keep cachedWindow as-is, don't set loading - NO LOADING INDICATOR!
        }));

        return;
      }

      // Check if requested window overlaps significantly with cached window
      // If most of the requested window is already cached, use cache for now
      const overlapStart = Math.max(cachedStart.getTime(), start.getTime());
      const overlapEnd = Math.min(cachedEnd.getTime(), end.getTime());
      const overlapDuration = Math.max(0, overlapEnd - overlapStart);
      const requestedDuration = end.getTime() - start.getTime();
      const overlapRatio =
        requestedDuration > 0 ? overlapDuration / requestedDuration : 0;

      // If 80%+ of requested window overlaps with cache, use cache (no loading indicator)
      if (overlapRatio >= 0.8) {
        // Use cache for immediate display
        const occurrences = expandRecurring
          ? calendarActions.expandRecurringEvents(
              currentState.events,
              start,
              end,
            )
          : [];

        calendarStore.update((s) => ({
          ...s,
          occurrences,
          currentWindow: { start, end },
          // Don't set loading - use cache immediately
        }));

        // Optionally: Fetch missing parts in background (non-blocking)
        // But for now, just use cache to avoid flickering

        return;
      }
    }

    // Check if this is the exact same window we already loaded
    if (
      currentState.currentWindow &&
      currentState.currentWindow.start.getTime() === start.getTime() &&
      currentState.currentWindow.end.getTime() === end.getTime() &&
      currentState.lastFetched
    ) {
      return; // Exact window already loaded
    }

    calendarStore.update((s) => ({ ...s, loading: true, error: null }));

    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const response = await fetch(`/api/calendar/events?${params}`);

      if (!response.ok) {
        // Handle 401 (Unauthorized) gracefully - user not logged in
        if (response.status === 401) {
          calendarStore.update((s) => ({
            ...s,
            events: [],
            occurrences: [],
            loading: false,
            error: null, // Don't show error for unauthenticated users
          }));
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const eventsJson = await response.json();

      // Convert dates from JSON and preserve icalData
      const events: Event[] = eventsJson.map((e: Record<string, unknown>) => ({
        ...e,
        start: new Date(e.start as string),
        end: new Date(e.end as string),
        // Preserve icalData for recurrence expansion
        icalData: e.icalData as string | undefined,
      }));

      // Expand recurring events
      let occurrences: ExpandedOccurrence[] = [];
      if (expandRecurring) {
        occurrences = calendarActions.expandRecurringEvents(events, start, end);
      }

      // Merge with existing events (deduplicate by id)
      const existingEventIds = new Set(currentState.events.map((e) => e.id));
      const newEvents = events.filter((e) => !existingEventIds.has(e.id));
      const mergedEvents = [...currentState.events, ...newEvents].sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      );

      calendarStore.update((s) => ({
        ...s,
        events: mergedEvents,
        occurrences,
        loading: false,
        lastFetched: new Date(),
        currentWindow: { start, end },
        // Update cached window to be the union of old and new windows
        cachedWindow: currentState.cachedWindow
          ? {
              start: new Date(
                Math.min(
                  currentState.cachedWindow.start.getTime(),
                  start.getTime(),
                ),
              ),
              end: new Date(
                Math.max(
                  currentState.cachedWindow.end.getTime(),
                  end.getTime(),
                ),
              ),
            }
          : { start, end },
      }));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch events";
      console.error("[calendarStore] fetchEvents error:", error);
      calendarStore.update((s) => ({
        ...s,
        loading: false,
        error: errorMsg,
      }));
    }
  },

  /**
   * Create a new event
   *
   * @param event - Event data (without id)
   * @returns Created event or null on failure
   */
  async createEvent(event: Omit<Event, "id">): Promise<Event | null> {
    try {
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const createdJson = await response.json();
      const created: Event = {
        ...createdJson,
        start: new Date(createdJson.start),
        end: new Date(createdJson.end),
      };

      // Add to local store and re-expand occurrences
      calendarStore.update((s) => {
        const newEvents = [...s.events, created].sort(
          (a, b) => a.start.getTime() - b.start.getTime(),
        );

        const occurrences = s.currentWindow
          ? calendarActions.expandRecurringEvents(
              newEvents,
              s.currentWindow.start,
              s.currentWindow.end,
            )
          : s.occurrences;

        return {
          ...s,
          events: newEvents,
          occurrences,
        };
      });

      toasts.show("Event created", "success");
      return created;
    } catch (error) {
      console.error("[calendarStore] createEvent error:", error);
      toasts.show("Failed to create event", "error");
      return null;
    }
  },

  /**
   * Update an existing event
   *
   * @param id - Event ID
   * @param updates - Partial event updates
   * @returns Success indicator
   */
  async updateEvent(
    id: string,
    updates: Partial<Omit<Event, "id">>,
  ): Promise<boolean> {
    try {
      const body: Record<string, unknown> = { ...updates };
      if (updates.start) body.start = updates.start.toISOString();
      if (updates.end) body.end = updates.end.toISOString();

      const response = await fetch(`/api/calendar/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const updatedJson = await response.json();
      const updated: Event = {
        ...updatedJson,
        start: new Date(updatedJson.start),
        end: new Date(updatedJson.end),
      };

      // Update local store
      calendarStore.update((s) => {
        const newEvents = s.events.map((e) => (e.id === id ? updated : e));

        const occurrences = s.currentWindow
          ? calendarActions.expandRecurringEvents(
              newEvents,
              s.currentWindow.start,
              s.currentWindow.end,
            )
          : s.occurrences;

        return {
          ...s,
          events: newEvents,
          occurrences,
        };
      });

      toasts.show("Event updated", "success");
      return true;
    } catch (error) {
      console.error("[calendarStore] updateEvent error:", error);
      toasts.show("Failed to update event", "error");
      return false;
    }
  },

  /**
   * Delete an event
   *
   * @param id - Event ID
   * @returns Success indicator
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Remove from local store
      calendarStore.update((s) => {
        const newEvents = s.events.filter((e) => e.id !== id);

        const occurrences = s.currentWindow
          ? calendarActions.expandRecurringEvents(
              newEvents,
              s.currentWindow.start,
              s.currentWindow.end,
            )
          : s.occurrences;

        return {
          ...s,
          events: newEvents,
          occurrences,
        };
      });

      toasts.show("Event deleted", "success");
      return true;
    } catch (error) {
      console.error("[calendarStore] deleteEvent error:", error);
      toasts.show("Failed to delete event", "error");
      return false;
    }
  },

  /**
   * Import events from .ics file
   *
   * @param file - File object containing .ics data
   * @returns Import result
   */
  async importICS(file: File): Promise<ImportResult> {
    try {
      const content = await file.text();

      const response = await fetch("/api/calendar/import", {
        method: "POST",
        headers: { "Content-Type": "text/calendar" },
        body: content,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result: ImportResult = await response.json();

      // Refresh events after import
      const state = get(calendarStore);
      if (state.currentWindow) {
        await calendarActions.fetchEvents(
          state.currentWindow.start,
          state.currentWindow.end,
        );
      }

      if (result.imported > 0) {
        toasts.show(`Imported ${result.imported} events`, "success");
      }
      if (result.skipped > 0) {
        toasts.show(`Skipped ${result.skipped} duplicates`, "info");
      }
      if (result.errors.length > 0) {
        toasts.show(`${result.errors.length} import errors`, "error");
      }

      return result;
    } catch (error) {
      console.error("[calendarStore] importICS error:", error);
      toasts.show("Import failed", "error");
      throw error;
    }
  },

  /**
   * Get export URL for downloading .ics file
   *
   * @param start - Optional start date filter
   * @param end - Optional end date filter
   * @param name - Optional calendar name
   * @returns URL for download
   */
  getExportUrl(start?: Date, end?: Date, name?: string): string {
    const params = new URLSearchParams();
    if (start) params.set("start", start.toISOString());
    if (end) params.set("end", end.toISOString());
    if (name) params.set("name", name);

    const queryString = params.toString();
    return queryString
      ? `/api/calendar/export?${queryString}`
      : "/api/calendar/export";
  },

  /**
   * Expand recurring events into rich occurrences
   *
   * @param events - Events to expand
   * @param windowStart - Expansion window start
   * @param windowEnd - Expansion window end
   * @returns Array of expanded occurrences with full event data
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

      // Check if this is a forever-recurring event (no UNTIL or COUNT in RRULE)
      const isForever =
        event.recurrence.type === "RRULE" && event.recurrence.rrule
          ? !event.recurrence.rrule.includes("UNTIL=") &&
            !event.recurrence.rrule.includes("COUNT=")
          : false;

      if (event.recurrence.type === "RRULE" && event.recurrence.rrule) {
        try {
          let veventStr: string;

          // Use stored icalData if available (it's already properly formatted)
          if (event.icalData) {
            veventStr = event.icalData;
          } else {
            // Fallback: construct VEVENT with proper iCal format
            const isAllDay = event.timeLabel === "all-day";
            const dtstartLine = isAllDay
              ? `DTSTART;VALUE=DATE:${formatDateForIcal(event.start, true)}`
              : `DTSTART:${formatDateForIcal(event.start, false)}`;

            // Only add DTEND if we have a different end time (not for all-day single day events)
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
            (occ: IcalOccurrence, index: number) => {
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
            `[calendarStore] Failed to expand recurring event ${event.id}:`,
            error,
          );
        }
      }
    }

    return allOccurrences;
  },

  /**
   * Clear the calendar store
   */
  clear(): void {
    calendarStore.set(initialState);
  },

  /**
   * Set error message
   */
  setError(error: string | null): void {
    calendarStore.update((s) => ({ ...s, error }));
  },
};

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
