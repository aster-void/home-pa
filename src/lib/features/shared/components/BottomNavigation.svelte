<script lang="ts">
  import { uiState } from "$lib/bootstrap/index.svelte.ts";
</script>

<nav
  class="fixed right-0 bottom-0 left-0 z-[2000] flex h-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] items-stretch gap-1 border-t border-[#1a202c]/[0.06] bg-white/90 px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-[180%] sm:px-2"
  aria-label="Main navigation"
>
  <button
    class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-none bg-transparent p-2.5 text-[#718096] transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-[#ed8936]/10 hover:text-[#ed8936] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed8936]/30 {uiState.currentView ===
    'calendar'
      ? 'bg-[#ed8936]/15 text-[#ed8936]'
      : ''}"
    onclick={() => uiState.setView("calendar")}
    aria-current={uiState.currentView === "calendar" ? "page" : undefined}
    aria-label="Open calendar view"
  >
    <span
      class="text-center text-sm leading-[1.2] tracking-wide {uiState.currentView ===
      'calendar'
        ? 'font-semibold'
        : 'font-medium'}"
    >
      Calendar
    </span>
  </button>

  <button
    class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-none bg-transparent p-2.5 text-[#718096] transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-[#ed8936]/10 hover:text-[#ed8936] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed8936]/30 {uiState.currentView ===
    'personal-assistant'
      ? 'bg-[#ed8936]/15 text-[#ed8936]'
      : ''}"
    onclick={() => uiState.setView("personal-assistant")}
    aria-current={uiState.currentView === "personal-assistant"
      ? "page"
      : undefined}
    aria-label="Open assistant view"
  >
    <span
      class="text-center text-sm leading-[1.2] tracking-wide {uiState.currentView ===
      'personal-assistant'
        ? 'font-semibold'
        : 'font-medium'}"
    >
      Assistant
    </span>
  </button>

  <button
    class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-none bg-transparent p-2.5 text-[#718096] transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-[#ed8936]/10 hover:text-[#ed8936] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed8936]/30 {uiState.currentView ===
    'tasks'
      ? 'bg-[#ed8936]/15 text-[#ed8936]'
      : ''}"
    onclick={() => uiState.setView("tasks")}
    aria-current={uiState.currentView === "tasks" ? "page" : undefined}
    aria-label="Open tasks view"
  >
    <span
      class="text-center text-sm leading-[1.2] tracking-wide {uiState.currentView ===
      'tasks'
        ? 'font-semibold'
        : 'font-medium'}"
    >
      Tasks
    </span>
  </button>

  <button
    class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-none bg-transparent p-2.5 text-[#718096] transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-[#ed8936]/10 hover:text-[#ed8936] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed8936]/30 {uiState.currentView ===
    'utilities'
      ? 'bg-[#ed8936]/15 text-[#ed8936]'
      : ''}"
    onclick={() => uiState.setView("utilities")}
    aria-current={uiState.currentView === "utilities" ? "page" : undefined}
    aria-label="Open utilities view"
  >
    <span
      class="text-center text-sm leading-[1.2] tracking-wide {uiState.currentView ===
      'utilities'
        ? 'font-semibold'
        : 'font-medium'}"
    >
      Utilities
    </span>
  </button>
</nav>
