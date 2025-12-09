# AGENTS Guide

You MUST update this file when the systems structure changed.

## Stack

- SvelteKit + Prisma (MongoDB) + better-auth
- Docker (Mongo 7) via infra/dev.docker-compose.yml

## Dev Tips

- Start DB: `up.sh` (stop: `down.sh`)
- Env: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`
- Run app: `bun install && bun dev`

## Repo Conventions

- Prefer feature folders; keep files short (≤100 lines); K.I.S.S.
- Keep docs up to date; remove stale ones; deduplicate.

## Directory Structure

`src/{routes,lib,services,assets}`; `src/lib/server` (server-only); `infra/`; `scripts/{up.sh,down.sh}`; `static/`.

## Coding Rules

- Only use APIs present in official docs or types; add TODO if unsure.

## Svelte 5 Syntax (Required)

- All new/updated Svelte components MUST use Svelte 5 runes.
- Do not use legacy `export let ...` or `$:` reactive labels.
- Prefer these patterns:
  - Props: `let p: Props = $props();`
  - State: `let n = $state(0); n++`
  - Derived: `const d = $derived(n * 2)`
  - Effect: `$effect(() => console.log(n))`

### Event Handling

- Do not use legacy `on:` directives or pipe modifiers like `|preventDefault`.
- Use DOM event attributes instead, e.g. `onclick={...}`, `onsubmit={(e)=>{ e.preventDefault(); ... }}`.

## Controller Classes

- Use `.svelte.ts` files to write classes with runes outside components.
- Good for extracting stateful UI logic from large `<script>` blocks.

```ts
// src/services/user/controller.svelte.ts
export class UserController {
  foo = $state(2);
  baz = $state(3);
  bar = $derived(this.foo * this.baz);
}
```

## Remote Functions

- Use `.remote.ts` files; import helpers from `$app/server`.
- Supported: `query`, `form`, `command` and others (see SvelteKit docs).

```ts
// src/services/users/users.remote.ts
import { query, command } from "$app/server";

export const list = query(async () => {
  return [
    /* rows */
  ];
});
export const create = command(async ({ name }: { name: string }) => {
  /* insert */
  await list.refresh(); // one-round trip update
});
```

```svelte
<!-- src/services/users/components/Overview.svelte -->
<script>
  import { list, create } from '../users.remote.ts';

  let newUser = $state({
    name: "",
  });
</script>

{#each await list() as u}<p>{u.name}</p>{/each}

<form onsubmit={(e) => {
  e.preventDefault();
  await create(newUser);
  newUser = { name: "" };
}}>
  <input name="name" bind:value={newUser.name} />
</form>
```

## Async Svelte

- Use `await` in markup; wrap with `<svelte:boundary>` for pending/error UI.

```svelte
<svelte:boundary>
  {#each await list() as u}<p>{u.name}</p>{/each}
</svelte:boundary>
```

## Schedule Generation Flow

The schedule generation system automatically creates task schedules for today when the assistant tab is opened.

### How It Works

1. **Trigger**: When `PersonalAssistantView` mounts and today is selected, `scheduleActions.regenerate()` is called
2. **Caching**: Generated schedule is compared with cached version using stable serialization
3. **UI Update**: Only updates store (and UI) if the new schedule differs from cached version
4. **Display**: Scheduled blocks are converted to `Event` format and rendered on `CircularTimeline` alongside calendar events

### Key Files

- `src/lib/stores/schedule.ts` - Schedule store with caching logic (`stableSerializeSchedule()`)
- `src/lib/components/PersonalAssistantView.svelte` - Auto-triggers generation on mount
- `src/lib/components/pa_components/CircularTimeline.svelte` - Renders scheduled blocks as events via `extraEvents` prop

### Schedule Caching

The caching system prevents unnecessary UI updates:

```typescript
// In scheduleActions.regenerate()
const previous = get(scheduleResult);
const previousKey = previous ? stableSerializeSchedule(previous) : null;

// Generate new schedule
const { schedule } = await engine.generateSchedule(memos, gaps);
const nextKey = stableSerializeSchedule(schedule);

// Only update if different
if (previousKey !== nextKey) {
  scheduleResult.set(schedule); // UI updates
} else {
  // Skip UI update (background only)
}
```

The `stableSerializeSchedule()` function creates a deterministic JSON string from the schedule, sorting arrays for consistent comparison.

### Scheduled Events on Timeline

Scheduled blocks are converted to `Event` objects with:

- `timeLabel: "timed"` - Always timed events
- `start/end` - Calculated from block's `startTime/endTime` and selected date
- `id: scheduled-{suggestionId}` - Unique identifier prefixed with "scheduled-"

These appear on the timeline with the same visual style as calendar events.

## Task Enrichment Process

Tasks are automatically enriched with LLM-suggested metadata after creation.

### Enrichment Flow

1. **User creates task** → `taskActions.create()` is called
2. **Task added to store** with minimal fields (title, type, location, etc.)
3. **Background enrichment** → `enrichTaskInBackground()` is triggered asynchronously
4. **LLM API call** → Server endpoint `/api/enrich` enriches the task
5. **Store update** → Task is updated with enrichment results (genre, importance, sessionDuration, totalDurationExpected)

### Enrichment Fields

The LLM fills these optional fields:

- `genre` - Task category (e.g., "勉強", "運動", "家事")
- `importance` - Low/medium/high priority
- `sessionDuration` - Recommended minutes per session
- `totalDurationExpected` - Total expected time to complete

### Key Files

- `src/lib/stores/actions/taskActions.ts` - Triggers enrichment after task creation
- `src/routes/api/enrich/+server.ts` - Server endpoint for LLM enrichment
- `src/lib/services/suggestions/llm-enrichment.ts` - Client-side API wrapper with fallback

### Enrichment States

Tasks show an "AI analyzing..." overlay while enriching:

- `enrichingTaskIds` store tracks which tasks are being enriched
- UI displays spinner overlay on enriching tasks
- Updates happen automatically when enrichment completes

### Fallback Behavior

If LLM enrichment fails (API unavailable, network error, etc.):

- Fallback values are used (sensible defaults based on task type)
- Task remains fully functional without enrichment
- No error shown to user (graceful degradation)
