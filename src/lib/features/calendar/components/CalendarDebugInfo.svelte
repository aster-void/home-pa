<script lang="ts">
  import type { Event } from "$lib/types.js";

  interface Props {
    currentMonth: Date;
    totalEvents: number;
    displayEvents: number;
    foreverEvents: Event[];
    isLoading: boolean;
    error: string | null;
  }

  let {
    currentMonth,
    totalEvents,
    displayEvents,
    foreverEvents,
    isLoading,
    error,
  }: Props = $props();

  let windowStart = $derived(
    new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 3,
      1,
    ).toLocaleDateString(),
  );

  let windowEnd = $derived(
    new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 4,
      0,
    ).toLocaleDateString(),
  );
</script>

<div class="debug-info">
  <h3>Sliding Window Debug Info</h3>
  <div class="debug-stats">
    <div class="debug-stat">
      <strong>Window:</strong>
      {windowStart} - {windowEnd}
    </div>
    <div class="debug-stat">
      <strong>Total Events:</strong>
      {totalEvents}
    </div>
    <div class="debug-stat">
      <strong>Display Events:</strong>
      {displayEvents}
    </div>
    <div class="debug-stat">
      <strong>Forever Events:</strong>
      {foreverEvents.length}
    </div>
    <div class="debug-stat">
      <strong>Calendar Store:</strong>
      Loading: {isLoading ? "Yes" : "No"}, Error: {error || "None"}
    </div>
  </div>
  {#if foreverEvents.length > 0}
    <div class="forever-events-list">
      <h4>Forever Recurring Events:</h4>
      <ul>
        {#each foreverEvents as event}
          <li>
            {event.title}
            <span class="forever-indicator">∞</span>
            (Master ID: {(event as any).eventId || event.id})
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .debug-info {
    background: rgba(0, 200, 255, 0.05);
    border: 1px solid rgba(0, 200, 255, 0.2);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    margin: var(--space-sm) var(--space-md);
    font-size: 0.75rem;
  }

  .debug-info h3 {
    margin: 0 0 var(--space-sm) 0;
    font-size: 0.85rem;
    color: var(--primary);
  }

  .debug-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .debug-stat {
    background: var(--bg-secondary);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
  }

  .debug-stat strong {
    color: var(--text);
  }

  .forever-events-list {
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
    border-top: 1px solid rgba(0, 200, 255, 0.2);
  }

  .forever-events-list h4 {
    margin: 0 0 var(--space-xs) 0;
    font-size: 0.8rem;
    color: var(--text);
  }

  .forever-events-list ul {
    margin: 0;
    padding-left: var(--space-md);
    color: var(--text-secondary);
  }

  .forever-events-list li {
    margin-bottom: 0.25rem;
  }

  .forever-indicator {
    color: var(--primary);
    font-size: 0.7rem;
  }
</style>
