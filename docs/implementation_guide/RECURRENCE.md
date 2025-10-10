# Recurrence Manager

## ✅ Status: ENABLED and Working

The frontend-only recurrence manager is **successfully integrated** using lazy-loading strategy. Recurring events work smoothly without blocking or SSR issues.

## Quick Reference

### File Locations
```
src/lib/
  ├── services/recurrence/
  │   ├── manager.ts              - Core recurrence engine (610 lines)
  │   ├── manager.test.ts         - Test suite (25 tests, all passing)
  │   └── README.md               - Detailed API documentation
  ├── stores/
  │   └── recurrence.store.ts     - Lazy-loading store integration
  └── types.ts                    - Event types with recurrence fields
```

### How to Use

```typescript
import { eventOperations } from '$lib/stores/data';

// Create a weekly recurring event
eventOperations.create({
  title: "Weekly Standup",
  start: new Date("2025-10-06T09:00:00"),
  end: new Date("2025-10-06T09:30:00"),
  tzid: "America/New_York",
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1"
  }
});

// Occurrences automatically appear in the calendar!
```

## Architecture

### Lazy-Loading Strategy ✅

The integration uses **dynamic imports** and **manual triggers** to avoid SSR/blocking issues:

```typescript
// stores/recurrence.store.ts
export async function loadOccurrences(events, windowStart, windowEnd) {
  // Dynamic import - only loads when needed
  const mgr = await import('../services/recurrence/manager.js');
  // Generate occurrences asynchronously
  // Update store when complete
}
```

### Flow

```
User Opens Calendar
    ↓
onMount() triggers loadOccurrences()
    ↓
Dynamic import (rrule + luxon loaded)
    ↓
Generate occurrences for 3-month window
    ↓
Display in calendar (non-blocking)
```

## Key Features

### ✅ Implemented

- **RFC-5545 RRULE Support**: Full standard recurrence rule support
- **Weekly Bitmask Optimization**: O(weeks) fast-path for simple weekly patterns
- **Timezone Awareness**: IANA timezone handling with Luxon
- **DST Handling**: 
  - Non-existent times (spring forward) are skipped
  - Ambiguous times (fall back) use the earlier instant
- **RDATE/EXDATE**: Add or exclude specific occurrence dates
- **Occurrence Overrides**: Cancel, move, or modify single occurrences (manager API ready)
- **Performance Protection**: 20,000 occurrence limit per query
- **Bundle Optimization**: ~119KB lazy-loaded only when needed
- **SSR-Safe**: No hydration issues
- **Loading States**: Spinner and error messages in UI

## Recurrence Types

### 1. None (Single Event)
```typescript
recurrence: { type: "NONE" }
```

### 2. RRULE (RFC-5545)
```typescript
recurrence: {
  type: "RRULE",
  rrule: "FREQ=WEEKLY;BYDAY=MO,TU;INTERVAL=1",
  count: 20  // optional
}
```

**Common Patterns:**
- Daily: `"FREQ=DAILY;INTERVAL=1"`
- Weekly (Mon/Wed/Fri): `"FREQ=WEEKLY;BYDAY=MO,WE,FR"`
- Monthly (3rd Tuesday): `"FREQ=MONTHLY;BYDAY=TU;BYSETPOS=3"`
- Monthly (last Friday): `"FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1"`

### 3. Weekly Bitmask (Optimized)
```typescript
recurrence: {
  type: "WEEKLY_BITMASK",
  anchorLocalStartISO: "2025-10-06T09:00:00",
  intervalWeeks: 1,
  daysBitmask: (1 << 1) | (1 << 3) | (1 << 5), // Mon, Wed, Fri
  count: 50
}
```

**Bitmask Values:**
- Sunday: `1 << 0` = 1
- Monday: `1 << 1` = 2
- Tuesday: `1 << 2` = 4
- Wednesday: `1 << 3` = 8
- Thursday: `1 << 4` = 16
- Friday: `1 << 5` = 32
- Saturday: `1 << 6` = 64

## Usage Examples

### Weekly Meeting
```typescript
eventOperations.create({
  title: "Team Sync",
  start: new Date("2025-10-06T10:00:00"),
  end: new Date("2025-10-06T11:00:00"),
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=WEEKLY;BYDAY=MO;COUNT=20"
  }
});
```

### Monthly Review (3rd Tuesday)
```typescript
eventOperations.create({
  title: "Monthly Review",
  start: new Date("2025-10-21T14:00:00"),
  end: new Date("2025-10-21T16:00:00"),
  recurrence: {
    type: "RRULE",
    rrule: "FREQ=MONTHLY;BYDAY=TU;BYSETPOS=3"
  }
});
```

### Bi-weekly Meeting
```typescript
eventOperations.create({
  title: "Sprint Planning",
  start: new Date("2025-10-06T09:00:00"),
  end: new Date("2025-10-06T10:00:00"),
  recurrence: {
    type: "WEEKLY_BITMASK",
    anchorLocalStartISO: "2025-10-06T09:00:00",
    intervalWeeks: 2,
    daysBitmask: 1 << 1, // Monday only
    count: 12
  }
});
```

## Performance

### Bundle Size
- **Main bundle**: No extra weight (same as before)
- **Lazy loaded**: ~119KB (rrule 47KB + luxon 72KB)
- **When**: Only when calendar view has recurring events
- **Impact**: Minimal - loads in ~100-300ms on first use

### Computation Speed
- **First load**: ~100-300ms for 3-month window
- **Cached loads**: ~50-100ms (manager singleton reused)
- **Window**: 3 months (prev month + current + next month)
- **Auto-reload**: Debounced 300ms on month navigation

### Memory
- Singleton manager instance (reused)
- Occurrences regenerated on demand
- No persistent cache (intentionally simple)

## Testing

Run the test suite:

```bash
bun test
```

**Coverage (25 tests, all passing):**
- ✅ Basic recurrence patterns (daily, weekly, monthly)
- ✅ DST transitions (skip non-existent, use earlier for ambiguous)
- ✅ RDATE/EXDATE edge cases
- ✅ Occurrence overrides (cancel, move, modify)
- ✅ Monthly BYSETPOS rules (3rd Tuesday, last Friday)
- ✅ Huge series protection (20K limit)
- ✅ Timezone conversions
- ✅ Edge cases and deduplication

## Current Limitations

### 1. Display Only
- **Current**: Recurring events show as occurrences in calendar
- **Limitation**: Cannot edit individual occurrences from UI yet
- **Workaround**: Edit the master event (affects all occurrences)

### 2. Master Events Only in Lists
- **Current**: Only master events appear in event list/timeline
- **Limitation**: Occurrence details not shown in detail views
- **Reason**: Prevents confusion about editing recurring events

### 3. No Override UI
- **Current**: Manager supports overrides (cancel, move, modify)
- **Limitation**: No UI to trigger override operations yet
- **Future**: Add context menu on occurrences

## Troubleshooting

### Issue: Recurring events not showing

**Check:**
1. Event has `recurrence` field with type "RRULE" or "WEEKLY_BITMASK"
2. Event start date is within calendar window
3. No console errors in browser DevTools
4. Loading spinner appears and completes

**Fix:**
```typescript
// Verify event structure
console.log(event.recurrence); // Should be defined
console.log(event.tzid); // Should be set
```

### Issue: Loading spinner stuck

**Cause**: Recurrence generation taking too long or failed

**Fix:**
- Check browser console for errors
- Reduce count or add until date to recurrence rule
- Check that rrule syntax is valid

### Issue: DST weirdness

**Behavior**: Events at 2:30 AM disappear on DST forward days

**Expected**: This is correct! Non-existent times are intentionally skipped

**Solution**: 
- Use a different time (3:00 AM or later)
- Or accept that spring forward days skip

## Technical Details

### Timezone Policy
- Events stored with `tzid` (IANA timezone, e.g., "America/New_York")
- Recurrence rules evaluated in event's local timezone
- Final occurrences converted to UTC for display
- UI receives both UTC time and local ISO string

### DST Handling

**Spring Forward (Non-existent times):**
- Time like 2:30 AM doesn't exist (clocks jump 2:00→3:00)
- **Policy**: Skip the occurrence
- Example: Daily 2:30 AM event on March 9, 2025 → No occurrence

**Fall Back (Ambiguous times):**
- Time like 1:30 AM occurs twice (clocks fall 2:00→1:00)
- **Policy**: Use earlier instant (before DST transition)
- Example: Daily 1:30 AM event on Nov 2, 2025 → First 1:30 AM

### Occurrence Window
- **Default**: 3 months (previous + current + next)
- **Updates**: On month navigation or event changes
- **Debounce**: 300ms to prevent excessive reloads

## Future Enhancements

### Short Term
1. **Occurrence Context Menu**: Right-click to edit/cancel single occurrence
2. **Visual Distinction**: Different color/icon for recurring events
3. **Occurrence Count Badge**: Show "Recurs weekly" in event details
4. **Extended Window**: Load 6-12 months for better long-term view

### Medium Term
1. **Edit Single Occurrence**: UI for override operations
2. **Edit This & Future**: Modify from a point forward
3. **Recurrence Templates**: Quick patterns (weekdays, bi-weekly, etc.)
4. **Better Error Messages**: User-friendly recurrence validation

### Long Term
1. **Visual Recurrence Builder**: Drag-and-drop rule creator
2. **iCalendar Import/Export**: .ics file support
3. **Server Persistence**: Backend sync for recurring events
4. **IndexedDB Cache**: Local storage for occurrences
5. **Occurrence History**: Track modifications

## API Reference

See `src/lib/services/recurrence/README.md` for complete API documentation.

### Quick API Overview

```typescript
// From stores/recurrence.store.ts
export async function loadOccurrences(
  events: Event[],
  windowStart: Date,
  windowEnd: Date
): Promise<void>

export function clearOccurrences(): void

export function getOccurrencesForDate(
  occurrences: RecurrenceOccurrence[],
  date: Date
): RecurrenceOccurrence[]

// Store
export const recurrenceStore: Writable<RecurrenceState>
```

## Implementation History

### v1 - Initial Attempt (Failed)
- Used async derived stores
- Auto-loaded on import
- **Result**: Blocked entire app, SSR hydration failed

### v2 - Current (Success) ✅
- Lazy-loading with dynamic imports
- Manual trigger in component
- **Result**: Smooth, non-blocking, production-ready

### Key Differences

| Aspect | v1 (Failed) | v2 (Success) |
|--------|-------------|--------------|
| Loading | Auto on import | Manual in component |
| Bundle | Always loaded | Lazy loaded |
| Async | Derived store | Writable + async function |
| SSR | Blocked | Safe |
| UX | Frozen app | Smooth with loading states |

## References

- **RFC-5545 (iCalendar)**: https://tools.ietf.org/html/rfc5545
- **rrule.js**: https://github.com/jakubroztocil/rrule
- **Luxon**: https://moment.github.io/luxon/
- **SvelteKit SSR**: https://kit.svelte.dev/docs/page-options#ssr

## Support

For detailed API documentation, see:
- `src/lib/services/recurrence/README.md` - Complete API guide
- `src/lib/services/recurrence/manager.ts` - Source code with inline docs
- `src/lib/services/recurrence/manager.test.ts` - Test examples

