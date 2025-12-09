<script lang="ts">
  import { onMount } from "svelte";
  import type {
    PendingSuggestion,
    AcceptedSuggestion,
  } from "../../stores/schedule.js";

  interface Props {
    suggestion: PendingSuggestion | AcceptedSuggestion;
    taskTitle: string;
    isAccepted: boolean;
    position?: { x: number; y: number };
    onAccept?: () => void;
    onSkip?: () => void;
    onDelete?: () => void;
    onClose?: () => void;
  }

  let {
    suggestion,
    taskTitle,
    isAccepted,
    position = { x: 0, y: 0 },
    onAccept,
    onSkip,
    onDelete,
    onClose,
  }: Props = $props();

  let cardElement: HTMLDivElement | null = null;
  let adjustedPosition = $state({ x: position.x, y: position.y });

  // Adjust position to keep card within viewport
  onMount(() => {
    if (!cardElement) return;

    const rect = cardElement.getBoundingClientRect();
    const navHeight = 80; // --bottom-nav-height
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = position.x;
    let newY = position.y;

    // Adjust horizontal position
    if (newX + rect.width > viewportWidth - padding) {
      newX = viewportWidth - rect.width - padding;
    }
    if (newX < padding) {
      newX = padding;
    }

    // Adjust vertical position (account for bottom nav)
    if (newY + rect.height > viewportHeight - navHeight - padding) {
      newY = viewportHeight - navHeight - padding - rect.height;
    }
    if (newY < padding) {
      newY = padding;
    }

    adjustedPosition = { x: newX, y: newY };
  });

  function handleAccept() {
    onAccept?.();
    onClose?.();
  }

  function handleSkip() {
    onSkip?.();
    onClose?.();
  }

  function handleDelete() {
    onDelete?.();
    onClose?.();
  }
</script>

<div
  bind:this={cardElement}
  class="suggestion-card"
  class:accepted={isAccepted}
  style="left: {adjustedPosition.x}px; top: {adjustedPosition.y}px;"
  role="dialog"
  aria-label="Suggestion details"
>
  <div class="card-header">
    <h4 class="card-title">{taskTitle}</h4>
    <button class="close-btn" onclick={onClose} aria-label="Close">×</button>
  </div>

  <div class="card-body">
    <div class="time-info">
      <span class="time-range"
        >{suggestion.startTime} - {suggestion.endTime}</span
      >
      <span class="duration">{suggestion.duration}分</span>
    </div>

    {#if isAccepted}
      <div class="status-badge accepted">承認済み</div>
    {:else}
      <div class="status-badge pending">提案中</div>
    {/if}
  </div>

  <div class="card-actions">
    {#if isAccepted}
      <button class="action-btn delete" onclick={handleDelete}> 削除 </button>
    {:else}
      <button class="action-btn accept" onclick={handleAccept}> 承認 </button>
      <button class="action-btn skip" onclick={handleSkip}> スキップ </button>
    {/if}
  </div>
</div>

<style>
  .suggestion-card {
    position: fixed;
    background: var(--bg-card, #fff);
    border: 1px solid var(--ui-border, #e5e7eb);
    border-radius: var(--radius-lg, 12px);
    padding: var(--space-md, 16px);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.06);
    z-index: 1000;
    min-width: 240px;
    max-width: 300px;
    font-family: var(--font-family);
    animation: cardAppear 0.3s ease;
  }

  @keyframes cardAppear {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .suggestion-card.accepted {
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow:
      0 12px 40px rgba(34, 197, 94, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-sm, 8px);
  }

  .card-title {
    margin: 0;
    font-size: var(--fs-md, 16px);
    font-weight: var(--font-weight-normal, 400);
    color: var(--text-primary, #1a1a1a);
    line-height: 1.4;
    flex: 1;
    padding-right: var(--space-sm, 8px);
  }

  .close-btn {
    background: var(--bg-secondary, #f8f9fa);
    border: none;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm, 4px);
    font-size: 16px;
    color: var(--text-secondary, #6c757d);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: var(--bg-tertiary, #f1f3f5);
    color: var(--text-primary, #1a1a1a);
  }

  .card-body {
    margin-bottom: var(--space-md, 16px);
  }

  .time-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm, 8px);
    padding: var(--space-sm, 8px);
    background: var(--bg-secondary, #f8f9fa);
    border-radius: var(--radius-md, 8px);
  }

  .time-range {
    font-size: var(--fs-sm, 14px);
    color: var(--text-primary, #1a1a1a);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-normal, 400);
  }

  .duration {
    font-size: var(--fs-xs, 12px);
    color: var(--accent-primary, #f08a77);
    background: rgba(240, 138, 119, 0.1);
    padding: 4px 10px;
    border-radius: var(--radius-full, 20px);
    font-weight: var(--font-weight-normal, 400);
  }

  .status-badge {
    display: inline-block;
    font-size: var(--fs-xs, 12px);
    padding: 4px 12px;
    border-radius: var(--radius-full, 9999px);
    font-weight: var(--font-weight-normal, 400);
  }

  .status-badge.pending {
    background: rgba(129, 140, 248, 0.12);
    color: #6366f1;
  }

  .status-badge.accepted {
    background: rgba(34, 197, 94, 0.12);
    color: #16a34a;
  }

  .card-actions {
    display: flex;
    gap: var(--space-sm, 8px);
  }

  .action-btn {
    flex: 1;
    padding: 10px var(--space-md, 16px);
    border: none;
    border-radius: var(--radius-md, 8px);
    font-size: var(--fs-sm, 14px);
    font-weight: var(--font-weight-normal, 400);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn.accept {
    background: #22c55e;
    color: white;
  }

  .action-btn.accept:hover {
    background: #16a34a;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  }

  .action-btn.skip {
    background: var(--bg-secondary, #f8f9fa);
    color: var(--text-secondary, #6c757d);
    border: 1px solid var(--ui-border, #e5e7eb);
  }

  .action-btn.skip:hover {
    background: var(--bg-tertiary, #f1f3f5);
    border-color: var(--text-tertiary, #adb5bd);
  }

  .action-btn.delete {
    background: rgba(239, 68, 68, 0.08);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .action-btn.delete:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
  }
</style>
