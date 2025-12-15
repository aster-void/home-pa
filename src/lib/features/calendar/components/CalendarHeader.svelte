<script lang="ts">
  interface Props {
    currentMonth: Date;
    calendarError: string | null;
    showDebugInfo: boolean;
    onNavigateMonth: (direction: number) => void;
    onToggleDebug: () => void;
    onCreateEvent: () => void;
  }

  let {
    currentMonth,
    calendarError,
    showDebugInfo,
    onNavigateMonth,
    onToggleDebug,
    onCreateEvent,
  }: Props = $props();
</script>

<div
  class="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-app)]/90 p-3 backdrop-blur-sm md:p-5"
>
  <div class="flex items-center gap-4">
    <button
      class="btn h-10 min-h-0 w-10 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-0 text-[var(--color-text-secondary)] transition-all duration-200 ease-out btn-sm hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-50)] hover:text-[var(--color-primary)]"
      onclick={() => onNavigateMonth(-1)}>←</button
    >
    <h2
      class="m-0 min-w-[160px] text-center text-xl font-normal tracking-tight whitespace-nowrap text-[var(--color-text-primary)]"
    >
      {currentMonth.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
      })}
    </h2>
    <button
      class="btn h-10 min-h-0 w-10 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-0 text-[var(--color-text-secondary)] transition-all duration-200 ease-out btn-sm hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-50)] hover:text-[var(--color-primary)]"
      onclick={() => onNavigateMonth(1)}>→</button
    >
  </div>

  <div class="flex items-center gap-2">
    <button
      class="btn hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-app)] font-normal text-[var(--color-text-secondary)] btn-xs hover:bg-[var(--color-surface-50)] md:flex"
      onclick={onToggleDebug}
      title="Toggle debug information"
    >
      {showDebugInfo ? "Hide" : "Show"} Debug
    </button>
    {#if calendarError}
      <div
        class="cursor-help rounded-lg border border-[var(--color-error-500)]/30 bg-[var(--color-error-100)] px-2 py-1 text-xs font-normal text-[var(--color-error-500)]"
        title={calendarError}
      >
        ⚠️ Recurring events unavailable
      </div>
    {/if}
    <button
      class="btn btn-circle h-11 min-h-[44px] w-11 min-w-[44px] rounded-xl border-none bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-800)] text-xl font-normal text-white shadow-[0_4px_12px_rgba(123,190,187,0.3)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(123,190,187,0.4)]"
      onclick={onCreateEvent}>+</button
    >
  </div>
</div>
