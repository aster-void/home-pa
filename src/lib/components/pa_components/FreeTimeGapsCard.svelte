<script lang="ts">
  import BaseCard from "./BaseCard.svelte";
  import {
    gaps,
    gapStats,
    dayBoundaries,
    dayBoundaryActions,
  } from "../../stores/gaps.js";

  // Local state for editing day boundaries
  let editingBoundaries = $state(false);
  let tempDayStart = $state("");
  let tempDayEnd = $state("");

  // Initialize temp values when editing starts
  function startEditingBoundaries() {
    const current = $dayBoundaries;
    tempDayStart = current.dayStart;
    tempDayEnd = current.dayEnd;
    editingBoundaries = true;
  }

  function saveBoundaries() {
    dayBoundaryActions.setCustomBoundaries(tempDayStart, tempDayEnd);
    editingBoundaries = false;
  }

  function cancelEditingBoundaries() {
    editingBoundaries = false;
  }

  function resetToDefaults() {
    dayBoundaryActions.resetToDefaults();
    editingBoundaries = false;
  }

  // Format time for display
  function formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Format duration
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  // Get gap status for styling
  function getGapStatus(gap: { start: string; end: string }): "past" | "current" | "future" {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const gapStartMinutes = parseInt(gap.start.split(":")[0]) * 60 + parseInt(gap.start.split(":")[1]);
    const gapEndMinutes = parseInt(gap.end.split(":")[0]) * 60 + parseInt(gap.end.split(":")[1]);

    if (currentTime >= gapEndMinutes) return "past";
    if (currentTime >= gapStartMinutes && currentTime < gapEndMinutes) return "current";
    return "future";
  }
</script>

<BaseCard title="Free Time Gaps" class="gaps-card">
  <div class="header-info">
    <div class="day-boundaries">
      <div class="boundary-display">
        <span class="label">Active Hours:</span>
        <span class="time-range">
          {formatTime($dayBoundaries.dayStart)} - {formatTime($dayBoundaries.dayEnd)}
        </span>
      </div>
      
      {#if !editingBoundaries}
        <button 
          class="edit-btn" 
          onclick={startEditingBoundaries}
          title="Edit day boundaries"
        >
          ✏️
        </button>
      {:else}
        <div class="edit-controls">
          <div class="time-inputs">
            <div class="input-group">
              <label for="day-start-input">Start:</label>
              <input 
                id="day-start-input"
                type="time" 
                bind:value={tempDayStart}
                class="time-input"
              />
            </div>
            <div class="input-group">
              <label for="day-end-input">End:</label>
              <input 
                id="day-end-input"
                type="time" 
                bind:value={tempDayEnd}
                class="time-input"
              />
            </div>
          </div>
          <div class="button-group">
            <button onclick={saveBoundaries} class="save-btn">Save</button>
            <button onclick={cancelEditingBoundaries} class="cancel-btn">Cancel</button>
            <button onclick={resetToDefaults} class="reset-btn">Reset</button>
          </div>
        </div>
      {/if}
    </div>

    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">Total Free Time:</span>
        <span class="stat-value">{formatDuration($gapStats.totalGapTime)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Gaps:</span>
        <span class="stat-value">{$gapStats.gapCount}</span>
      </div>
      {#if $gapStats.largestGap.duration > 0}
        <div class="stat-item">
          <span class="stat-label">Largest Gap:</span>
          <span class="stat-value">{formatDuration($gapStats.largestGap.duration)}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="gaps-list">
    {#if $gaps.length === 0}
      <div class="no-gaps">
        <p>No free time gaps found.</p>
        <p class="no-gaps-hint">Add some events to see your free time slots!</p>
      </div>
    {:else}
      {#each $gaps as gap}
        {@const status = getGapStatus(gap)}
        <div class="gap-item" class:past={status === 'past'} class:current={status === 'current'} class:future={status === 'future'}>
          <div class="gap-time">
            <span class="start-time">{formatTime(gap.start)}</span>
            <span class="gap-separator">–</span>
            <span class="end-time">{formatTime(gap.end)}</span>
          </div>
          <div class="gap-duration">{formatDuration(gap.duration)}</div>
        </div>
      {/each}
    {/if}
  </div>
</BaseCard>

<style>

  .header-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .day-boundaries {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .boundary-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .label {
    font-size: 0.875rem;
    color: var(--muted);
    font-weight: 500;
  }

  .time-range {
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--text);
  }

  .edit-btn {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .edit-btn:hover {
    background: var(--primary);
    color: var(--bg);
  }

  .edit-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .time-inputs {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .input-group label {
    font-size: 0.75rem;
    color: var(--muted);
    font-weight: 500;
  }

  .time-input {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    color: var(--text);
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  .save-btn, .cancel-btn, .reset-btn {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-btn {
    background: var(--primary);
    color: var(--bg);
    border: 1px solid var(--primary);
  }

  .save-btn:hover {
    background: var(--primary-hover);
  }

  .cancel-btn {
    background: transparent;
    color: var(--muted);
    border: 1px solid var(--glass-border);
  }

  .cancel-btn:hover {
    background: var(--glass-bg);
    color: var(--text);
  }

  .reset-btn {
    background: transparent;
    color: var(--warning);
    border: 1px solid var(--warning);
  }

  .reset-btn:hover {
    background: var(--warning);
    color: var(--bg);
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: right;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--muted);
    font-weight: 500;
  }

  .stat-value {
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--text);
    font-size: 0.875rem;
  }

  .gaps-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .gap-item {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s ease;
  }

  .gap-item.past {
    opacity: 0.6;
    background: rgba(var(--muted-rgb), 0.05);
  }

  .gap-item.current {
    background: rgba(var(--primary-rgb), 0.1);
    border-color: var(--primary);
    box-shadow: 0 0 0 1px rgba(var(--primary-rgb), 0.2);
  }

  .gap-item.future {
    background: rgba(var(--success-rgb), 0.05);
    border-color: rgba(var(--success-rgb), 0.3);
  }

  .gap-time {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-display);
    font-weight: 600;
  }

  .gap-separator {
    color: var(--muted);
    font-weight: 400;
  }

  .gap-duration {
    background: var(--primary);
    color: var(--bg);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .no-gaps {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--muted);
  }

  .no-gaps-hint {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .header-info {
      flex-direction: column;
      align-items: stretch;
    }

    .stats {
      text-align: left;
    }

    .stat-item {
      justify-content: flex-start;
    }

    .time-inputs {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .button-group {
      justify-content: flex-start;
    }
  }
</style>