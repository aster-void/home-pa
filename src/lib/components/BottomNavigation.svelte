<script lang="ts">
  import type { AppController } from "../controllers/app.controller.svelte.ts";

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Get current view from controller store reactively
  let currentView = $state();

  // Subscribe to store changes using $effect with proper cleanup
  $effect(() => {
    const unsubscribe = controller.currentView.subscribe((value) => {
      currentView = value;
    });
    return unsubscribe;
  });
</script>

<nav class="bottom-navigation" aria-label="Main navigation">
  <button
    class="nav-item {currentView === 'calendar' ? 'active' : ''}"
    onclick={() => controller.setView("calendar")}
    aria-current={currentView === "calendar" ? "page" : undefined}
    aria-label="Open calendar view"
  >
    <div class="nav-icon" aria-hidden="true">📅</div>
    <span class="nav-label">Calendar</span>
  </button>

  <button
    class="nav-item {currentView === 'personal-assistant' ? 'active' : ''}"
    onclick={() => controller.setView("personal-assistant")}
    aria-current={currentView === "personal-assistant" ? "page" : undefined}
    aria-label="Open assistant view"
  >
    <div class="nav-icon" aria-hidden="true">🤖</div>
    <span class="nav-label">Assistant</span>
  </button>
</nav>

<style>
  .bottom-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    background: var(--white);
    border-top: 1px solid rgba(15, 34, 48, 0.08);
    box-shadow: 0 -4px 14px rgba(8, 12, 20, 0.06);
    z-index: 1000;
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm) var(--space-xs);
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
    color: var(--muted);
    font-family: var(--font-sans);
  }

  .nav-item:focus-visible {
    outline: 2px solid rgba(240, 138, 119, 0.18);
    outline-offset: 2px;
  }

  .nav-item:hover {
    background: rgba(240, 138, 119, 0.08);
    color: var(--coral);
  }

  .nav-item.active {
    color: var(--coral);
    background: rgba(240, 138, 119, 0.1);
  }

  .nav-icon {
    font-size: 1.5rem;
    margin-bottom: var(--space-xs);
  }

  .nav-item.active .nav-icon {
    transform: scale(1.1);
  }

  .nav-label {
    font-size: var(--fs-sm);
    font-weight: 600;
    text-align: center;
  }

  @media (max-width: 640px) {
    .nav-item {
      padding: var(--space-xs) var(--space-xs);
    }

    .nav-icon {
      font-size: 1.25rem;
    }

    .nav-label {
      font-size: 0.625rem;
    }
  }
</style>
