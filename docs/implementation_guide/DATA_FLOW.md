# Data Flow (Feature-Based Architecture with Svelte 5 Runes)

## Architecture Overview

HomePA uses a **feature-based architecture** with **Svelte 5 runes** for reactive state management. The application is organized into feature modules, each containing components, state classes, and services.

### Key Technologies

- **Svelte 5 Runes**: `$state`, `$derived`, `$effect` for reactivity
- **Remote Functions**: Type-safe server-side functions using SvelteKit's `query`/`command`
- **Prisma + MongoDB**: Database persistence
- **Better Auth**: Authentication with HTTP-only cookies

---

## Directory Structure

```
src/lib/
├── features/           # Feature modules
│   ├── calendar/       # Calendar & events
│   │   ├── components/ # UI components
│   │   ├── state/      # Reactive state classes (.svelte.ts)
│   │   └── services/   # Business logic (event-converter, ical-service)
│   ├── tasks/          # Rich task management
│   ├── memo/           # Simple memos
│   ├── assistant/      # Suggestions & scheduling
│   ├── utilities/      # Mini apps (Transit, ProgressMemo, Settings)
│   └── shared/         # Shared components
├── bootstrap/          # App initialization & global state
│   ├── data.svelte.ts  # Core data state
│   ├── ui.svelte.ts    # UI state
│   ├── toast.svelte.ts # Toast notifications
│   └── compat.svelte.ts # Compatibility layer (exports)
├── server/             # Server-only code (Prisma, env)
└── types.ts            # Shared type definitions
```

---

## State Management Pattern

### Svelte 5 Reactive Classes

State is managed using reactive classes with `$state` runes:

```typescript
// src/lib/features/{feature}/state/example.svelte.ts
class ExampleState {
  items = $state<Item[]>([]);

  get count(): number {
    return this.items.length;
  }

  add(item: Item): void {
    this.items.push(item);
  }
}

export const exampleState = new ExampleState();
```

### Bootstrap Layer

The `bootstrap/` directory provides:

- **Global state instances**: `dataState`, `uiState`, `toastState`
- **Compatibility exports**: `compat.svelte.ts` exports actions and state for backward compatibility
- **Action wrappers**: Functions that operate on state classes

---

## Core State Modules

### 1. Bootstrap State (`src/lib/bootstrap/`)

#### `data.svelte.ts` - Core Data State

- `memos`: Simple memos (legacy, simple text memos)
- `suggestionLogs`: User interaction logs
- `selectedDate`: Currently selected calendar date

#### `ui.svelte.ts` - UI State

- `viewMode`: Calendar view mode ("day" | "list")
- `currentSuggestion`: Currently displayed suggestion
- `isLoading`: Global loading state
- `errorMessage`: Global error message

#### `toast.svelte.ts` - Toast Notifications

- `toasts`: Array of active toast messages
- Methods: `show()`, `success()`, `error()`, `info()`, `dismiss()`

### 2. Calendar State (`src/lib/features/calendar/state/`)

#### `calendar.svelte.ts` - Calendar State Class

- `events`: Master events (from database)
- `occurrences`: Expanded recurring event occurrences (7-month sliding window)
- `loading`: Loading state
- `error`: Error message
- Methods:
  - `fetchEvents(window)`: Load events for date range
  - `createEvent(event)`: Create new event
  - `updateEvent(id, updates)`: Update event
  - `deleteEvent(id)`: Delete event
  - `importICS(file)`: Import .ics file
  - `getExportUrl(...)`: Generate export URL
  - `expandRecurringEvents(window)`: Expand recurrences for window

#### `eventForm.svelte.ts` - Event Form State

- `formData`: Current form data
- `errors`: Validation errors
- `isSubmitting`: Submission state
- `isOpen`: Form visibility
- Methods: `updateField()`, `validate()`, `reset()`, `setForEditing()`

#### `eventActions.ts` - Event Business Logic

- `create()`: Create event from form
- `update()`: Update existing event
- `delete()`: Delete event
- `createNewEvent()`: Initialize form for new event
- Handles date conversions (UTC/local), validation, error handling

### 3. Tasks State (`src/lib/features/tasks/state/`)

#### `taskActions.ts` - Task CRUD Operations

- `tasks`: Writable store of `Memo[]` (rich task objects)
- Methods:
  - `create()`: Create task from form
  - `update()`: Update task
  - `delete()`: Delete task
  - `fetchAll()`: Load all tasks from database
- Persists to database via Remote Functions

#### `taskForm.ts` - Task Form State

- `taskForm`: Form data store
- `taskFormErrors`: Validation errors
- `isTaskFormSubmitting`: Submission state
- `isTaskFormOpen`: Form visibility
- Conditional fields based on task type

### 4. Assistant State (`src/lib/features/assistant/state/`)

#### `gaps.svelte.ts` - Gap Detection

- `events`: Events used for gap calculation
- `dayBoundaries`: Day start/end times
- `gaps`: Computed gaps (free time slots)
- `enrichedGaps`: Gaps with location labels
- `gapStats`: Statistics about gaps

#### `schedule.ts` - Schedule State

- `scheduleResult`: Result from suggestion engine
- `isScheduleLoading`: Loading state
- `scheduleError`: Error message
- `scheduledBlocks`: Scheduled task blocks
- `pendingSuggestions`: Suggestions awaiting user action
- `acceptedSuggestions`: User-accepted suggestions (act as fixed events)
- `scheduleActions`: Actions for schedule management

### 5. Memo State (`src/lib/features/memo/state/`)

#### `memoForm.svelte.ts` - Simple Memo Form

- `formData`: Memo form data
- `errors`: Validation errors
- `isSubmitting`: Submission state
- Methods: `updateField()`, `validate()`, `reset()`

#### `memoActions.ts` - Memo CRUD

- CRUD operations for simple memos
- Persists to database via Remote Functions

---

## Remote Functions Pattern

### Server-Side Functions

Remote Functions run on the server and are callable from the client with type safety:

```typescript
// src/lib/features/{feature}/state/{feature}.functions.remote.ts
import { query, command, getRequestEvent } from "$app/server";
import * as v from "valibot";

export const fetchEvents = query({
  schema: v.object({ start: v.string(), end: v.string() }),
  async run({ start, end }) {
    const userId = getAuthenticatedUser();
    // Server-side logic
    return events;
  },
});
```

### Client-Side Usage

```typescript
import { fetchEvents } from "./calendar.functions.remote.ts";

const events = await fetchEvents({
  start: "2024-01-01",
  end: "2024-01-31",
});
```

### Remote Function Types

- **`query`**: Read operations (GET-like)
- **`command`**: Write operations (POST/PUT/DELETE-like)

---

## Event Data Flow

### Event Types

- **All-day events**: Date-only, no times, can span multiple days
- **Some-timing events**: Date-only, single day, no specific time
- **Timed events**: Full date-time, can span multiple days

### Data Storage

- All dates stored in **UTC** in database
- Date-only events: `00:00:00 UTC` for start/end
- Timed events: Actual UTC timestamps
- **Important**: All-day event conversions use UTC methods (`setUTCHours`, `setUTCDate`) to prevent timezone drift

### Event Conversion Pipeline

```
User Input (Local Time)
    ↓
eventActions.create()
    ↓
Event Form → UTC Conversion
    ↓
appEventToDbCreate() (event-converter.ts)
    ↓
Remote Function (command)
    ↓
Database (Prisma + MongoDB)
    ↓
Remote Function (query)
    ↓
dbEventToAppEvent() (event-converter.ts)
    ↓
Calendar State (reactive)
    ↓
UI Components
```

### Conversion Functions (`event-converter.ts`)

- **`appEventToDbCreate()`**: App Event → Database format
  - Converts inclusive end dates to exclusive DTEND for all-day events (iCal standard)
  - Uses UTC methods for date math

- **`dbEventToAppEvent()`**: Database → App Event
  - Converts exclusive DTEND back to inclusive end dates
  - Uses UTC methods for date math

- **`appEventToDbUpdate()`**: App updates → Database format
- **`parsedEventToDbCreate()`**: Imported iCal → Database format
- **`appEventToParsedEvent()`**: App Event → iCal format (for export)

---

## Recurrence System (Sliding Window)

### Architecture

- **Master Events**: Stored in database with RRULE
- **Occurrences**: Expanded on-demand for 7-month window
- **Window Management**: Auto-shifts when user navigates beyond current window

### Flow

```
User creates recurring event
    ↓
Event stored with RRULE in database
    ↓
calendarState.fetchEvents(window)
    ↓
calendarState.expandRecurringEvents(window)
    ↓
ical-service.expandRecurrences() (uses ical.js)
    ↓
occurrences[] populated for 7-month window
    ↓
UI displays occurrences
```

### Window Calculation

- **7-month window**: 3 months before + current + 3 months after
- Window shifts when user navigates beyond current range
- Old window data automatically cleaned up

### Forever Events

- Events with no `UNTIL` or `COUNT` in RRULE
- Marked with `isForever: true`
- Handled without infinite generation
- Visual indicator: ∞ symbol

---

## Task/Memo System Flow

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
Remote Function (command) → Database
        ↓
tasks.update([...tasks, newMemo])
        ↓
Toast notification
```

### Task Types

- **期限付き** (Deadline): Has deadline, need increases as deadline approaches
- **バックログ** (Backlog): No deadline, need based on neglect time
- **ルーティン** (Routine): Recurring goal, need based on progress vs goal

### Memo Structure

```typescript
interface Memo {
  id: string;
  title: string;
  type: "期限付き" | "バックログ" | "ルーティン";
  createdAt: Date;
  deadline?: Date;
  recurrenceGoal?: RecurrenceGoal;
  locationPreference: LocationPreference;
  status: MemoStatus;
  genre?: string; // LLM-filled
  importance?: ImportanceLevel; // LLM-filled
  sessionDuration?: number; // LLM-suggested
  totalDurationExpected?: number; // LLM-suggested
}
```

---

## Suggestion System Flow

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
  │      Fill genre, importance, durations via Gemini API
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

### Suggestion States

- **Pending**: Generated suggestions not yet accepted (shown with Accept/Skip UI)
- **Accepted**: User-accepted suggestions that act as fixed events in gap calculation
- **Skipped**: User-skipped suggestions
- **Dropped**: Suggestions that couldn't fit in available gaps

---

## Gap Detection Flow

```
Calendar events loaded
    ↓
gaps.svelte.ts: events updated
    ↓
$derived gaps = calculateGaps(events, dayBoundaries)
    ↓
enrichGapsWithLocation(gaps, events)
    ↓
enrichedGaps (with location labels)
    ↓
Used by suggestion scheduler
```

### Gap Calculation

- Finds free time slots between events
- Respects day boundaries
- Filters out gaps too small for tasks
- Enriches with location labels based on surrounding events

---

## Import/Export Flow

### Import (.ics file)

```
User selects .ics file
    ↓
calendarState.importICS(file)
    ↓
Remote Function: importIcs(file)
    ↓
ical-service.parseICS(file)
    ↓
parsedEventToDbCreate() for each event
    ↓
Database (with duplicate detection)
    ↓
calendarState.fetchEvents() (refresh)
```

### Export (.ics file)

```
User clicks "Export Calendar"
    ↓
calendarState.getExportUrl(...)
    ↓
Remote Function: exportICS(window, name)
    ↓
dbEventsToParsedEvents()
    ↓
ical-service.generateICS(parsedEvents)
    ↓
Download .ics file
```

---

## Authentication Flow

### Better Auth Integration

- **Server**: `src/lib/auth.ts` - Better Auth configuration
- **Client**: `src/lib/auth-client.ts` - Client-side auth API
- **Hook**: `src/hooks.server.ts` - Session validation
- **Routes**: `/api/auth/*` - Auth endpoints

### Flow

```
User signs in/up
    ↓
better-auth handles authentication
    ↓
Session stored in HTTP-only cookie
    ↓
hooks.server.ts validates session
    ↓
event.locals.user populated
    ↓
Remote Functions access via getRequestEvent()
```

---

## Store Dependencies

```
dataState (bootstrap)
    ↓ selectedDate
calendarState (calendar)
    ↓ events, occurrences
gaps.svelte.ts (assistant)
    ↓ gaps, enrichedGaps
schedule.ts (assistant)
    ↓ scheduleResult
    ↓
tasks (tasks)
                                               ↓
scheduleActions.regenerate()
```

---

## File References

| Purpose           | File                                                              |
| ----------------- | ----------------------------------------------------------------- |
| **Bootstrap**     |                                                                   |
| Core data         | `bootstrap/data.svelte.ts`                                        |
| UI state          | `bootstrap/ui.svelte.ts`                                          |
| Toast             | `bootstrap/toast.svelte.ts`                                       |
| Compatibility     | `bootstrap/compat.svelte.ts`                                      |
| **Calendar**      |                                                                   |
| Calendar state    | `features/calendar/state/calendar.svelte.ts`                      |
| Event form        | `features/calendar/state/eventForm.svelte.ts`                     |
| Event actions     | `features/calendar/state/eventActions.ts`                         |
| Remote functions  | `features/calendar/state/calendar.functions.remote.ts`            |
| Event converter   | `features/calendar/services/event-converter.ts`                   |
| iCal service      | `features/calendar/services/ical-service.ts`                      |
| **Tasks**         |                                                                   |
| Task actions      | `features/tasks/state/taskActions.ts`                             |
| Task form         | `features/tasks/state/taskForm.ts`                                |
| Remote functions  | `features/tasks/state/memo.functions.remote.ts`                   |
| **Assistant**     |                                                                   |
| Gaps              | `features/assistant/state/gaps.svelte.ts`                         |
| Schedule          | `features/assistant/state/schedule.ts`                            |
| Suggestion engine | `features/assistant/services/suggestions/suggestion-engine.ts`    |
| Scoring           | `features/assistant/services/suggestions/suggestion-scoring.ts`   |
| Scheduler         | `features/assistant/services/suggestions/suggestion-scheduler.ts` |
| LLM enrichment    | `features/assistant/services/suggestions/llm-enrichment.ts`       |
| **Memo**          |                                                                   |
| Memo form         | `features/memo/state/memoForm.svelte.ts`                          |
| Memo actions      | `features/memo/state/memoActions.ts`                              |
| **Utilities**     |                                                                   |
| Transit app       | `features/transit/components/TransitView.svelte`                  |
| Progress memo     | `features/progress-memo/components/ProgressMemoView.svelte`       |
| Settings          | `features/utilities/components/SettingsPopup.svelte`              |

---

## Flow Summary

```
User Action
    ↓
Component Event Handler
    ↓
Action Function (eventActions, taskActions, scheduleActions)
    ↓
State Class Method (calendarState, taskActions, scheduleActions)
    ↓
Remote Function (if database operation)
    ↓
Database (Prisma + MongoDB)
    ↓
State Updated ($state reactive)
    ↓
UI Reactively Updates ($derived, $effect)
```

### Example: Creating an Event

```
User fills EventForm
    ↓
eventFormState.updateField()
    ↓
User clicks "Save"
    ↓
eventActions.create()
    ↓
eventFormState.validate()
    ↓
calendarState.createEvent()
    ↓
Remote Function: createEvent (command)
    ↓
Database: CalendarEvent created
    ↓
calendarState.events updated
    ↓
calendarState.expandRecurringEvents() (if recurring)
    ↓
occurrences updated
    ↓
Calendar UI reactively updates
```

---

## Possible Improvements

### 1. State Management

- **Migrate remaining writable stores to Svelte 5 runes**
  - `schedule.ts` still uses `writable` stores
  - `taskActions.ts` still uses `writable` stores
  - Consider migrating to reactive classes for consistency

- **Consolidate state access patterns**
  - Some features use direct state class access
  - Others use compatibility layer exports
  - Standardize on one pattern or document when to use each

- **Add state persistence**
  - Consider localStorage for UI preferences (viewMode, selectedDate)
  - Implement optimistic updates for better UX

### 2. Remote Functions

- **Add request caching**
  - Cache query results for date ranges
  - Invalidate cache on mutations
  - Reduce redundant database queries

- **Add request batching**
  - Batch multiple queries into single request
  - Reduce network round-trips

- **Add error retry logic**
  - Automatic retry for transient failures
  - Exponential backoff

- **Add request deduplication**
  - Prevent duplicate requests for same data
  - Useful for rapid navigation

### 3. Event System

- **Optimize recurrence expansion**
  - Cache expanded occurrences
  - Only re-expand when master event changes
  - Lazy-load occurrences outside visible window

- **Add event conflict detection**
  - Detect overlapping events
  - Warn user on creation
  - Visual indicators in UI

- **Improve timezone handling**
  - Store user's timezone preference
  - Display events in user's timezone
  - Handle DST transitions correctly

- **Add event search/filtering**
  - Search by title, description, location
  - Filter by type, importance, date range
  - Tag system for categorization

### 4. Suggestion System

- **Add suggestion history**
  - Track which suggestions were accepted/rejected
  - Learn user preferences over time
  - Improve suggestion quality

- **Add real-time schedule updates**
  - Update schedule when events change
  - Recalculate gaps automatically
  - Notify user of conflicts

- **Improve LLM enrichment**
  - Cache enrichment results
  - Batch enrichment requests
  - Fallback to rule-based when LLM unavailable

- **Add suggestion explanations**
  - Explain why suggestion was made
  - Show scoring breakdown
  - Help user understand system

### 5. Performance

- **Add virtual scrolling**
  - For long event lists
  - For calendar grid with many events
  - Reduce DOM nodes

- **Optimize reactivity**
  - Review `$derived` dependencies
  - Minimize unnecessary recalculations
  - Use `$derived.by()` for complex computations

- **Add code splitting**
  - Lazy-load feature modules
  - Reduce initial bundle size
  - Improve load time

- **Add service worker**
  - Offline support
  - Background sync
  - Push notifications

### 6. Data Flow

- **Add optimistic updates**
  - Update UI immediately on user action
  - Rollback on error
  - Better perceived performance

- **Add undo/redo**
  - Track state changes
  - Allow user to undo actions
  - Useful for accidental deletions

- **Add data synchronization**
  - Sync across multiple devices
  - Conflict resolution
  - Offline-first architecture

### 7. Developer Experience

- **Add state debugging tools**
  - DevTools integration
  - State inspection
  - Time-travel debugging

- **Add comprehensive logging**
  - Log all state changes
  - Log API calls
  - Log user actions
  - Helpful for debugging

- **Add type safety improvements**
  - Stricter types for Remote Functions
  - Better error types
  - Runtime validation

- **Add testing infrastructure**
  - Unit tests for state classes
  - Integration tests for flows
  - E2E tests for critical paths

### 8. User Experience

- **Add keyboard shortcuts**
  - Quick navigation
  - Quick actions
  - Power user features

- **Add drag-and-drop**
  - Drag events to reschedule
  - Drag tasks to calendar
  - Intuitive interactions

- **Add bulk operations**
  - Select multiple events
  - Bulk delete/edit
  - Bulk import/export

- **Add event templates**
  - Save common event patterns
  - Quick creation
  - Reduce repetitive input

### 9. Architecture

- **Consider event sourcing**
  - Store all state changes as events
  - Replay events to reconstruct state
  - Better audit trail

- **Consider CQRS pattern**
  - Separate read/write models
  - Optimize each independently
  - Better scalability

- **Add feature flags**
  - Gradual feature rollout
  - A/B testing
  - Easy feature toggling

- **Add monitoring/analytics**
  - Track performance metrics
  - Track user behavior
  - Identify bottlenecks
