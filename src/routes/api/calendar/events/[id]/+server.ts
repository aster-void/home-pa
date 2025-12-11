/**
 * Single Calendar Event API
 *
 * GET    /api/calendar/events/[id]  - Get single event
 * PATCH  /api/calendar/events/[id]  - Update event
 * DELETE /api/calendar/events/[id]  - Delete event
 */

import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import {
  dbEventToAppEvent,
  appEventToDbUpdate,
  eventToJSON,
} from "$lib/features/calendar/services/index.ts";

/**
 * GET /api/calendar/events/[id]
 *
 * Returns single Event object
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  // Auth check
  if (!locals.user?.id) {
    throw error(401, "Unauthorized");
  }

  const userId = locals.user.id;
  const eventId = params.id;

  try {
    const dbEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId,
      },
    });

    if (!dbEvent) {
      throw error(404, "Event not found");
    }

    const appEvent = dbEventToAppEvent(dbEvent);
    return json(eventToJSON(appEvent));
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("[calendar/events/[id] GET] Error:", err);
    throw error(500, "Failed to fetch event");
  }
};

/**
 * PATCH /api/calendar/events/[id]
 *
 * Body: Partial Event object
 *
 * Returns updated Event object
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  // Auth check
  if (!locals.user?.id) {
    throw error(401, "Unauthorized");
  }

  const userId = locals.user.id;
  const eventId = params.id;

  try {
    // Get existing event
    const existing = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId,
      },
    });

    if (!existing) {
      throw error(404, "Event not found");
    }

    const body = await request.json();

    // Convert dates from JSON if present
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.start !== undefined) updates.start = new Date(body.start);
    if (body.end !== undefined) updates.end = new Date(body.end);
    if (body.description !== undefined) updates.description = body.description;
    if (body.address !== undefined) updates.address = body.address;
    if (body.timeLabel !== undefined) updates.timeLabel = body.timeLabel;
    if (body.tzid !== undefined) updates.tzid = body.tzid;
    if (body.recurrence !== undefined) updates.recurrence = body.recurrence;

    // Convert to database update format
    const dbUpdates = appEventToDbUpdate(updates, existing);

    // Update in database
    const updated = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: dbUpdates,
    });

    const appEvent = dbEventToAppEvent(updated);
    return json(eventToJSON(appEvent));
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("[calendar/events/[id] PATCH] Error:", err);
    throw error(500, "Failed to update event");
  }
};

/**
 * DELETE /api/calendar/events/[id]
 *
 * Returns 204 No Content on success
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Auth check
  if (!locals.user?.id) {
    throw error(401, "Unauthorized");
  }

  const userId = locals.user.id;
  const eventId = params.id;

  try {
    // Verify ownership
    const existing = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId,
      },
    });

    if (!existing) {
      throw error(404, "Event not found");
    }

    // Delete
    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("[calendar/events/[id] DELETE] Error:", err);
    throw error(500, "Failed to delete event");
  }
};
