/**
 * Task Enrichment API Integration Tests
 *
 * Tests the integration between taskActions and the LLM enrichment API:
 * - Task creation triggers API enrichment
 * - Enrichment state tracking
 * - Fallback behavior when API fails
 * - Enriched fields are applied correctly
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import {
  tasks,
  taskActions,
  enrichingTaskIds,
  hasEnrichingTasks,
} from "../actions/taskActions.ts";
import { taskFormActions, taskForm } from "../forms/taskForm.ts";
import type { Memo } from "../../types.ts";

// Mock the API function
vi.mock("../../services/suggestions/llm-enrichment.js", () => {
  return {
    enrichMemoViaAPI: vi.fn(),
    getFallbackEnrichment: vi.fn((memo) => ({
      genre: "その他",
      importance: "medium",
      sessionDuration: 30,
      totalDurationExpected: 60,
    })),
  };
});

describe("Task Enrichment API Integration", () => {
  beforeEach(() => {
    tasks.set([]);
    taskFormActions.resetForm();
    vi.clearAllMocks();
  });

  it("should trigger API enrichment when creating a task", async () => {
    const { enrichMemoViaAPI } = await import(
      "../../services/suggestions/llm-enrichment.js"
    );

    const mockEnrichment = {
      genre: "勉強",
      importance: "high" as const,
      sessionDuration: 60,
      totalDurationExpected: 120,
    };

    (enrichMemoViaAPI as any).mockResolvedValueOnce(mockEnrichment);

    taskFormActions.updateField("title", "数学の勉強");
    taskFormActions.updateField("type", "期限付き");
    taskFormActions.updateField("deadline", "2025-12-31");

    const createdTask = await taskActions.create();

    expect(createdTask).not.toBeNull();
    expect(enrichMemoViaAPI).toHaveBeenCalled();

    // Wait for enrichment to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const allTasks = get(tasks);
    const enrichedTask = allTasks.find((t) => t.id === createdTask!.id);

    expect(enrichedTask).toBeDefined();
    expect(enrichedTask?.genre).toBe("勉強");
    expect(enrichedTask?.importance).toBe("high");
    expect(enrichedTask?.sessionDuration).toBe(60);
  });

  it("should track enriching state during API call", async () => {
    const { enrichMemoViaAPI } = await import(
      "../../services/suggestions/llm-enrichment.js"
    );

    // Create a promise that we can control
    let resolveEnrichment: (value: any) => void;
    const enrichmentPromise = new Promise((resolve) => {
      resolveEnrichment = resolve;
    });

    (enrichMemoViaAPI as any).mockReturnValueOnce(enrichmentPromise);

    taskFormActions.updateField("title", "Test task");
    const createPromise = taskActions.create();

    // Wait a bit for the enrichment to start
    await new Promise((resolve) => setTimeout(resolve, 10));

    const createdTask = await createPromise;

    // Check that task is marked as enriching
    expect(get(enrichingTaskIds).has(createdTask!.id)).toBe(true);
    expect(get(hasEnrichingTasks)).toBe(true);

    // Resolve the enrichment
    resolveEnrichment!({
      genre: "その他",
      importance: "medium" as const,
      sessionDuration: 30,
      totalDurationExpected: 60,
    });

    await enrichmentPromise;
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that enriching state is cleared
    expect(get(enrichingTaskIds).has(createdTask!.id)).toBe(false);
    expect(get(hasEnrichingTasks)).toBe(false);
  });

  it("should use fallback enrichment when API fails", async () => {
    const { enrichMemoViaAPI } = await import(
      "../../services/suggestions/llm-enrichment.js"
    );

    // Mock API to fail
    (enrichMemoViaAPI as any).mockRejectedValueOnce(new Error("Network error"));

    taskFormActions.updateField("title", "Test task");
    const createdTask = await taskActions.create();

    // Wait for enrichment attempt
    await new Promise((resolve) => setTimeout(resolve, 100));

    const allTasks = get(tasks);
    const task = allTasks.find((t) => t.id === createdTask!.id);

    // Task should still exist, but enrichment should have failed gracefully
    expect(task).toBeDefined();
    // Enriching state should be cleared even on error
    expect(get(enrichingTaskIds).has(createdTask!.id)).toBe(false);
  });

  it("should preserve existing fields when enriching", async () => {
    const { enrichMemoViaAPI } = await import(
      "../../services/suggestions/llm-enrichment.js"
    );

    const mockEnrichment = {
      genre: "勉強",
      importance: "high" as const,
      sessionDuration: 60,
      totalDurationExpected: 120,
    };

    (enrichMemoViaAPI as any).mockResolvedValueOnce(mockEnrichment);

    taskFormActions.updateField("title", "Test task");
    taskFormActions.updateField("type", "期限付き");
    taskFormActions.updateField("importance", "low"); // User-set importance

    // Verify form has the importance set
    const formBeforeCreate = get(taskForm);
    expect(formBeforeCreate.importance).toBe("low");

    const createdTask = await taskActions.create();

    // Check that task was created with user-set importance
    expect(createdTask?.importance).toBe("low");

    await new Promise((resolve) => setTimeout(resolve, 150));

    const allTasks = get(tasks);
    const enrichedTask = allTasks.find((t) => t.id === createdTask!.id);

    // User-set importance should be preserved (nullish coalescing)
    // Since user set it, it won't be overridden by enrichment
    expect(enrichedTask?.importance).toBe("low");
    // But other fields should be enriched
    expect(enrichedTask?.genre).toBe("勉強");
  });

  it("should handle multiple concurrent enrichments", async () => {
    const { enrichMemoViaAPI } = await import(
      "../../services/suggestions/llm-enrichment.js"
    );

    const mockEnrichment1 = {
      genre: "勉強",
      importance: "high" as const,
      sessionDuration: 60,
      totalDurationExpected: 120,
    };

    const mockEnrichment2 = {
      genre: "運動",
      importance: "medium" as const,
      sessionDuration: 45,
      totalDurationExpected: 90,
    };

    // Track calls by memo title to ensure correct enrichment is returned
    const enrichmentMap = new Map<string, any>();
    (enrichMemoViaAPI as any).mockImplementation((memo: any) => {
      // Use memo title to determine which enrichment to return
      if (memo.title === "Task 1") {
        enrichmentMap.set(memo.id, mockEnrichment1);
        return Promise.resolve(mockEnrichment1);
      } else if (memo.title === "Task 2") {
        enrichmentMap.set(memo.id, mockEnrichment2);
        return Promise.resolve(mockEnrichment2);
      }
      // Default fallback
      return Promise.resolve(mockEnrichment1);
    });

    // Create first task
    taskFormActions.updateField("title", "Task 1");
    const task1 = await taskActions.create();

    // Wait a bit to ensure first enrichment starts
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Create second task
    taskFormActions.updateField("title", "Task 2");
    const task2 = await taskActions.create();

    // Wait for both enrichments to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    const allTasks = get(tasks);
    const enrichedTask1 = allTasks.find((t) => t.id === task1!.id);
    const enrichedTask2 = allTasks.find((t) => t.id === task2!.id);

    expect(enrichedTask1?.genre).toBe("勉強");
    expect(enrichedTask2?.genre).toBe("運動");
    expect(get(enrichingTaskIds).size).toBe(0);
  });

  it("should handle task deletion gracefully during enrichment", async () => {
    const { enrichMemoViaAPI } = await import(
      "../../services/suggestions/llm-enrichment.js"
    );

    // Use a delayed enrichment to simulate real API call
    (enrichMemoViaAPI as any).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              genre: "その他",
              importance: "medium" as const,
              sessionDuration: 30,
              totalDurationExpected: 60,
            });
          }, 50);
        }),
    );

    taskFormActions.updateField("title", "Test task");
    const createdTask = await taskActions.create();

    // Delete task while enriching (enrichment is async)
    taskActions.delete(createdTask!.id);

    // Wait for enrichment to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Enriching state should be cleared (even if task was deleted)
    expect(get(enrichingTaskIds).size).toBe(0);
    // Task should be deleted
    expect(get(tasks).find((t) => t.id === createdTask!.id)).toBeUndefined();
  });
});
