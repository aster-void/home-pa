/**
 * Calendar Import API
 *
 * POST /api/calendar/import - Import events from .ics file
 */

import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import {
  parseICS,
  parsedEventToDbCreate,
} from "$lib/services/calendar/index.js";

/**
 * POST /api/calendar/import
 *
 * Content-Type: text/calendar (raw .ics content)
 * OR
 * Content-Type: application/json with { icsContent: string }
 *
 * Returns: {
 *   imported: number,
 *   skipped: number,
 *   errors: string[]
 * }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  // Auth check
  if (!locals.user?.id) {
    throw error(401, "Unauthorized");
  }

  const userId = locals.user.id;

  try {
    // Get ICS content from request
    let icsContent: string;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("text/calendar")) {
      // Direct .ics content
      icsContent = await request.text();
    } else if (contentType.includes("application/json")) {
      // JSON with icsContent field
      const body = await request.json();
      if (!body.icsContent) {
        throw error(400, "Missing icsContent field");
      }
      icsContent = body.icsContent;
    } else {
      throw error(
        400,
        "Invalid content type. Expected text/calendar or application/json",
      );
    }

    if (!icsContent || icsContent.trim().length === 0) {
      throw error(400, "Empty ICS content");
    }

    // Parse ICS
    let parsedEvents;
    try {
      parsedEvents = parseICS(icsContent);
    } catch (parseError) {
      throw error(
        400,
        `Failed to parse ICS: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      );
    }

    if (parsedEvents.length === 0) {
      return json({
        imported: 0,
        skipped: 0,
        errors: ["No events found in the ICS file"],
      });
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

    return json(results);
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("[calendar/import POST] Error:", err);
    throw error(500, "Failed to import events");
  }
};
