// Suggestion service for gap time detection and proposal
import type { SuggestionLog, Gap, Event } from "../types.js";

// Temporary type (will be replaced in Phase 4)
interface SimpleSuggestion {
  id: string;
  template: string;
  gapMin: number;
  eventId?: string;
}
type Suggestion = SimpleSuggestion;
import { get } from "svelte/store";
import { suggestionLogs, suggestionLogOperations } from "../stores/data.js";
import { calendarEvents, calendarOccurrences } from "../stores/calendar.js";
import type { ExpandedOccurrence } from "../stores/calendar.js";

export class SuggestionService {
  private readonly GAP_THRESHOLD_MINUTES = 15; // Minimum gap to show suggestion
  private readonly suggestionTemplates = [
    "空き時間にメモを整理しませんか？",
    "次の予定の準備をしましょう",
    "少し休憩を取ってリフレッシュしましょう",
    "この時間でタスクを整理しましょう",
    "次の予定の資料を確認しましょう",
    "短時間でできる軽い運動をしましょう",
    "メールの整理をしましょう",
    "次の会議の準備をしましょう",
    "デスク周りを整理しましょう",
    "深呼吸してリラックスしましょう",
  ];

  // Duration-specific suggestion templates
  private readonly durationSpecificTemplates = {
    short: [
      // 15-30 minutes
      "短時間でできる軽い運動をしましょう",
      "メールの整理をしましょう",
      "深呼吸してリラックスしましょう",
      "デスク周りを整理しましょう",
    ],
    medium: [
      // 30-60 minutes
      "空き時間にメモを整理しませんか？",
      "次の予定の準備をしましょう",
      "この時間でタスクを整理しましょう",
      "次の会議の準備をしましょう",
    ],
    long: [
      // 60+ minutes
      "少し休憩を取ってリフレッシュしましょう",
      "次の予定の資料を確認しましょう",
      "集中して重要なタスクに取り組みましょう",
      "この時間を有効活用して学習しましょう",
    ],
  };

  /**
   * Generate suggestion for a specific gap
   */
  generateSuggestionForGap(gap: Gap): Suggestion | null {
    if (gap.duration < this.GAP_THRESHOLD_MINUTES) {
      return null; // Gap too small
    }

    // Select appropriate templates based on duration
    let templates: string[];
    if (gap.duration < 30) {
      templates = this.durationSpecificTemplates.short;
    } else if (gap.duration < 60) {
      templates = this.durationSpecificTemplates.medium;
    } else {
      templates = this.durationSpecificTemplates.long;
    }

    // Generate suggestion
    const randomTemplate =
      templates[Math.floor(Math.random() * templates.length)];

    return {
      id: crypto.randomUUID(),
      template: randomTemplate,
      gapMin: gap.duration,
      eventId: undefined, // Gap-specific suggestions don't have event context
    };
  }

  /**
   * Generate a new suggestion for the current context
   */
  generateNewSuggestion(): Suggestion | null {
    return this.checkForSuggestion();
  }

  /**
   * Check for gap time and generate suggestion if applicable
   */
  checkForSuggestion(currentTime: Date = new Date()): Suggestion | null {
    // Get master events and occurrences
    const masterEvents = get(calendarEvents);
    const occurrences = get(calendarOccurrences);

    // Combine regular events (non-recurring) with expanded occurrences
    const recurringEventIds = new Set(
      masterEvents
        .filter((e) => e.recurrence && e.recurrence.type !== "NONE")
        .map((e) => e.id),
    );

    // Convert occurrences to Event format
    const occurrenceEvents: Event[] = occurrences
      .filter((occ) => recurringEventIds.has(occ.masterEventId))
      .map((occ) => ({
        id: occ.id,
        title: occ.title,
        start: occ.start,
        end: occ.end,
        description: occ.description,
        address: occ.location,
        importance: occ.importance,
        timeLabel: occ.timeLabel as "all-day" | "timed" | "some-timing",
      }));

    // Combine all events
    const allEvents: Event[] = [
      ...masterEvents.filter(
        (e) => !e.recurrence || e.recurrence.type === "NONE",
      ),
      ...occurrenceEvents,
    ];

    // Sort by start time and find next event
    const futureEvents = allEvents
      .filter((event) => event.start > currentTime)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const nextEvent = futureEvents.length > 0 ? futureEvents[0] : null;

    let gapMinutes: number;
    let eventId: string | undefined;

    if (nextEvent) {
      // Calculate gap until next event
      gapMinutes =
        (nextEvent.start.getTime() - currentTime.getTime()) / (1000 * 60);
      eventId = nextEvent.id;
    } else {
      // No upcoming events - suggest for general free time
      // Assume user has free time for the next few hours
      gapMinutes = 120; // 2 hours of assumed free time
      eventId = undefined;
    }

    if (gapMinutes < this.GAP_THRESHOLD_MINUTES) {
      return null; // Gap too small
    }

    // Generate suggestion
    const randomTemplate =
      this.suggestionTemplates[
        Math.floor(Math.random() * this.suggestionTemplates.length)
      ];

    return {
      id: crypto.randomUUID(),
      template: randomTemplate,
      gapMin: Math.floor(gapMinutes),
      eventId,
    };
  }

  /**
   * Log user reaction to suggestion
   */
  logReaction(
    suggestion: Suggestion,
    reaction: SuggestionLog["reaction"],
  ): SuggestionLog {
    return suggestionLogOperations.create({
      at: new Date(),
      gapMin: suggestion.gapMin,
      eventId: suggestion.eventId,
      reaction,
    });
  }

  /**
   * Get suggestion logs for analysis
   */
  getLogs(): SuggestionLog[] {
    return get(suggestionLogs);
  }

  /**
   * Check if there's already a recent suggestion to avoid spam
   */
  hasRecentSuggestion(minutesAgo: number = 5): boolean {
    const recent = new Date(Date.now() - minutesAgo * 60 * 1000);
    const currentLogs = get(suggestionLogs);
    const recentLogs = currentLogs.filter((log) => log.at >= recent);
    return recentLogs.length > 0;
  }

  /**
   * Format gap time for display
   */
  formatGapTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}分`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}時間`;
    }

    return `${hours}時間${remainingMinutes}分`;
  }
}

export const suggestionService = new SuggestionService();
