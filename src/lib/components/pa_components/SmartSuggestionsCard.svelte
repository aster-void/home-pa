<script lang="ts">
  import BaseCard from './BaseCard.svelte';
  import type { AppController } from '../../controllers/app.controller.svelte.ts';
  import type { Suggestion } from '../../types.js';

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Get current suggestion from controller
  let currentSuggestion = $state(null as Suggestion | null);
  
  // Subscribe to controller store changes
  $effect(() => {
    if (controller) {
      const unsubscribe = controller.currentSuggestion.subscribe(value => {
        currentSuggestion = value;
      });
      
      return unsubscribe;
    }
  });

  // Get status for the card
  const suggestionStatus = $derived(currentSuggestion ? 'Active' : 'No suggestions');
  const statusType = $derived(currentSuggestion ? 'active' : 'inactive');
</script>

<BaseCard 
  title="Smart Suggestions" 
  status={suggestionStatus}
  statusType={statusType}
  class="suggestions-card"
>
  {#if currentSuggestion}
    <div class="current-suggestion">
      <div class="gap-info">
        <span class="gap-label">Available Time:</span>
        <span class="gap-time">{currentSuggestion?.gapMin || 0} minutes</span>
      </div>
      
      <div class="suggestion-text">
        {currentSuggestion?.template || ''}
      </div>
      
      <div class="reaction-buttons">
        <button 
          onclick={() => controller.reactToSuggestion('accepted')}
          class="accept-btn"
        >
          Accept
        </button>
        <button 
          onclick={() => controller.reactToSuggestion('rejected')}
          class="reject-btn"
        >
          Reject
        </button>
        <button 
          onclick={() => controller.reactToSuggestion('later')}
          class="later-btn"
        >
          Later
        </button>
        <button 
          onclick={() => controller.dismissSuggestion()}
          class="dismiss-btn"
        >
          Dismiss
        </button>
      </div>
    </div>
  {:else}
    <div class="no-suggestion">
      <p>No active suggestions at the moment.</p>
      <p class="no-suggestion-hint">Suggestions will appear when you have free time gaps.</p>
    </div>
  {/if}
</BaseCard>

<style>
  .current-suggestion {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .gap-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm);
    background: rgba(240, 138, 119, 0.1);
    border: 1px solid rgba(240, 138, 119, 0.2);
    border-radius: var(--radius-md);
  }

  .gap-label {
    font-weight: 600;
    color: var(--coral);
    font-size: var(--fs-sm);
  }

  .gap-time {
    font-family: var(--font-sans);
    font-weight: 600;
    color: var(--navy-900);
    font-size: var(--fs-lg);
  }

  .suggestion-text {
    padding: var(--space-md);
    background: rgba(240, 138, 119, 0.05);
    border: 1px solid rgba(240, 138, 119, 0.2);
    border-radius: var(--radius-md);
    color: var(--navy-700);
    font-weight: 500;
    text-align: center;
    font-family: var(--font-sans);
    line-height: 1.4;
  }

  .reaction-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .reaction-buttons button {
    padding: var(--space-sm);
    border: 1px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 600;
    font-family: var(--font-sans);
    font-size: var(--fs-sm);
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
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  .reject-btn {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    border-color: #dc3545;
  }

  .reject-btn:hover {
    background: #dc3545;
    color: var(--white);
    box-shadow: 0 4px 14px rgba(220, 53, 69, 0.3);
    transform: translateY(-2px);
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

  .dismiss-btn {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
    border-color: #ffc107;
  }

  .dismiss-btn:hover {
    background: #ffc107;
    color: var(--white);
    box-shadow: 0 4px 14px rgba(255, 193, 7, 0.3);
    transform: translateY(-2px);
  }

  .no-suggestion {
    text-align: center;
    padding: 2rem;
    color: var(--muted);
  }

  .no-suggestion-hint {
    font-size: var(--fs-md);
    margin-top: var(--space-sm);
    color: var(--muted);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .reaction-buttons {
      grid-template-columns: 1fr;
    }
  }
</style>
