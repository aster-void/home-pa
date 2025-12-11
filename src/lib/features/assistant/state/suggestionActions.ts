/**
 * @fileoverview Suggestion Actions
 *
 * Contains all business logic and operations for the suggestion system.
 * This includes checking for suggestions, logging reactions, and managing suggestion state.
 *
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { dataState } from "../../../bootstrap/data.svelte.ts";
import { uiState } from "../../../bootstrap/ui.svelte.ts";
import { gaps } from "./gaps.ts";
import { suggestionService } from "../services/suggestion.ts";
import type { Gap, SuggestionLog } from "../../../types.ts";

/**
 * Suggestion Actions
 * Functions that handle suggestion business logic and operations
 */
export const suggestionActions = {
  /**
   * Check for new suggestions
   */
  checkForSuggestion(): void {
    if (suggestionService.hasRecentSuggestion()) {
      return;
    }

    const suggestion = suggestionService.checkForSuggestion();
    uiState.setCurrentSuggestion(suggestion);
  },

  /**
   * Generate suggestion for a specific gap
   */
  generateSuggestionForGap(gap: Gap): void {
    const suggestion = suggestionService.generateSuggestionForGap(gap);
    uiState.setCurrentSuggestion(suggestion);
  },

  /**
   * Generate a new suggestion for the current context
   */
  generateNewSuggestion(): void {
    const suggestion = suggestionService.generateNewSuggestion();
    uiState.setCurrentSuggestion(suggestion);
  },

  /**
   * React to a suggestion
   */
  reactToSuggestion(reaction: "accepted" | "rejected" | "later"): void {
    const active = uiState.currentSuggestion;
    if (!active) return;

    // Type guard to ensure active is a valid SimpleSuggestion
    if (
      typeof active === "object" &&
      active !== null &&
      "id" in active &&
      "template" in active &&
      "gapMin" in active
    ) {
      // Log the reaction
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

    // Clear the current suggestion
    uiState.clearCurrentSuggestion();
  },

  /**
   * Accept a suggestion
   */
  acceptSuggestion(): void {
    this.reactToSuggestion("accepted");
  },

  /**
   * Reject a suggestion
   */
  rejectSuggestion(): void {
    this.reactToSuggestion("rejected");
  },

  /**
   * Mark suggestion for later
   */
  markSuggestionForLater(): void {
    this.reactToSuggestion("later");
  },

  /**
   * Dismiss the current suggestion
   */
  dismissSuggestion(): void {
    uiState.clearCurrentSuggestion();
  },

  /**
   * Check if there's a recent suggestion
   */
  hasRecentSuggestion(): boolean {
    return suggestionService.hasRecentSuggestion();
  },

  /**
   * Get suggestion statistics
   */
  getSuggestionStats(): {
    total: number;
    accepted: number;
    rejected: number;
    later: number;
    acceptanceRate: number;
  } {
    const logs: SuggestionLog[] = dataState.suggestionLogs;

    const total = logs.length;
    const accepted = logs.filter((log) => log.reaction === "accepted").length;
    const rejected = logs.filter((log) => log.reaction === "rejected").length;
    const later = logs.filter((log) => log.reaction === "later").length;
    const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

    return {
      total,
      accepted,
      rejected,
      later,
      acceptanceRate,
    };
  },

  /**
   * Clear all suggestion logs
   */
  clearSuggestionLogs(): void {
    // Clear the current suggestion
    uiState.clearCurrentSuggestion();
  },

  /**
   * Force check for suggestions (ignore recent suggestion check)
   */
  forceCheckForSuggestion(): void {
    const suggestion = suggestionService.checkForSuggestion();
    uiState.setCurrentSuggestion(suggestion);
  },

  /**
   * Initialize reactive suggestion checks based on gaps and selected date changes
   */
  initializeReactive(): void {
    // Fire immediately on init
    this.checkForSuggestion();

    // React to gap changes using store subscription
    gaps.subscribe(() => {
      this.checkForSuggestion();
    });
  },
};
