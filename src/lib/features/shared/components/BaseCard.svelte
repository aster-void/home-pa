<script lang="ts">
  let p: {
    title: string;
    status?: string;
    statusType?: "active" | "inactive" | "warning" | "error" | "success";
    class?: string;
    children?: import("svelte").Snippet;
  } = $props();
</script>

<div
  class="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6 shadow-sm transition-all duration-200 ease-out focus-within:shadow-md hover:shadow-md md:p-4 {p.class ??
    ''}"
>
  <div
    class="mb-4 flex items-center justify-between border-b border-[var(--color-border-default)] pb-3 max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-2"
  >
    <h3
      class="m-0 text-lg font-medium tracking-normal text-[var(--color-text-primary)]"
    >
      {p.title}
    </h3>
    {#if p.status}
      <div class="flex items-center">
        <span
          class="rounded-lg border px-3 py-1.5 text-sm font-normal {p.statusType ===
            'active' || !p.statusType
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary-800)]'
            : ''} {p.statusType === 'inactive'
            ? 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]'
            : ''} {p.statusType === 'warning'
            ? 'border-[var(--color-warning-500)] bg-[var(--color-warning-100)] text-[var(--color-warning-500)]'
            : ''} {p.statusType === 'error'
            ? 'border-[var(--color-error-500)] bg-[var(--color-error-100)] text-[var(--color-error-500)]'
            : ''} {p.statusType === 'success'
            ? 'border-[var(--color-success-500)] bg-[var(--color-success-100)] text-[var(--color-success-700)]'
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
