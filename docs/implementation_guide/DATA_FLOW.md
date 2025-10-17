# Data Flow (Stores-First Architecture)

- UI state: `src/lib/stores/ui.ts` (view, viewMode, modals) + `actions/uiActions.ts`
- Core data: `src/lib/stores/data.ts` (`events`, `memos`, `suggestionLogs`, `selectedDate`)
- Recurrence: `src/lib/stores/recurrence.store.ts` with sliding window system, `reactiveOccurrences`, `displayEvents`, `eventsForSelectedDate`
- Gaps: `src/lib/stores/gaps.ts` uses `eventsForSelectedDate`
- Forms: `forms/eventForm.ts`, `forms/memoForm.ts` (recurrenceForm.ts removed - integrated into eventForm)
- Bootstrap: `stores/bootstrap.ts` initializes timezone, UI, suggestions

## Event Data Model

### Event Types
- **All-day events**: Store start/end dates only (no times), can span multiple days
- **Some-timing events**: Store start/end dates only (same date), single day only
- **Timed events**: Store start/end dates AND times, can span multiple days

### Data Storage
- All events store dates in UTC
- Date-only events (all-day, some-timing): start/end times are 00:00 UTC
- Timed events: actual start/end times in UTC

### Display Logic
- **Timeline**: Shows timed events (positioned by time) and all-day events (full height, 00:00-23:59)
- **Event List**: Shows all events with appropriate labels
- **Calendar Grid**: Shows all events with visual indicators

## Sliding Window Recurrence Flow

### Event Creation/Update
1. User fills event form with recurrence settings
2. `eventActions.create/update` includes recurrence data
3. Event stored with recurrence fields in core data store
4. `reactiveOccurrences` detects new/updated events
5. Sliding window system loads occurrences for 7-month range
6. Forever events marked with `isForever: true` and visual indicators

### Window Management
1. Calendar navigation triggers window recalculation
2. 7-month window: 3 before + current + 3 after
3. `loadOccurrences` generates occurrences for window only
4. Auto-shift when user navigates beyond current window
5. Debug panel shows real-time window state

### Memory Efficiency
- Only 7 months of data loaded at any time
- Forever events handled without infinite generation
- Recurrence groups link events across time windows
- Automatic cleanup of old window data

Flow: actions -> operations -> core stores -> sliding window -> derived stores -> components
