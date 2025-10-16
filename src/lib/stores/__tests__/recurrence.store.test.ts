import { describe, it, expect, beforeEach } from 'vitest';
import { events, selectedDate, clearAllData } from '../../stores/data.js';
import { recurrenceStore, displayEvents, eventsForSelectedDate } from '../../stores/recurrence.store.js';

function setStore<T>(store: any, value: T) {
  store.set(value as any);
}

describe('recurrence.store derived displays', () => {
  beforeEach(() => {
    clearAllData();
    setStore(selectedDate, new Date('2025-01-15T00:00:00Z'));
    recurrenceStore.set({ occurrences: [], loading: false, error: null, lastUpdated: null });
  });

  it('combines regular events with occurrences', async () => {
    const base = new Date('2025-01-15T00:00:00Z');
    const regular = {
      id: 'e1',
      title: 'All-day',
      start: new Date('2025-01-15T00:00:00Z'),
      end: new Date('2025-01-15T23:59:59Z'),
      timeLabel: 'all-day' as const
    } as any;
    setStore(events, [regular]);

    let all: any[] = [];
    displayEvents.subscribe(v => (all = v))();
    expect(all.find(e => e.id === 'e1')).toBeTruthy();
  });

  it('filters events by selected date', async () => {
    setStore(selectedDate, new Date('2025-02-01T00:00:00Z'));
    const e = {
      id: 'e2',
      title: 'Meeting',
      start: new Date('2025-02-01T10:00:00Z'),
      end: new Date('2025-02-01T11:00:00Z'),
      timeLabel: 'some-timing' as const
    } as any;
    setStore(events, [e]);
    let filtered: any[] = [];
    eventsForSelectedDate.subscribe(v => (filtered = v))();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('e2');
  });
});


