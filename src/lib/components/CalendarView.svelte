<script lang="ts">
  import { get } from "svelte/store";
  import type { Event } from "../types.js";
  import type { AppController } from "../controllers/app.controller.svelte.ts";
  import { events, eventOperations, selectedDate } from "../stores/data.js";

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Local reactive variables that sync with controller stores
  let currentViewMode = $state("month");
  let localSelectedDate = $state(new Date());
  let currentMonth = $state(new Date());
  let eventTitle = $state("");
  let eventStart = $state("");
  let eventEnd = $state("");
  let isEventEditing = $state(false);
  let showEventForm = $state(false);
  let showTimelinePopup = $state(false);

  // Subscribe to controller store changes
  $effect(() => {
    if (controller) {
      const unsubscribe1 = controller.viewMode.subscribe((value) => {
        currentViewMode = value;
      });

      const unsubscribe2 = selectedDate.subscribe((date: Date) => {
        localSelectedDate = new Date(date);
      });

      const unsubscribe3 = controller.eventForm.subscribe((form) => {
        eventTitle = form.title;
        eventStart = form.start;
        eventEnd = form.end;
        isEventEditing = form.isEditing;
      });

      return () => {
        unsubscribe1();
        unsubscribe2();
        unsubscribe3();
      };
    }
  });

  // Sync form changes back to controller store
  $effect(() => {
    if (controller) {
      controller.eventForm.update((form) => ({
        ...form,
        title: eventTitle,
        start: eventStart,
        end: eventEnd,
      }));
    }
  });

  // Calendar grid generation
  function getCalendarDays() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0); // Last day of the month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    // Calculate how many days we need to show
    // We need to go from startDate to the end of the month plus enough days to complete the last week
    const endOfMonth = new Date(lastDay);
    const daysToCompleteLastWeek = (6 - lastDay.getDay()) % 7; // Days needed to complete the last week
    const totalDaysNeeded =
      Math.ceil(
        (endOfMonth.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) +
      1 +
      daysToCompleteLastWeek;

    // Generate days dynamically to cover the full month plus complete weeks
    for (let i = 0; i < totalDaysNeeded; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  function isToday(date: Date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function isSelected(date: Date) {
    return date.toDateString() === localSelectedDate.toDateString();
  }

  function isCurrentMonth(date: Date) {
    return date.getMonth() === currentMonth.getMonth();
  }

  function selectDate(date: Date) {
    // Check if this date is already selected
    const wasAlreadySelected = isSelected(date);

    // Always update the selected date
    controller.setSelectedDate(date);

    // Only show popup if clicking on the already selected date
    if (wasAlreadySelected) {
      showTimelinePopup = !showTimelinePopup;
    } else {
      showTimelinePopup = false;
    }
  }

  function navigateMonth(direction: number) {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + direction,
      1,
    );
  }

  function createEvent() {
    const startTime = new Date(localSelectedDate);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(10, 0, 0, 0);

    // Set the form data
    controller.eventForm.set({
      title: "",
      start: startTime.toISOString().slice(0, 16),
      end: endTime.toISOString().slice(0, 16),
      isEditing: false,
      editingId: null,
    });

    // Also update local variables
    eventTitle = "";
    eventStart = startTime.toISOString().slice(0, 16);
    eventEnd = endTime.toISOString().slice(0, 16);
    isEventEditing = false;

    showEventForm = true;
  }

  function getEventColor(event: Event): string {
    // Simple color assignment based on event title hash
    const colors = [
      "#3b82f6",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
    ];
    const hash = event.title.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function getCurrentTimePositionScaled(): number {
    const now = new Date();
    const currentDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const localSelectedDateOnly = new Date(
      localSelectedDate.getFullYear(),
      localSelectedDate.getMonth(),
      localSelectedDate.getDate(),
    );

    // Only show current time line if it's today
    if (currentDate.toDateString() !== localSelectedDateOnly.toDateString()) {
      return -1000; // Hide the line
    }

    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours * 60 + minutes) * (400 / 1440); // Scale to fit 400px height
  }

  function getEventPositionScaled(startTime: Date): number {
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    return (hours * 60 + minutes) * (400 / 1440); // Scale to fit 400px height
  }

  function getEventHeight(event: Event): number {
    const startTime = event.start;
    const endTime = event.end;
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.max(durationMs / (1000 * 60), 30); // Minimum 30 minutes
    return durationMinutes;
  }

  function getEventHeightScaled(event: Event): number {
    const startTime = event.start;
    const endTime = event.end;
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.max(durationMs / (1000 * 60), 15); // Minimum 15 minutes scaled
    return durationMinutes * (400 / 1440); // Scale to fit 400px height
  }

  // Helper function to check if an event should be shown on a specific date
  function shouldShowEventOnDate(event: Event, targetDate: Date): boolean {
    const eventStartDate = new Date(event.start);
    const eventEndDate = new Date(event.end);
    const targetDateString = targetDate.toDateString();

    // Show event if it starts OR ends on the target date
    return (
      eventStartDate.toDateString() === targetDateString ||
      eventEndDate.toDateString() === targetDateString
    );
  }

  // Helper function to get events for a specific date (including midnight-crossing events)
  function getEventsForDate(events: Event[], targetDate: Date): Event[] {
    const targetDateStart = new Date(targetDate);
    targetDateStart.setHours(0, 0, 0, 0);
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);
    const targetDateStartTime = targetDateStart.getTime();
    const targetDateEndTime = targetDateEnd.getTime();

    return events
      .filter((event) => {
        const eventStartDate = new Date(event.start);
        const eventEndDate = new Date(event.end);
        const eventStartTime = eventStartDate.getTime();
        const eventEndTime = eventEndDate.getTime();

        // Include events where target date falls between start and end (inclusive)
        return eventStartTime <= targetDateEndTime && eventEndTime >= targetDateStartTime;
      })
      .map((event) => {
        const eventStartDate = new Date(event.start);
        const eventEndDate = new Date(event.end);
        const eventStartTime = eventStartDate.getTime();
        const eventEndTime = eventEndDate.getTime();
        
        const startsOnTarget = eventStartTime >= targetDateStartTime && eventStartTime <= targetDateEndTime;
        const endsOnTarget = eventEndTime >= targetDateStartTime && eventEndTime <= targetDateEndTime;
        const spansTarget = eventStartTime < targetDateStartTime && eventEndTime > targetDateEndTime;

        // If event starts and ends on the same day, return as is
        if (startsOnTarget && endsOnTarget) {
          return event;
        }

        // If event starts on target date but ends next day, truncate at midnight
        if (startsOnTarget && !endsOnTarget) {
          const truncatedEnd = new Date(targetDate);
          truncatedEnd.setHours(23, 59, 59, 999);
          return {
            ...event,
            end: truncatedEnd,
          };
        }

        // If event ends on target date but started yesterday, start at midnight
        if (!startsOnTarget && endsOnTarget) {
          const truncatedStart = new Date(targetDate);
          truncatedStart.setHours(0, 0, 0, 0);
          return {
            ...event,
            start: truncatedStart,
          };
        }

        // If event spans the target date (starts before and ends after), truncate to full day
        if (spansTarget) {
          const truncatedStart = new Date(targetDate);
          truncatedStart.setHours(0, 0, 0, 0);
          const truncatedEnd = new Date(targetDate);
          truncatedEnd.setHours(23, 59, 59, 999);
          return {
            ...event,
            start: truncatedStart,
            end: truncatedEnd,
          };
        }

        return event;
      });
  }

  // Helper function to get full events for event list (no truncation)
  function getFullEventsForDate(events: Event[], targetDate: Date): Event[] {
    // Compute start of day (00:00:00) and end of day (23:59:59.999) for target date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      // Parse event start and end dates
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Return events where eventStart <= endOfDay && eventEnd >= startOfDay
      // This includes multi-day events that span the target date
      return eventStart <= endOfDay && eventEnd >= startOfDay;
    });
  }

  function getEventColumns(events: Event[]): Event[][] {
    if (events.length === 0) return [];

    // Sort events by start time
    const sortedEvents = [...events].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    const columns: Event[][] = [];

    for (const event of sortedEvents) {
      // Find the first column where this event doesn't overlap
      let columnIndex = 0;
      while (columnIndex < columns.length) {
        const column = columns[columnIndex];
        const lastEvent = column[column.length - 1];

        // Check if this event overlaps with the last event in this column
        if (event.start >= lastEvent.end) {
          break;
        }
        columnIndex++;
      }

      // If no suitable column found, create a new one
      if (columnIndex >= columns.length) {
        columns.push([]);
      }

      columns[columnIndex].push(event);
    }

    return columns;
  }
</script>

<div class="calendar-view">
  <div class="calendar-main">
    <!-- Calendar Header (inside the same scrollable container as grid) -->
    <div class="calendar-header">
      <div class="month-navigation">
        <button onclick={() => navigateMonth(-1)}>←</button>
        <h2>
          {currentMonth.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
          })}
        </h2>
        <button onclick={() => navigateMonth(1)}>→</button>
      </div>

      <button class="add-event-button" onclick={createEvent}>
        + 予定を追加
      </button>
    </div>

    <!-- Calendar Grid -->
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
        {#each getCalendarDays() as day (day.getTime())}
          <div
            class="calendar-day {isToday(day) ? 'today' : ''} {isSelected(day)
              ? 'selected'
              : ''} {!isCurrentMonth(day) ? 'other-month' : ''}"
            onclick={() => selectDate(day)}
            onkeydown={(e) => e.key === "Enter" && selectDate(day)}
            role="button"
            tabindex="0"
          >
            <div class="day-number">{day.getDate()}</div>
            <div class="day-events">
              {#each getEventsForDate($events, day) as event (event.id)}
                <div
                  class="event-dot"
                  style="background-color: {getEventColor(event)}"
                ></div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Selected Date Events - Always Visible -->
    <div class="selected-date-events">
      <h3>予定 - {controller.formatDate(localSelectedDate)}</h3>
      {#if getFullEventsForDate($events, localSelectedDate).length === 0}
        <p class="empty-state">この日の予定はありません</p>
      {:else}
        <div class="events-list">
          {#each getFullEventsForDate($events, localSelectedDate) as event (event.id)}
            <div
              class="event-item"
              onclick={() => controller.editEvent(event)}
              onkeydown={(e) => e.key === "Enter" && controller.editEvent(event)}
              role="button"
              tabindex="0"
            >
              <div class="event-content">
                <div class="event-title">{event.title}</div>
                <div class="event-time">
                  {controller.formatDateTime(event.start)} - {controller.formatDateTime(
                    event.end,
                  )}
                </div>
              </div>
              <div class="event-actions">
                <button
                  onclick={() => {
                    controller.editEvent(event);
                    showEventForm = true;
                  }}>編集</button
                >
                <button
                  onclick={() => controller.deleteEvent(event.id)}
                  class="danger">削除</button
                >
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Timeline Popup -->
  {#if showTimelinePopup}
    <div class="timeline-popup">
      <div class="popup-content">
        <div class="popup-header">
          <h3>タイムライン - {controller.formatDate(localSelectedDate)}</h3>
          <button
            class="close-button"
            onclick={() => (showTimelinePopup = false)}>✕</button
          >
        </div>

        <div class="timeline-container">
          {#if getEventsForDate($events, localSelectedDate).length === 0}
            <p class="empty-state">この日の予定はありません</p>
          {:else}
            <div class="timeline-view">
              <!-- Hour indicators -->
              <div class="timeline-hours">
                {#each Array(24) as _, hour (hour)}
                  <div class="hour-indicator" style="top: {hour * 16.67}px;">
                    <span class="hour-label"
                      >{hour.toString().padStart(2, "0")}:00</span
                    >
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
                {#each getEventColumns(getEventsForDate($events, localSelectedDate)) as column, columnIndex (columnIndex)}
                  <div
                    class="timeline-column"
                    style="width: {100 /
                      getEventColumns(
                        getEventsForDate($events, localSelectedDate),
                      ).length}%;"
                  >
                    {#each column as event (event.id)}
                      <div
                        class="timeline-event-block"
                        onclick={() => {
                          controller.editEvent(event);
                          showEventForm = true;
                        }}
                        onkeydown={(e) =>
                          e.key === "Enter" &&
                          (controller.editEvent(event), (showEventForm = true))}
                        role="button"
                        tabindex="0"
                        style="
                          top: {getEventPositionScaled(event.start)}px;
                          height: {getEventHeightScaled(event)}px;
                          background-color: {getEventColor(event)};
                          color: white;
                        "
                      >
                        <div class="timeline-event-title">{event.title}</div>
                        <div class="timeline-event-time">
                          {formatTime(event.start)} - {formatTime(event.end)}
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
  {/if}

  <!-- Event Form Modal -->
  {#if showEventForm}
    <div class="event-form-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{isEventEditing ? "予定を編集" : "新しい予定"}</h3>
          <button class="close-button" onclick={() => (showEventForm = false)}
            >✕</button
          >
        </div>

        <div class="form-group">
          <label for="event-title">タイトル</label>
          <input
            id="event-title"
            type="text"
            bind:value={eventTitle}
            placeholder="予定のタイトルを入力"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="event-start">開始時刻</label>
            <input
              id="event-start"
              type="datetime-local"
              bind:value={eventStart}
            />
          </div>

          <div class="form-group">
            <label for="event-end">終了時刻</label>
            <input id="event-end" type="datetime-local" bind:value={eventEnd} />
          </div>
        </div>

        <div class="form-actions">
          {#if isEventEditing}
            <button
              onclick={() => {
                // Get current form data synchronously
                const currentForm = get(controller.eventForm);
                
                // Update the controller form with current values
                controller.eventForm.set({
                  title: eventTitle,
                  start: eventStart,
                  end: eventEnd,
                  isEditing: true,
                  editingId: currentForm.editingId,
                });
                controller.updateEvent();
                showEventForm = false;
              }}>更新</button
            >
            <button
              onclick={() => {
                controller.resetEventForm();
                showEventForm = false;
              }}>キャンセル</button
            >
          {:else}
            <button
              onclick={() => {
                // Update the controller form with current values
                controller.eventForm.set({
                  title: eventTitle,
                  start: eventStart,
                  end: eventEnd,
                  isEditing: false,
                  editingId: null,
                });

                controller.createEvent();
                showEventForm = false;
              }}>作成</button
            >
            <button onclick={() => (showEventForm = false)}>キャンセル</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .calendar-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    backdrop-filter: blur(6px) saturate(110%);
    box-shadow: var(--glow);
    overflow: hidden;
    min-height: 0;
  }

  .calendar-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .calendar-grid {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 400px; /* minimum height for weekdays + 6 weeks × 60px + padding */
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    border-bottom: 1px solid var(--glass-border);
    background: rgba(0, 200, 255, 0.05);
  }

  .month-navigation {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .month-navigation h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--fs-lg);
    color: var(--primary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-shadow: 0 0 8px rgba(0, 200, 255, 0.15);
  }

  .month-navigation button {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--primary);
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-family: var(--font-display);
    transition: all 0.18s ease;
  }

  .month-navigation button:hover {
    background: var(--primary);
    color: var(--bg);
    box-shadow: 0 0 14px rgba(0, 200, 255, 0.22);
    transform: translateY(-2px);
  }

  .add-event-button {
    padding: var(--space-sm) var(--space-md);
    background: var(--coral);
    color: var(--white);
    border: 1px solid var(--coral);
    border-radius: 999px;
    cursor: pointer;
    font-weight: 600;
    font-family: var(--font-sans);
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .add-event-button:hover {
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    min-height: 0;
    grid-auto-rows: minmax(60px, 1fr); /* minimum 60px height per row */
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: rgba(0, 200, 255, 0.05);
    border-bottom: 1px solid var(--glass-border);
  }

  .weekday {
    padding: var(--space-sm) var(--space-xs);
    text-align: center;
    font-weight: 600;
    color: var(--muted);
    font-size: 0.875rem;
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .calendar-day {
    border-right: 1px solid var(--glass-border);
    border-bottom: 1px solid var(--glass-border);
    padding: var(--space-sm);
    cursor: pointer;
    transition: all 0.18s ease;
    display: flex;
    flex-direction: column;
    min-height: 100%; /* fill the grid row height */
    background: rgba(0, 200, 255, 0.02);
  }

  .calendar-day:hover {
    background: rgba(0, 200, 255, 0.08);
    box-shadow: inset 0 0 12px rgba(0, 200, 255, 0.1);
  }

  .calendar-day.today {
    background: rgba(0, 200, 255, 0.1);
    box-shadow: inset 0 0 12px rgba(0, 200, 255, 0.15);
  }

  .calendar-day.today .day-number {
    background: var(--primary);
    color: var(--bg);
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-family: var(--font-display);
    box-shadow: 0 0 8px rgba(0, 200, 255, 0.3);
  }

  .calendar-day.selected {
    background: rgba(0, 200, 255, 0.15);
    border: 2px solid var(--primary);
    box-shadow:
      inset 0 0 12px rgba(0, 200, 255, 0.2),
      0 0 12px rgba(0, 200, 255, 0.2);
  }

  .calendar-day.other-month {
    color: var(--muted);
    background: rgba(102, 224, 255, 0.02);
    opacity: 0.6;
  }

  .day-number {
    font-weight: 500;
    margin-bottom: var(--space-xs);
    color: var(--text);
    font-family: var(--font-display);
  }

  .day-events {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    margin-top: auto;
  }

  .event-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 4px rgba(0, 200, 255, 0.3);
  }

  .selected-date-events {
    padding: var(--space-md);
    border-top: 1px solid var(--glass-border);
    background: rgba(0, 200, 255, 0.05);
    flex: 0 0 auto;
  }

  .selected-date-events h3 {
    margin: 0 0 var(--space-md) 0;
    color: var(--primary);
    font-size: 1rem;
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .event-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm);
    background: rgba(0, 200, 255, 0.08);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .event-item:hover {
    background: rgba(0, 200, 255, 0.12);
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 0 12px rgba(0, 200, 255, 0.15);
  }

  .event-content {
    flex: 1;
    margin-right: var(--space-md);
  }

  .event-title {
    font-weight: 500;
    color: var(--text);
    margin-bottom: var(--space-xs);
    font-family: var(--font-display);
  }

  .event-time {
    font-size: 0.75rem;
    color: var(--muted);
    font-family: var(--font-display);
  }

  .event-actions {
    display: flex;
    gap: var(--space-xs);
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  .event-item:hover .event-actions {
    opacity: 1;
  }

  .event-actions button {
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--primary);
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    color: var(--primary);
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.18s ease;
  }

  .event-actions button.danger {
    color: var(--danger);
    border-color: var(--danger);
  }

  .event-actions button:hover {
    background: var(--primary);
    color: var(--bg);
    box-shadow: 0 0 8px rgba(0, 200, 255, 0.2);
  }

  .event-actions button.danger:hover {
    background: var(--danger);
    color: var(--bg);
    box-shadow: 0 0 8px rgba(255, 59, 59, 0.2);
  }

  .empty-state {
    text-align: center;
    color: var(--muted);
    font-style: italic;
    padding: var(--space-md);
  }

  /* Timeline Popup Styles */
  .timeline-popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 34, 48, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .popup-content {
    background: var(--card);
    border: 1px solid rgba(15, 34, 48, 0.05);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-soft);
  }

  .timeline-container {
    height: 400px;
    overflow: hidden;
    position: relative;
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid rgba(15, 34, 48, 0.08);
  }

  .popup-header h3 {
    margin: 0;
    color: var(--navy-900);
    font-size: var(--fs-lg);
    font-family: var(--font-sans);
    font-weight: 600;
  }

  .timeline-view {
    position: relative;
    height: 400px;
    background: rgba(240, 138, 119, 0.05);
    border: 1px solid rgba(240, 138, 119, 0.2);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .timeline-hours {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .hour-indicator {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    display: flex;
    align-items: center;
  }

  .hour-label {
    position: absolute;
    left: 0.25rem;
    top: -0.5rem;
    font-size: 0.625rem;
    color: var(--muted);
    background: rgba(0, 200, 255, 0.05);
    padding: 0 0.125rem;
    font-weight: 500;
    line-height: 1;
    font-family: var(--font-display);
  }

  .hour-line {
    width: 100%;
    height: 1px;
    background: var(--glass-border);
    margin-left: 2.5rem;
  }

  .current-time-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent);
    z-index: 10;
    pointer-events: none;
    box-shadow: 0 0 8px rgba(255, 204, 0, 0.5);
  }

  .current-time-line::before {
    content: "";
    position: absolute;
    left: 0;
    top: -4px;
    width: 0;
    height: 0;
    border-left: 6px solid var(--accent);
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
  }

  .timeline-columns {
    position: absolute;
    top: 0;
    left: 2.5rem;
    right: 0;
    height: 100%;
    display: flex;
  }

  .timeline-column {
    position: relative;
    height: 100%;
    border-right: 1px solid var(--glass-border);
  }

  .timeline-column:last-child {
    border-right: none;
  }

  .timeline-event-block {
    position: absolute;
    left: 0.125rem;
    right: 0.125rem;
    padding: 0.25rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.18s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 8px rgba(0, 200, 255, 0.2);
    overflow: hidden;
    min-height: 20px;
  }

  .timeline-event-block:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    z-index: 5;
  }

  .timeline-event-title {
    font-weight: 600;
    font-size: 0.75rem;
    line-height: 1.1;
    margin-bottom: 0.125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--font-sans);
  }

  .timeline-event-time {
    font-size: 0.625rem;
    opacity: 0.9;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--font-display);
  }

  /* Modal Styles */
  .event-form-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 34, 48, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--card);
    border: 1px solid rgba(15, 34, 48, 0.05);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-soft);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid rgba(15, 34, 48, 0.08);
  }

  .modal-header h3 {
    margin: 0;
    color: var(--navy-900);
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: var(--fs-lg);
  }

  .close-button {
    width: 2rem;
    height: 2rem;
    border: 1px solid #dc3545;
    background: transparent;
    color: #dc3545;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .close-button:hover {
    background: #dc3545;
    color: var(--white);
    box-shadow: 0 4px 14px rgba(220, 53, 69, 0.3);
    transform: scale(1.1);
  }

  .form-group {
    margin-bottom: var(--space-md);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
  }

  .form-group label {
    display: block;
    margin-bottom: var(--space-sm);
    font-weight: 600;
    color: var(--muted);
    font-family: var(--font-sans);
    font-size: var(--fs-sm);
  }

  .form-group input {
    width: 100%;
    padding: var(--space-sm);
    border: 1px solid rgba(15, 34, 48, 0.1);
    border-radius: 999px;
    font-size: var(--fs-md);
    background: var(--white);
    color: var(--navy-700);
    font-family: var(--font-sans);
    transition: all 0.18s ease;
  }

  .form-group input:focus {
    border-color: var(--coral);
    outline: 2px solid rgba(240, 138, 119, 0.18);
    outline-offset: 2px;
  }

  .form-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }

  .form-actions button {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--coral);
    background: transparent;
    border-radius: 999px;
    cursor: pointer;
    font-size: var(--fs-sm);
    color: var(--coral);
    font-family: var(--font-sans);
    font-weight: 600;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .form-actions button:first-child {
    background: var(--coral);
    color: var(--white);
  }

  .form-actions button:first-child:hover {
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  .form-actions button:hover {
    background: var(--coral);
    color: var(--white);
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  /* responsive adjustment: height→auto, max-height→50vh */
  @media (max-width: 768px) {
    .timeline-view {
      height: auto;
      max-height: 50vh;
    }

    .calendar-day {
      min-height: 60px;
      padding: var(--space-xs);
    }

    .day-number {
      font-size: 0.875rem;
    }

    .event-dot {
      width: 4px;
      height: 4px;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .calendar-header {
      flex-direction: column;
      gap: var(--space-md);
      align-items: flex-start;
    }

    .month-navigation {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
