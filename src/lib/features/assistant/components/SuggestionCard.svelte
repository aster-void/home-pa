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
    /** Maximum allowed duration in minutes (for constraint feedback) */
    maxDuration?: number;
    onAccept?: () => void;
    onSkip?: () => void;
    onDelete?: () => void;
    onClose?: () => void;
    /** Called when user changes duration (accepted suggestions only) */
    onDurationChange?: (newDuration: number) => void;
  }

  let {
    suggestion,
    taskTitle,
    isAccepted,
    position = { x: 0, y: 0 },
    maxDuration,
    onAccept,
    onSkip,
    onDelete,
    onClose,
    onDurationChange,
  }: Props = $props();

  // Local state for duration slider
  let sliderDuration = $state(suggestion.duration);
  let isDraggingSlider = $state(false);

  // Min/max duration constraints
  const MIN_DURATION = 5;
  const effectiveMaxDuration = $derived(maxDuration ?? 180); // Default 3 hours max

  // Update slider when suggestion changes
  $effect(() => {
    if (!isDraggingSlider) {
      sliderDuration = suggestion.duration;
    }
  });

  function handleSliderChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const newValue = Math.round(Number(target.value) / 5) * 5; // Snap to 5-min increments
    sliderDuration = newValue;
  }

  function handleSliderCommit() {
    isDraggingSlider = false;
    if (sliderDuration !== suggestion.duration) {
      onDurationChange?.(sliderDuration);
    }
  }

  function handleSliderStart() {
    isDraggingSlider = true;
  }

  function formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

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
  class="fixed max-w-[300px] min-w-[240px] animate-[cardAppear_0.3s_ease] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4 shadow-lg"
  class:border-[var(--color-success-500)]={isAccepted}
  class:shadow-[0_12px_40px_rgba(42,179,136,0.15)]={isAccepted}
  style="left: {adjustedPosition.x}px; top: {adjustedPosition.y}px; z-index: 1000;"
  role="dialog"
  aria-label="Suggestion details"
>
  <div class="mb-2 flex items-start justify-between">
    <h4
      class="flex-1 pr-2 text-base font-normal text-[var(--color-text-primary)]"
    >
      {taskTitle}
    </h4>
    <button
      class="btn h-7 min-h-7 w-7 p-0 text-base text-[var(--color-text-secondary)] btn-ghost transition-all duration-200 btn-sm"
      onclick={onClose}
      aria-label="Close">×</button
    >
  </div>

  <div class="mb-4">
    <div
      class="mb-2 flex items-center justify-between rounded-lg bg-[var(--color-bg-surface)] p-2"
    >
      <span class="text-sm text-[var(--color-text-primary)]"
        >{suggestion.startTime} - {suggestion.endTime}</span
      >
      <span
        class="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs text-[var(--color-primary)]"
        >{isDraggingSlider ? sliderDuration : suggestion.duration}分</span
      >
    </div>

    {#if isAccepted}
      <!-- Duration adjustment slider for accepted suggestions -->
      <div class="mb-3">
        <div
          class="mb-1 flex items-center justify-between text-xs text-[var(--color-text-secondary)]"
        >
          <span>時間調整</span>
          <span class="text-[var(--color-primary)]">
            {formatDuration(sliderDuration)}
            {#if effectiveMaxDuration < 180}
              <span class="text-[var(--color-text-muted)]">
                (最大 {formatDuration(effectiveMaxDuration)})
              </span>
            {/if}
          </span>
        </div>
        <input
          type="range"
          min={MIN_DURATION}
          max={effectiveMaxDuration}
          step="5"
          value={sliderDuration}
          class="range w-full range-primary range-sm"
          oninput={handleSliderChange}
          onmousedown={handleSliderStart}
          ontouchstart={handleSliderStart}
          onmouseup={handleSliderCommit}
          ontouchend={handleSliderCommit}
          onchange={handleSliderCommit}
        />
        <div
          class="mt-1 flex justify-between text-[10px] text-[var(--color-text-muted)]"
        >
          <span>{MIN_DURATION}m</span>
          <span>{formatDuration(effectiveMaxDuration)}</span>
        </div>
      </div>

      <span
        class="inline-block rounded-full bg-[var(--color-success-100)] px-3 py-1 text-xs text-[var(--color-success-500)]"
        >承認済み</span
      >
    {:else}
      <span
        class="inline-block rounded-full bg-[var(--color-primary-100)] px-3 py-1 text-xs text-[var(--color-primary)]"
        >提案中</span
      >
    {/if}
  </div>

  <div class="flex gap-2">
    {#if isAccepted}
      <button
        class="btn flex-1 border border-[var(--color-error-500)]/20 bg-[var(--color-error-100)] text-[var(--color-error-500)] transition-all duration-200 hover:border-[var(--color-error-500)]/40 hover:bg-[var(--color-error-500)]/20"
        onclick={handleDelete}
      >
        削除
      </button>
    {:else}
      <button
        class="btn flex-1 border-none bg-[var(--color-success-500)] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-success-700)] hover:shadow-[0_4px_12px_rgba(42,179,136,0.3)]"
        onclick={handleAccept}
      >
        承認
      </button>
      <button
        class="btn flex-1 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] btn-ghost transition-all duration-200 hover:border-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)]"
        onclick={handleSkip}
      >
        スキップ
      </button>
    {/if}
  </div>
</div>
