<script lang="ts">
  import type { Memo } from "../types.js";
  import type { AppController } from "../controllers/app.controller.svelte.ts";
  import { memos } from "../stores/data.js";

  let p: { controller: AppController } = $props();
  const { controller } = p;

  // Local UI state - treated as source of truth for form inputs
  let memoText = $state("");
  let isMemoEditing = $state(false);
  let showAddForm = $state(false);
  let editingMemoId = $state<string | null>(null);

  // Initialize from controller once on mount - one-way sync only
  let isInitialized = $state(false);

  $effect(() => {
    if (controller && !isInitialized) {
      const unsubscribe = controller.memoForm.subscribe((form) => {
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
    memoText = "";
    isMemoEditing = false;
    controller.resetMemoForm();
    showAddForm = true;
  }

  function cancelMemo() {
    // Reset local state and controller
    memoText = "";
    isMemoEditing = false;
    controller.resetMemoForm();
    showAddForm = false;
  }

  function saveMemo() {
    controller.memoForm.set({
      text: memoText,
      isEditing: false,
      editingId: null,
    });
    controller.createMemo();
    memoText = "";
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
        editingId: editingMemoId,
      });
      controller.updateMemo();
      cancelEditMemo();
    }
  }

  function cancelEditMemo() {
    editingMemoId = null;
    memoText = "";
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
              editingId: null,
            });
          }}
        ></textarea>

        <div class="form-actions">
          <button class="cancel-button" onclick={cancelMemo}>Cancel</button>
          <button
            class="save-button"
            onclick={saveMemo}
            disabled={!memoText.trim()}>Save</button
          >
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
                      editingId: editingMemoId,
                    });
                  }
                }}
              ></textarea>
            </div>

            <div class="memo-edit-actions">
              <button class="save-edit-button" onclick={saveEditMemo}>✓</button>
              <button class="cancel-edit-button" onclick={cancelEditMemo}
                >✕</button
              >
            </div>
          {:else}
            <!-- View mode -->
            <div
              class="memo-content"
              onclick={() => startEditMemo(memo)}
              onkeydown={(e) => e.key === "Enter" && startEditMemo(memo)}
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
    background: var(--panel);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    backdrop-filter: blur(6px) saturate(110%);
    box-shadow: var(--glow);
  }

  /* Mobile-specific styling for full-screen overlay */
  @media (max-width: 768px) {
    .memo-view {
      border-radius: 0;
      border: none;
      box-shadow: none;
    }

    .memo-header {
      border-radius: 0;
    }
  }

  .memo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    background: rgba(0, 200, 255, 0.05);
    border-bottom: 1px solid var(--glass-border);
    border-radius: 10px 10px 0 0;
  }

  .memo-header h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--fs-lg);
    color: var(--primary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-shadow: 0 0 8px rgba(0, 200, 255, 0.15);
  }

  .add-button {
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid var(--coral);
    background: var(--coral);
    color: var(--white);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 600;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
    box-shadow: var(--shadow-subtle);
  }

  .add-button:hover {
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: scale(1.05);
  }

  .memo-form {
    background: rgba(0, 200, 255, 0.05);
    border-bottom: 1px solid var(--glass-border);
    padding: var(--space-md);
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .memo-textarea {
    width: 100%;
    border: 1px solid var(--glass-border);
    border-radius: 6px;
    outline: none;
    resize: none;
    font-size: 1rem;
    font-family: var(--font-body);
    line-height: 1.5;
    background: rgba(0, 200, 255, 0.05);
    color: var(--text);
    padding: var(--space-sm);
    transition: all 0.18s ease;
  }

  .memo-textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 8px rgba(0, 200, 255, 0.2);
  }

  .memo-textarea::placeholder {
    color: var(--muted);
  }

  .form-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
  }

  .cancel-button,
  .save-button {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--primary);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.18s ease;
  }

  .cancel-button {
    background: transparent;
    color: var(--muted);
    border-color: var(--muted);
  }

  .cancel-button:hover {
    background: var(--muted);
    color: var(--bg);
  }

  .save-button {
    background: var(--primary);
    color: var(--bg);
  }

  .save-button:hover:not(:disabled) {
    box-shadow: 0 0 14px rgba(0, 200, 255, 0.22);
    transform: translateY(-2px);
  }

  .save-button:disabled {
    background: rgba(102, 224, 255, 0.3);
    color: var(--muted);
    cursor: not-allowed;
    border-color: rgba(102, 224, 255, 0.3);
  }

  .memos-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-sm);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem var(--space-md);
    text-align: center;
    color: var(--muted);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--space-md);
    opacity: 0.5;
    filter: drop-shadow(0 0 8px rgba(0, 200, 255, 0.3));
  }

  .empty-state p {
    margin: 0 0 var(--space-sm) 0;
    font-size: 1.125rem;
    font-weight: 500;
    font-family: var(--font-display);
  }

  .empty-subtitle {
    font-size: 0.875rem;
    color: rgba(230, 247, 255, 0.75);
  }

  .memo-item {
    display: flex;
    align-items: center;
    padding: var(--space-md);
    background: rgba(0, 200, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    margin-bottom: var(--space-sm);
    box-shadow: 0 0 8px rgba(0, 200, 255, 0.1);
    transition: all 0.18s ease;
  }

  .memo-item:hover {
    box-shadow: 0 0 16px rgba(0, 200, 255, 0.2);
    transform: translateY(-2px);
    border-color: var(--primary);
  }

  .memo-item.editing {
    border: 2px solid var(--primary);
    box-shadow: 0 0 20px rgba(0, 200, 255, 0.3);
  }

  .memo-content {
    flex: 1;
    margin-right: var(--space-md);
    cursor: pointer;
  }

  .memo-text {
    color: var(--text);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 1rem;
    font-family: var(--font-body);
  }

  .memo-edit-content {
    flex: 1;
    margin-right: var(--space-md);
  }

  .memo-edit-textarea {
    width: 100%;
    border: 1px solid var(--glass-border);
    border-radius: 6px;
    outline: none;
    resize: none;
    font-size: 1rem;
    font-family: var(--font-body);
    line-height: 1.5;
    background: rgba(0, 200, 255, 0.05);
    color: var(--text);
    padding: var(--space-sm);
    transition: all 0.18s ease;
  }

  .memo-edit-textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 8px rgba(0, 200, 255, 0.2);
  }

  .memo-edit-textarea::placeholder {
    color: var(--muted);
  }

  .memo-edit-actions {
    display: flex;
    gap: var(--space-sm);
    opacity: 1;
  }

  .save-edit-button,
  .cancel-edit-button {
    width: 2rem;
    height: 2rem;
    border: 1px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: all 0.18s ease;
  }

  .save-edit-button {
    background: var(--primary);
    color: var(--bg);
    border-color: var(--primary);
  }

  .save-edit-button:hover {
    box-shadow: 0 0 12px rgba(0, 200, 255, 0.3);
    transform: scale(1.1);
  }

  .cancel-edit-button {
    background: var(--danger);
    color: var(--bg);
    border-color: var(--danger);
  }

  .cancel-edit-button:hover {
    box-shadow: 0 0 12px rgba(255, 59, 59, 0.3);
    transform: scale(1.1);
  }

  .memo-actions {
    display: flex;
    gap: var(--space-sm);
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  .memo-item:hover .memo-actions {
    opacity: 1;
  }

  .delete-button {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--danger);
    background: transparent;
    color: var(--danger);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: all 0.18s ease;
  }

  .delete-button:hover {
    background: var(--danger);
    color: var(--bg);
    box-shadow: 0 0 12px rgba(255, 59, 59, 0.3);
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
