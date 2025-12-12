/**
 * Calendar Remote Functions - Client API
 *
 * Client-side wrappers for calendar Remote Functions.
 * Provides API compatible with existing fetch-based code.
 */
import type { Event } from "$lib/types.ts";
import {
  eventFromJSON,
  eventsFromJSON,
} from "$lib/features/calendar/services/event-converter.ts";
import type {
  ImportResult,
  DateWindow,
  EventUpdateInput,
} from "./calendar.types.ts";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  importIcs,
} from "./calendar.functions.remote.ts";

/**
 * Fetch events (client-side wrapper for Remote Function)
 */
export async function fetchEventsApi(window: DateWindow): Promise<Event[]> {
  try {
    const eventsJson = await fetchEvents({
      start: window.start.toISOString(),
      end: window.end.toISOString(),
    });
    return eventsFromJSON(eventsJson);
  } catch (err) {
    // Handle unauthorized gracefully - user not logged in
    if (err instanceof Error && err.message === "Unauthorized") {
      return [];
    }
    throw err;
  }
}

/**
 * Create event (client-side wrapper for Remote Function)
 */
export async function createEventApi(event: Omit<Event, "id">): Promise<Event> {
  const createdJson = await createEvent({
    title: event.title,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    description: event.description,
    address: event.address,
    importance: event.importance,
    timeLabel: event.timeLabel,
    tzid: event.tzid,
    recurrence: event.recurrence,
  });
  return eventFromJSON(createdJson);
}

/**
 * Update event (client-side wrapper for Remote Function)
 */
export async function updateEventApi(
  id: string,
  updates: Partial<Omit<Event, "id">>,
): Promise<Event> {
  const body: EventUpdateInput = {};
  if (updates.title !== undefined) body.title = updates.title;
  if (updates.start !== undefined) body.start = updates.start.toISOString();
  if (updates.end !== undefined) body.end = updates.end.toISOString();
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.address !== undefined) body.address = updates.address;
  if (updates.importance !== undefined) body.importance = updates.importance;
  if (updates.timeLabel !== undefined) body.timeLabel = updates.timeLabel;
  if (updates.tzid !== undefined) body.tzid = updates.tzid;
  if (updates.recurrence !== undefined) body.recurrence = updates.recurrence;

  const updatedJson = await updateEvent({ id, updates: body });
  return eventFromJSON(updatedJson);
}

/**
 * Delete event (client-side wrapper for Remote Function)
 */
export async function deleteEventApi(id: string): Promise<void> {
  await deleteEvent({ id });
}

/**
 * Import events from .ics file (client-side wrapper for Remote Function)
 */
export async function importIcsApi(content: string): Promise<ImportResult> {
  return importIcs(content);
}

// Re-export Remote Functions for direct use
export { fetchEvents, createEvent, updateEvent, deleteEvent, importIcs };

/**
 * Get export URL for downloading .ics file
 */
export function getExportUrl(start?: Date, end?: Date, name?: string): string {
  const params = new URLSearchParams();
  if (start) params.set("start", start.toISOString());
  if (end) params.set("end", end.toISOString());
  if (name) params.set("name", name);

  const queryString = params.toString();
  return queryString
    ? `/api/calendar/export?${queryString}`
    : "/api/calendar/export";
}
