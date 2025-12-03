/**
 * Lazy-Loading Recurrence Store
 *
 * This store handles recurring event occurrence generation without blocking
 * the main application. It uses dynamic imports and manual triggers to avoid
 * SSR/hydration issues.
 *
 * Note: Recurrence manager is lazy-loaded on demand to avoid SSR issues
 * and reduce initial bundle size (~119KB deferred until needed).
 */

import { writable, derived, get } from "svelte/store";
import type { Event } from "../types.js";
import { events, selectedDate } from "./data.js";

export interface RecurrenceOccurrence {
  id: string;
  eventId: string;
  startUtc: Date;
  endUtc: Date;
  originalLocalISO: string;
  title: string;
  description?: string;
  address?: string;
  importance?: "low" | "medium" | "high";
  timeLabel?: "all-day" | "some-timing";
  // New sliding window fields
  recurrenceGroupId?: string;
  isForever?: boolean;
  isDuplicate?: boolean;
  originalEventId?: string;
}

export interface RecurrenceState {
  occurrences: RecurrenceOccurrence[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: RecurrenceState = {
  occurrences: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

export const recurrenceStore = writable<RecurrenceState>(initialState);

/**
 * Simple derived store that just returns the current occurrences
 * Manual loading is handled by CalendarView
 */
export const reactiveOccurrences = derived(
  recurrenceStore,
  ($recurrenceState) => $recurrenceState.occurrences,
);

// Singleton manager instance (lazy loaded)
let manager: any = null;
let managerPromise: Promise<any> | null = null;

/**
 * Get or create the recurrence manager instance
 * Uses dynamic import to avoid loading heavy dependencies until needed
 */
async function getManager() {
  if (manager) return manager;

  if (!managerPromise) {
    managerPromise = import("../services/recurrence/manager.js").then(
      (module) => {
        manager = module.createRecurrenceManager();
        return manager;
      },
    );
  }

  return managerPromise;
}

/**
 * Load occurrences for recurring events
 * This is the main function to call when you want to generate occurrences
 *
 * @param events - Array of events (both recurring and non-recurring)
 * @param windowStart - Start of date range (UTC)
 * @param windowEnd - End of date range (UTC)
 */
export async function loadOccurrences(
  events: Event[],
  windowStart: Date,
  windowEnd: Date,
): Promise<void> {
  // Set loading state
  recurrenceStore.update((s) => ({
    ...s,
    loading: true,
    error: null,
  }));

  try {
    // Dynamic import - only loads when needed
    const mgr = await getManager();
    const luxonModule = await import("luxon");
    const DateTime = luxonModule.DateTime;

    // Clear previous data
    await mgr.clearAll();

    // Filter and add recurring events
    const recurringEvents = events.filter(
      (event) => event.recurrence && event.recurrence.type !== "NONE",
    );

    console.log("[recurrence.store] loadOccurrences:", {
      totalEvents: events.length,
      recurringEvents: recurringEvents.length,
      windowStart,
      windowEnd,
    });

    // Debug: log all events to see their recurrence status (can be removed in production)
    if (events.length > 0) {
      console.log(
        "[DEBUG] Events with recurrence:",
        events.map((e) => ({
          id: e.id,
          title: e.title,
          hasRecurrence: !!e.recurrence,
          recurrenceType: e.recurrence?.type,
        })),
      );
    }

    if (recurringEvents.length === 0) {
      // No recurring events, just clear occurrences
      recurrenceStore.update((s) => ({
        ...s,
        occurrences: [],
        loading: false,
        lastUpdated: new Date(),
      }));
      console.log("[recurrence.store] No recurring events found");
      return;
    }

    // Map to track manager event IDs -> original event IDs
    const eventIdMap = new Map<string, string>();

    // Add each recurring event to the manager
    for (const event of recurringEvents) {
      const tzid =
        event.tzid || Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Extract local time components from the Date object
      // event.start is a Date object that represents a local time
      const localTime = {
        year: event.start.getFullYear(),
        month: event.start.getMonth() + 1,
        day: event.start.getDate(),
        hour: event.start.getHours(),
        minute: event.start.getMinutes(),
        second: event.start.getSeconds(),
      };

      // Create DateTime in the specified timezone with those local values
      const startLocalISO = DateTime.fromObject(localTime, {
        zone: tzid,
      }).toISO({ suppressMilliseconds: true, includeOffset: false })!;
      const durationMs = event.end.getTime() - event.start.getTime();

      console.log("[DEBUG] Event conversion:", {
        originalDate: event.start,
        localTime,
        startLocalISO,
        tzid,
        weekday: event.start.getDay(),
        rdateUtc: event.rdateUtc,
        exdateUtc: event.exdateUtc,
      });

      // Convert rdateUtc if present (these are stored as local times but need to be UTC)
      const rdateUtcConverted = event.rdateUtc?.map((rdate) => {
        const rdateLocal = {
          year: rdate.getFullYear(),
          month: rdate.getMonth() + 1,
          day: rdate.getDate(),
          hour: rdate.getHours(),
          minute: rdate.getMinutes(),
          second: rdate.getSeconds(),
        };
        const utcDate = DateTime.fromObject(rdateLocal, { zone: tzid })
          .toUTC()
          .toJSDate();
        console.log("[DEBUG] RDATE conversion:", {
          original: rdate,
          rdateLocal,
          utcDate,
          utcDay: utcDate.getDay(),
        });
        return utcDate;
      });

      const createdEvent = await mgr.createEvent({
        title: event.title,
        description: event.description,
        address: event.address,
        importance: event.importance,
        timeLabel: event.timeLabel,
        startLocalISO,
        tzid,
        durationMs,
        recurrence: event.recurrence,
        rdateUtc: rdateUtcConverted,
        exdateUtc: event.exdateUtc,
      });

      console.log("[DEBUG] Created event in manager:", {
        managerId: createdEvent.id,
        originalId: event.id,
      });

      // Map manager ID to original event ID
      eventIdMap.set(createdEvent.id, event.id);
    }

    // Generate occurrences for the window
    const rawOccurrences = await mgr.getOccurrencesWindow(
      windowStart,
      windowEnd,
    );

    console.log("[recurrence.store] Raw occurrences:", {
      count: rawOccurrences.length,
      eventIdMap: Array.from(eventIdMap.entries()),
    });

    // Map to our interface and include event details
    const occurrences: RecurrenceOccurrence[] = rawOccurrences.map(
      (occ: any) => {
        // Map manager ID back to original event ID
        const originalEventId = eventIdMap.get(occ.eventId) || occ.eventId;
        const masterEvent = events.find((e) => e.id === originalEventId);

        console.log("[DEBUG] Generated occurrence:", {
          managerEventId: occ.eventId,
          originalEventId,
          startUtc: occ.startUtc,
          startUtcDay: occ.startUtc.getDay(), // 0=Sun, 6=Sat
          startUtcDate: occ.startUtc.getDate(),
          originalLocalISO: occ.originalLocalISO,
          masterEventFound: !!masterEvent,
        });

        // Check if this is a forever recurring event
        const isForever = masterEvent
          ? masterEvent.recurrence &&
            masterEvent.recurrence.type !== "NONE" &&
            ((masterEvent.recurrence.type === "RRULE" &&
              !masterEvent.recurrence.until &&
              !masterEvent.recurrence.count) ||
              (masterEvent.recurrence.type === "WEEKLY_BITMASK" &&
                !masterEvent.recurrence.until &&
                !masterEvent.recurrence.count))
          : false;

        return {
          id: occ.id || `${originalEventId}-${occ.startUtc.getTime()}`,
          eventId: originalEventId,
          startUtc: occ.startUtc,
          endUtc: occ.endUtc,
          originalLocalISO: occ.originalLocalISO,
          title: masterEvent?.title || "Recurring Event",
          description: masterEvent?.description,
          address: masterEvent?.address,
          importance: masterEvent?.importance,
          timeLabel: masterEvent?.timeLabel,
          // New sliding window fields
          recurrenceGroupId: `group-${originalEventId}`,
          isForever,
          isDuplicate: false,
          originalEventId,
        };
      },
    );

    // Update store with success
    console.log(
      "[recurrence.store] Successfully loaded occurrences:",
      occurrences.length,
    );
    recurrenceStore.update((s) => ({
      ...s,
      occurrences,
      loading: false,
      error: null,
      lastUpdated: new Date(),
    }));
  } catch (error: any) {
    console.error("Error loading recurrence occurrences:", error);
    recurrenceStore.update((s) => ({
      ...s,
      occurrences: [],
      loading: false,
      error: error.message || "Failed to load recurring events",
      lastUpdated: new Date(),
    }));
  }
}

/**
 * Get occurrences for a specific date
 */
export function getOccurrencesForDate(
  occurrences: RecurrenceOccurrence[],
  date: Date,
): RecurrenceOccurrence[] {
  const targetDateString = date.toDateString();
  return occurrences.filter((occ) => {
    const occDate = new Date(occ.startUtc);
    return occDate.toDateString() === targetDateString;
  });
}

/**
 * Get all occurrences for the current selected date
 * This is a derived store that automatically updates when selected date or occurrences change
 */
export const todaysOccurrences = derived(
  [recurrenceStore, selectedDate],
  ([$recurrenceState, $selectedDate]) => {
    return getOccurrencesForDate($recurrenceState.occurrences, $selectedDate);
  },
);

/**
 * Get all display events (regular events + recurring occurrences) for a specific date
 * This combines regular events with generated occurrences
 */
export const getDisplayEventsForDate = derived(
  [events, recurrenceStore],
  ([$events, $recurrenceState]) => {
    return (date: Date) => {
      // Get regular events for the date
      const regularEvents = $events.filter((event) => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
      });

      // Get recurring occurrences for the date
      const recurringOccurrences = getOccurrencesForDate(
        $recurrenceState.occurrences,
        date,
      );

      // Convert occurrences to event format for display
      const occurrenceEvents = recurringOccurrences.map((occ) => ({
        id: occ.id,
        title: occ.title,
        start: occ.startUtc,
        end: occ.endUtc,
        description: occ.description,
        address: occ.address,
        importance: occ.importance,
        timeLabel: occ.timeLabel,
        isRecurring: true,
        originalEventId: occ.eventId,
      }));

      // Combine and sort by start time
      return [...regularEvents, ...occurrenceEvents].sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      );
    };
  },
);

/**
 * Combined display events (regular + recurring occurrences), sorted by start
 */
export const displayEvents = derived(
  [events, recurrenceStore],
  ([$events, $recurrenceState]) => {
    const recurringEventIds = new Set(
      $events
        .filter((e) => e.recurrence && e.recurrence.type !== "NONE")
        .map((e) => e.id),
    );

    const occurrenceEvents = $recurrenceState.occurrences
      .filter((occ) => recurringEventIds.has(occ.eventId))
      .map(
        (occ) =>
          ({
            id: occ.id,
            eventId: occ.eventId,
            title: occ.title,
            start: occ.startUtc,
            end: occ.endUtc,
            description: occ.description,
            address: occ.address,
            importance: occ.importance,
            timeLabel: occ.timeLabel,
          }) as any,
      );

    const regularEvents = $events.filter(
      (e) => !e.recurrence || e.recurrence.type === "NONE",
    );

    return [...regularEvents, ...occurrenceEvents].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );
  },
);

/**
 * Display events filtered to the currently selected date
 */
export const eventsForSelectedDate = derived(
  [displayEvents, selectedDate],
  ([$displayEvents, $selectedDate]) => {
    const startOfDay = new Date($selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date($selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return $displayEvents.filter((event: any) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventStart <= endOfDay && eventEnd >= startOfDay;
    });
  },
);

/**
 * Check if an event is forever recurring (no end date)
 */
export function isForeverRecurring(event: Event): boolean {
  if (!event.recurrence || event.recurrence.type === "NONE") {
    return false;
  }

  if (event.recurrence.type === "RRULE") {
    return !event.recurrence.until && !event.recurrence.count;
  }

  if (event.recurrence.type === "WEEKLY_BITMASK") {
    return !event.recurrence.until && !event.recurrence.count;
  }

  return false;
}

/**
 * Get forever recurring events from current occurrences
 */
export const foreverRecurringEvents = derived(
  recurrenceStore,
  ($recurrenceState) => {
    return $recurrenceState.occurrences.filter((occ) => occ.isForever);
  },
);
