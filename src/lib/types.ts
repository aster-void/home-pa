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
  start: Date;
  end: Date;
  description?: string;
  address?: string;
  importance?: "low" | "medium" | "high";
  timeLabel?: "all-day" | "some-timing"; // 終日 or どこかのタイミングで
  tzid?: string; // IANA timezone, defaults to system timezone
  recurrence?: Recurrence;
  rdateUtc?: Date[]; // Additional occurrence dates
  exdateUtc?: Date[]; // Excluded occurrence dates
}

export interface Memo {
  id: string;
  text: string;
}

export interface SuggestionLog {
  id: string;
  at: Date;
  gapMin: number;
  eventId?: string;
  reaction: "accepted" | "rejected" | "later";
}

export interface Suggestion {
  id: string;
  template: string;
  gapMin: number;
  eventId?: string;
}

export type ViewMode = "day" | "list";
export type ReactionType = "accepted" | "rejected" | "later";
