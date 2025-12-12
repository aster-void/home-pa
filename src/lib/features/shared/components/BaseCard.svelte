<script lang="ts">
  let p: {
    title: string;
    status?: string;
    statusType?: "active" | "inactive" | "warning" | "error";
    class?: string;
    children?: import("svelte").Snippet;
  } = $props();
</script>

<div
  class="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] focus-within:-translate-y-1 focus-within:shadow-md hover:-translate-y-1 hover:shadow-md md:p-2 {p.class ??
    ''}"
>
  <div
    class="mb-4 flex items-center justify-between border-b border-base-300/50 pb-4 max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-2"
  >
    <h3 class="m-0 text-lg font-bold tracking-wide text-base-content">
      {p.title}
    </h3>
    {#if p.status}
      <div class="flex items-center">
        <span
          class="rounded-lg border px-2 py-1 text-sm font-bold {p.statusType ===
            'active' || !p.statusType
            ? 'border-[#F08A77] bg-[#F08A77]/10 text-[color:var(--coral)]'
            : ''} {p.statusType === 'inactive'
            ? 'border-base-content/20 bg-base-content/[0.05] text-base-content/60'
            : ''} {p.statusType === 'warning'
            ? 'border-warning bg-warning/10 text-warning'
            : ''} {p.statusType === 'error'
            ? 'border-error bg-error/10 text-error'
            : ''}"
        >
          {p.status}
        </span>
      </div>
    {/if}
  </div>

  <div class="min-h-[200px]">
    {@render p.children?.()}
  </div>
</div>
