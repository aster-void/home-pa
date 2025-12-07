<script lang="ts">
  import CalendarSettings from "./calendar_components/CalendarSettings.svelte";

  const {} = $props();
</script>

<div class="utilities-view">
  <div class="utilities-header">
    <h2>Utilities</h2>
    <p class="utilities-subtitle">
      Account settings, calendar import/export, and other tools
    </p>
  </div>

  <div class="utilities-content">
    <CalendarSettings />
  </div>
</div>

<style>
  .utilities-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-lg);
    min-height: calc(100vh - 120px);
    overflow-y: auto;
    max-height: calc(100vh - 120px);
    scrollbar-width: thin;
    scrollbar-color: var(--coral) transparent;
  }

  .utilities-view::-webkit-scrollbar {
    width: 8px;
  }

  .utilities-view::-webkit-scrollbar-thumb {
    background: var(--coral);
    border-radius: 4px;
  }

  .utilities-view::-webkit-scrollbar-track {
    background: transparent;
  }

  .utilities-header {
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid rgba(15, 34, 48, 0.08);
  }

  .utilities-header h2 {
    margin: 0 0 var(--space-sm) 0;
    font-family: var(--font-family);
    font-size: var(--fs-xl);
    font-weight: var(--font-weight-bold);
    color: var(--navy-900);
  }

  .utilities-subtitle {
    margin: 0;
    color: var(--muted);
    font-size: var(--fs-md);
  }

  .utilities-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .utilities-view {
      padding: var(--space-md);
    }

    .utilities-header {
      margin-bottom: var(--space-md);
    }

    .utilities-content {
      gap: var(--space-md);
    }
  }
</style>
