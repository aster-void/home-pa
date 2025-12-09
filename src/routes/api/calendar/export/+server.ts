/**
 * Calendar Export API
 *
 * GET /api/calendar/export - Export all events as .ics file
 */

import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import {
  dbEventsToParsedEvents,
  generateICS,
} from "$lib/services/calendar/index.js";

/**
 * GET /api/calendar/export
 *
 * Query params:
 * - start: ISO date string (optional) - filter events starting after this date
 * - end: ISO date string (optional) - filter events starting before this date
 * - name: string (optional) - calendar name in the ICS file
 *
 * Returns: .ics file download
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  // Auth check
  if (!locals.user?.id) {
    throw error(401, "Unauthorized");
  }

  const userId = locals.user.id;

  // Parse query params
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");
  const calendarName = url.searchParams.get("name") || "Home-PA Calendar";

  // Build where clause
  const where: {
    userId: string;
    dtstart?: {
      gte?: Date;
      lte?: Date;
    };
  } = { userId };

  if (startParam || endParam) {
    where.dtstart = {};
    if (startParam) {
      where.dtstart.gte = new Date(startParam);
    }
    if (endParam) {
      where.dtstart.lte = new Date(endParam);
    }
  }

  try {
    const dbEvents = await prisma.calendarEvent.findMany({
      where,
      orderBy: { dtstart: "asc" },
    });

    // Convert to parsed events format
    const parsedEvents = dbEventsToParsedEvents(dbEvents);

    // Generate ICS content
    const icsContent = generateICS(parsedEvents, calendarName);

    // Generate filename with date
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const filename = `home-pa-calendar-${dateStr}.ics`;

    return new Response(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[calendar/export GET] Error:", err);
    throw error(500, "Failed to export events");
  }
};
