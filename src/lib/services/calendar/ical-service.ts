/**
 * iCalendar Service
 *
 * Provides RFC-5545 compliant iCalendar parsing and generation using ical.js
 *
 * Features:
 * - Parse .ics files into structured event data
 * - Generate VEVENT components from event data
 * - Export full .ics files
 * - Expand recurring event occurrences
 */

import ICAL from "ical.ts";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Parsed event structure from iCalendar data
 * Used as intermediate format between ical.js and our app
 */
export interface ParsedEvent {
  uid: string;
  summary: string;
  dtstart: Date;
  dtend: Date | null;
  dtstartTzid: string | null;
  isAllDay: boolean;
  rrule: string | null;
  description: string | null;
  location: string | null;
  icalData: string;
}

/**
 * Input for creating a new VEVENT
 */
export interface VEventInput {
  uid?: string;
  summary: string;
  dtstart: Date;
  dtend?: Date | null;
  dtstartTzid?: string;
  isAllDay?: boolean;
  rrule?: string;
  description?: string;
  location?: string;
}

/**
 * Occurrence from recurrence expansion
 */
export interface ExpandedOccurrence {
  startDate: Date;
  endDate: Date;
  recurrenceId?: string;
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse a single VEVENT component into our ParsedEvent structure
 *
 * @param vevent - ICAL.Component representing a VEVENT
 * @returns Parsed event data
 */
export function parseVEvent(vevent: ICAL.Component): ParsedEvent {
  const event = new ICAL.Event(vevent);

  const dtstart = event.startDate;
  const dtend = event.endDate;

  // Get RRULE if present
  const rruleProp = vevent.getFirstProperty("rrule");
  const rrule = rruleProp
    ? (rruleProp.getFirstValue()?.toString() ?? null)
    : null;

  // Get timezone from DTSTART property
  const dtstartProp = vevent.getFirstProperty("dtstart");
  const dtstartTzid =
    dtstartProp?.getParameter("tzid") ||
    (dtstart as { timezone?: string }).timezone ||
    null;

  return {
    uid: event.uid || crypto.randomUUID(),
    summary: event.summary || "Untitled Event",
    dtstart: dtstart.toJSDate(),
    dtend: dtend ? dtend.toJSDate() : null,
    dtstartTzid: (dtstartTzid === "floating" ? null : dtstartTzid) as
      | string
      | null,
    isAllDay: dtstart.isDate, // DATE vs DATE-TIME
    rrule,
    description: event.description || null,
    location: event.location || null,
    icalData: vevent.toString(),
  };
}

/**
 * Parse an .ics file content into an array of events
 *
 * @param icsContent - Raw .ics file content
 * @returns Array of parsed events
 * @throws Error if parsing fails
 */
export function parseICS(icsContent: string): ParsedEvent[] {
  try {
    const jcalData = ICAL.parse(icsContent);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents("vevent");

    return vevents.map(parseVEvent);
  } catch (error) {
    console.error("[ical-service] Failed to parse ICS:", error);
    throw new Error(
      `Failed to parse iCalendar data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Parse a single VEVENT string
 *
 * @param veventString - Raw VEVENT component string
 * @returns Parsed event data
 */
export function parseVEventString(veventString: string): ParsedEvent {
  // Wrap in VCALENDAR if needed
  const icsContent = veventString.includes("BEGIN:VCALENDAR")
    ? veventString
    : `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${veventString}\r\nEND:VCALENDAR`;

  const events = parseICS(icsContent);
  if (events.length === 0) {
    throw new Error("No VEVENT found in the provided string");
  }

  return events[0];
}

// ============================================================================
// GENERATION FUNCTIONS
// ============================================================================

/**
 * Create a VEVENT component from event data
 *
 * @param input - Event data to convert
 * @returns Raw VEVENT component string
 */
export function createVEvent(input: VEventInput): string {
  const vevent = new ICAL.Component("vevent");

  // UID (generate if not provided)
  const uid = input.uid || crypto.randomUUID();
  vevent.addPropertyWithValue("uid", uid);

  // DTSTAMP (required by RFC-5545)
  const dtstamp = ICAL.Time.now();
  vevent.addPropertyWithValue("dtstamp", dtstamp);

  // DTSTART
  const dtstart = input.isAllDay
    ? ICAL.Time.fromDateString(input.dtstart.toISOString().split("T")[0])
    : ICAL.Time.fromJSDate(input.dtstart, false);

  if (input.dtstartTzid && !input.isAllDay) {
    // Set timezone for timed events
    dtstart.zone = new ICAL.Timezone({ tzid: input.dtstartTzid });
  }

  const dtstartProp = new ICAL.Property("dtstart");
  dtstartProp.setValue(dtstart);
  if (input.dtstartTzid && !input.isAllDay) {
    dtstartProp.setParameter("tzid", input.dtstartTzid);
  }
  vevent.addProperty(dtstartProp);

  // DTEND (if provided)
  if (input.dtend) {
    const dtend = input.isAllDay
      ? ICAL.Time.fromDateString(input.dtend.toISOString().split("T")[0])
      : ICAL.Time.fromJSDate(input.dtend, false);

    if (input.dtstartTzid && !input.isAllDay) {
      dtend.zone = new ICAL.Timezone({ tzid: input.dtstartTzid });
    }

    const dtendProp = new ICAL.Property("dtend");
    dtendProp.setValue(dtend);
    if (input.dtstartTzid && !input.isAllDay) {
      dtendProp.setParameter("tzid", input.dtstartTzid);
    }
    vevent.addProperty(dtendProp);
  }

  // SUMMARY
  vevent.addPropertyWithValue("summary", input.summary);

  // RRULE (if recurring)
  if (input.rrule) {
    try {
      // Parse and add RRULE
      const rruleValue = ICAL.Recur.fromString(input.rrule);
      vevent.addPropertyWithValue("rrule", rruleValue);
    } catch (error) {
      console.warn(
        "[ical-service] Invalid RRULE, skipping:",
        input.rrule,
        error,
      );
    }
  }

  // Optional fields
  if (input.description) {
    vevent.addPropertyWithValue("description", input.description);
  }
  if (input.location) {
    vevent.addPropertyWithValue("location", input.location);
  }

  return vevent.toString();
}

/**
 * Generate a full .ics file from events
 *
 * @param events - Array of parsed events (with icalData)
 * @param calendarName - Name for X-WR-CALNAME property
 * @returns Complete .ics file content
 */
export function generateICS(
  events: ParsedEvent[],
  calendarName = "Home-PA",
): string {
  const vcalendar = new ICAL.Component("vcalendar");

  // Required properties
  vcalendar.addPropertyWithValue("version", "2.0");
  vcalendar.addPropertyWithValue("prodid", "-//Home-PA//Calendar//EN");
  vcalendar.addPropertyWithValue("calscale", "GREGORIAN");
  vcalendar.addPropertyWithValue("method", "PUBLISH");
  vcalendar.addPropertyWithValue("x-wr-calname", calendarName);

  // Add each event
  for (const event of events) {
    try {
      // Parse the stored icalData back into a component
      const jcalData = ICAL.parse(
        `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${event.icalData}\r\nEND:VCALENDAR`,
      );
      const tempCal = new ICAL.Component(jcalData);
      const vevent = tempCal.getFirstSubcomponent("vevent");

      if (vevent) {
        vcalendar.addSubcomponent(vevent);
      }
    } catch (error) {
      console.warn(
        "[ical-service] Failed to add event to ICS:",
        event.uid,
        error,
      );
    }
  }

  return vcalendar.toString();
}

// ============================================================================
// RECURRENCE EXPANSION
// ============================================================================

/**
 * Expand recurring event occurrences within a time window
 *
 * @param icalData - Raw VEVENT component string
 * @param windowStart - Start of expansion window
 * @param windowEnd - End of expansion window
 * @param maxOccurrences - Safety limit (default 1000)
 * @returns Array of occurrence dates
 */
export function expandRecurrences(
  icalData: string,
  windowStart: Date,
  windowEnd: Date,
  maxOccurrences = 1000,
): ExpandedOccurrence[] {
  try {
    // Parse the VEVENT
    const icsContent = icalData.includes("BEGIN:VCALENDAR")
      ? icalData
      : `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${icalData}\r\nEND:VCALENDAR`;

    const jcalData = ICAL.parse(icsContent);
    const vcalendar = new ICAL.Component(jcalData);
    const vevent = vcalendar.getFirstSubcomponent("vevent");

    if (!vevent) {
      console.warn("[ical-service] No VEVENT found for recurrence expansion");
      return [];
    }

    const event = new ICAL.Event(vevent);

    // If not recurring, return single occurrence
    if (!event.isRecurring()) {
      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate?.toJSDate() || startDate;

      // Check if within window
      if (startDate <= windowEnd && endDate >= windowStart) {
        return [
          {
            startDate,
            endDate,
          },
        ];
      }
      return [];
    }

    // Calculate event duration for occurrence end times
    const durationMs = event.endDate
      ? event.endDate.toJSDate().getTime() -
        event.startDate.toJSDate().getTime()
      : 0;

    const occurrences: ExpandedOccurrence[] = [];
    const iterator = event.iterator();

    let next = iterator.next();
    let count = 0;

    while (next && count < maxOccurrences) {
      const occStart = next.toJSDate();

      // Past the window, stop
      if (occStart > windowEnd) {
        break;
      }

      // Within window, add to results
      if (occStart >= windowStart) {
        occurrences.push({
          startDate: occStart,
          endDate: new Date(occStart.getTime() + durationMs),
          recurrenceId: next.toICALString(),
        });
      }

      next = iterator.next();
      count++;
    }

    if (count >= maxOccurrences) {
      console.warn(
        "[ical-service] Max occurrences reached for event expansion",
      );
    }

    return occurrences;
  } catch (error) {
    console.error("[ical-service] Failed to expand recurrences:", error);
    return [];
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a VEVENT has recurrence rules
 *
 * @param icalData - Raw VEVENT component string
 * @returns true if the event is recurring
 */
export function hasRecurrence(icalData: string): boolean {
  try {
    const parsed = parseVEventString(icalData);
    return !!parsed.rrule;
  } catch {
    return false;
  }
}

/**
 * Extract the RRULE string from a VEVENT
 *
 * @param icalData - Raw VEVENT component string
 * @returns RRULE string or null
 */
export function extractRRule(icalData: string): string | null {
  try {
    const parsed = parseVEventString(icalData);
    return parsed.rrule;
  } catch {
    return null;
  }
}

/**
 * Validate an RRULE string
 *
 * @param rrule - RRULE string to validate
 * @returns true if valid
 */
export function isValidRRule(rrule: string): boolean {
  try {
    ICAL.Recur.fromString(rrule);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format an RRULE into human-readable text
 *
 * @param rrule - RRULE string
 * @returns Human-readable description
 */
export function formatRRule(rrule: string): string {
  try {
    const recur = ICAL.Recur.fromString(rrule);

    const freq = recur.freq?.toLowerCase() || "unknown";
    const interval = recur.interval || 1;

    let text = "";

    switch (freq) {
      case "daily":
        text = interval === 1 ? "Every day" : `Every ${interval} days`;
        break;
      case "weekly":
        text = interval === 1 ? "Every week" : `Every ${interval} weeks`;
        if (recur.parts?.BYDAY) {
          const days = recur.parts.BYDAY.map(dayMap).join(", ");
          text += ` on ${days}`;
        }
        break;
      case "monthly":
        text = interval === 1 ? "Every month" : `Every ${interval} months`;
        break;
      case "yearly":
        text = interval === 1 ? "Every year" : `Every ${interval} years`;
        break;
      default:
        text = `Repeats ${freq}`;
    }

    if (recur.count) {
      text += `, ${recur.count} times`;
    }
    if (recur.until) {
      text += `, until ${recur.until.toJSDate().toLocaleDateString()}`;
    }

    return text;
  } catch {
    return "Recurring event";
  }
}

/**
 * Map BYDAY abbreviations to full day names
 */
function dayMap(day: string | number): string {
  const days: Record<string, string> = {
    SU: "Sunday",
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
  };
  return days[String(day).toUpperCase()] || String(day);
}
