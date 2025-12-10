# Home-PA (Personal Assistant)

SvelteKit + Svelte 5 personal assistant application.

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
├── features/           # Feature-based components (calendar, tasks, assistant, memo, utilities)
├── state/              # Global state. Better not extend.
│   ├── *.svelte.ts     # Svelte 5 reactive classes
│   ├── forms/          # Form state
│   ├── actions/        # Business logic
│   └── index.ts        # Store wrappers (for compatibility)
├── services/           # External service integrations
└── types.ts            # Shared type definitions
```

## Svelte 5

- Use runes (e.g. `$state`) over stores.
- Use controller class if applicable.
- Use new Remote Functions for type-safe communication, over `+server.ts`.

## State Management

```typescript
// src/lib/state/example.svelte.ts
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

// type-safe context API (new!)
export const [getExample, setExample] = createContext<ExampleState>();
```

```svelte
<script>
  // Usage
  import { ExampleState, setExample } from "$lib/state/example.svelte.ts";

  const exampleState = new ExampleState();
  setExample(exampleState); // to use in child components

  exampleState.add(item);
</script>

<!-- it will just work -->
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
