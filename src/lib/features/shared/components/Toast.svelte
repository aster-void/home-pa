<script lang="ts">
  import { toastState } from "$lib/bootstrap/index.svelte.ts";
  import { fly } from "svelte/transition";
</script>

<div
  class="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2 sm:top-3 sm:right-3 sm:left-3"
>
  {#each toastState.toasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex max-w-[400px] min-w-[250px] items-center gap-3 rounded-xl border-l-4 bg-[var(--color-bg-app)] px-4 py-3 text-sm shadow-[0_4px_16px_rgba(0,0,0,0.12)] sm:max-w-none sm:min-w-0 {toast.type ===
      'success'
        ? 'border-l-[var(--color-success-500)] bg-gradient-to-br from-[var(--color-success-100)] to-[var(--color-bg-app)]'
        : ''} {toast.type === 'error'
        ? 'border-l-[var(--color-error-500)] bg-gradient-to-br from-[var(--color-error-100)] to-[var(--color-bg-app)]'
        : ''} {toast.type === 'info'
        ? 'border-l-[var(--color-primary)] bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-bg-app)]'
        : ''}"
      transition:fly={{ y: -20, duration: 300 }}
      role="status"
      aria-live="polite"
    >
      <span
        class="flex-shrink-0 text-lg font-medium {toast.type === 'success'
          ? 'text-[var(--color-success-700)]'
          : ''} {toast.type === 'error'
          ? 'text-[var(--color-error-500)]'
          : ''} {toast.type === 'info'
          ? 'text-[var(--color-primary-800)]'
          : ''}"
      >
        {#if toast.type === "success"}✓{/if}
        {#if toast.type === "error"}✕{/if}
        {#if toast.type === "info"}ℹ{/if}
      </span>
      <span
        class="flex-1 leading-[1.4] font-normal text-[var(--color-text-primary)]"
        >{toast.message}</span
      >
      <button
        class="flex h-6 min-h-[44px] w-6 min-w-[44px] flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 text-sm text-[var(--color-text-secondary)] transition-all duration-200 ease-out hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]"
        onclick={() => toastState.remove(toast.id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  {/each}
</div>
