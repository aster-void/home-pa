/**
 * Test Suite for Recurrence Manager
 * 
 * Covers:
 * - DST transitions (skip and ambiguous)
 * - RDATE/EXDATE edge cases
 * - Override scenarios
 * - Monthly BYSETPOS rules
 * - Huge series protection
 * - Weekly bitmask correctness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createRecurrenceManager, type EventMaster, type Recurrence } from './recurrence-manager';
import { DateTime } from 'luxon';

describe('RecurrenceManager', () => {
  let manager: ReturnType<typeof createRecurrenceManager>;

  beforeEach(async () => {
    manager = createRecurrenceManager();
    await manager.clearAll();
  });

  describe('Basic Event Creation', () => {
    it('should create a single non-recurring event', async () => {
      const event = await manager.createEvent({
        title: 'Meeting',
        startLocalISO: '2025-10-15T10:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000, // 1 hour
        recurrence: { type: 'NONE' }
      });

      expect(event.id).toBeDefined();
      expect(event.title).toBe('Meeting');

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0].eventId).toBe(event.id);
    });

    it('should create a weekly recurring event', async () => {
      const event = await manager.createEvent({
        title: 'Weekly Standup',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 30 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=WEEKLY;BYDAY=MO;INTERVAL=1'
        }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      // Should have 4-5 Monday occurrences in October
      expect(occurrences.length).toBeGreaterThanOrEqual(4);
      expect(occurrences.length).toBeLessThanOrEqual(5);
      
      // All should be Mondays
      occurrences.forEach(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        expect(dt.weekday).toBe(1); // Monday
      });
    });
  });

  describe('Weekly Bitmask Optimization', () => {
    it('should generate correct occurrences with weekly bitmask (Mon + Thu)', async () => {
      // Bitmask: Monday=1<<1=2, Thursday=1<<4=16, combined=18
      const event = await manager.createEvent({
        title: 'Bitmask Event',
        startLocalISO: '2025-10-06T09:00:00', // Monday
        tzid: 'America/New_York',
        durationMs: 30 * 60 * 1000,
        recurrence: {
          type: 'WEEKLY_BITMASK',
          anchorLocalStartISO: '2025-10-06T09:00:00',
          intervalWeeks: 1,
          daysBitmask: (1 << 1) | (1 << 4) // Monday + Thursday
        }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      // Count Mondays and Thursdays
      let mondays = 0;
      let thursdays = 0;
      
      occurrences.forEach(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        if (dt.weekday === 1) mondays++;
        if (dt.weekday === 4) thursdays++;
      });

      expect(mondays).toBeGreaterThan(0);
      expect(thursdays).toBeGreaterThan(0);
      expect(mondays + thursdays).toBe(occurrences.length);
    });

    it('should respect interval in weekly bitmask (every 2 weeks)', async () => {
      const event = await manager.createEvent({
        title: 'Bi-weekly',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'WEEKLY_BITMASK',
          anchorLocalStartISO: '2025-10-06T09:00:00',
          intervalWeeks: 2,
          daysBitmask: 1 << 1 // Monday only
        }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-11-30T23:59:59Z')
      );

      // Should have roughly half the Mondays
      expect(occurrences.length).toBeGreaterThanOrEqual(3);
      expect(occurrences.length).toBeLessThanOrEqual(5);

      // Check that they're actually 2 weeks apart (allow for DST adjustment)
      for (let i = 1; i < occurrences.length; i++) {
        const diff = occurrences[i].startUtc.getTime() - occurrences[i - 1].startUtc.getTime();
        const daysDiff = diff / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBeGreaterThanOrEqual(13.9);
        expect(daysDiff).toBeLessThanOrEqual(14.1);
      }
    });

    it('should respect count limit in weekly bitmask', async () => {
      const event = await manager.createEvent({
        title: 'Limited Event',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 30 * 60 * 1000,
        recurrence: {
          type: 'WEEKLY_BITMASK',
          anchorLocalStartISO: '2025-10-06T09:00:00',
          intervalWeeks: 1,
          daysBitmask: 1 << 1, // Monday
          count: 3
        }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-12-31T23:59:59Z')
      );

      expect(occurrences.length).toBe(3);
    });
  });

  describe('DST Handling', () => {
    it('should skip non-existent time during DST forward transition', async () => {
      // In America/New_York, DST forward happens on 2025-03-09 at 2:00 AM (spring forward)
      // Time 2:30 AM does not exist
      const event = await manager.createEvent({
        title: 'DST Skip Test',
        startLocalISO: '2025-03-02T02:30:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=DAILY;INTERVAL=1;COUNT=10'
        }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-03-01T00:00:00Z'),
        new Date('2025-03-15T23:59:59Z')
      );

      // Check that March 9 at 2:30 AM is not in the results
      const march9Occurrence = occurrences.find(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        return dt.month === 3 && dt.day === 9;
      });

      // The occurrence should be skipped (not present)
      expect(march9Occurrence).toBeUndefined();
    });

    it('should handle ambiguous time during DST backward transition', async () => {
      // In America/New_York, DST backward happens on 2025-11-02 at 2:00 AM (fall back)
      // Time 1:30 AM occurs twice - we should use the earlier instant
      const event = await manager.createEvent({
        title: 'DST Ambiguous Test',
        startLocalISO: '2025-10-26T01:30:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=DAILY;INTERVAL=1;COUNT=10'
        }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-25T00:00:00Z'),
        new Date('2025-11-05T23:59:59Z')
      );

      // Find the November 2 occurrence
      const nov2Occurrence = occurrences.find(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        return dt.month === 11 && dt.day === 2;
      });

      expect(nov2Occurrence).toBeDefined();
      // Should exist and use the earlier instant (EDT, not EST)
    });
  });

  describe('RDATE and EXDATE', () => {
    it('should include RDATE even when dtstart is outside window', async () => {
      const rdateUtc = new Date('2025-10-15T14:00:00Z');
      
      const event = await manager.createEvent({
        title: 'RDATE Test',
        startLocalISO: '2025-09-01T10:00:00', // Outside October window
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: { type: 'NONE' },
        rdateUtc: [rdateUtc]
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      expect(occurrences.length).toBe(1);
      expect(occurrences[0].startUtc.getTime()).toBe(rdateUtc.getTime());
    });

    it('should exclude occurrences matching EXDATE', async () => {
      const event = await manager.createEvent({
        title: 'EXDATE Test',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=DAILY;INTERVAL=1;COUNT=5'
        },
        exdateUtc: [
          // Exclude the second day (Oct 7)
          new Date(DateTime.fromISO('2025-10-07T09:00:00', { zone: 'America/New_York' }).toUTC().toISO()!)
        ]
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      // Should have 4 occurrences instead of 5
      expect(occurrences.length).toBe(4);
      
      // Oct 7 should not be present
      const oct7 = occurrences.find(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        return dt.day === 7;
      });
      expect(oct7).toBeUndefined();
    });
  });

  describe('Overrides', () => {
    it('should cancel a single occurrence', async () => {
      const event = await manager.createEvent({
        title: 'Cancellable Event',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=DAILY;INTERVAL=1;COUNT=5'
        }
      });

      // Cancel the third occurrence (Oct 8)
      await manager.createOverride({
        eventId: event.id,
        originalLocalISO: '2025-10-08T09:00:00',
        isCancelled: true
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      expect(occurrences.length).toBe(4);
      
      const oct8 = occurrences.find(occ => occ.originalLocalISO === '2025-10-08T09:00:00');
      expect(oct8).toBeUndefined();
    });

    it('should move occurrence inside window', async () => {
      const event = await manager.createEvent({
        title: 'Moveable Event',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=DAILY;INTERVAL=1;COUNT=5'
        }
      });

      // Move Oct 7 9AM to Oct 7 2PM
      const newStartUtc = DateTime.fromISO('2025-10-07T14:00:00', { zone: 'America/New_York' }).toJSDate();
      
      await manager.createOverride({
        eventId: event.id,
        originalLocalISO: '2025-10-07T09:00:00',
        newStartUtc
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      expect(occurrences.length).toBe(5);

      // Original time should not exist
      const original = occurrences.find(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        return dt.day === 7 && dt.hour === 9;
      });
      expect(original).toBeUndefined();

      // New time should exist
      const moved = occurrences.find(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        return dt.day === 7 && dt.hour === 14;
      });
      expect(moved).toBeDefined();
      expect(moved?.overrideId).toBeDefined();
    });

    it('should move occurrence outside window (remove from results)', async () => {
      const event = await manager.createEvent({
        title: 'Move Outside',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=DAILY;INTERVAL=1;COUNT=5'
        }
      });

      // Move Oct 7 to November (outside October window)
      const newStartUtc = DateTime.fromISO('2025-11-07T09:00:00', { zone: 'America/New_York' }).toJSDate();
      
      await manager.createOverride({
        eventId: event.id,
        originalLocalISO: '2025-10-07T09:00:00',
        newStartUtc
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      // Should only have 4 occurrences in October
      expect(occurrences.length).toBe(4);
      
      const oct7 = occurrences.find(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        return dt.day === 7;
      });
      expect(oct7).toBeUndefined();
    });

    it('should change duration with override', async () => {
      const event = await manager.createEvent({
        title: 'Duration Change',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000, // 1 hour
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=DAILY;INTERVAL=1;COUNT=3'
        }
      });

      const newStartUtc = DateTime.fromISO('2025-10-07T09:00:00', { zone: 'America/New_York' }).toJSDate();
      
      await manager.createOverride({
        eventId: event.id,
        originalLocalISO: '2025-10-07T09:00:00',
        newStartUtc,
        newDurationMs: 2 * 60 * 60 * 1000 // 2 hours
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      const modified = occurrences.find(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        return dt.day === 7;
      });

      expect(modified).toBeDefined();
      const duration = modified!.endUtc.getTime() - modified!.startUtc.getTime();
      expect(duration).toBe(2 * 60 * 60 * 1000);
    });
  });

  describe('Monthly Rules with BYSETPOS', () => {
    it('should generate 3rd Tuesday of each month', async () => {
      const event = await manager.createEvent({
        title: '3rd Tuesday',
        startLocalISO: '2025-10-21T10:00:00', // Oct 21 is 3rd Tuesday
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=MONTHLY;BYDAY=TU;BYSETPOS=3'
        }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-12-31T23:59:59Z')
      );

      // Should have Oct, Nov, Dec (3 occurrences)
      expect(occurrences.length).toBe(3);

      // Each should be a Tuesday
      occurrences.forEach(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        expect(dt.weekday).toBe(2); // Tuesday
      });
    });

    it('should generate last Friday of each month', async () => {
      const event = await manager.createEvent({
        title: 'Last Friday',
        startLocalISO: '2025-10-31T15:00:00', // Oct 31 is last Friday
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1'
        }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-12-31T23:59:59Z')
      );

      // Should have Oct, Nov, Dec
      expect(occurrences.length).toBe(3);

      // Each should be a Friday
      occurrences.forEach(occ => {
        const dt = DateTime.fromJSDate(occ.startUtc, { zone: 'America/New_York' });
        expect(dt.weekday).toBe(5); // Friday
      });
    });
  });

  describe('Huge Series Protection', () => {
    it('should protect against runaway daily recurrence', async () => {
      const event = await manager.createEvent({
        title: 'Infinite Daily',
        startLocalISO: '2025-01-01T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=DAILY;INTERVAL=1' // No end date
        }
      });

      // Request a huge window (10 years)
      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2035-12-31T23:59:59Z')
      );

      // Should be capped at MAX_OCCURRENCES_PER_QUERY (20,000)
      expect(occurrences.length).toBeLessThanOrEqual(20000);
    });

    it('should handle high-frequency rules safely', async () => {
      const event = await manager.createEvent({
        title: 'Hourly Event',
        startLocalISO: '2025-01-01T00:00:00',
        tzid: 'America/New_York',
        durationMs: 15 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=HOURLY;INTERVAL=1'
        }
      });

      // Request 2 years
      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2027-01-01T00:00:00Z')
      );

      // Should be capped
      expect(occurrences.length).toBeLessThanOrEqual(20000);
    });
  });

  describe('CRUD Operations', () => {
    it('should update event and invalidate cache', async () => {
      const event = await manager.createEvent({
        title: 'Original Title',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: { type: 'NONE' }
      });

      await manager.updateEvent(event.id, {
        title: 'Updated Title',
        durationMs: 2 * 60 * 60 * 1000
      });

      const state = await manager._dumpState();
      const updated = state.events.find(e => e.id === event.id);
      
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.durationMs).toBe(2 * 60 * 60 * 1000);
      expect(updated?.updatedAtUtc).toBeDefined();
    });

    it('should delete event and related overrides', async () => {
      const event = await manager.createEvent({
        title: 'To Delete',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: { type: 'NONE' }
      });

      const override = await manager.createOverride({
        eventId: event.id,
        originalLocalISO: '2025-10-06T09:00:00',
        isCancelled: true
      });

      await manager.deleteEvent(event.id);

      const state = await manager._dumpState();
      
      expect(state.events.find(e => e.id === event.id)).toBeUndefined();
      expect(state.overrides.find(o => o.id === override.id)).toBeUndefined();
    });

    it('should update override', async () => {
      const event = await manager.createEvent({
        title: 'Event',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: { type: 'NONE' }
      });

      const override = await manager.createOverride({
        eventId: event.id,
        originalLocalISO: '2025-10-06T09:00:00',
        note: 'Original note'
      });

      await manager.updateOverride(override.id, {
        note: 'Updated note',
        isCancelled: true
      });

      const state = await manager._dumpState();
      const updated = state.overrides.find(o => o.id === override.id);
      
      expect(updated?.note).toBe('Updated note');
      expect(updated?.isCancelled).toBe(true);
    });
  });

  describe('Timezone Handling', () => {
    it('should correctly convert between timezones', async () => {
      const event = await manager.createEvent({
        title: 'Tokyo Event',
        startLocalISO: '2025-10-15T09:00:00',
        tzid: 'Asia/Tokyo',
        durationMs: 60 * 60 * 1000,
        recurrence: { type: 'NONE' }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-14T00:00:00Z'),
        new Date('2025-10-16T00:00:00Z')
      );

      expect(occurrences).toHaveLength(1);
      
      // Original local should match input
      expect(occurrences[0].originalLocalISO).toBe('2025-10-15T09:00:00');
      
      // UTC should be different (Tokyo is UTC+9)
      const utcHour = occurrences[0].startUtc.getUTCHours();
      expect(utcHour).toBe(0); // 9 AM Tokyo = 0 AM UTC
    });

    it('should handle multiple events in different timezones', async () => {
      await manager.createEvent({
        title: 'NY Event',
        startLocalISO: '2025-10-15T10:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: { type: 'NONE' }
      });

      await manager.createEvent({
        title: 'Tokyo Event',
        startLocalISO: '2025-10-15T10:00:00',
        tzid: 'Asia/Tokyo',
        durationMs: 60 * 60 * 1000,
        recurrence: { type: 'NONE' }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-14T00:00:00Z'),
        new Date('2025-10-16T00:00:00Z')
      );

      expect(occurrences).toHaveLength(2);
      
      // Both should have same local time but different UTC times
      const nyOcc = occurrences.find(o => o.originalLocalISO.includes('10-15'));
      expect(nyOcc).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty recurrence gracefully', async () => {
      const event = await manager.createEvent({
        title: 'No Recurrence',
        startLocalISO: '2025-10-15T10:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: { type: 'NONE' }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-11-01T00:00:00Z'),
        new Date('2025-11-30T23:59:59Z')
      );

      // Event is in October, window is November - no occurrences
      expect(occurrences).toHaveLength(0);
    });

    it('should handle events with no duration', async () => {
      const event = await manager.createEvent({
        title: 'Zero Duration',
        startLocalISO: '2025-10-15T10:00:00',
        tzid: 'America/New_York',
        durationMs: 0,
        recurrence: { type: 'NONE' }
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0].startUtc.getTime()).toBe(occurrences[0].endUtc.getTime());
    });

    it('should deduplicate RDATE and generated occurrences', async () => {
      const startUtc = DateTime.fromISO('2025-10-06T09:00:00', { zone: 'America/New_York' }).toJSDate();
      
      const event = await manager.createEvent({
        title: 'Duplicate Test',
        startLocalISO: '2025-10-06T09:00:00',
        tzid: 'America/New_York',
        durationMs: 60 * 60 * 1000,
        recurrence: {
          type: 'RRULE',
          rrule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=3'
        },
        rdateUtc: [startUtc] // Same as first occurrence
      });

      const occurrences = await manager.getOccurrencesWindow(
        new Date('2025-10-01T00:00:00Z'),
        new Date('2025-10-31T23:59:59Z')
      );

      // Should deduplicate
      expect(occurrences.length).toBe(3);
    });
  });
});

