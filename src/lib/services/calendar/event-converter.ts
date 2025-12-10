/**
 * Event Converter
 *
 * Converts between different event representations:
 * - Prisma CalendarEvent (database)
 * - App Event interface (UI/stores)
 * - iCalendar ParsedEvent (import/export)
 */

import type { CalendarEvent } from "@prisma/client";
import type { Event, Recurrence } from "../../types.ts";
import {
  createVEvent,
  parseVEventString,
  type ParsedEvent,
} from "./ical-service.ts";

// ============================================================================
// DATABASE → APP
// ============================================================================

/**
 * Convert Prisma CalendarEvent to app Event interface
 * Used when loading events from database for display
 *
 * @param dbEvent - CalendarEvent from Prisma
 * @returns Event for use in app stores/UI
 */
export function dbEventToAppEvent(dbEvent: CalendarEvent): Event {
  // Determine timeLabel
  let timeLabel: "all-day" | "some-timing" | "timed";
  if (dbEvent.isAllDay) {
    timeLabel = "all-day";
  } else {
    timeLabel = "timed";
  }

  // Build recurrence object
  let recurrence: Recurrence;
  if (dbEvent.hasRecurrence && dbEvent.rrule) {
    recurrence = {
      type: "RRULE",
      rrule: dbEvent.rrule,
    };
  } else {
    recurrence = { type: "NONE" };
  }

  // Convert end date: For all-day events, DB stores exclusive DTEND (iCal standard)
  // App uses inclusive end dates, so we need to subtract 1 day for multi-day events
  let appEndDate: Date;
  if (dbEvent.isAllDay && dbEvent.dtend) {
    // For all-day events, dtend is exclusive (day after event ends)
    // Convert to inclusive: subtract 1 day (or 1ms before midnight of previous day)
    const exclusiveEnd = new Date(dbEvent.dtend);
    const startDate = new Date(dbEvent.dtstart);
    startDate.setHours(0, 0, 0, 0);
    exclusiveEnd.setHours(0, 0, 0, 0);

    // Check if it's multi-day (exclusive end > start)
    if (exclusiveEnd.getTime() > startDate.getTime()) {
      // Multi-day event: convert exclusive to inclusive
      const inclusiveEnd = new Date(exclusiveEnd);
      inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
      inclusiveEnd.setHours(23, 59, 59, 999); // End of the last day
      appEndDate = inclusiveEnd;
    } else {
      // Single-day event: end = start
      appEndDate = dbEvent.dtstart;
    }
  } else if (dbEvent.dtend) {
    // Timed events: use dtend as-is (not exclusive)
    appEndDate = dbEvent.dtend;
  } else {
    // No end date: use start as end
    appEndDate = dbEvent.dtstart;
  }

  return {
    id: dbEvent.id,
    title: dbEvent.summary,
    start: dbEvent.dtstart,
    end: appEndDate,
    description: dbEvent.description || undefined,
    address: dbEvent.location || undefined,
    timeLabel,
    tzid: dbEvent.dtstartTzid || undefined,
    recurrence,
    // Store the icalData for recurrence expansion
    icalData: dbEvent.icalData || undefined,
    // Recurrence group ID for linking occurrences
    recurrenceGroupId: dbEvent.hasRecurrence
      ? `group-${dbEvent.id}`
      : undefined,
    isForever:
      dbEvent.hasRecurrence &&
      !dbEvent.rrule?.includes("UNTIL=") &&
      !dbEvent.rrule?.includes("COUNT="),
  };
}

/**
 * Convert array of database events to app events
 */
export function dbEventsToAppEvents(dbEvents: CalendarEvent[]): Event[] {
  return dbEvents.map(dbEventToAppEvent);
}

// ============================================================================
// APP → DATABASE
// ============================================================================

/**
 * Convert app Event to Prisma CalendarEvent create input
 * Used when saving new events to database
 *
 * @param event - Event from app (without id)
 * @param userId - User ID for the event
 * @returns Data ready for Prisma create
 */
export function appEventToDbCreate(
  event: Omit<Event, "id">,
  userId: string,
): {
  uid: string;
  userId: string;
  summary: string;
  dtstart: Date;
  dtend: Date | null;
  dtstartTzid: string | null;
  isAllDay: boolean;
  rrule: string | null;
  hasRecurrence: boolean;
  description: string | null;
  location: string | null;
  icalData: string;
} {
  const uid = crypto.randomUUID();

  // Extract RRULE if present
  const rrule =
    event.recurrence?.type === "RRULE" ? event.recurrence.rrule : null;

  const isAllDay = event.timeLabel === "all-day";

  // For all-day events, handle multi-day events correctly
  // iCalendar uses exclusive DTEND for all-day events (the day after the event ends)
  let dbDtend: Date | null = null;
  if (isAllDay && event.end) {
    const startDate = new Date(event.start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(event.end);
    endDate.setHours(0, 0, 0, 0);

    // Check if it's a multi-day event (different days)
    if (endDate.getTime() > startDate.getTime()) {
      // Multi-day event: convert inclusive end to exclusive (add 1 day)
      const exclusiveEnd = new Date(endDate);
      exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      dbDtend = exclusiveEnd;
    }
    // Single-day all-day events: dtend can be null (or same as dtstart + 1 day)
    // For consistency, we'll set it to start + 1 day
    else {
      const exclusiveEnd = new Date(startDate);
      exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      dbDtend = exclusiveEnd;
    }
  } else if (!isAllDay) {
    // Timed events: use the end date as-is
    dbDtend = event.end;
  }

  // Generate iCalendar VEVENT component
  const icalData = createVEvent({
    uid,
    summary: event.title,
    dtstart: event.start,
    dtend: dbDtend || undefined,
    dtstartTzid: event.tzid,
    isAllDay,
    rrule: rrule || undefined,
    description: event.description,
    location: event.address,
  });

  return {
    uid,
    userId,
    summary: event.title,
    dtstart: event.start,
    dtend: dbDtend,
    dtstartTzid: event.tzid || null,
    isAllDay,
    rrule,
    hasRecurrence: !!rrule,
    description: event.description || null,
    location: event.address || null,
    icalData,
  };
}

/**
 * Convert app Event updates to Prisma update data
 * Regenerates icalData if content changed
 *
 * @param updates - Partial event updates
 * @param existingEvent - Current database event (for merging)
 * @returns Data ready for Prisma update
 */
export function appEventToDbUpdate(
  updates: Partial<Omit<Event, "id">>,
  existingEvent: CalendarEvent,
): Partial<{
  summary: string;
  dtstart: Date;
  dtend: Date | null;
  dtstartTzid: string | null;
  isAllDay: boolean;
  rrule: string | null;
  hasRecurrence: boolean;
  description: string | null;
  location: string | null;
  icalData: string;
}> {
  const result: ReturnType<typeof appEventToDbUpdate> = {};

  // Track if we need to regenerate icalData
  let needsIcalRegen = false;

  if (updates.title !== undefined) {
    result.summary = updates.title;
    needsIcalRegen = true;
  }

  if (updates.start !== undefined) {
    result.dtstart = updates.start;
    needsIcalRegen = true;
  }

  if (updates.end !== undefined) {
    // For all-day events, convert inclusive end to exclusive (iCal standard)
    const isAllDay =
      updates.timeLabel !== undefined
        ? updates.timeLabel === "all-day"
        : existingEvent.isAllDay;

    if (isAllDay && updates.end) {
      const startDate = new Date(updates.start ?? existingEvent.dtstart);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(updates.end);
      endDate.setHours(0, 0, 0, 0);

      // Check if it's a multi-day event
      if (endDate.getTime() > startDate.getTime()) {
        // Multi-day: convert inclusive end to exclusive (add 1 day)
        const exclusiveEnd = new Date(endDate);
        exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
        result.dtend = exclusiveEnd;
      } else {
        // Single-day: set to start + 1 day
        const exclusiveEnd = new Date(startDate);
        exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
        result.dtend = exclusiveEnd;
      }
    } else {
      result.dtend = updates.end;
    }
    needsIcalRegen = true;
  }

  if (updates.tzid !== undefined) {
    result.dtstartTzid = updates.tzid || null;
    needsIcalRegen = true;
  }

  if (updates.timeLabel !== undefined) {
    result.isAllDay = updates.timeLabel === "all-day";
    needsIcalRegen = true;

    // If switching to/from all-day, also update dtend format
    if (updates.end !== undefined) {
      // Already handled above
    } else if (updates.timeLabel === "all-day" && existingEvent.dtend) {
      // Converting timed event to all-day: convert dtend to exclusive format
      const startDate = new Date(updates.start ?? existingEvent.dtstart);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(existingEvent.dtend);
      endDate.setHours(0, 0, 0, 0);

      if (endDate.getTime() > startDate.getTime()) {
        const exclusiveEnd = new Date(endDate);
        exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
        result.dtend = exclusiveEnd;
      } else {
        const exclusiveEnd = new Date(startDate);
        exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
        result.dtend = exclusiveEnd;
      }
    }
  }

  if (updates.recurrence !== undefined) {
    if (updates.recurrence.type === "RRULE") {
      result.rrule = updates.recurrence.rrule;
      result.hasRecurrence = true;
    } else {
      result.rrule = null;
      result.hasRecurrence = false;
    }
    needsIcalRegen = true;
  }

  if (updates.description !== undefined) {
    result.description = updates.description || null;
    needsIcalRegen = true;
  }

  if (updates.address !== undefined) {
    result.location = updates.address || null;
    needsIcalRegen = true;
  }

  // Regenerate icalData if needed
  if (needsIcalRegen) {
    const mergedEvent = {
      uid: existingEvent.uid,
      summary: result.summary ?? existingEvent.summary,
      dtstart: result.dtstart ?? existingEvent.dtstart,
      dtend: result.dtend ?? existingEvent.dtend,
      dtstartTzid: result.dtstartTzid ?? existingEvent.dtstartTzid,
      isAllDay: result.isAllDay ?? existingEvent.isAllDay,
      rrule: result.rrule ?? existingEvent.rrule,
      description: result.description ?? existingEvent.description,
      location: result.location ?? existingEvent.location,
    };

    result.icalData = createVEvent({
      uid: mergedEvent.uid,
      summary: mergedEvent.summary,
      dtstart: mergedEvent.dtstart,
      dtend: mergedEvent.dtend || undefined,
      dtstartTzid: mergedEvent.dtstartTzid || undefined,
      isAllDay: mergedEvent.isAllDay,
      rrule: mergedEvent.rrule || undefined,
      description: mergedEvent.description || undefined,
      location: mergedEvent.location || undefined,
    });
  }

  return result;
}

// ============================================================================
// ICALENDAR → DATABASE
// ============================================================================

/**
 * Convert ParsedEvent (from .ics import) to Prisma create input
 * Used when importing events from external calendars
 *
 * @param parsed - ParsedEvent from ical-service
 * @param userId - User ID for the event
 * @returns Data ready for Prisma create
 */
export function parsedEventToDbCreate(
  parsed: ParsedEvent,
  userId: string,
): {
  uid: string;
  userId: string;
  summary: string;
  dtstart: Date;
  dtend: Date | null;
  dtstartTzid: string | null;
  isAllDay: boolean;
  rrule: string | null;
  hasRecurrence: boolean;
  description: string | null;
  location: string | null;
  icalData: string;
} {
  return {
    uid: parsed.uid,
    userId,
    summary: parsed.summary,
    dtstart: parsed.dtstart,
    dtend: parsed.dtend,
    dtstartTzid: parsed.dtstartTzid,
    isAllDay: parsed.isAllDay,
    rrule: parsed.rrule,
    hasRecurrence: !!parsed.rrule,
    description: parsed.description,
    location: parsed.location,
    icalData: parsed.icalData,
  };
}

// ============================================================================
// DATABASE → ICALENDAR
// ============================================================================

/**
 * Convert CalendarEvent to ParsedEvent for .ics export
 *
 * @param dbEvent - CalendarEvent from Prisma
 * @returns ParsedEvent for use with generateICS
 */
export function dbEventToParsedEvent(dbEvent: CalendarEvent): ParsedEvent {
  return {
    uid: dbEvent.uid,
    summary: dbEvent.summary,
    dtstart: dbEvent.dtstart,
    dtend: dbEvent.dtend,
    dtstartTzid: dbEvent.dtstartTzid,
    isAllDay: dbEvent.isAllDay,
    rrule: dbEvent.rrule,
    description: dbEvent.description,
    location: dbEvent.location,
    icalData: dbEvent.icalData,
  };
}

/**
 * Convert array of database events to ParsedEvents for export
 */
export function dbEventsToParsedEvents(
  dbEvents: CalendarEvent[],
): ParsedEvent[] {
  return dbEvents.map(dbEventToParsedEvent);
}

// ============================================================================
// APP → ICALENDAR (for display)
// ============================================================================

/**
 * Convert app Event to ParsedEvent
 * Used for generating iCal data from in-memory events
 *
 * @param event - App Event
 * @returns ParsedEvent
 */
export function appEventToParsedEvent(event: Event): ParsedEvent {
  const rrule =
    event.recurrence?.type === "RRULE" ? event.recurrence.rrule : null;

  const isAllDay = event.timeLabel === "all-day";

  // For all-day events, convert inclusive end to exclusive (iCal standard)
  let parsedDtend: Date | null = null;
  if (isAllDay && event.end) {
    const startDate = new Date(event.start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(event.end);
    endDate.setHours(0, 0, 0, 0);

    // Check if it's a multi-day event
    if (endDate.getTime() > startDate.getTime()) {
      // Multi-day: convert inclusive end to exclusive (add 1 day)
      const exclusiveEnd = new Date(endDate);
      exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      parsedDtend = exclusiveEnd;
    } else {
      // Single-day: set to start + 1 day
      const exclusiveEnd = new Date(startDate);
      exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      parsedDtend = exclusiveEnd;
    }
  } else if (!isAllDay) {
    parsedDtend = event.end;
  }

  const icalData = createVEvent({
    uid: event.id,
    summary: event.title,
    dtstart: event.start,
    dtend: parsedDtend || undefined,
    dtstartTzid: event.tzid,
    isAllDay,
    rrule: rrule || undefined,
    description: event.description,
    location: event.address,
  });

  return {
    uid: event.id,
    summary: event.title,
    dtstart: event.start,
    dtend: parsedDtend,
    dtstartTzid: event.tzid || null,
    isAllDay,
    rrule,
    description: event.description || null,
    location: event.address || null,
    icalData,
  };
}

// ============================================================================
// JSON SERIALIZATION HELPERS
// ============================================================================

/**
 * Prepare app Event for JSON serialization (API response)
 * Converts Date objects to ISO strings
 */
export function eventToJSON(event: Event): Record<string, unknown> {
  return {
    ...event,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    recurrence: event.recurrence,
    // Include icalData for recurrence expansion on client
    icalData: event.icalData,
  };
}

/**
 * Parse JSON back to app Event
 * Converts ISO strings to Date objects
 */
export function eventFromJSON(json: Record<string, unknown>): Event {
  return {
    ...json,
    start: new Date(json.start as string),
    end: new Date(json.end as string),
    // Preserve icalData for recurrence expansion
    icalData: json.icalData as string | undefined,
  } as Event;
}

/**
 * Parse array of events from JSON
 */
export function eventsFromJSON(jsonArray: Record<string, unknown>[]): Event[] {
  return jsonArray.map(eventFromJSON);
}
