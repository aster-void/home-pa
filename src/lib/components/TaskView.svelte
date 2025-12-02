<script lang="ts">
  import { TaskCard, TaskForm } from "./task_components/index.js";
  import { tasks, taskActions } from "../stores/actions/taskActions.js";

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
    const active = all.filter((t) => t.status.completionState !== "completed").length;
    const completed = all.filter((t) => t.status.completionState === "completed").length;
    return { total: all.length, active, completed };
  });

  function handleAddTask() {
    taskActions.startCreate();
  }
</script>

<div class="task-view">
  <div class="task-header">
    <h1>Tasks</h1>
    <button class="add-btn" onclick={handleAddTask} aria-label="Add new task">
      <span class="add-icon">+</span>
    </button>
  </div>

  <!-- Filter tabs -->
  <div class="filter-tabs">
    <button
      class="filter-tab"
      class:active={filter === "active"}
      onclick={() => (filter = "active")}
    >
      Active ({stats().active})
    </button>
    <button
      class="filter-tab"
      class:active={filter === "all"}
      onclick={() => (filter = "all")}
    >
      All ({stats().total})
    </button>
    <button
      class="filter-tab"
      class:active={filter === "completed"}
      onclick={() => (filter = "completed")}
    >
      Done ({stats().completed})
    </button>
  </div>

  <!-- Task list -->
  <div class="task-list">
    {#if filteredTasks().length === 0}
      <div class="empty-state">
        {#if filter === "active"}
          <div class="empty-icon">🎯</div>
          <p>No active tasks</p>
          <p class="empty-subtitle">Tap + to create your first task</p>
        {:else if filter === "completed"}
          <div class="empty-icon">✓</div>
          <p>No completed tasks yet</p>
        {:else}
          <div class="empty-icon">📋</div>
          <p>No tasks</p>
          <p class="empty-subtitle">Tap + to create your first task</p>
        {/if}
      </div>
    {:else}
      {#each filteredTasks() as task (task.id)}
        <TaskCard {task} />
      {/each}
    {/if}
  </div>
</div>

<!-- Task Form Modal -->
<TaskForm />

<style>
  .task-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
    padding-bottom: calc(var(--bottom-nav-height, 48px) + env(safe-area-inset-bottom) + var(--space-md));
  }

  .task-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    background: var(--bg-card);
    border-bottom: 1px solid var(--glass-border);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .task-header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    letter-spacing: 0.02em;
  }

  .add-btn {
    width: 44px;
    height: 44px;
    border: none;
    background: var(--coral);
    color: white;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(240, 138, 119, 0.3);
  }

  .add-btn:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 16px rgba(240, 138, 119, 0.4);
  }

  .add-btn:active {
    transform: translateY(0) scale(0.98);
  }

  .filter-tabs {
    display: flex;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--glass-border);
  }

  .filter-tab {
    flex: 1;
    padding: var(--space-sm);
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.15s ease;
  }

  .filter-tab:hover {
    background: var(--bg-card);
    color: var(--text);
  }

  .filter-tab.active {
    background: var(--primary);
    color: var(--bg);
  }

  .task-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-md);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem var(--space-md);
    text-align: center;
    color: var(--muted);
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--space-md);
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .empty-subtitle {
    font-size: 0.9rem !important;
    margin-top: var(--space-sm) !important;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    .task-header {
      padding: var(--space-sm) var(--space-md);
    }

    .task-header h1 {
      font-size: 1.25rem;
    }

    .add-btn {
      width: 40px;
      height: 40px;
      font-size: 1.25rem;
    }
  }
</style>

