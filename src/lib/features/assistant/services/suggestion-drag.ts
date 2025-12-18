/**
 * Suggestion Drag Logic Service
 *
 * Handles constraint calculation and gap snapping for dragging suggestions
 * on the circular timeline.
 *
 * Key concepts:
 * - Midpoint-based dragging: User drags the center of a suggestion
 * - Gap constraints: Suggestions must stay within valid gaps
 * - Cross-gap snapping: When dragged past gap boundary, snap to next valid gap
 * - Duration extension: Symmetric-first, then one-sided
 */

import type { Gap } from "$lib/types.ts";

// ============================================================================
// Types
// ============================================================================

/**
 * Constraints for dragging within a single gap
 */
export interface DragConstraints {
  /** Minimum midpoint position (minutes from midnight) */
  minMidpoint: number;
  /** Maximum midpoint position (minutes from midnight) */
  maxMidpoint: number;
  /** The gap these constraints apply to */
  currentGap: Gap;
}

/**
 * Result of snapping to a gap
 */
export interface SnapResult {
  /** New start time in HH:mm format */
  newStartTime: string;
  /** New end time in HH:mm format */
  newEndTime: string;
  /** The gap the suggestion snapped to */
  targetGap: Gap;
  /** Whether the suggestion jumped to a different gap */
  snapped: boolean;
}

/**
 * Result of duration extension calculation
 */
export interface ExtensionResult {
  /** New duration in minutes */
  newDuration: number;
  /** New start time in HH:mm format */
  newStartTime: string;
  /** New end time in HH:mm format */
  newEndTime: string;
  /** Maximum allowed duration given constraints */
  maxAllowedDuration: number;
  /** Whether extension is blocked */
  blocked: boolean;
  /** Reason if blocked */
  blockReason?: string;
}

/**
 * A time range blocker (event or accepted suggestion)
 */
export interface TimeBlocker {
  startMinutes: number;
  endMinutes: number;
}

// ============================================================================
// Time Utilities
// ============================================================================

/**
 * Convert HH:mm time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:mm time string
 */
export function minutesToTime(minutes: number): string {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440; // Handle negative and >24h
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = Math.floor(normalizedMinutes % 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Calculate midpoint of a time range in minutes
 */
export function calculateMidpoint(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return Math.floor((start + end) / 2);
}

// ============================================================================
// Constraint Calculation
// ============================================================================

/**
 * Calculate the valid midpoint range for a suggestion within a gap
 *
 * For a suggestion with duration D in a gap [G_start, G_end]:
 * - Min midpoint = G_start + D/2 (so start doesn't go before gap)
 * - Max midpoint = G_end - D/2 (so end doesn't go past gap)
 *
 * @param gap - The gap to constrain within
 * @param duration - Duration of the suggestion in minutes
 * @returns Constraints for the midpoint
 */
export function calculateMidpointBounds(
  gap: Gap,
  duration: number,
): DragConstraints {
  const gapStart = timeToMinutes(gap.start);
  const gapEnd = timeToMinutes(gap.end);
  const halfDuration = Math.ceil(duration / 2);

  return {
    minMidpoint: Math.max(gapStart + halfDuration, gapStart),
    maxMidpoint: Math.min(gapEnd - halfDuration, gapEnd),
    currentGap: gap,
  };
}

/**
 * Clamp a midpoint within the constraints
 */
export function clampMidpoint(
  midpoint: number,
  constraints: DragConstraints,
): number {
  return Math.max(
    constraints.minMidpoint,
    Math.min(constraints.maxMidpoint, midpoint),
  );
}

/**
 * Check if a suggestion with given duration can fit in a gap
 */
export function canFitInGap(gap: Gap, duration: number): boolean {
  return gap.duration >= duration;
}

// ============================================================================
// Gap Snapping
// ============================================================================

/**
 * Find the best gap for a given midpoint position
 *
 * When the user drags past the current gap boundary, this finds the
 * next valid gap and snaps to its center.
 *
 * @param midpointMinutes - Target midpoint in minutes from midnight
 * @param duration - Duration of the suggestion
 * @param gaps - Available gaps sorted by start time
 * @param currentGapId - ID of the gap the suggestion is currently in
 * @returns Snap result with new position and target gap
 */
export function snapToGap(
  midpointMinutes: number,
  duration: number,
  gaps: Gap[],
  currentGapId?: string,
): SnapResult | null {
  if (gaps.length === 0) return null;

  // Sort gaps by start time
  const sortedGaps = [...gaps].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
  );

  // Filter to gaps that can fit the duration
  const validGaps = sortedGaps.filter((g) => canFitInGap(g, duration));
  if (validGaps.length === 0) return null;

  // Find the gap that contains the midpoint, or the closest one
  let targetGap: Gap | null = null;
  let snapped = false;

  for (const gap of validGaps) {
    const gapStart = timeToMinutes(gap.start);
    const gapEnd = timeToMinutes(gap.end);

    // Check if midpoint is within this gap's valid range
    const constraints = calculateMidpointBounds(gap, duration);
    if (
      midpointMinutes >= constraints.minMidpoint &&
      midpointMinutes <= constraints.maxMidpoint
    ) {
      targetGap = gap;
      snapped = gap.gapId !== currentGapId;
      break;
    }

    // Check if midpoint is before this gap
    if (midpointMinutes < gapStart) {
      // Snap to the start of this gap
      targetGap = gap;
      snapped = true;
      break;
    }

    // If midpoint is past this gap, continue to next
    if (midpointMinutes > gapEnd) {
      // Keep this as candidate in case it's the last valid gap
      targetGap = gap;
      snapped = gap.gapId !== currentGapId;
    }
  }

  if (!targetGap) {
    // Default to last valid gap
    targetGap = validGaps[validGaps.length - 1];
    snapped = targetGap.gapId !== currentGapId;
  }

  // Calculate position within the target gap
  const constraints = calculateMidpointBounds(targetGap, duration);
  const clampedMidpoint = clampMidpoint(midpointMinutes, constraints);
  const halfDuration = Math.ceil(duration / 2);

  return {
    newStartTime: minutesToTime(clampedMidpoint - halfDuration),
    newEndTime: minutesToTime(clampedMidpoint + (duration - halfDuration)),
    targetGap,
    snapped,
  };
}

/**
 * Find the next gap in a given direction
 *
 * @param currentGapId - Current gap ID
 * @param gaps - Available gaps
 * @param direction - 'forward' or 'backward'
 * @param duration - Duration needed
 * @returns Next valid gap or null
 */
export function findNextGap(
  currentGapId: string,
  gaps: Gap[],
  direction: "forward" | "backward",
  duration: number,
): Gap | null {
  const sortedGaps = [...gaps].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
  );

  const currentIndex = sortedGaps.findIndex((g) => g.gapId === currentGapId);
  if (currentIndex === -1) return null;

  const searchGaps =
    direction === "forward"
      ? sortedGaps.slice(currentIndex + 1)
      : sortedGaps.slice(0, currentIndex).reverse();

  return searchGaps.find((g) => canFitInGap(g, duration)) ?? null;
}

// ============================================================================
// Duration Extension
// ============================================================================

/**
 * Calculate symmetric duration extension
 *
 * Tries to extend equally in both directions from the midpoint.
 * If symmetric extension isn't possible, extends in one direction.
 *
 * @param currentMidpoint - Current midpoint in minutes
 * @param currentDuration - Current duration in minutes
 * @param targetDuration - Desired duration in minutes
 * @param gapStart - Gap start in minutes
 * @param gapEnd - Gap end in minutes
 * @param blockers - Other time blockers (accepted suggestions, events)
 * @returns Extension result
 */
export function calculateExtension(
  currentMidpoint: number,
  currentDuration: number,
  targetDuration: number,
  gapStart: number,
  gapEnd: number,
  blockers: TimeBlocker[] = [],
): ExtensionResult {
  // Sort blockers
  const sortedBlockers = [...blockers].sort(
    (a, b) => a.startMinutes - b.startMinutes,
  );

  // Find constraints from blockers
  let maxStartBound = gapStart;
  let maxEndBound = gapEnd;

  for (const blocker of sortedBlockers) {
    // Blocker before midpoint - constrains how far back we can extend
    if (blocker.endMinutes <= currentMidpoint) {
      maxStartBound = Math.max(maxStartBound, blocker.endMinutes);
    }
    // Blocker after midpoint - constrains how far forward we can extend
    if (blocker.startMinutes >= currentMidpoint) {
      maxEndBound = Math.min(maxEndBound, blocker.startMinutes);
      break; // No need to check further blockers
    }
  }

  // Calculate available space in each direction
  const availableBackward = currentMidpoint - maxStartBound;
  const availableForward = maxEndBound - currentMidpoint;
  const maxPossibleDuration = availableBackward + availableForward;

  // Clamp target duration
  const clampedTarget = Math.min(targetDuration, maxPossibleDuration);

  if (clampedTarget <= currentDuration) {
    // Shrinking - always allowed
    const halfDuration = Math.ceil(clampedTarget / 2);
    return {
      newDuration: clampedTarget,
      newStartTime: minutesToTime(currentMidpoint - halfDuration),
      newEndTime: minutesToTime(
        currentMidpoint + (clampedTarget - halfDuration),
      ),
      maxAllowedDuration: maxPossibleDuration,
      blocked: false,
    };
  }

  // Try symmetric extension first
  const halfTarget = Math.ceil(clampedTarget / 2);
  const canExtendSymmetric =
    availableBackward >= halfTarget && availableForward >= halfTarget;

  let newStart: number;
  let newEnd: number;

  if (canExtendSymmetric) {
    // Symmetric extension
    newStart = currentMidpoint - halfTarget;
    newEnd = currentMidpoint + (clampedTarget - halfTarget);
  } else {
    // Asymmetric extension - extend more in the direction with room
    if (availableBackward > availableForward) {
      // Extend more backward
      newEnd = Math.min(currentMidpoint + availableForward, maxEndBound);
      newStart = newEnd - clampedTarget;
    } else {
      // Extend more forward
      newStart = Math.max(currentMidpoint - availableBackward, maxStartBound);
      newEnd = newStart + clampedTarget;
    }
  }

  // Final clamp to gap boundaries
  newStart = Math.max(newStart, gapStart);
  newEnd = Math.min(newEnd, gapEnd);
  const actualDuration = newEnd - newStart;

  return {
    newDuration: actualDuration,
    newStartTime: minutesToTime(newStart),
    newEndTime: minutesToTime(newEnd),
    maxAllowedDuration: maxPossibleDuration,
    blocked:
      actualDuration < targetDuration && actualDuration === currentDuration,
    blockReason:
      actualDuration < targetDuration
        ? `Limited by ${availableBackward < availableForward ? "previous" : "next"} block`
        : undefined,
  };
}

/**
 * Get blockers from accepted suggestions
 */
export function getBlockersFromAccepted(
  accepted: Array<{ startTime: string; endTime: string; suggestionId: string }>,
  excludeId?: string,
): TimeBlocker[] {
  return accepted
    .filter((a) => a.suggestionId !== excludeId)
    .map((a) => ({
      startMinutes: timeToMinutes(a.startTime),
      endMinutes: timeToMinutes(a.endTime),
    }));
}

// ============================================================================
// Angle/Time Conversion for Circular Timeline
// ============================================================================

const TWO_PI = Math.PI * 2;
const MINUTES_PER_DAY = 24 * 60;

/**
 * Convert an angle (radians, 0 at top) to minutes since midnight
 */
export function angleToMinutes(angle: number): number {
  // Normalize angle to [0, 2π)
  const normalizedAngle = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
  // Convert to minutes (0 radians = 00:00, 2π = 24:00)
  return Math.round((normalizedAngle / TWO_PI) * MINUTES_PER_DAY);
}

/**
 * Convert minutes since midnight to angle (radians, 0 at top)
 */
export function minutesToAngle(minutes: number): number {
  return (minutes / MINUTES_PER_DAY) * TWO_PI;
}

/**
 * Convert SVG coordinates to angle
 * Assumes SVG viewBox centered at (50, 50)
 */
export function svgCoordsToAngle(
  x: number,
  y: number,
  centerX = 50,
  centerY = 50,
): number {
  // Calculate angle from center, with 0 at top (12 o'clock)
  const dx = x - centerX;
  const dy = y - centerY;
  // atan2 gives angle from positive x-axis, counterclockwise
  // We want angle from top (negative y-axis), clockwise
  let angle = Math.atan2(dx, -dy);
  // Normalize to [0, 2π)
  if (angle < 0) angle += TWO_PI;
  return angle;
}

/**
 * Convert client coordinates to SVG coordinates
 */
export function clientToSvgCoords(
  clientX: number,
  clientY: number,
  svgElement: SVGSVGElement,
): { x: number; y: number } {
  const rect = svgElement.getBoundingClientRect();
  const viewBox = svgElement.viewBox.baseVal;

  const scaleX = viewBox.width / rect.width;
  const scaleY = viewBox.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX + viewBox.x,
    y: (clientY - rect.top) * scaleY + viewBox.y,
  };
}
