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
  } from "$lib/features/tasks/state/taskForm.ts";
  import { taskActions } from "$lib/features/tasks/state/taskActions.ts";
  import type { MemoType, LocationPreference } from "$lib/types.ts";

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
    class="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center"
    onclick={handleClose}
    onkeydown={(e) => e.key === "Escape" && handleClose()}
    role="button"
    tabindex="-1"
  >
    <div
      class="mb-[calc(80px+env(safe-area-inset-bottom))] max-h-[calc(90vh-80px)] w-full max-w-[500px] [animation:slideUp_0.3s_ease-out] overflow-y-auto rounded-t-2xl bg-base-100 p-6 pb-[calc(1.5rem+80px+env(safe-area-inset-bottom))] md:mb-0 md:rounded-2xl md:pb-6"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.key === "Escape" && handleClose()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div
        class="mb-6 flex items-center justify-between border-b border-base-300 pb-4"
      >
        <h2 class="m-0 text-lg font-normal text-base-content">
          {$taskForm.isEditing ? "Edit Task" : "New Task"}
        </h2>
        <button
          class="btn btn-square border-none bg-base-200 btn-sm hover:bg-error hover:text-white"
          onclick={handleClose}
          aria-label="Close">✕</button
        >
      </div>

      <form onsubmit={handleSubmit}>
        <div class="mb-4">
          <label
            for="title"
            class="mb-2 block text-sm font-medium text-base-content/70"
            >Title</label
          >
          <input
            id="title"
            type="text"
            placeholder="What do you need to do?"
            bind:value={$taskForm.title}
            class="input-bordered input w-full"
            class:input-error={$taskFormErrors.title}
          />
          {#if $taskFormErrors.title}
            <span class="mt-1 block text-xs text-error"
              >{$taskFormErrors.title}</span
            >
          {/if}
        </div>

        <fieldset class="mb-4 border-none p-0">
          <legend class="mb-2 text-sm font-medium text-base-content/70"
            >Type</legend
          >
          <div
            class="flex flex-col gap-2"
            role="radiogroup"
            aria-label="Task type"
          >
            {#each typeOptions as option (option)}
              <button
                type="button"
                class="flex flex-col items-start rounded-lg border p-3 text-left transition-all duration-150 hover:border-[color:var(--color-primary)] {$taskForm.type ===
                option.value
                  ? 'border-[color:var(--color-primary)] bg-[color:color-mix(in_oklab,var(--color-primary)_10%,transparent)]'
                  : 'border-base-300 bg-base-200'}"
                onclick={() => handleTypeChange(option.value)}
                aria-pressed={$taskForm.type === option.value}
              >
                <span class="font-medium text-base-content">{option.label}</span
                >
                <span class="text-xs text-base-content/50"
                  >{option.description}</span
                >
              </button>
            {/each}
          </div>
        </fieldset>

        {#if $showDeadlineField}
          <div class="mb-4">
            <label
              for="deadline"
              class="mb-2 block text-sm font-medium text-base-content/70"
              >Deadline</label
            >
            <input
              id="deadline"
              type="date"
              bind:value={$taskForm.deadline}
              class="input-bordered input w-full"
              class:input-error={$taskFormErrors.deadline}
            />
            {#if $taskFormErrors.deadline}
              <span class="mt-1 block text-xs text-error"
                >{$taskFormErrors.deadline}</span
              >
            {/if}
          </div>
        {/if}

        {#if $showRecurrenceFields}
          <fieldset class="mb-4 border-none p-0">
            <legend class="mb-2 text-sm font-medium text-base-content/70"
              >Goal</legend
            >
            <div class="flex items-center gap-2">
              <input
                id="recurrence-count"
                type="number"
                min="1"
                max="100"
                bind:value={$taskForm.recurrenceCount}
                class="input-bordered input w-[70px] text-center"
                aria-label="Number of times"
              />
              <span class="text-sm text-base-content/70">times per</span>
              <select
                id="recurrence-period"
                bind:value={$taskForm.recurrencePeriod}
                class="select-bordered select w-[100px]"
                aria-label="Period"
              >
                {#each periodOptions as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
            {#if $taskFormErrors.recurrence}
              <span class="mt-1 block text-xs text-error"
                >{$taskFormErrors.recurrence}</span
              >
            {/if}
          </fieldset>
        {/if}

        <fieldset class="mb-4 border-none p-0">
          <legend class="mb-2 text-sm font-medium text-base-content/70"
            >Location</legend
          >
          <div class="flex flex-col gap-2">
            {#each locationOptions as option (option.value)}
              <label
                class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all duration-150 hover:border-[color:var(--color-primary)] {$taskForm.locationPreference ===
                option.value
                  ? 'border-[color:var(--color-primary)] bg-[color:color-mix(in_oklab,var(--color-primary)_10%,transparent)]'
                  : 'border-base-300'}"
              >
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
                  class="radio radio-sm radio-primary"
                />
                <span>{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        {#if $taskFormErrors.general}
          <div class="mb-4 alert alert-error p-3 text-sm">
            {$taskFormErrors.general}
          </div>
        {/if}

        <div class="mt-6 flex gap-2 border-t border-base-300 pt-4">
          <button
            type="button"
            class="btn flex-1 border border-base-300 btn-ghost"
            onclick={handleClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn flex-1 border-none bg-[var(--color-primary)] text-white hover:-translate-y-px hover:bg-[var(--color-primary-400)] hover:shadow-lg"
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
