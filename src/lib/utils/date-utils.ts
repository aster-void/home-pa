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
 * Creates an all-day UTC Date range from a local date string
 * Used for all-day events
 */
export function createAllDayUTCRange(dateString: string): { start: Date; end: Date } {
  if (!dateString) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
    return { start, end };
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { start, end };
}


/**
 * Creates a multi-day all-day UTC Date range from start and end date strings
 * Used for all-day events that span multiple days
 */
export function createMultiDayAllDayUTCRange(startDateString: string, endDateString: string): { start: Date; end: Date } {
  if (!startDateString || !endDateString) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
    return { start, end };
  }
  
  const [startYear, startMonth, startDay] = startDateString.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateString.split('-').map(Number);
  
  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));
  return { start, end };
}
