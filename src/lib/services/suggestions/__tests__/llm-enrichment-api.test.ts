/**
 * Client-Side LLM Enrichment API Tests
 *
 * Tests the enrichMemoViaAPI function:
 * - Successful API calls
 * - Network error handling
 * - Invalid response handling
 * - Fallback behavior
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { enrichMemoViaAPI, getFallbackEnrichment } from "../llm-enrichment.ts";
import type { Memo } from "../../../types.ts";

describe("enrichMemoViaAPI", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock before each test - ensure it's a fresh mock function
    if (typeof global !== "undefined") {
      (global as any).fetch = vi.fn();
    }
    if (typeof window !== "undefined") {
      (window as any).fetch = vi.fn();
    }
  });

  it("should successfully enrich a memo via API", async () => {
    const mockEnrichment = {
      genre: "勉強",
      importance: "high" as const,
      sessionDuration: 60,
      totalDurationExpected: 120,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEnrichment,
    });

    const memo = createTestMemo();
    const result = await enrichMemoViaAPI(memo);

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalled();

    // In test environment, URL will be absolute
    const expectedUrl =
      typeof window === "undefined"
        ? "http://localhost:3000/api/enrich"
        : "/api/enrich";
    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toBe(expectedUrl);
    expect(fetchCall[1].method).toBe("POST");
    expect(fetchCall[1].headers["Content-Type"]).toBe("application/json");
    expect(fetchCall[1].body).toContain(memo.id);

    expect(result).toEqual(mockEnrichment);
    expect(result.genre).toBe("勉強");
    expect(result.importance).toBe("high");
    expect(result.sessionDuration).toBe(60);
  });

  it("should use fallback when API returns error status", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const memo = createTestMemo();
    const result = await enrichMemoViaAPI(memo);

    expect(result).toBeDefined();
    const fallback = getFallbackEnrichment(memo);
    expect(result).toEqual(fallback);
    expect(result.genre).toBe(fallback.genre);
    expect(result.importance).toBe(fallback.importance);
  });

  it("should use fallback on network error", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const memo = createTestMemo();
    const result = await enrichMemoViaAPI(memo);

    expect(result).toBeDefined();
    const fallback = getFallbackEnrichment(memo);
    expect(result).toEqual(fallback);
    expect(result.genre).toBe(fallback.genre);
  });

  it("should use fallback when response has invalid format", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        // Missing required fields
        genre: "勉強",
      }),
    });

    const memo = createTestMemo();
    const result = await enrichMemoViaAPI(memo);

    const fallback = getFallbackEnrichment(memo);
    expect(result).toEqual(fallback);
  });

  it("should send correct memo data in request body", async () => {
    const mockEnrichment = {
      genre: "その他",
      importance: "medium" as const,
      sessionDuration: 30,
      totalDurationExpected: 60,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEnrichment,
    });

    const memo = createTestMemo({
      deadline: new Date("2025-12-31"),
      genre: "仕事",
      importance: "high",
    });

    await enrichMemoViaAPI(memo);

    const callArgs = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);

    expect(requestBody.id).toBe(memo.id);
    expect(requestBody.title).toBe(memo.title);
    expect(requestBody.type).toBe(memo.type);
    expect(requestBody.deadline).toBe(memo.deadline?.toISOString());
    expect(requestBody.genre).toBe(memo.genre);
    expect(requestBody.importance).toBe(memo.importance);
  });

  it("should handle 400 error gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    const memo = createTestMemo();
    const result = await enrichMemoViaAPI(memo);

    const fallback = getFallbackEnrichment(memo);
    expect(result).toEqual(fallback);
  });

  it("should handle JSON parse errors in error response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => {
        throw new Error("Cannot read text");
      },
    });

    const memo = createTestMemo();
    const result = await enrichMemoViaAPI(memo);

    const fallback = getFallbackEnrichment(memo);
    expect(result).toEqual(fallback);
  });
});
