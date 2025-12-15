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
  } from "$lib/features/assistant/state/schedule.ts";
  import { tasks } from "$lib/features/tasks/state/taskActions.ts";
  import { enrichedGaps } from "$lib/features/assistant/state/gaps.svelte.ts";
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
</script>

<div
  class="flex h-full flex-col gap-4 overflow-y-auto border-l border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4 md:border-t md:border-l-0"
>
  <div class="flex items-center justify-between">
    <h3
      class="m-0 text-lg font-normal tracking-wider text-[var(--color-text-primary)] uppercase"
    >
      Schedule
    </h3>
    <button
      class="btn btn-circle h-10 min-h-10 w-10 border-[var(--color-primary)] text-base text-[var(--color-primary)] transition-all duration-200 hover:bg-[var(--color-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      onclick={handleRegenerate}
      disabled={$isScheduleLoading}
    >
      {#if $isScheduleLoading}
        <span class="loading loading-sm loading-spinner"></span>
      {:else}
        🔄
      {/if}
    </button>
  </div>

  {#if $scheduleError}
    <div
      class="flex items-center gap-2 rounded-xl bg-[var(--color-error-100)] p-3 text-sm text-[var(--color-error-500)]"
      role="alert"
    >
      <span>⚠️</span>
      <span>{$scheduleError}</span>
    </div>
  {/if}

  {#if $hasMandatoryDropped}
    <div
      class="flex items-center gap-2 rounded-xl bg-[var(--color-warning-100)] p-3 text-sm text-[var(--color-warning-500)]"
      role="alert"
    >
      <span>⚠️</span>
      <span>Some mandatory tasks couldn't be scheduled!</span>
    </div>
  {/if}

  {#if !$scheduleResult}
    <div class="flex flex-col items-center justify-center p-8 text-center">
      <div class="mb-4 text-5xl opacity-50">📋</div>
      <p class="mb-2 text-base text-[var(--color-text-secondary)]">
        No schedule yet
      </p>
      <button
        class="btn mt-4 border-none bg-[var(--color-primary)] text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        onclick={handleRegenerate}
      >
        Generate Schedule
      </button>
    </div>
  {:else if $scheduledBlocks.length === 0}
    <div class="flex flex-col items-center justify-center p-8 text-center">
      <div class="mb-4 text-5xl opacity-50">✨</div>
      <p class="mb-2 text-base text-[var(--color-text-secondary)]">
        No tasks scheduled
      </p>
      <p class="text-sm text-[var(--color-text-muted)]">
        Add tasks and regenerate
      </p>
    </div>
  {:else}
    {#if $nextScheduledBlock}
      {@const next = $nextScheduledBlock}
      {@const title = getMemoTitle(next.memoId)}
      {@const _type = getMemoType(next.memoId)}
      <div
        class="rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-800)] p-6 text-white shadow-lg"
      >
        <div class="mb-1 text-xs tracking-widest uppercase opacity-80">
          Next
        </div>
        <h4 class="m-0 mb-2 text-lg font-normal">{title}</h4>
        <div class="mb-2 text-base opacity-90">
          {next.startTime} - {next.endTime}
        </div>
        <div class="mb-4 flex items-center gap-2">
          <span class="rounded-full bg-white/20 px-2 py-0.5 text-xs"
            >{_type}</span
          >
          <span class="text-sm opacity-90">{formatDuration(next.duration)}</span
          >
        </div>
        <div class="flex gap-2">
          <button
            class="btn flex-1 border-none bg-white text-[var(--color-primary-800)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg"
          >
            Start
          </button>
          <button
            class="btn flex-1 border-none bg-white/20 text-white transition-all duration-200 hover:bg-white/30"
          >
            Skip
          </button>
        </div>
      </div>
    {/if}

    {#if $scheduledBlocks.length > 1}
      <div class="mt-4">
        <h4
          class="m-0 mb-2 text-sm font-normal tracking-wider text-[var(--color-text-secondary)] uppercase"
        >
          Upcoming
        </h4>
        <ul class="m-0 flex list-none flex-col gap-1 p-0">
          {#each $scheduledBlocks.slice(1) as block (block.suggestionId)}
            {@const title = getMemoTitle(block.memoId)}
            <li
              class="flex items-center gap-2 rounded-lg bg-[var(--color-bg-surface)] p-2 text-sm"
            >
              <span class="min-w-[50px] font-normal text-[var(--color-primary)]"
                >{block.startTime}</span
              >
              <span class="flex-1 text-[var(--color-text-primary)]"
                >{title}</span
              >
              <span class="text-xs text-[var(--color-text-muted)]"
                >{formatDuration(block.duration)}</span
              >
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if $droppedMandatory.length > 0}
      <div class="mt-4">
        <h4
          class="m-0 mb-2 text-sm font-normal tracking-wider text-[var(--color-warning-500)] uppercase"
        >
          ⚠️ Couldn't Schedule
        </h4>
        <ul class="m-0 flex list-none flex-col gap-1 p-0">
          {#each $droppedMandatory as suggestion (suggestion.id)}
            {@const title = getMemoTitle(suggestion.memoId)}
            <li
              class="flex items-center justify-between rounded-lg bg-[var(--color-error-100)] p-2 text-sm"
            >
              <span class="text-[var(--color-error-500)]">{title}</span>
              <span class="text-xs text-[var(--color-text-muted)]"
                >No available gap</span
              >
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</div>
