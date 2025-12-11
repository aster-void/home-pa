/**
 * Calendar Remote Functions (Server-side)
 *
 * Server-side Remote Functions for calendar operations.
 * These run on the server and are callable from client with type safety.
 */
import { query, command, getRequestEvent } from "$app/server";
import * as v from "valibot";
import { prisma } from "$lib/server/prisma";
import {
  parseICS,
  parsedEventToDbCreate,
  dbEventsToAppEvents,
  dbEventToAppEvent,
  appEventToDbCreate,
  appEventToDbUpdate,
  eventToJSON,
} from "$lib/features/calendar/services/index.ts";

// ============================================================================
// HELPER - Get authenticated user
// ============================================================================

function getAuthenticatedUser(): string {
  const event = getRequestEvent();
  if (!event.locals.user?.id) {
    throw new Error("Unauthorized");
  }
  return event.locals.user.id;
}

// ============================================================================
// SCHEMAS
// ============================================================================

const DateWindowSchema = v.object({
  start: v.string(),
  end: v.string(),
});

const EventInputSchema = v.object({
  title: v.string(),
  start: v.string(),
  end: v.string(),
  description: v.optional(v.string()),
  address: v.optional(v.string()),
  importance: v.optional(v.picklist(["low", "medium", "high"])),
  timeLabel: v.picklist(["all-day", "some-timing", "timed"]),
  tzid: v.optional(v.string()),
  recurrence: v.optional(v.any()),
});

const EventUpdateSchema = v.object({
  id: v.string(),
  updates: v.object({
    title: v.optional(v.string()),
    start: v.optional(v.string()),
    end: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    importance: v.optional(v.picklist(["low", "medium", "high"])),
    timeLabel: v.optional(v.picklist(["all-day", "some-timing", "timed"])),
    tzid: v.optional(v.string()),
    recurrence: v.optional(v.any()),
  }),
});

// ============================================================================
// REMOTE FUNCTIONS
// ============================================================================

/**
 * Fetch events from database
 * Remote Function version of GET /api/calendar/events
 */
export const fetchEvents = query(DateWindowSchema, async (input) => {
  const userId = getAuthenticatedUser();
  const startDate = new Date(input.start);
  const endDate = new Date(input.end);

  // Build where clause (same logic as original +server.ts)
  const where: {
    userId: string;
    OR?: Array<{
      dtstart?: { gte?: Date; lte?: Date };
      hasRecurrence?: boolean;
    }>;
  } = { userId };

  where.OR = [
    // Non-recurring events: dtstart within window
    {
      hasRecurrence: false,
      dtstart: { gte: startDate, lte: endDate },
    },
    // Recurring events: dtstart before or at window end
    {
      hasRecurrence: true,
      dtstart: { lte: endDate },
    },
  ];

  try {
    const dbEvents = await prisma.calendarEvent.findMany({
      where,
      orderBy: { dtstart: "asc" },
    });

    const appEvents = dbEventsToAppEvents(dbEvents);
    return appEvents.map(eventToJSON);
  } catch (err) {
    console.error("[fetchEvents] Error:", err);
    throw new Error(
      `Failed to fetch events: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
});

/**
 * Create a new event
 * Remote Function version of POST /api/calendar/events
 */
export const createEvent = command(EventInputSchema, async (input) => {
  const userId = getAuthenticatedUser();

  // Convert dates from JSON
  const eventData = {
    title: input.title,
    start: new Date(input.start),
    end: new Date(input.end),
    description: input.description,
    address: input.address,
    importance: input.importance,
    timeLabel: input.timeLabel,
    tzid: input.tzid,
    recurrence: input.recurrence,
  };

  // Convert to database format
  const dbInput = appEventToDbCreate(eventData, userId);

  try {
    // Create in database
    const created = await prisma.calendarEvent.create({
      data: dbInput,
    });

    // Convert back to app format
    const appEvent = dbEventToAppEvent(created);
    return eventToJSON(appEvent);
  } catch (err) {
    console.error("[createEvent] Error:", err);
    throw new Error("Failed to create event");
  }
});

/**
 * Get single event by ID
 * Remote Function version of GET /api/calendar/events/[id]
 */
export const getEvent = query(v.object({ id: v.string() }), async (input) => {
  const userId = getAuthenticatedUser();

  try {
    const dbEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: input.id,
        userId,
      },
    });

    if (!dbEvent) {
      throw new Error("Event not found");
    }

    const appEvent = dbEventToAppEvent(dbEvent);
    return eventToJSON(appEvent);
  } catch (err) {
    console.error("[getEvent] Error:", err);
    throw new Error("Failed to fetch event");
  }
});

/**
 * Update an existing event
 * Remote Function version of PATCH /api/calendar/events/[id]
 */
export const updateEvent = command(EventUpdateSchema, async (input) => {
  const userId = getAuthenticatedUser();

  try {
    // Get existing event
    const existing = await prisma.calendarEvent.findFirst({
      where: {
        id: input.id,
        userId,
      },
    });

    if (!existing) {
      throw new Error("Event not found");
    }

    // Convert dates from JSON if present
    const updates: Record<string, unknown> = {};
    if (input.updates.title !== undefined) updates.title = input.updates.title;
    if (input.updates.start !== undefined)
      updates.start = new Date(input.updates.start);
    if (input.updates.end !== undefined)
      updates.end = new Date(input.updates.end);
    if (input.updates.description !== undefined)
      updates.description = input.updates.description;
    if (input.updates.address !== undefined)
      updates.address = input.updates.address;
    if (input.updates.importance !== undefined)
      updates.importance = input.updates.importance;
    if (input.updates.timeLabel !== undefined)
      updates.timeLabel = input.updates.timeLabel;
    if (input.updates.tzid !== undefined) updates.tzid = input.updates.tzid;
    if (input.updates.recurrence !== undefined)
      updates.recurrence = input.updates.recurrence;

    // Convert to database update format
    const dbUpdates = appEventToDbUpdate(updates, existing);

    // Update in database
    const updated = await prisma.calendarEvent.update({
      where: { id: input.id },
      data: dbUpdates,
    });

    const appEvent = dbEventToAppEvent(updated);
    return eventToJSON(appEvent);
  } catch (err) {
    console.error("[updateEvent] Error:", err);
    throw new Error("Failed to update event");
  }
});

/**
 * Delete an event
 * Remote Function version of DELETE /api/calendar/events/[id]
 */
export const deleteEvent = command(
  v.object({ id: v.string() }),
  async (input) => {
    const userId = getAuthenticatedUser();

    try {
      // Verify ownership
      const existing = await prisma.calendarEvent.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existing) {
        throw new Error("Event not found");
      }

      // Delete
      await prisma.calendarEvent.delete({
        where: { id: input.id },
      });

      return { success: true };
    } catch (err) {
      console.error("[deleteEvent] Error:", err);
      throw new Error("Failed to delete event");
    }
  },
);

/**
 * Import events from .ics file content
 * Remote Function version of POST /api/calendar/import
 */
export const importIcs = command(
  v.string(),
  async (
    icsContent,
  ): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> => {
    const userId = getAuthenticatedUser();

    // Validate input
    if (!icsContent || icsContent.trim().length === 0) {
      throw new Error("Empty ICS content");
    }

    // Parse ICS
    let parsedEvents;
    try {
      parsedEvents = parseICS(icsContent);
    } catch (parseError) {
      throw new Error(
        `Failed to parse ICS: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      );
    }

    if (parsedEvents.length === 0) {
      return {
        imported: 0,
        skipped: 0,
        errors: ["No events found in the ICS file"],
      };
    }

    // Import events
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const parsed of parsedEvents) {
      try {
        // Check for existing event by UID (deduplication)
        const existing = await prisma.calendarEvent.findUnique({
          where: { uid: parsed.uid },
        });

        if (existing) {
          // Check if it belongs to the same user
          if (existing.userId === userId) {
            results.skipped++;
            continue;
          }
          // Different user - create with new UID
          parsed.uid = `${parsed.uid}-${crypto.randomUUID().slice(0, 8)}`;
        }

        // Convert and create
        const dbInput = parsedEventToDbCreate(parsed, userId);

        await prisma.calendarEvent.create({
          data: dbInput,
        });

        results.imported++;
      } catch (eventError) {
        const errorMsg =
          eventError instanceof Error ? eventError.message : "Unknown error";
        results.errors.push(`${parsed.summary}: ${errorMsg}`);
      }
    }

    return results;
  },
);
