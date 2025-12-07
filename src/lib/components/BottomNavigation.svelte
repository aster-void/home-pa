<script lang="ts">
  import { currentView, uiActions, devtools } from "../stores/index.js";
</script>

<nav class="bottom-navigation" aria-label="Main navigation">
  <button
    class="nav-item {$currentView === 'calendar' ? 'active' : ''}"
    onclick={() => uiActions.setView("calendar")}
    aria-current={$currentView === "calendar" ? "page" : undefined}
    aria-label="Open calendar view"
  >
    <span class="nav-label">Calendar</span>
  </button>

  <button
    class="nav-item {$currentView === 'personal-assistant' ? 'active' : ''}"
    onclick={() => uiActions.setView("personal-assistant")}
    aria-current={$currentView === "personal-assistant" ? "page" : undefined}
    aria-label="Open assistant view"
  >
    <span class="nav-label">Assistant</span>
  </button>

  <button
    class="nav-item {$currentView === 'tasks' ? 'active' : ''}"
    onclick={() => uiActions.setView("tasks")}
    aria-current={$currentView === "tasks" ? "page" : undefined}
    aria-label="Open tasks view"
  >
    <span class="nav-label">Tasks</span>
  </button>

  <button
    class="nav-item {$currentView === 'utilities' ? 'active' : ''}"
    onclick={() => uiActions.setView("utilities")}
    aria-current={$currentView === "utilities" ? "page" : undefined}
    aria-label="Open utilities view"
  >
    <span class="nav-label">Utilities</span>
  </button>
</nav>

<style>
  .bottom-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: stretch;
    gap: 2px;
    background: rgba(255, 255, 255, 0.95);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
    z-index: 2000;
    height: calc(var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom));
    padding: 8px 8px calc(8px + env(safe-area-inset-bottom)) 8px;
  }

  .nav-item {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px var(--space-sm);
    border: none;
    background: transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
    color: var(--text-secondary);
    font-family: var(--font-family);
    min-width: 0;
  }

  .nav-item:focus-visible {
    outline: 2px solid rgba(240, 138, 119, 0.3);
    outline-offset: 2px;
  }

  .nav-item:hover {
    background: rgba(240, 138, 119, 0.08);
    color: var(--accent-primary);
  }

  .nav-item.active {
    color: var(--accent-primary);
    background: rgba(240, 138, 119, 0.12);
  }

  .nav-item.active .nav-label {
    font-weight: var(--font-weight-bold);
  }

  .nav-label {
    font-size: 0.75rem;
    font-weight: var(--font-weight-normal);
    text-align: center;
    line-height: 1.2;
    letter-spacing: 0.02em;
  }

  @media (max-width: 640px) {
    .bottom-navigation {
      padding: 6px 4px calc(6px + env(safe-area-inset-bottom)) 4px;
    }

    .nav-item {
      padding: 8px var(--space-xs);
      border-radius: var(--radius-md);
    }

    .nav-label {
      font-size: 0.7rem;
    }
  }
</style>
