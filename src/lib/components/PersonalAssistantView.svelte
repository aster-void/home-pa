<script lang="ts">
  import { onMount } from "svelte";
  import { CircularTimelineCss } from "./pa_components/index.js";
  import {
    calendarEvents,
    calendarOccurrences,
    selectedDate,
    scheduleActions,
    scheduledBlocks,
    pendingSuggestions,
    acceptedSuggestions,
    tasks,
    dayBoundaries,
  } from "../stores/index.js";
  import { eventActions } from "../stores/actions/eventActions.js";
  import { enrichedGaps } from "../stores/gaps.js";
  import type { Event, Gap } from "../types.js";
  import { GapFinder } from "../services/gap-finder.js";
  import { get } from "svelte/store";

  // Local state
  let selectedGap = $state<Gap | null>(null);
  let selectedEvent = $state<Event | null>(null);

  // Active hours (day boundaries for gap finding)
  let activeStart = $state("08:00");
  let activeEnd = $state("23:00");

  // Computed gaps using GapFinder for the selected day
  let computedGaps = $state<Gap[]>([]);
  let selectedDayEvents = $state<Event[]>([]);
  let lastAutoScheduleKey = $state<string | null>(null);
  let taskList = $state(get(tasks));

  function startOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

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

  onMount(() => {
    selectedDate.set(startOfDay(new Date()));
  });

  $effect(() => {
    const unsubscribeTasks = tasks.subscribe((value) => (taskList = value));
    return () => unsubscribeTasks();
  });

  // Keep active hours in sync with shared day boundaries
  $effect(() => {
    const unsubscribeBoundaries = dayBoundaries.subscribe((value) => {
      activeStart = value.dayStart;
      activeEnd = value.dayEnd;
      recomputeGaps();
    });
    return () => unsubscribeBoundaries();
  });

  function buildScheduleSignature(date: Date): string {
    const taskList = get(tasks);
    const gapsList = get(enrichedGaps);
    return `${dateKey(date)}|t${taskList.length}|g${gapsList.length}`;
  }

  async function maybeAutoGenerateSchedule() {
    const todayKey = dateKey(new Date());
    const currentDate = startOfDay(get(selectedDate));
    if (dateKey(currentDate) !== todayKey) {
      return;
    }

    const signature = buildScheduleSignature(currentDate);
    if (signature === lastAutoScheduleKey) return;

    lastAutoScheduleKey = signature;
    await scheduleActions.regenerate(get(tasks), { gaps: get(enrichedGaps) });
  }

  function overlapsDay(eventStart: Date, eventEnd: Date, day: Date) {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
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

    const targetDay = new Date(day);
    targetDay.setHours(0, 0, 0, 0);
    const startDay = new Date(e.start);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(e.end);
    endDay.setHours(0, 0, 0, 0);

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

  function recomputeGaps() {
    const gf = new GapFinder({ dayStart: activeStart, dayEnd: activeEnd });
    const events = get(calendarEvents) as Event[];
    const occurrences = get(calendarOccurrences);
    const currentDate = startOfDay(get(selectedDate));

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
    const mapped = todaysEvents.map((e) => toGapEventForDay(e, currentDate));

    selectedDayEvents = sortEventsByStart(todaysEvents);
    computedGaps = gf.findGaps(mapped);
  }

  // Recompute gaps when active hours, events, or date change
  $effect(() => {
    // Subscribe to reactive stores and recompute on change
    const unsubscribeEvents = calendarEvents.subscribe(() => recomputeGaps());
    const unsubscribeOccurrences = calendarOccurrences.subscribe(() =>
      recomputeGaps(),
    );
    const unsubscribeDate = selectedDate.subscribe(() => recomputeGaps());

    recomputeGaps();

    return () => {
      unsubscribeEvents();
      unsubscribeOccurrences();
      unsubscribeDate();
    };
  });

  // Auto-generate schedule for today only
  $effect(() => {
    void maybeAutoGenerateSchedule();
  });

  function parseTimeOnDate(base: Date, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const next = new Date(base);
    next.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    return next;
  }

  // Helper to get task title from memoId
  function getTaskTitle(memoId: string): string {
    const task = taskList.find((t) => t.id === memoId);
    return task?.title ?? "Task";
  }

  // Convert accepted suggestions to Event format for display list
  let acceptedEvents = $derived.by(() => {
    const isTodaySelected = dateKey($selectedDate) === dateKey(new Date());
    if (!isTodaySelected) return [];

    const base = startOfDay($selectedDate);
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

<div class="personal-assistant-view">
  <!-- Main Content -->
  <main class="pa-main">
    <!-- Timeline Section - Takes majority of space -->
    <section class="timeline-section">
      <div class="timeline-stack">
      <div class="timeline-container">
        <CircularTimelineCss
          externalGaps={computedGaps}
          pendingSuggestions={$pendingSuggestions}
          acceptedSuggestions={$acceptedSuggestions}
          {getTaskTitle}
          on:eventSelected={(e: any) => (selectedEvent = e.detail)}
          on:eventDelete={async (e: any) => {
            if (await eventActions.delete(e.detail.id)) {
              selectedEvent = null;
            }
          }}
          on:gapSelected={(e: any) => (selectedGap = e.detail)}
          on:suggestionAccept={handleSuggestionAccept}
          on:suggestionSkip={handleSuggestionSkip}
          on:suggestionDelete={handleSuggestionDelete}
          on:suggestionResize={handleSuggestionResize}
        />
        </div>

        <div class="event-list-panel">
          <div class="event-list-header">
            <h3>Events</h3>
            <span class="event-list-date">{formatDateLabel($selectedDate)}</span
            >
          </div>
          {#if displayEvents.length === 0}
            <p class="event-empty">この日の予定はありません</p>
          {:else}
            <ul class="event-list">
              {#each displayEvents as event (event.id)}
                <li class="event-row">
                  <div class="event-row-title">{event.title}</div>
                  <div class="event-row-time">{formatEventTime(event)}</div>
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

      
      {#if selectedEvent}
        <div class="event-details">
          <h3>{selectedEvent.title}</h3>
          <p>{selectedEvent.start.toTimeString().slice(0, 5)} - {selectedEvent.end.toTimeString().slice(0, 5)}</p>
          {#if selectedEvent.description}
            <p class="description">{selectedEvent.description}</p>
          {/if}
          <div class="event-actions">
            <button class="action-btn secondary">Edit</button>
            <button class="action-btn danger">Delete</button>
          </div>
        </div>
      {/if}
    </section>-->
  </main>
</div>

<style>
  .personal-assistant-view {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* Main Layout - Side by side on desktop */
  .pa-main {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    flex: 1;
  }

  /* Timeline Section - Takes full width with margins */
  .timeline-section {
    flex: 1;
    width: 100%;
    min-width: 0; /* Allow shrinking */
    display: flex;
    align-items: stretch;
    justify-content: center;
    z-index: 10;
    margin: var(--space-md);
    overflow-y: visible;
  }

  .timeline-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
    min-height: 0;
    flex: 1;
    align-items: center;
    overflow-y: visible;
  }

  .timeline-container {
    width: min(70vw, 60vh);
    height: min(70vw, 60vh);
    flex-shrink: 0;
    position: relative;
    overflow: visible;
  }

  .event-list-panel {
    width: 100%;
    max-width: 720px;
    background: var(--bg-card);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    box-shadow: var(--shadow-soft);
    margin-bottom: calc(var(--bottom-nav-height, 80px) + var(--space-md));
  }

  .event-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--ui-border);
  }

  .event-list-header h3 {
    margin: 0;
    font-size: var(--fs-lg);
    font-weight: var(--font-weight-normal);
    color: var(--text-primary);
  }

  .event-list-date {
    color: var(--accent-primary);
    font-size: var(--fs-sm);
    font-weight: var(--font-weight-normal);
    background: rgba(240, 138, 119, 0.1);
    padding: 4px 12px;
    border-radius: var(--radius-full, 20px);
  }

  .event-empty {
    margin: 0;
    color: var(--text-tertiary);
    font-size: var(--fs-sm);
    text-align: center;
    padding: var(--space-lg) 0;
  }

  .event-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .event-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-secondary);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    transition: all 0.15s ease;
  }

  .event-row:hover {
    background: var(--bg-tertiary);
    border-color: var(--ui-border);
  }

  .event-row-title {
    color: var(--text-primary);
    font-weight: var(--font-weight-normal);
    font-size: var(--fs-sm);
  }

  .event-row-time {
    color: var(--text-secondary);
    font-size: var(--fs-xs);
    font-family: var(--font-sans);
    background: var(--bg-card);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
  }

  /* Content Section 
  .content-section {
    position: absolute;
    right: 0;
    top: 0;
    width: 50vw;
    height: 100vh;
    padding: calc(var(--space-lg) + 60px) var(--space-md) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    overflow-y: auto;
    background: var(--white);
    z-index: 5;
  }*/

  /* Gap Details 
  .gap-details {
    background: var(--coral);
    color: var(--white);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 20px rgba(240, 138, 119, 0.3);
  }

  .gap-details h3 {
    margin: 0 0 var(--space-sm) 0;
    font-family: var(--font-family);
    font-size: var(--fs-md);
    font-weight: var(--font-weight-bold);
  }

  .gap-details p {
    margin: 0 0 var(--space-md) 0;
    font-family: var(--font-family);
    font-size: var(--fs-sm);
    opacity: 0.9;
  }

  .gap-actions {
    display: flex;
    gap: var(--space-sm);
  }

  /* Event Details 
  .event-details {
    background: var(--navy-50);
    border: 2px solid var(--navy-200);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
  }

  .event-details h3 {
    margin: 0 0 var(--space-sm) 0;
    font-family: var(--font-family);
    font-size: var(--fs-md);
    font-weight: var(--font-weight-bold);
    color: var(--navy-900);
  }

  .event-details p {
    margin: 0 0 var(--space-sm) 0;
    font-family: var(--font-family);
    font-size: var(--fs-sm);
    color: var(--navy-600);
  }

  .event-details .description {
    font-style: italic;
    color: var(--navy-500);
  }

  .event-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }*/

  /* Action Buttons 
  .action-btn {
    padding: var(--space-sm) var(--space-md);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--fs-sm);
    font-family: var(--font-family);
    font-weight: var(--font-weight-bold);
    transition: all 0.2s ease;
  }

  .action-btn.primary {
    background: var(--coral);
    color: var(--white);
  }

  .action-btn.primary:hover {
    background: var(--navy-600);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(240, 138, 119, 0.3);
  }

  .action-btn.secondary {
    background: var(--navy-100);
    color: var(--navy-700);
  }

  .action-btn.secondary:hover {
    background: var(--navy-200);
    transform: translateY(-2px);
  }

  .action-btn.danger {
    background: var(--red-100);
    color: var(--red-700);
  }

  .action-btn.danger:hover {
    background: var(--red-200);
    transform: translateY(-2px);
  }*/
  /* Responsive Design */
  @media (max-width: 768px) {
    .pa-main {
      flex-direction: column;
      overflow-x: hidden;
    }

    .timeline-section {
      flex: 1;
      width: calc(100% - 2 * var(--space-md));
      min-height: 0;
      margin: var(--space-md);
    }

    .timeline-stack {
      width: 100%;
      max-width: 100%;
    }

    .event-list-panel {
      max-width: 100%;
      box-sizing: border-box;
    }

    .timeline-container {
      max-width: none;
      max-height: none;
    }
  }
</style>
