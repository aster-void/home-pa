<script lang="ts">
  import CalendarTabView from "$lib/features/calendar/components/CalendarTabView.svelte";
  import UtilitiesView from "$lib/features/utilities/components/UtilitiesView.svelte";
  import { PersonalAssistantView } from "$lib/features/assistant/components/index.ts";
  import { TaskView } from "$lib/features/tasks/components/index.ts";
  import { uiState } from "$lib/bootstrap/index.svelte.ts";
</script>

<main
  class="box-border flex h-[calc(100vh-var(--bottom-nav-height,80px)-env(safe-area-inset-bottom))] max-h-[calc(100vh-var(--bottom-nav-height,80px)-env(safe-area-inset-bottom))] min-h-[calc(100vh-var(--bottom-nav-height,80px)-env(safe-area-inset-bottom))] w-full flex-col overflow-hidden bg-transparent"
>
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
