<script lang="ts">
  import type { AppController } from '../controllers/app.controller.svelte.js';

  let p: { controller: AppController } = $props();
  const { controller } = p;
</script>

<nav class="navigation">
  <div class="nav-brand">
    <h1>home-pa</h1>
  </div>
  
  <div class="nav-links">
    <button 
      class="nav-link {controller.currentView === 'calendar' ? 'active' : ''}"
      onclick={() => controller.setView('calendar')}
    >
      📅 予定
    </button>
    <button 
      class="nav-link {controller.currentView === 'memo' ? 'active' : ''}"
      onclick={() => controller.setView('memo')}
    >
      📝 メモ
    </button>
    <button 
      class="nav-link {controller.currentView === 'logs' ? 'active' : ''}"
      onclick={() => controller.setView('logs')}
    >
      📊 ログ
    </button>
  </div>
</nav>

<style>
  .navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-brand h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #1f2937;
    font-weight: 600;
  }

  .nav-links {
    display: flex;
    gap: 0.5rem;
  }

  .nav-link {
    padding: 0.75rem 1.5rem;
    border: 1px solid transparent;
    background-color: transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-link:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .nav-link.active {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .nav-link.active:hover {
    background-color: #2563eb;
  }

  @media (max-width: 640px) {
    .navigation {
      padding: 1rem;
    }
    
    .nav-links {
      gap: 0.25rem;
    }
    
    .nav-link {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }
    
    .nav-brand h1 {
      font-size: 1.25rem;
    }
  }
</style>
