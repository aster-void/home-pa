<script lang="ts">
  import { onMount } from "svelte";
  import type {
    PendingSuggestion,
    AcceptedSuggestion,
  } from "$lib/features/assistant/state/schedule.ts";

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
  class="fixed max-w-[300px] min-w-[240px] animate-[cardAppear_0.3s_ease] rounded-xl border border-base-300 bg-base-100 p-4 shadow-lg"
  class:border-[color:var(--color-success)]={isAccepted}
  class:shadow-[0_12px_40px_rgba(34,197,94,0.15)]={isAccepted}
  style="left: {adjustedPosition.x}px; top: {adjustedPosition.y}px; z-index: 1000;"
  role="dialog"
  aria-label="Suggestion details"
>
  <div class="mb-2 flex items-start justify-between">
    <h4 class="flex-1 pr-2 text-base font-normal">{taskTitle}</h4>
    <button
      class="btn h-7 min-h-7 w-7 p-0 text-base btn-ghost transition-all duration-200 btn-sm"
      onclick={onClose}
      aria-label="Close">×</button
    >
  </div>

  <div class="mb-4">
    <div
      class="mb-2 flex items-center justify-between rounded-lg bg-base-200 p-2"
    >
      <span class="text-sm">{suggestion.startTime} - {suggestion.endTime}</span>
      <span
        class="rounded-full bg-[color:var(--color-accent)]/10 px-2.5 py-1 text-xs text-[color:var(--color-accent)]"
        >{suggestion.duration}分</span
      >
    </div>

    {#if isAccepted}
      <span
        class="inline-block rounded-full bg-success/10 px-3 py-1 text-xs text-success"
        >承認済み</span
      >
    {:else}
      <span
        class="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
        >提案中</span
      >
    {/if}
  </div>

  <div class="flex gap-2">
    {#if isAccepted}
      <button
        class="btn flex-1 border border-error/20 bg-error/10 text-error transition-all duration-200 hover:border-error/40 hover:bg-error/20"
        onclick={handleDelete}
      >
        削除
      </button>
    {:else}
      <button
        class="btn flex-1 border-none bg-success text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-success/80 hover:shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
        onclick={handleAccept}
      >
        承認
      </button>
      <button
        class="btn flex-1 border border-base-300 btn-ghost transition-all duration-200 hover:border-base-content/20 hover:bg-base-200"
        onclick={handleSkip}
      >
        スキップ
      </button>
    {/if}
  </div>
</div>

<style>
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
</style>
