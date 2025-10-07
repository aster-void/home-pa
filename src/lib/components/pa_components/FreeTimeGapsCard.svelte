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

<BaseCard title="Free Time Gaps" class="gaps-card">
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
</BaseCard>

<style>
  .header-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  .day-boundaries {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .boundary-label {
    font-size: var(--fs-sm);
    color: var(--muted);
    font-weight: 600;
  }

  .boundary-time {
    font-family: var(--font-sans);
    font-weight: 600;
    color: var(--navy-900);
  }

  .edit-button {
    padding: var(--space-xs) var(--space-sm);
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

  .edit-button:hover {
    background: var(--coral);
    color: var(--white);
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  .boundary-editor {
    background: rgba(240, 138, 119, 0.05);
    border: 1px solid rgba(240, 138, 119, 0.2);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    margin-bottom: var(--space-lg);
  }

  .editor-row {
    display: flex;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
  }

  .editor-row label {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    font-size: var(--fs-sm);
    color: var(--muted);
    font-weight: 600;
  }

  .time-input {
    padding: var(--space-sm);
    border: 1px solid rgba(15, 34, 48, 0.1);
    border-radius: 999px;
    font-size: var(--fs-md);
    background: var(--white);
    color: var(--navy-700);
    font-family: var(--font-sans);
  }

  .time-input:focus {
    border-color: var(--coral);
    outline: 2px solid rgba(240, 138, 119, 0.18);
    outline-offset: 2px;
  }

  .editor-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .save-button {
    padding: var(--space-sm) var(--space-md);
    background: var(--coral);
    color: var(--white);
    border: 1px solid var(--coral);
    border-radius: 999px;
    cursor: pointer;
    font-size: var(--fs-sm);
    font-family: var(--font-sans);
    font-weight: 600;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .save-button:hover {
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  .cancel-button {
    padding: var(--space-sm) var(--space-md);
    background: transparent;
    color: var(--muted);
    border: 1px solid var(--muted);
    border-radius: 999px;
    cursor: pointer;
    font-size: var(--fs-sm);
    font-family: var(--font-sans);
    font-weight: 600;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .cancel-button:hover {
    background: var(--muted);
    color: var(--white);
    transform: translateY(-2px);
  }

  .reset-button {
    padding: var(--space-sm) var(--space-md);
    background: transparent;
    color: #dc3545;
    border: 1px solid #dc3545;
    border-radius: 999px;
    cursor: pointer;
    font-size: var(--fs-sm);
    font-family: var(--font-sans);
    font-weight: 600;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .reset-button:hover {
    background: #dc3545;
    color: var(--white);
    transform: translateY(-2px);
  }

  .gap-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
    padding: var(--space-sm);
    background: rgba(0, 200, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 6px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    align-items: center;
    text-align: center;
  }

  .stat-label {
    font-size: 0.65rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: var(--font-display);
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 1.2rem;
    line-height: 1;
    color: var(--text);
    text-shadow: 0 0 6px rgba(0, 200, 255, 0.12);
    font-weight: 600;
  }

  .gaps-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .no-gaps {
    text-align: center;
    padding: 2rem;
    color: var(--muted);
  }

  .no-gaps-hint {
    font-size: 0.875rem;
    margin-top: var(--space-sm);
    color: rgba(230, 247, 255, 0.75);
  }

  .gap-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    background: rgba(0, 200, 255, 0.05);
    border-radius: 8px;
    border-left: 4px solid var(--primary);
    transition: all 0.18s ease;
  }

  .gap-item.past {
    background: rgba(102, 224, 255, 0.03);
    border-left-color: var(--muted);
    color: var(--muted);
  }

  .gap-item.current {
    background: rgba(0, 200, 255, 0.1);
    border-left-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 12px rgba(255, 204, 0, 0.15);
  }

  .gap-item.future {
    background: rgba(0, 200, 255, 0.05);
    border-left-color: var(--primary);
    color: var(--text);
  }

  .gap-time {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-weight: 500;
    color: var(--text);
    font-family: var(--font-display);
  }

  .gap-separator {
    color: var(--muted);
    font-weight: normal;
  }

  .gap-duration {
    font-size: 0.875rem;
    color: var(--muted);
    background: rgba(0, 200, 255, 0.1);
    padding: var(--space-xs) var(--space-sm);
    border-radius: 6px;
    border: 1px solid var(--glass-border);
    font-family: var(--font-display);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .editor-row {
      flex-direction: column;
    }

    .gap-stats {
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-xs);
      padding: var(--space-xs);
    }
  }

  @media (max-width: 480px) {
    .day-boundaries {
      flex-wrap: wrap;
    }

    .editor-actions {
      flex-direction: column;
    }
  }
</style>
