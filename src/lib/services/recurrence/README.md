# Recurrence & Occurrence Manager

A frontend-only, in-memory recurrence and occurrence manager for TypeScript/JavaScript applications. Implements RFC-5545 compatible recurrence rules with timezone-aware occurrence generation.

## Features

- **Frontend-Only**: No database or server required - all data stored in memory
- **RFC-5545 Compatible**: Full RRULE support via rrule.js
- **Timezone-Aware**: Proper handling of IANA timezones using Luxon
- **DST Handling**: Correctly handles Daylight Saving Time transitions
- **Optimized Weekly Rules**: Fast-path bitmask implementation for simple weekly recurrence
- **Overrides & Exceptions**: Support for EXDATE, RDATE, and occurrence modifications
- **Performance**: Built-in occurrence caching and runaway protection

## Installation

Install required dependencies:

```bash
bun add rrule luxon
bun add -d vitest @types/luxon
```

## Quick Start

```typescript
import { createRecurrenceManager } from "$lib/services/recurrence-manager";

const manager = createRecurrenceManager();

// Create a weekly recurring event
const event = await manager.createEvent({
  title: "Weekly Standup",
  startLocalISO: "2025-10-06T09:00:00",
  tzid: "America/New_York",
  durationMs: 30 * 60 * 1000, // 30 minutes
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=WEEKLY;BYDAY=MO,TU;INTERVAL=1",
  },
});

// Get occurrences for a date range
const occurrences = await manager.getOccurrencesWindow(
  new Date("2025-10-01T00:00:00Z"),
  new Date("2025-10-31T23:59:59Z"),
);

console.log(occurrences);
// [
//   {
//     eventId: "...",
//     startUtc: Date,
//     endUtc: Date,
//     originalLocalISO: "2025-10-06T09:00:00"
//   },
//   ...
// ]
```

## Core Concepts

### Event Master

The master event definition containing recurrence rules:

```typescript
interface EventMaster {
  id: string;
  title: string;
  description?: string;
  startLocalISO: string; // e.g. "2025-10-06T09:00:00"
  tzid: string; // IANA timezone, e.g. "America/New_York"
  durationMs: number;
  recurrence: Recurrence;
  rdateUtc?: Date[]; // Additional explicit dates
  exdateUtc?: Date[]; // Excluded dates
  createdAtUtc: Date;
  updatedAtUtc?: Date;
}
```

### Recurrence Types

#### 1. None (Single Event)

```typescript
{
  type: "NONE";
}
```

#### 2. RRULE (RFC-5545)

```typescript
{
  type: "RRULE",
  rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1",
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
  until?: Date | null,
  count?: number | null
}
```

#### 3. Weekly Bitmask (Optimized)

```typescript
{
  type: "WEEKLY_BITMASK",
  anchorLocalStartISO: "2025-10-06T09:00:00",
  intervalWeeks: 1,
  daysBitmask: 42,  // Mon(2) + Thu(16) + Fri(32) = 50
  until?: Date | null,
  count?: number | null
}
```

**Bitmask Encoding:**

- Sunday: 1 << 0 = 1
- Monday: 1 << 1 = 2
- Tuesday: 1 << 2 = 4
- Wednesday: 1 << 3 = 8
- Thursday: 1 << 4 = 16
- Friday: 1 << 5 = 32
- Saturday: 1 << 6 = 64

### Occurrence Overrides

Modify or cancel individual occurrences:

```typescript
interface OccurrenceOverride {
  id: string;
  eventId: string;
  originalLocalISO?: string | null; // Which occurrence to modify
  isCancelled?: boolean; // Cancel this occurrence
  newStartUtc?: Date | null; // Move to new time (UTC)
  newDurationMs?: number | null; // Change duration
  note?: string;
}
```

## API Reference

### Creating Events

```typescript
// Single event
const event = await manager.createEvent({
  title: "Meeting",
  startLocalISO: "2025-10-15T10:00:00",
  tzid: "America/New_York",
  durationMs: 60 * 60 * 1000,
  recurrence: { type: "NONE" },
});

// Daily recurring event
const dailyEvent = await manager.createEvent({
  title: "Daily Standup",
  startLocalISO: "2025-10-06T09:00:00",
  tzid: "Asia/Tokyo",
  durationMs: 15 * 60 * 1000,
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=DAILY;INTERVAL=1;COUNT=20",
  },
});

// Monthly event (3rd Tuesday)
const monthlyEvent = await manager.createEvent({
  title: "Monthly Review",
  startLocalISO: "2025-10-21T14:00:00",
  tzid: "America/Los_Angeles",
  durationMs: 2 * 60 * 60 * 1000,
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=MONTHLY;BYDAY=TU;BYSETPOS=3",
  },
});
```

### Updating Events

```typescript
await manager.updateEvent(event.id, {
  title: "Updated Title",
  durationMs: 90 * 60 * 1000,
});
```

### Deleting Events

```typescript
await manager.deleteEvent(event.id);
// Also deletes all related overrides
```

### Managing Overrides

```typescript
// Cancel a single occurrence
await manager.createOverride({
  eventId: event.id,
  originalLocalISO: "2025-10-15T10:00:00",
  isCancelled: true,
});

// Move an occurrence
await manager.createOverride({
  eventId: event.id,
  originalLocalISO: "2025-10-15T10:00:00",
  newStartUtc: new Date("2025-10-15T14:00:00Z"),
});

// Change duration for single occurrence
await manager.createOverride({
  eventId: event.id,
  originalLocalISO: "2025-10-15T10:00:00",
  newStartUtc: new Date("2025-10-15T14:00:00Z"),
  newDurationMs: 2 * 60 * 60 * 1000,
});
```

### Querying Occurrences

```typescript
const occurrences = await manager.getOccurrencesWindow(
  new Date("2025-10-01T00:00:00Z"),
  new Date("2025-10-31T23:59:59Z"),
);

// Occurrences are returned sorted by startUtc
occurrences.forEach((occ) => {
  console.log(`Event: ${occ.eventId}`);
  console.log(`Starts (UTC): ${occ.startUtc}`);
  console.log(`Local: ${occ.originalLocalISO}`);
  console.log(`Modified: ${occ.overrideId ? "Yes" : "No"}`);
});
```

## Timezone & DST Handling

### Timezone Policy

1. **Recurrence Evaluation**: All recurrence rules are evaluated in the event's `tzid` (IANA timezone)
2. **UTC Conversion**: Final occurrence times are converted to UTC for storage/transmission
3. **Local Display**: `originalLocalISO` provides the local time string for UI display

### DST Transitions

#### Spring Forward (Non-existent Times)

When clocks jump forward (e.g., 2:00 AM → 3:00 AM), times like 2:30 AM don't exist.

**Policy**: Skip the occurrence entirely

```typescript
// Event at 2:30 AM during DST forward transition
const event = await manager.createEvent({
  title: "Early Morning",
  startLocalISO: "2025-03-02T02:30:00",
  tzid: "America/New_York",
  durationMs: 60 * 60 * 1000,
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=DAILY;INTERVAL=1",
  },
});

// March 9, 2025: 2:30 AM is skipped (DST forward)
// Only valid occurrences are returned
```

#### Fall Back (Ambiguous Times)

When clocks fall back (e.g., 2:00 AM → 1:00 AM), times like 1:30 AM occur twice.

**Policy**: Use the earlier instant (before DST transition)

```typescript
// Event at 1:30 AM during DST backward transition
const event = await manager.createEvent({
  title: "Late Night",
  startLocalISO: "2025-11-02T01:30:00",
  tzid: "America/New_York",
  durationMs: 60 * 60 * 1000,
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=DAILY;INTERVAL=1",
  },
});

// November 2, 2025: Uses the first 1:30 AM (EDT, not EST)
```

## RDATE and EXDATE

### RDATE (Additional Dates)

Explicitly add occurrence dates:

```typescript
const event = await manager.createEvent({
  title: "Special Events",
  startLocalISO: "2025-10-15T10:00:00",
  tzid: "America/New_York",
  durationMs: 60 * 60 * 1000,
  recurrence: { type: "NONE" },
  rdateUtc: [
    new Date("2025-10-20T14:00:00Z"),
    new Date("2025-10-25T14:00:00Z"),
  ],
});

// Returns occurrences on Oct 15, 20, and 25
```

**Important**: RDATE entries are included even if `startLocalISO` is outside the query window.

### EXDATE (Excluded Dates)

Explicitly exclude occurrence dates:

```typescript
const event = await manager.createEvent({
  title: "Daily Meeting",
  startLocalISO: "2025-10-06T09:00:00",
  tzid: "America/New_York",
  durationMs: 30 * 60 * 1000,
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=DAILY;INTERVAL=1",
  },
  exdateUtc: [
    // Skip Oct 10 and Oct 15
    new Date("2025-10-10T13:00:00Z"),
    new Date("2025-10-15T13:00:00Z"),
  ],
});

// Oct 10 and Oct 15 are excluded from results
```

## Performance & Limits

### Maximum Occurrence Safeguard

To prevent runaway recurrence rules, a hard limit of **20,000 occurrences per query** is enforced.

```typescript
// This would generate millions of occurrences
const event = await manager.createEvent({
  title: "Hourly Forever",
  startLocalISO: "2025-01-01T00:00:00",
  tzid: "UTC",
  durationMs: 15 * 60 * 1000,
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=HOURLY;INTERVAL=1", // No end!
  },
});

// Query for 10 years
const occurrences = await manager.getOccurrencesWindow(
  new Date("2025-01-01T00:00:00Z"),
  new Date("2035-01-01T00:00:00Z"),
);

// Will be truncated to 20,000 occurrences max
console.log(occurrences.length); // <= 20000
```

### Weekly Bitmask Optimization

For simple weekly recurrence patterns, use the bitmask optimization:

```typescript
// Optimized: O(weeks) instead of O(days)
{
  type: 'WEEKLY_BITMASK',
  anchorLocalStartISO: '2025-10-06T09:00:00',
  intervalWeeks: 1,
  daysBitmask: (1 << 1) | (1 << 3) | (1 << 5) // Mon, Wed, Fri
}

// vs. Standard RRULE
{
  type: 'RRULE',
  rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1'
}
```

Both produce identical results, but the bitmask is faster for large windows.

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
bun test

# Run in watch mode
bun test:watch

# Run specific test file
bun test recurrence-manager.test.ts
```

### Test Coverage

The test suite covers:

- ✅ Basic CRUD operations
- ✅ Weekly bitmask optimization
- ✅ DST transitions (skip & ambiguous)
- ✅ RDATE/EXDATE edge cases
- ✅ Override scenarios (cancel, move, modify)
- ✅ Monthly BYSETPOS rules
- ✅ Huge series protection
- ✅ Timezone conversions
- ✅ Deduplication

## Advanced Usage

### Multi-Timezone Events

```typescript
// Event in Tokyo
const tokyoEvent = await manager.createEvent({
  title: "Tokyo Meeting",
  startLocalISO: "2025-10-15T09:00:00",
  tzid: "Asia/Tokyo",
  durationMs: 60 * 60 * 1000,
  recurrence: { type: "NONE" },
});

// Event in New York (same UTC instant)
const nyEvent = await manager.createEvent({
  title: "NY Meeting",
  startLocalISO: "2025-10-14T20:00:00", // Day before!
  tzid: "America/New_York",
  durationMs: 60 * 60 * 1000,
  recurrence: { type: "NONE" },
});

const occurrences = await manager.getOccurrencesWindow(
  new Date("2025-10-14T00:00:00Z"),
  new Date("2025-10-16T00:00:00Z"),
);

// Both events have same UTC time but different local representations
```

### Complex Monthly Rules

```typescript
// Last Friday of every month
const lastFriday = await manager.createEvent({
  title: "Last Friday Meeting",
  startLocalISO: "2025-10-31T15:00:00",
  tzid: "America/New_York",
  durationMs: 60 * 60 * 1000,
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1",
  },
});

// First and third Monday
const firstAndThird = await manager.createEvent({
  title: "Biweekly Monday",
  startLocalISO: "2025-10-06T10:00:00",
  tzid: "America/New_York",
  durationMs: 90 * 60 * 1000,
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=MONTHLY;BYDAY=MO;BYSETPOS=1,3",
  },
});
```

### Bulk Operations

```typescript
// Clear all data
await manager.clearAll();

// Debug state
const state = await manager._dumpState();
console.log("Events:", state.events.length);
console.log("Overrides:", state.overrides.length);
```

## Integration Examples

### SvelteKit Integration

```svelte
<script lang="ts">
  import { createRecurrenceManager } from "$lib/services/recurrence-manager";
  import { onMount } from "svelte";

  let occurrences = $state<Occurrence[]>([]);
  const manager = createRecurrenceManager();

  onMount(async () => {
    await manager.createEvent({
      title: "Weekly Standup",
      startLocalISO: "2025-10-06T09:00:00",
      tzid: "America/New_York",
      durationMs: 30 * 60 * 1000,
      recurrence: {
        type: "RRULE",
        rrule: "FREQ=WEEKLY;BYDAY=MO;INTERVAL=1",
      },
    });

    occurrences = await manager.getOccurrencesWindow(
      new Date("2025-10-01T00:00:00Z"),
      new Date("2025-10-31T23:59:59Z"),
    );
  });
</script>

{#each occurrences as occ}
  <div>
    <h3>{occ.eventId}</h3>
    <p>Local: {occ.originalLocalISO}</p>
    <p>UTC: {occ.startUtc.toISOString()}</p>
  </div>
{/each}
```

### Store Integration

```typescript
// stores/calendar.ts
import { writable } from "svelte/store";
import { createRecurrenceManager } from "$lib/services/recurrence-manager";

const manager = createRecurrenceManager();

export const occurrences = writable<Occurrence[]>([]);

export async function loadOccurrences(start: Date, end: Date) {
  const result = await manager.getOccurrencesWindow(start, end);
  occurrences.set(result);
}

export { manager };
```

## Troubleshooting

### Issue: Occurrences missing during DST

**Cause**: Event time is non-existent during DST forward transition

**Solution**: Check if event time falls in DST gap and adjust accordingly

```typescript
// Check if time is valid
import { DateTime } from "luxon";

const dt = DateTime.fromISO("2025-03-09T02:30:00", {
  zone: "America/New_York",
});
console.log(dt.isValid); // false - this time doesn't exist
```

### Issue: Too many occurrences returned

**Cause**: Recurrence rule generates more than 20,000 occurrences

**Solution**: Add `until` or `count` constraint

```typescript
// Add count limit
recurrence: {
  type: 'RRULE',
  rrule: 'FREQ=DAILY;INTERVAL=1;COUNT=365'
}

// Or use until date
recurrence: {
  type: 'RRULE',
  rrule: 'FREQ=DAILY;UNTIL=20251231T235959Z'
}
```

### Issue: Override not applied

**Cause**: `originalLocalISO` doesn't match exactly

**Solution**: Use exact local ISO string from generated occurrence

```typescript
// First, get the occurrence
const occurrences = await manager.getOccurrencesWindow(...);
const targetOcc = occurrences[0];

// Then use its exact originalLocalISO
await manager.createOverride({
  eventId: event.id,
  originalLocalISO: targetOcc.originalLocalISO, // Exact match
  isCancelled: true
});
```

## License

This module is part of the home-pa project.
