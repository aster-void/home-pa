<script lang="ts">
  import type { Event } from '../types.js';
  import type { AppController } from '../controllers/app.controller.svelte.ts';
  import { events, eventOperations, todaysEvents } from '../stores/data.js';

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Local reactive variables that sync with controller stores
  let currentViewMode = $state('month');
  let selectedDate = $state(new Date());
  let currentMonth = $state(new Date());
  let eventTitle = $state('');
  let eventStart = $state('');
  let eventEnd = $state('');
  let isEventEditing = $state(false);
  let showEventForm = $state(false);
  let showTimelinePopup = $state(false);
  
  // Subscribe to controller store changes
  $effect(() => {
    if (controller) {
      const unsubscribe1 = controller.viewMode.subscribe(value => {
        currentViewMode = value;
      });
      
      const unsubscribe2 = controller.selectedDate.subscribe(date => {
        selectedDate = new Date(date);
      });
      
      const unsubscribe3 = controller.eventForm.subscribe(form => {
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
      controller.eventForm.update(form => ({
        ...form,
        title: eventTitle,
        start: eventStart,
        end: eventEnd
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
    const totalDaysNeeded = Math.ceil((endOfMonth.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 + daysToCompleteLastWeek;
    
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
    return date.toDateString() === selectedDate.toDateString();
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
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
  }

  function createEvent() {
    const startTime = new Date(selectedDate);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(10, 0, 0, 0);
    
    // Set the form data
    controller.eventForm.set({
      title: '',
      start: startTime.toISOString().slice(0, 16),
      end: endTime.toISOString().slice(0, 16),
      isEditing: false,
      editingId: null
    });
    
    // Also update local variables
    eventTitle = '';
    eventStart = startTime.toISOString().slice(0, 16);
    eventEnd = endTime.toISOString().slice(0, 16);
    isEventEditing = false;
    
    showEventForm = true;
  }

  function getEventColor(event: Event): string {
    // Simple color assignment based on event title hash
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    const hash = event.title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  function getCurrentTimePosition(): number {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // Only show current time line if it's today
    if (currentDate.toDateString() !== selectedDateOnly.toDateString()) {
      return -1000; // Hide the line
    }
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours * 60) + minutes;
  }

  function getCurrentTimePositionScaled(): number {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // Only show current time line if it's today
    if (currentDate.toDateString() !== selectedDateOnly.toDateString()) {
      return -1000; // Hide the line
    }
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return ((hours * 60) + minutes) * (400 / 1440); // Scale to fit 400px height
  }

  function getEventPosition(startTime: Date): number {
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    return (hours * 60) + minutes;
  }

  function getEventPositionScaled(startTime: Date): number {
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    return ((hours * 60) + minutes) * (400 / 1440); // Scale to fit 400px height
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

  function getEventColumns(events: Event[]): Event[][] {
    if (events.length === 0) return [];
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    
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
  <!-- Calendar Header -->
  <div class="calendar-header">
    <div class="month-navigation">
      <button onclick={() => navigateMonth(-1)}>←</button>
      <h2>{currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</h2>
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
          class="calendar-day {isToday(day) ? 'today' : ''} {isSelected(day) ? 'selected' : ''} {!isCurrentMonth(day) ? 'other-month' : ''}"
          onclick={() => selectDate(day)}
          onkeydown={(e) => e.key === 'Enter' && selectDate(day)}
          role="button"
          tabindex="0"
        >
          <div class="day-number">{day.getDate()}</div>
          <div class="day-events">
            {#each $events.filter(event => new Date(event.start).toDateString() === day.toDateString()) as event (event.id)}
              <div class="event-dot" style="background-color: {getEventColor(event)}"></div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Selected Date Events - Always Visible -->
  <div class="selected-date-events">
    <h3>予定 - {controller.formatDate(selectedDate)}</h3>
    {#if $events.filter(event => new Date(event.start).toDateString() === selectedDate.toDateString()).length === 0}
      <p class="empty-state">この日の予定はありません</p>
    {:else}
      <div class="events-list">
        {#each $events.filter(event => new Date(event.start).toDateString() === selectedDate.toDateString()) as event (event.id)}
          <div 
            class="event-item" 
            onclick={() => controller.editEvent(event)}
            onkeydown={(e) => e.key === 'Enter' && controller.editEvent(event)}
            role="button"
            tabindex="0"
          >
            <div class="event-content">
              <div class="event-title">{event.title}</div>
              <div class="event-time">
                {controller.formatDateTime(event.start)} - {controller.formatDateTime(event.end)}
              </div>
            </div>
            <div class="event-actions">
              <button onclick={() => controller.editEvent(event)}>編集</button>
              <button onclick={() => controller.deleteEvent(event.id)} class="danger">削除</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Timeline Popup -->
  {#if showTimelinePopup}
    <div class="timeline-popup">
      <div class="popup-content">
        <div class="popup-header">
          <h3>タイムライン - {controller.formatDate(selectedDate)}</h3>
          <button class="close-button" onclick={() => showTimelinePopup = false}>✕</button>
        </div>
        
        <div class="timeline-container">
          {#if $events.filter(event => new Date(event.start).toDateString() === selectedDate.toDateString()).length === 0}
            <p class="empty-state">この日の予定はありません</p>
          {:else}
            <div class="timeline-view">
              <!-- Hour indicators -->
              <div class="timeline-hours">
                {#each Array(24) as _, hour}
                  <div class="hour-indicator" style="top: {hour * 16.67}px;">
                    <span class="hour-label">{hour.toString().padStart(2, '0')}:00</span>
                    <div class="hour-line"></div>
                  </div>
                {/each}
              </div>
              
              <!-- Current time indicator -->
              <div class="current-time-line" style="top: {getCurrentTimePositionScaled()}px;"></div>
              
              <!-- Event columns -->
              <div class="timeline-columns">
                {#each getEventColumns($events.filter(event => new Date(event.start).toDateString() === selectedDate.toDateString())) as column, columnIndex}
                  <div class="timeline-column" style="width: {100 / getEventColumns($events.filter(event => new Date(event.start).toDateString() === selectedDate.toDateString())).length}%;">
                    {#each column as event (event.id)}
                      <div 
                        class="timeline-event-block" 
                        onclick={() => controller.editEvent(event)}
                        onkeydown={(e) => e.key === 'Enter' && controller.editEvent(event)}
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
          <h3>{isEventEditing ? '予定を編集' : '新しい予定'}</h3>
          <button class="close-button" onclick={() => showEventForm = false}>✕</button>
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
            <input
              id="event-end"
              type="datetime-local"
              bind:value={eventEnd}
            />
          </div>
        </div>
        
        <div class="form-actions">
          {#if isEventEditing}
            <button onclick={() => { 
              // Get current editing ID
              let editingId: string | null = null;
              controller.eventForm.subscribe(f => editingId = f.editingId)();
              
              // Update the controller form with current values
              controller.eventForm.set({
                title: eventTitle,
                start: eventStart,
                end: eventEnd,
                isEditing: true,
                editingId: editingId
              });
              controller.updateEvent(); 
              showEventForm = false; 
            }}>更新</button>
            <button onclick={() => { controller.resetEventForm(); showEventForm = false; }}>キャンセル</button>
          {:else}
            <button onclick={() => { 
              // Update the controller form with current values
              controller.eventForm.set({
                title: eventTitle,
                start: eventStart,
                end: eventEnd,
                isEditing: false,
                editingId: null
              });
              
              
              controller.createEvent(); 
              showEventForm = false; 
            }}>作成</button>
            <button onclick={() => showEventForm = false}>キャンセル</button>
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
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .calendar-grid {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .month-navigation {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .month-navigation h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #1f2937;
    font-weight: 600;
  }

  .month-navigation button {
    width: 2rem;
    height: 2rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .month-navigation button:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .add-event-button {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .add-event-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    min-height: 0;
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
  }

  .weekday {
    padding: 0.75rem 0.5rem;
    text-align: center;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }


  .calendar-day {
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    min-height: 80px;
  }

  .calendar-day:hover {
    background: #f9fafb;
  }

  .calendar-day.today {
    background: #eff6ff;
  }

  .calendar-day.today .day-number {
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .calendar-day.selected {
    background: #dbeafe;
    border: 2px solid #3b82f6;
  }

  .calendar-day.other-month {
    color: #9ca3af;
    background: #f9fafb;
  }

  .day-number {
    font-weight: 500;
    margin-bottom: 0.25rem;
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
  }

  .selected-date-events {
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
    max-height: 250px;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .selected-date-events h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
    font-size: 1rem;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .event-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .event-item:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    transform: translateY(-1px);
  }

  .event-content {
    flex: 1;
    margin-right: 1rem;
  }

  .event-title {
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .event-time {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .event-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .event-item:hover .event-actions {
    opacity: 1;
  }

  .event-actions button {
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.2s;
  }

  .event-actions button.danger {
    color: #dc2626;
    border-color: #fca5a5;
  }

  .event-actions button:hover {
    background: #f3f4f6;
  }

  .empty-state {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    padding: 1rem;
  }

  /* Timeline Popup Styles */
  .timeline-popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .popup-content {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .popup-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.25rem;
  }

  .timeline-container {
    height: 400px;
    overflow: hidden;
    position: relative;
  }

  .timeline-view {
    position: relative;
    height: 400px; /* Fixed height - no scrolling */
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
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
    color: #6b7280;
    background: #fafafa;
    padding: 0 0.125rem;
    font-weight: 500;
    line-height: 1;
  }

  .hour-line {
    width: 100%;
    height: 1px;
    background: #e5e7eb;
    margin-left: 2.5rem;
  }

  .current-time-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: #ef4444;
    z-index: 10;
    pointer-events: none;
  }

  .current-time-line::before {
    content: '';
    position: absolute;
    left: 0;
    top: -4px;
    width: 0;
    height: 0;
    border-left: 6px solid #ef4444;
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
    border-right: 1px solid #e5e7eb;
  }

  .timeline-column:last-child {
    border-right: none;
  }

  .timeline-event-block {
    position: absolute;
    left: 0.125rem;
    right: 0.125rem;
    padding: 0.25rem;
    border-radius: 0.125rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    min-height: 20px;
  }

  .timeline-event-block:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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
  }

  .timeline-event-time {
    font-size: 0.625rem;
    opacity: 0.9;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Modal Styles */
  .event-form-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h3 {
    margin: 0;
    color: #1f2937;
  }

  .close-button {
    width: 2rem;
    height: 2rem;
    border: none;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .close-button:hover {
    background: #dc2626;
    transform: scale(1.1);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .form-actions button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .form-actions button:first-child {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .form-actions button:first-child:hover {
    background: #2563eb;
  }

  .form-actions button:hover {
    background: #f3f4f6;
  }

  @media (max-width: 768px) {
    .calendar-day {
      min-height: 60px;
      padding: 0.25rem;
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
  }
</style>
