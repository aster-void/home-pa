/**
 * LLM Enrichment Remote Function
 *
 * Remote function for enriching memos with LLM-suggested fields.
 * Runs on server, callable from client with type safety.
 */

import { command } from "$app/server";
import * as v from "valibot";
import { env } from "$env/dynamic/private";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildPrompt,
  parseResponse,
  getFallbackEnrichment,
} from "./llm-enrichment.ts";
import type { Memo } from "$lib/types.ts";

const EnrichInputSchema = v.object({
  id: v.string(),
  title: v.string(),
  type: v.picklist(["期限付き", "バックログ", "ルーティン"]),
  createdAt: v.string(),
  deadline: v.optional(v.string()),
  locationPreference: v.optional(
    v.picklist(["home/near_home", "workplace/near_workplace", "no_preference"]),
  ),
  status: v.optional(
    v.object({
      timeSpentMinutes: v.number(),
      completionState: v.picklist(["not_started", "in_progress", "completed"]),
      completionsThisPeriod: v.optional(v.number()),
      periodStartDate: v.optional(v.string()),
    }),
  ),
  genre: v.optional(v.string()),
  importance: v.optional(v.picklist(["low", "medium", "high"])),
  sessionDuration: v.optional(v.number()),
  totalDurationExpected: v.optional(v.number()),
});

export const enrichMemo = command(
  EnrichInputSchema,
  async (
    input,
  ): Promise<{
    genre: string;
    importance: "low" | "medium" | "high";
    sessionDuration: number;
    totalDurationExpected: number;
  }> => {
    // Build memo object
    const memo: Memo = {
      id: input.id,
      title: input.title,
      type: input.type,
      createdAt: new Date(input.createdAt),
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      locationPreference: input.locationPreference || "no_preference",
      status: input.status
        ? {
            timeSpentMinutes: input.status.timeSpentMinutes,
            completionState: input.status.completionState,
            completionsThisPeriod: input.status.completionsThisPeriod,
            periodStartDate: input.status.periodStartDate
              ? new Date(input.status.periodStartDate)
              : undefined,
          }
        : {
            timeSpentMinutes: 0,
            completionState: "not_started",
            completionsThisPeriod: 0,
            periodStartDate: new Date(),
          },
      genre: input.genre,
      importance: input.importance,
      sessionDuration: input.sessionDuration,
      totalDurationExpected: input.totalDurationExpected,
    };

    // Check API key
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        "[LLM Enrichment Remote] API key not configured, using fallback",
      );
      return getFallbackEnrichment(memo);
    }

    // Call Gemini
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });

      const prompt = buildPrompt(memo);
      console.log("[LLM Enrichment Remote] Calling Gemini for memo:", memo.id);

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      console.log("[LLM Enrichment Remote] Gemini response received");

      const enrichment = parseResponse(text);

      if (!enrichment) {
        console.warn(
          "[LLM Enrichment Remote] Failed to parse response, using fallback",
        );
        return getFallbackEnrichment(memo);
      }

      return enrichment;
    } catch (apiError) {
      console.error("[LLM Enrichment Remote] Gemini API error:", apiError);
      return getFallbackEnrichment(memo);
    }
  },
);
