// Svelte stores for reactive data management
import { writable, derived } from 'svelte/store';
import type { Event, Memo, SuggestionLog } from '../types.js';

// Base stores for raw data
export const events = writable<Event[]>([]);
export const memos = writable<Memo[]>([]);
export const suggestionLogs = writable<SuggestionLog[]>([]);
export const selectedDate = writable<Date>(new Date());

// Helper function to create new event
function createEvent(event: Omit<Event, 'id'>): Event {
  return {
    ...event,
    id: crypto.randomUUID()
  };
}

// Helper function to create new memo
function createMemo(text: string): Memo {
  return {
    id: crypto.randomUUID(),
    text
  };
}

// Helper function to create new suggestion log
function createSuggestionLog(log: Omit<SuggestionLog, 'id'>): SuggestionLog {
  return {
    ...log,
    id: crypto.randomUUID()
  };
}

// Helper function to sort events by start time
function sortEvents(eventsList: Event[]): Event[] {
  return [...eventsList].sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Event operations
export const eventOperations = {
  create(event: Omit<Event, 'id'>): Event {
    const newEvent = createEvent(event);
    events.update(currentEvents => sortEvents([...currentEvents, newEvent]));
    return newEvent;
  },

  update(id: string, updates: Partial<Omit<Event, 'id'>>): Event | null {
    let updatedEvent: Event | null = null;
    
    events.update(currentEvents => {
      const index = currentEvents.findIndex(e => e.id === id);
      if (index === -1) return currentEvents;
      
      updatedEvent = { ...currentEvents[index], ...updates };
      const newEvents = [...currentEvents];
      newEvents[index] = updatedEvent;
      return sortEvents(newEvents);
    });
    
    return updatedEvent;
  },

  delete(id: string): boolean {
    let deleted = false;
    
    events.update(currentEvents => {
      const index = currentEvents.findIndex(e => e.id === id);
      if (index === -1) return currentEvents;
      
      deleted = true;
      const newEvents = [...currentEvents];
      newEvents.splice(index, 1);
      return newEvents;
    });
    
    return deleted;
  },

  getEventsForDate(date: Date): Event[] {
    let eventsForDate: Event[] = [];
    
    events.subscribe(currentEvents => {
      eventsForDate = currentEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
      });
    })();
    
    return eventsForDate;
  },

  getNextEventAfter(time: Date): Event | null {
    let nextEvent: Event | null = null;
    
    events.subscribe(currentEvents => {
      const futureEvents = currentEvents.filter(event => event.start > time);
      nextEvent = futureEvents.length > 0 ? futureEvents[0] : null;
    })();
    
    return nextEvent;
  }
};

// Memo operations
export const memoOperations = {
  create(text: string): Memo {
    const newMemo = createMemo(text);
    memos.update(currentMemos => [...currentMemos, newMemo]);
    return newMemo;
  },

  update(id: string, text: string): Memo | null {
    let updatedMemo: Memo | null = null;
    
    memos.update(currentMemos => {
      const index = currentMemos.findIndex(m => m.id === id);
      if (index === -1) return currentMemos;
      
      updatedMemo = { ...currentMemos[index], text };
      const newMemos = [...currentMemos];
      newMemos[index] = updatedMemo;
      return newMemos;
    });
    
    return updatedMemo;
  },

  delete(id: string): boolean {
    let deleted = false;
    
    memos.update(currentMemos => {
      const index = currentMemos.findIndex(m => m.id === id);
      if (index === -1) return currentMemos;
      
      deleted = true;
      const newMemos = [...currentMemos];
      newMemos.splice(index, 1);
      return newMemos;
    });
    
    return deleted;
  }
};

// Suggestion log operations
export const suggestionLogOperations = {
  create(log: Omit<SuggestionLog, 'id'>): SuggestionLog {
    const newLog = createSuggestionLog(log);
    suggestionLogs.update(currentLogs => [...currentLogs, newLog]);
    return newLog;
  }
};

// Derived stores for computed values
export const todaysEvents = derived(
  [events, selectedDate],
  ([$events, $selectedDate]) => {
    return $events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === $selectedDate.toDateString();
    });
  }
);

// Utility function to clear all data (for testing)
export function clearAllData(): void {
  events.set([]);
  memos.set([]);
  suggestionLogs.set([]);
}
