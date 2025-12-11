/**
 * @fileoverview Gap-finding store for personal assistant
 *
 * This module manages the state and data flow for the gap-finding algorithm.
 * It converts calendar events to gap-finder format, handles midnight-crossing events,
 * and provides reactive stores for gaps, statistics, and day boundaries.
 *
 * @author Personal Assistant Team
 * @version 1.0.0
 */

import { writable, derived, readable, type Readable } from "svelte/store";
import type { DayBoundaries, Event } from "../services/gap-finder.ts";
import { GapFinder } from "../services/gap-finder.ts";
import { dataState } from "../../../bootstrap/data.svelte.ts";
import { calendarState } from "../../calendar/state/calendar.svelte.ts";
import type { Event as CalendarEvent } from "$lib/types.ts";
import type { ExpandedOccurrence } from "../../calendar/state/calendar.svelte.ts";
import {
  enrichGapsWithLocation,
  type EnrichableEvent,
} from "../services/suggestions/index.ts";

/**
 * Creates a polling-based store from Svelte 5 state
 * This is a temporary bridge until the module is fully migrated to Svelte 5
 * Only notifies subscribers when the value actually changes
 */
function createPollingStore<T>(getter: () => T): Readable<T> {
  return readable(getter(), (set) => {
    let lastValue = getter();

    const interval = setInterval(() => {
      const newValue = getter();
      // Only update if the reference changed
      if (newValue !== lastValue) {
        lastValue = newValue;
        set(newValue);
      }
    }, 500); // Poll every 500ms (reduced frequency)

    return () => clearInterval(interval);
  });
}

// Reactive stores bridging Svelte 5 state to Svelte 4 stores
const selectedDate = createPollingStore(() => dataState.selectedDate);
const calendarEvents = createPollingStore(() => calendarState.events);
const calendarOccurrences = createPollingStore(() => calendarState.occurrences);

/**
 * User-configurable day boundaries for gap calculation
 * Default: 8:00 AM to 11:00 PM
 */
export const dayBoundaries = writable<DayBoundaries>({
  dayStart: "08:00",
  dayEnd: "23:00",
});

/**
 * Converts calendar events to gap-finder format for the selected date
 * Handles midnight-crossing events by splitting them appropriately
 * @param calendarEvent - Calendar event with Date objects
 * @param targetDate - Date to filter events for
 * @returns Gap-finder event or null if not applicable to target date
 */
function convertCalendarEventToGapEvent(
  calendarEvent:
    | CalendarEvent
    | { start: Date; end: Date; id: string; title: string; timeLabel?: string },
  targetDate: Date,
): Event | null {
  const eventStartDate = new Date(calendarEvent.start);
  const eventEndDate = new Date(calendarEvent.end);

  // Calculate day boundaries for target date
  const targetDayStart = new Date(targetDate);
  targetDayStart.setHours(0, 0, 0, 0);
  const targetDayEnd = new Date(targetDate);
  targetDayEnd.setHours(23, 59, 59, 999);

  // Check if event overlaps with target date (handles multi-day events)
  const eventStartsBeforeDayEnd =
    eventStartDate.getTime() <= targetDayEnd.getTime();
  const eventEndsAfterDayStart =
    eventEndDate.getTime() >= targetDayStart.getTime();

  if (!eventStartsBeforeDayEnd || !eventEndsAfterDayStart) {
    return null; // Event doesn't overlap with target date at all
  }

  // Handle all-day events specially: they span the full day (00:00 to 23:59)
  if (calendarEvent.timeLabel === "all-day") {
    return {
      id: calendarEvent.id,
      title: calendarEvent.title,
      start: "00:00",
      end: "23:59",
      crossesMidnight: false,
    };
  }

  // For timed events, determine the actual time range on this specific day
  let startTime: string = "";
  let endTime: string = "";

  // Normalize dates for comparison (ignore time component)
  const normalizedTargetDate = new Date(targetDate);
  normalizedTargetDate.setHours(0, 0, 0, 0);
  const normalizedEventStart = new Date(eventStartDate);
  normalizedEventStart.setHours(0, 0, 0, 0);
  const normalizedEventEnd = new Date(eventEndDate);
  normalizedEventEnd.setHours(0, 0, 0, 0);

  // Determine start time: use event start if it's on this day, otherwise use 00:00
  const eventStartsOnTarget =
    normalizedEventStart.getTime() === normalizedTargetDate.getTime();
  if (eventStartsOnTarget) {
    // Event starts on target date - use actual start time
    startTime = calendarEvent.start.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else {
    // Event started before target date - starts at beginning of day
    startTime = "00:00";
  }

  // Determine end time: use event end if it's on this day, otherwise use 23:59
  // Check if event ends on the target date by comparing normalized dates
  const eventEndsOnTarget =
    normalizedEventEnd.getTime() === normalizedTargetDate.getTime();

  if (eventEndsOnTarget) {
    // Event ends on target date - use actual end time
    endTime = calendarEvent.end.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else {
    // Event doesn't end on target date - it continues through this day, so use end of day
    // This handles both: events that end after target date AND events that started before
    endTime = "23:59";
  }

  return {
    id: calendarEvent.id,
    title: calendarEvent.title,
    start: startTime,
    end: endTime,
    crossesMidnight: startTime > endTime,
  };
}

/**
 * Gap-finder events derived from calendar events for the selected date
 * Automatically converts and filters events when calendar or date changes
 */
export const events = derived(
  [calendarEvents, calendarOccurrences, selectedDate],
  ([$events, $occurrences, $selectedDate]) => {
    // Combine master events and expanded recurring occurrences
    const allEvents: Array<
      | CalendarEvent
      | {
          id: string;
          title: string;
          start: Date;
          end: Date;
          description?: string;
          address?: string;
          importance?: "low" | "medium" | "high";
          timeLabel?: string;
        }
    > = [
      ...$events,
      ...$occurrences.map((occ) => ({
        id: occ.id,
        title: occ.title,
        start: occ.start,
        end: occ.end,
        description: occ.description,
        address: occ.location,
        importance: occ.importance,
        timeLabel: occ.timeLabel,
      })),
    ];

    // Let convertCalendarEventToGapEvent handle overlap detection and day clipping
    return allEvents
      .map((event) => convertCalendarEventToGapEvent(event, $selectedDate))
      .filter((event): event is Event => event !== null);
  },
);

/**
 * Gap finder instance with current day boundaries
 * Automatically creates new instance when boundaries change
 */
export const gapFinder = derived(
  dayBoundaries,
  (boundaries) => new GapFinder(boundaries),
);

/**
 * Calculated free time gaps for the selected date
 * Automatically recalculates when events or day boundaries change
 */
export const gaps = derived([events, gapFinder], ([eventList, finder]) => {
  return finder.findGaps(eventList);
});

/**
 * Convert gap-finder events to enrichable events for location derivation
 * Currently events don't have locationLabel, so this just converts the format
 * When events get location data, this will pass it through
 */
function toEnrichableEvents(gapEvents: Event[]): EnrichableEvent[] {
  return gapEvents.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    // locationLabel will be undefined for now
    // When CalendarEvent gets locationLabel, we'll pass it through here
  }));
}

/**
 * Enriched gaps with location labels derived from surrounding events
 * Uses the gap enrichment module to add locationLabel to each gap
 */
export const enrichedGaps = derived([gaps, events], ([$gaps, $events]) => {
  const enrichableEvents = toEnrichableEvents($events);
  return enrichGapsWithLocation($gaps, enrichableEvents);
});

/**
 * Gap statistics including total time, largest gap, and counts
 * Automatically recalculates when gaps change
 */
export const gapStats = derived(gaps, (gapList) => {
  const totalGapTime = gapList.reduce((sum, gap) => sum + gap.duration, 0);
  const largestGap = gapList.reduce(
    (max, gap) => (gap.duration > max.duration ? gap : max),
    { duration: 0, start: "", end: "" },
  );
  const gapCount = gapList.length;

  return {
    totalGapTime,
    largestGap,
    gapCount,
    averageGapTime: gapCount > 0 ? totalGapTime / gapCount : 0,
  };
});

/**
 * Actions for managing day boundaries
 * Provides methods to update start/end times and reset to defaults
 */
export const dayBoundaryActions = {
  updateDayStart: (start: string) => {
    dayBoundaries.update((current) => ({ ...current, dayStart: start }));
  },

  updateDayEnd: (end: string) => {
    dayBoundaries.update((current) => ({ ...current, dayEnd: end }));
  },

  resetToDefaults: () => {
    dayBoundaries.set({ dayStart: "08:00", dayEnd: "23:00" });
  },

  setCustomBoundaries: (start: string, end: string) => {
    dayBoundaries.set({ dayStart: start, dayEnd: end });
  },
};

// Note: Event management is now handled through the calendar system
// Events are automatically synced from calendarEvents to the gap-finder
