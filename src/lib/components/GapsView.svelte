<script lang="ts">
  import {
    gaps,
    gapStats,
    dayBoundaries,
    dayBoundaryActions,
    events,
  } from "../stores/gaps.js";
  import type { DayBoundaries } from "../services/gap-finder.js";

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

    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? "s" : ""}`;
    } else if (mins === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }

  // Get current time in HH:mm format
  function getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // Determine gap status and color
  function getGapStatus(gap: any): "past" | "current" | "future" {
    const currentTime = getCurrentTime();
    const currentMinutes = timeToMinutes(currentTime);
    const gapStartMinutes = timeToMinutes(gap.start);
    const gapEndMinutes = timeToMinutes(gap.end);

    if (currentMinutes >= gapEndMinutes) {
      return "past"; // Gap has ended
    } else if (
      currentMinutes >= gapStartMinutes &&
      currentMinutes < gapEndMinutes
    ) {
      return "current"; // Current time is within this gap
    } else {
      return "future"; // Gap is in the future
    }
  }

  // Convert time to minutes for comparison
  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
</script>

<div class="gaps-view">
  <div class="gaps-header">
    <h3>Free Time Gaps</h3>
    <div class="header-info">
      <div class="day-boundaries">
        <span class="boundary-label">Active Hours:</span>
        <span class="boundary-time">
          {formatTime($dayBoundaries.dayStart)} - {formatTime(
            $dayBoundaries.dayEnd,
          )}
        </span>
        <button class="edit-button" onclick={startEditingBoundaries}>
          Edit
        </button>
      </div>
    </div>
  </div>

  {#if editingBoundaries}
    <div class="boundary-editor">
      <div class="editor-row">
        <label>
          Day Start:
          <input type="time" bind:value={tempDayStart} class="time-input" />
        </label>
        <label>
          Day End:
          <input type="time" bind:value={tempDayEnd} class="time-input" />
        </label>
      </div>
      <div class="editor-actions">
        <button class="save-button" onclick={saveBoundaries}> Save </button>
        <button class="cancel-button" onclick={cancelEditingBoundaries}>
          Cancel
        </button>
        <button class="reset-button" onclick={resetToDefaults}>
          Reset to Defaults
        </button>
      </div>
    </div>
  {/if}

  <!-- Gap Statistics -->
  <div class="gap-stats">
    <div class="stat-item">
      <span class="stat-label">Total Free Time:</span>
      <span class="stat-value">{formatDuration($gapStats.totalGapTime)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Number of Gaps:</span>
      <span class="stat-value">{$gapStats.gapCount}</span>
    </div>
    {#if $gapStats.gapCount > 0}
      <div class="stat-item">
        <span class="stat-label">Largest Gap:</span>
        <span class="stat-value"
          >{formatDuration($gapStats.largestGap.duration)}</span
        >
      </div>
    {/if}
  </div>

  <!-- Gap List -->
  <div class="gaps-list">
    {#if $gaps.length === 0}
      <div class="no-gaps">
        <p>No free time gaps found.</p>
        <p class="no-gaps-hint">Add some events to see your free time slots!</p>
      </div>
    {:else}
      {#each $gaps as gap, index (index)}
        {@const status = getGapStatus(gap)}
        <div
          class="gap-item"
          class:past={status === "past"}
          class:current={status === "current"}
          class:future={status === "future"}
        >
          <div class="gap-time">
            <span class="gap-start">{formatTime(gap.start)}</span>
            <span class="gap-separator">→</span>
            <span class="gap-end">{formatTime(gap.end)}</span>
          </div>
          <div class="gap-duration">
            {formatDuration(gap.duration)}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .gaps-view {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .gaps-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .gaps-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #1f2937;
  }

  .day-boundaries {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .boundary-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .boundary-time {
    font-weight: 500;
    color: #374151;
  }

  .edit-button {
    padding: 0.25rem 0.75rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.75rem;
    color: #6b7280;
    transition: all 0.2s;
  }

  .edit-button:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .header-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .boundary-editor {
    background: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .editor-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .editor-row label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: #374151;
  }

  .time-input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .editor-actions {
    display: flex;
    gap: 0.5rem;
  }

  .save-button {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .cancel-button {
    padding: 0.5rem 1rem;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .reset-button {
    padding: 0.5rem 1rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .gap-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .gaps-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .no-gaps {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .no-gaps-hint {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .gap-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border-left: 4px solid #3b82f6;
    transition: all 0.2s;
  }

  .gap-item.past {
    background: #f3f4f6;
    border-left-color: #9ca3af;
    color: #6b7280;
  }

  .gap-item.current {
    background: #f0fdf4;
    border-left-color: #22c55e;
    color: #166534;
  }

  .gap-item.future {
    background: #f8fafc;
    border-left-color: #3b82f6;
    color: #1f2937;
  }

  .gap-time {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #1f2937;
  }

  .gap-separator {
    color: #6b7280;
    font-weight: normal;
  }

  .gap-duration {
    font-size: 0.875rem;
    color: #6b7280;
    background: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid #e5e7eb;
  }
</style>
