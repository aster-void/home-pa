/**
 * Calendar Services
 *
 * iCalendar-based event management using ical.js
 */

// iCalendar parsing and generation
export {
  parseVEvent,
  parseICS,
  parseVEventString,
  createVEvent,
  generateICS,
  expandRecurrences,
  hasRecurrence,
  extractRRule,
  isValidRRule,
  formatRRule,
  type ParsedEvent,
  type VEventInput,
  type ExpandedOccurrence,
} from "./ical-service.js";

// Type conversions
export {
  dbEventToAppEvent,
  dbEventsToAppEvents,
  appEventToDbCreate,
  appEventToDbUpdate,
  parsedEventToDbCreate,
  dbEventToParsedEvent,
  dbEventsToParsedEvents,
  appEventToParsedEvent,
  eventToJSON,
  eventFromJSON,
  eventsFromJSON,
} from "./event-converter.js";
