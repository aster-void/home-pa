<script lang="ts">
  interface Props {
    currentMonth: Date;
    calendarError: string | null;
    showDebugInfo: boolean;
    onNavigateMonth: (direction: number) => void;
    onToggleDebug: () => void;
    onCreateEvent: () => void;
  }

  let {
    currentMonth,
    calendarError,
    showDebugInfo,
    onNavigateMonth,
    onToggleDebug,
    onCreateEvent,
  }: Props = $props();
</script>

<div class="calendar-header">
  <div class="month-nav">
    <button onclick={() => onNavigateMonth(-1)}>←</button>
    <h2>
      {currentMonth.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
      })}
    </h2>
    <button onclick={() => onNavigateMonth(1)}>→</button>
  </div>

  <div class="header-actions">
    <button
      class="debug-toggle"
      onclick={onToggleDebug}
      title="Toggle debug information"
    >
      {showDebugInfo ? "Hide" : "Show"} Debug
    </button>
    {#if calendarError}
      <div class="recurrence-error" title={calendarError}>
        ⚠️ Recurring events unavailable
      </div>
    {/if}
    <button class="add-event-button" onclick={onCreateEvent}>+</button>
  </div>
</div>

<style>
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    background: var(--bg-card);
    border-bottom: 1px solid var(--glass-border);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .month-nav {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .month-nav h2 {
    margin: 0;
    font-size: var(--fs-lg);
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    font-family: var(--font-display);
    letter-spacing: 0.02em;
    min-width: 140px;
    text-align: center;
  }

  .month-nav button {
    width: 36px;
    height: 36px;
    border: 1px solid var(--ui-border);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 1.1rem;
    color: var(--text-secondary);
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .month-nav button:hover {
    background: var(--bg-tertiary);
    border-color: var(--primary);
    color: var(--primary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .debug-toggle {
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--ui-border);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.7rem;
    color: var(--text-secondary);
    transition: all 0.15s ease;
  }

  .debug-toggle:hover {
    background: var(--bg-tertiary);
  }

  .recurrence-error {
    padding: var(--space-xs) var(--space-sm);
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: var(--radius-md);
    font-size: 0.7rem;
    color: var(--danger);
    cursor: help;
  }

  .add-event-button {
    width: 40px;
    height: 40px;
    border: none;
    background: var(--coral);
    color: white;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 1.5rem;
    font-weight: 500;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(240, 138, 119, 0.3);
  }

  .add-event-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(240, 138, 119, 0.4);
  }

  @media (max-width: 768px) {
    .calendar-header {
      padding: var(--space-sm) var(--space-md);
    }

    .month-nav h2 {
      font-size: var(--fs-md);
      min-width: 110px;
    }

    .month-nav button {
      width: 32px;
      height: 32px;
    }

    .debug-toggle {
      display: none;
    }

    .add-event-button {
      width: 36px;
      height: 36px;
      font-size: 1.25rem;
    }
  }
</style>
