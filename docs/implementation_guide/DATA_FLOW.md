# Data Flow (Stores-First Architecture)

## Store Overview

### UI State
- `src/lib/stores/ui.ts` — view, viewMode, modals, AppView type
- `src/lib/stores/actions/uiActions.ts` — navigation, view switching

### Core Data
- `src/lib/stores/data.ts` — `events`, `memos` (legacy), `suggestionLogs`, `selectedDate`
- `src/lib/stores/actions/taskActions.ts` — `tasks` store (rich Memo objects)

### Recurrence
- `src/lib/stores/recurrence.store.ts` — sliding window system
- Exports: `reactiveOccurrences`, `displayEvents`, `eventsForSelectedDate`

### Gaps
- `src/lib/stores/gaps.ts` — gap calculation from events
- Exports: `gaps`, `enrichedGaps` (with location labels)

### Schedule (NEW)
- `src/lib/stores/schedule.ts` — suggestion engine output
- Exports: `scheduleResult`, `scheduledBlocks`, `nextScheduledBlock`, `scheduleActions`

### Forms
- `forms/eventForm.ts` — event creation/editing
- `forms/memoForm.ts` — legacy memo form
- `forms/taskForm.ts` — rich task form (type, deadline, recurrence)

### Bootstrap
- `stores/bootstrap.ts` — initializes timezone, UI, suggestions

---

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
- **Timeline**: Shows timed events (positioned by time) and all-day events (full height)
- **Event List**: Shows all events with appropriate labels
- **Calendar Grid**: Shows all events with visual indicators

---

## Task/Suggestion Data Model (NEW)

### Task (Rich Memo) Structure
```typescript
interface Memo {
  id: string;
  title: string;
  type: "期限付き" | "バックログ" | "ルーティン";
  createdAt: Date;
  deadline?: Date;                    // For 期限付き
  recurrenceGoal?: RecurrenceGoal;    // For ルーティン
  locationPreference: LocationPreference;
  status: MemoStatus;
  genre?: string;                     // LLM-filled
  importance?: ImportanceLevel;       // LLM-filled
  sessionDuration?: number;           // LLM-suggested
  totalDurationExpected?: number;     // LLM-suggested
  lastActivity?: Date;
}
```

### Suggestion Structure
```typescript
interface Suggestion {
  id: string;
  memoId: string;
  need: number;         // 0.0–1.0+ (≥1.0 = mandatory)
  importance: number;   // 0.0–1.0
  duration: number;     // Minutes
  locationPreference: LocationPreference;
}
```

### Gap Structure (Extended)
```typescript
interface Gap {
  gapId: string;
  start: string;        // HH:mm
  end: string;          // HH:mm
  duration: number;     // Minutes
  locationLabel?: LocationLabel;  // Derived from surrounding events
}
```

---

## Suggestion System Flow

### Task Creation Flow
```
User fills TaskForm
        ↓
taskFormActions.updateField(...)
        ↓
taskActions.create()
        ↓
Validation → Create Memo object
        ↓
tasks.update([...tasks, newMemo])
        ↓
Toast notification
```

### Schedule Generation Flow
```
User clicks "Generate Schedule" (or auto-trigger)
        ↓
scheduleActions.regenerate(tasks, { gaps })
        ↓
SuggestionEngine.generateSchedule(memos, gaps)
  │
  ├── 1. filterActiveMemos()
  │      Filter out completionState === "completed"
  │
  ├── 2. resetMemoPeriodsIfNeeded()
  │      Reset routine counters on new day/week/month
  │
  ├── 3. enrichMemos() [if LLM configured]
  │      Fill genre, importance, durations via Gemini
  │
  ├── 4. memosToSuggestions()
  │      Score each memo → Suggestion[]
  │      │
  │      ├── calculateNeed() by type:
  │      │   - 期限付き: gradient from creation→deadline
  │      │   - バックログ: based on neglect time
  │      │   - ルーティン: based on goal progress
  │      │
  │      ├── calculateImportance()
  │      │   low=0.3, medium=0.6, high=0.9
  │      │
  │      └── selectDuration()
  │          sessionDuration or fallback
  │
  ├── 5. enrichGapsWithLocation()
  │      Derive locationLabel from surrounding events
  │
  └── 6. scheduleSuggestions()
         │
         ├── partitionSuggestions()
         │   Mandatory (need≥1.0) vs Optional
         │
         ├── knapsackSelect() [for optional]
         │   Select optimal subset for capacity
         │
         ├── enumerateBestOrder()
         │   Try permutations for best fit
         │
         └── assignOrderToGaps()
             Match by location + duration
        ↓
ScheduleResult returned
        ↓
scheduleResult.set(schedule)
        ↓
UI reactively updates (SchedulePanel)
```

### Session Completion Flow
```
User completes a task session
        ↓
scheduleActions.markSessionComplete(memo, minutesSpent)
        ↓
engine.markSessionComplete()
  │
  ├── Update timeSpentMinutes
  ├── Update lastActivity
  ├── Increment completionsThisPeriod (if routine)
  └── Set completionState if done
        ↓
Return updated Memo
        ↓
Update tasks store (caller responsibility)
```

---

## Sliding Window Recurrence Flow

### Event Creation/Update
1. User fills event form with recurrence settings
2. `eventActions.create/update` includes recurrence data
3. Event stored with recurrence fields in core data store
4. `reactiveOccurrences` detects new/updated events
5. Sliding window system loads occurrences for 7-month range
6. Forever events marked with `isForever: true`

### Window Management
1. Calendar navigation triggers window recalculation
2. 7-month window: 3 before + current + 3 after
3. `loadOccurrences` generates occurrences for window only
4. Auto-shift when user navigates beyond current window

### Memory Efficiency
- Only 7 months of data loaded at any time
- Forever events handled without infinite generation
- Recurrence groups link events across time windows
- Automatic cleanup of old window data

---

## Store Dependencies

```
events (data.ts)
    ↓
eventsForSelectedDate (recurrence.store.ts)
    ↓
gaps (gaps.ts) ←──────────────────┐
    ↓                              │
enrichedGaps (gaps.ts)             │
    ↓                              │
    └──────────────────────────────┼──→ scheduleActions.regenerate()
                                   │           ↓
tasks (taskActions.ts) ────────────┘    scheduleResult (schedule.ts)
                                               ↓
                                        SchedulePanel (UI)
```

---

## File References

| Purpose | File |
|---------|------|
| UI state | `stores/ui.ts` |
| Events | `stores/data.ts` |
| Tasks | `stores/actions/taskActions.ts` |
| Schedule | `stores/schedule.ts` |
| Gaps | `stores/gaps.ts` |
| Task form | `stores/forms/taskForm.ts` |
| Engine | `services/suggestions/suggestion-engine.ts` |
| Scoring | `services/suggestions/suggestion-scoring.ts` |
| Scheduler | `services/suggestions/suggestion-scheduler.ts` |

---

## Flow Summary

```
Actions → Operations → Core Stores → Derived Stores → Components

For suggestions:
TaskForm → taskActions → tasks store → scheduleActions → engine → scheduleResult → SchedulePanel
```
