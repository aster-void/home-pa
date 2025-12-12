<script lang="ts">
  import { uiState } from "$lib/bootstrap/index.svelte.ts";
</script>

<nav
  class="fixed right-0 bottom-0 left-0 z-[2000] flex h-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] items-stretch gap-0.5 border-t border-black/[0.06] bg-white/95 p-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-[180%] sm:px-1 sm:pb-[calc(6px+env(safe-area-inset-bottom))]"
  aria-label="Main navigation"
>
  <button
    class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-none bg-transparent p-2.5 text-base-content/60 transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-[#F08A77]/[0.08] hover:text-[color:var(--accent-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F08A77]/30 sm:rounded-lg sm:p-2 {uiState.currentView ===
    'calendar'
      ? 'bg-[#F08A77]/[0.12] text-[color:var(--accent-primary)]'
      : ''}"
    onclick={() => uiState.setView("calendar")}
    aria-current={uiState.currentView === "calendar" ? "page" : undefined}
    aria-label="Open calendar view"
  >
    <span
      class="text-center text-xs leading-[1.2] font-normal tracking-[0.02em] sm:text-[0.7rem] {uiState.currentView ===
      'calendar'
        ? 'font-bold'
        : ''}"
    >
      Calendar
    </span>
  </button>

  <button
    class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-none bg-transparent p-2.5 text-base-content/60 transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-[#F08A77]/[0.08] hover:text-[color:var(--accent-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F08A77]/30 sm:rounded-lg sm:p-2 {uiState.currentView ===
    'personal-assistant'
      ? 'bg-[#F08A77]/[0.12] text-[color:var(--accent-primary)]'
      : ''}"
    onclick={() => uiState.setView("personal-assistant")}
    aria-current={uiState.currentView === "personal-assistant"
      ? "page"
      : undefined}
    aria-label="Open assistant view"
  >
    <span
      class="text-center text-xs leading-[1.2] font-normal tracking-[0.02em] sm:text-[0.7rem] {uiState.currentView ===
      'personal-assistant'
        ? 'font-bold'
        : ''}"
    >
      Assistant
    </span>
  </button>

  <button
    class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-none bg-transparent p-2.5 text-base-content/60 transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-[#F08A77]/[0.08] hover:text-[color:var(--accent-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F08A77]/30 sm:rounded-lg sm:p-2 {uiState.currentView ===
    'tasks'
      ? 'bg-[#F08A77]/[0.12] text-[color:var(--accent-primary)]'
      : ''}"
    onclick={() => uiState.setView("tasks")}
    aria-current={uiState.currentView === "tasks" ? "page" : undefined}
    aria-label="Open tasks view"
  >
    <span
      class="text-center text-xs leading-[1.2] font-normal tracking-[0.02em] sm:text-[0.7rem] {uiState.currentView ===
      'tasks'
        ? 'font-bold'
        : ''}"
    >
      Tasks
    </span>
  </button>

  <button
    class="flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-none bg-transparent p-2.5 text-base-content/60 transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-[#F08A77]/[0.08] hover:text-[color:var(--accent-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F08A77]/30 sm:rounded-lg sm:p-2 {uiState.currentView ===
    'utilities'
      ? 'bg-[#F08A77]/[0.12] text-[color:var(--accent-primary)]'
      : ''}"
    onclick={() => uiState.setView("utilities")}
    aria-current={uiState.currentView === "utilities" ? "page" : undefined}
    aria-label="Open utilities view"
  >
    <span
      class="text-center text-xs leading-[1.2] font-normal tracking-[0.02em] sm:text-[0.7rem] {uiState.currentView ===
      'utilities'
        ? 'font-bold'
        : ''}"
    >
      Utilities
    </span>
  </button>
</nav>
