# Recurrence Manager Integration

## ⚠️ Current Status (IMPORTANT)

**UI Integration: DISABLED** (as of latest commit)

The recurrence manager core functionality is complete and tested, but the UI integration is **temporarily disabled** due to SSR/reactivity blocking issues.

### What's Working ✅
- **`src/lib/services/recurrence-manager.ts`** - Fully functional recurrence engine (610 lines)
- **`src/lib/services/recurrence-manager.test.ts`** - Complete test suite (25 tests, all passing)
- **`src/lib/services/recurrence-manager.README.md`** - Comprehensive documentation
- **`src/lib/types.ts`** - Event types extended with recurrence fields (lines 3-35)

### What's Disabled/Commented Out ⚠️
- **`src/lib/stores/data.ts`** (lines 15-87):
  - Recurrence manager imports - commented out
  - `occurrenceWindow` writable store - commented out
  - `expandedOccurrences` derived store - commented out
  - `allCalendarEvents` derived store - removed
  - `getEventsForRange()` method - removed
- **`src/lib/components/CalendarView.svelte`**:
  - Uses `$events` directly (no occurrence expansion)
  - No recurrence-related imports

### Why Integration Was Disabled

The initial integration caused the entire app to freeze/crash with these issues:

1. **Blocking Async in Derived Store**: The `expandedOccurrences` store ran heavy async computations immediately on store creation, blocking Svelte's reactivity
2. **SSR Hydration Mismatch**: Server rendered with empty `[]`, but client tried to hydrate with pending async recurrence calculations
3. **Import Side Effects**: Just importing `data.ts` triggered recurrence manager initialization, loading heavy dependencies
4. **Bundle Bloat**: `rrule` (47KB) + `luxon` (72KB) loaded on every page, even when not needed
5. **Reactivity Deadlock**: Async operations in derived stores interfered with Svelte's reactive update cycle
6. **Tab Switching Broken**: The blocking operations prevented all UI interactions, including navigation

## Overview

The frontend-only recurrence manager handles recurring events entirely in-memory without any database or server dependencies.

## Key Features

### ✅ Implemented
- **RFC-5545 RRULE Support**: Full standard recurrence rule support
- **Weekly Bitmask Optimization**: Fast-path for simple weekly patterns
- **Timezone Awareness**: Proper IANA timezone handling with Luxon
- **DST Handling**: 
  - Non-existent times (spring forward) are skipped
  - Ambiguous times (fall back) use the earlier instant
- **RDATE/EXDATE**: Add or exclude specific dates
- **Occurrence Overrides**: Cancel, move, or modify single occurrences
- **Protection**: 20,000 occurrence limit per query

## Architecture

### Core Components

1. **`recurrence-manager.ts`** - Pure TypeScript recurrence logic
   - Uses `rrule` for RFC-5545 parsing
   - Uses `luxon` for timezone handling
   - Generates occurrences on-demand

2. **`types.ts`** - Extended Event type with recurrence fields
   ```typescript
   interface Event {
     // ... existing fields
     recurrence?: Recurrence;
     tzid?: string;
     rdateUtc?: Date[];
     exdateUtc?: Date[];
   }
   ```

3. **`stores/data.ts`** - Integration layer
   - `expandedOccurrences` - Auto-expands recurring events
   - `allCalendarEvents` - Combines regular + recurring events
   - `occurrenceWindow` - Configurable date range (default: 2 years)

4. **`CalendarView.svelte`** - Updated to display occurrences
   - Uses `allCalendarEvents` store
   - No UI changes needed

## Usage Examples

### Create a Weekly Event

```typescript
import { eventOperations } from '$lib/stores/data';

eventOperations.create({
  title: "Team Standup",
  start: new Date("2025-10-06T09:00:00"),
  end: new Date("2025-10-06T09:30:00"),
  tzid: "America/New_York",
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1"
  }
});
```

### Create a Monthly Event (3rd Tuesday)

```typescript
eventOperations.create({
  title: "Monthly Review",
  start: new Date("2025-10-21T14:00:00"),
  end: new Date("2025-10-21T16:00:00"),
  tzid: "America/New_York",
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=MONTHLY;BYDAY=TU;BYSETPOS=3;COUNT=12"
  }
});
```

### Using Weekly Bitmask (Optimized)

```typescript
eventOperations.create({
  title: "Workout",
  start: new Date("2025-10-06T07:00:00"),
  end: new Date("2025-10-06T08:00:00"),
  tzid: "America/Los_Angeles",
  recurrence: {
    type: "WEEKLY_BITMASK",
    anchorLocalStartISO: "2025-10-06T07:00:00",
    intervalWeeks: 1,
    daysBitmask: (1 << 1) | (1 << 3) | (1 << 5), // Mon, Wed, Fri
    count: 50
  }
});
```

### Add Explicit Dates (RDATE)

```typescript
eventOperations.create({
  title: "Special Meeting",
  start: new Date("2025-10-15T10:00:00"),
  end: new Date("2025-10-15T11:00:00"),
  recurrence: { type: "NONE" },
  rdateUtc: [
    new Date("2025-10-20T14:00:00Z"),
    new Date("2025-10-25T14:00:00Z")
  ]
});
```

### Exclude Dates (EXDATE)

```typescript
eventOperations.create({
  title: "Daily Standup",
  start: new Date("2025-10-06T09:00:00"),
  end: new Date("2025-10-06T09:15:00"),
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=DAILY;INTERVAL=1"
  },
  exdateUtc: [
    new Date("2025-10-10T13:00:00Z"), // Skip Oct 10 (holiday)
    new Date("2025-10-15T13:00:00Z")  // Skip Oct 15 (offsite)
  ]
});
```

## Technical Details

### Date Range Window

The occurrence window controls how far ahead/behind we expand recurring events:

```typescript
import { occurrenceWindow } from '$lib/stores/data';

// Extend the window to 5 years
occurrenceWindow.set({
  start: new Date(2025, 0, 1),
  end: new Date(2030, 11, 31)
});
```

### Timezone Handling

- Events are stored with a `tzid` (IANA timezone like "America/New_York")
- Recurrence rules are evaluated in the event's local timezone
- Final occurrences are converted to UTC for storage/display
- UI receives both UTC and local ISO strings

### DST Edge Cases

**Spring Forward (Non-existent times)**:
- If an event falls on a DST forward day at a non-existent time (e.g., 2:30 AM becomes 3:30 AM), the occurrence is **skipped**
- Example: Daily 2:30 AM event on March 9, 2025 in New York → No occurrence that day

**Fall Back (Ambiguous times)**:
- If an event falls on a DST backward day at an ambiguous time (e.g., 1:30 AM occurs twice), the **earlier instant** is used
- Example: Daily 1:30 AM event on November 2, 2025 in New York → Uses first 1:30 AM (EDT)

### Performance

- **Weekly Bitmask**: O(weeks) instead of O(days) - significantly faster for simple weekly patterns
- **Caching**: Occurrences are cached in the derived store, only recalculated when events change
- **Limit**: Maximum 20,000 occurrences per query to prevent runaway rules

## Testing

Run the test suite:

```bash
bun test
```

All 25 tests cover:
- ✅ Basic recurrence patterns (daily, weekly, monthly)
- ✅ DST transitions
- ✅ RDATE/EXDATE edge cases
- ✅ Occurrence overrides
- ✅ Monthly BYSETPOS rules
- ✅ Huge series protection
- ✅ Timezone conversions
- ✅ Edge cases and deduplication

## CommonJS Import Fix

**Issue**: The `rrule` package is CommonJS and doesn't support named exports in Vite SSR.

**Solution**: Use default import with destructuring:

```typescript
import pkg from 'rrule';
const { RRule, RRuleSet, rrulestr } = pkg;
```

This ensures compatibility with both SSR and client-side rendering.

## How to Re-Enable Recurrence (Implementation Strategies)

### Strategy 1: Lazy Loading (Recommended) ✅

Load recurrence occurrences only when needed, not on store initialization.

```typescript
// src/lib/services/recurrence.store.ts
import { writable } from 'svelte/store';
import { createRecurrenceManager } from './recurrence-manager.js';

export const recurrenceStore = writable({
  occurrences: [],
  loading: false,
  error: null
});

let manager: ReturnType<typeof createRecurrenceManager> | null = null;

export async function loadOccurrences(events: Event[], start: Date, end: Date) {
  recurrenceStore.update(s => ({ ...s, loading: true, error: null }));
  
  try {
    if (!manager) manager = createRecurrenceManager();
    
    await manager.clearAll();
    // ... generate occurrences
    
    recurrenceStore.update(s => ({ 
      ...s, 
      occurrences: result, 
      loading: false 
    }));
  } catch (error) {
    recurrenceStore.update(s => ({ 
      ...s, 
      loading: false, 
      error: error.message 
    }));
  }
}
```

**Usage in Component:**
```svelte
<script>
  import { loadOccurrences, recurrenceStore } from '$lib/services/recurrence.store';
  import { events } from '$lib/stores/data';
  
  onMount(() => {
    loadOccurrences($events, windowStart, windowEnd);
  });
  
  // Update when events change
  $effect(() => {
    loadOccurrences($events, windowStart, windowEnd);
  });
</script>

{#if $recurrenceStore.loading}
  <p>Loading recurring events...</p>
{:else}
  {#each $recurrenceStore.occurrences as occ}
    <!-- render occurrence -->
  {/each}
{/if}
```

**Pros:**
- ✅ No blocking on store init
- ✅ Works with SSR (graceful degradation)
- ✅ Only loads when calendar view is active
- ✅ Easy to add loading states

**Cons:**
- ⚠️ Manual trigger required
- ⚠️ Need to handle loading/error states

---

### Strategy 2: Client-Only Guard 🔒

Prevent recurrence calculations during SSR.

```typescript
// src/lib/stores/data.ts
import { browser } from '$app/environment';

export const expandedOccurrences = derived(
  [events, occurrenceWindow],
  ([$events, $window], set) => {
    // SSR: return empty immediately
    if (!browser) {
      set([]);
      return;
    }
    
    // Client-only: run async work
    set([]);
    generateOccurrences($events, $window).then(set).catch(() => set([]));
  },
  []
);
```

**Pros:**
- ✅ SSR-safe
- ✅ Automatic reactivity
- ✅ Minimal code changes

**Cons:**
- ⚠️ Still blocks on first client render
- ⚠️ Flash of empty state
- ⚠️ Heavy bundle (rrule + luxon always loaded)

---

### Strategy 3: Web Worker 🔧

Offload recurrence calculations to a background thread.

```typescript
// src/lib/workers/recurrence.worker.ts
import { createRecurrenceManager } from '../services/recurrence-manager.js';

self.onmessage = async (e) => {
  const { events, start, end } = e.data;
  const manager = createRecurrenceManager();
  
  // ... generate occurrences
  
  self.postMessage({ occurrences });
};
```

```typescript
// src/lib/stores/data.ts
const worker = new Worker('/recurrence.worker.js');

export const expandedOccurrences = writable([]);

worker.onmessage = (e) => {
  expandedOccurrences.set(e.data.occurrences);
};

export function updateOccurrences(events, start, end) {
  worker.postMessage({ events, start, end });
}
```

**Pros:**
- ✅ Non-blocking UI
- ✅ Smooth performance
- ✅ Works well for complex calculations

**Cons:**
- ⚠️ Complex setup
- ⚠️ Worker compatibility (Vite config needed)
- ⚠️ Serialization overhead

---

### Strategy 4: Code Splitting 📦

Dynamically import recurrence manager only when needed.

```typescript
// src/lib/stores/data.ts
export const expandedOccurrences = writable([]);

export async function enableRecurrence(events, start, end) {
  // Dynamic import - only loads when called
  const { createRecurrenceManager } = await import('./services/recurrence-manager.js');
  
  const manager = createRecurrenceManager();
  // ... generate occurrences
  
  expandedOccurrences.set(occurrences);
}
```

**Pros:**
- ✅ Bundle size reduced (lazy load)
- ✅ No SSR issues
- ✅ User controls when to load

**Cons:**
- ⚠️ Slight delay on first use
- ⚠️ Manual invocation needed

---

## Potential Problems & Solutions

### Problem 1: Heavy Initial Calculation
**Issue**: Generating 2 years of occurrences (730+ days) blocks UI

**Solutions:**
- Use incremental loading (load 3 months at a time)
- Implement virtual scrolling with on-demand generation
- Cache results in localStorage/IndexedDB
- Use Web Workers for background calculation

### Problem 2: SSR/Hydration Mismatch
**Issue**: Server renders empty, client renders with data

**Solutions:**
- Use `browser` guard from `$app/environment`
- Render with loading skeleton on server
- Use client-only components (`onMount`)
- Accept empty state on SSR, hydrate on client

### Problem 3: Bundle Size (119KB: rrule + luxon)
**Issue**: Heavy dependencies loaded on every page

**Solutions:**
- Code splitting with dynamic imports
- Use native `Temporal` API when available (2024+)
- Replace Luxon with lighter date library
- Implement custom timezone logic for common cases

### Problem 4: Store Reactivity Deadlock
**Issue**: Async derived stores block updates

**Solutions:**
- Use writable stores with manual updates
- Separate compute from store (service layer)
- Debounce expensive operations
- Use runes (`$state` + `$effect`) instead of stores

### Problem 5: Memory Leaks
**Issue**: Cached occurrences accumulate over time

**Solutions:**
- Implement LRU cache with size limit
- Clear cache on route change
- Use `onDestroy` to cleanup
- Set max cache age (e.g., 5 minutes)

---

## Recommended Implementation Path

For re-enabling recurrence in this app, use **Strategy 1 (Lazy Loading)** with these steps:

1. **Create separate recurrence store** (`recurrence.store.ts`)
   - Writable store with loading/error states
   - Async `loadOccurrences()` function
   - Manual trigger, not automatic

2. **Update CalendarView component**
   - Import recurrence store
   - Call `loadOccurrences()` in `onMount`
   - Add `$effect` to reload when events change
   - Show loading skeleton while generating

3. **Optimize bundle**
   - Dynamic import recurrence-manager
   - Only load when calendar tab active
   - Cache results for 5 minutes

4. **Add UI polish**
   - Loading spinner for long calculations
   - Error messages for failures
   - "Refresh" button to manually reload

This approach avoids all the blocking/SSR issues while maintaining good UX.

---

## Future Enhancements

Additional features to implement:

1. **Occurrence Overrides UI**: Interface to edit/cancel single occurrences
2. **"Edit This and Future"**: Modify all future occurrences from a point
3. **Recurrence Templates**: Pre-built patterns for common use cases
4. **iCalendar Export**: Generate .ics files for recurring events
5. **Server Sync**: Optional backend sync for persistence
6. **IndexedDB Caching**: Persist occurrences locally
7. **Custom Recurrence Builder**: Visual UI for creating complex rules

## References

- RFC-5545 (iCalendar): https://tools.ietf.org/html/rfc5545
- rrule.js: https://github.com/jakubroztocil/rrule
- Luxon: https://moment.github.io/luxon/
- SvelteKit SSR: https://kit.svelte.dev/docs/page-options#ssr
- Web Workers: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API

