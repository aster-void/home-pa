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
  class="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b border-[#1a202c]/5 bg-white/80 p-5 backdrop-blur-md"
>
  <div class="flex items-center gap-4">
    <button
      class="btn h-10 min-h-0 w-10 rounded-xl border border-[#1a202c]/10 bg-white p-0 text-[#4a5568] transition-all duration-200 btn-sm hover:border-[#ed8936]/30 hover:bg-[#ed8936]/10 hover:text-[#ed8936]"
      onclick={() => onNavigateMonth(-1)}>←</button
    >
    <h2
      class="m-0 min-w-[160px] text-center font-serif text-xl font-normal tracking-tight whitespace-nowrap text-[#1a202c]"
    >
      {currentMonth.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
      })}
    </h2>
    <button
      class="btn h-10 min-h-0 w-10 rounded-xl border border-[#1a202c]/10 bg-white p-0 text-[#4a5568] transition-all duration-200 btn-sm hover:border-[#ed8936]/30 hover:bg-[#ed8936]/10 hover:text-[#ed8936]"
      onclick={() => onNavigateMonth(1)}>→</button
    >
  </div>

  <div class="flex items-center gap-2">
    <button
      class="btn hidden rounded-lg border border-[#1a202c]/10 bg-white text-[#718096] btn-xs hover:bg-[#1a202c]/5 md:flex"
      onclick={onToggleDebug}
      title="Toggle debug information"
    >
      {showDebugInfo ? "Hide" : "Show"} Debug
    </button>
    {#if calendarError}
      <div
        class="cursor-help rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-2 py-1 text-xs text-[#EF4444]"
        title={calendarError}
      >
        ⚠️ Recurring events unavailable
      </div>
    {/if}
    <button
      class="btn btn-circle h-11 min-h-0 w-11 rounded-xl border-none bg-gradient-to-br from-[#ed8936] to-[#dd6b20] text-xl font-medium text-white shadow-[0_4px_12px_rgba(237,137,54,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(237,137,54,0.4)]"
      onclick={onCreateEvent}>+</button
    >
  </div>
</div>
