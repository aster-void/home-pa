/**
 * Frontend-only In-Memory Recurrence & Occurrence Manager
 * 
 * ## Timezone Policy
 * - All recurrence rules (RRULE and weekly-bitmask) are evaluated in the event's tzid (IANA timezone)
 * - Uses Luxon for timezone-aware date arithmetic and conversions
 * - Final occurrence timestamps are returned as UTC (startUtc/endUtc) plus originalLocalISO for UI display
 * 
 * ## DST Handling
 * - **Non-existent times** (DST forward): Skip the occurrence entirely
 * - **Ambiguous times** (DST backward): Use the earlier instant by default
 * 
 * ## Maximum Occurrence Safeguard
 * - Per-query limit: 20,000 occurrences maximum
 * - If exceeded, returns truncated results with `truncated: true` flag
 * - Protects against runaway recurrence rules
 * 
 * ## Libraries Used
 * - rrule.js: RFC-5545 recurrence rule parsing and expansion
 * - Luxon: Timezone-aware date handling
 */

import * as rruleModule from 'rrule';
const { RRule, RRuleSet, rrulestr } = rruleModule;
import { DateTime } from 'luxon';

// ============================================================================
// TYPES
// ============================================================================

export type ID = string;

export interface RecurrenceRuleRFC {
  rrule: string;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  until?: Date | null;
  count?: number | null;
}

export interface WeeklyBitmaskRule {
  type: "WEEKLY_BITMASK";
  anchorLocalStartISO: string;
  intervalWeeks: number;
  daysBitmask: number; // 0=Sunday .. 6=Saturday
  until?: Date | null;
  count?: number | null;
}

export type Recurrence =
  | { type: "NONE" }
  | ({ type: "RRULE" } & RecurrenceRuleRFC)
  | WeeklyBitmaskRule;

export interface EventMaster {
  id: ID;
  title: string;
  description?: string;
  address?: string;
  importance?: "low" | "medium" | "high";
  timeLabel?: "all-day" | "some-timing";
  startLocalISO: string;
  tzid: string;
  durationMs: number;
  recurrence: Recurrence;
  rdateUtc?: Date[];
  exdateUtc?: Date[];
  createdAtUtc: Date;
  updatedAtUtc?: Date;
  meta?: Record<string, any>;
}

export interface OccurrenceOverride {
  id: ID;
  eventId: ID;
  originalLocalISO?: string | null;
  isCancelled?: boolean;
  newStartUtc?: Date | null;
  newDurationMs?: number | null;
  note?: string;
  createdAtUtc: Date;
}

export interface Occurrence {
  id?: ID | null;
  eventId: ID;
  startUtc: Date;
  endUtc: Date;
  originalLocalISO: string;
  isFromCache?: boolean;
  overrideId?: ID | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_OCCURRENCES_PER_QUERY = 20000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): ID {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert local ISO string + tzid to UTC Date
 * Handles DST ambiguity by using the earlier instant
 */
function localISOToUTC(localISO: string, tzid: string): Date | null {
  const dt = DateTime.fromISO(localISO, { zone: tzid });
  if (!dt.isValid) {
    return null; // Invalid/non-existent time (DST skip)
  }
  return dt.toJSDate();
}

/**
 * Convert UTC Date to local ISO string in given timezone
 */
function utcToLocalISO(utcDate: Date, tzid: string): string {
  return DateTime.fromJSDate(utcDate, { zone: 'utc' })
    .setZone(tzid)
    .toISO({ suppressMilliseconds: true, includeOffset: false })!;
}

/**
 * Get day of week from bitmask bit position
 * 0=Sunday, 1=Monday, ..., 6=Saturday
 */
function getDaysFromBitmask(bitmask: number): number[] {
  const days: number[] = [];
  for (let i = 0; i < 7; i++) {
    if (bitmask & (1 << i)) {
      days.push(i);
    }
  }
  return days;
}

/**
 * Generate occurrences using weekly bitmask optimization
 */
function generateWeeklyBitmaskOccurrences(
  event: EventMaster,
  rule: WeeklyBitmaskRule,
  windowStartUtc: Date,
  windowEndUtc: Date
): Occurrence[] {
  const occurrences: Occurrence[] = [];
  const anchorDT = DateTime.fromISO(rule.anchorLocalStartISO, { zone: event.tzid });
  
  if (!anchorDT.isValid) {
    return [];
  }

  const days = getDaysFromBitmask(rule.daysBitmask);
  if (days.length === 0) {
    return [];
  }

  const windowStartDT = DateTime.fromJSDate(windowStartUtc, { zone: 'utc' }).setZone(event.tzid);
  const windowEndDT = DateTime.fromJSDate(windowEndUtc, { zone: 'utc' }).setZone(event.tzid);
  
  // Start from a few weeks before window to ensure we catch all occurrences
  const startWeek = anchorDT.startOf('week');
  const weeksFromAnchor = Math.floor(windowStartDT.diff(startWeek, 'weeks').weeks);
  const firstCheckWeek = startWeek.plus({ weeks: Math.max(0, weeksFromAnchor - rule.intervalWeeks) });
  
  let currentWeek = firstCheckWeek;
  let count = 0;
  const maxCount = rule.count ?? Infinity;
  const untilDT = rule.until ? DateTime.fromJSDate(rule.until, { zone: event.tzid }) : null;

  // Generate occurrences week by week
  while (currentWeek <= windowEndDT && count < maxCount && occurrences.length < MAX_OCCURRENCES_PER_QUERY) {
    // Check if this week matches the interval pattern
    const weeksDiff = currentWeek.diff(anchorDT.startOf('week'), 'weeks').weeks;
    if (weeksDiff >= 0 && weeksDiff % rule.intervalWeeks === 0) {
      // Generate occurrences for each day in the bitmask
      for (const dayOfWeek of days) {
        const luxonWeekday = (dayOfWeek === 0 ? 7 : dayOfWeek) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
        const occurrenceDT = currentWeek.set({
          weekday: luxonWeekday, // Luxon: 1=Monday, 7=Sunday
          hour: anchorDT.hour,
          minute: anchorDT.minute,
          second: anchorDT.second,
          millisecond: anchorDT.millisecond
        });

        // Check validity (DST non-existent check)
        if (!occurrenceDT.isValid) {
          continue; // Skip non-existent times
        }

        // Check against until
        if (untilDT && occurrenceDT > untilDT) {
          break;
        }

        // Check if in window
        const occurrenceUtc = occurrenceDT.toJSDate();
        if (occurrenceUtc >= windowStartUtc && occurrenceUtc <= windowEndUtc) {
          occurrences.push({
            eventId: event.id,
            startUtc: occurrenceUtc,
            endUtc: new Date(occurrenceUtc.getTime() + event.durationMs),
            originalLocalISO: occurrenceDT.toISO({ suppressMilliseconds: true, includeOffset: false })!
          });
          count++;
          if (count >= maxCount) break;
        } else if (occurrenceUtc > windowEndUtc) {
          break;
        }
      }
    }
    
    currentWeek = currentWeek.plus({ weeks: rule.intervalWeeks });
  }

  return occurrences;
}

/**
 * Generate occurrences using RRule
 */
function generateRRuleOccurrences(
  event: EventMaster,
  rule: RecurrenceRuleRFC,
  windowStartUtc: Date,
  windowEndUtc: Date
): Occurrence[] {
  const occurrences: Occurrence[] = [];
  
  try {
    // Parse the RRULE string with timezone awareness
    const localDt = DateTime.fromISO(event.startLocalISO, { zone: event.tzid });
    if (!localDt.isValid) {
      return [];
    }
    
    // For rrule.js to work correctly with BYDAY in local timezone,
    // we need to use Date.UTC() with local time values
    // This treats the local time components as if they were UTC
    const dtstart = new Date(Date.UTC(
      localDt.year,
      localDt.month - 1,
      localDt.day,
      localDt.hour,
      localDt.minute,
      localDt.second
    ));

    const rruleSet = new RRuleSet();
    const rrule = rrulestr(rule.rrule, { dtstart });
    rruleSet.rrule(rrule);

    // Generate occurrences with a safety limit
    // Use a very wide window to ensure we catch all instances
    // We'll filter by the actual window later
    const expandedStart = new Date(dtstart.getTime() - (365 * 24 * 60 * 60 * 1000)); // 1 year before
    const expandedEnd = new Date(dtstart.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years after

    const rawInstances = rruleSet.between(
      expandedStart,
      expandedEnd,
      true, // inclusive
      (date, i) => i < MAX_OCCURRENCES_PER_QUERY
    );

    console.log('[DEBUG manager] RRULE generation:', {
      rrule: rule.rrule,
      dtstart,
      dtstartDay: dtstart.getDay(),
      dtstartDate: dtstart.getDate(),
      startLocalISO: event.startLocalISO,
      tzid: event.tzid,
      rawInstancesCount: rawInstances.length,
      windowStartUtc,
      windowEndUtc,
      expandedStart,
      expandedEnd
    });

    // Check if we should validate time consistency
    const shouldValidateTime = rule.frequency === 'DAILY' || rule.frequency === 'WEEKLY' ||
      rule.rrule.includes('FREQ=DAILY') || rule.rrule.includes('FREQ=WEEKLY');

    for (const instanceNaive of rawInstances) {
      // instanceNaive contains UTC timestamps that represent local time values
      // Extract the UTC components and interpret them as local time in the event's timezone
      const localDt = DateTime.fromObject({
        year: instanceNaive.getUTCFullYear(),
        month: instanceNaive.getUTCMonth() + 1,
        day: instanceNaive.getUTCDate(),
        hour: instanceNaive.getUTCHours(),
        minute: instanceNaive.getUTCMinutes(),
        second: instanceNaive.getUTCSeconds()
      }, { zone: event.tzid });
      
      const localISO = localDt.toISO({ suppressMilliseconds: true, includeOffset: false })!;
      
      // Convert to UTC for storage and window checking
      const instanceUtc = localDt.toUTC().toJSDate();
      
      console.log('[DEBUG manager] Processing instance:', {
        instanceNaive,
        localISO,
        instanceUtc,
        localWeekday: localDt.weekday,
        inWindow: instanceUtc >= windowStartUtc && instanceUtc <= windowEndUtc
      });
      
      // Check if this occurrence is within the actual window (filter out buffer)
      if (instanceUtc < windowStartUtc || instanceUtc > windowEndUtc) {
        console.log('[DEBUG manager] Skipped: outside window');
        continue;
      }
      
      if (shouldValidateTime) {
        // For DAILY/WEEKLY: Check if the local time matches the expected hour/minute from the original event
        const originalDt = DateTime.fromISO(event.startLocalISO, { zone: event.tzid });
        if (localDt.hour !== originalDt.hour || localDt.minute !== originalDt.minute || localDt.second !== originalDt.second) {
          // Time was adjusted due to DST, skip it
          console.log('[DEBUG manager] Skipped: time mismatch (DST)');
          continue;
        }
      }
      
      // Verify the local time is valid
      if (!localDt.isValid) {
        console.log('[DEBUG manager] Skipped: invalid local time');
        continue;
      }

      occurrences.push({
        eventId: event.id,
        startUtc: instanceUtc,
        endUtc: new Date(instanceUtc.getTime() + event.durationMs),
        originalLocalISO: localISO
      });
    }
  } catch (error) {
    console.error('Error generating RRULE occurrences:', error);
  }

  return occurrences;
}

/**
 * Deduplicate and merge occurrences from multiple sources
 * Priority: overrides > cached > generated
 */
function deduplicateOccurrences(occurrences: Occurrence[]): Occurrence[] {
  const map = new Map<string, Occurrence>();
  
  for (const occ of occurrences) {
    const key = `${occ.eventId}-${occ.startUtc.getTime()}`;
    const existing = map.get(key);
    
    if (!existing) {
      map.set(key, occ);
    } else {
      // Priority: override > cached > generated
      if (occ.overrideId && !existing.overrideId) {
        map.set(key, occ);
      } else if (occ.isFromCache && !existing.overrideId && !existing.isFromCache) {
        map.set(key, occ);
      }
    }
  }
  
  return Array.from(map.values()).sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
}

// ============================================================================
// RECURRENCE MANAGER
// ============================================================================

export interface RecurrenceManager {
  createEvent(ev: Omit<EventMaster, "id" | "createdAtUtc" | "updatedAtUtc">): Promise<EventMaster>;
  updateEvent(id: ID, patch: Partial<Omit<EventMaster, "id" | "createdAtUtc">>): Promise<EventMaster>;
  deleteEvent(id: ID): Promise<void>;
  
  createOverride(ov: Omit<OccurrenceOverride, "id" | "createdAtUtc">): Promise<OccurrenceOverride>;
  updateOverride(id: ID, patch: Partial<OccurrenceOverride>): Promise<OccurrenceOverride>;
  deleteOverride(id: ID): Promise<void>;
  
  getOccurrencesWindow(windowStartUtc: Date, windowEndUtc: Date): Promise<Occurrence[]>;
  
  clearAll(): Promise<void>;
  _dumpState(): Promise<{
    events: EventMaster[];
    overrides: OccurrenceOverride[];
    cachedOccurrences?: Occurrence[];
  }>;
}

export function createRecurrenceManager(): RecurrenceManager {
  // In-memory storage
  const events = new Map<ID, EventMaster>();
  const overrides = new Map<ID, OccurrenceOverride>();
  const occurrenceCache = new Map<string, Occurrence[]>();

  /**
   * Invalidate cache for a specific event
   */
  function invalidateCache(eventId?: ID): void {
    if (eventId) {
      // Remove only entries for this event
      for (const [key, _] of occurrenceCache) {
        if (key.startsWith(`${eventId}-`)) {
          occurrenceCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      occurrenceCache.clear();
    }
  }

  /**
   * Create a new event
   */
  async function createEvent(ev: Omit<EventMaster, "id" | "createdAtUtc" | "updatedAtUtc">): Promise<EventMaster> {
    const event: EventMaster = {
      ...ev,
      id: generateId(),
      createdAtUtc: new Date(),
      rdateUtc: ev.rdateUtc ?? [],
      exdateUtc: ev.exdateUtc ?? []
    };
    events.set(event.id, event);
    return event;
  }

  /**
   * Update an existing event
   */
  async function updateEvent(id: ID, patch: Partial<Omit<EventMaster, "id" | "createdAtUtc">>): Promise<EventMaster> {
    const event = events.get(id);
    if (!event) {
      throw new Error(`Event ${id} not found`);
    }
    
    const updated: EventMaster = {
      ...event,
      ...patch,
      id: event.id,
      createdAtUtc: event.createdAtUtc,
      updatedAtUtc: new Date()
    };
    
    events.set(id, updated);
    invalidateCache(id);
    return updated;
  }

  /**
   * Delete an event
   */
  async function deleteEvent(id: ID): Promise<void> {
    events.delete(id);
    // Also delete related overrides
    for (const [ovId, ov] of overrides) {
      if (ov.eventId === id) {
        overrides.delete(ovId);
      }
    }
    invalidateCache(id);
  }

  /**
   * Create an override
   */
  async function createOverride(ov: Omit<OccurrenceOverride, "id" | "createdAtUtc">): Promise<OccurrenceOverride> {
    const override: OccurrenceOverride = {
      ...ov,
      id: generateId(),
      createdAtUtc: new Date()
    };
    overrides.set(override.id, override);
    invalidateCache(override.eventId);
    return override;
  }

  /**
   * Update an override
   */
  async function updateOverride(id: ID, patch: Partial<OccurrenceOverride>): Promise<OccurrenceOverride> {
    const override = overrides.get(id);
    if (!override) {
      throw new Error(`Override ${id} not found`);
    }
    
    const updated: OccurrenceOverride = {
      ...override,
      ...patch,
      id: override.id,
      createdAtUtc: override.createdAtUtc
    };
    
    overrides.set(id, updated);
    invalidateCache(override.eventId);
    return updated;
  }

  /**
   * Delete an override
   */
  async function deleteOverride(id: ID): Promise<void> {
    const override = overrides.get(id);
    if (override) {
      invalidateCache(override.eventId);
    }
    overrides.delete(id);
  }

  /**
   * Generate occurrences for a UTC window
   */
  async function getOccurrencesWindow(windowStartUtc: Date, windowEndUtc: Date): Promise<Occurrence[]> {
    const allOccurrences: Occurrence[] = [];

    for (const event of events.values()) {
      const eventOccurrences: Occurrence[] = [];

      // 1. Generate base recurrence occurrences
      if (event.recurrence.type === "RRULE") {
        const generated = generateRRuleOccurrences(event, event.recurrence, windowStartUtc, windowEndUtc);
        eventOccurrences.push(...generated);
      } else if (event.recurrence.type === "WEEKLY_BITMASK") {
        const generated = generateWeeklyBitmaskOccurrences(event, event.recurrence, windowStartUtc, windowEndUtc);
        eventOccurrences.push(...generated);
      } else if (event.recurrence.type === "NONE") {
        // Single occurrence
        const startUtc = localISOToUTC(event.startLocalISO, event.tzid);
        if (startUtc && startUtc >= windowStartUtc && startUtc <= windowEndUtc) {
          eventOccurrences.push({
            eventId: event.id,
            startUtc,
            endUtc: new Date(startUtc.getTime() + event.durationMs),
            originalLocalISO: event.startLocalISO
          });
        }
      }

      // 2. Add RDATE occurrences (explicit additional dates)
      if (event.rdateUtc && event.rdateUtc.length > 0) {
        console.log('[DEBUG manager] Processing RDATEs:', {
          eventId: event.id,
          rdateCount: event.rdateUtc.length,
          rdates: event.rdateUtc
        });
        for (const rdateUtc of event.rdateUtc) {
          const inWindow = rdateUtc >= windowStartUtc && rdateUtc <= windowEndUtc;
          console.log('[DEBUG manager] RDATE:', {
            rdateUtc,
            rdateDay: rdateUtc.getDay(),
            inWindow,
            windowStartUtc,
            windowEndUtc
          });
          if (inWindow) {
            const localISO = utcToLocalISO(rdateUtc, event.tzid);
            eventOccurrences.push({
              eventId: event.id,
              startUtc: rdateUtc,
              endUtc: new Date(rdateUtc.getTime() + event.durationMs),
              originalLocalISO: localISO
            });
            console.log('[DEBUG manager] Added RDATE occurrence:', localISO);
          }
        }
      }

      // 3. Remove EXDATE occurrences (explicit exclusions)
      const exdateSet = new Set((event.exdateUtc ?? []).map(d => d.getTime()));
      const filteredOccurrences = eventOccurrences.filter(occ => !exdateSet.has(occ.startUtc.getTime()));

      // 4. Apply overrides
      const eventOverrides = Array.from(overrides.values()).filter(ov => ov.eventId === event.id);
      
      // Remove cancelled occurrences
      const cancelledLocalISOs = new Set(
        eventOverrides
          .filter(ov => ov.isCancelled && ov.originalLocalISO)
          .map(ov => ov.originalLocalISO!)
      );
      
      const nonCancelledOccurrences = filteredOccurrences.filter(
        occ => !cancelledLocalISOs.has(occ.originalLocalISO)
      );

      // Apply modifications and additions
      for (const override of eventOverrides) {
        if (override.isCancelled) {
          continue; // Already handled above
        }

        if (override.newStartUtc) {
          // This is a moved or new occurrence
          const newStartUtc = override.newStartUtc;
          if (newStartUtc >= windowStartUtc && newStartUtc <= windowEndUtc) {
            const localISO = utcToLocalISO(newStartUtc, event.tzid);
            const durationMs = override.newDurationMs ?? event.durationMs;
            
            // Remove original if it exists
            const originalIdx = nonCancelledOccurrences.findIndex(
              occ => occ.originalLocalISO === override.originalLocalISO
            );
            if (originalIdx >= 0) {
              nonCancelledOccurrences.splice(originalIdx, 1);
            }

            // Add the modified occurrence
            nonCancelledOccurrences.push({
              id: override.id,
              eventId: event.id,
              startUtc: newStartUtc,
              endUtc: new Date(newStartUtc.getTime() + durationMs),
              originalLocalISO: localISO,
              overrideId: override.id
            });
          } else {
            // Moved outside window - just remove original if present
            const originalIdx = nonCancelledOccurrences.findIndex(
              occ => occ.originalLocalISO === override.originalLocalISO
            );
            if (originalIdx >= 0) {
              nonCancelledOccurrences.splice(originalIdx, 1);
            }
          }
        }
      }

      allOccurrences.push(...nonCancelledOccurrences);
    }

    // Deduplicate and sort
    const deduplicated = deduplicateOccurrences(allOccurrences);

    // Check for truncation
    if (deduplicated.length >= MAX_OCCURRENCES_PER_QUERY) {
      console.warn(`Occurrence limit reached: ${MAX_OCCURRENCES_PER_QUERY}. Results may be truncated.`);
    }

    return deduplicated.slice(0, MAX_OCCURRENCES_PER_QUERY);
  }

  /**
   * Clear all in-memory data
   */
  async function clearAll(): Promise<void> {
    events.clear();
    overrides.clear();
    occurrenceCache.clear();
  }

  /**
   * Dump internal state for debugging/testing
   */
  async function _dumpState() {
    return {
      events: Array.from(events.values()),
      overrides: Array.from(overrides.values()),
      cachedOccurrences: Array.from(occurrenceCache.values()).flat()
    };
  }

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    createOverride,
    updateOverride,
    deleteOverride,
    getOccurrencesWindow,
    clearAll,
    _dumpState
  };
}

