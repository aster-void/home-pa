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

<div class="mx-auto max-w-[600px]">
  <!-- Account Section -->
  <section
    class="mb-4 rounded-2xl bg-gradient-to-br from-[#ed8936] to-[#dd6b20] p-6 text-white shadow-[0_4px_20px_rgba(237,137,54,0.25)]"
  >
    <h3 class="mb-3 font-serif text-xl font-normal text-white">Account</h3>
    <UserSettings />
  </section>

  <!-- Import Section -->
  <section
    class="mb-4 rounded-2xl border border-[#1a202c]/5 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
  >
    <h3 class="mb-2 font-serif text-xl font-normal text-[#1a202c]">
      Import Calendar
    </h3>
    <p class="mb-4 text-sm text-[#718096]">
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
      class="btn w-full rounded-xl border-none bg-[#faf8f6] text-[#4a5568] shadow-sm transition-all duration-200 hover:bg-[#f0ebe6] hover:text-[#1a202c] disabled:opacity-50"
      onclick={triggerFileInput}
      disabled={importing || !isApiEnabled}
    >
      {#if importing}
        <span class="loading loading-sm loading-spinner"></span>
        Importing...
      {:else}
        Select .ics File
      {/if}
    </button>

    {#if importResult}
      <div
        class="relative mt-4 rounded-xl border p-4 {importResult.errors.length >
        0
          ? 'border-[#EF4444]/30 bg-[#EF4444]/5'
          : 'border-[#22c55e]/30 bg-[#22c55e]/5'}"
      >
        <button
          class="btn absolute top-2 right-2 h-8 min-h-8 w-8 rounded-lg p-0 text-[#718096] btn-ghost btn-xs hover:bg-[#1a202c]/5"
          onclick={clearImportResult}>×</button
        >

        {#if importResult.imported > 0}
          <p class="my-1 text-[#22c55e]">
            ✓ Imported {importResult.imported} events
          </p>
        {/if}

        {#if importResult.skipped > 0}
          <p class="my-1 text-[#3b82f6]">
            Skipped {importResult.skipped} duplicates
          </p>
        {/if}

        {#if importResult.errors.length > 0}
          <div class="mt-2">
            <p class="font-medium text-[#EF4444]">Errors:</p>
            <ul class="mt-2 ml-4 list-disc text-sm text-[#EF4444]">
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
  <section
    class="mb-4 rounded-2xl border border-[#1a202c]/5 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
  >
    <h3 class="mb-2 font-serif text-xl font-normal text-[#1a202c]">
      Export Calendar
    </h3>
    <p class="mb-4 text-sm text-[#718096]">
      Download all your events as an .ics file for backup or import into other
      apps.
    </p>

    <button
      class="btn mb-3 h-auto min-h-0 border-none bg-transparent p-0 text-sm font-medium text-[#718096] hover:bg-transparent hover:text-[#ed8936]"
      onclick={() => (showAdvanced = !showAdvanced)}
    >
      {showAdvanced ? "▼" : "▶"} Advanced Options
    </button>

    {#if showAdvanced}
      <div class="mb-4 rounded-xl bg-[#faf8f6] p-4">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-[#4a5568]">Calendar Name</span>
          <input
            type="text"
            class="input w-full rounded-xl border-[#1a202c]/10 bg-white px-4 py-2.5 text-sm text-[#1a202c] focus:border-[#ed8936] focus:ring-2 focus:ring-[#ed8936]/20"
            bind:value={exportName}
            placeholder="Home-PA Calendar"
          />
        </label>
      </div>
    {/if}

    <button
      class="btn w-full rounded-xl border-none bg-[#faf8f6] text-[#4a5568] shadow-sm transition-all duration-200 hover:bg-[#f0ebe6] hover:text-[#1a202c] disabled:opacity-50"
      onclick={handleExport}
      disabled={!isApiEnabled}
    >
      Download .ics File
    </button>
  </section>

  <!-- Sync Info -->
  <section
    class="rounded-2xl border border-[#1a202c]/5 bg-[#faf8f6] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
  >
    <h3 class="mb-2 font-serif text-xl font-normal text-[#1a202c]">
      Calendar Sync
    </h3>
    <p class="mb-4 text-sm text-[#718096]">
      Two-way sync with Google Calendar and Apple Calendar is coming soon!
    </p>
    <div
      class="mt-2 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
    >
      <span class="text-sm font-medium text-[#4a5568]">CalDAV support</span>
      <span
        class="rounded-full bg-[#ed8936]/10 px-3 py-1.5 text-xs font-semibold text-[#ed8936]"
        >Coming Soon</span
      >
    </div>
  </section>
</div>
