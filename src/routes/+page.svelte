<script lang="ts">
  import { getContext } from 'svelte';
  import { AppController } from '$lib/controllers/app.controller.svelte.ts';
  import CalendarTabView from '$lib/components/CalendarTabView.svelte';
  import PersonalAssistantView from '$lib/components/PersonalAssistantView.svelte';

  // Get controller from context
  const controller = getContext<AppController>('controller');

  // Get current view from controller store
  const currentViewStore = controller?.currentView;
  const currentView = $derived(currentViewStore ? $currentViewStore : 'calendar');
</script>

<main class="main-content">
  {#if controller}
    {#if currentView === 'calendar'}
      <CalendarTabView {controller} />
    {:else if currentView === 'personal-assistant'}
      <PersonalAssistantView {controller} />
    {/if}
  {/if}
</main>

<style>
  .main-content {
    min-height: calc(100vh - 80px); /* Account for bottom navigation */
    background-color: #f8fafc;
  }
</style>