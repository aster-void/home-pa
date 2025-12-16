<script lang="ts">
  /**
   * UtilitiesView Component
   *
   * Main view for mini apps and utilities.
   * Shows grid of mini app icons that open their respective views.
   * Settings icon in top-right opens settings popup.
   */

  import { TransitView } from "$lib/features/transit/components/index.ts";
  import { ProgressMemoView } from "$lib/features/progress-memo/components/index.ts";
  import SettingsPopup from "./SettingsPopup.svelte";

  // Mini app definitions
  interface MiniApp {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
  }

  const miniApps: MiniApp[] = [
    {
      id: "transit",
      name: "Transit",
      icon: "🚃",
      description: "Train & bus schedules",
      color: "var(--color-primary)",
    },
    {
      id: "progress-memo",
      name: "Progress Memo",
      icon: "📊",
      description: "Track goals & habits",
      color: "var(--color-success-500)",
    },
  ];

  // State
  let showSettings = $state(false);
  let activeMiniApp = $state<string | null>(null);

  function openMiniApp(id: string) {
    activeMiniApp = id;
  }

  function closeMiniApp() {
    activeMiniApp = null;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      closeMiniApp();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && activeMiniApp) {
      closeMiniApp();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="scrollbar-thin scrollbar-thumb-[var(--color-primary)] scrollbar-track-transparent mx-auto max-h-[calc(100vh-120px)] min-h-[calc(100vh-120px)] max-w-screen-xl overflow-y-auto bg-[var(--color-bg-app)]/60 p-8 backdrop-blur-sm max-md:p-4"
>
  <!-- Header with Settings Icon -->
  <div
    class="mb-8 flex items-start justify-between border-b border-[var(--color-border-default)] pb-4 max-md:mb-4"
  >
    <div>
      <h2
        class="m-0 mb-2 text-3xl font-normal text-[var(--color-text-primary)]"
      >
        Utilities
      </h2>
      <p class="m-0 text-base text-[var(--color-text-secondary)]">
        Mini apps and tools to enhance your workflow
      </p>
    </div>
    <button
      class="flex h-11 w-11 items-center justify-center rounded-xl text-xl text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
      onclick={() => (showSettings = true)}
      aria-label="Settings"
    >
      ⚙️
    </button>
  </div>

  <!-- Mini Apps Grid -->
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
    {#each miniApps as app (app.id)}
      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-6 text-center transition-all duration-200 hover:border-[var(--color-primary)]/50 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] active:scale-95"
        onclick={() => openMiniApp(app.id)}
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-transform duration-200 group-hover:scale-110"
          style="background-color: color-mix(in srgb, {app.color} 15%, transparent)"
        >
          {app.icon}
        </div>
        <div>
          <span
            class="block text-sm font-medium text-[var(--color-text-primary)]"
            >{app.name}</span
          >
          <span class="mt-1 block text-xs text-[var(--color-text-muted)]"
            >{app.description}</span
          >
        </div>
      </button>
    {/each}

    <!-- Placeholder for future apps -->
    <div
      class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border-default)] p-6 text-center opacity-50"
    >
      <span class="text-2xl text-[var(--color-text-muted)]">+</span>
      <span class="text-xs text-[var(--color-text-muted)]">More coming</span>
    </div>
  </div>
</div>

<!-- Settings Popup -->
<SettingsPopup open={showSettings} onClose={() => (showSettings = false)} />

<!-- Mini App Modal -->
{#if activeMiniApp}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center"
    role="button"
    tabindex="-1"
    aria-label="Close mini app"
    onclick={handleBackdropClick}
  >
    <div
      class="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-[var(--color-bg-app)] shadow-xl md:max-h-[80vh] md:max-w-2xl md:rounded-2xl"
    >
      {#if activeMiniApp === "transit"}
        <TransitView onClose={closeMiniApp} />
      {:else if activeMiniApp === "progress-memo"}
        <ProgressMemoView onClose={closeMiniApp} />
      {/if}
    </div>
  </div>
{/if}
