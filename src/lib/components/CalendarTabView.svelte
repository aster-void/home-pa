<script lang="ts">
  import type { AppController } from '../controllers/app.controller.svelte.js';
  import CalendarView from './CalendarView.svelte';
  import MemoView from './MemoView.svelte';

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Get memo open state from controller store
  let isMemoOpen = $state(false);
  let isMobile = $state(false);
  
  // Subscribe to controller store changes
  $effect(() => {
    if (controller) {
      const unsubscribe = controller.isMemoOpen.subscribe(value => {
        isMemoOpen = value;
      });
      return unsubscribe;
    }
  });

  // Check if mobile view
  $effect(() => {
    // Guard against SSR - only run on client
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  });
</script>

<div class="calendar-tab">
  <!-- Mobile hamburger menu button -->
  {#if isMobile}
    <button 
      class="hamburger-button"
      onclick={() => controller.toggleMemo()}
      aria-expanded={isMemoOpen}
      aria-controls="memo-drawer"
    >
      <div class="hamburger-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span>Memo</span>
    </button>
  {/if}

  <div class="calendar-layout {isMobile ? 'mobile' : 'desktop'}">
    <!-- Calendar View (70% on desktop, full width on mobile) -->
    <div class="calendar-section">
      <CalendarView {controller} />
    </div>

    <!-- Memo View (30% on desktop, overlay on mobile) -->
    <div id="memo-drawer" class="memo-section {isMobile ? (isMemoOpen ? 'open' : 'closed') : ''}">
      {#if !isMobile || isMemoOpen}
        <div class="memo-container">
          <div class="memo-content">
            <MemoView {controller} />
          </div>
        </div>
      {/if}
    {#if isMobile && isMemoOpen}
      <div 
        class="mobile-overlay"
        onclick={() => controller.setMemoOpen(false)}
        onkeydown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            controller.setMemoOpen(false);
          }
        }}
        role="button"
        tabindex="0"
        aria-label="Close memo overlay"
      ></div>
    {/if}
    </div>
  </div>
</div>

<style>
  .calendar-tab {
    min-height: calc(100vh - 80px); /* Account for navigation */
    position: relative;
  }

  .hamburger-button {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1001;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s;
  }

  .hamburger-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .hamburger-icon {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .hamburger-icon span {
    width: 18px;
    height: 2px;
    background: white;
    border-radius: 1px;
  }

  .calendar-layout {
    display: flex;
    height: calc(100vh - 80px);
  }

  .calendar-layout.desktop {
    gap: 1rem;
    padding: 1rem;
  }

  .calendar-layout.mobile {
    flex-direction: column;
    padding: 1rem;
  }

  .calendar-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
    background: white;
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

    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.2s;
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
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

</style>
