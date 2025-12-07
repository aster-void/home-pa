// Core data models for M1 specification

// Recurrence types for recurring events
export interface RecurrenceRuleRFC {
  rrule: string;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  until?: Date | null;
  count?: number | null;
}

export interface WeeklyBitmaskRule {
  type: "WEEKLY_BITMASK";
  anchorLocalStartISO: string;
  intervalWeeks: number;
  daysBitmask: number;
  until?: Date | null;
  count?: number | null;
}

export type Recurrence =
  | { type: "NONE" }
  | ({ type: "RRULE" } & RecurrenceRuleRFC)
  | WeeklyBitmaskRule;

export interface Event {
  id: string;
  title: string;
  // For timed events: actual start/end times
  // For all-day/some-timing events: date only (start = end = date at 00:00 UTC)
  start: Date;
  end: Date;
  description?: string;
  address?: string;
  importance?: "low" | "medium" | "high";
  timeLabel: "all-day" | "some-timing" | "timed"; // Event timing type
  tzid?: string; // IANA timezone, defaults to system timezone
  recurrence?: Recurrence;
  rdateUtc?: Date[]; // Additional occurrence dates
  exdateUtc?: Date[]; // Excluded occurrence dates

  // New sliding window fields
  recurrenceGroupId?: string; // Links events across time windows
  isDuplicate?: boolean; // True for auto-generated duplicates
  originalEventId?: string; // Reference to original event for duplicates
  isForever?: boolean; // True for events with no end date
  icalData?: string; // Raw iCalendar VEVENT component string for recurrence expansion
}

// ============================================================================
// MEMO SYSTEM TYPES (Suggestion Engine)
// ============================================================================

/**
 * Recurrence goal for routine tasks
 * e.g., { count: 3, period: "week" } = "3 times per week"
 */
export interface RecurrenceGoal {
  count: number;
  period: "day" | "week" | "month";
}

/**
 * Memo completion and progress status
 */
export interface MemoStatus {
  timeSpentMinutes: number; // Total time user has spent on this memo
  completionState: "not_started" | "in_progress" | "completed";
  // For ルーティン tracking:
  completionsThisPeriod?: number; // Resets when period changes (new day/week/month)
  periodStartDate?: Date; // When current tracking period started
}

/**
 * Location preference for where a memo/task can be done
 */
export type LocationPreference =
  | "home/near_home"
  | "workplace/near_workplace"
  | "no_preference";

/**
 * Location label for gaps (derived from surrounding events)
 */
export type LocationLabel = "home" | "workplace" | "other" | "unknown";

/**
 * Importance level for memos
 */
export type ImportanceLevel = "low" | "medium" | "high";

/**
 * Memo type classification
 */
export type MemoType = "期限付き" | "バックログ" | "ルーティン";

/**
 * Rich memo structure for task-oriented suggestions
 * Replaces the old simple { id, text } Memo
 */
export interface Memo {
  id: string;
  title: string;
  genre?: string; // System/LLM-filled (e.g., "勉強", "運動", "家事")
  type: MemoType;
  createdAt: Date; // When the memo was created (for need gradient)
  deadline?: Date; // Required for 期限付き type
  recurrenceGoal?: RecurrenceGoal; // For ルーティン, structured goal
  locationPreference: LocationPreference;
  status: MemoStatus;
  sessionDuration?: number; // 1回のセッションの時間 (minutes) - LLM-suggested
  totalDurationExpected?: number; // Total expected time (minutes) - LLM-suggested
  lastActivity?: Date;
  importance?: ImportanceLevel; // LLM-suggested if not provided
}

export interface SuggestionLog {
  id: string;
  at: Date;
  gapMin: number;
  eventId?: string;
  reaction: "accepted" | "rejected" | "later";
}

/**
 * Suggestion output from scoring system
 * Used by scheduler to assign tasks to gaps
 */
export interface Suggestion {
  id: string;
  memoId: string; // Reference to source memo
  need: number; // 0.0–1.0+ (≥1.0 = mandatory)
  importance: number; // 0.0–1.0
  duration: number; // Minutes for this session
  locationPreference: LocationPreference;
}

/**
 * Gap interface representing free time slots
 * Used by scheduler to match suggestions to available time
 */
export interface Gap {
  gapId: string; // Unique identifier for scheduling reference
  start: string; // HH:mm format
  end: string; // HH:mm format
  duration: number; // in minutes
  locationLabel?: LocationLabel; // Derived from surrounding events (Phase 2)
}

export type ViewMode = "day" | "list";
export type ReactionType = "accepted" | "rejected" | "later";
