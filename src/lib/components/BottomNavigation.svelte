<script lang="ts">
  import type { AppController } from '../controllers/app.controller.svelte.js';

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Get current view from controller store reactively
  let currentView = $state();
  
  // Subscribe to store changes using $effect with proper cleanup
  $effect(() => {
    const unsubscribe = controller.currentView.subscribe(value => {
      currentView = value;
    });
    return unsubscribe;
  });
</script>

<nav class="bottom-navigation" aria-label="Main navigation">
  <button 
    class="nav-item {currentView === 'calendar' ? 'active' : ''}"
    onclick={() => controller.setView('calendar')}
    aria-current={currentView === 'calendar' ? 'page' : undefined}
    aria-label="Open calendar view"
  >
    <div class="nav-icon" aria-hidden="true">📅</div>
    <span class="nav-label">Calendar</span>
  </button>
  
  <button 
    class="nav-item {currentView === 'personal-assistant' ? 'active' : ''}"
    onclick={() => controller.setView('personal-assistant')}
    aria-current={currentView === 'personal-assistant' ? 'page' : undefined}
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
    background-color: #ffffff;
    border-top: 1px solid #e5e7eb;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
  }

  .nav-item:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  .nav-item:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .nav-item.active {
    color: #3b82f6;
    background-color: #eff6ff;
  }

  .nav-icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .nav-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-align: center;
  }

  @media (max-width: 640px) {
    .nav-item {
      padding: 0.5rem 0.25rem;
    }
    
    .nav-icon {
      font-size: 1.25rem;
    }
    
    .nav-label {
      font-size: 0.625rem;
    }
  }
</style>
