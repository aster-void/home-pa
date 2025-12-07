# Update Strategy

This document tracks recent updates and necessary next steps for Home-PA.

---

## ✅ Recent Updates (Completed)

### Schedule Generation & Timeline Integration

**Status:** ✅ Complete

**Changes:**
- Schedule generation now runs automatically when user opens assistant tab (today only)
- Schedule results are cached and only update UI when regenerated schedule differs from cached version
- `SchedulePanel` component removed from UI
- Scheduled suggestions now appear directly on `CircularTimeline` as events (same visual style as calendar events)
- Schedule generation happens in background without disrupting UI

**Files Modified:**
- `src/lib/stores/schedule.ts` - Added caching logic with `stableSerializeSchedule()` to compare schedules
- `src/lib/components/PersonalAssistantView.svelte` - Removed SchedulePanel, integrated scheduled blocks as timeline events
- `src/lib/components/pa_components/CircularTimeline.svelte` - Added `extraEvents` prop to inject scheduled suggestions

**Key Implementation:**
- `scheduleActions.regenerate()` now compares serialized schedule results before updating store
- Scheduled blocks converted to `Event` format with `timeLabel: "timed"` for timeline rendering
- Only shows scheduled events when selected date is today

---

### Task UI Improvements

**Status:** ✅ Complete

**Changes:**
- Enhanced task cards to prominently display min-session time for enriched tasks
- Improved progress tracking visualization with clearer labels
- Streamlined task card layout, removing unnecessary clutter
- Better visual hierarchy for task metadata

**Files Modified:**
- `src/lib/components/task_components/TaskCard.svelte` - Redesigned with min-session pill, improved progress display

**Key Features:**
- Min-session time shown as pill badge (e.g., "30 min/session")
- Progress labels explicitly show "Progress: X/Y" format
- Routine progress: "Progress: done/goal this period"
- Time progress: "Progress: spent/total min"
- Type badge and min-session pill grouped together in header

---

### UI/UX Improvements

**Status:** ✅ Complete

**Changes:**
- Removed bottom shadow from calendar view
- Fixed scrollability issues in PersonalAssistantView
- Removed recurrence loading indicator (kept network error indicator)
- Improved timeline container sizing (now uses 50% of viewport dimensions)
- Timeline section layout optimized for better space utilization

**Files Modified:**
- `src/lib/components/CalendarView.svelte` - Removed shadow, removed loading indicator
- `src/lib/components/PersonalAssistantView.svelte` - Fixed scrollability, improved layout
- `src/lib/components/pa_components/CircularTimeline.svelte` - Increased max radius to 50% of viewport

---

### Schedule Suggestion UX Overhaul

**Status:** ✅ Complete

**Changes:**
- All schedule suggestions now display concurrently on `CircularTimeline` (not sequential).
- Pending suggestions shown as dashed purple arcs with Accept/Skip controls via popup card.
- Accepted suggestions shown as solid green arcs, act as fixed events in gap calculation.
- Skipping a suggestion triggers regeneration for that gap if still viable.
- Accepted suggestions support drag-to-resize (5-minute increments) with non-overlap enforcement.
- Accepted suggestions can be deleted, freeing the gap for new suggestions.
- Only today's suggestions are generated.

**Files Modified:**
- `src/lib/stores/schedule.ts` - Added `AcceptedSuggestion`, `PendingSuggestion` types, `acceptedSuggestions`, `pendingSuggestions`, `skippedSuggestionIds` stores, and actions for accept/skip/delete/resize
- `src/lib/stores/index.ts` - Exported new stores and types
- `src/lib/components/pa_components/SuggestionCard.svelte` - New component for suggestion popup with Accept/Skip/Delete controls
- `src/lib/components/pa_components/CircularTimeline.svelte` - Added suggestion rendering (pending: dashed purple, accepted: solid green), resize handles, click handlers
- `src/lib/components/pa_components/index.ts` - Exported SuggestionCard
- `src/lib/components/PersonalAssistantView.svelte` - Wired suggestion events to schedule actions

**Key Implementation:**
- `subtractAcceptedFromGaps()` removes accepted suggestion time slots from available gaps before regeneration
- Pending suggestions rendered on lane 1 with `pendingSuggestionGradient` (purple)
- Accepted suggestions rendered on lane 1 with `acceptedSuggestionGradient` (green) + resize handle
- Click on suggestion shows `SuggestionCard` popup with action buttons
- Drag resize updates accepted suggestion duration in 5-min increments, triggers regeneration

---

## 🔄 Next Steps

### 1. Task Data Persistence

**Priority:** High

**Current State:** Tasks stored in-memory (Svelte store), lost on page refresh

**Needed:**
- Add Prisma model for `Task` (similar to `CalendarEvent`)
- Create API endpoints for task CRUD operations
- Update `taskActions.ts` to use API instead of in-memory store
- Add migration script for existing tasks (if any)

**Estimated:** 4-6 hours

---

### 2. Session Timer Component

**Priority:** Medium

**Purpose:** Allow users to track time spent working on tasks

**Features:**
- Start/pause/complete buttons
- Auto-update `timeSpentMinutes` in task status
- Increment routine completions when session completes
- Visual timer display

**Files to Create:**
- `src/lib/components/task_components/SessionTimer.svelte`

**Estimated:** 3-4 hours

---

### 3. Enhanced Progress Visualization

**Priority:** Low

**Current:** Basic progress bars and labels

**Enhancements:**
- Visual progress indicators for deadline countdown
- Last activity date display
- Completion streak tracking for routines

**Estimated:** 2-3 hours

---

### 4. Schedule Generation Improvements

**Priority:** Medium

**Current:** Auto-generates on assistant tab open for today only

**Enhancements:**
- Manual refresh button (if needed)
- Schedule preview before applying
- Undo/redo schedule changes
- Schedule history/versioning

**Estimated:** 4-5 hours

---

### 5. Documentation Updates

**Priority:** Low | **Status:** ✅ Complete

**Tasks:**
- ✅ Update `AGENTS.md` with new schedule generation flow
- ✅ Document task enrichment process
- ✅ Add developer guide for schedule caching logic (`docs/implementation_guide/SCHEDULE_CACHING.md`)
- 📋 Update API documentation for task endpoints (when task persistence is implemented)

**Completed:**
- Added schedule generation flow documentation to `AGENTS.md`
- Added task enrichment process documentation to `AGENTS.md`
- Created `SCHEDULE_CACHING.md` developer guide with detailed caching logic explanation

**Remaining:**
- Task API documentation (pending task persistence implementation)

---

## 🐛 Known Issues

### Schedule Caching Edge Cases

**Status:** ⚠️ Monitor

**Potential Issues:**
- Rapid task changes might cause cache misses
- Time-based schedule changes (e.g., gaps update) might not trigger regeneration
- Concurrent schedule generations could cause race conditions

**Mitigation:**
- Current implementation uses stable serialization to prevent unnecessary updates
- Monitor for edge cases in production usage

---

### Task Enrichment Timing

**Status:** ⚠️ Monitor

**Potential Issues:**
- Form field updates might not be immediately available when task is created
- Race conditions between form state and task creation

**Current Status:** Logic appears correct, but timing issues may occur in edge cases

**Recommendation:** Add explicit state checks before task creation

---

## 📋 Quick Reference: Current Architecture

### Schedule Flow

```
User opens assistant tab (today selected)
        ↓
scheduleActions.regenerate() called automatically
        ↓
SuggestionEngine.generateSchedule()
        ↓
Schedule result compared with cached version
        ↓
If different → Update store → Timeline re-renders
If same → Skip UI update (background only)
```

### Task Display Flow

```
Task created → Enrichment triggered (background)
        ↓
TaskCard displays:
  - Type badge + Min-session pill
  - Progress bar (routine or time-based)
  - Metadata (deadline, location, etc.)
        ↓
Scheduled tasks appear on timeline as events
```

---

## File Structure Summary

```
src/lib/
├── stores/
│   ├── schedule.ts              # ✅ Schedule store with pending/accepted suggestions
│   └── actions/
│       └── taskActions.ts       # ✅ Task CRUD (in-memory)
├── components/
│   ├── PersonalAssistantView.svelte  # ✅ Timeline + suggestion wiring
│   ├── CalendarView.svelte           # ✅ Calendar (shadow removed)
│   ├── TaskView.svelte               # ✅ Task list
│   ├── task_components/
│   │   ├── TaskCard.svelte           # ✅ Enhanced visuals
│   │   └── TaskForm.svelte           # ✅ Task creation
│   └── pa_components/
│       ├── CircularTimeline.svelte   # ✅ Timeline with suggestions
│       └── SuggestionCard.svelte     # ✅ Accept/Skip/Delete popup
└── services/
    └── suggestions/
        └── suggestion-engine.ts      # ✅ Schedule generation
```

---

**Last Updated:** Schedule Suggestion UX Overhaul complete
