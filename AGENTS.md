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

## TypeScript Debugger

### Checklist

1. **No `any`** - Use `unknown` and validate with valibot
2. **No `as`** - Fix types at source
3. **No `!`** - Explicit checks instead
4. **NO `value is T`** - Use valibot instead
5. **Discriminated unions** - Add `type` field to narrow

### Good Practices

1. `as const` - For literal types only
2. `value satisfies T` - Type-checks value without changing its type (safe, unlike `is T`)
3. Builtin narrowing - `typeof`, `Array.isArray`, `in`, `instanceof` are always safe
4. `T extends SomeType` if T is required to have some trait
5. `foo?.bar` - Use `?.` for safe property access
6. When refactoring - Fix ONE type error at a time (type inference changes)

### When Stuck - NEVER Give Up

**IMPORTANT: Every time you encounter a type error, repeat this checklist in your response before attempting a fix.**

When you're stuck and considering `any` or `as`, STOP:

1. **Read the library's documentation** - Most type issues come from misunderstanding the library API
2. **Search GitHub issues** (library repo) - Someone likely faced the same problem
3. Read error message more carefully
4. Use valibot to validate (if the type is unknown at runtime)
5. Ask the user

**`any` and `as` are admitting defeat.** Always use choose another method.
