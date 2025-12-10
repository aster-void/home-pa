/**
 * Calendar API client
 *
 * Pure API functions for calendar operations.
 * These functions handle HTTP requests and response parsing only.
 */
import type { Event } from "$lib/types.ts";
import type { ImportResult, DateWindow } from "./calendar.types.ts";

/**
 * Fetch events from API
 */
export async function fetchEventsApi(
  window: DateWindow,
): Promise<Event[]> {
  const params = new URLSearchParams({
    start: window.start.toISOString(),
    end: window.end.toISOString(),
  });

  const response = await fetch(`/api/calendar/events?${params}`);

  if (!response.ok) {
    // Handle 401 (Unauthorized) gracefully - user not logged in
    if (response.status === 401) {
      return [];
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const eventsJson = await response.json();

  // Convert dates from JSON and preserve icalData
  return eventsJson.map((e: Record<string, unknown>) => ({
    ...e,
    start: new Date(e.start as string),
    end: new Date(e.end as string),
    icalData: e.icalData as string | undefined,
  }));
}

/**
 * Create a new event via API
 */
export async function createEventApi(
  event: Omit<Event, "id">,
): Promise<Event> {
  const response = await fetch("/api/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...event,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const createdJson = await response.json();
  return {
    ...createdJson,
    start: new Date(createdJson.start),
    end: new Date(createdJson.end),
  };
}

/**
 * Update an existing event via API
 */
export async function updateEventApi(
  id: string,
  updates: Partial<Omit<Event, "id">>,
): Promise<Event> {
  const body: Record<string, unknown> = { ...updates };
  if (updates.start) body.start = updates.start.toISOString();
  if (updates.end) body.end = updates.end.toISOString();

  const response = await fetch(`/api/calendar/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const updatedJson = await response.json();
  return {
    ...updatedJson,
    start: new Date(updatedJson.start),
    end: new Date(updatedJson.end),
  };
}

/**
 * Delete an event via API
 */
export async function deleteEventApi(id: string): Promise<void> {
  const response = await fetch(`/api/calendar/events/${id}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
}

/**
 * Import events from .ics file content
 */
export async function importIcsApi(content: string): Promise<ImportResult> {
  const response = await fetch("/api/calendar/import", {
    method: "POST",
    headers: { "Content-Type": "text/calendar" },
    body: content,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

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
