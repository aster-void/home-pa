# System Design

## Architecture

### Stack

- **Frontend**: SvelteKit (Svelte 5 with runes)
- **Backend**: SvelteKit server + Prisma ORM
- **Database**: MongoDB (Docker container via Mongo 7)
- **Authentication**: better-auth
- **Infrastructure**: Docker Compose (`infra/dev.docker-compose.yml`)

### Directory Structure

```
src/
├── routes/          # SvelteKit routes
├── lib/
│   ├── server/      # Server-only code
│   ├── stores/      # Client state management
│   ├── services/    # Feature services
│   └── components/  # Shared components
├── assets/          # Static assets
infra/               # Infrastructure configs
scripts/             # Dev scripts (up.sh, down.sh)
static/              # Public static files
```

## Core Features

### Schedule Generation System

The schedule generation system automatically creates task schedules for today when the assistant tab is opened.

#### Data Flow

```
PersonalAssistantView (mount + today selected)
  ↓
scheduleActions.regenerate()
  ↓
engine.generateSchedule(memos, gaps)
  ↓
stableSerializeSchedule() - Cache comparison
  ↓
scheduleResult.set() - Update store if changed
  ↓
CircularTimeline - Render scheduled blocks as events
```

#### Caching Mechanism

The system prevents unnecessary UI updates through deterministic serialization:

1. **Previous State**: Store current schedule using `stableSerializeSchedule()`
2. **Generate**: Create new schedule from LLM/engine
3. **Compare**: Serialize new schedule and compare with previous key
4. **Update**: Only update store (triggering UI re-render) if keys differ

```typescript
// Pseudo-code
const previous = get(scheduleResult);
const previousKey = previous ? stableSerializeSchedule(previous) : null;

const { schedule } = await engine.generateSchedule(memos, gaps);
const nextKey = stableSerializeSchedule(schedule);

if (previousKey !== nextKey) {
  scheduleResult.set(schedule); // UI updates
} else {
  // Skip UI update (background only)
}
```

#### Scheduled Events Rendering

Scheduled blocks are converted to `Event` objects:

- **timeLabel**: `"timed"` - Always timed events
- **start/end**: Calculated from block's `startTime/endTime` + selected date
- **id**: `scheduled-{suggestionId}` - Prefixed with "scheduled-"

These appear on `CircularTimeline` alongside calendar events via `extraEvents` prop.

#### Key Files

- `src/lib/stores/schedule.ts` - Schedule store with caching logic
- `src/lib/components/PersonalAssistantView.svelte` - Auto-triggers generation
- `src/lib/components/pa_components/CircularTimeline.svelte` - Renders events

### Task Enrichment System

Tasks are automatically enriched with LLM-suggested metadata after creation.

#### Data Flow

```
User creates task
  ↓
taskActions.create()
  ↓
Task added to store (minimal fields)
  ↓
enrichTaskInBackground() - Async
  ↓
POST /api/enrich - LLM API call
  ↓
Store update - Add enrichment fields
  ↓
UI update - Remove loading overlay
```

#### Enrichment Fields

The LLM fills these optional fields:

- **genre**: Task category (e.g., "勉強", "運動", "家事")
- **importance**: Low/medium/high priority
- **sessionDuration**: Recommended minutes per session
- **totalDurationExpected**: Total expected time to complete

#### Enrichment States

- **enrichingTaskIds** store: Tracks which tasks are being enriched
- **UI overlay**: Shows "AI analyzing..." spinner during enrichment
- **Auto-update**: UI updates automatically when enrichment completes

#### Fallback Behavior

If LLM enrichment fails:

- Fallback values are used (sensible defaults based on task type)
- Task remains fully functional without enrichment
- No error shown to user (graceful degradation)

#### Key Files

- `src/lib/stores/actions/taskActions.ts` - Triggers enrichment after creation
- `src/routes/api/enrich/+server.ts` - Server endpoint for LLM enrichment
- `src/lib/services/suggestions/llm-enrichment.ts` - Client-side API wrapper

## Design Principles

### Feature-Based Organization

- Prefer feature folders over type-based folders
- Keep files short (≤100 lines)
- Follow K.I.S.S. principle

### Documentation

- Keep docs up to date
- Remove stale documentation
- Deduplicate content
