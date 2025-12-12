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

<div
  class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100"
>
  <div
    class="grid flex-shrink-0 grid-cols-7 border-b border-base-300 bg-base-200"
  >
    <div class="p-2 text-center text-sm font-semibold text-base-content/60">
      日
    </div>
    <div class="p-2 text-center text-sm font-semibold text-base-content/60">
      月
    </div>
    <div class="p-2 text-center text-sm font-semibold text-base-content/60">
      火
    </div>
    <div class="p-2 text-center text-sm font-semibold text-base-content/60">
      水
    </div>
    <div class="p-2 text-center text-sm font-semibold text-base-content/60">
      木
    </div>
    <div class="p-2 text-center text-sm font-semibold text-base-content/60">
      金
    </div>
    <div class="p-2 text-center text-sm font-semibold text-base-content/60">
      土
    </div>
  </div>

  <div class="grid flex-1 grid-cols-7 overflow-y-auto">
    {#each getCalendarDays(currentMonth) as day (day.getTime())}
      <div
        class="relative flex min-h-[72px] cursor-pointer flex-col border border-base-300 bg-base-100 p-1 transition-all duration-200
          {isToday(day) ? 'bg-[#F08A77]/[0.08]' : ''}
          {isSelected(day, selectedDate)
          ? 'border-[#0066CC] bg-[#3BADE3]/[0.1]'
          : ''}
          {!isCurrentMonth(day, currentMonth) ? 'opacity-30' : ''}
          hover:bg-base-200"
        onclick={() => onSelectDate(day)}
        onkeydown={(e) => e.key === "Enter" && onSelectDate(day)}
        role="button"
        tabindex="0"
      >
        <div
          class="flex-shrink-0 text-center text-[0.85rem] font-medium text-base-content {isToday(
            day,
          )
            ? 'mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#F08A77] font-bold text-white'
            : ''}"
        >
          {day.getDate()}
        </div>
        <div class="relative mt-1 min-h-[36px] flex-1">
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
              class="absolute right-0 left-0 h-4 cursor-pointer overflow-hidden px-1 py-0.5 text-[0.625rem] leading-[12px] font-medium text-ellipsis whitespace-nowrap text-white transition-transform duration-200
                {barPosition === 'start' ? '-mr-px rounded-l' : ''}
                {barPosition === 'middle' ? '-mx-px' : ''}
                {barPosition === 'end' ? '-ml-px rounded-r' : ''}
                {barPosition === 'single' ? 'rounded' : ''}
                hover:z-[1] hover:translate-y-[-1px] hover:shadow-md"
              style="background-color: {getEventColor(
                truncatedEvent,
              )}; top: {rowIndex * 18}px;"
            >
              {#if showLabel}
                <span class="flex items-center gap-1">
                  {truncatedEvent.title}
                  {#if (truncatedEvent as Event & { isForever?: boolean }).isForever}
                    <span
                      class="text-[0.5rem] opacity-80"
                      title="Forever recurring">∞</span
                    >
                  {/if}
                  {#if (truncatedEvent as Event & { isDuplicate?: boolean }).isDuplicate}
                    <span
                      class="text-[0.5rem] opacity-60"
                      title="Auto-generated duplicate">↻</span
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
