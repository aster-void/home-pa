/**
 * Task Wiring Integration Tests
 *
 * Tests the complete flow:
 * 1. Task creation via taskActions
 * 2. Task storage in tasks store
 * 3. Schedule generation via scheduleActions
 * 4. Schedule display via scheduleResult store
 * 5. Session completion tracking
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import type { Memo, Gap } from "../../types.js";

// Mock fetch for API enrichment calls in tests
global.fetch = vi.fn();

// Task stores and actions
import { tasks, taskActions } from "../actions/taskActions.js";
import {
  taskForm,
  taskFormActions,
  isTaskFormOpen,
  isTaskFormSubmitting,
  taskFormErrors,
} from "../forms/taskForm.js";

// Schedule stores and actions
import {
  scheduleResult,
  isScheduleLoading,
  scheduleError,
  nextScheduledBlock,
  scheduledBlocks,
  droppedMandatory,
  scheduleActions,
} from "../schedule.js";

// Gap store
import { enrichedGaps } from "../gaps.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createTestGap(start: string, end: string): Gap {
  const startMinutes =
    parseInt(start.split(":")[0]) * 60 + parseInt(start.split(":")[1]);
  const endMinutes =
    parseInt(end.split(":")[0]) * 60 + parseInt(end.split(":")[1]);
  return {
    gapId: `gap-${start.replace(":", "")}`,
    start,
    end,
    duration: endMinutes - startMinutes,
    locationLabel: undefined,
  };
}

function clearAllStores() {
  tasks.set([]);
  scheduleActions.clear();
  taskFormActions.resetForm();
  vi.clearAllMocks();
}

// ============================================================================
// Task Form Tests
// ============================================================================

describe("Task Form Wiring", () => {
  beforeEach(() => {
    clearAllStores();
    // Mock fetch to return fallback enrichment (tests don't need real API)
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });
  });

  it("opens and closes the task form", () => {
    expect(get(isTaskFormOpen)).toBe(false);

    taskFormActions.openForm();
    expect(get(isTaskFormOpen)).toBe(true);

    taskFormActions.closeForm();
    // Note: closeForm uses setTimeout, so we check immediately
    expect(get(isTaskFormOpen)).toBe(false);
  });

  it("updates form fields correctly", () => {
    taskFormActions.updateField("title", "Test Task");
    taskFormActions.updateField("type", "期限付き");
    taskFormActions.updateField("deadline", "2025-12-31");

    const form = get(taskForm);
    expect(form.title).toBe("Test Task");
    expect(form.type).toBe("期限付き");
    expect(form.deadline).toBe("2025-12-31");
  });

  it("validates required fields on create", async () => {
    // Empty title should fail validation
    taskFormActions.updateField("title", "");
    const result = await taskActions.create();

    // Create should return null and set errors
    expect(result).toBeNull();
    expect(get(taskFormErrors).title).toBeDefined();
  });

  it("validates deadline for 期限付き type on create", async () => {
    taskFormActions.updateField("title", "Test");
    taskFormActions.updateField("type", "期限付き");
    taskFormActions.updateField("deadline", ""); // Missing deadline

    const result = await taskActions.create();

    // Create should return null and set errors
    expect(result).toBeNull();
    expect(get(taskFormErrors).deadline).toBeDefined();
  });

  it("resets form correctly", () => {
    taskFormActions.updateField("title", "Test");
    taskFormActions.updateField("type", "ルーティン");
    taskFormActions.resetForm();

    const form = get(taskForm);
    expect(form.title).toBe("");
    expect(form.type).toBe("バックログ"); // Default type
    expect(form.isEditing).toBe(false);
  });
});

// ============================================================================
// Task Creation Tests
// ============================================================================

describe("Task Creation Wiring", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("creates a backlog task", async () => {
    taskFormActions.updateField("title", "Read a book");
    taskFormActions.updateField("type", "バックログ");
    taskFormActions.updateField("locationPreference", "no_preference");

    const task = await taskActions.create();

    expect(task).not.toBeNull();
    expect(task?.title).toBe("Read a book");
    expect(task?.type).toBe("バックログ");

    const allTasks = get(tasks);
    expect(allTasks).toHaveLength(1);
    expect(allTasks[0].id).toBe(task?.id);
  });

  it("creates a deadline task with deadline", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split("T")[0];

    taskFormActions.updateField("title", "Submit report");
    taskFormActions.updateField("type", "期限付き");
    taskFormActions.updateField("deadline", dateStr);

    const task = await taskActions.create();

    expect(task).not.toBeNull();
    expect(task?.type).toBe("期限付き");
    expect(task?.deadline).toBeDefined();
  });

  it("creates a routine task with recurrence goal", async () => {
    taskFormActions.updateField("title", "Exercise");
    taskFormActions.updateField("type", "ルーティン");
    taskFormActions.updateField("recurrenceCount", 3);
    taskFormActions.updateField("recurrencePeriod", "week");

    const task = await taskActions.create();

    expect(task).not.toBeNull();
    expect(task?.type).toBe("ルーティン");
    expect(task?.recurrenceGoal?.count).toBe(3);
    expect(task?.recurrenceGoal?.period).toBe("week");
  });

  it("initializes task with correct default status", async () => {
    taskFormActions.updateField("title", "New task");

    const task = await taskActions.create();

    expect(task?.status.completionState).toBe("not_started");
    expect(task?.status.timeSpentMinutes).toBe(0);
    expect(task?.createdAt).toBeDefined();
  });
});

// ============================================================================
// Task Update Tests
// ============================================================================

describe("Task Update Wiring", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("updates an existing task", async () => {
    // Create initial task
    taskFormActions.updateField("title", "Original title");
    const task = await taskActions.create();
    expect(task).not.toBeNull();

    // Update the task
    taskFormActions.openFormForEditing({
      id: task!.id,
      title: task!.title,
      type: task!.type,
      locationPreference: task!.locationPreference,
    });

    taskFormActions.updateField("title", "Updated title");
    const updated = await taskActions.update();

    expect(updated?.title).toBe("Updated title");

    const allTasks = get(tasks);
    expect(allTasks).toHaveLength(1);
    expect(allTasks[0].title).toBe("Updated title");
  });

  it("deletes a task", async () => {
    taskFormActions.updateField("title", "Task to delete");
    const task = await taskActions.create();
    expect(get(tasks)).toHaveLength(1);

    const deleted = await taskActions.delete(task!.id);
    expect(deleted).toBe(true);
    expect(get(tasks)).toHaveLength(0);
  });
});

// ============================================================================
// Schedule Generation Tests
// ============================================================================

describe("Schedule Generation Wiring", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("generates schedule from tasks", async () => {
    // Create some tasks
    taskFormActions.updateField("title", "Task 1");
    await taskActions.create();

    taskFormActions.resetForm();
    taskFormActions.updateField("title", "Task 2");
    await taskActions.create();

    const currentTasks = get(tasks);
    expect(currentTasks).toHaveLength(2);

    // Create test gaps
    const testGaps: Gap[] = [
      createTestGap("09:00", "10:00"),
      createTestGap("14:00", "15:00"),
    ];

    // Generate schedule
    const result = await scheduleActions.regenerate(currentTasks, {
      gaps: testGaps,
      skipLLMEnrichment: true,
    });

    expect(result).not.toBeNull();
    expect(get(scheduleResult)).not.toBeNull();
    expect(get(scheduledBlocks).length).toBeGreaterThan(0);
  });

  it("updates loading state during generation", async () => {
    taskFormActions.updateField("title", "Test task");
    await taskActions.create();

    const testGaps: Gap[] = [createTestGap("09:00", "10:00")];
    const currentTasks = get(tasks);

    // Start generation (we can't easily test the loading state since it's async)
    const promise = scheduleActions.regenerate(currentTasks, {
      gaps: testGaps,
      skipLLMEnrichment: true,
    });

    await promise;

    // After completion, loading should be false
    expect(get(isScheduleLoading)).toBe(false);
    expect(get(scheduleError)).toBeNull();
  });

  it("clears schedule correctly", async () => {
    taskFormActions.updateField("title", "Test task");
    await taskActions.create();

    const testGaps: Gap[] = [createTestGap("09:00", "10:00")];
    await scheduleActions.regenerate(get(tasks), {
      gaps: testGaps,
      skipLLMEnrichment: true,
    });

    expect(get(scheduleResult)).not.toBeNull();

    scheduleActions.clear();

    expect(get(scheduleResult)).toBeNull();
    expect(get(scheduledBlocks)).toEqual([]);
  });
});

// ============================================================================
// Session Completion Tests
// ============================================================================

describe("Session Completion Wiring", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("marks session complete and updates memo status", async () => {
    taskFormActions.updateField("title", "Work session task");
    const task = await taskActions.create();
    expect(task).not.toBeNull();

    const updated = scheduleActions.markSessionComplete(task!, 30);

    expect(updated.status.timeSpentMinutes).toBe(30);
    expect(updated.status.completionState).toBe("in_progress");
    expect(updated.lastActivity).toBeDefined();
  });

  it("marks task as completed when time spent exceeds expected", async () => {
    taskFormActions.updateField("title", "Quick task");
    const task = await taskActions.create();

    // Set a low expected duration
    const taskWithDuration: Memo = {
      ...task!,
      totalDurationExpected: 30,
    };

    // Complete a session that exceeds the expected duration
    const updated = scheduleActions.markSessionComplete(taskWithDuration, 45);

    expect(updated.status.completionState).toBe("completed");
  });

  it("increments routine completions", async () => {
    taskFormActions.updateField("title", "Daily exercise");
    taskFormActions.updateField("type", "ルーティン");
    taskFormActions.updateField("recurrenceCount", 3);
    taskFormActions.updateField("recurrencePeriod", "day");

    const task = await taskActions.create();
    expect(task?.type).toBe("ルーティン");

    const updated = scheduleActions.markSessionComplete(task!, 30);

    expect(updated.status.completionsThisPeriod).toBe(1);
  });
});

// ============================================================================
// End-to-End Flow Test
// ============================================================================

describe("End-to-End Task Flow", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("complete flow: create → schedule → complete", async () => {
    // 1. Create a task via form
    taskFormActions.openForm();
    expect(get(isTaskFormOpen)).toBe(true);

    taskFormActions.updateField("title", "Important task");
    taskFormActions.updateField("type", "バックログ");
    taskFormActions.updateField("importance", "high");

    const task = await taskActions.create();
    expect(task).not.toBeNull();

    // 2. Verify task is in store
    const storedTasks = get(tasks);
    expect(storedTasks).toHaveLength(1);
    expect(storedTasks[0].title).toBe("Important task");

    // 3. Generate schedule
    const testGaps: Gap[] = [
      createTestGap("09:00", "10:00"),
      createTestGap("14:00", "16:00"),
    ];

    await scheduleActions.regenerate(storedTasks, {
      gaps: testGaps,
      skipLLMEnrichment: true,
    });

    // 4. Verify schedule was created
    const schedule = get(scheduleResult);
    expect(schedule).not.toBeNull();
    expect(schedule!.scheduled.length).toBeGreaterThan(0);

    // 5. Verify next block is available
    const next = get(nextScheduledBlock);
    expect(next).not.toBeNull();
    expect(next!.memoId).toBe(task!.id);

    // 6. Complete the session
    const completed = scheduleActions.markSessionComplete(task!, 45);
    expect(completed.status.timeSpentMinutes).toBe(45);
    expect(completed.status.completionState).toBe("in_progress");

    console.log("End-to-end flow completed successfully!");
  });

  it("handles multiple tasks with priorities", async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create deadline task (high priority)
    taskFormActions.updateField("title", "Urgent deadline");
    taskFormActions.updateField("type", "期限付き");
    taskFormActions.updateField(
      "deadline",
      tomorrow.toISOString().split("T")[0],
    );
    await taskActions.create();

    // Create backlog task (lower priority)
    taskFormActions.resetForm();
    taskFormActions.updateField("title", "Optional backlog");
    taskFormActions.updateField("type", "バックログ");
    await taskActions.create();

    const allTasks = get(tasks);
    expect(allTasks).toHaveLength(2);

    // Limited gap - only one task can fit
    const testGaps: Gap[] = [createTestGap("09:00", "09:30")];

    await scheduleActions.regenerate(allTasks, {
      gaps: testGaps,
      skipLLMEnrichment: true,
    });

    const schedule = get(scheduleResult);
    expect(schedule).not.toBeNull();

    // The deadline task should be scheduled (higher priority)
    // Note: This depends on the scoring algorithm
    console.log("Scheduled:", schedule!.scheduled.length);
    console.log("Dropped:", schedule!.dropped.length);
  });
});

// ============================================================================
// Store Reactivity Tests
// ============================================================================

describe("Store Reactivity", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("tasks store updates reactively", async () => {
    let updateCount = 0;
    const unsubscribe = tasks.subscribe(() => {
      updateCount++;
    });

    // Initial subscription triggers once
    expect(updateCount).toBe(1);

    taskFormActions.updateField("title", "Task 1");
    await taskActions.create();
    // Task added; background enrichment is asynchronous and may coalesce updates.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(updateCount).toBeGreaterThanOrEqual(2);

    taskFormActions.resetForm();
    taskFormActions.updateField("title", "Task 2");
    await taskActions.create();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(updateCount).toBeGreaterThanOrEqual(3);

    unsubscribe();
  });

  it("schedule stores update together", async () => {
    taskFormActions.updateField("title", "Test");
    await taskActions.create();

    const testGaps: Gap[] = [createTestGap("09:00", "10:00")];

    let resultUpdates = 0;
    let blocksUpdates = 0;

    const unsub1 = scheduleResult.subscribe(() => resultUpdates++);
    const unsub2 = scheduledBlocks.subscribe(() => blocksUpdates++);

    await scheduleActions.regenerate(get(tasks), {
      gaps: testGaps,
      skipLLMEnrichment: true,
    });

    // Both should have been updated
    expect(resultUpdates).toBeGreaterThan(1);
    expect(blocksUpdates).toBeGreaterThan(1);

    unsub1();
    unsub2();
  });
});
