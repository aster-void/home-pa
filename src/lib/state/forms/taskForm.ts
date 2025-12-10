/**
 * Task Form Store
 *
 * Manages the state of the task creation/editing form.
 * This form creates rich Memo objects with type, deadline, recurrence, etc.
 */

import { writable, derived } from "svelte/store";
import type {
  MemoType,
  LocationPreference,
  ImportanceLevel,
  RecurrenceGoal,
} from "../../types.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Task data for editing (used by form actions)
 */
export interface TaskEditData {
  id: string;
  title: string;
  type: MemoType;
  deadline?: Date;
  recurrenceGoal?: RecurrenceGoal;
  locationPreference: LocationPreference;
  importance?: ImportanceLevel;
}

/**
 * Task form data interface
 */
export interface TaskFormData {
  title: string;
  type: MemoType;
  deadline: string; // ISO date string for input binding
  recurrenceCount: number;
  recurrencePeriod: "day" | "week" | "month";
  locationPreference: LocationPreference;
  importance: ImportanceLevel | "";
  isEditing: boolean;
  editingId: string | null;
}

/**
 * Form validation errors
 */
export interface TaskFormErrors {
  title?: string;
  deadline?: string;
  recurrence?: string;
  general?: string;
}

// ============================================================================
// Initial State
// ============================================================================

const initialFormState: TaskFormData = {
  title: "",
  type: "バックログ",
  deadline: "",
  recurrenceCount: 1,
  recurrencePeriod: "week",
  locationPreference: "no_preference",
  importance: "",
  isEditing: false,
  editingId: null,
};

// ============================================================================
// Stores
// ============================================================================

/**
 * Main task form store
 */
export const taskForm = writable<TaskFormData>({ ...initialFormState });

/**
 * Form validation errors store
 */
export const taskFormErrors = writable<TaskFormErrors>({});

/**
 * Whether the form is currently being submitted
 */
export const isTaskFormSubmitting = writable<boolean>(false);

/**
 * Whether the task form modal/sheet is visible
 */
export const isTaskFormOpen = writable<boolean>(false);

// ============================================================================
// Derived Stores
// ============================================================================

/**
 * Whether the form has required content
 */
export const hasTaskFormContent = derived(
  taskForm,
  ($form) => $form.title.trim() !== "",
);

/**
 * Whether the form is valid
 */
export const isTaskFormValid = derived(
  [taskForm, taskFormErrors],
  ([$form, $errors]) => {
    // Must have title
    if (!$form.title.trim()) return false;

    // If 期限付き, must have deadline
    if ($form.type === "期限付き" && !$form.deadline) return false;

    // No validation errors
    if (Object.keys($errors).length > 0) return false;

    return true;
  },
);

/**
 * Whether the form is in editing mode
 */
export const isTaskFormEditing = derived(taskForm, ($form) => $form.isEditing);

/**
 * Whether deadline field should be shown
 */
export const showDeadlineField = derived(
  taskForm,
  ($form) => $form.type === "期限付き",
);

/**
 * Whether recurrence fields should be shown
 */
export const showRecurrenceFields = derived(
  taskForm,
  ($form) => $form.type === "ルーティン",
);

// ============================================================================
// Actions
// ============================================================================

export const taskFormActions = {
  /**
   * Update a single field
   */
  updateField<K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K],
  ): void {
    taskForm.update((form) => ({ ...form, [field]: value }));
    // Clear error for this field if any
    taskFormErrors.update((errors) => {
      const newErrors = { ...errors };
      if (field === "title") delete newErrors.title;
      if (field === "deadline") delete newErrors.deadline;
      return newErrors;
    });
  },

  /**
   * Update multiple fields at once
   */
  updateFields(updates: Partial<TaskFormData>): void {
    taskForm.update((form) => ({ ...form, ...updates }));
  },

  /**
   * Set form data for editing an existing task
   */
  setFormForEditing(task: TaskEditData): void {
    taskForm.set({
      title: task.title,
      type: task.type,
      deadline: task.deadline ? task.deadline.toISOString().split("T")[0] : "",
      recurrenceCount: task.recurrenceGoal?.count ?? 1,
      recurrencePeriod: task.recurrenceGoal?.period ?? "week",
      locationPreference: task.locationPreference,
      importance: task.importance ?? "",
      isEditing: true,
      editingId: task.id,
    });
    taskFormErrors.set({});
  },

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    taskForm.set({ ...initialFormState });
    taskFormErrors.set({});
    isTaskFormSubmitting.set(false);
  },

  /**
   * Open the task form (for creating new task)
   */
  openForm(): void {
    this.resetForm();
    isTaskFormOpen.set(true);
  },

  /**
   * Open the task form for editing
   */
  openFormForEditing(task: TaskEditData): void {
    this.setFormForEditing(task);
    isTaskFormOpen.set(true);
  },

  /**
   * Close the task form
   */
  closeForm(): void {
    isTaskFormOpen.set(false);
    // Reset after animation
    setTimeout(() => this.resetForm(), 300);
  },

  /**
   * Set validation error for a field
   */
  setFieldError(field: keyof TaskFormErrors, error: string): void {
    taskFormErrors.update((errors) => ({ ...errors, [field]: error }));
  },

  /**
   * Clear all validation errors
   */
  clearAllErrors(): void {
    taskFormErrors.set({});
  },

  /**
   * Set general error message
   */
  setGeneralError(message: string): void {
    taskFormErrors.update((errors) => ({ ...errors, general: message }));
  },

  /**
   * Set submitting state
   */
  setSubmitting(submitting: boolean): void {
    isTaskFormSubmitting.set(submitting);
  },

  /**
   * Change task type (resets type-specific fields)
   */
  setType(type: MemoType): void {
    taskForm.update((form) => ({
      ...form,
      type,
      // Reset type-specific fields when changing type
      deadline: type === "期限付き" ? form.deadline : "",
      recurrenceCount: type === "ルーティン" ? form.recurrenceCount : 1,
      recurrencePeriod: type === "ルーティン" ? form.recurrencePeriod : "week",
    }));
  },
};
