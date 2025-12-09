/**
 * LLM Enrichment API Endpoint
 *
 * POST /api/enrich - Enrich a memo with LLM-suggested fields
 *
 * Body: { id, title, type, deadline? }
 * Returns: EnrichmentResult { genre, importance, sessionDuration, totalDurationExpected }
 *
 * Security: API key stays on server, never exposed to client
 */

import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { GEMINI_API_KEY } from "$env/static/private";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildPrompt,
  parseResponse,
  getFallbackEnrichment,
} from "$lib/services/suggestions/llm-enrichment.js";
import type { Memo } from "$lib/types.js";

/**
 * POST /api/enrich
 *
 * Enriches a memo with LLM-suggested fields (genre, importance, durations)
 * Falls back to rule-based enrichment if API key not configured or API fails
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  // Auth check (optional - enrichment can work without auth, but good practice)
  // Note: We allow unauthenticated requests for now, but could add auth later
  // if (!locals.user?.id) {
  //   throw error(401, 'Unauthorized');
  // }

  try {
    // 1. Parse memo from request
    const body = await request.json();

    // Validate required fields
    if (!body.id || !body.title || !body.type) {
      throw error(400, "Missing required fields: id, title, type");
    }

    // Build memo object for enrichment
    const memo: Memo = {
      id: body.id,
      title: body.title,
      type: body.type,
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      locationPreference: body.locationPreference || "no_preference",
      status: body.status || {
        timeSpentMinutes: 0,
        completionState: "not_started",
        completionsThisPeriod: 0,
        periodStartDate: new Date(),
      },
      genre: body.genre,
      importance: body.importance,
      sessionDuration: body.sessionDuration,
      totalDurationExpected: body.totalDurationExpected,
    };

    // 2. Check API key
    if (!GEMINI_API_KEY) {
      console.warn(
        "[LLM Enrichment API] API key not configured, using fallback",
      );
      const fallback = getFallbackEnrichment(memo);
      return json(fallback);
    }

    // 3. Call Gemini
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      // Use Flash-Lite for cost efficiency (most cost-effective model)
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });

      const prompt = buildPrompt(memo);
      console.log("[LLM Enrichment API] Calling Gemini for memo:", memo.id);

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      console.log("[LLM Enrichment API] Gemini response received");

      // 4. Parse and return
      const enrichment = parseResponse(text);

      if (!enrichment) {
        console.warn(
          "[LLM Enrichment API] Failed to parse response, using fallback",
        );
        return json(getFallbackEnrichment(memo));
      }

      return json(enrichment);
    } catch (apiError) {
      // Handle Gemini API errors gracefully
      console.error("[LLM Enrichment API] Gemini API error:", apiError);

      // Return fallback instead of erroring out
      const fallback = getFallbackEnrichment(memo);
      return json(fallback);
    }
  } catch (err) {
    // Handle request parsing errors
    if (err instanceof Response) {
      throw err; // Re-throw SvelteKit error responses
    }

    console.error("[LLM Enrichment API] Error:", err);
    throw error(500, "Failed to enrich memo");
  }
};
