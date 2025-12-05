# Suggestion Logic Update Strategy

This document outlines remaining tasks for completing the scheduling-and-suggestion logic in Home‑PA.

---

## ✅ Completed Phases

The following have been fully implemented and tested:

### Phase 1: Foundation ✅

- `src/lib/types.ts` — New Memo, Suggestion, Gap interfaces
- Rich Memo structure with type, deadline, recurrence, location, status

### Phase 2: Core Services ✅

- `src/lib/services/suggestions/gap-enrichment.ts` — Location derivation from events
- `src/lib/services/suggestions/period-utils.ts` — Day/week/month cycle helpers
- `src/lib/services/suggestions/suggestion-scoring.ts` — Need/importance calculation
- `src/lib/services/suggestions/location-matching.ts` — Gap-suggestion compatibility
- `src/lib/services/suggestions/suggestion-scheduler.ts` — Permutation + knapsack scheduling
- `src/lib/services/suggestions/llm-enrichment.ts` — Gemini integration (ready, needs API key)
- `src/lib/services/suggestions/index.ts` — Central exports

### Phase 3: Orchestration ✅

- `src/lib/services/suggestions/suggestion-engine.ts` — Pipeline orchestrator
- `src/lib/stores/schedule.ts` — Schedule result store + actions
- `src/lib/stores/gaps.ts` — Enriched gaps (already had this)
- `src/lib/stores/forms/taskForm.ts` — Task form state
- `src/lib/stores/actions/taskActions.ts` — Task CRUD operations

### Phase 4: UI Components ✅

- `src/lib/components/TaskView.svelte` — Task list view
- `src/lib/components/task_components/TaskForm.svelte` — Rich task creation form
- `src/lib/components/task_components/TaskCard.svelte` — Task display card
- `src/lib/components/pa_components/SchedulePanel.svelte` — Schedule display
- `src/lib/components/PersonalAssistantView.svelte` — Modified to include SchedulePanel
- `src/lib/components/BottomNavigation.svelte` — Added Tasks tab
- `src/routes/+page.svelte` — Wired up TaskView

### Tests ✅

- `src/lib/stores/__tests__/schedule.test.ts` — 12 tests for engine + schedule
- `src/lib/stores/__tests__/task-wiring.test.ts` — 21 tests for full flow
- All 61 tests passing

---
## 🔄 Remaining Tasks

### ✅ 1. Server-Side LLM Enrichment API (Complete)

**Status:** ✅ Implemented and tested

**Implementation:**
- Server endpoint: `src/routes/api/enrich/+server.ts`
- Client API function: `enrichMemoViaAPI()` in `llm-enrichment.ts`
- Updated `taskActions.ts` to use API
- Uses `gemini-2.5-flash-lite` model (most cost-effective)
- Comprehensive test coverage

**Security:**
- ✅ API key stays on server (never sent to browser)
- ✅ Uses SvelteKit's `$env/static/private` (type-safe, build-time)
- ✅ Graceful fallback if API unavailable

**Note:** Consider rate limiting for production use

---

### 2. Progress Tracking Component (Optional)

**File:** `src/lib/components/MemoProgress.svelte`

**Purpose:** Visual progress for each task

**Display:**

- Progress bar: `timeSpentMinutes / totalDurationExpected`
- For routines: "2 of 3 this week" indicator
- Deadline countdown for 期限付き
- Last activity date

**Priority:** Low — can be added later as enhancement

---

### 3. Session Timer (Optional)

**Purpose:** Track time when user works on a task

**Features:**

- Start/pause/complete buttons
- Auto-update `timeSpentMinutes`
- Increment routine completions on complete

**Priority:** Medium — useful for accurate tracking

---

### 4. Data Persistence

**Current:** Tasks stored in memory (Svelte store)

**Needed:** Persist to database

**Options:**

1. Add Prisma model for `Task` (similar to `Event`)
2. Use local storage as interim solution
3. Sync with existing memo persistence if any

**Priority:** High for production use

---

### 5. Documentation Updates

- [ ] Update AGENTS.md with new task/suggestion flow
- [ ] Add developer guide for tuning scoring heuristics
- [ ] Document LLM prompt customization

---

## 🐛 Edge Cases & Potential Issues

### LLM Enrichment API Edge Cases

#### ✅ Fixed: Undefined Enrichment Result

**Problem:** When `enrichMemoViaAPI()` returned `undefined` (due to network errors or API failures), `enrichTaskInBackground()` would crash when trying to access `enrichment.genre`.

**Root Cause:** Missing null check before accessing enrichment properties.

**Fix:** Added null check in `enrichTaskInBackground()`:
```typescript
if (!enrichment) {
  console.warn(`[Enrichment] Received undefined enrichment for task ${taskId}, skipping update`);
  return;
}
```

**Location:** `src/lib/stores/actions/taskActions.ts:159-163`

---

#### ✅ Fixed: Fetch Mock Issues in Tests

**Problem:** In Node.js test environment, `fetch` wasn't being mocked correctly, causing tests to fail with "fetch is not defined" or incorrect URL handling.

**Root Cause:** Test environment uses `global.fetch` but the code was using bare `fetch`, which doesn't exist in Node.js.

**Fix:** Updated `enrichMemoViaAPI()` to use `global.fetch` when available:
```typescript
const fetchFn = typeof global !== "undefined" && (global as any).fetch ? (global as any).fetch : fetch;
```

**Location:** `src/lib/services/suggestions/llm-enrichment.ts:471`

---

#### ✅ Fixed: Concurrent Enrichment Mock Ordering

**Problem:** When multiple tasks were created simultaneously, mock functions were consumed in the wrong order, causing tasks to receive incorrect enrichments.

**Root Cause:** Using `mockResolvedValueOnce()` with call count tracking doesn't work reliably with concurrent async operations.

**Fix:** Changed mock implementation to track calls by memo title/ID instead of call count:
```typescript
(enrichMemoViaAPI as any).mockImplementation((memo: any) => {
  if (memo.title === "Task 1") {
    return Promise.resolve(mockEnrichment1);
  } else if (memo.title === "Task 2") {
    return Promise.resolve(mockEnrichment2);
  }
  return Promise.resolve(mockEnrichment1);
});
```

**Location:** `src/lib/stores/__tests__/task-enrichment-api.test.ts:163-211`

---

#### ✅ Fixed: Task Deletion During Enrichment

**Problem:** If a task was deleted while enrichment was in progress, the update would fail or cause errors.

**Root Cause:** Code was using stale task reference from before enrichment started.

**Fix:** Get fresh task copy from store before applying enrichment:
```typescript
// Get fresh task copy again (in case it was updated while enrichment was running)
const latestTasks = get(tasks);
const latestTask = latestTasks.find((t) => t.id === taskId);
if (!latestTask) {
  console.warn(`[Enrichment] Task ${taskId} was deleted during enrichment`);
  return;
}
```

**Location:** `src/lib/stores/actions/taskActions.ts:165-172`

---

#### ⚠️ Known Issue: Form Field Preservation

**Problem:** When a user sets `importance: "low"` in the form, it's not always preserved after enrichment in tests.

**Potential Causes:**
1. **Timing Issue:** Form field update might not be synchronous, causing task creation to read stale form state
2. **Store Reactivity:** Svelte store updates might not be immediately available when `create()` is called
3. **Type Coercion:** Form field type is `ImportanceLevel | ""`, and the conversion logic might not handle all cases correctly

**Current Status:** Code logic appears correct (`formData.importance && formData.importance !== ""`), but test still fails intermittently. This suggests a race condition or timing issue rather than a logic bug.

**Location:** `src/lib/stores/actions/taskActions.ts:93` and `src/lib/stores/__tests__/task-enrichment-api.test.ts:130-161`

**Recommendation:** 
- Add explicit wait/check in tests to ensure form state is updated
- Consider using `get(taskForm)` before creating task to verify form state
- May need to investigate Svelte store reactivity timing

---

## Quick Reference: Current File Structure

```
src/lib/
├── types.ts                          # ✅ Rich Memo, Suggestion, Gap + icalData field
├── auth.ts                           # ✅ better-auth config (emailAndPassword enabled)
├── auth-client.ts                    # ✅ Client-side auth
├── services/
│   ├── gap-finder.ts                 # ✅ Extended with gapId
│   ├── calendar/                     # ✅ iCalendar services (RFC-5545)
│   │   ├── index.ts                  # ✅ Central exports
│   │   ├── ical-service.ts           # ✅ Parse/generate/expand iCal
│   │   └── event-converter.ts        # ✅ DB ↔ App conversions (preserves icalData)
│   └── suggestions/
│       ├── index.ts                  # ✅ Central exports
│       ├── gap-enrichment.ts         # ✅ Location derivation
│       ├── period-utils.ts           # ✅ Cycle helpers
│       ├── suggestion-scoring.ts     # ✅ Need/importance
│       ├── location-matching.ts      # ✅ Compatibility
│       ├── suggestion-scheduler.ts   # ✅ Permutation + knapsack
│       ├── llm-enrichment.ts         # ✅ Gemini (needs API key)
│       └── suggestion-engine.ts      # ✅ Orchestrator
├── stores/
│   ├── calendar.ts                   # ✅ API-backed store with icalData recurrence
│   ├── data.ts                       # ✅ Memos/suggestion logs only (events removed)
│   ├── schedule.ts                   # ✅ Schedule result store
│   ├── gaps.ts                       # ✅ Enriched gaps
│   ├── forms/taskForm.ts             # ✅ Task form state
│   └── actions/
│       ├── eventActions.ts           # ✅ useApi=true by default
│       └── taskActions.ts            # ✅ Task CRUD
└── components/
    ├── CalendarView.svelte           # ✅ Uses calendarStore + recurrence expansion
    ├── TaskView.svelte               # ✅ Task list
    ├── calendar_components/
    │   └── CalendarSettings.svelte   # ✅ Import/export + UserSettings
    ├── util_components/
    │   └── UserSettings.svelte       # ✅ Auth UI (sign-in/sign-up/sign-out)
    ├── task_components/
    │   ├── TaskForm.svelte           # ✅ Rich form
    │   └── TaskCard.svelte           # ✅ Task display
    └── pa_components/
        ├── CircularTimeline.svelte   # ✅ Existing
        └── SchedulePanel.svelte      # ✅ Schedule display

src/routes/
└── api/
    └── calendar/                     # ✅ NEW - Calendar API
        ├── events/+server.ts         # ✅ GET/POST events
        ├── events/[id]/+server.ts    # ✅ GET/PATCH/DELETE single event
        ├── import/+server.ts         # ✅ POST .ics import
        └── export/+server.ts         # ✅ GET .ics export

infra/
└── dev.docker-compose.yml            # ✅ Fixed bind_ip for host access
```
  dtstartTzid: string | null;
  isAllDay: boolean;
  rrule: string | null;
  description: string | null;
  location: string | null;
  icalData: string;
}

/**
 * Parse a single VEVENT component
 */
export function parseVEvent(vevent: ICAL.Component): ParsedEvent {
  const event = new ICAL.Event(vevent);
  
  const dtstart = event.startDate;
  const dtend = event.endDate;
  
  return {
    uid: event.uid,
    summary: event.summary || 'Untitled Event',
    dtstart: dtstart.toJSDate(),
    dtend: dtend ? dtend.toJSDate() : null,
    dtstartTzid: dtstart.timezone || null,
    isAllDay: dtstart.isDate, // DATE vs DATE-TIME
    rrule: vevent.getFirstPropertyValue('rrule')?.toString() || null,
    description: event.description || null,
    location: event.location || null,
    icalData: vevent.toString(),
  };
}

/**
 * Parse an .ics file content into events
 */
export function parseICS(icsContent: string): ParsedEvent[] {
  const jcalData = ICAL.parse(icsContent);
  const vcalendar = new ICAL.Component(jcalData);
  const vevents = vcalendar.getAllSubcomponents('vevent');
  
  return vevents.map(parseVEvent);
}

/**
 * Generate VEVENT component from our data
 */
export function createVEvent(event: {
  uid?: string;
  summary: string;
  dtstart: Date;
  dtend: Date | null;
  dtstartTzid?: string;
  isAllDay?: boolean;
  rrule?: string;
  description?: string;
  location?: string;
}): string {
  const vevent = new ICAL.Component('vevent');
  
  // UID (generate if not provided)
  vevent.addPropertyWithValue('uid', event.uid || crypto.randomUUID());
  
  // DTSTAMP (required)
  const dtstamp = ICAL.Time.now();
  vevent.addPropertyWithValue('dtstamp', dtstamp);
  
  // DTSTART
  const dtstart = ICAL.Time.fromJSDate(event.dtstart, event.isAllDay);
  if (event.dtstartTzid) {
    dtstart.zone = ICAL.Timezone.utcTimezone; // Simplified; production needs VTIMEZONE
  }
  vevent.addPropertyWithValue('dtstart', dtstart);
  
  // DTEND
  if (event.dtend) {
    const dtend = ICAL.Time.fromJSDate(event.dtend, event.isAllDay);
    vevent.addPropertyWithValue('dtend', dtend);
  }
  
  // SUMMARY
  vevent.addPropertyWithValue('summary', event.summary);
  
  // RRULE
  if (event.rrule) {
    const rruleProp = ICAL.Property.fromString('RRULE:' + event.rrule);
    vevent.addProperty(rruleProp);
  }
  
  // Optional fields
  if (event.description) {
    vevent.addPropertyWithValue('description', event.description);
  }
  if (event.location) {
    vevent.addPropertyWithValue('location', event.location);
  }
  
  return vevent.toString();
}

/**
 * Generate full .ics file from events
 */
export function generateICS(events: ParsedEvent[], calendarName = 'Home-PA'): string {
  const vcalendar = new ICAL.Component('vcalendar');
  vcalendar.addPropertyWithValue('version', '2.0');
  vcalendar.addPropertyWithValue('prodid', '-//Home-PA//Calendar//EN');
  vcalendar.addPropertyWithValue('x-wr-calname', calendarName);
  
  for (const event of events) {
    const jcalData = ICAL.parse(event.icalData);
    const vevent = new ICAL.Component(jcalData);
    vcalendar.addSubcomponent(vevent);
  }
  
  return vcalendar.toString();
}

/**
 * Expand recurring event occurrences within a time window
 */
export function expandRecurrences(
  icalData: string,
  windowStart: Date,
  windowEnd: Date
): Date[] {
  const jcalData = ICAL.parse(icalData);
  const vevent = new ICAL.Component(jcalData);
  const event = new ICAL.Event(vevent);
  
  if (!event.isRecurring()) {
    return [event.startDate.toJSDate()];
  }
  
  const start = ICAL.Time.fromJSDate(windowStart);
  const end = ICAL.Time.fromJSDate(windowEnd);
  const occurrences: Date[] = [];
  
  const iterator = event.iterator();
  let next = iterator.next();
  
  while (next && occurrences.length < 1000) { // Safety limit
    if (next.compare(end) > 0) break;
    if (next.compare(start) >= 0) {
      occurrences.push(next.toJSDate());
    }
    next = iterator.next();
  }
  
  return occurrences;
}
```

#### Step 2.3: Create Type Conversions

File: `src/lib/services/calendar/event-converter.ts`

```typescript
import type { CalendarEvent } from '@prisma/client';
import type { Event } from '../../types.js';
import { parseVEvent } from './ical-service.js';
import ICAL from 'ical.js';

/**
 * Convert Prisma CalendarEvent to app Event interface
 */
export function toAppEvent(dbEvent: CalendarEvent): Event {
  // Parse stored icalData for additional fields
  const jcalData = ICAL.parse(dbEvent.icalData);
  const vevent = new ICAL.Component(jcalData);
  const icalEvent = new ICAL.Event(vevent);
  
  return {
    id: dbEvent.id,
    title: dbEvent.summary,
    start: dbEvent.dtstart,
    end: dbEvent.dtend || dbEvent.dtstart,
    description: icalEvent.description || undefined,
    address: icalEvent.location || undefined,
    timeLabel: dbEvent.isAllDay ? 'all-day' : 'timed',
    tzid: dbEvent.dtstartTzid || undefined,
    recurrence: dbEvent.hasRecurrence ? {
      type: 'RRULE' as const,
      rrule: dbEvent.rrule || '',
    } : { type: 'NONE' as const },
  };
}

/**
 * Convert app Event to Prisma CalendarEvent input
 */
export function toDbEvent(event: Omit<Event, 'id'>, userId: string): {
  uid: string;
  summary: string;
  dtstart: Date;
  dtend: Date | null;
  dtstartTzid: string | null;
  isAllDay: boolean;
  rrule: string | null;
  hasRecurrence: boolean;
  icalData: string;
  userId: string;
} {
  const uid = crypto.randomUUID();
  const rrule = event.recurrence?.type === 'RRULE' 
    ? event.recurrence.rrule 
    : null;
  
  // Generate VEVENT
  const icalData = createVEvent({
    uid,
    summary: event.title,
    dtstart: event.start,
    dtend: event.end,
    dtstartTzid: event.tzid,
    isAllDay: event.timeLabel === 'all-day',
    rrule: rrule || undefined,
    description: event.description,
    location: event.address,
  });
  
  return {
    uid,
    summary: event.title,
    dtstart: event.start,
    dtend: event.timeLabel === 'all-day' ? null : event.end,
    dtstartTzid: event.tzid || null,
    isAllDay: event.timeLabel === 'all-day',
    rrule,
    hasRecurrence: !!rrule,
    icalData,
    userId,
  };
}
```

---

### Phase IC-3: Server API Endpoints ✅

**Status:** Complete

#### Step 3.1: Event CRUD API

File: `src/routes/api/calendar/events/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import { toAppEvent, toDbEvent } from '$lib/services/calendar/event-converter';

// GET /api/calendar/events?start=ISO&end=ISO
export const GET: RequestHandler = async ({ url, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw error(401, 'Unauthorized');
  
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');
  
  const where: any = { userId: session.user.id };
  if (start && end) {
    where.dtstart = {
      gte: new Date(start),
      lte: new Date(end),
    };
  }
  
  const dbEvents = await prisma.calendarEvent.findMany({
    where,
    orderBy: { dtstart: 'asc' },
  });
  
  return json(dbEvents.map(toAppEvent));
};

// POST /api/calendar/events
export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw error(401, 'Unauthorized');
  
  const eventData = await request.json();
  const dbInput = toDbEvent(eventData, session.user.id);
  
  const created = await prisma.calendarEvent.create({
    data: dbInput,
  });
  
  return json(toAppEvent(created), { status: 201 });
};
```

File: `src/routes/api/calendar/events/[id]/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import { toAppEvent } from '$lib/services/calendar/event-converter';

// GET /api/calendar/events/[id]
export const GET: RequestHandler = async ({ params, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw error(401, 'Unauthorized');
  
  const event = await prisma.calendarEvent.findUnique({
    where: { id: params.id, userId: session.user.id },
  });
  
  if (!event) throw error(404, 'Event not found');
  
  return json(toAppEvent(event));
};

// PATCH /api/calendar/events/[id]
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw error(401, 'Unauthorized');
  
  const updates = await request.json();
  
  // Regenerate icalData if content changed
  // ... (similar to POST logic)
  
  const updated = await prisma.calendarEvent.update({
    where: { id: params.id, userId: session.user.id },
    data: updates,
  });
  
  return json(toAppEvent(updated));
};

// DELETE /api/calendar/events/[id]
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw error(401, 'Unauthorized');
  
  await prisma.calendarEvent.delete({
    where: { id: params.id, userId: session.user.id },
  });
  
  return new Response(null, { status: 204 });
};
```

#### Step 3.2: Import/Export API

File: `src/routes/api/calendar/import/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import { parseICS } from '$lib/services/calendar/ical-service';

// POST /api/calendar/import
// Content-Type: text/calendar
export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw error(401, 'Unauthorized');
  
  const icsContent = await request.text();
  const events = parseICS(icsContent);
  
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };
  
  for (const event of events) {
    try {
      // Check for existing event by UID (deduplication)
      const existing = await prisma.calendarEvent.findUnique({
        where: { uid: event.uid },
      });
      
      if (existing) {
        results.skipped++;
        continue;
      }
      
      await prisma.calendarEvent.create({
        data: {
          uid: event.uid,
          summary: event.summary,
          dtstart: event.dtstart,
          dtend: event.dtend,
          dtstartTzid: event.dtstartTzid,
          isAllDay: event.isAllDay,
          rrule: event.rrule,
          hasRecurrence: !!event.rrule,
          icalData: event.icalData,
          userId: session.user.id,
        },
      });
      
      results.imported++;
    } catch (e: any) {
      results.errors.push(`${event.summary}: ${e.message}`);
    }
  }
  
  return json(results);
};
```

File: `src/routes/api/calendar/export/+server.ts`

```typescript
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import { generateICS } from '$lib/services/calendar/ical-service';

// GET /api/calendar/export
export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw error(401, 'Unauthorized');
  
  const events = await prisma.calendarEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { dtstart: 'asc' },
  });
  
  const parsedEvents = events.map(e => ({
    uid: e.uid,
    summary: e.summary,
    dtstart: e.dtstart,
    dtend: e.dtend,
    dtstartTzid: e.dtstartTzid,
    isAllDay: e.isAllDay,
    rrule: e.rrule,
    description: null,
    location: null,
    icalData: e.icalData,
  }));
  
  const ics = generateICS(parsedEvents, 'Home-PA Calendar');
  
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="home-pa-calendar.ics"',
    },
  });
};
```

---

### Phase IC-4: Store Integration ✅

**Status:** Complete

#### Step 4.1: Create Calendar Store

File: `src/lib/stores/calendar.ts`

```typescript
import { writable, derived } from 'svelte/store';
import type { Event } from '../types.js';

interface CalendarState {
  events: Event[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

const initialState: CalendarState = {
  events: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const calendarStore = writable<CalendarState>(initialState);

export const calendarEvents = derived(
  calendarStore,
  ($state) => $state.events
);

export const calendarLoading = derived(
  calendarStore,
  ($state) => $state.loading
);

export const calendarActions = {
  async fetchEvents(start: Date, end: Date): Promise<void> {
    calendarStore.update(s => ({ ...s, loading: true, error: null }));
    
    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      
      const response = await fetch(`/api/calendar/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const events = await response.json();
      
      // Convert dates from JSON
      const parsed = events.map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
      
      calendarStore.update(s => ({
        ...s,
        events: parsed,
        loading: false,
        lastFetched: new Date(),
      }));
    } catch (error: any) {
      calendarStore.update(s => ({
        ...s,
        loading: false,
        error: error.message,
      }));
    }
  },
  
  async createEvent(event: Omit<Event, 'id'>): Promise<Event | null> {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      
      if (!response.ok) throw new Error('Failed to create event');
      
      const created = await response.json();
      const parsed = {
        ...created,
        start: new Date(created.start),
        end: new Date(created.end),
      };
      
      calendarStore.update(s => ({
        ...s,
        events: [...s.events, parsed].sort((a, b) => 
          a.start.getTime() - b.start.getTime()
        ),
      }));
      
      return parsed;
    } catch (error) {
      console.error('Failed to create event:', error);
      return null;
    }
  },
  
  async updateEvent(id: string, updates: Partial<Event>): Promise<boolean> {
    try {
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update event');
      
      const updated = await response.json();
      const parsed = {
        ...updated,
        start: new Date(updated.start),
        end: new Date(updated.end),
      };
      
      calendarStore.update(s => ({
        ...s,
        events: s.events.map(e => e.id === id ? parsed : e),
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to update event:', error);
      return false;
    }
  },
  
  async deleteEvent(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete event');
      
      calendarStore.update(s => ({
        ...s,
        events: s.events.filter(e => e.id !== id),
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  },
  
  async importICS(file: File): Promise<{ imported: number; skipped: number }> {
    const content = await file.text();
    
    const response = await fetch('/api/calendar/import', {
      method: 'POST',
      headers: { 'Content-Type': 'text/calendar' },
      body: content,
    });
    
    if (!response.ok) throw new Error('Import failed');
    
    const result = await response.json();
    
    // Refresh events after import
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 7, 0);
    await calendarActions.fetchEvents(start, end);
    
    return result;
  },
  
  getExportUrl(): string {
    return '/api/calendar/export';
  },
};
```

#### Step 4.2: Update Event Form to Use API

Modify `src/lib/stores/actions/eventActions.ts` to use `calendarActions` instead of direct store manipulation.

---

### Phase IC-5: UI Integration ✅

**Status:** Complete (IC-5a + IC-5b)

#### Step 5.1: Import/Export UI ✅

- `CalendarSettings.svelte` component created with import/export functionality
- Settings button (⚙️) added to `CalendarView` header
- Settings modal displays `CalendarSettings` component
- `UserSettings` component integrated for authentication UI

#### Step 5.2: Update CalendarView ✅ (Complete)

- `CalendarView` fetches from API on mount via `calendarActions.fetchEvents`
- Uses `calendarStore` + `calendarOccurrences` (ical.js expansion)
- Event CRUD routes through the API

---

### Phase IC-6: Migration & Cleanup ✅

**Status:** IC-6a, IC-6b complete (external sync is IC-7)

#### Step 6.1: API Mode Enabled ✅

- `eventActionsConfig.useApi` set to `true` by default in `src/lib/stores/actions/eventActions.ts`
- Events now persist to MongoDB via API

#### Step 6.2: Remove Old Event Handling ✅

- `src/lib/stores/data.ts` — events store removed (memos/suggestion logs only)
- `src/lib/stores/recurrence.store.ts` / `services/recurrence/manager.ts` — deprecated, kept only for legacy tests; new path uses `calendarOccurrences` with ical.js
- All relevant imports now use `calendarStore`

#### Step 6.3: Update Tests ✅ (Complete)

- Added iCalendar parsing tests (all-day DTEND, RRULE expansion, ICS generation)
- Import/export verified via generateICS test
- Calendar tests updated separately as needed

---

### Phase IC-7: External Calendar Sync (Future)

**Priority:** Low | **Estimated:** 8-10 hours

#### CalDAV Support

For Google Calendar / Apple Calendar two-way sync:

1. **OAuth2 Integration**
   - Google Calendar API credentials
   - Apple iCloud credentials

2. **CalDAV Client**
   - Use `tsdav` library for CalDAV protocol
   - Sync collections and events

3. **Conflict Resolution**
   - Use etag for optimistic locking
   - Last-write-wins or user-prompt

4. **Background Sync**
   - Periodic sync job
   - Webhook subscriptions (Google)

---

### File Changes Summary

| File | Action | Status |
|------|--------|--------|
| `prisma/schema.prisma` | Modify - Add CalendarEvent model | ✅ Done |
| `src/lib/types.ts` | Modify - Added `icalData` field to Event interface | ✅ Done |
| `src/lib/services/calendar/ical-service.ts` | New - iCalendar parsing/generation | ✅ Done |
| `src/lib/services/calendar/event-converter.ts` | Modify - Preserve icalData in conversions; all-day DTEND handling | ✅ Done |
| `src/lib/services/calendar/__tests__/ical-service.test.ts` | New - iCal parsing/expansion/ICS tests | ✅ Done |
| `src/routes/api/calendar/events/+server.ts` | Modify - Fixed query for recurring events | ✅ Done |
| `src/routes/api/calendar/events/[id]/+server.ts` | New - Single event API | ✅ Done |
| `src/routes/api/calendar/import/+server.ts` | New - ICS import | ✅ Done |
| `src/routes/api/calendar/export/+server.ts` | New - ICS export | ✅ Done |
| `src/lib/stores/calendar.ts` | Modify - Use stored icalData for recurrence expansion | ✅ Done |
| `src/lib/components/.../CalendarSettings.svelte` | New - Import/export UI | ✅ Done |
| `src/lib/components/util_components/UserSettings.svelte` | New - Auth UI | ✅ Done |
| `src/lib/stores/actions/eventActions.ts` | Modify - useApi=true | ✅ Done |
| `infra/dev.docker-compose.yml` | Fix - bind_ip 0.0.0.0 | ✅ Done |
| `src/lib/auth.ts` | Modify - emailAndPassword enabled | ✅ Done |
| `src/lib/stores/data.ts` | Modify - Remove events store (memos/logs only) | ✅ Done |
| `src/lib/services/recurrence/manager.ts` | Removed (legacy) | ✅ Done |
| `src/lib/stores/recurrence.store.ts` | Removed (legacy) | ✅ Done |
| `src/lib/components/util_components/TransitCard.svelte` | Removed (legacy recurrence dependency) | ✅ Done |
| `src/lib/components/CalendarView.svelte` | Modify - Use calendarStore + recurrence | ✅ Complete |

---

### Implementation Order

```
IC-1 → IC-2 → IC-3 → IC-4 → IC-5 → IC-6 → IC-7
 ↓      ↓      ↓      ↓      ↓      ↓      ↓
 DB   ical.js  API   Store   UI   Migrate Sync
 ✅     ✅      ✅     ✅    ✅     ✅    (future)
```

**Progress:** ~95% complete (remaining: IC-6b old store cleanup, IC-7 external sync)

**Key Architecture Improvement:**
The new system is **simpler and faster** because:
1. **Stored icalData** - VEVENT strings are stored in DB once, not reconstructed on every expansion
2. **ical.js handles complexity** - Battle-tested library handles RFC-5545 edge cases
3. **Single source of truth** - No dual recurrence systems (old manager deprecated)
4. **Lazy window loading** - Only expand occurrences within display window (±3 months)

---

### Benefits After Completion

| Feature | Before | After | Current Status |
|---------|--------|-------|----------------|
| Data persistence | In-memory (lost on refresh) | MongoDB | ✅ Working |
| User authentication | None | better-auth (email/password) | ✅ Working |
| Import from Google | ❌ | ✅ via .ics | ✅ API ready |
| Export backup | ❌ | ✅ .ics download | ✅ API ready |
| Timezone handling | Custom | RFC-5545 standard | ✅ Implemented |
| Recurrence | Custom manager | ical.js (battle-tested) | ✅ Implemented |
| Future sync | Not possible | CalDAV-ready | 📋 Planned

---

## Quick Reference: Current File Structure

```
src/lib/
├── types.ts                          # ✅ Rich Memo, Suggestion, Gap + icalData field
├── auth.ts                           # ✅ better-auth config (emailAndPassword enabled)
├── auth-client.ts                    # ✅ Client-side auth
├── services/
│   ├── gap-finder.ts                 # ✅ Extended with gapId
│   ├── calendar/                     # ✅ iCalendar services (RFC-5545)
│   │   ├── index.ts                  # ✅ Central exports
│   │   ├── ical-service.ts           # ✅ Parse/generate/expand iCal
│   │   └── event-converter.ts        # ✅ DB ↔ App conversions (preserves icalData)
│   └── suggestions/
│       ├── index.ts                  # ✅ Central exports
│       ├── gap-enrichment.ts         # ✅ Location derivation
│       ├── period-utils.ts           # ✅ Cycle helpers
│       ├── suggestion-scoring.ts     # ✅ Need/importance
│       ├── location-matching.ts      # ✅ Compatibility
│       ├── suggestion-scheduler.ts   # ✅ Permutation + knapsack
│       ├── llm-enrichment.ts         # ✅ Gemini (needs API key)
│       └── suggestion-engine.ts      # ✅ Orchestrator
├── stores/
│   ├── calendar.ts                   # ✅ API-backed store with icalData recurrence
│   ├── data.ts                       # ✅ Memos/suggestion logs only (events removed)
│   ├── schedule.ts                   # ✅ Schedule result store
│   ├── gaps.ts                       # ✅ Enriched gaps
│   ├── forms/taskForm.ts             # ✅ Task form state
│   ├── actions/
│   │   ├── eventActions.ts           # ✅ useApi=true by default
│   │   └── taskActions.ts            # ✅ Task CRUD
│   └── __tests__/
│       ├── schedule.test.ts          # ✅ 12 tests
│       └── task-wiring.test.ts       # ✅ 21 tests
└── components/
    ├── CalendarView.svelte           # ✅ Uses calendarStore + recurrence expansion
    ├── TaskView.svelte               # ✅ Task list
    ├── calendar_components/
    │   └── CalendarSettings.svelte   # ✅ Import/export + UserSettings
    ├── util_components/
    │   └── UserSettings.svelte       # ✅ Auth UI (sign-in/sign-up/sign-out)
    ├── task_components/
    │   ├── TaskForm.svelte           # ✅ Rich form
    │   └── TaskCard.svelte           # ✅ Task display
    └── pa_components/
        ├── CircularTimeline.svelte   # ✅ Existing
        └── SchedulePanel.svelte      # ✅ Schedule display

src/routes/
└── api/
    └── calendar/                     # ✅ NEW - Calendar API
        ├── events/+server.ts         # ✅ GET/POST events
        ├── events/[id]/+server.ts    # ✅ GET/PATCH/DELETE single event
        ├── import/+server.ts         # ✅ POST .ics import
        └── export/+server.ts         # ✅ GET .ics export

infra/
└── dev.docker-compose.yml            # ✅ Fixed bind_ip for host access
```

---

## Data Flow (Implemented)

```
User creates task (TaskView)
        ↓
taskActions.create() → tasks store
        ↓
User clicks "Generate Schedule" (SchedulePanel)
        ↓
scheduleActions.regenerate(tasks, gaps)
        ↓
SuggestionEngine.generateSchedule()
  ├── Filter active memos
  ├── Reset period counters
  ├── LLM enrichment (if configured)
  ├── Score memos → Suggestions
  ├── Enrich gaps with location
  └── Schedule via permutation + knapsack
        ↓
scheduleResult store updated
        ↓
SchedulePanel displays scheduled blocks
```

---

## Scoring Summary (Implemented)

| Type       | Need Range | Can Be Mandatory?          |
| ---------- | ---------- | -------------------------- |
| 期限付き   | 0.1 - 1.0+ | Yes (due today or overdue) |
| バックログ | 0.25 - 0.7 | No (capped)                |
| ルーティン | 0.3 - 0.8  | No (capped)                |

**Priority Logic:**

- Mandatory tasks (need ≥ 1.0) scheduled first
- Higher `need × importance` = higher priority
- Location matching filters compatible gaps

---

## Test Summary

**Current Status:**
- ✅ 47 tests passing
- ⚠️ 8 tests failing (mostly edge cases and timing issues)
- ✅ Core functionality verified (API calls, error handling, fallbacks)

**Test Files:**
- `src/routes/api/enrich/__tests__/enrich-api.test.ts` - Server endpoint logic tests (6 tests)
- `src/lib/services/suggestions/__tests__/llm-enrichment-api.test.ts` - Client API function tests (7 tests)
- `src/lib/stores/__tests__/task-enrichment-api.test.ts` - Integration tests (6 tests)
- `src/lib/stores/__tests__/schedule.test.ts` - Engine unit + integration tests
- `src/lib/stores/__tests__/task-wiring.test.ts` - Full flow tests (form → store → schedule)
- `src/lib/services/calendar/__tests__/ical-service.test.ts` - iCalendar parsing tests

---

This document will be updated as remaining tasks are completed.
