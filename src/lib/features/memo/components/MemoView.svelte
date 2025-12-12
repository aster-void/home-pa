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
  class="flex h-full flex-col rounded-xl border border-base-300 bg-base-100 shadow-sm max-md:rounded-none max-md:border-none max-md:shadow-none md:rounded-xl md:border md:shadow-sm"
>
  <div
    class="flex items-center justify-between rounded-t-xl border-b border-base-300 bg-base-100 p-4 max-md:rounded-none"
  >
    <h2
      class="m-0 text-lg font-normal tracking-wider text-[color:var(--event-blue)] uppercase"
    >
      Memo
    </h2>
    <button
      class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#F08A77] bg-[#F08A77] text-xl font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:shadow-[0_4px_14px_rgba(240,138,119,0.3)]"
      onclick={startNewMemo}
    >
      <span>+</span>
    </button>
  </div>

  {#if showAddForm}
    <div class="border-b border-base-300 bg-base-100 p-4">
      <div class="flex flex-col gap-4">
        <textarea
          bind:value={memoText}
          placeholder="New reminder..."
          rows="3"
          class="textarea-bordered textarea w-full resize-none text-base leading-relaxed transition-all duration-200 focus:border-[color:var(--primary)] focus:shadow-[0_0_8px_rgba(0,200,255,0.2)]"
        ></textarea>

        <div class="flex justify-end gap-2">
          <button
            class="btn border border-base-300 text-sm font-medium tracking-wide uppercase btn-ghost transition-all duration-200"
            onclick={cancelMemo}>Cancel</button
          >
          <button
            class="btn border-none bg-[color:var(--primary)] text-sm font-medium tracking-wide text-[color:var(--bg)] uppercase transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--primary)] hover:shadow-[0_0_14px_rgba(0,200,255,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
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
        class="flex flex-col items-center justify-center p-12 text-center text-base-content/60"
      >
        <div class="mb-4 text-5xl opacity-50">📝</div>
        <p class="m-0 mb-2 text-lg font-medium">No notes yet</p>
        <p class="m-0 text-sm">Tap + to add your first reminder</p>
      </div>
    {:else}
      {#each memoState.memos as memo (memo.id)}
        <div
          class="mb-2 flex items-center rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--primary)] hover:shadow-md {editingMemoId ===
          memo.id
            ? 'border-2 border-[color:var(--primary)] shadow-[0_0_20px_rgba(0,200,255,0.3)]'
            : ''} max-md:p-3"
        >
          {#if editingMemoId === memo.id}
            <div class="mr-4 flex-1">
              <textarea
                bind:value={memoText}
                class="textarea-bordered textarea w-full resize-none text-base leading-relaxed transition-all duration-200 focus:border-[color:var(--primary)] focus:shadow-[0_0_8px_rgba(0,200,255,0.2)]"
                placeholder="Reminder text..."
                rows="2"
              ></textarea>
            </div>

            <div class="flex gap-2">
              <button
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-transparent bg-[color:var(--primary)] text-sm text-[color:var(--bg)] transition-all duration-200 hover:scale-110 hover:shadow-[0_0_12px_rgba(0,200,255,0.3)]"
                onclick={saveEditMemo}>✓</button
              >
              <button
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-transparent bg-[color:var(--danger)] text-sm text-[color:var(--bg)] transition-all duration-200 hover:scale-110 hover:shadow-[0_0_12px_rgba(255,59,59,0.3)]"
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
                class="text-base leading-relaxed break-words whitespace-pre-wrap text-base-content"
              >
                {memo.text}
              </div>
            </div>

            <div
              class="flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-md:opacity-100"
            >
              <button
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[color:var(--danger)] bg-transparent text-sm text-[color:var(--danger)] transition-all duration-200 hover:bg-[color:var(--danger)] hover:text-[color:var(--bg)] hover:shadow-[0_0_12px_rgba(255,59,59,0.3)]"
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
