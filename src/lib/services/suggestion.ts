// Suggestion service for gap time detection and proposal
import type { Event, Suggestion, SuggestionLog } from '../types.js';
import { events, suggestionLogs, suggestionLogOperations } from '../stores/data.js';

export class SuggestionService {
  private readonly GAP_THRESHOLD_MINUTES = 30; // Minimum gap to show suggestion
  private readonly suggestionTemplates = [
    "空き時間にメモを整理しませんか？",
    "次の予定の準備をしましょう",
    "少し休憩を取ってリフレッシュしましょう",
    "この時間でタスクを整理しましょう",
    "次の予定の資料を確認しましょう"
  ];

  /**
   * Check for gap time and generate suggestion if applicable
   */
  checkForSuggestion(currentTime: Date = new Date()): Suggestion | null {
    let nextEvent: Event | null = null;
    
    // Get current events from store
    events.subscribe(currentEvents => {
      const futureEvents = currentEvents.filter(event => event.start > currentTime);
      nextEvent = futureEvents.length > 0 ? futureEvents[0] : null;
    })();
    
    let gapMinutes: number;
    let eventId: string | undefined;

    if (nextEvent) {
      // Calculate gap until next event
      gapMinutes = (nextEvent.start.getTime() - currentTime.getTime()) / (1000 * 60);
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
    const randomTemplate = this.suggestionTemplates[
      Math.floor(Math.random() * this.suggestionTemplates.length)
    ];

    return {
      id: crypto.randomUUID(),
      template: randomTemplate,
      gapMin: Math.floor(gapMinutes),
      eventId
    };
  }

  /**
   * Log user reaction to suggestion
   */
  logReaction(suggestion: Suggestion, reaction: SuggestionLog['reaction']): SuggestionLog {
    return suggestionLogOperations.create({
      at: new Date(),
      gapMin: suggestion.gapMin,
      eventId: suggestion.eventId,
      reaction
    });
  }

  /**
   * Get suggestion logs for analysis
   */
  getLogs(): SuggestionLog[] {
    let logs: SuggestionLog[] = [];
    
    suggestionLogs.subscribe(currentLogs => {
      logs = currentLogs;
    })();
    
    return logs;
  }

  /**
   * Check if there's already a recent suggestion to avoid spam
   */
  hasRecentSuggestion(minutesAgo: number = 10): boolean {
    const recent = new Date(Date.now() - minutesAgo * 60 * 1000);
    let hasRecent = false;
    
    suggestionLogs.subscribe(currentLogs => {
      const recentLogs = currentLogs.filter(log => log.at >= recent);
      hasRecent = recentLogs.length > 0;
    })();
    
    return hasRecent;
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
