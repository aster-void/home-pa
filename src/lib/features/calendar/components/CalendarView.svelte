<script lang="ts">
  import { onMount } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import type { Event } from "$lib/types.ts";
  import {
    calendarState,
    calendarActions,
    dataState,
    uiState,
    uiActions,
    type ExpandedOccurrence,
  } from "$lib/bootstrap/compat.svelte.ts";
  import CalendarHeader from "./CalendarHeader.svelte";
  import CalendarGrid from "./CalendarGrid.svelte";
  import CalendarDebugInfo from "./CalendarDebugInfo.svelte";
  import EventForm from "./EventForm.svelte";
  import TimelinePopup from "./TimelinePopup.svelte";

  // Local reactive variables for calendar state
  let currentMonth = $state(new Date());

  // Track previous month to only fetch when month actually changes
  let previousMonthKey = $state<string | null>(null);

  function getMonthKey(month: Date): string {
    return `${month.getFullYear()}-${month.getMonth()}`;
  }

  function fetchEventsForCurrentMonth() {
    const windowStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 3,
      1,
    );
    const windowEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 4,
      0,
    );
    calendarActions.fetchEvents(windowStart, windowEnd, true);
  }

  // Load events on mount
  onMount(() => {
    const monthKey = getMonthKey(currentMonth);
    previousMonthKey = monthKey;
    fetchEventsForCurrentMonth();
  });

  // Reload events when month actually changes (not on every render)
  $effect(() => {
    const monthKey = getMonthKey(currentMonth);

    // Only fetch if month actually changed (skip initial render/mount)
    if (previousMonthKey !== null && previousMonthKey !== monthKey) {
      previousMonthKey = monthKey;
      fetchEventsForCurrentMonth();
    }
  });

  // Combine regular events with recurring occurrences for display
  let allDisplayEvents = $derived.by(() => {
    const regularEvents = calendarState.events.filter(
      (e) => !e.recurrence || e.recurrence.type === "NONE",
    );

    // Filter occurrences to only include those for events that are still recurring
    const recurringEventIds = new Set(
      calendarState.events
        .filter((e) => e.recurrence && e.recurrence.type !== "NONE")
        .map((e) => e.id),
    );

    const occurrences = calendarState.occurrences
      .filter((occ) => recurringEventIds.has(occ.masterEventId))
      .map(
        (occ: ExpandedOccurrence) =>
          ({
            id: occ.id, // Use unique occurrence ID, not the master event ID
            eventId: occ.masterEventId, // Keep reference to master event ID
            title: occ.title,
            start: occ.start,
            end: occ.end,
            description: occ.description,
            address: occ.location,
            importance: occ.importance,
            timeLabel: occ.timeLabel,
            isRecurring: true,
            originalEventId: occ.masterEventId,
            // New sliding window fields
            isForever: occ.isForever,
          }) as Event & {
            eventId: string;
            isRecurring: boolean;
            originalEventId: string;
            isForever?: boolean;
          },
      );

    return [...regularEvents, ...occurrences].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );
  });

  // Get forever recurring events for special handling
  let foreverEvents = $derived.by(() => {
    return calendarState.occurrences.filter((occ) => occ.isForever);
  });

  // Debug info
  let showDebugInfo = $state(false);

  function navigateMonth(direction: number) {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + direction,
      1,
    );
  }

  function createEvent() {
    uiActions.showEventForm();
  }

  function selectDate(date: Date) {
    const wasAlreadySelected = isSelected(date);
    dataState.setSelectedDate(date);

    if (wasAlreadySelected) {
      if (uiState.showTimelinePopup) {
        uiActions.hideTimelinePopup();
      } else {
        uiActions.showTimelinePopup();
      }
    } else {
      uiActions.hideTimelinePopup();
    }
  }

  function isSelected(date: Date) {
    return date.toDateString() === dataState.selectedDate.toDateString();
  }

  // Assign row indices to events so multi-day events maintain same row across days
  function assignEventRows(events: Event[]): SvelteMap<string, number> {
    const eventRows = new SvelteMap<string, number>();

    // Sort events by start date, then by duration (longer first)
    const sortedEvents = [...events].sort((a, b) => {
      const startDiff = a.start.getTime() - b.start.getTime();
      if (startDiff !== 0) return startDiff;
      // If same start, longer events first
      const aDuration = a.end.getTime() - a.start.getTime();
      const bDuration = b.end.getTime() - b.start.getTime();
      return bDuration - aDuration;
    });

    for (const event of sortedEvents) {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local computation only
      const eventStartDate = new Date(event.start);
      eventStartDate.setHours(0, 0, 0, 0);
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local computation only
      const eventEndDate = new Date(event.end);
      eventEndDate.setHours(0, 0, 0, 0);

      // Find the first available row
      let row = 0;
      let rowAvailable = false;

      while (!rowAvailable) {
        rowAvailable = true;

        // Check if this row is occupied by any conflicting event
        for (const [otherEventId, otherRow] of eventRows.entries()) {
          if (otherRow !== row) continue;

          const otherEvent = events.find((e) => e.id === otherEventId);
          if (!otherEvent) continue;

          // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local computation only
          const otherStartDate = new Date(otherEvent.start);
          otherStartDate.setHours(0, 0, 0, 0);
          // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local computation only
          const otherEndDate = new Date(otherEvent.end);
          otherEndDate.setHours(0, 0, 0, 0);

          // Check if events overlap in date range
          if (
            eventStartDate.getTime() <= otherEndDate.getTime() &&
            eventEndDate.getTime() >= otherStartDate.getTime()
          ) {
            rowAvailable = false;
            break;
          }
        }

        if (!rowAvailable) {
          row++;
        }
      }

      eventRows.set(event.id, row);
    }

    return eventRows;
  }

  // Get the row assignment map for current events (including recurring occurrences)
  let eventRowMap = $derived(assignEventRows(allDisplayEvents));

  // Helper function to get events for timeline (includes timed and all-day events)
  function getEventsForTimeline(events: Event[], targetDate: Date): Event[] {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local computation only
    const targetDateStart = new Date(targetDate);
    targetDateStart.setHours(0, 0, 0, 0);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local computation only
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);
    const targetDateStartTime = targetDateStart.getTime();
    const targetDateEndTime = targetDateEnd.getTime();

    return events.filter((event) => {
      const eventStartTime = event.start.getTime();
      const eventEndTime = event.end.getTime();

      // Include events where target date falls between start and end (inclusive)
      // And only timed/all-day events (exclude some-timing)
      return (
        eventStartTime <= targetDateEndTime &&
        eventEndTime >= targetDateStartTime &&
        (event.timeLabel === "timed" || event.timeLabel === "all-day")
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function parseRecurrenceForEdit(_event: Event) {
    // Passed to TimelinePopup - implementation can be added if needed
  }
</script>

<div
  class="flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-base-300 bg-base-100 backdrop-blur-sm"
  style="scrollbar-width: none; -ms-overflow-style: none;"
>
  <!-- Calendar Header -->
  <CalendarHeader
    {currentMonth}
    calendarError={calendarState.error}
    {showDebugInfo}
    onNavigateMonth={navigateMonth}
    onToggleDebug={() => (showDebugInfo = !showDebugInfo)}
    onCreateEvent={createEvent}
  />

  <!-- Debug Information -->
  {#if showDebugInfo}
    <CalendarDebugInfo
      {currentMonth}
      totalEvents={calendarState.events.length}
      displayEvents={allDisplayEvents.length}
      {foreverEvents}
      isLoading={calendarState.loading}
      error={calendarState.error}
    />
  {/if}

  <!-- Calendar Grid -->
  <CalendarGrid
    {currentMonth}
    selectedDate={dataState.selectedDate}
    events={allDisplayEvents}
    {eventRowMap}
    onSelectDate={selectDate}
  />

  <!-- Timeline Popup -->
  {#if uiState.showTimelinePopup}
    <TimelinePopup
      events={getEventsForTimeline(allDisplayEvents, dataState.selectedDate)}
      {parseRecurrenceForEdit}
    />
  {/if}

  <!-- Event Form Modal -->
  {#if uiState.showEventForm}
    <EventForm />
  {/if}
</div>
