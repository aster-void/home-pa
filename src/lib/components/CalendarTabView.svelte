<script lang="ts">
  import CalendarView from "./CalendarView.svelte";
  import MemoView from "./MemoView.svelte";
  import { isMemoOpen, uiActions } from "../stores/index.js";

  let isMobile = $state(false);

  // Check if mobile view
  $effect(() => {
    // Guard against SSR - only run on client
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  });
</script>

<div class="calendar-tab">
  <!-- Mobile sliding tab button -->
  {#if isMobile}
    <button
      class="memo-tab {isMemoOpen ? 'open' : ''}"
      onclick={() => uiActions.toggleMemo()}
      aria-expanded={$isMemoOpen}
      aria-controls="memo-drawer"
    >
      <span class="memo-tab-label">Memo</span>
    </button>
  {/if}

  <div class="calendar-layout {isMobile ? 'mobile' : 'desktop'}">
    <!-- Calendar View (70% on desktop, full width on mobile) -->
    <div class="calendar-section">
      <CalendarView />
    </div>

    <!-- Memo View (30% on desktop, overlay on mobile) -->
    <div
      id="memo-drawer"
      class="memo-section {isMobile ? ($isMemoOpen ? 'open' : 'closed') : ''}"
    >
      {#if !isMobile || $isMemoOpen}
        <div class="memo-container">
          <div class="memo-content">
            <MemoView />
          </div>
        </div>
      {/if}
    </div>

    <!-- Mobile overlay - outside memo-section for proper layering -->
    {#if isMobile && $isMemoOpen}
      <div
        class="mobile-overlay"
        onclick={() => uiActions.setMemoOpen(false)}
        onkeydown={(e) => {
          if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            uiActions.setMemoOpen(false);
          }
        }}
        role="button"
        tabindex="0"
        aria-label="Close memo overlay"
      ></div>
    {/if}
  </div>
</div>

<style>
  .calendar-tab {
    height: calc(
      100vh - var(--bottom-nav-height, 80px)
    ); /* Account for navigation */
    position: relative;
    overflow: hidden;
  }

  .memo-tab {
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    z-index: 1001;
    display: flex;
    align-items: center;
    padding: var(--space-md) var(--space-sm);
    background: var(--coral);
    color: var(--white);
    border: none;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    box-shadow: -2px 2px 12px rgba(240, 138, 119, 0.4);
    transition: all 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
    font-family: var(--font-family);
    font-weight: var(--font-weight-normal);
    font-size: 12px;
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }

  .memo-tab.open {
    box-shadow: 2px 2px 12px rgba(240, 138, 119, 0.4);
  }

  .memo-tab:hover {
    box-shadow: 0 4px 16px rgba(240, 138, 119, 0.5);
  }

  .memo-tab.open:hover {
    box-shadow: 4px 4px 16px rgba(240, 138, 119, 0.5);
  }

  .memo-tab-label {
    letter-spacing: 0.06em;
  }

  /* Extra-small size on narrow phones */
  @media (max-width: 380px) {
    .memo-tab {
      padding: 6px 4px;
      font-size: 10px;
      border-radius: 6px 0 0 6px;
    }
  }

  .calendar-layout {
    display: flex;
    height: calc(100vh - var(--bottom-nav-height, 80px));
  }

  .calendar-layout.desktop {
    gap: var(--space-md);
    padding: var(--space-md);
  }

  .calendar-layout.mobile {
    flex-direction: column;
    padding: var(--space-md);
  }

  .calendar-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* restore independent internal scrolling */
  }

  .calendar-layout.desktop .calendar-section {
    flex: 0 0 70%;
  }

  .memo-section {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .calendar-layout.desktop .memo-section {
    flex: 0 0 30%;
  }

  .calendar-layout.mobile .memo-section {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    background: var(--bg-card);
    backdrop-filter: blur(6px) saturate(110%);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }

  .calendar-layout.mobile .memo-section.open {
    transform: translateX(0);
  }

  .memo-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--space-md);
  }

  .calendar-layout.mobile .memo-container {
    padding: 0; /* Remove padding on mobile for full-screen memo */
  }

  .memo-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 34, 48, 0.8);
    backdrop-filter: blur(4px);
    z-index: 998; /* Lower than memo-section to be behind it */
  }
</style>
