<script lang="ts">
  /**
   * CalendarSettings Component
   *
   * Provides import/export functionality for calendar events
   * Uses ical.js-backed API endpoints
   */

  import { calendarActions } from "$lib/bootstrap/compat.svelte.ts";
  import { UserSettings } from "$lib/features/shared/components/index.ts";

  // State
  let importing = $state(false);
  let importResult = $state<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  let fileInputRef: HTMLInputElement | undefined = $state();
  let showAdvanced = $state(false);
  let exportName = $state("Home-PA Calendar");

  // API mode is always enabled when using calendarActions (API-based store)
  const isApiEnabled = $state(true);

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
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
      // Reset file input
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
</script>

<div class="mx-auto max-w-[600px] p-6">
  <!-- Account Section -->
  <section
    class="card mb-4 rounded-xl bg-gradient-to-br from-[#F08A77] to-[#F5A898] p-5 text-white shadow-sm"
  >
    <h3 class="mb-2 text-lg text-white">👤 Account</h3>
    <UserSettings />
  </section>

  <!-- Import Section -->
  <section class="card mb-4 rounded-xl bg-base-100 p-5 shadow-sm">
    <h3 class="mb-2 text-lg text-base-content">📥 Import Calendar</h3>
    <p class="mb-4 text-sm text-base-content/60">
      Import events from Google Calendar, Apple Calendar, or any .ics file.
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
      class="hover:bg-primary-focus btn w-full border-none bg-primary text-white transition-all duration-200"
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
        class="relative mt-4 rounded-lg border p-4 {importResult.errors.length >
        0
          ? 'border-error bg-error/10'
          : 'border-success bg-success/10'}"
      >
        <button
          class="btn absolute top-2 right-2 text-base-content/60 btn-ghost btn-xs"
          onclick={clearImportResult}>×</button
        >

        {#if importResult.imported > 0}
          <p class="my-1 text-success">
            ✅ Imported {importResult.imported} events
          </p>
        {/if}

        {#if importResult.skipped > 0}
          <p class="my-1 text-info">
            ℹ️ Skipped {importResult.skipped} duplicates
          </p>
        {/if}

        {#if importResult.errors.length > 0}
          <div class="mt-2">
            <p class="font-medium text-error">⚠️ Errors:</p>
            <ul class="mt-2 ml-6 text-sm text-error">
              {#each importResult.errors as error, idx (idx)}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </section>

  <!-- Export Section -->
  <section class="card mb-4 rounded-xl bg-base-100 p-5 shadow-sm">
    <h3 class="mb-2 text-lg text-base-content">📤 Export Calendar</h3>
    <p class="mb-4 text-sm text-base-content/60">
      Download all your events as an .ics file for backup or import into other
      apps.
    </p>

    <button
      class="btn mb-2 border-none text-sm text-base-content/60 btn-ghost hover:text-base-content"
      onclick={() => (showAdvanced = !showAdvanced)}
    >
      {showAdvanced ? "▼" : "▶"} Advanced Options
    </button>

    {#if showAdvanced}
      <div class="mb-4 rounded-md bg-base-200 p-3">
        <label class="flex flex-col gap-1">
          <span class="text-sm text-base-content/60">Calendar Name:</span>
          <input
            type="text"
            class="input-bordered input w-full text-sm"
            bind:value={exportName}
            placeholder="Home-PA Calendar"
          />
        </label>
      </div>
    {/if}

    <button
      class="hover:bg-success-focus btn w-full border-none bg-success text-white transition-all duration-200"
      onclick={handleExport}
      disabled={!isApiEnabled}
    >
      📥 Download .ics File
    </button>
  </section>

  <!-- Sync Info -->
  <section class="card rounded-xl bg-base-200 p-5 shadow-sm">
    <h3 class="mb-2 text-lg text-base-content">🔄 Calendar Sync</h3>
    <p class="mb-4 text-sm text-base-content/60">
      Two-way sync with Google Calendar and Apple Calendar is coming soon!
    </p>
    <div
      class="mt-2 flex items-center justify-between rounded-md bg-base-100 p-3"
    >
      <span>CalDAV support</span>
      <span
        class="badge rounded-full bg-primary/20 px-3 py-2 text-xs font-semibold text-primary"
        >Coming Soon</span
      >
    </div>
  </section>
</div>
