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

import { writable, derived } from "svelte/store";
import type { DayBoundaries, Event } from "../services/gap-finder.js";
import { GapFinder } from "../services/gap-finder.js";
import { events as calendarEvents, selectedDate } from "./data.js";
import type { Event as CalendarEvent } from "../types.js";

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
  calendarEvent: CalendarEvent,
  targetDate: Date,
): Event | null {
  const eventStartDate = new Date(calendarEvent.start);
  const eventEndDate = new Date(calendarEvent.end);
  const targetDateString = targetDate.toDateString();

  // Include events that either start OR end on the target date
  const startsOnTarget = eventStartDate.toDateString() === targetDateString;
  const endsOnTarget = eventEndDate.toDateString() === targetDateString;

  if (!startsOnTarget && !endsOnTarget) {
    return null;
  }

  // For events that cross midnight and end on the target date,
  // we need to create a modified version that starts at midnight
  let startTime: string = "";
  let endTime: string = "";

  if (startsOnTarget && endsOnTarget) {
    // Event starts and ends on the same day - use actual times
    startTime = calendarEvent.start.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    endTime = calendarEvent.end.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else if (startsOnTarget && !endsOnTarget) {
    // Event starts on target date but ends next day - truncate at midnight
    startTime = calendarEvent.start.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    endTime = "23:59"; // Truncate at end of day
  } else if (!startsOnTarget && endsOnTarget) {
    // Event ends on target date but started yesterday - start at midnight
    startTime = "00:00";
    endTime = calendarEvent.end.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
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
  [calendarEvents, selectedDate],
  ([$calendarEvents, $selectedDate]) => {
    return $calendarEvents
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
