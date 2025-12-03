/**
 * Schedule Store & Suggestion Engine Tests
 *
 * Tests the full pipeline:
 * - Creating Memos with the new rich structure
 * - Running the suggestion engine
 * - Checking the schedule output
 */

import { describe, it, expect, beforeEach } from "vitest";
import { get } from "svelte/store";
import type { Memo, Gap } from "../../types.js";
import {
  createEngine,
  filterActiveMemos,
  memosToSuggestions,
  MANDATORY_THRESHOLD,
} from "../../services/suggestions/index.js";
import {
  scheduleResult,
  scheduleActions,
  nextScheduledBlock,
  hasScheduledTasks,
} from "../schedule.js";

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a test memo with sensible defaults
 */
function createTestMemo(overrides: Partial<Memo> & { title: string }): Memo {
  const now = new Date();
  const { title, ...rest } = overrides;
  return {
    id: crypto.randomUUID(),
    title,
    type: rest.type ?? "バックログ",
    createdAt: rest.createdAt ?? now,
    locationPreference: rest.locationPreference ?? "no_preference",
    status: rest.status ?? {
      timeSpentMinutes: 0,
      completionState: "not_started",
    },
    ...rest,
  };
}

/**
 * Create a test gap
 */
function createTestGap(start: string, end: string, gapId?: string): Gap {
  const startMinutes =
    parseInt(start.split(":")[0]) * 60 + parseInt(start.split(":")[1]);
  const endMinutes =
    parseInt(end.split(":")[0]) * 60 + parseInt(end.split(":")[1]);
  return {
    gapId: gapId ?? `gap-${start.replace(":", "")}`,
    start,
    end,
    duration: endMinutes - startMinutes,
    locationLabel: undefined,
  };
}

// ============================================================================
// Unit Tests
// ============================================================================

describe("Suggestion Engine - Unit Tests", () => {
  describe("filterActiveMemos", () => {
    it("filters out completed memos", () => {
      const memos: Memo[] = [
        createTestMemo({
          title: "Active task",
          status: { timeSpentMinutes: 0, completionState: "not_started" },
        }),
        createTestMemo({
          title: "Completed task",
          status: { timeSpentMinutes: 60, completionState: "completed" },
        }),
        createTestMemo({
          title: "In progress task",
          status: { timeSpentMinutes: 30, completionState: "in_progress" },
        }),
      ];

      const active = filterActiveMemos(memos);
      expect(active).toHaveLength(2);
      expect(active.map((m) => m.title)).toContain("Active task");
      expect(active.map((m) => m.title)).toContain("In progress task");
      expect(active.map((m) => m.title)).not.toContain("Completed task");
    });
  });

  describe("memosToSuggestions", () => {
    it("converts memos to suggestions with need/importance scores", () => {
      const now = new Date();
      const memos: Memo[] = [
        createTestMemo({
          title: "Study Japanese",
          type: "バックログ",
          importance: "high",
          sessionDuration: 45,
        }),
      ];

      const suggestions = memosToSuggestions(memos, now);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].memoId).toBe(memos[0].id);
      expect(suggestions[0].need).toBeGreaterThan(0);
      expect(suggestions[0].importance).toBeGreaterThan(0);
      expect(suggestions[0].duration).toBe(45);
    });

    it("calculates high need for deadline tasks due soon", () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const memos: Memo[] = [
        createTestMemo({
          title: "Urgent deadline",
          type: "期限付き",
          deadline: tomorrow,
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Created 7 days ago
        }),
      ];

      const suggestions = memosToSuggestions(memos, now);
      expect(suggestions[0].need).toBeGreaterThanOrEqual(0.8);
    });

    it("marks tasks due today as mandatory (need >= 1.0)", () => {
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const memos: Memo[] = [
        createTestMemo({
          title: "Due today!",
          type: "期限付き",
          deadline: todayEnd,
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        }),
      ];

      const suggestions = memosToSuggestions(memos, now);
      expect(suggestions[0].need).toBeGreaterThanOrEqual(MANDATORY_THRESHOLD);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Suggestion Engine - Integration Tests", () => {
  let engine: ReturnType<typeof createEngine>;

  beforeEach(() => {
    engine = createEngine({ enableLLMEnrichment: false }); // Skip LLM for tests
    scheduleActions.clear();
  });

  it("generates a schedule from memos and gaps", async () => {
    const memos: Memo[] = [
      createTestMemo({
        title: "Exercise",
        type: "ルーティン",
        sessionDuration: 30,
        recurrenceGoal: { count: 3, period: "week" },
      }),
      createTestMemo({
        title: "Read book",
        type: "バックログ",
        sessionDuration: 45,
      }),
    ];

    const gaps: Gap[] = [
      createTestGap("09:00", "10:00"), // 60 min gap
      createTestGap("14:00", "15:00"), // 60 min gap
    ];

    const { schedule, summary } = await engine.generateSchedule(memos, gaps, {
      skipLLMEnrichment: true,
    });

    console.log("Schedule result:", {
      scheduled: schedule.scheduled.length,
      dropped: schedule.dropped.length,
      summary,
    });

    // Should schedule both tasks (they fit in the gaps)
    expect(schedule.scheduled.length).toBeGreaterThan(0);
    expect(summary.memosProcessed).toBe(2);
    expect(summary.activeMemos).toBe(2);
  });

  it("prioritizes mandatory tasks over optional ones", async () => {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const memos: Memo[] = [
      createTestMemo({
        title: "Optional backlog",
        type: "バックログ",
        sessionDuration: 30,
      }),
      createTestMemo({
        title: "Deadline today!",
        type: "期限付き",
        deadline: todayEnd,
        sessionDuration: 30,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      }),
    ];

    // Only one 30-min gap - should prioritize deadline
    const gaps: Gap[] = [createTestGap("09:00", "09:30")];

    const { schedule } = await engine.generateSchedule(memos, gaps, {
      skipLLMEnrichment: true,
    });

    console.log("Priority test:", {
      scheduled: schedule.scheduled.map((s) => s.memoId),
      memos: memos.map((m) => ({ id: m.id, title: m.title })),
    });

    // The mandatory task should be scheduled
    expect(schedule.scheduled.length).toBe(1);
    const scheduledMemo = memos.find(
      (m) => m.id === schedule.scheduled[0].memoId,
    );
    expect(scheduledMemo?.title).toBe("Deadline today!");
  });

  it("respects location preferences", async () => {
    const memos: Memo[] = [
      createTestMemo({
        title: "Home workout",
        type: "ルーティン",
        locationPreference: "home/near_home",
        sessionDuration: 30,
      }),
    ];

    // Gap is at workplace - home task shouldn't fit
    const gaps: Gap[] = [
      {
        gapId: "gap-work",
        start: "09:00",
        end: "10:00",
        duration: 60,
        locationLabel: "workplace",
      },
    ];

    const { schedule } = await engine.generateSchedule(memos, gaps, {
      skipLLMEnrichment: true,
    });

    // Home workout shouldn't be scheduled in workplace gap
    expect(schedule.scheduled.length).toBe(0);
    expect(schedule.dropped.length).toBe(1);
  });

  it("handles empty inputs gracefully", async () => {
    const { schedule } = await engine.generateSchedule([], [], {
      skipLLMEnrichment: true,
    });

    expect(schedule.scheduled).toEqual([]);
    expect(schedule.dropped).toEqual([]);
  });
});

// ============================================================================
// Store Tests
// ============================================================================

describe("Schedule Store", () => {
  beforeEach(() => {
    scheduleActions.clear();
  });

  it("starts with null schedule", () => {
    expect(get(scheduleResult)).toBeNull();
    expect(get(hasScheduledTasks)).toBe(false);
    expect(get(nextScheduledBlock)).toBeNull();
  });

  it("regenerate updates the store", async () => {
    const memos: Memo[] = [
      createTestMemo({
        title: "Test task",
        sessionDuration: 30,
      }),
    ];

    const gaps: Gap[] = [createTestGap("09:00", "10:00")];

    await scheduleActions.regenerate(memos, {
      gaps,
      skipLLMEnrichment: true,
    });

    const result = get(scheduleResult);
    expect(result).not.toBeNull();
    expect(get(hasScheduledTasks)).toBe(true);
    expect(get(nextScheduledBlock)).not.toBeNull();
  });

  it("clear resets the store", async () => {
    const memos: Memo[] = [createTestMemo({ title: "Test" })];
    const gaps: Gap[] = [createTestGap("09:00", "10:00")];

    await scheduleActions.regenerate(memos, { gaps, skipLLMEnrichment: true });
    expect(get(scheduleResult)).not.toBeNull();

    scheduleActions.clear();
    expect(get(scheduleResult)).toBeNull();
  });

  it("markSessionComplete updates memo status", () => {
    const memo = createTestMemo({
      title: "Task to complete",
      sessionDuration: 30,
      totalDurationExpected: 60,
    });

    const updated = scheduleActions.markSessionComplete(memo, 30);

    expect(updated.status.timeSpentMinutes).toBe(30);
    expect(updated.status.completionState).toBe("in_progress");
    expect(updated.lastActivity).toBeDefined();
  });
});
