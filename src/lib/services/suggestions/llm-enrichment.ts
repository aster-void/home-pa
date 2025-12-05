/**
 * LLM Enrichment Module
 *
 * Uses Gemini to auto-fill optional memo fields:
 * - genre (task category)
 * - importance
 * - sessionDuration
 * - totalDurationExpected
 *
 * Gracefully falls back to defaults if:
 * - API key not configured
 * - SDK not installed
 * - API call fails
 */

import type { Memo, ImportanceLevel, MemoType } from "../../types.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Fields that LLM enrichment provides
 */
export interface EnrichmentResult {
  genre: string;
  importance: ImportanceLevel;
  sessionDuration: number; // minutes
  totalDurationExpected: number; // minutes
}

/**
 * Configuration for LLM enrichment
 */
export interface LLMEnrichmentConfig {
  /** Gemini API key (if not set, uses fallback) */
  apiKey?: string;
  /** Model to use (default: gemini-2.5-flash-lite - most cost-effective) */
  model?: string;
  /** Max concurrent requests (default: 2) */
  maxConcurrent?: number;
  /** Delay between requests in ms (default: 500) */
  requestDelayMs?: number;
  /** Enable caching (default: true) */
  enableCache?: boolean;
}

/**
 * Raw response from LLM (before validation)
 */
interface RawLLMResponse {
  genre?: string;
  importance?: string;
  sessionDuration?: number;
  totalDurationExpected?: number;
}

// ============================================================================
// Constants
// ============================================================================

const VALID_GENRES = [
  "勉強",
  "運動",
  "家事",
  "仕事",
  "趣味",
  "その他",
] as const;
const VALID_IMPORTANCE: ImportanceLevel[] = ["low", "medium", "high"];

const DEFAULT_CONFIG: Required<LLMEnrichmentConfig> = {
  apiKey: "",
  model: "gemini-2.5-flash-lite", // Most cost-effective model
  maxConcurrent: 2,
  requestDelayMs: 500,
  enableCache: true,
};

// Simple in-memory cache (memo.id -> EnrichmentResult)
const enrichmentCache = new Map<string, EnrichmentResult>();

// ============================================================================
// Fallback Logic
// ============================================================================

/**
 * Get fallback enrichment values when LLM is unavailable
 * Uses sensible defaults based on memo type
 */
export function getFallbackEnrichment(memo: Memo): EnrichmentResult {
  // Base defaults
  const base: EnrichmentResult = {
    genre: "その他",
    importance: "medium",
    sessionDuration: 30,
    totalDurationExpected: 60,
  };

  // Adjust based on memo type
  switch (memo.type) {
    case "期限付き":
      // Deadlines: assume moderate effort, slightly higher importance
      base.importance = "medium";
      base.sessionDuration = 45;
      base.totalDurationExpected = 90;
      break;

    case "ルーティン":
      // Routines: shorter sessions, less total time
      base.sessionDuration = 30;
      base.totalDurationExpected = 30; // Each session is the "total"
      break;

    case "バックログ":
      // Backlogs: standard defaults
      base.sessionDuration = 30;
      base.totalDurationExpected = 60;
      break;
  }

  // Try to infer genre from title keywords
  const title = memo.title.toLowerCase();
  if (
    title.includes("勉強") ||
    title.includes("study") ||
    title.includes("読書") ||
    title.includes("learn")
  ) {
    base.genre = "勉強";
  } else if (
    title.includes("運動") ||
    title.includes("exercise") ||
    title.includes("ジム") ||
    title.includes("散歩")
  ) {
    base.genre = "運動";
  } else if (
    title.includes("掃除") ||
    title.includes("洗濯") ||
    title.includes("料理") ||
    title.includes("家事")
  ) {
    base.genre = "家事";
  } else if (
    title.includes("仕事") ||
    title.includes("work") ||
    title.includes("会議") ||
    title.includes("メール")
  ) {
    base.genre = "仕事";
  }

  return base;
}

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Build the prompt for Gemini
 */
export function buildPrompt(memo: Memo): string {
  const deadlineInfo = memo.deadline
    ? `Deadline: ${memo.deadline.toISOString().split("T")[0]}`
    : "No deadline";

  return `You are a task planning assistant. Given a task, estimate the following properties.

Task: "${memo.title}"
Type: ${memo.type}
${deadlineInfo}

Please estimate:
1. Genre (category): one of [勉強, 運動, 家事, 仕事, 趣味, その他]
2. Importance: "low", "medium", or "high"
3. Session duration: recommended minutes per session (15-120)
4. Total duration: estimated total minutes to complete the task

Respond with ONLY valid JSON in this exact format, no other text:
{
  "genre": "string",
  "importance": "low|medium|high",
  "sessionDuration": number,
  "totalDurationExpected": number
}`;
}

// ============================================================================
// Response Parsing
// ============================================================================

/**
 * Parse and validate LLM response
 * Returns null if parsing fails
 */
export function parseResponse(responseText: string): EnrichmentResult | null {
  try {
    // Try to extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText.trim();

    // Remove markdown code block if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed: RawLLMResponse = JSON.parse(jsonStr);

    // Validate and sanitize each field
    const genre =
      parsed.genre &&
      VALID_GENRES.includes(parsed.genre as (typeof VALID_GENRES)[number])
        ? parsed.genre
        : "その他";

    const importance: ImportanceLevel =
      parsed.importance &&
      VALID_IMPORTANCE.includes(parsed.importance as ImportanceLevel)
        ? (parsed.importance as ImportanceLevel)
        : "medium";

    const sessionDuration =
      typeof parsed.sessionDuration === "number"
        ? Math.min(120, Math.max(15, parsed.sessionDuration))
        : 30;

    const totalDurationExpected =
      typeof parsed.totalDurationExpected === "number"
        ? Math.max(sessionDuration, parsed.totalDurationExpected)
        : sessionDuration * 2;

    return {
      genre,
      importance,
      sessionDuration,
      totalDurationExpected,
    };
  } catch (error) {
    console.warn("[LLM Enrichment] Failed to parse response:", error);
    return null;
  }
}

// ============================================================================
// Gemini Integration
// ============================================================================

/**
 * Safely get environment variable (works in both Node.js and browser)
 * In browser, process.env doesn't exist, so we return undefined
 */
function getEnvVar(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return undefined;
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(config: LLMEnrichmentConfig): boolean {
  const apiKey = config.apiKey || getEnvVar("GEMINI_API_KEY");
  return !!apiKey && apiKey.length > 0;
}

/**
 * Call Gemini API to get enrichment
 * Uses dynamic import to avoid crashes if SDK not installed
 */
async function callGemini(
  memo: Memo,
  config: Required<LLMEnrichmentConfig>,
): Promise<EnrichmentResult | null> {
  const apiKey = config.apiKey || getEnvVar("GEMINI_API_KEY");

  if (!apiKey) {
    console.log("[LLM Enrichment] No API key found");
    return null;
  }

  try {
    // Dynamic import to avoid crash if SDK not installed
    console.log("[LLM Enrichment] Loading @google/generative-ai SDK...");
    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: config.model });
    console.log(`[LLM Enrichment] Using model: ${config.model}`);

    const prompt = buildPrompt(memo);
    console.log("[LLM Enrichment] Sending prompt to Gemini...");

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("[LLM Enrichment] Raw response:", text);

    return parseResponse(text);
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Cannot find module")) {
        console.warn(
          "[LLM Enrichment] @google/generative-ai not installed. Run: bun add @google/generative-ai",
        );
      } else if (error.message.includes("API_KEY")) {
        console.warn("[LLM Enrichment] Invalid or missing API key");
      } else {
        console.warn("[LLM Enrichment] Gemini API error:", error.message);
      }
    }
    return null;
  }
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Enrich a single memo with LLM-suggested values
 *
 * Priority:
 * 1. Return cached result if available
 * 2. Try LLM enrichment if configured
 * 3. Fall back to rule-based defaults
 *
 * The returned memo has optional fields filled in.
 * Original values are NOT overwritten.
 */
export async function enrichMemo(
  memo: Memo,
  config: Partial<LLMEnrichmentConfig> = {},
): Promise<Memo> {
  const fullConfig: Required<LLMEnrichmentConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  console.log(`[LLM Enrichment] Processing memo: "${memo.title}" (${memo.id})`);

  // Check cache first
  if (fullConfig.enableCache && enrichmentCache.has(memo.id)) {
    const cached = enrichmentCache.get(memo.id)!;
    console.log(`[LLM Enrichment] ✓ Cache hit`, cached);
    return applyEnrichment(memo, cached);
  }

  // Try LLM if configured
  let enrichment: EnrichmentResult | null = null;
  let source: "llm" | "fallback" = "fallback";

  if (isGeminiConfigured(fullConfig)) {
    console.log(`[LLM Enrichment] Calling Gemini API...`);
    enrichment = await callGemini(memo, fullConfig);
    if (enrichment) {
      source = "llm";
      console.log(`[LLM Enrichment] ✓ Gemini response:`, enrichment);
    } else {
      console.log(`[LLM Enrichment] ✗ Gemini failed, using fallback`);
    }
  } else {
    console.log(
      `[LLM Enrichment] Gemini not configured (no API key), using fallback`,
    );
  }

  // Use fallback if LLM failed or unavailable
  if (!enrichment) {
    enrichment = getFallbackEnrichment(memo);
    console.log(`[LLM Enrichment] Fallback result:`, enrichment);
  }

  // Cache the result
  if (fullConfig.enableCache) {
    enrichmentCache.set(memo.id, enrichment);
    console.log(`[LLM Enrichment] Cached (source: ${source})`);
  }

  return applyEnrichment(memo, enrichment);
}

/**
 * Apply enrichment to memo, respecting existing values
 */
function applyEnrichment(memo: Memo, enrichment: EnrichmentResult): Memo {
  return {
    ...memo,
    // Only fill if not already set
    genre: memo.genre ?? enrichment.genre,
    importance: memo.importance ?? enrichment.importance,
    sessionDuration: memo.sessionDuration ?? enrichment.sessionDuration,
    totalDurationExpected:
      memo.totalDurationExpected ?? enrichment.totalDurationExpected,
  };
}

/**
 * Enrich multiple memos with rate limiting
 *
 * Processes memos sequentially with delay to respect API quotas.
 * Uses simple sequential processing (no external queue library needed).
 */
export async function enrichMemos(
  memos: Memo[],
  config: Partial<LLMEnrichmentConfig> = {},
): Promise<Memo[]> {
  const fullConfig: Required<LLMEnrichmentConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  const results: Memo[] = [];

  console.log(
    `[LLM Enrichment] === Batch enrichment started: ${memos.length} memos ===`,
  );
  console.log(
    `[LLM Enrichment] Gemini configured: ${isGeminiConfigured(fullConfig)}`,
  );

  for (let i = 0; i < memos.length; i++) {
    const memo = memos[i];
    console.log(`[LLM Enrichment] Processing ${i + 1}/${memos.length}...`);

    // Check if cached (no delay needed)
    if (fullConfig.enableCache && enrichmentCache.has(memo.id)) {
      const cached = enrichmentCache.get(memo.id)!;
      console.log(`[LLM Enrichment] ✓ Cache hit for "${memo.title}"`);
      results.push(applyEnrichment(memo, cached));
      continue;
    }

    // Enrich with delay
    const enriched = await enrichMemo(memo, fullConfig);
    results.push(enriched);

    // Add delay between API calls (not after last one)
    if (i < memos.length - 1 && isGeminiConfigured(fullConfig)) {
      console.log(
        `[LLM Enrichment] Waiting ${fullConfig.requestDelayMs}ms before next request...`,
      );
      await sleep(fullConfig.requestDelayMs);
    }
  }

  console.log(`[LLM Enrichment] === Batch enrichment complete ===`);
  return results;
}

/**
 * Clear the enrichment cache
 * Useful for testing or when memos are updated
 */
export function clearEnrichmentCache(): void {
  enrichmentCache.clear();
}

/**
 * Remove a specific memo from cache
 */
export function invalidateCacheEntry(memoId: string): void {
  enrichmentCache.delete(memoId);
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: enrichmentCache.size,
    entries: Array.from(enrichmentCache.keys()),
  };
}

// ============================================================================
// Client-Side API Integration
// ============================================================================

/**
 * Enrich a memo via the server-side API endpoint
 * 
 * This is the browser-safe way to enrich memos. The API key stays on the server.
 * Falls back to rule-based enrichment if the API is unavailable.
 * 
 * @param memo - Memo to enrich
 * @returns EnrichmentResult with suggested fields
 */
export async function enrichMemoViaAPI(memo: Memo): Promise<EnrichmentResult> {
  try {
    // Use absolute URL if available (for SSR/test environments), otherwise relative
    const baseUrl = typeof window !== "undefined" ? "" : "http://localhost:3000";
    const url = `${baseUrl}/api/enrich`;
    
    // Use global fetch (works in both browser and Node.js test environments)
    const fetchFn = typeof global !== "undefined" && (global as any).fetch ? (global as any).fetch : fetch;
    const response = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: memo.id,
        title: memo.title,
        type: memo.type,
        deadline: memo.deadline?.toISOString(),
        createdAt: memo.createdAt.toISOString(),
        locationPreference: memo.locationPreference,
        status: memo.status,
        // Include existing values so server can respect them
        genre: memo.genre,
        importance: memo.importance,
        sessionDuration: memo.sessionDuration,
        totalDurationExpected: memo.totalDurationExpected,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.warn(
        `[LLM Enrichment] API error (${response.status}): ${errorText}, using fallback`
      );
      return getFallbackEnrichment(memo);
    }

    const enrichment = await response.json();
    
    // Validate response structure
    if (
      typeof enrichment.genre === "string" &&
      typeof enrichment.importance === "string" &&
      typeof enrichment.sessionDuration === "number" &&
      typeof enrichment.totalDurationExpected === "number"
    ) {
      return enrichment as EnrichmentResult;
    } else {
      console.warn("[LLM Enrichment] Invalid API response format, using fallback");
      return getFallbackEnrichment(memo);
    }
  } catch (error) {
    console.warn("[LLM Enrichment] Network error, using fallback:", error);
    return getFallbackEnrichment(memo);
  }
}

// ============================================================================
// Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
