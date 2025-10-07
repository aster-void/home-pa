<script lang="ts">
  import type { AppController } from "../controllers/app.controller.svelte.ts";
  import type { Suggestion } from "../types.js";

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Get current suggestion from store
  let currentSuggestion = $state(null as Suggestion | null);

  // Subscribe to controller store changes
  $effect(() => {
    if (controller) {
      const unsubscribe = controller.currentSuggestion.subscribe((value) => {
        currentSuggestion = value;
      });

      return unsubscribe;
    }
  });
</script>

{#if currentSuggestion}
  <div class="suggestion-panel">
    <div class="suggestion-header">
      <h3>時間の提案</h3>
      <button onclick={() => controller.dismissSuggestion()} class="close-btn"
        >×</button
      >
    </div>

    <div class="suggestion-content">
      <div class="gap-info">
        <span class="gap-label">空き時間:</span>
        <span class="gap-time">{currentSuggestion?.gapMin || 0}分</span>
      </div>

      <div class="suggestion-text">
        {currentSuggestion?.template || ""}
      </div>

      <div class="reaction-buttons">
        <button
          onclick={() => controller.reactToSuggestion("accepted")}
          class="accept-btn"
        >
          受け入れ
        </button>
        <button
          onclick={() => controller.reactToSuggestion("rejected")}
          class="reject-btn"
        >
          拒否
        </button>
        <button
          onclick={() => controller.reactToSuggestion("later")}
          class="later-btn"
        >
          後で
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .suggestion-panel {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    background: var(--card);
    border: 1px solid rgba(15, 34, 48, 0.05);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .suggestion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1rem 0 1rem;
  }

  .suggestion-header h3 {
    margin: 0;
    font-size: var(--fs-lg);
    color: var(--navy-900);
    font-family: var(--font-sans);
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--muted);
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .close-btn:hover {
    color: var(--coral);
    transform: scale(1.1);
  }

  .suggestion-content {
    padding: 1rem;
  }

  .gap-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgba(240, 138, 119, 0.1);
    border-radius: var(--radius-md);
  }

  .gap-label {
    font-weight: 600;
    color: var(--coral);
    font-family: var(--font-sans);
  }

  .gap-time {
    font-weight: 600;
    color: var(--navy-900);
    font-size: var(--fs-lg);
    font-family: var(--font-sans);
  }

  .suggestion-text {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(240, 138, 119, 0.05);
    border-radius: var(--radius-md);
    color: var(--navy-700);
    font-weight: 500;
    text-align: center;
    font-family: var(--font-sans);
  }

  .reaction-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .reaction-buttons button {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 600;
    font-family: var(--font-sans);
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .accept-btn {
    background: rgba(240, 138, 119, 0.1);
    color: var(--coral);
    border-color: var(--coral);
  }

  .accept-btn:hover {
    background: var(--coral);
    color: var(--white);
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
  }

  .reject-btn {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    border-color: #dc3545;
  }

  .reject-btn:hover {
    background: #dc3545;
    color: var(--white);
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(220, 53, 69, 0.3);
  }

  .later-btn {
    background: rgba(154, 166, 178, 0.1);
    color: var(--muted);
    border-color: var(--muted);
  }

  .later-btn:hover {
    background: var(--muted);
    color: var(--white);
    transform: translateY(-2px);
  }
</style>
