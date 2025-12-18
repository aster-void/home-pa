/**
 * @fileoverview UI Actions
 *
 * Contains initialization and business logic for UI state.
 * Navigation is handled via SvelteKit path-based routing.
 */

import { dataState } from "./data.svelte.ts";
import { uiState } from "./ui.svelte.ts";
import { suggestionService } from "../features/assistant/services/suggestion.ts";

export const uiActions = {
  setViewMode(mode: "day" | "list"): void {
    uiState.setViewMode(mode);
  },

  setSelectedDate(date: Date): void {
    dataState.setSelectedDate(date);
  },

  navigateDate(days: number): void {
    const currentDate = new Date(dataState.selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    this.setSelectedDate(newDate);
  },

  navigateToToday(): void {
    this.setSelectedDate(new Date());
  },

  checkForSuggestion(): void {
    if (suggestionService.hasRecentSuggestion()) {
      return;
    }
    const suggestion = suggestionService.checkForSuggestion();
    uiState.setCurrentSuggestion(suggestion);
  },

  reactToSuggestion(reaction: "accepted" | "rejected" | "later"): void {
    const active = uiState.currentSuggestion;
    if (!active) return;
    if (
      typeof active === "object" &&
      active !== null &&
      "id" in active &&
      "template" in active &&
      "gapMin" in active
    ) {
      suggestionService.logReaction(
        active as {
          id: string;
          template: string;
          gapMin: number;
          eventId?: string;
        },
        reaction,
      );
    }
    uiState.clearCurrentSuggestion();
  },

  dismissSuggestion(): void {
    uiState.clearCurrentSuggestion();
  },

  setLoading(loading: boolean): void {
    uiState.setLoading(loading);
  },

  setError(message: string | null): void {
    uiState.setError(message);
  },

  clearError(): void {
    uiState.clearError();
  },

  initialize(): void {
    this.setSelectedDate(new Date());
    this.checkForSuggestion();
  },
};
