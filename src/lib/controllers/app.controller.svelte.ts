// Main application controller using Svelte stores
import type { ViewMode } from "../types.ts";

// Temporary types (will be replaced in Phase 4)
interface SimpleSuggestion {
  id: string;
  template: string;
  gapMin: number;
  eventId?: string;
}
type Suggestion = SimpleSuggestion;
import { writable, type Writable } from "svelte/store";
import { dataState, calendarState } from "../state/index.svelte.ts";
import { suggestionService } from "../services/suggestion.ts";

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
    // Events are now managed via calendarState
    return calendarState;
  }

  getMemos() {
    return dataState;
  }

  getSuggestionLogs() {
    return dataState;
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
    dataState.setSelectedDate(date);
  }

  // Event management moved to eventActions

  // Memo management moved to memoActions

  // Suggestion management moved to suggestionActions

  // Utility methods moved to utility functions

  constructor() {
    dataState.setSelectedDate(new Date());
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
