# AGENTS Guide

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
