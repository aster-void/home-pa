<script lang="ts">
  import CalendarTabView from "$lib/features/calendar/components/CalendarTabView.svelte";
  import UtilitiesView from "$lib/features/utilities/components/UtilitiesView.svelte";
  import { PersonalAssistantView } from "$lib/features/assistant/components/index.ts";
  import { TaskView } from "$lib/features/tasks/components/index.ts";
  import { uiState } from "$lib/state/index.svelte.ts";
</script>

<main class="main-content">
  {#if uiState.currentView === "calendar"}
    <CalendarTabView />
  {:else if uiState.currentView === "personal-assistant"}
    <PersonalAssistantView />
  {:else if uiState.currentView === "tasks"}
    <TaskView />
  {:else if uiState.currentView === "utilities"}
    <UtilitiesView />
  {/if}
</main>

<style>
  .main-content {
    display: flex;
    flex-direction: column;
    height: calc(
      100vh - var(--bottom-nav-height, 80px) - env(safe-area-inset-bottom)
    ); /* Account for bottom nav + safe area */
    max-height: calc(
      100vh - var(--bottom-nav-height, 80px) - env(safe-area-inset-bottom)
    );
    min-height: calc(
      100vh - var(--bottom-nav-height, 80px) - env(safe-area-inset-bottom)
    );
    width: 100%;
    background: var(--bg-card);
    overflow: hidden;
    box-sizing: border-box;
  }
</style>
