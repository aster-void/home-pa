<script lang="ts">
  import LogsView from "./LogsView.svelte";
  import {
    FreeTimeGapsCard,
    SmartSuggestionsCard,
    TransitCard,
  } from "./pa_components/index.js";

  // Local state for the adaptive layout
  let showLogs = $state(false);
</script>

<div class="personal-assistant-view">
  <div class="assistant-header">
    <h2>Personal Assistant</h2>
    <div class="header-actions">
      <button
        class="action-button"
        class:active={showLogs}
        onclick={() => (showLogs = !showLogs)}
      >
        {showLogs ? "Hide" : "Show"} Logs
      </button>
    </div>
  </div>

  <div class="adaptive-content">
    <!-- Main Overview Section -->
    <div class="overview-section">
      <!-- Free Time Gaps Card -->
      <FreeTimeGapsCard />

      <!-- Smart Suggestions Card -->
      <SmartSuggestionsCard />
    </div>

    <!-- Transit Section -->
    <div class="transit-section">
      <TransitCard />
    </div>

    <!-- Developer Logs Section (Collapsible) -->
    {#if showLogs}
      <div class="logs-section">
        <LogsView />
      </div>
    {/if}
  </div>
</div>

<style>
  .personal-assistant-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-lg);
    min-height: calc(100vh - 120px);
    overflow-y: auto;
    max-height: calc(100vh - 120px);
    scrollbar-width: thin;
    scrollbar-color: var(--coral) transparent;
  }

  .personal-assistant-view::-webkit-scrollbar {
    width: 8px;
  }

  .personal-assistant-view::-webkit-scrollbar-thumb {
    background: var(--coral);
    border-radius: 4px;
  }

  .personal-assistant-view::-webkit-scrollbar-track {
    background: transparent;
  }

  .assistant-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid rgba(15, 34, 48, 0.08);
  }

  .assistant-header h2 {
    margin: 0;
    font-family: var(--font-family);
    font-size: var(--fs-xl);
    font-weight: var(--font-weight-bold);
    color: var(--navy-900);
  }

  .header-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .action-button {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--coral);
    background: transparent;
    border-radius: 999px;
    cursor: pointer;
    font-size: var(--fs-sm);
    color: var(--coral);
    font-family: var(--font-family);
    font-weight: var(--font-weight-bold);
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .action-button:hover {
    background: var(--coral);
    color: var(--white);
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  .action-button.active {
    background: var(--coral);
    color: var(--white);
    border-color: var(--coral);
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
  }

  .adaptive-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .overview-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
  }

  .logs-section {
    background: var(--card);
    border: 1px solid rgba(15, 34, 48, 0.05);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    box-shadow: var(--shadow-subtle);
    transition:
      transform 0.18s cubic-bezier(0.2, 0.9, 0.2, 1),
      box-shadow 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .logs-section:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-soft);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .personal-assistant-view {
      padding: var(--space-md);
    }

    .overview-section {
      grid-template-columns: 1fr;
      gap: var(--space-md);
    }

    .assistant-header {
      flex-direction: column;
      gap: var(--space-md);
      align-items: flex-start;
    }

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
