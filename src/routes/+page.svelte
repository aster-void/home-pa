<script lang="ts">
  import { onMount } from 'svelte';
  import { AppController } from '$lib/controllers/app.controller.svelte.js';
  import Navigation from '$lib/components/Navigation.svelte';
  import CalendarView from '$lib/components/CalendarView.svelte';
  import MemoView from '$lib/components/MemoView.svelte';
  import LogsView from '$lib/components/LogsView.svelte';
  import SuggestionPanel from '$lib/components/SuggestionPanel.svelte';

  // Initialize controller
  const controller = new AppController();

  // Initialize app when component mounts
  onMount(() => {
    controller.initialize();
  });
</script>

<div class="app">
  <Navigation {controller} />
  
  <main class="main-content">
    {#if controller.currentView === 'calendar'}
      <CalendarView {controller} />
    {:else if controller.currentView === 'memo'}
      <MemoView {controller} />
    {:else if controller.currentView === 'logs'}
      <LogsView {controller} />
    {/if}
  </main>
  
  <SuggestionPanel {controller} />
</div>

<style>
  :global(.app) {
    min-height: 100vh;
    background-color: #f8fafc;
  }

  .main-content {
    padding: 0;
  }
</style>
