/**
 * Server-Side LLM Enrichment API Tests
 *
 * Note: Full endpoint testing requires SvelteKit's test utilities or integration tests.
 * These tests verify the core logic and error handling patterns.
 *
 * For full endpoint testing, consider using:
 * - SvelteKit's test utilities
 * - Integration tests with a test server
 * - Manual testing via the actual API
 */

import { describe, it, expect, vi } from "vitest";
import {
  buildPrompt,
  parseResponse,
  getFallbackEnrichment,
} from "$lib/services/suggestions/llm-enrichment.js";
import type { Memo } from "$lib/types.js";

describe("Enrichment API Logic", () => {
  const createTestMemo = (overrides?: Partial<Memo>): Memo => ({
    id: "test-id",
    title: "数学の勉強",
    type: "期限付き",
    createdAt: new Date(),
    locationPreference: "no_preference",
    status: {
      timeSpentMinutes: 0,
      completionState: "not_started",
      completionsThisPeriod: 0,
      periodStartDate: new Date(),
    },
    ...overrides,
  });

  it("should build valid prompts for memos", () => {
    const memo = createTestMemo({
      title: "Test task",
      type: "期限付き",
      deadline: new Date("2025-12-31"),
    });

    const prompt = buildPrompt(memo);
    expect(prompt).toContain("Test task");
    expect(prompt).toContain("期限付き");
    expect(prompt).toContain("2025-12-31");
  });

  it("should parse valid LLM responses", () => {
    const validResponse = JSON.stringify({
      genre: "勉強",
      importance: "high",
      sessionDuration: 60,
      totalDurationExpected: 120,
    });

    const result = parseResponse(validResponse);
    expect(result).not.toBeNull();
    expect(result?.genre).toBe("勉強");
    expect(result?.importance).toBe("high");
    expect(result?.sessionDuration).toBe(60);
  });

  it("should parse responses with markdown code blocks", () => {
    const responseWithMarkdown =
      "```json\n" +
      JSON.stringify({
        genre: "運動",
        importance: "medium",
        sessionDuration: 45,
        totalDurationExpected: 90,
      }) +
      "\n```";

    const result = parseResponse(responseWithMarkdown);
    expect(result).not.toBeNull();
    expect(result?.genre).toBe("運動");
  });

  it("should return fallback for invalid responses", () => {
    const invalidResponse = "not json";
    const result = parseResponse(invalidResponse);
    expect(result).toBeNull();
  });

  it("should provide sensible fallback enrichment", () => {
    const memo = createTestMemo({ type: "期限付き" });
    const fallback = getFallbackEnrichment(memo);

    expect(fallback.genre).toBeDefined();
    expect(fallback.importance).toBe("medium");
    expect(fallback.sessionDuration).toBeGreaterThan(0);
    expect(fallback.totalDurationExpected).toBeGreaterThan(0);
  });

  it("should validate and sanitize parsed responses", () => {
    const invalidResponse = JSON.stringify({
      genre: "invalid-genre",
      importance: "invalid",
      sessionDuration: 200, // Too high
      totalDurationExpected: 50, // Less than sessionDuration
    });

    const result = parseResponse(invalidResponse);
    expect(result).not.toBeNull();
    // Should sanitize to valid values
    expect(result?.genre).toBe("その他");
    expect(result?.importance).toBe("medium");
    expect(result?.sessionDuration).toBeLessThanOrEqual(120);
    expect(result?.totalDurationExpected).toBeGreaterThanOrEqual(
      result!.sessionDuration,
    );
  });
});
