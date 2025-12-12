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
  class="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b border-base-300 bg-base-100 p-4"
>
  <div class="flex items-center gap-4">
    <button
      class="btn h-9 min-h-0 w-9 border border-base-300 p-0 btn-ghost btn-sm"
      onclick={() => onNavigateMonth(-1)}>←</button
    >
    <h2
      class="m-0 min-w-[140px] text-center text-lg font-normal whitespace-nowrap text-base-content"
    >
      {currentMonth.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
      })}
    </h2>
    <button
      class="btn h-9 min-h-0 w-9 border border-base-300 p-0 btn-ghost btn-sm"
      onclick={() => onNavigateMonth(1)}>→</button
    >
  </div>

  <div class="flex items-center gap-2">
    <button
      class="btn hidden border border-base-300 btn-ghost btn-xs md:flex"
      onclick={onToggleDebug}
      title="Toggle debug information"
    >
      {showDebugInfo ? "Hide" : "Show"} Debug
    </button>
    {#if calendarError}
      <div
        class="cursor-help rounded-lg border border-error/30 bg-error/10 px-2 py-1 text-xs text-error"
        title={calendarError}
      >
        ⚠️ Recurring events unavailable
      </div>
    {/if}
    <button
      class="btn btn-circle h-10 min-h-0 w-10 border-none bg-[#F08A77] text-xl font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E87862]"
      onclick={onCreateEvent}>+</button
    >
  </div>
</div>
