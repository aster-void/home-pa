/**
 * @fileoverview Svelte stores for reactive data management
 *
 * This module provides centralized state management for the personal assistant application.
 * It includes stores for events, memos, suggestion logs, and derived computed values.
 *
 * @author Personal Assistant Team
 * @version 1.0.0
 */

import { writable, derived } from "svelte/store";
import type { Event, SuggestionLog } from "../types.js";

// Temporary simple memo type (will be replaced with new Memo in Phase 4)
interface SimpleMemo {
  id: string;
  text: string;
}
type Memo = SimpleMemo;
import { toasts } from "./toast.js";

/**
 * Core application data stores
 */
/** @type {import('svelte/store').Writable<Event[]>} Calendar events store */
export const events = writable<Event[]>([]);

/** @type {import('svelte/store').Writable<Memo[]>} Memos store */
export const memos = writable<Memo[]>([]);

/** @type {import('svelte/store').Writable<SuggestionLog[]>} Suggestion logs store */
export const suggestionLogs = writable<SuggestionLog[]>([]);

/** @type {import('svelte/store').Writable<Date>} Currently selected date store */
export const selectedDate = writable<Date>(new Date());

/**
 * Helper function to create a new event with generated ID
 * @param event - Event data without ID
 * @returns Event with generated UUID
 */
function createEvent(event: Omit<Event, "id">): Event {
  return {
    ...event,
    id: crypto.randomUUID(),
  };
}

/**
 * Helper function to create a new memo with generated ID
 * @param text - Memo text content
 * @returns Memo with generated UUID
 */
function createMemo(text: string): Memo {
  return {
    id: crypto.randomUUID(),
    text,
  };
}

/**
 * Helper function to create a new suggestion log with generated ID
 * @param log - Log data without ID
 * @returns SuggestionLog with generated UUID
 */
function createSuggestionLog(log: Omit<SuggestionLog, "id">): SuggestionLog {
  return {
    ...log,
    id: crypto.randomUUID(),
  };
}

/**
 * Helper function to sort events by start time (ascending)
 * @param eventsList - Array of events to sort
 * @returns New sorted array of events
 */
function sortEvents(eventsList: Event[]): Event[] {
  return [...eventsList].sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Event management operations
 * Provides CRUD operations for calendar events with automatic sorting
 */
export const eventOperations = {
  create(event: Omit<Event, "id">): Event {
    const newEvent = createEvent(event);
    events.update((currentEvents) => sortEvents([...currentEvents, newEvent]));
    toasts.show("Event created successfully", "success");
    return newEvent;
  },

  update(id: string, updates: Partial<Omit<Event, "id">>): Event | null {
    let updatedEvent: Event | null = null;

    events.update((currentEvents) => {
      const index = currentEvents.findIndex((e) => e.id === id);
      if (index === -1) return currentEvents;

      updatedEvent = { ...currentEvents[index], ...updates };
      const newEvents = [...currentEvents];
      newEvents[index] = updatedEvent;
      return sortEvents(newEvents);
    });

    if (updatedEvent) {
      toasts.show("Event updated successfully", "success");
    }

    return updatedEvent;
  },

  delete(id: string): boolean {
    let deleted = false;

    events.update((currentEvents) => {
      const index = currentEvents.findIndex((e) => e.id === id);
      if (index === -1) return currentEvents;

      deleted = true;
      const newEvents = [...currentEvents];
      newEvents.splice(index, 1);
      return newEvents;
    });

    if (deleted) {
      toasts.show("Event deleted", "success");
    }

    return deleted;
  },

  getEventsForDate(date: Date): Event[] {
    let eventsForDate: Event[] = [];

    events.subscribe((currentEvents) => {
      eventsForDate = currentEvents.filter((event) => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
      });
    })();

    return eventsForDate;
  },

  getNextEventAfter(time: Date): Event | null {
    let nextEvent: Event | null = null;

    events.subscribe((currentEvents) => {
      const futureEvents = currentEvents.filter((event) => event.start > time);
      nextEvent = futureEvents.length > 0 ? futureEvents[0] : null;
    })();

    return nextEvent;
  },
};

/**
 * Memo management operations
 * Provides CRUD operations for user memos
 */
export const memoOperations = {
  create(text: string): Memo {
    const newMemo = createMemo(text);
    memos.update((currentMemos) => [...currentMemos, newMemo]);
    toasts.show("Memo saved", "success");
    return newMemo;
  },

  update(id: string, text: string): Memo | null {
    let updatedMemo: Memo | null = null;

    memos.update((currentMemos) => {
      const index = currentMemos.findIndex((m) => m.id === id);
      if (index === -1) return currentMemos;

      updatedMemo = { ...currentMemos[index], text };
      const newMemos = [...currentMemos];
      newMemos[index] = updatedMemo;
      return newMemos;
    });

    if (updatedMemo) {
      toasts.show("Memo updated", "success");
    }

    return updatedMemo;
  },

  delete(id: string): boolean {
    let deleted = false;

    memos.update((currentMemos) => {
      const index = currentMemos.findIndex((m) => m.id === id);
      if (index === -1) return currentMemos;

      deleted = true;
      const newMemos = [...currentMemos];
      newMemos.splice(index, 1);
      return newMemos;
    });

    if (deleted) {
      toasts.show("Memo deleted", "success");
    }

    return deleted;
  },
};

/**
 * Suggestion log management operations
 * Provides operations for tracking user interactions with suggestions
 */
export const suggestionLogOperations = {
  create(log: Omit<SuggestionLog, "id">): SuggestionLog {
    const newLog = createSuggestionLog(log);
    suggestionLogs.update((currentLogs) => [...currentLogs, newLog]);
    return newLog;
  },
};

/**
 * Derived stores for computed values
 */

/**
 * Events filtered for the currently selected date
 * Automatically updates when events or selectedDate changes
 */
export const todaysEvents = derived(
  [events, selectedDate],
  ([$events, $selectedDate]) => {
    return $events.filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === $selectedDate.toDateString();
    });
  },
);

/**
 * Utility function to clear all application data
 * Primarily used for testing and development
 * @warning This will permanently delete all user data
 */
export function clearAllData(): void {
  events.set([]);
  memos.set([]);
  suggestionLogs.set([]);
}
