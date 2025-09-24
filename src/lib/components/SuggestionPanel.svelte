<script lang="ts">
  import type { AppController } from '../controllers/app.controller.svelte.js';

  let p: { controller: AppController } = $props();
  const { controller } = p;
</script>

{#if controller.currentSuggestion}
  <div class="suggestion-panel">
    <div class="suggestion-header">
      <h3>時間の提案</h3>
      <button onclick={() => controller.dismissSuggestion()} class="close-btn">×</button>
    </div>
    
    <div class="suggestion-content">
      <div class="gap-info">
        <span class="gap-label">空き時間:</span>
        <span class="gap-time">{controller.currentSuggestion?.gapMin || 0}分</span>
      </div>
      
      <div class="suggestion-text">
        {controller.currentSuggestion?.template || ''}
      </div>
      
      <div class="reaction-buttons">
        <button 
          onclick={() => controller.reactToSuggestion('accepted')}
          class="accept-btn"
        >
          受け入れ
        </button>
        <button 
          onclick={() => controller.reactToSuggestion('rejected')}
          class="reject-btn"
        >
          拒否
        </button>
        <button 
          onclick={() => controller.reactToSuggestion('later')}
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
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
    font-size: 1.125rem;
    color: #1f2937;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    color: #374151;
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
    background: #f0f9ff;
    border-radius: 0.5rem;
  }

  .gap-label {
    font-weight: 500;
    color: #1e40af;
  }

  .gap-time {
    font-weight: 600;
    color: #1e40af;
    font-size: 1.125rem;
  }

  .suggestion-text {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #fefce8;
    border-radius: 0.5rem;
    color: #a16207;
    font-weight: 500;
    text-align: center;
  }

  .reaction-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .reaction-buttons button {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .accept-btn {
    background: #dcfce7;
    color: #166534;
    border-color: #bbf7d0;
  }

  .accept-btn:hover {
    background: #bbf7d0;
    transform: translateY(-1px);
  }

  .reject-btn {
    background: #fee2e2;
    color: #dc2626;
    border-color: #fecaca;
  }

  .reject-btn:hover {
    background: #fecaca;
    transform: translateY(-1px);
  }

  .later-btn {
    background: #f3f4f6;
    color: #374151;
    border-color: #d1d5db;
  }

  .later-btn:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }
</style>
