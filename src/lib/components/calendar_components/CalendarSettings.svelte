<script lang="ts">
  /**
   * CalendarSettings Component
   *
   * Provides import/export functionality for calendar events
   * Uses ical.js-backed API endpoints
   */

  import { calendarActions } from "../../stores/index.js";
  import { UserSettings } from "../util_components/index.js";

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

<div class="calendar-settings">
  <!-- Account Section -->
  <section class="settings-section account-section">
    <h3>👤 Account</h3>
    <UserSettings />
  </section>

  <!-- Import Section -->
  <section class="settings-section">
    <h3>📥 Import Calendar</h3>
    <p class="section-description">
      Import events from Google Calendar, Apple Calendar, or any .ics file.
    </p>

    <input
      type="file"
      accept=".ics,text/calendar"
      onchange={handleFileSelect}
      bind:this={fileInputRef}
      class="file-input-hidden"
      disabled={importing || !isApiEnabled}
    />

    <button
      class="action-btn import-btn"
      onclick={triggerFileInput}
      disabled={importing || !isApiEnabled}
    >
      {#if importing}
        <span class="spinner"></span>
        Importing...
      {:else}
        📁 Select .ics File
      {/if}
    </button>

    {#if importResult}
      <div
        class="import-result"
        class:has-errors={importResult.errors.length > 0}
      >
        <button class="close-btn" onclick={clearImportResult}>×</button>

        {#if importResult.imported > 0}
          <p class="success">✅ Imported {importResult.imported} events</p>
        {/if}

        {#if importResult.skipped > 0}
          <p class="info">ℹ️ Skipped {importResult.skipped} duplicates</p>
        {/if}

        {#if importResult.errors.length > 0}
          <div class="errors">
            <p class="error-title">⚠️ Errors:</p>
            <ul>
              {#each importResult.errors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </section>

  <!-- Export Section -->
  <section class="settings-section">
    <h3>📤 Export Calendar</h3>
    <p class="section-description">
      Download all your events as an .ics file for backup or import into other
      apps.
    </p>

    <button
      class="advanced-toggle"
      onclick={() => (showAdvanced = !showAdvanced)}
    >
      {showAdvanced ? "▼" : "▶"} Advanced Options
    </button>

    {#if showAdvanced}
      <div class="advanced-options">
        <label>
          <span>Calendar Name:</span>
          <input
            type="text"
            bind:value={exportName}
            placeholder="Home-PA Calendar"
          />
        </label>
      </div>
    {/if}

    <button
      class="action-btn export-btn"
      onclick={handleExport}
      disabled={!isApiEnabled}
    >
      📥 Download .ics File
    </button>
  </section>

  <!-- Sync Info -->
  <section class="settings-section sync-info">
    <h3>🔄 Calendar Sync</h3>
    <p class="section-description">
      Two-way sync with Google Calendar and Apple Calendar is coming soon!
    </p>
    <div class="coming-soon">
      <span>CalDAV support</span>
      <span class="badge">Coming Soon</span>
    </div>
  </section>
</div>

<style>
  .calendar-settings {
    padding: 1.5rem;
    max-width: 600px;
    margin: 0 auto;
  }

  h3 {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    color: var(--color-text-primary, #1a1a2e);
  }

  .account-section {
    background: linear-gradient(135deg, var(--coral, #f08a77) 0%, #f5a898 100%);
    color: white;
    border: none;
  }

  .account-section h3 {
    color: white;
  }

  .api-notice {
    background: var(--color-warning-bg, #fff8e6);
    border: 1px solid var(--color-warning, #f59e0b);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .api-notice p {
    margin: 0 0 0.75rem 0;
    color: var(--color-warning-text, #92400e);
  }

  .enable-api-btn {
    background: var(--color-warning, #f59e0b);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .enable-api-btn:hover {
    background: var(--color-warning-dark, #d97706);
  }

  .settings-section {
    background: var(--color-surface, #ffffff);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .section-description {
    color: var(--color-text-secondary, #64748b);
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .file-input-hidden {
    display: none;
  }

  .action-btn {
    width: 100%;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .import-btn {
    background: var(--color-primary, #6366f1);
    color: white;
  }

  .import-btn:hover:not(:disabled) {
    background: var(--color-primary-dark, #4f46e5);
  }

  .export-btn {
    background: var(--color-success, #10b981);
    color: white;
  }

  .export-btn:hover:not(:disabled) {
    background: var(--color-success-dark, #059669);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .import-result {
    position: relative;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-success-bg, #ecfdf5);
    border-radius: 8px;
    border: 1px solid var(--color-success, #10b981);
  }

  .import-result.has-errors {
    background: var(--color-error-bg, #fef2f2);
    border-color: var(--color-error, #ef4444);
  }

  .close-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--color-text-secondary, #64748b);
    padding: 0.25rem;
    line-height: 1;
  }

  .import-result p {
    margin: 0.25rem 0;
  }

  .import-result .success {
    color: var(--color-success-text, #065f46);
  }

  .import-result .info {
    color: var(--color-info-text, #1e40af);
  }

  .errors {
    margin-top: 0.5rem;
  }

  .error-title {
    color: var(--color-error-text, #991b1b);
    font-weight: 500;
  }

  .errors ul {
    margin: 0.5rem 0 0 1.5rem;
    padding: 0;
    font-size: 0.85rem;
    color: var(--color-error-text, #991b1b);
  }

  .advanced-toggle {
    background: none;
    border: none;
    color: var(--color-text-secondary, #64748b);
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0.5rem 0;
    margin-bottom: 0.5rem;
  }

  .advanced-toggle:hover {
    color: var(--color-text-primary, #1a1a2e);
  }

  .advanced-options {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: var(--color-surface-alt, #f8fafc);
    border-radius: 6px;
  }

  .advanced-options label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .advanced-options label span {
    font-size: 0.85rem;
    color: var(--color-text-secondary, #64748b);
  }

  .advanced-options input {
    padding: 0.5rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .sync-info {
    background: var(--color-surface-alt, #f8fafc);
  }

  .coming-soon {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: var(--color-surface, #ffffff);
    border-radius: 6px;
    margin-top: 0.5rem;
  }

  .badge {
    background: var(--color-primary-light, #e0e7ff);
    color: var(--color-primary, #6366f1);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }
</style>
