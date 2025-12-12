<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  // LogsView removed from header; settings panel is minimal
  import LogsView from "$lib/features/logs/components/LogsView.svelte";
  import CircularTimelineCss from "./CircularTimelineCss.svelte";
  import { calendarState, dataState } from "$lib/bootstrap/index.svelte.ts";
  import {
    scheduleActions,
    pendingSuggestions,
    acceptedSuggestions,
    tasks,
  } from "$lib/bootstrap/compat.svelte.ts";
  import type { Event, Gap } from "$lib/types.ts";
  import { GapFinder } from "$lib/features/assistant/services/gap-finder.ts";
  import { get } from "svelte/store";
  import { startOfDay, parseTimeOnDate } from "$lib/utils/date-utils.ts";

  // Local state
  // Settings panel toggle (replaces top header controls)
  let showSettings = $state(false);

  // Active hours (day boundaries for gap finding)
  let activeStart = $state("08:00");
  let activeEnd = $state("23:00");

  // Task list (synced from store)
  let taskList = $state(get(tasks));

  // Selected items for details display
  let _selectedEvent = $state<Event | null>(null);
  let _selectedGap = $state<Gap | null>(null);

  function dateKey(date: Date): string {
    return startOfDay(date).toISOString().slice(0, 10);
  }

  function sortEventsByStart(events: Event[]): Event[] {
    return [...events].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  }

  function formatEventTime(event: Event): string {
    if (event.timeLabel === "all-day") return "終日";
    if (event.timeLabel === "some-timing") return "どこかのタイミングで";

    const toTime = (value: Date) => value.toTimeString().slice(0, 5);
    return `${toTime(new Date(event.start))} - ${toTime(new Date(event.end))}`;
  }

  function formatDateLabel(date: Date): string {
    return startOfDay(date).toLocaleDateString("ja-JP");
  }

  let unsubscribeTasks: (() => void) | undefined;

  onMount(() => {
    const now = new Date(Date.now());
    dataState.setSelectedDate(startOfDay(now));

    // Subscribe to tasks store
    unsubscribeTasks = tasks.subscribe((value) => (taskList = value));
  });

  onDestroy(() => {
    if (unsubscribeTasks) unsubscribeTasks();
  });

  // Reactively compute schedule signature for auto-generation
  let scheduleSignature = $derived.by(() => {
    const now = new Date();
    const todayKey = dateKey(now);
    const currentDate = startOfDay(dataState.selectedDate);

    // Only generate schedule for today
    if (dateKey(currentDate) !== todayKey) return null;

    return `${dateKey(currentDate)}|t${taskList.length}|g${computedGaps.length}`;
  });

  // Track last schedule signature to avoid re-triggering
  let lastScheduleSignature = $state<string | null>(null);

  // Auto-generate schedule when signature changes
  $effect(() => {
    if (scheduleSignature && scheduleSignature !== lastScheduleSignature) {
      lastScheduleSignature = scheduleSignature;
      scheduleActions.regenerate(taskList, { gaps: computedGaps });
    }
  });

  function overlapsDay(eventStart: Date, eventEnd: Date, day: Date) {
    const dayStart = startOfDay(day);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- temporary date for day boundary calculation
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    return (
      eventStart.getTime() <= dayEnd.getTime() &&
      eventEnd.getTime() >= dayStart.getTime()
    );
  }

  function toGapEventForDay(e: Event, day: Date) {
    const dayStart = "00:00";
    const dayEnd = "23:59";

    if (e.timeLabel === "all-day") {
      return { id: e.id, title: e.title, start: dayStart, end: dayEnd };
    }

    const targetDay = startOfDay(day);
    const startDay = startOfDay(e.start);
    const endDay = startOfDay(e.end);

    const startsToday = startDay.getTime() === targetDay.getTime();
    const endsToday = endDay.getTime() === targetDay.getTime();

    const startTime = startsToday
      ? new Date(e.start).toTimeString().slice(0, 5)
      : dayStart;
    const endTime = endsToday
      ? new Date(e.end).toTimeString().slice(0, 5)
      : dayEnd;

    return {
      id: e.id,
      title: e.title,
      start: startTime,
      end: endTime,
    };
  }

  // Reactively compute events for selected day
  let selectedDayEvents = $derived.by(() => {
    const events = calendarState.events;
    const occurrences = calendarState.occurrences;
    const currentDate = startOfDay(dataState.selectedDate);

    const combined: Event[] = [
      ...events,
      ...occurrences.map(
        (occ) =>
          ({
            id: occ.id,
            title: occ.title,
            start: occ.start,
            end: occ.end,
            description: occ.description,
            address: occ.location,
            importance: occ.importance,
            timeLabel: occ.timeLabel,
          }) as Event,
      ),
    ];

    const todaysEvents = combined.filter((e) =>
      overlapsDay(new Date(e.start), new Date(e.end), currentDate),
    );

    return sortEventsByStart(todaysEvents);
  });

  // Reactively compute gaps based on selected day events
  let computedGaps = $derived.by(() => {
    const gf = new GapFinder({ dayStart: activeStart, dayEnd: activeEnd });
    const currentDate = startOfDay(dataState.selectedDate);

    const mapped = selectedDayEvents.map((e) =>
      toGapEventForDay(e, currentDate),
    );
    return gf.findGaps(mapped);
  });

  // Helper to get task title from memoId
  function getTaskTitle(memoId: string): string {
    const task = taskList.find((t) => t.id === memoId);
    return task?.title ?? "Task";
  }

  // Convert accepted suggestions to Event format for display list
  let acceptedEvents = $derived.by(() => {
    const now = new Date(Date.now());
    const isTodaySelected = dateKey(dataState.selectedDate) === dateKey(now);
    if (!isTodaySelected) return [];

    const base = startOfDay(dataState.selectedDate);
    return $acceptedSuggestions.map((block) => {
      const title = getTaskTitle(block.memoId);

      return {
        id: `accepted-${block.suggestionId}`,
        title,
        start: parseTimeOnDate(base, block.startTime),
        end: parseTimeOnDate(base, block.endTime),
        description: "Accepted suggestion",
        timeLabel: "timed",
      } as Event;
    });
  });

  let displayEvents = $derived.by(() =>
    [...selectedDayEvents, ...acceptedEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    ),
  );

  // Suggestion event handlers
  async function handleSuggestionAccept(event: CustomEvent<string>) {
    const suggestionId = event.detail;
    await scheduleActions.accept(suggestionId, taskList);
  }

  async function handleSuggestionSkip(event: CustomEvent<string>) {
    const suggestionId = event.detail;
    await scheduleActions.skip(suggestionId, taskList);
  }

  async function handleSuggestionDelete(event: CustomEvent<string>) {
    const suggestionId = event.detail;
    await scheduleActions.deleteAccepted(suggestionId, taskList);
  }

  async function handleSuggestionResize(
    event: CustomEvent<{ suggestionId: string; newDuration: number }>,
  ) {
    const { suggestionId, newDuration } = event.detail;
    await scheduleActions.updateAcceptedDuration(
      suggestionId,
      newDuration,
      taskList,
    );
  }

  // Component-level event handling is wired directly on the child via on: handlers below
</script>

<div class="relative m-0 flex h-full w-full flex-col overflow-hidden p-0">
  <!-- Minimal top-left Settings trigger -->
  <button
    class="fixed top-2 left-2 z-[250] cursor-pointer border-none bg-transparent p-1 text-xs text-base-content/60 transition-colors duration-200 hover:text-base-content"
    onclick={() => (showSettings = true)}>settings</button
  >

  <!-- Main Content -->
  <main
    class="relative flex h-full min-h-0 w-full flex-1 flex-row items-start overflow-x-hidden overflow-y-auto"
  >
    <!-- Timeline Section - Takes majority of space -->
    <section
      class="z-10 m-4 flex w-full min-w-0 flex-1 items-stretch justify-center overflow-y-visible"
    >
      <div
        class="flex min-h-0 w-full flex-1 flex-col items-center gap-4 overflow-y-visible"
      >
        <div
          class="relative h-[min(70vw,60vh)] w-[min(70vw,60vh)] flex-shrink-0 overflow-visible"
        >
          <CircularTimelineCss
            externalGaps={computedGaps}
            pendingSuggestions={$pendingSuggestions}
            acceptedSuggestions={$acceptedSuggestions}
            {getTaskTitle}
            on:eventSelected={(e: CustomEvent<Event>) =>
              (_selectedEvent = e.detail)}
            on:gapSelected={(
              e: CustomEvent<{
                start: string;
                end: string;
                duration: number;
                startAngle: number;
                endAngle: number;
              }>,
            ) => {
              const gap = e.detail;
              _selectedGap = {
                gapId: `gap-${gap.start}-${gap.end}`,
                start: gap.start,
                end: gap.end,
                duration: gap.duration,
              };
            }}
            on:suggestionAccept={handleSuggestionAccept}
            on:suggestionSkip={handleSuggestionSkip}
            on:suggestionDelete={handleSuggestionDelete}
            on:suggestionResize={handleSuggestionResize}
          />
        </div>

        <div
          class="mb-[calc(var(--bottom-nav-height,80px)+1rem)] w-full max-w-[720px] rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm"
        >
          <div
            class="mb-4 flex items-center justify-between border-b border-base-300 pb-2"
          >
            <h3 class="m-0 text-lg font-normal">Events</h3>
            <span
              class="rounded-full bg-[color:var(--color-accent)]/10 px-3 py-1 text-sm font-normal text-[color:var(--color-accent)]"
              >{formatDateLabel(dataState.selectedDate)}</span
            >
          </div>
          {#if displayEvents.length === 0}
            <p class="m-0 py-6 text-center text-sm text-base-content/40">
              この日の予定はありません
            </p>
          {:else}
            <ul class="m-0 flex list-none flex-col gap-2 p-0">
              {#each displayEvents as event (event.id)}
                <li
                  class="flex items-center justify-between rounded-lg border border-transparent bg-base-200 p-2 px-4 transition-all duration-200 hover:border-base-300 hover:bg-base-300"
                >
                  <div class="text-sm font-normal">{event.title}</div>
                  <div
                    class="rounded bg-base-100 px-2 py-0.5 text-xs text-base-content/60"
                  >
                    {formatEventTime(event)}
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </section>

    <!-- Content Section (legacy, commented out)
    <section class="content-section">
     
      {#if selectedGap}
        <div class="gap-details">
          <h3>Free Time: {selectedGap.start} - {selectedGap.end}</h3>
          <p>{selectedGap.duration} minutes available</p>
          <div class="gap-actions">
            <button class="action-btn primary">Add Task</button>
            <button class="action-btn secondary">Take Break</button>
          </div>
        </div>
      {/if}

      
      {#if _selectedEvent}
        <div class="event-details">
          <h3>{_selectedEvent.title}</h3>
          <p>{_selectedEvent.start.toTimeString().slice(0, 5)} - {_selectedEvent.end.toTimeString().slice(0, 5)}</p>
          {#if _selectedEvent.description}
            <p class="description">{_selectedEvent.description}</p>
          {/if}
          <div class="event-actions">
            <button class="action-btn secondary">Edit</button>
            <button class="action-btn danger">Delete</button>
          </div>
        </div>
      {/if}
    </section>-->
  </main>

  <!-- Settings Panel (bottom sheet) -->
  {#if showSettings}
    <div
      class="fixed inset-0 modal-backdrop z-[499] animate-[fadeIn_0.2s_ease] bg-black/40 backdrop-blur-sm"
      onclick={() => (showSettings = false)}
      onkeydown={(e) => e.key === "Escape" && (showSettings = false)}
      role="button"
      tabindex="-1"
      aria-label="Close settings"
    ></div>
    <section
      class="fixed right-0 bottom-[calc(var(--bottom-nav-height,80px)+env(safe-area-inset-bottom))] left-0 z-[500] modal-box flex max-h-[calc(50vh-var(--bottom-nav-height,80px))] animate-[slideUp_0.3s_ease] flex-col overflow-y-auto rounded-t-xl border-t border-base-300 bg-base-100 p-6 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div
        class="mb-6 flex items-center justify-between border-b border-base-300 pb-4"
      >
        <h3 class="m-0 text-lg font-normal">Settings</h3>
        <button
          class="btn h-8 min-h-8 w-8 p-0 btn-ghost transition-all duration-200 btn-sm hover:bg-error hover:text-white"
          onclick={() => (showSettings = false)}
          aria-label="Close">✕</button
        >
      </div>
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2 text-xs text-base-content/60">
          <span>Active hours</span>
          <div class="inline-flex items-center gap-1.5">
            <input
              type="time"
              bind:value={activeStart}
              class="input-bordered input input-sm"
            />
            <span>–</span>
            <input
              type="time"
              bind:value={activeEnd}
              class="input-bordered input input-sm"
            />
          </div>
        </div>
        <div class="mt-2">
          <LogsView />
        </div>
      </div>
    </section>
  {/if}
</div>
