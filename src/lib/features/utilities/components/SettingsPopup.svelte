<script lang="ts">
  /**
   * SettingsPopup Component
   *
   * Modal popup for app settings including account, import/export.
   * Opens from settings icon in UtilitiesView.
   */

  import { calendarActions } from "$lib/bootstrap/compat.svelte.ts";
  import { UserSettings } from "$lib/features/shared/components/index.ts";

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  const { open, onClose }: Props = $props();

  // Import/Export State
  let importing = $state(false);
  let importResult = $state<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  let fileInputRef: HTMLInputElement | undefined = $state();
  let showAdvanced = $state(false);
  let exportName = $state("Home-PA Calendar");

  const isApiEnabled = $state(true);

  // Tab state
  type Tab = "account" | "data";
  let activeTab = $state<Tab>("account");

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.name.endsWith(".ics") && file.type !== "text/calendar") {
      importResult = {
        imported: 0,
        skipped: 0,
        errors: ["Please select a valid .ics file"],
      };
      return;
    }

    importing = true;
    importResult = null;

    try {
      const result = await calendarActions.importICS(file);
      importResult = result;
    } catch (error) {
      importResult = {
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "Import failed"],
      };
    } finally {
      importing = false;
      if (fileInputRef) {
        fileInputRef.value = "";
      }
    }
  }

  function handleExport() {
    const url = calendarActions.getExportUrl(undefined, undefined, exportName);
    window.location.href = url;
  }

  function triggerFileInput() {
    fileInputRef?.click();
  }

  function clearImportResult() {
    importResult = null;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center"
    role="button"
    tabindex="-1"
    aria-label="Close settings"
    onclick={handleBackdropClick}
  >
    <!-- Modal -->
    <div
      class="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-[var(--color-bg-app)] shadow-xl md:max-w-lg md:rounded-2xl"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-[var(--color-border-default)] p-4"
      >
        <div class="flex items-center gap-3">
          <span class="text-xl">⚙️</span>
          <h2 class="m-0 text-xl font-medium text-[var(--color-text-primary)]">
            Settings
          </h2>
        </div>
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
          onclick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-[var(--color-border-default)]">
        <button
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 {activeTab ===
          'account'
            ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
          onclick={() => (activeTab = "account")}
        >
          Account
        </button>
        <button
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 {activeTab ===
          'data'
            ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
          onclick={() => (activeTab = "data")}
        >
          Import / Export
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 min-h-0 overflow-y-auto p-4">
        {#if activeTab === "account"}
          <!-- Account Tab -->
          <div
            class="rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-800)] p-5 text-white shadow-[0_4px_20px_rgba(123,190,187,0.25)]"
          >
            <UserSettings />
          </div>
        {:else}
          <!-- Import/Export Tab -->
          <div class="flex flex-col gap-4">
            <!-- Import Section -->
            <div
              class="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4"
            >
              <h3
                class="mb-2 text-base font-medium text-[var(--color-text-primary)]"
              >
                Import Calendar
              </h3>
              <p class="mb-3 text-sm text-[var(--color-text-secondary)]">
                Import events from Google Calendar, Apple Calendar, or any .ics
                file.
              </p>

              <input
                type="file"
                accept=".ics,text/calendar"
                onchange={handleFileSelect}
                bind:this={fileInputRef}
                class="hidden"
                disabled={importing || !isApiEnabled}
              />

              <button
                class="btn w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-sm text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50"
                onclick={triggerFileInput}
                disabled={importing || !isApiEnabled}
              >
                {#if importing}
                  <span class="loading loading-sm loading-spinner"></span>
                  Importing...
                {:else}
                  📁 Select .ics File
                {/if}
              </button>

              {#if importResult}
                <div
                  class="relative mt-3 rounded-lg border p-3 text-sm {importResult
                    .errors.length > 0
                    ? 'border-[var(--color-error-500)]/30 bg-[var(--color-error-100)]'
                    : 'border-[var(--color-success-500)]/30 bg-[var(--color-success-100)]'}"
                >
                  <button
                    class="absolute top-2 right-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    onclick={clearImportResult}>×</button
                  >

                  {#if importResult.imported > 0}
                    <p class="text-[var(--color-success-500)]">
                      ✓ Imported {importResult.imported} events
                    </p>
                  {/if}

                  {#if importResult.skipped > 0}
                    <p class="text-[var(--color-primary)]">
                      Skipped {importResult.skipped} duplicates
                    </p>
                  {/if}

                  {#if importResult.errors.length > 0}
                    <div class="text-[var(--color-error-500)]">
                      {#each importResult.errors as error, idx (idx)}
                        <p>{error}</p>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Export Section -->
            <div
              class="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4"
            >
              <h3
                class="mb-2 text-base font-medium text-[var(--color-text-primary)]"
              >
                Export Calendar
              </h3>
              <p class="mb-3 text-sm text-[var(--color-text-secondary)]">
                Download all your events as an .ics file.
              </p>

              <button
                class="mb-3 flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                onclick={() => (showAdvanced = !showAdvanced)}
              >
                {showAdvanced ? "▼" : "▶"} Advanced
              </button>

              {#if showAdvanced}
                <div class="mb-3">
                  <label class="flex flex-col gap-1">
                    <span class="text-xs text-[var(--color-text-muted)]"
                      >Calendar Name</span
                    >
                    <input
                      type="text"
                      class="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-app)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                      bind:value={exportName}
                      placeholder="Home-PA Calendar"
                    />
                  </label>
                </div>
              {/if}

              <button
                class="btn w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-sm text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50"
                onclick={handleExport}
                disabled={!isApiEnabled}
              >
                📥 Download .ics File
              </button>
            </div>

            <!-- Sync Info -->
            <div
              class="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4"
            >
              <h3
                class="mb-2 text-base font-medium text-[var(--color-text-primary)]"
              >
                Calendar Sync
              </h3>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--color-text-secondary)]"
                  >CalDAV support</span
                >
                <span
                  class="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]"
                  >Coming Soon</span
                >
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
