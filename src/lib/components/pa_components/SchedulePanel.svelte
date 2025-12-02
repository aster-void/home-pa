<script lang="ts">
  /**
   * Schedule Panel
   *
   * Displays the scheduled blocks from the suggestion engine.
   * Shows next task prominently, upcoming tasks list, and dropped warnings.
   */

  import {
    scheduleResult,
    isScheduleLoading,
    scheduleError,
    nextScheduledBlock,
    scheduledBlocks,
    droppedMandatory,
    hasMandatoryDropped,
    scheduleActions,
  } from "../../stores/schedule.js";
  import { tasks } from "../../stores/actions/taskActions.js";
  import { enrichedGaps } from "../../stores/gaps.js";
  import { get } from "svelte/store";

  // Get memo title from memoId
  function getMemoTitle(memoId: string): string {
    const taskList = get(tasks);
    const task = taskList.find((t) => t.id === memoId);
    return task?.title ?? "Unknown Task";
  }

  // Get memo type from memoId
  function getMemoType(memoId: string): string {
    const taskList = get(tasks);
    const task = taskList.find((t) => t.id === memoId);
    return task?.type ?? "";
  }

  // Format duration nicely
  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  // Regenerate schedule
  async function handleRegenerate() {
    const currentTasks = get(tasks);
    const currentGaps = get(enrichedGaps);
    await scheduleActions.regenerate(currentTasks, { gaps: currentGaps });
  }

  // Type badge colors
  function getTypeBadgeClass(type: string): string {
    switch (type) {
      case "期限付き":
        return "badge-deadline";
      case "ルーティン":
        return "badge-routine";
      case "バックログ":
        return "badge-backlog";
      default:
        return "";
    }
  }
</script>

<div class="schedule-panel">
  <div class="panel-header">
    <h3>Schedule</h3>
    <button
      class="regenerate-btn"
      onclick={handleRegenerate}
      disabled={$isScheduleLoading}
    >
      {#if $isScheduleLoading}
        <span class="spinner"></span>
      {:else}
        🔄
      {/if}
    </button>
  </div>

  {#if $scheduleError}
    <div class="error-message">
      <span class="error-icon">⚠️</span>
      {$scheduleError}
    </div>
  {/if}

  {#if $hasMandatoryDropped}
    <div class="warning-message">
      <span class="warning-icon">⚠️</span>
      <span>Some mandatory tasks couldn't be scheduled!</span>
    </div>
  {/if}

  {#if !$scheduleResult}
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No schedule yet</p>
      <button class="generate-btn" onclick={handleRegenerate}>
        Generate Schedule
      </button>
    </div>
  {:else if $scheduledBlocks.length === 0}
    <div class="empty-state">
      <div class="empty-icon">✨</div>
      <p>No tasks scheduled</p>
      <p class="empty-subtitle">Add tasks and regenerate</p>
    </div>
  {:else}
    <!-- Next Task (Hero Card) -->
    {#if $nextScheduledBlock}
      {@const next = $nextScheduledBlock}
      {@const title = getMemoTitle(next.memoId)}
      {@const type = getMemoType(next.memoId)}
      <div class="next-task-card">
        <div class="next-label">Next</div>
        <h4 class="next-title">{title}</h4>
        <div class="next-time">
          {next.startTime} - {next.endTime}
        </div>
        <div class="next-meta">
          <span class="type-badge {getTypeBadgeClass(type)}">{type}</span>
          <span class="duration">{formatDuration(next.duration)}</span>
        </div>
        <div class="next-actions">
          <button class="action-btn primary">Start</button>
          <button class="action-btn secondary">Skip</button>
        </div>
      </div>
    {/if}

    <!-- Upcoming Tasks -->
    {#if $scheduledBlocks.length > 1}
      <div class="upcoming-section">
        <h4 class="section-title">Upcoming</h4>
        <ul class="upcoming-list">
          {#each $scheduledBlocks.slice(1) as block (block.suggestionId)}
            {@const title = getMemoTitle(block.memoId)}
            {@const type = getMemoType(block.memoId)}
            <li class="upcoming-item">
              <span class="upcoming-time">{block.startTime}</span>
              <span class="upcoming-title">{title}</span>
              <span class="upcoming-duration">{formatDuration(block.duration)}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Dropped Tasks Warning -->
    {#if $droppedMandatory.length > 0}
      <div class="dropped-section">
        <h4 class="section-title warning">⚠️ Couldn't Schedule</h4>
        <ul class="dropped-list">
          {#each $droppedMandatory as suggestion (suggestion.id)}
            {@const title = getMemoTitle(suggestion.memoId)}
            <li class="dropped-item">
              <span class="dropped-title">{title}</span>
              <span class="dropped-reason">No available gap</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</div>

<style>
  .schedule-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md);
    height: 100%;
    overflow-y: auto;
    background: var(--bg-card);
    border-left: 1px solid var(--glass-border);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-header h3 {
    margin: 0;
    font-size: var(--fs-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .regenerate-btn {
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid var(--primary);
    background: transparent;
    color: var(--primary);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.18s ease;
  }

  .regenerate-btn:hover:not(:disabled) {
    background: var(--primary);
    color: var(--bg);
  }

  .regenerate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid var(--primary);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-message,
  .warning-message {
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--fs-sm);
  }

  .error-message {
    background: rgba(255, 59, 59, 0.1);
    color: var(--danger);
    border: 1px solid var(--danger);
  }

  .warning-message {
    background: rgba(255, 193, 7, 0.1);
    color: #f59e0b;
    border: 1px solid #f59e0b;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
    text-align: center;
    color: var(--text-secondary);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--space-md);
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0 0 var(--space-sm) 0;
    font-size: var(--fs-md);
  }

  .empty-subtitle {
    font-size: var(--fs-sm);
    opacity: 0.7;
  }

  .generate-btn {
    margin-top: var(--space-md);
    padding: var(--space-sm) var(--space-lg);
    background: var(--primary);
    color: var(--bg);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .generate-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 224, 255, 0.3);
  }

  /* Next Task Card */
  .next-task-card {
    background: linear-gradient(135deg, var(--coral), #ff6b6b);
    color: white;
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 20px rgba(240, 138, 119, 0.3);
  }

  .next-label {
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.8;
    margin-bottom: var(--space-xs);
  }

  .next-title {
    margin: 0 0 var(--space-sm) 0;
    font-size: var(--fs-lg);
    font-weight: var(--font-weight-bold);
  }

  .next-time {
    font-size: var(--fs-md);
    opacity: 0.9;
    margin-bottom: var(--space-sm);
  }

  .next-meta {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
    margin-bottom: var(--space-md);
  }

  .type-badge {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: var(--fs-xs);
    font-weight: var(--font-weight-bold);
    background: rgba(255, 255, 255, 0.2);
  }

  .duration {
    font-size: var(--fs-sm);
    opacity: 0.9;
  }

  .next-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .action-btn {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .action-btn.primary {
    background: white;
    color: var(--coral);
  }

  .action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .action-btn.secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .action-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Upcoming Section */
  .upcoming-section {
    margin-top: var(--space-md);
  }

  .section-title {
    margin: 0 0 var(--space-sm) 0;
    font-size: var(--fs-sm);
    font-weight: var(--font-weight-bold);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-title.warning {
    color: #f59e0b;
  }

  .upcoming-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .upcoming-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    font-size: var(--fs-sm);
  }

  .upcoming-time {
    font-weight: var(--font-weight-bold);
    color: var(--primary);
    min-width: 50px;
  }

  .upcoming-title {
    flex: 1;
    color: var(--text-primary);
  }

  .upcoming-duration {
    color: var(--text-secondary);
    font-size: var(--fs-xs);
  }

  /* Dropped Section */
  .dropped-section {
    margin-top: var(--space-md);
  }

  .dropped-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .dropped-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm);
    background: rgba(255, 59, 59, 0.1);
    border-radius: var(--radius-sm);
    font-size: var(--fs-sm);
  }

  .dropped-title {
    color: var(--danger);
  }

  .dropped-reason {
    color: var(--text-secondary);
    font-size: var(--fs-xs);
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .schedule-panel {
      border-left: none;
      border-top: 1px solid var(--glass-border);
    }

    .next-task-card {
      padding: var(--space-md);
    }

    .next-title {
      font-size: var(--fs-md);
    }
  }
</style>

