# Data Flow (Stores-First Architecture)

- UI state: `src/lib/stores/ui.ts` (view, viewMode, modals) + `actions/uiActions.ts`
- Core data: `src/lib/stores/data.ts` (`events`, `memos`, `suggestionLogs`, `selectedDate`)
- Recurrence: `src/lib/stores/recurrence.store.ts` with `reactiveOccurrences`, `displayEvents`, `eventsForSelectedDate`
- Gaps: `src/lib/stores/gaps.ts` uses `eventsForSelectedDate`
- Forms: `forms/eventForm.ts`, `forms/memoForm.ts`, `forms/recurrenceForm.ts`
- Bootstrap: `stores/bootstrap.ts` initializes timezone, UI, suggestions

Flow: actions -> operations -> core stores -> derived stores -> components
