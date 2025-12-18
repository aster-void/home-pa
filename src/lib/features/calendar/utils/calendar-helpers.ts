/**
 * Calendar utility functions
 */
import type { Event } from "$lib/types.ts";
import {
  eventOccursOnDate,
  compareDateForEvent,
  toUTCDateOnly,
} from "$lib/utils/date-utils.ts";

/**
 * Get the position for the current time indicator
 */
export function getCurrentTimePositionScaled(selectedDate: Date): number {
  const now = new Date();
  const currentDate = new Date();
  const selectedDateOnly = new Date(selectedDate);
  selectedDateOnly.setHours(0, 0, 0, 0);

  // Only show current time line if it's today
  if (currentDate.toDateString() !== selectedDateOnly.toDateString()) {
    return -1000; // Hide the line
  }

  const hours = now.getHours();
  const minutes = now.getMinutes();
  return (hours * 60 + minutes) * (400 / 1440); // Scale to fit 400px height
}

/**
 * Get the position for an event on the timeline
 */
export function getEventPositionScaled(
  startTime: Date,
  timeLabel?: string,
): number {
  // All-day events start at 00:00 (position 0)
  if (timeLabel === "all-day") {
    return 0;
  }

  const hours = startTime.getHours();
  const minutes = startTime.getMinutes();
  return (hours * 60 + minutes) * (400 / 1440);
}

/**
 * Get the height for an event block
 */
export function getEventHeightScaled(event: Event): number {
  // All-day events span the full timeline height (00:00 to 23:59 = 24 hours)
  if (event.timeLabel === "all-day") {
    return 400;
  }

  const startTime = event.start;
  const endTime = event.end;
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.max(durationMs / (1000 * 60), 15);
  return durationMinutes * (400 / 1440);
}

/**
 * Get events for a specific date (including midnight-crossing events)
 *
 * For all-day events: Uses UTC date comparison to handle timezone differences correctly.
 * All-day events are stored as UTC midnight (00:00:00.000Z), so we compare
 * the date components in UTC to avoid timezone-related display issues.
 *
 * For timed events: Uses local time comparison as the events have specific times.
 */
export function getEventsForDate(events: Event[], targetDate: Date): Event[] {
  return events
    .filter((event) => {
      const isAllDay = event.timeLabel === "all-day";
      return eventOccursOnDate(event.start, event.end, targetDate, isAllDay);
    })
    .map((event) => {
      const isAllDay = event.timeLabel === "all-day";

      if (isAllDay) {
        // For all-day events, don't truncate - they span full days
        // The event already represents full days, no time truncation needed
        return event;
      }

      // For timed events, handle midnight-crossing scenarios
      const targetDateStart = new Date(targetDate);
      targetDateStart.setHours(0, 0, 0, 0);
      const targetDateEnd = new Date(targetDate);
      targetDateEnd.setHours(23, 59, 59, 999);
      const targetDateStartTime = targetDateStart.getTime();
      const targetDateEndTime = targetDateEnd.getTime();

      const eventStartTime = event.start.getTime();
      const eventEndTime = event.end.getTime();

      const startsOnTarget =
        eventStartTime >= targetDateStartTime &&
        eventStartTime <= targetDateEndTime;
      const endsOnTarget =
        eventEndTime >= targetDateStartTime &&
        eventEndTime <= targetDateEndTime;
      const spansTarget =
        eventStartTime < targetDateStartTime &&
        eventEndTime > targetDateEndTime;

      // If event starts and ends on the same day, return as is
      if (startsOnTarget && endsOnTarget) {
        return event;
      }

      // If event starts on target date but ends next day, truncate at midnight
      if (startsOnTarget && !endsOnTarget) {
        const truncatedEnd = new Date(targetDate);
        truncatedEnd.setHours(23, 59, 59, 999);
        return {
          ...event,
          end: truncatedEnd,
        };
      }

      // If event ends on target date but started yesterday, start at midnight
      if (!startsOnTarget && endsOnTarget) {
        const truncatedStart = new Date(targetDate);
        truncatedStart.setHours(0, 0, 0, 0);
        return {
          ...event,
          start: truncatedStart,
        };
      }

      // If event spans the target date (starts before and ends after), truncate to full day
      if (spansTarget) {
        const truncatedStart = new Date(targetDate);
        truncatedStart.setHours(0, 0, 0, 0);
        const truncatedEnd = new Date(targetDate);
        truncatedEnd.setHours(23, 59, 59, 999);
        return {
          ...event,
          start: truncatedStart,
          end: truncatedEnd,
        };
      }

      return event;
    });
}

/**
 * Get events for timeline (includes timed and all-day events)
 */
export function getEventsForTimeline(
  events: Event[],
  targetDate: Date,
): Event[] {
  return getEventsForDate(events, targetDate).filter((event) => {
    // Include timed events and all-day events in timeline
    // Exclude only some-timing events (they don't belong in timeline)
    return event.timeLabel === "timed" || event.timeLabel === "all-day";
  });
}

/**
 * Organize events into columns for display
 */
export function getEventColumns(events: Event[]): Event[][] {
  if (events.length === 0) return [];

  // Separate all-day events from timed events
  const allDayEvents = events.filter((e) => e.timeLabel === "all-day");
  const timedEvents = events.filter((e) => e.timeLabel !== "all-day");

  // Sort timed events by start time
  const sortedTimedEvents = [...timedEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  // First, allocate columns for all-day events (each gets its own column)
  const allDayColumns: Event[][] = [];
  for (const allDayEvent of allDayEvents) {
    allDayColumns.push([allDayEvent]);
  }

  // Handle timed events with overlap detection (only among timed events)
  const timedColumns: Event[][] = [];
  for (const event of sortedTimedEvents) {
    // Find the first column where this event doesn't overlap with other timed events
    let columnIndex = 0;
    while (columnIndex < timedColumns.length) {
      const column = timedColumns[columnIndex];
      const lastEvent = column[column.length - 1];

      // For timed events, check actual time overlap
      if (event.start >= lastEvent.end) {
        break;
      }
      columnIndex++;
    }

    // If no suitable column found, create a new one
    if (columnIndex >= timedColumns.length) {
      timedColumns.push([]);
    }

    timedColumns[columnIndex].push(event);
  }

  // Combine: all-day columns first, then timed columns
  return [...allDayColumns, ...timedColumns];
}

/**
 * Check if this is the first day of an event
 *
 * For all-day events: Uses UTC date comparison
 * For timed events: Uses local time comparison
 */
export function isFirstDayOfEvent(event: Event, targetDate: Date): boolean {
  const isAllDay = event.timeLabel === "all-day";
  const comparison = compareDateForEvent(event.start, targetDate, isAllDay);
  return comparison.isSame;
}

/**
 * Get event color based on importance
 */
export function getEventColor(event: Event): string {
  const palette: readonly string[] = [
    "var(--color-primary)",
    "var(--color-primary-400)",
    "var(--color-primary-800)",
    "color-mix(in srgb, var(--color-primary) 75%, white)",
    "var(--color-success-500)",
    "color-mix(in srgb, var(--color-success-500) 78%, white)",
    "var(--color-warning-500)",
    "color-mix(in srgb, var(--color-warning-500) 78%, white)",
    "var(--color-error-500)",
    "color-mix(in srgb, var(--color-error-500) 75%, white)",
    "color-mix(in srgb, var(--color-primary-800) 70%, black)",
    "color-mix(in srgb, var(--color-primary) 65%, var(--color-surface-100))",
  ];

  const keyParts = [
    event.id ?? "",
    event.title ?? "",
    event.start ? event.start.toISOString() : "",
  ];
  const hash = keyParts.join("|").split("").reduce((acc, char) => {
    const next = acc * 31 + char.charCodeAt(0);
    return next & next;
  }, 0);

  const base =
    palette[Math.abs(hash) % palette.length] ?? "var(--color-primary)";

  const importance = event.importance || "medium";
  if (importance === "high") {
    return `color-mix(in srgb, ${base} 85%, black)`;
  }
  if (importance === "low") {
    return `color-mix(in srgb, ${base} 85%, white)`;
  }

  return base;
}

/**
 * Get event bar position for calendar grid view
 *
 * For all-day events: Uses UTC date comparison for timezone safety
 * For timed events: Uses local time comparison
 *
 * @param eventStart - Event start date
 * @param eventEnd - Event end date
 * @param day - The day being rendered
 * @param isAllDay - Whether this is an all-day event (optional, defaults to true for backwards compatibility)
 */
export function getEventBarPosition(
  eventStart: Date,
  eventEnd: Date,
  day: Date,
  isAllDay = true,
): "start" | "middle" | "end" | "single" {
  if (isAllDay) {
    // For all-day events: use UTC date comparison
    const eventStartUTC = toUTCDateOnly(eventStart);
    const eventEndUTC = toUTCDateOnly(eventEnd);
    const currentUTC = Date.UTC(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
    );

    // Single day event
    if (eventStartUTC === eventEndUTC) {
      return "single";
    }

    // Multi-day event
    if (currentUTC === eventStartUTC) {
      return "start";
    } else if (currentUTC === eventEndUTC) {
      return "end";
    } else if (currentUTC > eventStartUTC && currentUTC < eventEndUTC) {
      return "middle";
    }

    return "single";
  } else {
    // For timed events: use local time comparison
    const eventStartDate = new Date(eventStart);
    eventStartDate.setHours(0, 0, 0, 0);
    const eventEndDate = new Date(eventEnd);
    eventEndDate.setHours(0, 0, 0, 0);
    const currentDate = new Date(day);
    currentDate.setHours(0, 0, 0, 0);

    const eventStartTime = eventStartDate.getTime();
    const eventEndTime = eventEndDate.getTime();
    const currentTime = currentDate.getTime();

    // Single day event
    if (eventStartTime === eventEndTime) {
      return "single";
    }

    // Multi-day event
    if (currentTime === eventStartTime) {
      return "start";
    } else if (currentTime === eventEndTime) {
      return "end";
    } else if (currentTime > eventStartTime && currentTime < eventEndTime) {
      return "middle";
    }

    return "single";
  }
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Get calendar days for a month view
 */
export function getCalendarDays(currentMonth: Date): Date[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);

  // Start from the Sunday before (or on) the first day
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // End on the Saturday after (or on) the last day
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the current month
 */
export function isCurrentMonth(date: Date, currentMonth: Date): boolean {
  return (
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear()
  );
}

/**
 * Check if a date is selected
 */
export function isSelected(date: Date, selectedDate: Date): boolean {
  return (
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear()
  );
}
