<script lang="ts">
  import CalendarTabView from "$lib/components/CalendarTabView.svelte";
  import PersonalAssistantView from "$lib/components/PersonalAssistantView.svelte";
  import TaskView from "$lib/components/TaskView.svelte";
  import UtilitiesView from "$lib/components/UtilitiesView.svelte";
  import { currentView } from "$lib/stores/index.js";
</script>

<main class="main-content">
  {#if $currentView === "calendar"}
    <CalendarTabView />
  {:else if $currentView === "personal-assistant"}
    <PersonalAssistantView />
  {:else if $currentView === "tasks"}
    <TaskView />
  {:else if $currentView === "utilities"}
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
