<script lang="ts">
  import type { Event } from "$lib/types.js";
  import {
    selectedDate,
    calendarEvents,
    eventActions,
    uiActions,
  } from "$lib/state/index.js";

  interface Props {
    events: Event[];
    parseRecurrenceForEdit: (event: Event) => void;
  }

  let { events, parseRecurrenceForEdit }: Props = $props();

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
    const startMinutes =
      event.start.getHours() * 60 + event.start.getMinutes();
    const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
    const durationMinutes = Math.max(endMinutes - startMinutes, 30);
    return (durationMinutes / 60) * 16.67;
  }

  function getEventColor(event: Event): string {
    const importance = event.importance || "medium";
    switch (importance) {
      case "high":
        return "rgba(240, 138, 119, 0.9)";
      case "medium":
        return "rgba(99, 102, 241, 0.8)";
      case "low":
        return "rgba(34, 197, 94, 0.7)";
      default:
        return "rgba(99, 102, 241, 0.8)";
    }
  }

  function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function getEventColumns(events: Event[]): Event[][] {
    if (events.length === 0) return [];

    const sortedEvents = [...events].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
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
      $calendarEvents.find(
        (e) => e.id === (event as any).eventId || e.id === event.id
      ) || event;
    eventActions.editEvent(masterEvent);
    parseRecurrenceForEdit(masterEvent);
  }

  let eventColumns = $derived(getEventColumns(events));
</script>

<div
  class="timeline-popup"
  onclick={() => uiActions.hideTimelinePopup()}
  onkeydown={(e) => e.key === "Escape" && uiActions.hideTimelinePopup()}
  role="button"
  tabindex="-1"
  aria-label="Close timeline"
>
  <div
    class="popup-content"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && uiActions.hideTimelinePopup()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="popup-header">
      <h3>タイムライン - {$selectedDate.toLocaleDateString("ja-JP")}</h3>
      <button
        class="close-button"
        onclick={() => uiActions.hideTimelinePopup()}
        aria-label="Close"
      >
        ✕
      </button>
    </div>

    <div class="timeline-container">
      {#if events.length === 0}
        <p class="empty-state">この日の予定はありません</p>
      {:else}
        <div class="timeline-view">
          <!-- Hour indicators -->
          <div class="timeline-hours">
            {#each Array(24) as _, hour (hour)}
              <div class="hour-indicator" style="top: {hour * 16.67}px;">
                <span class="hour-label">{hour.toString().padStart(2, "0")}:00</span>
                <div class="hour-line"></div>
              </div>
            {/each}
          </div>

          <!-- Current time indicator -->
          <div
            class="current-time-line"
            style="top: {getCurrentTimePositionScaled()}px;"
          ></div>

          <!-- Event columns -->
          <div class="timeline-columns">
            {#each eventColumns as column, columnIndex (columnIndex)}
              <div class="timeline-column" style="width: {100 / eventColumns.length}%;">
                {#each column as event (event.id)}
                  <div
                    class="timeline-event-block"
                    onclick={() => handleEventClick(event)}
                    onkeydown={(e) => e.key === "Enter" && handleEventClick(event)}
                    role="button"
                    tabindex="0"
                    style="
                      top: {getEventPositionScaled(event.start, event.timeLabel)}px;
                      height: {getEventHeightScaled(event)}px;
                      background-color: {getEventColor(event)};
                      color: white;
                    "
                  >
                    <div class="timeline-event-title">{event.title}</div>
                    <div class="timeline-event-time">
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

<style>
  .timeline-popup {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 2500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
  }

  .popup-content {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--ui-border);
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    border-bottom: 1px solid var(--ui-border);
    background: var(--bg-card);
  }

  .popup-header h3 {
    margin: 0;
    font-size: var(--fs-lg);
    font-weight: var(--font-weight-normal);
    color: var(--text-primary);
  }

  .close-button {
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    transition: all 0.15s ease;
  }

  .close-button:hover {
    background: var(--danger);
    color: white;
  }

  .timeline-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-md);
  }

  .empty-state {
    text-align: center;
    color: var(--text-tertiary);
    padding: var(--space-xl);
  }

  .timeline-view {
    position: relative;
    height: 400px;
    min-height: 400px;
  }

  .timeline-hours {
    position: absolute;
    left: 0;
    top: 0;
    width: 50px;
    height: 100%;
  }

  .hour-indicator {
    position: absolute;
    left: 0;
    width: 100%;
    display: flex;
    align-items: center;
  }

  .hour-label {
    font-size: var(--fs-xs);
    color: var(--text-tertiary);
    width: 40px;
    text-align: right;
    padding-right: var(--space-xs);
  }

  .hour-line {
    flex: 1;
    height: 1px;
    background: var(--ui-border);
  }

  .current-time-line {
    position: absolute;
    left: 50px;
    right: 0;
    height: 2px;
    background: var(--danger);
    z-index: 5;
  }

  .current-time-line::before {
    content: "";
    position: absolute;
    left: -4px;
    top: -3px;
    width: 8px;
    height: 8px;
    background: var(--danger);
    border-radius: 50%;
  }

  .timeline-columns {
    position: absolute;
    left: 55px;
    right: 0;
    top: 0;
    height: 100%;
    display: flex;
  }

  .timeline-column {
    position: relative;
    height: 100%;
  }

  .timeline-event-block {
    position: absolute;
    left: 2px;
    right: 2px;
    border-radius: var(--radius-sm);
    padding: var(--space-xs);
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
    min-height: 20px;
  }

  .timeline-event-block:hover {
    transform: scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 10;
  }

  .timeline-event-title {
    font-size: var(--fs-xs);
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .timeline-event-time {
    font-size: 10px;
    opacity: 0.8;
  }
</style>
