# Schedule Caching Developer Guide

## Overview

The schedule generation system includes intelligent caching to prevent unnecessary UI updates. This document explains how the caching works and how to work with it.

## How It Works

### The Problem

Schedule generation runs automatically when:

- User opens the assistant tab (today selected)
- Tasks or gaps change
- User manually triggers regeneration

Without caching, every regeneration would cause a UI re-render even if the schedule result is identical, leading to:

- Unnecessary component re-renders
- Timeline flickering
- Poor user experience

### The Solution

Schedule results are cached and compared before updating the store:

```typescript
// In scheduleActions.regenerate()
const previous = get(scheduleResult);
const previousKey = previous ? stableSerializeSchedule(previous) : null;

// Generate new schedule
const { schedule } = await engine.generateSchedule(memos, gaps);
const nextKey = stableSerializeSchedule(schedule);

if (previousKey === nextKey) {
  // Identical schedule - skip UI update
  lastScheduleTime.set(new Date()); // Update timestamp only
  return schedule;
}

// Different schedule - update UI
scheduleResult.set(schedule);
```

## Stable Serialization

The `stableSerializeSchedule()` function creates a deterministic JSON representation:

```typescript
function stableSerializeSchedule(schedule: ScheduleResult): string {
  // Sort arrays for consistent comparison
  const scheduled = [...schedule.scheduled].sort((a, b) => {
    const idCompare = a.suggestionId.localeCompare(b.suggestionId);
    if (idCompare !== 0) return idCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const dropped = [...schedule.dropped].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  const mandatoryDropped = [...schedule.mandatoryDropped].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  return JSON.stringify({
    scheduled,
    dropped,
    mandatoryDropped,
    totalScheduledMinutes: schedule.totalScheduledMinutes,
    totalDroppedMinutes: schedule.totalDroppedMinutes,
  });
}
```

**Key Points:**

- Arrays are sorted before serialization (order doesn't matter for comparison)
- All fields are included in the comparison
- Uses `JSON.stringify()` for deterministic serialization

## When Caching Triggers

### Automatic Regeneration

Schedule regenerates automatically when:

1. User opens assistant tab with today selected
2. Tasks change (but result might be identical)
3. Gaps change (but result might be identical)

The caching ensures UI only updates when the actual schedule changes.

### Manual Regeneration

If you need to force regeneration (bypassing cache), you can:

```typescript
// Clear cache first
scheduleActions.clear();

// Then regenerate
await scheduleActions.regenerate(tasks, { gaps });
```

## Edge Cases

### Rapid Changes

If tasks change rapidly (multiple updates in quick succession):

- Each change triggers regeneration
- Caching prevents UI thrashing
- Only final schedule updates UI

### Time-Based Changes

Schedules are date-specific (today only). If user changes date:

- Previous day's schedule is not cached
- New day generates fresh schedule
- No caching across days

### Concurrent Generation

If multiple regenerations happen concurrently:

- Last one wins (standard Svelte store behavior)
- Earlier results are discarded
- Only final result updates UI

## Testing Cache Behavior

To verify caching works:

```typescript
// Generate schedule
await scheduleActions.regenerate(tasks1, { gaps: gaps1 });
const first = get(scheduleResult);

// Regenerate with same inputs
await scheduleActions.regenerate(tasks1, { gaps: gaps1 });
const second = get(scheduleResult);

// Check that store wasn't updated (reference equality)
expect(first).toBe(second); // Same reference = cache hit
```

## Debugging

Enable debug logs:

```typescript
// In scheduleActions.regenerate()
console.log("[Schedule] Cache comparison:", {
  hasPrevious: !!previous,
  isIdentical: previousKey === nextKey,
  previousKey: previousKey?.slice(0, 50), // First 50 chars
  nextKey: nextKey?.slice(0, 50),
});
```

## Performance Considerations

### Serialization Cost

- `stableSerializeSchedule()` runs on every regeneration
- Sorting arrays adds O(n log n) overhead
- JSON.stringify is fast for typical schedule sizes (< 100 blocks)
- Cost is negligible compared to schedule generation time

### Memory

- Only last schedule is cached (in store)
- Serialized keys are not persisted (recomputed each time)
- No memory leak concerns

## Best Practices

1. **Don't bypass cache unnecessarily** - Let the system handle it
2. **Clear cache explicitly** - Only when you need to force refresh
3. **Monitor cache hits** - High hit rate = good (prevents unnecessary updates)
4. **Test with identical inputs** - Verify cache prevents updates

## Future Improvements

Potential enhancements:

- Persist cache across sessions (localStorage)
- Cache multiple days (not just today)
- Invalidate cache based on time (e.g., every hour)
- Cache intermediate results (suggestions, gaps, etc.)
