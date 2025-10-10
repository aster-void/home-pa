/**
 * Lazy-Loading Recurrence Store
 * 
 * This store handles recurring event occurrence generation without blocking
 * the main application. It uses dynamic imports and manual triggers to avoid
 * SSR/hydration issues.
 */

import { writable } from 'svelte/store';
import type { Event } from '../types.js';

export interface RecurrenceOccurrence {
  id: string;
  eventId: string;
  startUtc: Date;
  endUtc: Date;
  originalLocalISO: string;
  title: string;
  description?: string;
}

export interface RecurrenceState {
  occurrences: RecurrenceOccurrence[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: RecurrenceState = {
  occurrences: [],
  loading: false,
  error: null,
  lastUpdated: null
};

export const recurrenceStore = writable<RecurrenceState>(initialState);

// Singleton manager instance (lazy loaded)
let manager: any = null;
let managerPromise: Promise<any> | null = null;

/**
 * Get or create the recurrence manager instance
 * Uses dynamic import to avoid loading heavy dependencies until needed
 */
async function getManager() {
  if (manager) return manager;
  
  if (!managerPromise) {
    managerPromise = import('./recurrence-manager.js').then(module => {
      manager = module.createRecurrenceManager();
      return manager;
    });
  }
  
  return managerPromise;
}

/**
 * Load occurrences for recurring events
 * This is the main function to call when you want to generate occurrences
 * 
 * @param events - Array of events (both recurring and non-recurring)
 * @param windowStart - Start of date range (UTC)
 * @param windowEnd - End of date range (UTC)
 */
export async function loadOccurrences(
  events: Event[],
  windowStart: Date,
  windowEnd: Date
): Promise<void> {
  // Set loading state
  recurrenceStore.update(s => ({ 
    ...s, 
    loading: true, 
    error: null 
  }));

  try {
    // Dynamic import - only loads when needed
    const mgr = await getManager();
    const { DateTime } = await import('luxon');
    
    // Clear previous data
    await mgr.clearAll();
    
    // Filter and add recurring events
    const recurringEvents = events.filter(
      event => event.recurrence && event.recurrence.type !== "NONE"
    );
    
    if (recurringEvents.length === 0) {
      // No recurring events, just clear occurrences
      recurrenceStore.update(s => ({
        ...s,
        occurrences: [],
        loading: false,
        lastUpdated: new Date()
      }));
      return;
    }
    
    // Add each recurring event to the manager
    for (const event of recurringEvents) {
      const tzid = event.tzid || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const startLocalISO = DateTime.fromJSDate(event.start, { zone: tzid })
        .toISO({ suppressMilliseconds: true, includeOffset: false })!;
      const durationMs = event.end.getTime() - event.start.getTime();
      
      await mgr.createEvent({
        title: event.title,
        description: event.description,
        startLocalISO,
        tzid,
        durationMs,
        recurrence: event.recurrence,
        rdateUtc: event.rdateUtc,
        exdateUtc: event.exdateUtc
      });
    }
    
    // Generate occurrences for the window
    const rawOccurrences = await mgr.getOccurrencesWindow(windowStart, windowEnd);
    
    // Map to our interface and include event details
    const occurrences: RecurrenceOccurrence[] = rawOccurrences.map((occ: any) => {
      const masterEvent = events.find(e => e.id === occ.eventId);
      return {
        id: occ.id || `${occ.eventId}-${occ.startUtc.getTime()}`,
        eventId: occ.eventId,
        startUtc: occ.startUtc,
        endUtc: occ.endUtc,
        originalLocalISO: occ.originalLocalISO,
        title: masterEvent?.title || 'Recurring Event',
        description: masterEvent?.description
      };
    });
    
    // Update store with success
    recurrenceStore.update(s => ({
      ...s,
      occurrences,
      loading: false,
      error: null,
      lastUpdated: new Date()
    }));
    
  } catch (error: any) {
    console.error('Error loading recurrence occurrences:', error);
    recurrenceStore.update(s => ({
      ...s,
      occurrences: [],
      loading: false,
      error: error.message || 'Failed to load recurring events',
      lastUpdated: new Date()
    }));
  }
}

/**
 * Clear all occurrences and reset state
 */
export function clearOccurrences(): void {
  recurrenceStore.set(initialState);
}

/**
 * Get occurrences for a specific date
 */
export function getOccurrencesForDate(
  occurrences: RecurrenceOccurrence[],
  date: Date
): RecurrenceOccurrence[] {
  const targetDateString = date.toDateString();
  return occurrences.filter(occ => {
    const occDate = new Date(occ.startUtc);
    return occDate.toDateString() === targetDateString;
  });
}

/**
 * Check if occurrences need refresh (older than 5 minutes)
 */
export function needsRefresh(lastUpdated: Date | null): boolean {
  if (!lastUpdated) return true;
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  return lastUpdated.getTime() < fiveMinutesAgo;
}

