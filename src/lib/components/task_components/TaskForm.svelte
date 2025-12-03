<script lang="ts">
  import {
    taskForm,
    taskFormErrors,
    isTaskFormSubmitting,
    isTaskFormOpen,
    isTaskFormValid,
    showDeadlineField,
    showRecurrenceFields,
    taskFormActions,
  } from "../../stores/forms/taskForm.js";
  import { taskActions } from "../../stores/actions/taskActions.js";
  import type { MemoType, LocationPreference } from "../../types.js";

  // Type options
  const typeOptions: { value: MemoType; label: string; description: string }[] =
    [
      {
        value: "期限付き",
        label: "Deadline",
        description: "Task with a due date",
      },
      {
        value: "バックログ",
        label: "Backlog",
        description: "Task without urgency",
      },
      { value: "ルーティン", label: "Routine", description: "Recurring task" },
    ];

  // Location options
  const locationOptions: { value: LocationPreference; label: string }[] = [
    { value: "home/near_home", label: "🏠 Home only" },
    { value: "workplace/near_workplace", label: "🏢 Workplace only" },
    { value: "no_preference", label: "📍 Anywhere" },
  ];

  // Period options
  const periodOptions: { value: "day" | "week" | "month"; label: string }[] = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ];

  // Handlers
  function handleClose() {
    taskFormActions.closeForm();
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    await taskActions.submit();
  }

  function handleTypeChange(type: MemoType) {
    taskFormActions.setType(type);
  }
</script>

{#if $isTaskFormOpen}
  <div
    class="form-overlay"
    onclick={handleClose}
    onkeydown={(e) => e.key === "Escape" && handleClose()}
    role="button"
    tabindex="-1"
  >
    <div
      class="form-sheet"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div class="form-header">
        <h2>{$taskForm.isEditing ? "Edit Task" : "New Task"}</h2>
        <button class="close-btn" onclick={handleClose} aria-label="Close"
          >✕</button
        >
      </div>

      <form onsubmit={handleSubmit}>
        <!-- Title -->
        <div class="form-group">
          <label for="title">Title</label>
          <input
            id="title"
            type="text"
            placeholder="What do you need to do?"
            bind:value={$taskForm.title}
            class:error={$taskFormErrors.title}
          />
          {#if $taskFormErrors.title}
            <span class="error-text">{$taskFormErrors.title}</span>
          {/if}
        </div>

        <!-- Type -->
        <fieldset class="form-group fieldset-group">
          <legend>Type</legend>
          <div class="type-options" role="radiogroup" aria-label="Task type">
            {#each typeOptions as option}
              <button
                type="button"
                class="type-btn"
                class:selected={$taskForm.type === option.value}
                onclick={() => handleTypeChange(option.value)}
                aria-pressed={$taskForm.type === option.value}
              >
                <span class="type-label">{option.label}</span>
                <span class="type-desc">{option.description}</span>
              </button>
            {/each}
          </div>
        </fieldset>

        <!-- Deadline (for 期限付き) -->
        {#if $showDeadlineField}
          <div class="form-group">
            <label for="deadline">Deadline</label>
            <input
              id="deadline"
              type="date"
              bind:value={$taskForm.deadline}
              class:error={$taskFormErrors.deadline}
            />
            {#if $taskFormErrors.deadline}
              <span class="error-text">{$taskFormErrors.deadline}</span>
            {/if}
          </div>
        {/if}

        <!-- Recurrence (for ルーティン) -->
        {#if $showRecurrenceFields}
          <fieldset class="form-group fieldset-group">
            <legend>Goal</legend>
            <div class="recurrence-row">
              <input
                id="recurrence-count"
                type="number"
                min="1"
                max="100"
                bind:value={$taskForm.recurrenceCount}
                class="recurrence-count"
                aria-label="Number of times"
              />
              <span class="recurrence-text">times per</span>
              <select
                id="recurrence-period"
                bind:value={$taskForm.recurrencePeriod}
                class="recurrence-period"
                aria-label="Period"
              >
                {#each periodOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
            {#if $taskFormErrors.recurrence}
              <span class="error-text">{$taskFormErrors.recurrence}</span>
            {/if}
          </fieldset>
        {/if}

        <!-- Location -->
        <fieldset class="form-group fieldset-group">
          <legend>Location</legend>
          <div class="location-options">
            {#each locationOptions as option}
              <label class="radio-option">
                <input
                  type="radio"
                  name="location"
                  value={option.value}
                  checked={$taskForm.locationPreference === option.value}
                  onchange={() =>
                    taskFormActions.updateField(
                      "locationPreference",
                      option.value,
                    )}
                />
                <span>{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- General Error -->
        {#if $taskFormErrors.general}
          <div class="general-error">{$taskFormErrors.general}</div>
        {/if}

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="cancel-btn" onclick={handleClose}>
            Cancel
          </button>
          <button
            type="submit"
            class="submit-btn"
            disabled={!$isTaskFormValid || $isTaskFormSubmitting}
          >
            {$isTaskFormSubmitting
              ? "Saving..."
              : $taskForm.isEditing
                ? "Update Task"
                : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .form-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .form-sheet {
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    background: var(--bg-card);
    border-radius: 16px 16px 0 0;
    padding: var(--space-lg);
    overflow-y: auto;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (min-width: 768px) {
    .form-overlay {
      align-items: center;
    }

    .form-sheet {
      border-radius: 16px;
      max-height: 80vh;
    }
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-lg);
  }

  .form-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--bg-secondary);
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    color: var(--muted);
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: var(--danger);
    color: white;
  }

  .form-group {
    margin-bottom: var(--space-md);
  }

  .form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
  }

  .fieldset-group {
    border: none;
    padding: 0;
    margin: 0 0 var(--space-md) 0;
  }

  .fieldset-group legend {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
    padding: 0;
  }

  input[type="text"],
  input[type="date"],
  input[type="number"],
  select {
    width: 100%;
    padding: var(--space-sm);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    background: var(--bg-secondary);
    color: var(--text);
    font-size: 1rem;
    font-family: var(--font-family);
    transition: all 0.15s ease;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(102, 224, 255, 0.2);
  }

  input.error,
  select.error {
    border-color: var(--danger);
  }

  .error-text {
    display: block;
    font-size: 0.75rem;
    color: var(--danger);
    margin-top: 4px;
  }

  .type-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .type-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-sm);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    background: var(--bg-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .type-btn:hover {
    border-color: var(--primary);
  }

  .type-btn.selected {
    border-color: var(--primary);
    background: rgba(102, 224, 255, 0.1);
  }

  .type-label {
    font-weight: 600;
    color: var(--text);
  }

  .type-desc {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .recurrence-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .recurrence-count {
    width: 70px !important;
    text-align: center;
  }

  .recurrence-text {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .recurrence-period {
    width: 100px !important;
  }

  .location-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .radio-option:hover {
    border-color: var(--primary);
  }

  .radio-option:has(input:checked) {
    border-color: var(--primary);
    background: rgba(102, 224, 255, 0.1);
  }

  .radio-option input {
    width: auto;
    accent-color: var(--primary);
  }

  .general-error {
    padding: var(--space-sm);
    background: rgba(255, 59, 59, 0.1);
    border: 1px solid var(--danger);
    border-radius: 8px;
    color: var(--danger);
    font-size: 0.85rem;
    margin-bottom: var(--space-md);
  }

  .form-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
  }

  .cancel-btn,
  .submit-btn {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cancel-btn {
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .cancel-btn:hover {
    background: var(--muted);
    color: var(--bg);
  }

  .submit-btn {
    background: var(--primary);
    color: var(--bg);
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 224, 255, 0.3);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
