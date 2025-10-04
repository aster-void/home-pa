<script lang="ts">
  import type { AppController } from '../controllers/app.controller.svelte.ts';
  import SuggestionPanel from './SuggestionPanel.svelte';
  import LogsView from './LogsView.svelte';

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Local state to toggle between logs and suggestions view
  let showLogs = $state(false);
</script>

<div class="personal-assistant-view">
  <div class="assistant-header">
    <h2>Personal Assistant</h2>
    <button 
      class="developer-button"
      onclick={() => showLogs = !showLogs}
    >
      {showLogs ? 'Hide' : 'Developer'} Logs
    </button>
  </div>

  {#if showLogs}
    <div class="logs-section">
      <LogsView {controller} />
    </div>
  {:else}
    <div class="suggestions-section">
      <SuggestionPanel {controller} />
    </div>
  {/if}
</div>

<style>
  .personal-assistant-view {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    min-height: calc(100vh - 120px); /* Account for navigation */
  }

  .assistant-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .assistant-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1f2937;
  }

  .developer-button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #6b7280;
    transition: all 0.2s;
  }

  .developer-button:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .logs-section {
    background: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .suggestions-section {
    background: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
  }
</style>
