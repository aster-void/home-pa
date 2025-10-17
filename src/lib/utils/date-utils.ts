/**
 * Unified Date Handling Utilities
 * 
 * This module provides consistent date handling throughout the application:
 * - Store: Always saves dates in UTC
 * - Display: Always converts UTC to local time for UI
 */

/**
 * Converts a local date string (YYYY-MM-DD) to UTC Date object
 * Used when saving to store
 */
export function localDateStringToUTC(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Parse the local date and create UTC date
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Converts a local datetime string (YYYY-MM-DDTHH:MM) to UTC Date object
 * Used when saving to store
 */
export function localDateTimeStringToUTC(dateTimeString: string): Date {
  if (!dateTimeString) return new Date();
  
  const [datePart, timePart] = dateTimeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  return new Date(Date.UTC(year, month - 1, day, hours, minutes));
}

/**
 * Converts a UTC Date object to local date string (YYYY-MM-DD)
 * Used when displaying in UI
 */
export function utcToLocalDateString(utcDate: Date): string {
  // Convert UTC date to local timezone for display
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a UTC Date object to local datetime string (YYYY-MM-DDTHH:MM)
 * Used when displaying in UI
 */
export function utcToLocalDateTimeString(utcDate: Date): string {
  // Convert UTC date to local timezone for display
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getDate()).padStart(2, '0');
  const hours = String(utcDate.getHours()).padStart(2, '0');
  const minutes = String(utcDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a UTC Date object to local time string (HH:MM)
 * Used when displaying time in UI
 */
export function utcToLocalTimeString(utcDate: Date): string {
  const hours = String(utcDate.getHours()).padStart(2, '0');
  const minutes = String(utcDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats a Date into a localized date string (ja-JP)
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Formats a Date into a localized date+time string (ja-JP)
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

/**
 * Creates a UTC Date object from local date and time strings
 * Used when combining separate date and time inputs
 */
export function localDateTimeToUTC(dateString: string, timeString: string): Date {
  if (!dateString) return new Date();
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!timeString) {
    // If no time, create date at start of day UTC
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }
  
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes));
}

/**
 * Creates a date-only UTC Date for all-day and some-timing events
 * For these events, start and end are the same (date at 00:00 UTC)
 */
export function createDateOnlyUTC(dateString: string): Date {
  if (!dateString) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  // Create UTC date at 00:00 for date-only events
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Creates an all-day UTC Date range from a local date string
 * Used for all-day events (legacy function - use createDateOnlyUTC instead)
 */
export function createAllDayUTCRange(dateString: string): { start: Date; end: Date } {
  const dateOnly = createDateOnlyUTC(dateString);
  return { start: dateOnly, end: dateOnly };
}


/**
 * Creates a multi-day all-day UTC Date range from start and end date strings
 * Used for all-day events that span multiple days
 * For multi-day events, start is first day at 00:00 UTC, end is last day at 00:00 UTC
 */
export function createMultiDayAllDayUTCRange(startDateString: string, endDateString: string): { start: Date; end: Date } {
  if (!startDateString || !endDateString) {
    const now = new Date();
    const dateOnly = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    return { start: dateOnly, end: dateOnly };
  }
  
  const [startYear, startMonth, startDay] = startDateString.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateString.split('-').map(Number);
  
  // Create UTC dates at 00:00 for multi-day date-only events
  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));
  return { start, end };
}

/**
 * Helper function to determine if an event is date-only (all-day or some-timing)
 */
export function isDateOnlyEvent(event: { timeLabel?: string; start: Date; end: Date }): boolean {
  if (event.timeLabel === "all-day" || event.timeLabel === "some-timing") {
    return true;
  }
  
  // Fallback: check if start and end are the same (date-only)
  return event.start.getTime() === event.end.getTime();
}

/**
 * Helper function to get the date string for date-only events
 */
export function getEventDateString(event: { start: Date; end: Date }): string {
  return utcToLocalDateString(event.start);
}
