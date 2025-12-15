<script lang="ts">
  import TaskCard from "./TaskCard.svelte";
  import TaskForm from "./TaskForm.svelte";
  import { tasks, taskActions } from "$lib/features/tasks/state/taskActions.ts";

  // Filter options
  type FilterType = "all" | "active" | "completed";
  let filter = $state<FilterType>("active");

  // Filtered tasks
  let filteredTasks = $derived(() => {
    const allTasks = $tasks;
    switch (filter) {
      case "active":
        return allTasks.filter((t) => t.status.completionState !== "completed");
      case "completed":
        return allTasks.filter((t) => t.status.completionState === "completed");
      default:
        return allTasks;
    }
  });

  // Stats
  let stats = $derived(() => {
    const all = $tasks;
    const active = all.filter(
      (t) => t.status.completionState !== "completed",
    ).length;
    const completed = all.filter(
      (t) => t.status.completionState === "completed",
    ).length;
    return { total: all.length, active, completed };
  });

  function handleAddTask() {
    taskActions.startCreate();
  }
</script>

<div
  class="flex h-full flex-col bg-[var(--color-bg-app)]/60 pb-[calc(48px+env(safe-area-inset-bottom)+1rem)] backdrop-blur-sm"
>
  <div
    class="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-app)]/90 p-5 backdrop-blur-md"
  >
    <h1
      class="m-0 text-3xl font-normal tracking-tight text-[var(--color-text-primary)] md:text-2xl"
    >
      Tasks
    </h1>
    <button
      class="btn btn-square h-12 w-12 rounded-xl border-none bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-800)] text-white shadow-[0_4px_12px_rgba(123,190,187,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(123,190,187,0.4)] active:translate-y-0"
      onclick={handleAddTask}
      aria-label="Add new task"
    >
      <span class="text-2xl leading-none font-medium">+</span>
    </button>
  </div>

  <div
    class="flex gap-2 border-b border-[var(--color-border-default)] bg-[var(--color-bg-app)]/40 p-3 md:p-4"
  >
    <button
      class="btn flex-1 rounded-xl border-none transition-all duration-200 btn-sm {filter ===
      'active'
        ? 'bg-[var(--color-primary)] text-white shadow-sm'
        : 'bg-[var(--color-bg-app)]/60 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-app)] hover:text-[var(--color-text-primary)]'}"
      onclick={() => (filter = "active")}
    >
      Active ({stats().active})
    </button>
    <button
      class="btn flex-1 rounded-xl border-none transition-all duration-200 btn-sm {filter ===
      'all'
        ? 'bg-[var(--color-primary)] text-white shadow-sm'
        : 'bg-[var(--color-bg-app)]/60 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-app)] hover:text-[var(--color-text-primary)]'}"
      onclick={() => (filter = "all")}
    >
      All ({stats().total})
    </button>
    <button
      class="btn flex-1 rounded-xl border-none transition-all duration-200 btn-sm {filter ===
      'completed'
        ? 'bg-[var(--color-primary)] text-white shadow-sm'
        : 'bg-[var(--color-bg-app)]/60 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-app)] hover:text-[var(--color-text-primary)]'}"
      onclick={() => (filter = "completed")}
    >
      Done ({stats().completed})
    </button>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    {#if filteredTasks().length === 0}
      <div
        class="flex flex-col items-center justify-center px-4 py-16 text-center text-[var(--color-text-muted)]"
      >
        {#if filter === "active"}
          <div class="mb-4 text-6xl opacity-40">🎯</div>
          <p class="m-0 text-lg font-medium text-[var(--color-text-secondary)]">
            No active tasks
          </p>
          <p class="m-0 mt-2 text-sm text-[var(--color-text-muted)]">
            Tap + to create your first task
          </p>
        {:else if filter === "completed"}
          <div class="mb-4 text-6xl opacity-40">✓</div>
          <p class="m-0 text-lg font-medium text-[var(--color-text-secondary)]">
            No completed tasks yet
          </p>
        {:else}
          <div class="mb-4 text-6xl opacity-40">📋</div>
          <p class="m-0 text-lg font-medium text-[var(--color-text-secondary)]">
            No tasks
          </p>
          <p class="m-0 mt-2 text-sm text-[var(--color-text-muted)]">
            Tap + to create your first task
          </p>
        {/if}
      </div>
    {:else}
      {#each filteredTasks() as task (task.id)}
        <TaskCard {task} />
      {/each}
    {/if}
  </div>
</div>

<TaskForm />
