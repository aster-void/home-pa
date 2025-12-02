// Main application controller using Svelte stores
import type { Event, ViewMode } from "../types.js";

// Temporary types (will be replaced in Phase 4)
interface SimpleMemo { id: string; text: string; }
interface SimpleSuggestion { id: string; template: string; gapMin: number; eventId?: string; }
type Memo = SimpleMemo;
type Suggestion = SimpleSuggestion;
import { writable, type Writable, get } from "svelte/store";
import {
  eventOperations,
  memoOperations,
  suggestionLogOperations,
  selectedDate,
} from "../stores/data.js";
import { suggestionService } from "../services/suggestion.js";
import { 
  utcToLocalDateTimeString,
  createAllDayUTCRange,
  createMultiDayAllDayUTCRange,
  localDateTimeToUTC
} from "../utils/date-utils.js";

// Form interfaces moved to dedicated form stores

export class AppController {
  // State using Svelte stores
  currentView: Writable<"calendar" | "personal-assistant"> =
    writable("calendar");
  viewMode: Writable<ViewMode> = writable("day");
  currentSuggestion: Writable<Suggestion | null> = writable(null);
  isMemoOpen: Writable<boolean> = writable(false);

  // Form states moved to dedicated form stores

  // Store operations (components will access stores directly)
  getEvents() {
    return eventOperations;
  }

  getMemos() {
    return memoOperations;
  }

  getSuggestionLogs() {
    return suggestionLogOperations;
  }

  // Methods
  setView(view: "calendar" | "personal-assistant"): void {
    this.currentView.set(view);

    // Check for suggestions when returning to calendar
    if (view === "calendar") {
      if (suggestionService.hasRecentSuggestion()) {
        return;
      }

      const suggestion = suggestionService.checkForSuggestion();
      this.currentSuggestion.set(suggestion);
    }
  }

  toggleMemo(): void {
    this.isMemoOpen.update((open) => !open);
  }

  setMemoOpen(open: boolean): void {
    this.isMemoOpen.set(open);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  setSelectedDate(date: Date): void {
    // Use the store from data.js instead
    selectedDate.set(date);
  }

  // Event management moved to eventActions





  // Memo management moved to memoActions

  // Suggestion management moved to suggestionActions

  // Utility methods moved to utility functions

  constructor() {
    selectedDate.set(new Date());
    this.initialize();
  }

  // Initialize app
  initialize(): void {
    // Check for initial suggestion
    if (suggestionService.hasRecentSuggestion()) {
      return;
    }

    const suggestion = suggestionService.checkForSuggestion();
    this.currentSuggestion.set(suggestion);
  }
}
