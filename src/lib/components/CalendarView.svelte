<script lang="ts">
  import type { Event } from '../types.js';
  import type { AppController } from '../controllers/app.controller.svelte.js';
  import { events, eventOperations, todaysEvents, selectedDate } from '../stores/data.js';

  let p: { controller: AppController } = $props();
  const { controller } = p;
</script>

<div class="calendar-view">
  <div class="calendar-header">
    <div class="date-navigation">
      <button onclick={() => controller.navigateDate(-1)}>←</button>
      <h2>{controller.formatDate($selectedDate)}</h2>
      <button onclick={() => controller.navigateDate(1)}>→</button>
    </div>
    
    <div class="view-mode-toggle">
      <button 
        class={controller.viewMode === 'day' ? 'active' : ''}
        onclick={() => controller.setViewMode('day')}
      >
        日表示
      </button>
      <button 
        class={controller.viewMode === 'list' ? 'active' : ''}
        onclick={() => controller.setViewMode('list')}
      >
        リスト表示
      </button>
    </div>
  </div>

  <!-- Event Form -->
  <div class="event-form">
    <h3>{controller.eventForm.isEditing ? '予定を編集' : '新しい予定'}</h3>
    
    <div class="form-group">
      <label for="event-title">タイトル</label>
      <input
        id="event-title"
        type="text"
        bind:value={controller.eventForm.title}
        placeholder="予定のタイトルを入力"
      />
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label for="event-start">開始時刻</label>
        <input
          id="event-start"
          type="datetime-local"
          bind:value={controller.eventForm.start}
        />
      </div>
      
      <div class="form-group">
        <label for="event-end">終了時刻</label>
        <input
          id="event-end"
          type="datetime-local"
          bind:value={controller.eventForm.end}
        />
      </div>
    </div>
    
    <div class="form-actions">
      {#if controller.eventForm.isEditing}
        <button onclick={() => controller.updateEvent()}>更新</button>
        <button onclick={() => controller.resetEventForm()}>キャンセル</button>
      {:else}
        <button onclick={() => controller.createEvent()}>作成</button>
      {/if}
    </div>
  </div>

  <!-- Events Display -->
  <div class="events-section">
    <h3>
      {#if controller.viewMode === 'day'}
        予定一覧 - {controller.formatDate($selectedDate)}
      {:else}
        すべての予定
      {/if}
    </h3>
    
    {#if controller.viewMode === 'day'}
      {#if $todaysEvents.length === 0}
        <p class="empty-state">この日の予定はありません</p>
      {:else}
        <div class="events-list">
          {#each $todaysEvents as event (event.id)}
            <div class="event-item">
              <div class="event-content">
                <h4>{event.title}</h4>
                <p class="event-time">
                  {controller.formatDateTime(event.start)} - {controller.formatDateTime(event.end)}
                </p>
              </div>
              
              <div class="event-actions">
                <button onclick={() => controller.editEvent(event)}>編集</button>
                <button onclick={() => controller.deleteEvent(event.id)} class="danger">削除</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      {#if $events.length === 0}
        <p class="empty-state">予定がありません</p>
      {:else}
        <div class="events-list">
          {#each $events as event (event.id)}
            <div class="event-item">
              <div class="event-content">
                <h4>{event.title}</h4>
                <p class="event-time">
                  {controller.formatDateTime(event.start)} - {controller.formatDateTime(event.end)}
                </p>
                <p class="event-date">{controller.formatDate(event.start)}</p>
              </div>
              
              <div class="event-actions">
                <button onclick={() => controller.editEvent(event)}>編集</button>
                <button onclick={() => controller.deleteEvent(event.id)} class="danger">削除</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .calendar-view {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .date-navigation {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .date-navigation h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1f2937;
  }

  .view-mode-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .view-mode-toggle button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .view-mode-toggle button.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .event-form {
    background: #f9fafb;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .event-form h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
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

  .events-section h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }

  .empty-state {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    padding: 2rem;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .event-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .event-content h4 {
    margin: 0 0 0.25rem 0;
    color: #1f2937;
  }

  .event-time {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .event-date {
    margin: 0.25rem 0 0 0;
    color: #9ca3af;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .event-actions {
    display: flex;
    gap: 0.5rem;
  }

  .event-actions button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .event-actions button.danger {
    color: #dc2626;
    border-color: #fca5a5;
  }

  .event-actions button:hover {
    background: #f3f4f6;
  }

  button {
    transition: all 0.2s;
  }

  button:hover {
    transform: translateY(-1px);
  }
</style>
