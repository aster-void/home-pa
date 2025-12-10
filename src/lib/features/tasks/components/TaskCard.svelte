<script lang="ts">
  import type { Memo } from "$lib/types.js";
  import {
    taskActions,
    enrichingTaskIds,
  } from "$lib/state/actions/taskActions.js";

  interface Props {
    task: Memo;
  }

  let { task }: Props = $props();

  // Check if this task is being enriched
  let isEnriching = $derived($enrichingTaskIds.has(task.id));

  // Computed values
  let typeLabel = $derived(
    task.type === "期限付き"
      ? "Deadline"
      : task.type === "ルーティン"
        ? "Routine"
        : "Backlog",
  );

  let typeClass = $derived(
    task.type === "期限付き"
      ? "deadline"
      : task.type === "ルーティン"
        ? "routine"
        : "backlog",
  );

  // Deadline info
  let daysUntilDeadline = $derived(() => {
    if (!task.deadline) return null;
    const now = new Date();
    const deadline = new Date(task.deadline);
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  let deadlineText = $derived(() => {
    const days = daysUntilDeadline();
    if (days === null) return "";
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days} days left`;
  });

  let isUrgent = $derived(() => {
    const days = daysUntilDeadline();
    return days !== null && days <= 1;
  });

  // Routine progress
  let routineProgress = $derived(() => {
    if (task.type !== "ルーティン" || !task.recurrenceGoal) return null;
    const done = task.status.completionsThisPeriod ?? 0;
    const goal = task.recurrenceGoal.count;
    return { done, goal, percent: Math.min(100, (done / goal) * 100) };
  });

  // Time progress
  let timeProgress = $derived(() => {
    const spent = task.status.timeSpentMinutes;
    const total = task.totalDurationExpected ?? 60;
    return { spent, total, percent: Math.min(100, (spent / total) * 100) };
  });

  // Enriched per-session time (minutes)
  let sessionDurationLabel = $derived(() => {
    if (task.sessionDuration && task.sessionDuration > 0) {
      return `${task.sessionDuration} min session`;
    }
    return null;
  });

  // Genre/category label
  let genreLabel = $derived(() => {
    if (!task.genre) return null;
    return task.genre;
  });

  // Location label
  let locationLabel = $derived(
    task.locationPreference === "home/near_home"
      ? "🏠 Home"
      : task.locationPreference === "workplace/near_workplace"
        ? "🏢 Work"
        : "📍 Anywhere",
  );

  // Handlers
  function handleEdit() {
    taskActions.edit(task);
  }

  function handleDelete() {
    if (confirm("このタスクを削除しますか？")) {
      taskActions.delete(task.id);
    }
  }

  function handleComplete() {
    taskActions.markComplete(task.id);
  }
</script>

<div
  class="task-card {typeClass}"
  class:completed={task.status.completionState === "completed"}
  class:enriching={isEnriching}
>
  {#if isEnriching}
    <div class="enriching-overlay">
      <div class="enriching-spinner"></div>
      <span class="enriching-text">AI analyzing...</span>
    </div>
  {/if}
  <div class="task-header">
    <div class="task-title-row">
      <h3 class="task-title">{task.title}</h3>
      <div class="pills">
        <span class="task-type">{typeLabel}</span>
        {#if genreLabel()}
          <span class="pill pill-genre">{genreLabel()}</span>
        {/if}
        {#if sessionDurationLabel()}
          <span class="pill pill-time">{sessionDurationLabel()}</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="task-meta">
    {#if task.type === "期限付き" && task.deadline}
      <div class="meta-item" class:urgent={isUrgent()}>
        <span class="meta-icon">📅</span>
        <span class="meta-text">{deadlineText()}</span>
      </div>
    {/if}

    {#if task.type === "ルーティン" && routineProgress()}
      {@const prog = routineProgress()}
      <div class="meta-item">
        <span class="meta-icon">🔄</span>
        <span class="meta-text"
          >{prog?.done}/{prog?.goal} this {task.recurrenceGoal?.period}</span
        >
      </div>
    {/if}

    <div class="meta-item">
      <span class="meta-icon">📍</span>
      <span class="meta-text location">{locationLabel}</span>
    </div>
  </div>

  <!-- Progress bar -->
  <div class="progress-section">
    {#if task.type === "ルーティン" && routineProgress()}
      {@const prog = routineProgress()}
      <div class="progress-bar">
        <div
          class="progress-fill routine"
          style="width: {prog?.percent}%"
        ></div>
      </div>
      <span class="progress-label">Progress: {prog?.done}/{prog?.goal}</span>
    {:else}
      {@const prog = timeProgress()}
      <div class="progress-bar">
        <div class="progress-fill time" style="width: {prog.percent}%"></div>
      </div>
      <span class="progress-label">Progress: {prog.spent}/{prog.total} min</span
      >
    {/if}
  </div>

  <!-- Actions -->
  <div class="task-actions">
    {#if task.status.completionState !== "completed"}
      <button
        class="action-btn complete"
        onclick={handleComplete}
        title="Mark complete"
      >
        ✓
      </button>
    {/if}
    <button class="action-btn edit" onclick={handleEdit} title="Edit">
      ✏️
    </button>
    <button class="action-btn delete" onclick={handleDelete} title="Delete">
      🗑️
    </button>
  </div>
</div>

<style>
  .task-card {
    background: var(--bg-card);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: var(--space-md);
    margin-bottom: var(--space-sm);
    position: relative;
    transition: all 0.2s ease;
  }

  .task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .task-card.completed {
    opacity: 0.6;
    background: var(--bg-secondary);
  }

  .task-card.completed .task-title {
    text-decoration: line-through;
  }

  /* Enriching state */
  .task-card.enriching {
    position: relative;
  }

  .enriching-overlay {
    position: absolute;
    inset: 0;
    background: rgba(var(--bg-rgb, 0, 0, 0), 0.7);
    backdrop-filter: blur(2px);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    z-index: 10;
  }

  .enriching-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--glass-border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .enriching-text {
    font-size: 0.75rem;
    color: var(--primary);
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Type-specific left border */
  .task-card.deadline {
    border-left: 4px solid var(--coral);
  }

  .task-card.routine {
    border-left: 4px solid var(--primary);
  }

  .task-card.backlog {
    border-left: 4px solid var(--muted);
  }

  .task-header {
    margin-bottom: var(--space-sm);
  }

  .task-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .task-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    flex: 1;
  }

  .task-type {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--bg-secondary);
    color: var(--muted);
    font-weight: 500;
  }

  .pills {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .pill {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .pill-time {
    background: rgba(0, 102, 204, 0.1);
    color: var(--primary);
  }

  .pill-genre {
    background: rgba(139, 92, 246, 0.1);
    color: rgb(139, 92, 246);
    font-weight: 500;
  }

  .task-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: var(--space-sm);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .meta-item.urgent {
    color: var(--danger);
    font-weight: 600;
  }

  .meta-icon {
    font-size: 0.9rem;
  }

  .location {
    opacity: 0.7;
  }

  .progress-section {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--bg-secondary);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-fill.routine {
    background: var(--primary);
  }

  .progress-fill.time {
    background: var(--coral);
  }

  .progress-label {
    font-size: 0.7rem;
    color: var(--muted);
    min-width: 60px;
    text-align: right;
  }

  .task-actions {
    display: flex;
    gap: var(--space-xs);
    justify-content: flex-end;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .task-card:hover .task-actions {
    opacity: 1;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--glass-border);
    background: var(--bg-secondary);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    transform: scale(1.1);
  }

  .action-btn.complete {
    border-color: var(--success);
    color: var(--success);
  }

  .action-btn.complete:hover {
    background: var(--success);
    color: white;
  }

  .action-btn.edit {
    border-color: var(--primary);
  }

  .action-btn.edit:hover {
    background: var(--primary);
    color: var(--bg);
  }

  .action-btn.delete {
    border-color: var(--danger);
  }

  .action-btn.delete:hover {
    background: var(--danger);
    color: white;
  }

  @media (max-width: 768px) {
    .task-actions {
      opacity: 1;
    }
  }
</style>
