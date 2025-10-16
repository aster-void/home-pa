<script lang="ts">
  import CalendarTabView from "$lib/components/CalendarTabView.svelte";
  import PersonalAssistantView from "$lib/components/PersonalAssistantView.svelte";
  import { currentView } from "$lib/stores/index.js";
</script>

<main class="main-content">
  {#if $currentView === "calendar"}
    <CalendarTabView />
  {:else if $currentView === "personal-assistant"}
    <PersonalAssistantView />
  {/if}
  
</main>

<style>
  .main-content {
    height: calc(100vh - 80px); /* Account for bottom navigation */
    background: var(--bg-card);
    overflow: hidden;
  }
</style>
