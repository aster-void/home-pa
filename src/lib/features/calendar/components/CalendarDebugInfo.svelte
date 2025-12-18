<script lang="ts">
  import type { Event } from "$lib/types.ts";

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

<div
  class="m-2 rounded-lg border border-[#00C8FF]/20 bg-[#00C8FF]/5 p-4 text-xs"
>
  <h3 class="m-0 mb-2 text-sm text-[#0066CC]">Sliding Window Debug Info</h3>
  <div class="flex flex-wrap gap-2">
    <div class="rounded bg-base-200 px-2 py-1 text-base-content/60">
      <strong class="text-base-content">Window:</strong>
      {windowStart} - {windowEnd}
    </div>
    <div class="rounded bg-base-200 px-2 py-1 text-base-content/60">
      <strong class="text-base-content">Total Events:</strong>
      {totalEvents}
    </div>
    <div class="rounded bg-base-200 px-2 py-1 text-base-content/60">
      <strong class="text-base-content">Display Events:</strong>
      {displayEvents}
    </div>
    <div class="rounded bg-base-200 px-2 py-1 text-base-content/60">
      <strong class="text-base-content">Forever Events:</strong>
      {foreverEvents.length}
    </div>
    <div class="rounded bg-base-200 px-2 py-1 text-base-content/60">
      <strong class="text-base-content">Calendar Store:</strong>
      Loading: {isLoading ? "Yes" : "No"}, Error: {error || "None"}
    </div>
  </div>
  {#if foreverEvents.length > 0}
    <div class="mt-2 border-t border-[#00C8FF]/20 pt-2">
      <h4 class="m-0 mb-1 text-[0.8rem] text-base-content">
        Forever Recurring Events:
      </h4>
      <ul class="m-0 pl-4 text-base-content/60">
        {#each foreverEvents as event (event.id)}
          <li class="mb-1">
            {event.title}
            <span class="text-[0.7rem] text-[#0066CC]">∞</span>
            (Master ID: {(event as Event & { eventId?: string }).eventId ||
              event.id})
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
