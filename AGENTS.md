# AGENTS.md

This application is Home-PA (Personal Assistant), SvelteKit + Svelte 5 personal assistant application.

## Tech Stack & Tools

- Svelte, SvelteKit
  - Experimental Remote Functions are enabled.
- Bun
- TailwindCSS & DaisyUI
- Prisma
- Vitest

## Directory Structure

```
src/lib/
├── features/           # Feature modules
│   ├── {feature}/      # assistant, calendar, tasks, memo, utilities, logs, etc
│   │   ├── components/ # UI components
│   │   ├── state/      # Svelte 5 reactive state classes
│   │   └── services/   # Business logic (optional)
│   └── shared/         # Shared components across features
├── utils/              # Utility functions
├── server/             # Server-only code
├── bootstrap/          # App initialization
└── types.ts            # Shared type definitions
```

## Svelte 5

- Use runes (e.g. `$state`) over stores.
- Use controller class if applicable.
- Use new Remote Functions for type-safe communication, over `+server.ts`.

## State Management

```typescript
// src/lib/features/{feature}/state/example.svelte.ts
import { createContext } from "svelte";

export class ExampleState {
  items = $state<Item[]>([]);

  get count(): number {
    return this.items.length;
  }

  add(item: Item): void {
    this.items.push(item);
  }
}

export const [getExample, setExample] = createContext<ExampleState>();
```

```svelte
<script>
  import {
    ExampleState,
    setExample,
  } from "$lib/features/{feature}/state/example.svelte.ts";

  const exampleState = new ExampleState();
  setExample(exampleState);

  exampleState.add(item);
</script>

<span>Current count: {exampleState.count}</span>
```

## Notes

- **Lint errors**: Many currently exist. `SvelteDate` recommendations, etc.

## Commands

```bash
bun run dev        # Dev server
bun run build      # Build
bun run check      # Full check (type + lint + format)
```

## Preferences

- CPU performance is rarely a concern, so no need to optimize for it in general.

## Application design & Documentation

- Read `docs/` for application design and documentation.
- **UI work**: Always refer to `docs/skills/designer.md` for design guidelines.
