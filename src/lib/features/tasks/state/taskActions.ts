/**
 * Task Actions
 *
 * CRUD operations for rich Memo objects (tasks).
 * These memos have type, deadline, recurrence, location, etc.
 * All operations persist to database via Remote Functions.
 */

import { writable, derived, get } from "svelte/store";
import type {
  Memo,
  ImportanceLevel,
  RecurrenceGoal,
  MemoStatus,
} from "../../../types.ts";
import {
  taskForm,
  taskFormActions,
  type TaskFormData,
  type TaskFormErrors,
} from "./taskForm.ts";
import { toastState } from "../../../bootstrap/toast.svelte.ts";
import { enrichMemoViaAPI } from "../../assistant/services/suggestions/llm-enrichment.ts";
import {
  fetchMemos,
  createMemo,
  updateMemo,
  deleteMemo,
} from "./memo.functions.remote.ts";

// Toast compatibility wrapper
const toasts = {
  show: toastState.show.bind(toastState),
  success: toastState.success.bind(toastState),
  error: toastState.error.bind(toastState),
  info: toastState.info.bind(toastState),
};

// ============================================================================
// Tasks Store (Rich Memos)
// ============================================================================

/**
 * Store for rich Memo objects (tasks)
 * Persisted to database via Remote Functions.
 */
export const tasks = writable<Memo[]>([]);

/**
 * Whether tasks are currently being loaded from DB
 */
export const isTasksLoading = writable<boolean>(false);

/**
 * Set of task IDs currently being enriched by LLM
 */
export const enrichingTaskIds = writable<Set<string>>(new Set());

// ============================================================================
// DB Sync Helpers
// ============================================================================

/**
 * Convert JSON response to Memo (parse date strings)
 */
function jsonToMemo(json: {
  id: string;
  title: string;
  genre?: string;
  type: string;
  createdAt: string;
  deadline?: string;
  recurrenceGoal?: { count: number; period: "day" | "week" | "month" };
  locationPreference: string;
  status: {
    timeSpentMinutes: number;
    completionState: string;
    completionsThisPeriod?: number;
    periodStartDate?: string;
  };
  sessionDuration?: number;
  totalDurationExpected?: number;
  lastActivity?: string;
  importance?: string;
}): Memo {
  return {
    id: json.id,
    title: json.title,
    genre: json.genre,
    type: json.type as Memo["type"],
    createdAt: new Date(json.createdAt),
    deadline: json.deadline ? new Date(json.deadline) : undefined,
    recurrenceGoal: json.recurrenceGoal,
    locationPreference: json.locationPreference as Memo["locationPreference"],
    status: {
      timeSpentMinutes: json.status.timeSpentMinutes,
      completionState: json.status
        .completionState as MemoStatus["completionState"],
      completionsThisPeriod: json.status.completionsThisPeriod,
      periodStartDate: json.status.periodStartDate
        ? new Date(json.status.periodStartDate)
        : undefined,
    },
    sessionDuration: json.sessionDuration,
    totalDurationExpected: json.totalDurationExpected,
    lastActivity: json.lastActivity ? new Date(json.lastActivity) : undefined,
    importance: json.importance as ImportanceLevel | undefined,
  };
}

/**
 * Convert Memo to JSON for API (serialize dates)
 */
function memoToJson(memo: Memo) {
  return {
    title: memo.title,
    genre: memo.genre,
    type: memo.type,
    createdAt: memo.createdAt.toISOString(),
    deadline: memo.deadline?.toISOString(),
    recurrenceGoal: memo.recurrenceGoal,
    locationPreference: memo.locationPreference,
    status: {
      timeSpentMinutes: memo.status.timeSpentMinutes,
      completionState: memo.status.completionState,
      completionsThisPeriod: memo.status.completionsThisPeriod,
      periodStartDate: memo.status.periodStartDate?.toISOString(),
    },
    sessionDuration: memo.sessionDuration,
    totalDurationExpected: memo.totalDurationExpected,
    lastActivity: memo.lastActivity?.toISOString(),
    importance: memo.importance,
  };
}

/**
 * Load all tasks from database
 */
export async function loadTasks(): Promise<void> {
  isTasksLoading.set(true);
  try {
    const memosJson = await fetchMemos({});
    const memos = memosJson.map(jsonToMemo);
    tasks.set(memos);
  } catch (err) {
    console.error("[loadTasks] Failed to load tasks:", err);
    toasts.error("タスクの読み込みに失敗しました");
  } finally {
    isTasksLoading.set(false);
  }
}

/**
 * Check if a specific task is being enriched
 */
export function isTaskEnriching(taskId: string): boolean {
  return get(enrichingTaskIds).has(taskId);
}

/**
 * Derived store: is any task being enriched?
 */
export const hasEnrichingTasks = derived(
  enrichingTaskIds,
  ($ids) => $ids.size > 0,
);

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
    // Preserve importance if set (empty string becomes undefined, but valid values are preserved)
    importance:
      formData.importance && formData.importance.length > 0
        ? (formData.importance as ImportanceLevel)
        : undefined,
    // LLM will fill these later:
    // genre, sessionDuration, totalDurationExpected
  };
}

/**
 * Validate form data
 */
function validateTaskForm(formData: TaskFormData): {
  isValid: boolean;
  errors: TaskFormErrors;
} {
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

/**
 * Enrich a task with LLM in background
 * Updates the task in store and DB when complete
 */
async function enrichTaskInBackground(taskId: string): Promise<void> {
  // Mark as enriching
  enrichingTaskIds.update((ids) => {
    const newSet = new Set(ids);
    newSet.add(taskId);
    return newSet;
  });

  try {
    // Get the task from store (get fresh copy to ensure we have latest values)
    const currentTasks = get(tasks);
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) {
      console.warn(`[Enrichment] Task ${taskId} not found`);
      return;
    }

    // Call LLM enrichment via API
    const enrichment = await enrichMemoViaAPI(task);

    // Edge case: If enrichment is undefined/null, use fallback
    if (!enrichment) {
      console.warn(
        `[Enrichment] Received undefined enrichment for task ${taskId}, skipping update`,
      );
      return;
    }

    // Get fresh task copy again (in case it was updated while enrichment was running)
    const latestTasks = get(tasks);
    const latestTask = latestTasks.find((t) => t.id === taskId);
    if (!latestTask) {
      console.warn(`[Enrichment] Task ${taskId} was deleted during enrichment`);
      return;
    }

    // Build enrichment updates (only fill missing fields)
    const enrichmentUpdates: Record<string, unknown> = {};
    if (!latestTask.genre && enrichment.genre) {
      enrichmentUpdates.genre = enrichment.genre;
    }
    if (!latestTask.importance && enrichment.importance) {
      enrichmentUpdates.importance = enrichment.importance;
    }
    if (!latestTask.sessionDuration && enrichment.sessionDuration) {
      enrichmentUpdates.sessionDuration = enrichment.sessionDuration;
    }
    if (!latestTask.totalDurationExpected && enrichment.totalDurationExpected) {
      enrichmentUpdates.totalDurationExpected =
        enrichment.totalDurationExpected;
    }

    // Skip if nothing to update
    if (Object.keys(enrichmentUpdates).length === 0) {
      console.log(`[Enrichment] No fields to update for task ${taskId}`);
      return;
    }

    // Update in DB
    const updatedJson = await updateMemo({
      id: taskId,
      updates: enrichmentUpdates,
    });
    const enrichedTask = jsonToMemo(updatedJson);

    // Update task in store with enriched data
    tasks.update((currentTasks) => {
      const index = currentTasks.findIndex((t) => t.id === taskId);
      if (index === -1) return currentTasks;

      const newTasks = [...currentTasks];
      newTasks[index] = enrichedTask;
      return newTasks;
    });

    console.log(`[Enrichment] Task "${enrichedTask.title}" enriched:`, {
      genre: enrichedTask.genre,
      importance: enrichedTask.importance,
      sessionDuration: enrichedTask.sessionDuration,
      totalDurationExpected: enrichedTask.totalDurationExpected,
    });
  } catch (error) {
    console.error(`[Enrichment] Failed to enrich task ${taskId}:`, error);
  } finally {
    // Remove from enriching set
    enrichingTaskIds.update((ids) => {
      const newSet = new Set(ids);
      newSet.delete(taskId);
      return newSet;
    });
  }
}

// ============================================================================
// Actions
// ============================================================================

export const taskActions = {
  /**
   * Create a new task from the current form data
   * Task is saved to DB, added to store, then enriched by LLM in background
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

      // Create the memo (without enrichment fields)
      const newMemo = createMemoFromForm(formData);

      // Save to DB
      const savedJson = await createMemo(memoToJson(newMemo));
      const savedMemo = jsonToMemo(savedJson);

      // Add to store
      tasks.update((currentTasks) => [...currentTasks, savedMemo]);

      // Close form and show success
      taskFormActions.closeForm();
      toasts.show("タスクを作成しました", "success");

      // Start LLM enrichment in background
      enrichTaskInBackground(savedMemo.id);

      return savedMemo;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "タスクの作成に失敗しました";
      taskFormActions.setGeneralError(message);
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

      const currentTasks = get(tasks);
      const existing = currentTasks.find((t) => t.id === formData.editingId);
      if (!existing) {
        taskFormActions.setGeneralError("タスクが見つかりません");
        return null;
      }

      // Build updates
      const updates = {
        title: formData.title.trim(),
        type: formData.type,
        deadline:
          formData.type === "期限付き" && formData.deadline
            ? new Date(formData.deadline).toISOString()
            : undefined,
        recurrenceGoal:
          formData.type === "ルーティン"
            ? {
                count: formData.recurrenceCount,
                period: formData.recurrencePeriod,
              }
            : undefined,
        locationPreference: formData.locationPreference,
        importance:
          formData.importance && formData.importance.length > 0
            ? (formData.importance as ImportanceLevel)
            : undefined,
      };

      // Update in DB
      const updatedJson = await updateMemo({
        id: formData.editingId,
        updates,
      });
      const updatedMemo = jsonToMemo(updatedJson);

      // Update store
      tasks.update((currentTasks) => {
        const index = currentTasks.findIndex(
          (t) => t.id === formData.editingId,
        );
        if (index === -1) return currentTasks;
        const newTasks = [...currentTasks];
        newTasks[index] = updatedMemo;
        return newTasks;
      });

      // Close form and show success
      taskFormActions.closeForm();
      toasts.show("タスクを更新しました", "success");

      return updatedMemo;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "タスクの更新に失敗しました";
      taskFormActions.setGeneralError(message);
      return null;
    } finally {
      taskFormActions.setSubmitting(false);
    }
  },

  /**
   * Delete a task by ID
   */
  async delete(taskId: string): Promise<boolean> {
    try {
      // Delete from DB
      await deleteMemo({ id: taskId });

      // Remove from store
      tasks.update((currentTasks) => {
        return currentTasks.filter((t) => t.id !== taskId);
      });

      toasts.show("タスクを削除しました", "success");
      return true;
    } catch (err) {
      console.error("[delete] Failed:", err);
      toasts.show("タスクの削除に失敗しました", "error");
      return false;
    }
  },

  /**
   * Mark a task as complete
   */
  async markComplete(taskId: string): Promise<Memo | null> {
    try {
      const currentTasks = get(tasks);
      const existing = currentTasks.find((t) => t.id === taskId);
      if (!existing) return null;

      const newStatus = {
        ...existing.status,
        completionState: "completed" as const,
      };

      // Update in DB
      const updatedJson = await updateMemo({
        id: taskId,
        updates: {
          status: {
            timeSpentMinutes: newStatus.timeSpentMinutes,
            completionState: newStatus.completionState,
            completionsThisPeriod: newStatus.completionsThisPeriod,
            periodStartDate: newStatus.periodStartDate?.toISOString(),
          },
        },
      });
      const updatedMemo = jsonToMemo(updatedJson);

      // Update store
      tasks.update((currentTasks) => {
        const index = currentTasks.findIndex((t) => t.id === taskId);
        if (index === -1) return currentTasks;
        const newTasks = [...currentTasks];
        newTasks[index] = updatedMemo;
        return newTasks;
      });

      toasts.show("タスクを完了しました", "success");
      return updatedMemo;
    } catch (err) {
      console.error("[markComplete] Failed:", err);
      toasts.show("タスクの更新に失敗しました", "error");
      return null;
    }
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
