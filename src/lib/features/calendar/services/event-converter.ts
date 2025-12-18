/**
 * Event Converter
 *
 * Converts between different event representations:
 * - Prisma CalendarEvent (database)
 * - App Event interface (UI/stores)
 * - iCalendar ParsedEvent (import/export)
 */

import type { CalendarEvent } from "@prisma/client";
import type { Event, EventJSON, Recurrence } from "$lib/types.ts";
import { createVEvent, type ParsedEvent } from "./ical-service.ts";

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
    // Convert to inclusive: subtract 1 day
    // IMPORTANT: Use UTC operations to avoid timezone issues
    const exclusiveEndUTC = Date.UTC(
      dbEvent.dtend.getUTCFullYear(),
      dbEvent.dtend.getUTCMonth(),
      dbEvent.dtend.getUTCDate(),
    );
    const startUTC = Date.UTC(
      dbEvent.dtstart.getUTCFullYear(),
      dbEvent.dtstart.getUTCMonth(),
      dbEvent.dtstart.getUTCDate(),
    );

    // Check if it's multi-day (exclusive end > start)
    if (exclusiveEndUTC > startUTC) {
      // Multi-day event: convert exclusive to inclusive (subtract 1 day in UTC)
      const inclusiveEnd = new Date(dbEvent.dtend);
      inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() - 1);
      // Keep it as UTC midnight for consistent all-day handling
      appEndDate = new Date(
        Date.UTC(
          inclusiveEnd.getUTCFullYear(),
          inclusiveEnd.getUTCMonth(),
          inclusiveEnd.getUTCDate(),
        ),
      );
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
  // IMPORTANT: Use UTC operations to avoid timezone issues
  let dbDtend: Date | null = null;
  if (isAllDay && event.end) {
    const startUTC = Date.UTC(
      event.start.getUTCFullYear(),
      event.start.getUTCMonth(),
      event.start.getUTCDate(),
    );
    const endUTC = Date.UTC(
      event.end.getUTCFullYear(),
      event.end.getUTCMonth(),
      event.end.getUTCDate(),
    );

    // Check if it's a multi-day event (different days in UTC)
    if (endUTC > startUTC) {
      // Multi-day event: convert inclusive end to exclusive (add 1 day in UTC)
      const exclusiveEnd = new Date(event.end);
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      dbDtend = new Date(
        Date.UTC(
          exclusiveEnd.getUTCFullYear(),
          exclusiveEnd.getUTCMonth(),
          exclusiveEnd.getUTCDate(),
        ),
      );
    }
    // Single-day all-day events: dtend can be null (or same as dtstart + 1 day)
    // For consistency, we'll set it to start + 1 day
    else {
      const exclusiveEnd = new Date(event.start);
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      dbDtend = new Date(
        Date.UTC(
          exclusiveEnd.getUTCFullYear(),
          exclusiveEnd.getUTCMonth(),
          exclusiveEnd.getUTCDate(),
        ),
      );
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
    // IMPORTANT: Use UTC operations to avoid timezone issues
    const isAllDay =
      updates.timeLabel !== undefined
        ? updates.timeLabel === "all-day"
        : existingEvent.isAllDay;

    if (isAllDay && updates.end) {
      const startSource = updates.start ?? existingEvent.dtstart;
      const startUTC = Date.UTC(
        startSource.getUTCFullYear(),
        startSource.getUTCMonth(),
        startSource.getUTCDate(),
      );
      const endUTC = Date.UTC(
        updates.end.getUTCFullYear(),
        updates.end.getUTCMonth(),
        updates.end.getUTCDate(),
      );

      // Check if it's a multi-day event
      if (endUTC > startUTC) {
        // Multi-day: convert inclusive end to exclusive (add 1 day in UTC)
        const exclusiveEnd = new Date(updates.end);
        exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
        result.dtend = new Date(
          Date.UTC(
            exclusiveEnd.getUTCFullYear(),
            exclusiveEnd.getUTCMonth(),
            exclusiveEnd.getUTCDate(),
          ),
        );
      } else {
        // Single-day: set to start + 1 day in UTC
        const exclusiveEnd = new Date(startSource);
        exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
        result.dtend = new Date(
          Date.UTC(
            exclusiveEnd.getUTCFullYear(),
            exclusiveEnd.getUTCMonth(),
            exclusiveEnd.getUTCDate(),
          ),
        );
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
    // IMPORTANT: Use UTC operations to avoid timezone issues
    if (updates.end !== undefined) {
      // Already handled above
    } else if (updates.timeLabel === "all-day" && existingEvent.dtend) {
      // Converting timed event to all-day: convert dtend to exclusive format
      const startSource = updates.start ?? existingEvent.dtstart;
      const startUTC = Date.UTC(
        startSource.getUTCFullYear(),
        startSource.getUTCMonth(),
        startSource.getUTCDate(),
      );
      const endUTC = Date.UTC(
        existingEvent.dtend.getUTCFullYear(),
        existingEvent.dtend.getUTCMonth(),
        existingEvent.dtend.getUTCDate(),
      );

      if (endUTC > startUTC) {
        const exclusiveEnd = new Date(existingEvent.dtend);
        exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
        result.dtend = new Date(
          Date.UTC(
            exclusiveEnd.getUTCFullYear(),
            exclusiveEnd.getUTCMonth(),
            exclusiveEnd.getUTCDate(),
          ),
        );
      } else {
        const exclusiveEnd = new Date(startSource);
        exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
        result.dtend = new Date(
          Date.UTC(
            exclusiveEnd.getUTCFullYear(),
            exclusiveEnd.getUTCMonth(),
            exclusiveEnd.getUTCDate(),
          ),
        );
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
  // IMPORTANT: Use UTC operations to avoid timezone issues
  let parsedDtend: Date | null = null;
  if (isAllDay && event.end) {
    const startUTC = Date.UTC(
      event.start.getUTCFullYear(),
      event.start.getUTCMonth(),
      event.start.getUTCDate(),
    );
    const endUTC = Date.UTC(
      event.end.getUTCFullYear(),
      event.end.getUTCMonth(),
      event.end.getUTCDate(),
    );

    // Check if it's a multi-day event
    if (endUTC > startUTC) {
      // Multi-day: convert inclusive end to exclusive (add 1 day in UTC)
      const exclusiveEnd = new Date(event.end);
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      parsedDtend = new Date(
        Date.UTC(
          exclusiveEnd.getUTCFullYear(),
          exclusiveEnd.getUTCMonth(),
          exclusiveEnd.getUTCDate(),
        ),
      );
    } else {
      // Single-day: set to start + 1 day in UTC
      const exclusiveEnd = new Date(event.start);
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      parsedDtend = new Date(
        Date.UTC(
          exclusiveEnd.getUTCFullYear(),
          exclusiveEnd.getUTCMonth(),
          exclusiveEnd.getUTCDate(),
        ),
      );
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
export function eventToJSON(event: Event): EventJSON {
  return {
    ...event,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    rdateUtc: event.rdateUtc?.map((d) => d.toISOString()),
    exdateUtc: event.exdateUtc?.map((d) => d.toISOString()),
  };
}

/**
 * Parse JSON back to app Event
 * Converts ISO strings to Date objects
 */
export function eventFromJSON(json: EventJSON): Event {
  return {
    ...json,
    start: new Date(json.start),
    end: new Date(json.end),
    rdateUtc: json.rdateUtc?.map((d) => new Date(d)),
    exdateUtc: json.exdateUtc?.map((d) => new Date(d)),
  };
}

/**
 * Parse array of events from JSON
 */
export function eventsFromJSON(jsonArray: EventJSON[]): Event[] {
  return jsonArray.map(eventFromJSON);
}
