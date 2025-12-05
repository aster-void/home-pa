/**
 * Calendar Events API
 * 
 * GET  /api/calendar/events        - List events (with optional date range)
 * POST /api/calendar/events        - Create new event
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import { 
  dbEventsToAppEvents, 
  appEventToDbCreate,
  eventToJSON,
} from '$lib/services/calendar/index.js';

/**
 * GET /api/calendar/events
 * 
 * Query params:
 * - start: ISO date string (optional) - filter events starting after this date
 * - end: ISO date string (optional) - filter events starting before this date
 * 
 * Returns array of Event objects
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  // Auth check
  if (!locals.user?.id) {
    throw error(401, 'Unauthorized');
  }
  
  const userId = locals.user.id;
  
  // Parse query params
  const startParam = url.searchParams.get('start');
  const endParam = url.searchParams.get('end');
  
  // Parse date params
  const startDate = startParam ? new Date(startParam) : null;
  const endDate = endParam ? new Date(endParam) : null;
  
  // Build where clause
  // For recurring events: include if they start before window end (they might extend into the window)
  // For non-recurring events: include if they overlap with the window
  const where: {
    userId: string;
    OR?: Array<{
      dtstart?: { gte?: Date; lte?: Date };
      hasRecurrence?: boolean;
      AND?: Array<{
        dtstart?: { lte?: Date };
        hasRecurrence?: boolean;
      }>;
    }>;
    dtstart?: {
      gte?: Date;
      lte?: Date;
    };
  } = { userId };
  
  if (startDate || endDate) {
    where.OR = [
      // Non-recurring events: dtstart within window
      {
        hasRecurrence: false,
        ...(startDate && endDate
          ? { dtstart: { gte: startDate, lte: endDate } }
          : startDate
          ? { dtstart: { gte: startDate } }
          : { dtstart: { lte: endDate! } }),
      },
      // Recurring events: dtstart before or at window end (they might extend into the window)
      ...(endDate
        ? [
            {
              hasRecurrence: true,
              dtstart: { lte: endDate },
            },
          ]
        : [
            {
              hasRecurrence: true,
            },
          ]),
    ];
  }
  
  try {
    const dbEvents = await prisma.calendarEvent.findMany({
      where,
      orderBy: { dtstart: 'asc' },
    });
    
    const appEvents = dbEventsToAppEvents(dbEvents);
    const jsonEvents = appEvents.map(eventToJSON);
    
    return json(jsonEvents);
  } catch (err) {
    console.error('[calendar/events GET] Error:', err);
    throw error(500, 'Failed to fetch events');
  }
};

/**
 * POST /api/calendar/events
 * 
 * Body: Event object (without id)
 * 
 * Returns created Event object
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  // Auth check
  if (!locals.user?.id) {
    throw error(401, 'Unauthorized');
  }
  
  const userId = locals.user.id;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title) {
      throw error(400, 'Title is required');
    }
    if (!body.start) {
      throw error(400, 'Start date is required');
    }
    
    // Convert dates from JSON
    const eventData = {
      title: body.title,
      start: new Date(body.start),
      end: body.end ? new Date(body.end) : new Date(body.start),
      description: body.description,
      address: body.address,
      timeLabel: body.timeLabel || 'timed',
      tzid: body.tzid,
      recurrence: body.recurrence,
    };
    
    // Convert to database format
    const dbInput = appEventToDbCreate(eventData, userId);
    
    // Create in database
    const created = await prisma.calendarEvent.create({
      data: dbInput,
    });
    
    // Convert back to app format
    const appEvent = {
      id: created.id,
      title: created.summary,
      start: created.dtstart,
      end: created.dtend || created.dtstart,
      description: created.description || undefined,
      address: created.location || undefined,
      timeLabel: created.isAllDay ? 'all-day' : 'timed',
      tzid: created.dtstartTzid || undefined,
      recurrence: created.hasRecurrence && created.rrule 
        ? { type: 'RRULE' as const, rrule: created.rrule }
        : { type: 'NONE' as const },
    };
    
    return json(eventToJSON(appEvent as any), { status: 201 });
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error('[calendar/events POST] Error:', err);
    throw error(500, 'Failed to create event');
  }
};

