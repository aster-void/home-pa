<script lang="ts">
  import type { Memo } from '../types.js';
  import type { AppController } from '../controllers/app.controller.svelte.ts';
  import { memos } from '../stores/data.js';

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Local UI state - treated as source of truth for form inputs
  let memoText = $state('');
  let isMemoEditing = $state(false);
  let showAddForm = $state(false);
  let editingMemoId = $state<string | null>(null);
  
  // Initialize from controller once on mount - one-way sync only
  let isInitialized = $state(false);
  
  $effect(() => {
    if (controller && !isInitialized) {
      const unsubscribe = controller.memoForm.subscribe(form => {
        // Only sync on first initialization to avoid circular updates
        if (!isInitialized) {
          memoText = form.text;
          isMemoEditing = form.isEditing;
          isInitialized = true;
        }
      });
      
      return unsubscribe;
    }
  });

  function startNewMemo() {
    // Reset local state and controller
    memoText = '';
    isMemoEditing = false;
    controller.resetMemoForm();
    showAddForm = true;
  }

  function cancelMemo() {
    // Reset local state and controller
    memoText = '';
    isMemoEditing = false;
    controller.resetMemoForm();
    showAddForm = false;
  }

  function saveMemo() {
    controller.memoForm.set({
      text: memoText,
      isEditing: false,
      editingId: null
    });
    controller.createMemo();
    memoText = '';
    showAddForm = false;
  }

  function startEditMemo(memo: Memo) {
    editingMemoId = memo.id;
    memoText = memo.text;
    isMemoEditing = true;
    // Don't update controller here - let local state be the source of truth
  }

  function saveEditMemo() {
    if (editingMemoId) {
      // Write current local state to controller before updating memo
      controller.memoForm.set({
        text: memoText,
        isEditing: true,
        editingId: editingMemoId
      });
      controller.updateMemo();
      cancelEditMemo();
    }
  }

  function cancelEditMemo() {
    editingMemoId = null;
    memoText = '';
    isMemoEditing = false;
    // Reset controller state as well
    controller.resetMemoForm();
  }

  function deleteMemoDirectly(id: string) {
    controller.deleteMemo(id);
  }
</script>

<div class="memo-view">
  <div class="memo-header">
    <h2>Memo</h2>
    <button class="add-button" onclick={startNewMemo}>
      <span class="add-icon">+</span>
    </button>
  </div>

  <!-- Add New Memo Form -->
  {#if showAddForm}
    <div class="memo-form">
      <div class="form-content">
        <textarea
          bind:value={memoText}
          placeholder="New reminder..."
          rows="3"
          class="memo-textarea"
          onblur={() => {
            // Save form state to controller on blur
            controller.memoForm.set({
              text: memoText,
              isEditing: false,
              editingId: null
            });
          }}
        ></textarea>
        
        <div class="form-actions">
          <button class="cancel-button" onclick={cancelMemo}>Cancel</button>
          <button class="save-button" onclick={saveMemo} disabled={!memoText.trim()}>Save</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Memos List -->
  <div class="memos-list">
    {#if $memos.length === 0 && !showAddForm}
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>No notes yet</p>
        <p class="empty-subtitle">Tap + to add your first reminder</p>
      </div>
    {:else}
      {#each $memos as memo (memo.id)}
        <div class="memo-item {editingMemoId === memo.id ? 'editing' : ''}">
          {#if editingMemoId === memo.id}
            <!-- Edit mode -->
            <div class="memo-edit-content">
              <textarea
                bind:value={memoText}
                class="memo-edit-textarea"
                placeholder="Reminder text..."
                rows="2"
                onblur={() => {
                  // Save form state to controller on blur
                  if (editingMemoId) {
                    controller.memoForm.set({
                      text: memoText,
                      isEditing: true,
                      editingId: editingMemoId
                    });
                  }
                }}
              ></textarea>
            </div>
            
            <div class="memo-edit-actions">
              <button class="save-edit-button" onclick={saveEditMemo}>✓</button>
              <button class="cancel-edit-button" onclick={cancelEditMemo}>✕</button>
            </div>
          {:else}
            <!-- View mode -->
            <div 
              class="memo-content" 
              onclick={() => startEditMemo(memo)}
              onkeydown={(e) => e.key === 'Enter' && startEditMemo(memo)}
              role="button"
              tabindex="0"
            >
              <div class="memo-text">{memo.text}</div>
            </div>
            
            <div class="memo-actions">
              <button 
                class="delete-button"
                onclick={() => deleteMemoDirectly(memo.id)}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

</div>

<style>
  .memo-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
  }

  .memo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }

  .memo-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #1f2937;
    font-weight: 600;
  }

  .add-button {
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    background: #007aff;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 300;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  }

  .add-button:hover {
    background: #0056b3;
    transform: scale(1.05);
  }

  .memo-form {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem;
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .memo-textarea {
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    font-size: 1rem;
    font-family: inherit;
    line-height: 1.5;
    background: transparent;
  }

  .memo-textarea::placeholder {
    color: #9ca3af;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .cancel-button, .save-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .cancel-button {
    background: #f3f4f6;
    color: #374151;
  }

  .cancel-button:hover {
    background: #e5e7eb;
  }

  .save-button {
    background: #007aff;
    color: white;
  }

  .save-button:hover:not(:disabled) {
    background: #0056b3;
  }

  .save-button:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .memos-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 500;
  }

  .empty-subtitle {
    font-size: 0.875rem;
    color: #9ca3af;
  }

  .memo-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: white;
    border-radius: 0.75rem;
    margin-bottom: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }

  .memo-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  .memo-item.editing {
    border: 2px solid #007aff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  }

  .memo-content {
    flex: 1;
    margin-right: 1rem;
    cursor: pointer;
  }

  .memo-text {
    color: #1f2937;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 1rem;
  }

  .memo-edit-content {
    flex: 1;
    margin-right: 1rem;
  }

  .memo-edit-textarea {
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    font-size: 1rem;
    font-family: inherit;
    line-height: 1.5;
    background: transparent;
    color: #1f2937;
  }

  .memo-edit-textarea::placeholder {
    color: #9ca3af;
  }

  .memo-edit-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 1;
  }

  .save-edit-button, .cancel-edit-button {
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .save-edit-button {
    background: #10b981;
    color: white;
  }

  .save-edit-button:hover {
    background: #059669;
    transform: scale(1.1);
  }

  .cancel-edit-button {
    background: #ef4444;
    color: white;
  }

  .cancel-edit-button:hover {
    background: #dc2626;
    transform: scale(1.1);
  }

  .memo-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .memo-item:hover .memo-actions {
    opacity: 1;
  }

  .delete-button {
    width: 2rem;
    height: 2rem;
    border: none;
    background: #f3f4f6;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .delete-button:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  @media (max-width: 768px) {
    .memo-item {
      padding: 0.75rem;
    }

    .memo-actions {
      opacity: 1;
    }
  }
</style>
