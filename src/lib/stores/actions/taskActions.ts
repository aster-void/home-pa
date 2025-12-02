/**
 * Task Actions
 *
 * CRUD operations for rich Memo objects (tasks).
 * These memos have type, deadline, recurrence, location, etc.
 */

import { writable, get } from "svelte/store";
import type { Memo, MemoType, LocationPreference, ImportanceLevel, RecurrenceGoal, MemoStatus } from "../../types.js";
import {
  taskForm,
  taskFormActions,
  taskFormErrors,
  isTaskFormSubmitting,
  type TaskFormData,
  type TaskFormErrors,
} from "../forms/taskForm.js";
import { toasts } from "../toast.js";

// ============================================================================
// Tasks Store (Rich Memos)
// ============================================================================

/**
 * Store for rich Memo objects (tasks)
 * Separate from old simple memos in data.ts
 */
export const tasks = writable<Memo[]>([]);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new Memo from form data
 */
function createMemoFromForm(formData: TaskFormData): Memo {
  const now = new Date();

  // Build recurrence goal if routine
  let recurrenceGoal: RecurrenceGoal | undefined;
  if (formData.type === "ルーティン") {
    recurrenceGoal = {
      count: formData.recurrenceCount,
      period: formData.recurrencePeriod,
    };
  }

  // Parse deadline if deadline type
  let deadline: Date | undefined;
  if (formData.type === "期限付き" && formData.deadline) {
    deadline = new Date(formData.deadline);
    // Set to end of day
    deadline.setHours(23, 59, 59, 999);
  }

  // Initial status
  const status: MemoStatus = {
    timeSpentMinutes: 0,
    completionState: "not_started",
    completionsThisPeriod: 0,
    periodStartDate: now,
  };

  return {
    id: crypto.randomUUID(),
    title: formData.title.trim(),
    type: formData.type,
    createdAt: now,
    deadline,
    recurrenceGoal,
    locationPreference: formData.locationPreference,
    status,
    importance: formData.importance || undefined,
    // LLM will fill these later:
    // genre, sessionDuration, totalDurationExpected
  };
}

/**
 * Validate form data
 */
function validateTaskForm(formData: TaskFormData): { isValid: boolean; errors: TaskFormErrors } {
  const errors: TaskFormErrors = {};

  // Title is required
  if (!formData.title.trim()) {
    errors.title = "タスク名を入力してください";
  }

  // Deadline required for 期限付き
  if (formData.type === "期限付き" && !formData.deadline) {
    errors.deadline = "期限を設定してください";
  }

  // Validate deadline is not in the past
  if (formData.type === "期限付き" && formData.deadline) {
    const deadline = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) {
      errors.deadline = "過去の日付は設定できません";
    }
  }

  // Recurrence count must be positive
  if (formData.type === "ルーティン" && formData.recurrenceCount < 1) {
    errors.recurrence = "回数は1以上を設定してください";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================================
// Actions
// ============================================================================

export const taskActions = {
  /**
   * Create a new task from the current form data
   */
  async create(): Promise<Memo | null> {
    const formData = get(taskForm);

    // Clear previous errors
    taskFormActions.clearAllErrors();

    // Validate
    const validation = validateTaskForm(formData);
    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, error]) => {
        taskFormActions.setFieldError(field as keyof TaskFormErrors, error);
      });
      return null;
    }

    try {
      taskFormActions.setSubmitting(true);

      // Create the memo
      const newMemo = createMemoFromForm(formData);

      // Add to store
      tasks.update((currentTasks) => [...currentTasks, newMemo]);

      // Close form and show success
      taskFormActions.closeForm();
      toasts.show("タスクを作成しました", "success");

      return newMemo;
    } catch (error: any) {
      taskFormActions.setGeneralError(error.message || "タスクの作成に失敗しました");
      return null;
    } finally {
      taskFormActions.setSubmitting(false);
    }
  },

  /**
   * Update an existing task from the current form data
   */
  async update(): Promise<Memo | null> {
    const formData = get(taskForm);

    if (!formData.editingId) {
      taskFormActions.setGeneralError("編集するタスクが選択されていません");
      return null;
    }

    // Clear previous errors
    taskFormActions.clearAllErrors();

    // Validate
    const validation = validateTaskForm(formData);
    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, error]) => {
        taskFormActions.setFieldError(field as keyof TaskFormErrors, error);
      });
      return null;
    }

    try {
      taskFormActions.setSubmitting(true);

      let updatedMemo: Memo | null = null;

      tasks.update((currentTasks) => {
        const index = currentTasks.findIndex((t) => t.id === formData.editingId);
        if (index === -1) return currentTasks;

        const existing = currentTasks[index];

        // Build updated memo (preserve some fields)
        updatedMemo = {
          ...existing,
          title: formData.title.trim(),
          type: formData.type,
          deadline:
            formData.type === "期限付き" && formData.deadline
              ? new Date(formData.deadline)
              : undefined,
          recurrenceGoal:
            formData.type === "ルーティン"
              ? { count: formData.recurrenceCount, period: formData.recurrencePeriod }
              : undefined,
          locationPreference: formData.locationPreference,
          importance: formData.importance || undefined,
        };

        const newTasks = [...currentTasks];
        newTasks[index] = updatedMemo;
        return newTasks;
      });

      if (!updatedMemo) {
        taskFormActions.setGeneralError("タスクが見つかりません");
        return null;
      }

      // Close form and show success
      taskFormActions.closeForm();
      toasts.show("タスクを更新しました", "success");

      return updatedMemo;
    } catch (error: any) {
      taskFormActions.setGeneralError(error.message || "タスクの更新に失敗しました");
      return null;
    } finally {
      taskFormActions.setSubmitting(false);
    }
  },

  /**
   * Delete a task by ID
   */
  delete(taskId: string): boolean {
    let deleted = false;

    tasks.update((currentTasks) => {
      const index = currentTasks.findIndex((t) => t.id === taskId);
      if (index === -1) return currentTasks;

      deleted = true;
      const newTasks = [...currentTasks];
      newTasks.splice(index, 1);
      return newTasks;
    });

    if (deleted) {
      toasts.show("タスクを削除しました", "success");
    } else {
      toasts.show("タスクが見つかりません", "error");
    }

    return deleted;
  },

  /**
   * Mark a task as complete
   */
  markComplete(taskId: string): Memo | null {
    let updatedMemo: Memo | null = null;

    tasks.update((currentTasks) => {
      const index = currentTasks.findIndex((t) => t.id === taskId);
      if (index === -1) return currentTasks;

      const existing = currentTasks[index];
      updatedMemo = {
        ...existing,
        status: {
          ...existing.status,
          completionState: "completed",
        },
      };

      const newTasks = [...currentTasks];
      newTasks[index] = updatedMemo;
      return newTasks;
    });

    if (updatedMemo) {
      toasts.show("タスクを完了しました", "success");
    }

    return updatedMemo;
  },

  /**
   * Get active tasks (not completed)
   */
  getActive(): Memo[] {
    return get(tasks).filter((t) => t.status.completionState !== "completed");
  },

  /**
   * Get all tasks
   */
  getAll(): Memo[] {
    return get(tasks);
  },

  /**
   * Submit the form (create or update based on editing state)
   */
  async submit(): Promise<Memo | null> {
    const formData = get(taskForm);
    if (formData.isEditing) {
      return this.update();
    } else {
      return this.create();
    }
  },

  /**
   * Start editing a task
   */
  edit(task: Memo): void {
    taskFormActions.openFormForEditing({
      id: task.id,
      title: task.title,
      type: task.type,
      deadline: task.deadline,
      recurrenceGoal: task.recurrenceGoal,
      locationPreference: task.locationPreference,
      importance: task.importance,
    });
  },

  /**
   * Open form for creating new task
   */
  startCreate(): void {
    taskFormActions.openForm();
  },

  /**
   * Cancel form
   */
  cancel(): void {
    taskFormActions.closeForm();
  },
};

