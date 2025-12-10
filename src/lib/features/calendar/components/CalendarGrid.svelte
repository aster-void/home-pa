<script lang="ts">
  import type { Event } from "$lib/types.ts";
  import {
    getCalendarDays,
    isToday,
    isCurrentMonth,
    isSelected,
    getEventsForDate,
    isFirstDayOfEvent,
    getEventBarPosition,
    getEventColor,
  } from "../utils/index.ts";

  interface Props {
    currentMonth: Date;
    selectedDate: Date;
    events: Event[];
    eventRowMap: Map<string, number>;
    onSelectDate: (date: Date) => void;
  }

  let { currentMonth, selectedDate, events, eventRowMap, onSelectDate }: Props =
    $props();
</script>

<div class="calendar-grid">
  <div class="calendar-weekdays">
    <div class="weekday">日</div>
    <div class="weekday">月</div>
    <div class="weekday">火</div>
    <div class="weekday">水</div>
    <div class="weekday">木</div>
    <div class="weekday">金</div>
    <div class="weekday">土</div>
  </div>

  <div class="calendar-days">
    {#each getCalendarDays(currentMonth) as day (day.getTime())}
      <div
        class="calendar-day {isToday(day) ? 'today' : ''} {isSelected(
          day,
          selectedDate,
        )
          ? 'selected'
          : ''} {!isCurrentMonth(day, currentMonth) ? 'other-month' : ''}"
        onclick={() => onSelectDate(day)}
        onkeydown={(e) => e.key === "Enter" && onSelectDate(day)}
        role="button"
        tabindex="0"
      >
        <div class="day-number">{day.getDate()}</div>
        <div class="day-events">
          {#each getEventsForDate(events, day) as truncatedEvent (truncatedEvent.id)}
            {@const originalEvent =
              events.find((e) => e.id === truncatedEvent.id) || truncatedEvent}
            {@const barPosition = getEventBarPosition(
              originalEvent.start,
              originalEvent.end,
              day,
            )}
            {@const showLabel = isFirstDayOfEvent(originalEvent, day)}
            {@const rowIndex = eventRowMap.get(truncatedEvent.id) ?? 0}
            <div
              class="event-bar {barPosition}"
              style="background-color: {getEventColor(
                truncatedEvent,
              )}; top: {rowIndex * 18}px;"
            >
              {#if showLabel}
                <span class="event-label">
                  {truncatedEvent.title}
                  {#if (truncatedEvent as any).isForever}
                    <span class="forever-indicator" title="Forever recurring"
                      >∞</span
                    >
                  {/if}
                  {#if (truncatedEvent as any).isDuplicate}
                    <span class="duplicate-indicator" title="Auto-generated duplicate"
                      >↻</span
                    >
                  {/if}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .calendar-grid {
    display: flex;
    flex-direction: column;
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--glass-border);
    flex: 1;
    min-height: 0;
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--glass-border);
    flex-shrink: 0;
  }

  .weekday {
    padding: var(--space-sm);
    text-align: center;
    font-weight: 600;
    font-size: var(--fs-sm);
    color: var(--muted);
    font-family: var(--font-display);
  }

  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    overflow-y: auto;
  }

  .calendar-day {
    min-height: 72px;
    padding: 0.25rem;
    border: 1px solid var(--glass-border);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    background: var(--bg-card);
    display: flex;
    flex-direction: column;
  }

  .calendar-day:hover {
    background: var(--bg-secondary);
  }

  .calendar-day.today {
    background: rgba(240, 138, 119, 0.08);
  }

  .calendar-day.today .day-number {
    background: var(--coral);
    color: white;
    border-radius: 50%;
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    margin: 0 auto;
  }

  .calendar-day.selected {
    background: rgba(59, 173, 227, 0.1);
    border-color: var(--primary);
  }

  .calendar-day.other-month {
    opacity: 0.3;
  }

  .day-number {
    text-align: center;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text);
    font-family: var(--font-display);
    flex-shrink: 0;
  }

  .day-events {
    flex: 1;
    position: relative;
    min-height: 36px;
    margin-top: 0.25rem;
  }

  .event-bar {
    position: absolute;
    left: 0;
    right: 0;
    padding: 0.125rem 0.25rem;
    font-size: 0.625rem;
    font-weight: 500;
    color: white;
    border-radius: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 16px;
    line-height: 12px;
    transition: transform 0.15s ease;
    cursor: pointer;
    font-family: var(--font-family);
  }

  .event-bar:hover {
    transform: translateY(-1px);
    z-index: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .event-bar.start {
    border-radius: 4px 0 0 4px;
    margin-right: -1px;
  }

  .event-bar.middle {
    border-radius: 0;
    margin-left: -1px;
    margin-right: -1px;
  }

  .event-bar.end {
    border-radius: 0 4px 4px 0;
    margin-left: -1px;
  }

  .event-bar.single {
    border-radius: 4px;
  }

  .event-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .forever-indicator {
    font-size: 0.5rem;
    opacity: 0.8;
  }

  .duplicate-indicator {
    font-size: 0.5rem;
    opacity: 0.6;
  }

  @media (max-width: 768px) {
    .calendar-day {
      min-height: 60px;
      padding: 0.125rem;
    }

    .day-number {
      font-size: 0.75rem;
    }

    .event-bar {
      font-size: 0.5rem;
      height: 14px;
      line-height: 10px;
    }
  }
</style>
