<script lang="ts">
  import { toasts } from "../stores/toast.js";
  import { fly } from "svelte/transition";

  let toastList = $state($toasts);

  $effect(() => {
    const unsubscribe = toasts.subscribe((value) => {
      toastList = value;
    });
    return unsubscribe;
  });
</script>

<div class="toast-container">
  {#each toastList as toast (toast.id)}
    <div
      class="toast toast-{toast.type}"
      transition:fly={{ y: -20, duration: 300 }}
      role="status"
      aria-live="polite"
    >
      <span class="toast-icon">
        {#if toast.type === "success"}✓{/if}
        {#if toast.type === "error"}✕{/if}
        {#if toast.type === "info"}ℹ{/if}
      </span>
      <span class="toast-message">{toast.message}</span>
      <button
        class="toast-close"
        onclick={() => toasts.remove(toast.id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: var(--space-lg);
    right: var(--space-lg);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--card);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border-left: 4px solid;
    min-width: 250px;
    max-width: 400px;
    pointer-events: auto;
    font-family: var(--font-sans);
    font-size: 0.875rem;
  }

  .toast-success {
    border-left-color: #10b981;
    background: linear-gradient(
      135deg,
      rgba(16, 185, 129, 0.1) 0%,
      var(--card) 100%
    );
  }

  .toast-error {
    border-left-color: #ef4444;
    background: linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.1) 0%,
      var(--card) 100%
    );
  }

  .toast-info {
    border-left-color: #3b82f6;
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.1) 0%,
      var(--card) 100%
    );
  }

  .toast-icon {
    font-size: 1.125rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .toast-success .toast-icon {
    color: #10b981;
  }

  .toast-error .toast-icon {
    color: #ef4444;
  }

  .toast-info .toast-icon {
    color: #3b82f6;
  }

  .toast-message {
    flex: 1;
    color: var(--text);
    line-height: 1.4;
  }

  .toast-close {
    flex-shrink: 0;
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.18s ease;
    font-size: 0.875rem;
  }

  .toast-close:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--text);
  }

  @media (max-width: 640px) {
    .toast-container {
      top: var(--space-md);
      right: var(--space-md);
      left: var(--space-md);
    }

    .toast {
      min-width: auto;
      max-width: none;
    }
  }
</style>

