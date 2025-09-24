<script lang="ts">
  import type { Memo } from '../types.js';
  import type { AppController } from '../controllers/app.controller.svelte.js';
  import { memos } from '../stores/data.js';

  let p: { controller: AppController } = $props();
  const { controller } = p;
</script>

<div class="memo-view">
  <div class="memo-header">
    <h2>メモ</h2>
  </div>

  <!-- Memo Form -->
  <div class="memo-form">
    <h3>{controller.memoForm.isEditing ? 'メモを編集' : '新しいメモ'}</h3>
    
    <div class="form-group">
      <label for="memo-text">メモ内容</label>
      <textarea
        id="memo-text"
        bind:value={controller.memoForm.text}
        placeholder="メモを入力してください..."
        rows="4"
      ></textarea>
    </div>
    
    <div class="form-actions">
      {#if controller.memoForm.isEditing}
        <button onclick={() => controller.updateMemo()}>更新</button>
        <button onclick={() => controller.resetMemoForm()}>キャンセル</button>
      {:else}
        <button onclick={() => controller.createMemo()}>作成</button>
      {/if}
    </div>
  </div>

  <!-- Memos Display -->
  <div class="memos-section">
    <h3>メモ一覧</h3>
    
    {#if $memos.length === 0}
      <p class="empty-state">メモがありません</p>
    {:else}
      <div class="memos-list">
        {#each $memos as memo (memo.id)}
          <div class="memo-item">
            <div class="memo-content">
              <p>{memo.text}</p>
            </div>
            
            <div class="memo-actions">
              <button onclick={() => controller.editMemo(memo)}>編集</button>
              <button onclick={() => controller.deleteMemo(memo.id)} class="danger">削除</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .memo-view {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .memo-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .memo-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1f2937;
  }

  .memo-form {
    background: #f9fafb;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .memo-form h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    min-height: 100px;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .memos-section h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }

  .empty-state {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    padding: 2rem;
  }

  .memos-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .memo-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .memo-content {
    flex: 1;
    margin-right: 1rem;
  }

  .memo-content p {
    margin: 0;
    color: #374151;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .memo-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .memo-actions button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .memo-actions button.danger {
    color: #dc2626;
    border-color: #fca5a5;
  }

  .memo-actions button:hover {
    background: #f3f4f6;
  }

  button {
    transition: all 0.2s;
  }

  button:hover {
    transform: translateY(-1px);
  }
</style>
