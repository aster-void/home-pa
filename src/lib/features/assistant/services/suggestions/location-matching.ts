/**
 * @fileoverview Location Matching Module
 *
 * Determines which suggestions can fit in which gaps based on:
 * 1. Location compatibility (where can the task be done?)
 * 2. Duration compatibility (does the task fit in the gap?)
 *
 * Compatibility Rules:
 * - "home/near_home"           → can use gaps labeled "home" or "unknown"
 * - "workplace/near_workplace" → can use gaps labeled "workplace" or "unknown"
 * - "no_preference"            → can use any gap
 *
 * Why "unknown" is allowed:
 * - Prevents tasks from being unschedulable when gap location is unclear
 * - Acts as a fallback for flexible scheduling
 */

import type {
  Gap,
  LocationLabel,
  LocationPreference,
  Suggestion,
} from "$lib/types.ts";

// ============================================================================
// TYPES
// ============================================================================

export interface CompatibilityResult {
  compatible: boolean;
  reason?: string;
}

// ============================================================================
// LOCATION COMPATIBILITY
// ============================================================================

/**
 * Location compatibility mapping
 * Maps each LocationPreference to the set of compatible LocationLabels
 */
const LOCATION_COMPATIBILITY: Record<
  LocationPreference,
  Set<LocationLabel | undefined>
> = {
  "home/near_home": new Set(["home", "unknown", undefined]),
  "workplace/near_workplace": new Set(["workplace", "unknown", undefined]),
  no_preference: new Set(["home", "workplace", "other", "unknown", undefined]),
};

/**
 * Check if a suggestion's location preference is compatible with a gap's location
 *
 * @param suggestionPreference - Where the task prefers to be done
 * @param gapLocation - Where the gap is located (or undefined if unknown)
 * @returns true if the suggestion can be scheduled in this gap based on location
 *
 * @example
 * isLocationCompatible("home/near_home", "home")      // true
 * isLocationCompatible("home/near_home", "workplace") // false
 * isLocationCompatible("home/near_home", "unknown")   // true (fallback)
 * isLocationCompatible("no_preference", "workplace")  // true (flexible)
 */
export function isLocationCompatible(
  suggestionPreference: LocationPreference,
  gapLocation: LocationLabel | undefined,
): boolean {
  const compatibleLocations = LOCATION_COMPATIBILITY[suggestionPreference];
  return compatibleLocations.has(gapLocation);
}

// ============================================================================
// DURATION COMPATIBILITY
// ============================================================================

/**
 * Check if a gap has sufficient duration for a suggestion
 *
 * @param gapDuration - Available time in the gap (minutes)
 * @param suggestionDuration - Required time for the suggestion (minutes)
 * @returns true if the suggestion fits in the gap
 */
export function hasSufficientDuration(
  gapDuration: number,
  suggestionDuration: number,
): boolean {
  return gapDuration >= suggestionDuration;
}

// ============================================================================
// COMBINED COMPATIBILITY
// ============================================================================

/**
 * Check if a suggestion can fit in a specific gap
 * Combines both location and duration checks
 *
 * @param suggestion - The suggestion to check
 * @param gap - The gap to check against
 * @returns CompatibilityResult with compatible flag and optional reason
 *
 * @example
 * const result = canFitInGap(suggestion, gap);
 * if (result.compatible) {
 *   // Schedule the suggestion in this gap
 * } else {
 *   console.log(result.reason); // "Insufficient duration" or "Location mismatch"
 * }
 */
export function canFitInGap(
  suggestion: Suggestion,
  gap: Gap,
): CompatibilityResult {
  // Check duration first (cheaper check)
  if (!hasSufficientDuration(gap.duration, suggestion.duration)) {
    return {
      compatible: false,
      reason: `Insufficient duration: gap has ${gap.duration}min, suggestion needs ${suggestion.duration}min`,
    };
  }

  // Check location compatibility
  if (!isLocationCompatible(suggestion.locationPreference, gap.locationLabel)) {
    return {
      compatible: false,
      reason: `Location mismatch: suggestion prefers "${suggestion.locationPreference}", gap is "${gap.locationLabel ?? "undefined"}"`,
    };
  }

  return { compatible: true };
}

/**
 * Simplified version of canFitInGap that returns boolean only
 * Use when you don't need the reason for incompatibility
 */
export function canFit(suggestion: Suggestion, gap: Gap): boolean {
  return canFitInGap(suggestion, gap).compatible;
}

// ============================================================================
// GAP FILTERING
// ============================================================================

/**
 * Find all gaps compatible with a suggestion
 * Returns gaps that match both location and duration requirements
 *
 * @param suggestion - The suggestion to find gaps for
 * @param gaps - Array of available gaps
 * @returns Array of compatible gaps (preserves original order)
 *
 * @example
 * const compatibleGaps = findCompatibleGaps(suggestion, allGaps);
 * if (compatibleGaps.length > 0) {
 *   // Use first gap (they're already time-sorted)
 *   scheduleIn(compatibleGaps[0]);
 * }
 */
export function findCompatibleGaps(suggestion: Suggestion, gaps: Gap[]): Gap[] {
  return gaps.filter((gap) => canFit(suggestion, gap));
}

/**
 * Find the first compatible gap for a suggestion
 * Useful for greedy scheduling where we take the first available slot
 *
 * @param suggestion - The suggestion to find a gap for
 * @param gaps - Array of available gaps (should be time-sorted)
 * @returns First compatible gap, or undefined if none found
 */
export function findFirstCompatibleGap(
  suggestion: Suggestion,
  gaps: Gap[],
): Gap | undefined {
  return gaps.find((gap) => canFit(suggestion, gap));
}

/**
 * Check if any compatible gap exists for a suggestion
 * Quick check without allocating a new array
 *
 * @param suggestion - The suggestion to check
 * @param gaps - Array of available gaps
 * @returns true if at least one compatible gap exists
 */
export function hasCompatibleGap(suggestion: Suggestion, gaps: Gap[]): boolean {
  return gaps.some((gap) => canFit(suggestion, gap));
}
