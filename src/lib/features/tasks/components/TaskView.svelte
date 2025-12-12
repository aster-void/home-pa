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
  class="flex h-full flex-col bg-base-100 pb-[calc(48px+env(safe-area-inset-bottom)+1rem)]"
>
  <div
    class="sticky top-0 z-10 flex items-center justify-between border-b border-base-300 bg-base-100 p-4"
  >
    <h1
      class="m-0 text-2xl font-bold tracking-wide text-base-content md:text-xl"
    >
      Tasks
    </h1>
    <button
      class="btn btn-square h-11 w-11 border-none bg-[#F08A77] text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#E87862] active:translate-y-0 active:scale-98"
      onclick={handleAddTask}
      aria-label="Add new task"
    >
      <span class="text-2xl leading-none font-medium">+</span>
    </button>
  </div>

  <div class="flex gap-2 border-b border-base-300 bg-base-200 p-2 md:p-4">
    <button
      class="btn flex-1 border-none transition-all duration-150 btn-sm {filter ===
      'active'
        ? 'bg-[color:var(--color-primary)] text-[color:oklch(var(--b1))]'
        : 'bg-transparent text-base-content/50 hover:bg-[color:oklch(var(--b1))] hover:text-base-content'}"
      onclick={() => (filter = "active")}
    >
      Active ({stats().active})
    </button>
    <button
      class="btn flex-1 border-none transition-all duration-150 btn-sm {filter ===
      'all'
        ? 'bg-[color:var(--color-primary)] text-[color:oklch(var(--b1))]'
        : 'bg-transparent text-base-content/50 hover:bg-[color:oklch(var(--b1))] hover:text-base-content'}"
      onclick={() => (filter = "all")}
    >
      All ({stats().total})
    </button>
    <button
      class="btn flex-1 border-none transition-all duration-150 btn-sm {filter ===
      'completed'
        ? 'bg-[color:var(--color-primary)] text-[color:oklch(var(--b1))]'
        : 'bg-transparent text-base-content/50 hover:bg-[color:oklch(var(--b1))] hover:text-base-content'}"
      onclick={() => (filter = "completed")}
    >
      Done ({stats().completed})
    </button>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    {#if filteredTasks().length === 0}
      <div
        class="flex flex-col items-center justify-center px-4 py-16 text-center text-base-content/50"
      >
        {#if filter === "active"}
          <div class="mb-4 text-6xl opacity-50">🎯</div>
          <p class="m-0 text-lg font-medium">No active tasks</p>
          <p class="m-0 mt-2 text-sm opacity-70">
            Tap + to create your first task
          </p>
        {:else if filter === "completed"}
          <div class="mb-4 text-6xl opacity-50">✓</div>
          <p class="m-0 text-lg font-medium">No completed tasks yet</p>
        {:else}
          <div class="mb-4 text-6xl opacity-50">📋</div>
          <p class="m-0 text-lg font-medium">No tasks</p>
          <p class="m-0 mt-2 text-sm opacity-70">
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
