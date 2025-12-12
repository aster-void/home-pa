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
  class="flex h-full flex-col bg-white/60 pb-[calc(48px+env(safe-area-inset-bottom)+1rem)] backdrop-blur-sm"
>
  <div
    class="sticky top-0 z-10 flex items-center justify-between border-b border-[#1a202c]/5 bg-white/80 p-5 backdrop-blur-md"
  >
    <h1
      class="m-0 font-serif text-3xl font-normal tracking-tight text-[#1a202c] md:text-2xl"
    >
      Tasks
    </h1>
    <button
      class="btn btn-square h-12 w-12 rounded-2xl border-none bg-gradient-to-br from-[#ed8936] to-[#dd6b20] text-white shadow-[0_4px_12px_rgba(237,137,54,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(237,137,54,0.4)] active:translate-y-0"
      onclick={handleAddTask}
      aria-label="Add new task"
    >
      <span class="text-2xl leading-none font-medium">+</span>
    </button>
  </div>

  <div class="flex gap-2 border-b border-[#1a202c]/5 bg-white/40 p-3 md:p-4">
    <button
      class="btn flex-1 rounded-xl border-none transition-all duration-150 btn-sm {filter ===
      'active'
        ? 'bg-[#ed8936] text-white shadow-sm'
        : 'bg-white/60 text-[#718096] hover:bg-white hover:text-[#1a202c]'}"
      onclick={() => (filter = "active")}
    >
      Active ({stats().active})
    </button>
    <button
      class="btn flex-1 rounded-xl border-none transition-all duration-150 btn-sm {filter ===
      'all'
        ? 'bg-[#ed8936] text-white shadow-sm'
        : 'bg-white/60 text-[#718096] hover:bg-white hover:text-[#1a202c]'}"
      onclick={() => (filter = "all")}
    >
      All ({stats().total})
    </button>
    <button
      class="btn flex-1 rounded-xl border-none transition-all duration-150 btn-sm {filter ===
      'completed'
        ? 'bg-[#ed8936] text-white shadow-sm'
        : 'bg-white/60 text-[#718096] hover:bg-white hover:text-[#1a202c]'}"
      onclick={() => (filter = "completed")}
    >
      Done ({stats().completed})
    </button>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    {#if filteredTasks().length === 0}
      <div
        class="flex flex-col items-center justify-center px-4 py-16 text-center text-[#718096]"
      >
        {#if filter === "active"}
          <div class="mb-4 text-6xl opacity-40">🎯</div>
          <p class="m-0 text-lg font-medium text-[#4a5568]">No active tasks</p>
          <p class="m-0 mt-2 text-sm text-[#718096]">
            Tap + to create your first task
          </p>
        {:else if filter === "completed"}
          <div class="mb-4 text-6xl opacity-40">✓</div>
          <p class="m-0 text-lg font-medium text-[#4a5568]">
            No completed tasks yet
          </p>
        {:else}
          <div class="mb-4 text-6xl opacity-40">📋</div>
          <p class="m-0 text-lg font-medium text-[#4a5568]">No tasks</p>
          <p class="m-0 mt-2 text-sm text-[#718096]">
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
