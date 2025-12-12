<script lang="ts">
  import { toastState } from "$lib/bootstrap/index.svelte.ts";
  import { fly } from "svelte/transition";
</script>

<div
  class="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2 sm:top-3 sm:right-3 sm:left-3"
>
  {#each toastState.toasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex max-w-[400px] min-w-[250px] items-center gap-2 rounded-lg border-l-4 bg-base-100 px-4 py-2 text-sm shadow-[0_4px_16px_rgba(0,0,0,0.15)] sm:max-w-none sm:min-w-0 {toast.type ===
      'success'
        ? 'border-l-success bg-gradient-to-br from-success/10 to-base-100'
        : ''} {toast.type === 'error'
        ? 'border-l-error bg-gradient-to-br from-error/10 to-base-100'
        : ''} {toast.type === 'info'
        ? 'border-l-info bg-gradient-to-br from-info/10 to-base-100'
        : ''}"
      transition:fly={{ y: -20, duration: 300 }}
      role="status"
      aria-live="polite"
    >
      <span
        class="flex-shrink-0 text-lg font-bold {toast.type === 'success'
          ? 'text-success'
          : ''} {toast.type === 'error' ? 'text-error' : ''} {toast.type ===
        'info'
          ? 'text-info'
          : ''}"
      >
        {#if toast.type === "success"}✓{/if}
        {#if toast.type === "error"}✕{/if}
        {#if toast.type === "info"}ℹ{/if}
      </span>
      <span class="flex-1 leading-[1.4] text-base-content">{toast.message}</span
      >
      <button
        class="flex h-5 min-h-[44px] w-5 min-w-[44px] flex-shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-sm text-base-content/60 transition-all duration-[180ms] ease-out hover:bg-black/10 hover:text-base-content"
        onclick={() => toastState.remove(toast.id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  {/each}
</div>
