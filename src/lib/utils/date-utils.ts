/**
 * Unified Date Handling Utilities
 *
 * This module provides consistent date handling throughout the application:
 * - Store: Always saves dates in UTC
 * - Display: Always converts UTC to local time for UI
 */

/**
 * Converts a local datetime string (YYYY-MM-DDTHH:MM) to UTC Date object
 * Used when saving to store
 */
export function localDateTimeStringToUTC(dateTimeString: string): Date {
  if (!dateTimeString) return new Date();
  const [datePart, timePart] = dateTimeString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  // Create Date in local timezone first, then it gets stored as UTC
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Converts a UTC Date object to local date string (YYYY-MM-DD)
 * Used when displaying in UI
 */
export function utcToLocalDateString(utcDate: Date): string {
  // Convert UTC date to local timezone for display
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converts a UTC Date object to local datetime string (YYYY-MM-DDTHH:MM)
 * Used when displaying in UI
 */
export function utcToLocalDateTimeString(utcDate: Date): string {
  // Convert UTC date to local timezone for display
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getDate()).padStart(2, "0");
  const hours = String(utcDate.getHours()).padStart(2, "0");
  const minutes = String(utcDate.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a UTC Date object to local time string (HH:MM)
 * Used when displaying time in UI
 */
export function utcToLocalTimeString(utcDate: Date): string {
  const hours = String(utcDate.getHours()).padStart(2, "0");
  const minutes = String(utcDate.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Formats a Date into a localized date string (ja-JP)
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
    hour12: false,
  });
}

/**
 * Creates a UTC Date object from local date and time strings
 * Used when combining separate date and time inputs
 */
export function localDateTimeToUTC(
  dateString: string,
  timeString: string,
): Date {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split("-").map(Number);
  if (!timeString) {
    // If no time, create date at start of day in local timezone
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  const [hours, minutes] = timeString.split(":").map(Number);
  // Create Date in local timezone first, then it gets stored as UTC
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
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

  const [year, month, day] = dateString.split("-").map(Number);
  // Create UTC date at 00:00 for date-only events
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Converts a local date string (YYYY-MM-DD) to a UTC Date at 00:00
 * Useful for normalizing single-day selections
 */
export function localDateStringToUTC(dateString: string): Date {
  return createDateOnlyUTC(dateString);
}

/**
 * Builds a single-day all-day UTC range (00:00 to 23:59:59.999) for the given date
 */
export function createAllDayUTCRange(dateString: string): { start: Date; end: Date } {
  const start = createDateOnlyUTC(dateString);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Builds a multi-day all-day UTC range (inclusive end-of-day on the final date)
 */
export function createMultiDayAllDayUTCRange(
  startDateString: string,
  endDateString: string,
): { start: Date; end: Date } {
  const start = createDateOnlyUTC(startDateString);
  const end = createDateOnlyUTC(endDateString || startDateString);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

