<script lang="ts">
  import { dataState } from "$lib/bootstrap/compat.svelte.ts";
  import { utcToLocalDateTimeString } from "$lib/utils/date-utils.ts";

  function formatDateTime(d: Date): string {
    return utcToLocalDateTimeString(d).replace("T", " ");
  }
</script>

<div class="mx-auto max-w-3xl p-4">
  <div class="mb-8 border-b border-[var(--color-border-default)] pb-4">
    <h2 class="m-0 text-2xl text-[var(--color-text-primary)]">提案ログ</h2>
  </div>

  {#if dataState.suggestionLogs.length === 0}
    <div class="px-4 py-12 text-center text-[var(--color-text-muted)]">
      <p class="m-0 mb-2">まだ提案ログがありません</p>
      <p class="m-0 text-sm italic">
        予定を作成すると、空き時間に基づいて提案が表示されます
      </p>
    </div>
  {:else}
    <div class="flex flex-col gap-4">
      {#each dataState.suggestionLogs as log (log.id)}
        <div
          class="card rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="font-medium text-[var(--color-text-primary)]"
              >{formatDateTime(log.at)}</span
            >
            <span
              class="rounded-lg bg-[var(--color-bg-surface)] px-2 py-1 text-sm text-[var(--color-text-muted)]"
              >{log.gapMin}分の空き時間</span
            >
          </div>

          <div class="mb-2 flex items-center gap-2">
            <span class="text-sm text-[var(--color-text-muted)]">反応:</span>
            <span
              class="rounded-full px-3 py-1 text-xs font-medium {log.reaction ===
              'accepted'
                ? 'bg-[var(--color-success-100)] text-[var(--color-success-500)]'
                : log.reaction === 'rejected'
                  ? 'bg-[var(--color-error-100)] text-[var(--color-error-500)]'
                  : 'bg-[var(--color-warning-100)] text-[var(--color-warning-500)]'}"
            >
              {#if log.reaction === "accepted"}
                受け入れ
              {:else if log.reaction === "rejected"}
                拒否
              {:else}
                後で
              {/if}
            </span>
          </div>

          {#if log.eventId}
            <div class="flex items-center gap-2 text-sm">
              <span class="text-[var(--color-text-muted)]">関連予定:</span>
              <span
                class="rounded-lg bg-[var(--color-bg-surface)] px-2 py-0.5 font-mono text-[var(--color-text-primary)]"
                >ID: {log.eventId.slice(0, 8)}...</span
              >
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
