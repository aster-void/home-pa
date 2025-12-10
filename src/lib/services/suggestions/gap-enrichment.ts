/**
 * @fileoverview Gap Enrichment Module
 *
 * Derives location labels for gaps based on surrounding calendar events.
 * This module is separate from gap-finder for maintainability and testability.
 *
 * @author Personal Assistant Team
 * @version 1.0.0
 */

import type { Gap, LocationLabel } from "../../types.ts";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Event with optional location for enrichment purposes
 * Extends gap-finder Event with location data
 */
export interface EnrichableEvent {
  id: string;
  title: string;
  start: string; // HH:mm format
  end: string; // HH:mm format
  locationLabel?: LocationLabel;
}

/**
 * Configuration for gap enrichment behavior
 * Easy to modify defaults without changing core logic
 */
export interface EnrichmentConfig {
  /** Default location when no context is available */
  defaultLocation: LocationLabel;
  /** Time before which to assume "home" (HH:mm format) */
  morningHomeThreshold: string;
  /** Time after which to assume "home" (HH:mm format) */
  eveningHomeThreshold: string;
}

/** Default configuration - easy to modify */
const DEFAULT_CONFIG: EnrichmentConfig = {
  defaultLocation: "unknown",
  morningHomeThreshold: "10:00",
  eveningHomeThreshold: "18:00",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Find the event that ends closest to (but before) the gap start
 *
 * If multiple events end at the same time (ambiguous), returns null
 * to avoid guessing - the gap will use fallback logic instead.
 *
 * @returns The preceding event, or null if none found or ambiguous
 */
export function findPrecedingEvent(
  gapStartMinutes: number,
  events: EnrichableEvent[],
): EnrichableEvent | null {
  let closest: EnrichableEvent | null = null;
  let closestEndMinutes = -Infinity;
  let isAmbiguous = false;

  for (const event of events) {
    const eventEndMinutes = timeToMinutes(event.end);

    // Event must end at or before gap starts
    if (eventEndMinutes <= gapStartMinutes) {
      if (eventEndMinutes > closestEndMinutes) {
        // This event ends later (closer to gap) - pick it
        closest = event;
        closestEndMinutes = eventEndMinutes;
        isAmbiguous = false;
      } else if (eventEndMinutes === closestEndMinutes) {
        // Multiple events end at same time - ambiguous
        isAmbiguous = true;
      }
    }
  }

  // If ambiguous, return null to use fallback logic
  return isAmbiguous ? null : closest;
}

/**
 * Find the event that starts closest to (but after) the gap end
 *
 * If multiple events start at the same time (ambiguous), returns null
 * to avoid guessing - the gap will use fallback logic instead.
 *
 * @returns The following event, or null if none found or ambiguous
 */
export function findFollowingEvent(
  gapEndMinutes: number,
  events: EnrichableEvent[],
): EnrichableEvent | null {
  let closest: EnrichableEvent | null = null;
  let closestStartMinutes = Infinity;
  let isAmbiguous = false;

  for (const event of events) {
    const eventStartMinutes = timeToMinutes(event.start);

    // Event must start at or after gap ends
    if (eventStartMinutes >= gapEndMinutes) {
      if (eventStartMinutes < closestStartMinutes) {
        // This event starts earlier (closer to gap) - pick it
        closest = event;
        closestStartMinutes = eventStartMinutes;
        isAmbiguous = false;
      } else if (eventStartMinutes === closestStartMinutes) {
        // Multiple events start at same time - ambiguous
        isAmbiguous = true;
      }
    }
  }

  // If ambiguous, return null to use fallback logic
  return isAmbiguous ? null : closest;
}

/**
 * Derive location label for a single gap based on surrounding events
 *
 * Priority:
 * 1. Preceding event's location (user is likely still there)
 * 2. Following event's location (if preceding unknown)
 * 3. Time-based default (morning/evening = home)
 * 4. Config default (unknown)
 */
export function deriveLocationLabel(
  gap: Gap,
  events: EnrichableEvent[],
  config: EnrichmentConfig = DEFAULT_CONFIG,
): LocationLabel {
  const gapStartMinutes = timeToMinutes(gap.start);
  const gapEndMinutes = timeToMinutes(gap.end);

  // 1. Check preceding event
  const preceding = findPrecedingEvent(gapStartMinutes, events);
  if (preceding?.locationLabel) {
    return preceding.locationLabel;
  }

  // 2. Check following event
  const following = findFollowingEvent(gapEndMinutes, events);
  if (following?.locationLabel) {
    return following.locationLabel;
  }

  // 3. Time-based defaults
  const morningThreshold = timeToMinutes(config.morningHomeThreshold);
  const eveningThreshold = timeToMinutes(config.eveningHomeThreshold);

  if (gapStartMinutes < morningThreshold) {
    // Early morning gap → assume home
    return "home";
  }

  if (gapStartMinutes >= eveningThreshold) {
    // Evening gap → assume home
    return "home";
  }

  // 4. Default
  return config.defaultLocation;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

/**
 * Enrich gaps with location labels based on surrounding events
 *
 * @param gaps - Gaps to enrich (from GapFinder)
 * @param events - Events with optional location labels
 * @param config - Optional configuration overrides
 * @returns New array of gaps with locationLabel set
 */
export function enrichGapsWithLocation(
  gaps: Gap[],
  events: EnrichableEvent[],
  config: EnrichmentConfig = DEFAULT_CONFIG,
): Gap[] {
  return gaps.map((gap) => ({
    ...gap,
    locationLabel: deriveLocationLabel(gap, events, config),
  }));
}

// Re-export DEFAULT_CONFIG for convenience
export { DEFAULT_CONFIG };
