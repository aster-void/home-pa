# Data Flow (Stores-First Architecture)

- UI state: `src/lib/stores/ui.ts` (view, viewMode, modals) + `actions/uiActions.ts`
- Core data: `src/lib/stores/data.ts` (`events`, `memos`, `suggestionLogs`, `selectedDate`)
- Recurrence: `src/lib/stores/recurrence.store.ts` with `reactiveOccurrences`, `displayEvents`, `eventsForSelectedDate`
- Gaps: `src/lib/stores/gaps.ts` uses `eventsForSelectedDate`
- Forms: `forms/eventForm.ts`, `forms/memoForm.ts`, `forms/recurrenceForm.ts`
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

Flow: actions -> operations -> core stores -> derived stores -> components
