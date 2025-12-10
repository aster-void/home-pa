<script lang="ts">
  import { suggestionLogs } from "$lib/state/data.ts";
  import { utcToLocalDateTimeString } from "../utils/date-utils.ts";

  function formatDateTime(d: Date): string {
    return utcToLocalDateTimeString(d).replace("T", " ");
  }
</script>

<div class="logs-view">
  <div class="logs-header">
    <h2>提案ログ</h2>
  </div>

  {#if $suggestionLogs.length === 0}
    <div class="empty-state">
      <p>まだ提案ログがありません</p>
      <p class="help-text">
        予定を作成すると、空き時間に基づいて提案が表示されます
      </p>
    </div>
  {:else}
    <div class="logs-list">
      {#each $suggestionLogs as log (log.id)}
        <div class="log-item">
          <div class="log-header">
            <span class="log-time">{formatDateTime(log.at)}</span>
            <span class="log-gap">{log.gapMin}分の空き時間</span>
          </div>

          <div class="log-reaction">
            <span class="reaction-label">反応:</span>
            <span class="reaction-badge {log.reaction}">
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
            <div class="log-event">
              <span class="event-label">関連予定:</span>
              <span class="event-id">ID: {log.eventId.slice(0, 8)}...</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .logs-view {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .logs-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .logs-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1f2937;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .empty-state p {
    margin: 0 0 0.5rem 0;
  }

  .help-text {
    font-size: 0.875rem;
    font-style: italic;
  }

  .logs-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .log-item {
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    transition: box-shadow 0.2s;
  }

  .log-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .log-time {
    font-weight: 500;
    color: #1f2937;
  }

  .log-gap {
    font-size: 0.875rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  .log-reaction {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .reaction-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .reaction-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .reaction-badge.accepted {
    background: #dcfce7;
    color: #166534;
  }

  .reaction-badge.rejected {
    background: #fee2e2;
    color: #dc2626;
  }

  .reaction-badge.later {
    background: #fef3c7;
    color: #d97706;
  }

  .log-event {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .event-label {
    color: #6b7280;
  }

  .event-id {
    color: #374151;
    font-family: monospace;
    background: #f9fafb;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
  }
</style>
