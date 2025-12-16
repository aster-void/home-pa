<script lang="ts">
  /**
   * ProgressMemoView Component
   *
   * Mini app for tracking progress on goals and habits.
   * Currently UI-only, API integration planned.
   */

  interface Props {
    onClose?: () => void;
  }

  const { onClose }: Props = $props();

  // Mock data for UI
  interface Goal {
    id: string;
    title: string;
    progress: number;
    target: number;
    unit: string;
    streak: number;
    lastUpdated: string;
    color: string;
  }

  const goals = $state<Goal[]>([
    {
      id: "1",
      title: "Read books",
      progress: 12,
      target: 24,
      unit: "books",
      streak: 5,
      lastUpdated: "Today",
      color: "var(--color-primary)",
    },
    {
      id: "2",
      title: "Exercise",
      progress: 18,
      target: 30,
      unit: "sessions",
      streak: 3,
      lastUpdated: "Yesterday",
      color: "var(--color-success-500)",
    },
    {
      id: "3",
      title: "Learn Japanese",
      progress: 45,
      target: 100,
      unit: "lessons",
      streak: 12,
      lastUpdated: "Today",
      color: "var(--color-warning-500)",
    },
  ]);

  const quickLogs = $state([
    { id: "q1", title: "Morning routine", emoji: "🌅", count: 28 },
    { id: "q2", title: "Water intake", emoji: "💧", count: 6 },
    { id: "q3", title: "Meditation", emoji: "🧘", count: 15 },
  ]);

  function getProgressPercent(progress: number, target: number): number {
    return Math.min(100, Math.round((progress / target) * 100));
  }

  function incrementQuickLog(id: string) {
    const log = quickLogs.find((l) => l.id === id);
    if (log) {
      log.count++;
    }
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <div
    class="flex items-center justify-between border-b border-[var(--color-border-default)] p-4"
  >
    <div class="flex items-center gap-3">
      <span class="text-2xl">📊</span>
      <h2 class="m-0 text-xl font-medium text-[var(--color-text-primary)]">
        Progress Memo
      </h2>
    </div>
    {#if onClose}
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
        onclick={onClose}
        aria-label="Close"
      >
        ×
      </button>
    {/if}
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-4">
    <!-- Quick Log Section -->
    <section class="mb-6">
      <h3 class="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
        Quick Log
      </h3>
      <div class="grid grid-cols-3 gap-3">
        {#each quickLogs as log (log.id)}
          <button
            class="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4 transition-all duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-100)] active:scale-95"
            onclick={() => incrementQuickLog(log.id)}
          >
            <span class="text-2xl">{log.emoji}</span>
            <span class="text-xs text-[var(--color-text-secondary)]"
              >{log.title}</span
            >
            <span class="text-lg font-semibold text-[var(--color-text-primary)]"
              >{log.count}</span
            >
          </button>
        {/each}
      </div>
    </section>

    <!-- Goals Section -->
    <section class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-medium text-[var(--color-text-secondary)]">
          Goals
        </h3>
        <button
          class="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors duration-200 hover:bg-[var(--color-primary-100)]"
        >
          + Add Goal
        </button>
      </div>

      <div class="flex flex-col gap-3">
        {#each goals as goal (goal.id)}
          <div
            class="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4"
          >
            <div class="mb-3 flex items-start justify-between">
              <div>
                <span
                  class="text-base font-medium text-[var(--color-text-primary)]"
                  >{goal.title}</span
                >
                <div class="mt-1 flex items-center gap-2">
                  <span class="text-xs text-[var(--color-text-muted)]"
                    >🔥 {goal.streak} day streak</span
                  >
                  <span class="text-xs text-[var(--color-text-muted)]"
                    >• {goal.lastUpdated}</span
                  >
                </div>
              </div>
              <span class="text-lg font-semibold" style="color: {goal.color}">
                {getProgressPercent(goal.progress, goal.target)}%
              </span>
            </div>

            <!-- Progress Bar -->
            <div
              class="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-surface)]"
            >
              <div
                class="h-full rounded-full transition-all duration-300"
                style="width: {getProgressPercent(
                  goal.progress,
                  goal.target,
                )}%; background-color: {goal.color}"
              ></div>
            </div>

            <div
              class="flex items-center justify-between text-xs text-[var(--color-text-muted)]"
            >
              <span>{goal.progress} / {goal.target} {goal.unit}</span>
              <button
                class="rounded-lg bg-[var(--color-bg-surface)] px-3 py-1.5 font-medium text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-primary-100)] hover:text-[var(--color-primary)]"
              >
                + Log
              </button>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Stats Overview -->
    <section>
      <h3 class="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
        This Week
      </h3>
      <div
        class="grid grid-cols-2 gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4"
      >
        <div class="text-center">
          <div class="text-2xl font-semibold text-[var(--color-text-primary)]">
            23
          </div>
          <div class="text-xs text-[var(--color-text-muted)]">Activities</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-semibold text-[var(--color-success-500)]">
            85%
          </div>
          <div class="text-xs text-[var(--color-text-muted)]">Completion</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-semibold text-[var(--color-primary)]">
            12
          </div>
          <div class="text-xs text-[var(--color-text-muted)]">Best Streak</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-semibold text-[var(--color-warning-500)]">
            3
          </div>
          <div class="text-xs text-[var(--color-text-muted)]">Goals Active</div>
        </div>
      </div>
    </section>

    <!-- API Notice -->
    <div
      class="mt-6 rounded-xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-center"
    >
      <p class="text-sm text-[var(--color-text-muted)]">
        🚧 Data persistence coming soon
      </p>
      <p class="mt-1 text-xs text-[var(--color-text-muted)]">
        Currently showing mock data
      </p>
    </div>
  </div>
</div>
