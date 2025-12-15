<script lang="ts">
  import { memoState, type MemoType } from "$lib/bootstrap/index.svelte.ts";

  // Local UI state
  let memoText = $state("");
  let showAddForm = $state(false);
  let editingMemoId = $state<string | null>(null);

  function startNewMemo() {
    memoText = "";
    editingMemoId = null;
    memoState.resetForm();
    showAddForm = true;
  }

  function cancelMemo() {
    memoText = "";
    editingMemoId = null;
    memoState.resetForm();
    showAddForm = false;
  }

  function saveMemo() {
    if (!memoText.trim()) return;
    memoState.create(memoText.trim());
    memoText = "";
    showAddForm = false;
  }

  function startEditMemo(memo: MemoType) {
    editingMemoId = memo.id;
    memoText = memo.text;
  }

  function saveEditMemo() {
    if (editingMemoId && memoText.trim()) {
      memoState.update(editingMemoId, memoText.trim());
      cancelEditMemo();
    }
  }

  function cancelEditMemo() {
    editingMemoId = null;
    memoText = "";
    memoState.resetForm();
  }

  function deleteMemoDirectly(id: string) {
    memoState.delete(id);
  }
</script>

<div
  class="flex h-full flex-col rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] shadow-sm max-md:rounded-none max-md:border-none max-md:shadow-none md:rounded-xl md:border md:shadow-sm"
>
  <div
    class="flex items-center justify-between rounded-t-xl border-b border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4 max-md:rounded-none"
  >
    <h2
      class="m-0 text-lg font-normal tracking-wider text-[var(--color-primary)] uppercase"
    >
      Memo
    </h2>
    <button
      class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] text-xl font-medium text-white shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:shadow-[0_4px_14px_rgba(123,190,187,0.3)]"
      onclick={startNewMemo}
    >
      <span>+</span>
    </button>
  </div>

  {#if showAddForm}
    <div
      class="border-b border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4"
    >
      <div class="flex flex-col gap-4">
        <textarea
          bind:value={memoText}
          placeholder="New reminder..."
          rows="3"
          class="textarea w-full resize-none rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3 text-base leading-relaxed text-[var(--color-text-primary)] transition-all duration-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
        ></textarea>

        <div class="flex justify-end gap-2">
          <button
            class="btn border border-[var(--color-border-default)] text-sm font-medium tracking-wide text-[var(--color-text-secondary)] uppercase btn-ghost transition-all duration-200"
            onclick={cancelMemo}>Cancel</button
          >
          <button
            class="btn border-none bg-[var(--color-primary)] text-sm font-medium tracking-wide text-white uppercase transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-400)] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            onclick={saveMemo}
            disabled={!memoText.trim()}>Save</button
          >
        </div>
      </div>
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto p-2">
    {#if memoState.memos.length === 0 && !showAddForm}
      <div
        class="flex flex-col items-center justify-center p-12 text-center text-[var(--color-text-muted)]"
      >
        <div class="mb-4 text-5xl opacity-50">📝</div>
        <p
          class="m-0 mb-2 text-lg font-medium text-[var(--color-text-secondary)]"
        >
          No notes yet
        </p>
        <p class="m-0 text-sm">Tap + to add your first reminder</p>
      </div>
    {:else}
      {#each memoState.memos as memo (memo.id)}
        <div
          class="mb-2 flex items-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md {editingMemoId ===
          memo.id
            ? 'border-2 border-[var(--color-primary)] shadow-[0_0_20px_rgba(123,190,187,0.3)]'
            : ''} max-md:p-3"
        >
          {#if editingMemoId === memo.id}
            <div class="mr-4 flex-1">
              <textarea
                bind:value={memoText}
                class="textarea w-full resize-none rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3 text-base leading-relaxed text-[var(--color-text-primary)] transition-all duration-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
                placeholder="Reminder text..."
                rows="2"
              ></textarea>
            </div>

            <div class="flex gap-2">
              <button
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-transparent bg-[var(--color-success-500)] text-sm text-white transition-all duration-200 hover:scale-110 hover:shadow-[0_0_12px_rgba(42,179,136,0.3)]"
                onclick={saveEditMemo}>✓</button
              >
              <button
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-transparent bg-[var(--color-error-500)] text-sm text-white transition-all duration-200 hover:scale-110 hover:shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                onclick={cancelEditMemo}>✕</button
              >
            </div>
          {:else}
            <div
              class="mr-4 flex-1 cursor-pointer"
              onclick={() => startEditMemo(memo)}
              onkeydown={(e) => e.key === "Enter" && startEditMemo(memo)}
              role="button"
              tabindex="0"
            >
              <div
                class="text-base leading-relaxed break-words whitespace-pre-wrap text-[var(--color-text-primary)]"
              >
                {memo.text}
              </div>
            </div>

            <div
              class="flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-md:opacity-100"
            >
              <button
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--color-error-500)] bg-transparent text-sm text-[var(--color-error-500)] transition-all duration-200 hover:bg-[var(--color-error-500)] hover:text-white hover:shadow-[0_0_12px_rgba(220,38,38,0.3)]"
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
