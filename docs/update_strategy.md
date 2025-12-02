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

### 1. Enable LLM Enrichment

**Status:** Module ready, needs SDK + API key

**Steps:**
```bash
# Install Gemini SDK
bun add @google/generative-ai

# Add to .env
GEMINI_API_KEY=your-api-key-here
```

The `llm-enrichment.ts` module will automatically use Gemini when configured. Currently falls back to rule-based defaults.

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

## Quick Reference: Current File Structure

```
src/lib/
├── types.ts                          # ✅ Rich Memo, Suggestion, Gap interfaces
├── services/
│   ├── gap-finder.ts                 # ✅ Extended with gapId
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
│   ├── schedule.ts                   # ✅ Schedule result store
│   ├── gaps.ts                       # ✅ Enriched gaps
│   ├── forms/taskForm.ts             # ✅ Task form state
│   ├── actions/taskActions.ts        # ✅ Task CRUD
│   └── __tests__/
│       ├── schedule.test.ts          # ✅ 12 tests
│       └── task-wiring.test.ts       # ✅ 21 tests
└── components/
    ├── TaskView.svelte               # ✅ Task list
    ├── task_components/
    │   ├── TaskForm.svelte           # ✅ Rich form
    │   └── TaskCard.svelte           # ✅ Task display
    └── pa_components/
        ├── CircularTimeline.svelte   # ✅ Existing
        └── SchedulePanel.svelte      # ✅ Schedule display
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

| Type | Need Range | Can Be Mandatory? |
|------|------------|-------------------|
| 期限付き | 0.1 - 1.0+ | Yes (due today or overdue) |
| バックログ | 0.25 - 0.7 | No (capped) |
| ルーティン | 0.3 - 0.8 | No (capped) |

**Priority Logic:**
- Mandatory tasks (need ≥ 1.0) scheduled first
- Higher `need × importance` = higher priority
- Location matching filters compatible gaps

---

## Test Summary

```
61 tests passing across 5 files

- schedule.test.ts: Engine unit + integration tests
- task-wiring.test.ts: Full flow tests (form → store → schedule)
- recurrence.store.test.ts: Recurrence handling
- integration.app.test.ts: App integration
- manager.test.ts: Recurrence manager
```

---

This document will be updated as remaining tasks are completed.
