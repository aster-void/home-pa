<script lang="ts">
  import type { Memo } from "$lib/types.ts";
  import {
    taskActions,
    enrichingTaskIds,
  } from "$lib/features/tasks/state/taskActions.ts";

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
  class="card relative mb-2 rounded-xl border border-l-4 border-base-300 bg-base-100 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg {task.type ===
  '期限付き'
    ? 'border-l-[color:var(--color-accent)]'
    : task.type === 'ルーティン'
      ? 'border-l-[color:var(--color-primary)]'
      : 'border-l-base-content/30'}"
  class:opacity-60={task.status.completionState === "completed"}
  class:bg-base-200={task.status.completionState === "completed"}
>
  {#if isEnriching}
    <div
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/70 backdrop-blur-sm"
    >
      <div
        class="h-6 w-6 animate-spin rounded-full border-2 border-base-300 border-t-[color:var(--color-primary)]"
      ></div>
      <span
        class="text-xs font-medium tracking-wide text-[color:var(--color-primary)]"
        >AI analyzing...</span
      >
    </div>
  {/if}
  <div class="mb-2">
    <div class="flex items-center justify-between gap-2">
      <h3
        class="m-0 flex-1 text-base font-semibold text-base-content"
        class:line-through={task.status.completionState === "completed"}
      >
        {task.title}
      </h3>
      <div class="flex items-center gap-1.5">
        <span class="badge badge-sm text-[0.7rem] tracking-wider uppercase"
          >{typeLabel}</span
        >
        {#if genreLabel()}
          <span
            class="badge bg-purple-500/10 badge-sm font-medium text-purple-600"
            >{genreLabel()}</span
          >
        {/if}
        {#if sessionDurationLabel()}
          <span
            class="badge bg-[color:var(--color-today)]/10 badge-sm font-semibold text-[color:var(--color-today)]"
            >{sessionDurationLabel()}</span
          >
        {/if}
      </div>
    </div>
  </div>

  <div class="mb-2 flex flex-col gap-1.5">
    {#if task.type === "期限付き" && task.deadline}
      <div
        class="flex items-center gap-1 text-sm"
        class:text-error={isUrgent()}
        class:font-semibold={isUrgent()}
      >
        <span class="text-[0.9rem]">📅</span>
        <span>{deadlineText()}</span>
      </div>
    {/if}

    {#if task.type === "ルーティン" && routineProgress()}
      {@const prog = routineProgress()}
      <div class="flex items-center gap-1 text-sm text-base-content/70">
        <span class="text-[0.9rem]">🔄</span>
        <span>{prog?.done}/{prog?.goal} this {task.recurrenceGoal?.period}</span
        >
      </div>
    {/if}

    <div class="flex items-center gap-1 text-sm text-base-content/70">
      <span class="text-[0.9rem]">📍</span>
      <span class="opacity-70">{locationLabel}</span>
    </div>
  </div>

  <div class="mb-2 flex items-center gap-2">
    {#if task.type === "ルーティン" && routineProgress()}
      {@const prog = routineProgress()}
      <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-base-200">
        <div
          class="h-full rounded-full bg-[color:var(--color-primary)] transition-all duration-300"
          style="width: {prog?.percent}%"
        ></div>
      </div>
      <span class="min-w-[60px] text-right text-[0.7rem] text-base-content/50"
        >Progress: {prog?.done}/{prog?.goal}</span
      >
    {:else}
      {@const prog = timeProgress()}
      <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-base-200">
        <div
          class="h-full rounded-full bg-[color:var(--color-accent)] transition-all duration-300"
          style="width: {prog.percent}%"
        ></div>
      </div>
      <span class="min-w-[60px] text-right text-[0.7rem] text-base-content/50"
        >Progress: {prog.spent}/{prog.total} min</span
      >
    {/if}
  </div>

  <div
    class="flex justify-end gap-2 opacity-0 transition-opacity duration-200 max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100"
  >
    {#if task.status.completionState !== "completed"}
      <button
        class="btn h-7 min-h-0 w-7 border border-success bg-base-200 text-success transition-all duration-150 btn-xs hover:scale-110 hover:bg-success hover:text-white"
        onclick={handleComplete}
        title="Mark complete"
      >
        ✓
      </button>
    {/if}
    <button
      class="btn h-7 min-h-0 w-7 border border-[color:var(--color-primary)] bg-base-200 transition-all duration-150 btn-xs hover:scale-110 hover:bg-[color:var(--color-primary)] hover:text-base-100"
      onclick={handleEdit}
      title="Edit"
    >
      ✏️
    </button>
    <button
      class="btn h-7 min-h-0 w-7 border border-error bg-base-200 text-error transition-all duration-150 btn-xs hover:scale-110 hover:bg-error hover:text-white"
      onclick={handleDelete}
      title="Delete"
    >
      🗑️
    </button>
  </div>
</div>
