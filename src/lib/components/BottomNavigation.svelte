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
    <div class="nav-icon" aria-hidden="true">📅</div>
    <span class="nav-label">Calendar</span>
  </button>

  <button
    class="nav-item {$currentView === 'personal-assistant' ? 'active' : ''}"
    onclick={() => uiActions.setView("personal-assistant")}
    aria-current={$currentView === "personal-assistant" ? "page" : undefined}
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
    align-items: stretch;
    gap: 0;
    background: var(--bg-secondary);
    -webkit-backdrop-filter: saturate(120%) blur(12px);
    backdrop-filter: saturate(120%) blur(12px);
    border-top: 1px solid rgba(15, 34, 48, 0.08);
    box-shadow: 0 -6px 20px rgba(8, 12, 20, 0.08);
    z-index: 1000;
    height: calc(var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
  }

  .nav-item {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm) var(--space-xs);
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
    color: var(--text-secondary);
    font-family: var(--font-family);
    min-width: 0;
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
    box-shadow: inset 0 2px 0 var(--coral);
  }

  .nav-icon {
    font-size: 1.25rem;
    margin-bottom: var(--space-xs);
  }

  .nav-item.active .nav-icon {
    transform: scale(1.1);
  }

  .nav-label {
    font-size: var(--fs-xs);
    font-weight: var(--font-weight-bold);
    text-align: center;
    line-height: 1;
    letter-spacing: 0.5px;
  }

  @media (max-width: 640px) {
    .nav-item {
      padding: var(--space-xs) var(--space-xs);
    }

    .nav-icon {
      font-size: 1.1rem;
    }

    .nav-label {
      font-size: 0.6rem;
    }
  }
</style>
