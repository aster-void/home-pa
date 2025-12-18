<script lang="ts">
  import type { Event } from "$lib/types.ts";
  import {
    dataState,
    calendarState,
    eventActions,
  } from "$lib/bootstrap/compat.svelte.ts";
  import { getEventColor } from "../utils/index.ts";

  interface Props {
    events: Event[];
    parseRecurrenceForEdit: (event: Event) => void;
    onClose: () => void;
  }

  let { events, parseRecurrenceForEdit, onClose }: Props = $props();

  function getCurrentTimePositionScaled(): number {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / 60) * 16.67;
  }

  function getEventPositionScaled(startTime: Date, timeLabel?: string): number {
    if (timeLabel === "all-day") {
      return 0;
    }
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / 60) * 16.67;
  }

  function getEventHeightScaled(event: Event): number {
    if (event.timeLabel === "all-day") {
      return 24 * 16.67;
    }
    const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
    const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
    const durationMinutes = Math.max(endMinutes - startMinutes, 30);
    return (durationMinutes / 60) * 16.67;
  }

  function getEventColor(event: Event): string {
  function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function getEventColumns(events: Event[]): Event[][] {
    if (events.length === 0) return [];

    const sortedEvents = [...events].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    const columns: Event[][] = [];

    for (const event of sortedEvents) {
      let placed = false;
      for (const column of columns) {
        const lastEvent = column[column.length - 1];
        if (lastEvent.end.getTime() <= event.start.getTime()) {
          column.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([event]);
      }
    }

    return columns;
  }

  function handleEventClick(event: Event) {
    const masterEvent =
      calendarState.events.find(
        (e) =>
          e.id === (event as Event & { eventId?: string }).eventId ||
          e.id === event.id,
      ) || event;
    eventActions.editEvent(masterEvent);
    parseRecurrenceForEdit(masterEvent);
  }

  let eventColumns = $derived(getEventColumns(events));
</script>

<div
  class="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
  onclick={() => onClose()}
  onkeydown={(e) => e.key === "Escape" && onClose()}
  role="button"
  tabindex="-1"
  aria-label="Close timeline"
>
  <div
    class="flex max-h-[80vh] w-full max-w-[600px] flex-col overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] shadow-xl"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="flex items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4"
    >
      <h3 class="m-0 text-lg font-normal text-[var(--color-text-primary)]">
        タイムライン - {dataState.selectedDate.toLocaleDateString("ja-JP")}
      </h3>
      <button
        class="btn btn-ghost transition-all duration-200 btn-sm hover:bg-[var(--color-error-500)] hover:text-white"
        onclick={() => onClose()}
        aria-label="Close"
      >
        ✕
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      {#if events.length === 0}
        <p class="py-12 text-center text-[var(--color-text-muted)]">
          この日の予定はありません
        </p>
      {:else}
        <div class="relative h-[400px] min-h-[400px]">
          <!-- Hour indicators -->
          <div class="absolute top-0 left-0 h-full w-[50px]">
            {#each Array(24) as _, hour (hour)}
              <div
                class="absolute left-0 flex w-full items-center"
                style="top: {hour * 16.67}px;"
              >
                <span
                  class="w-10 pr-1 text-right text-xs text-[var(--color-text-muted)]"
                  >{hour.toString().padStart(2, "0")}:00</span
                >
                <div class="h-px flex-1 bg-[var(--color-border-default)]"></div>
              </div>
            {/each}
          </div>

          <!-- Current time indicator -->
          <div
            class="absolute z-[5] h-0.5 bg-[var(--color-error-500)] before:absolute before:top-[-3px] before:left-[-4px] before:h-2 before:w-2 before:rounded-full before:bg-[var(--color-error-500)] before:content-['']"
            style="top: {getCurrentTimePositionScaled()}px; left: 50px; right: 0;"
          ></div>

          <!-- Event columns -->
          <div
            class="absolute flex"
            style="left: 55px; right: 0; top: 0; height: 100%;"
          >
            {#each eventColumns as column, columnIndex (columnIndex)}
              <div
                class="relative h-full"
                style="width: {100 / eventColumns.length}%;"
              >
                {#each column as event (event.id)}
                  <div
                    class="absolute right-0.5 left-0.5 min-h-[20px] cursor-pointer overflow-hidden rounded px-1 py-0.5 transition-all duration-200 hover:z-10 hover:scale-[1.02] hover:shadow-md"
                    onclick={() => handleEventClick(event)}
                    onkeydown={(e) =>
                      e.key === "Enter" && handleEventClick(event)}
                    role="button"
                    tabindex="0"
                    style="
                      top: {getEventPositionScaled(
                      event.start,
                      event.timeLabel,
                    )}px;
                      height: {getEventHeightScaled(event)}px;
                      background-color: {getEventColor(event)};
                      color: white;
                    "
                  >
                    <div
                      class="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap"
                    >
                      {event.title}
                    </div>
                    <div class="text-[10px] opacity-80">
                      {#if event.timeLabel === "all-day"}
                        00:00 - 23:59
                      {:else}
                        {formatTime(event.start)} - {formatTime(event.end)}
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
