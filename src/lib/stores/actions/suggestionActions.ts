/**
 * @fileoverview Suggestion Actions
 * 
 * Contains all business logic and operations for the suggestion system.
 * This includes checking for suggestions, logging reactions, and managing suggestion state.
 * 
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { get } from 'svelte/store';
import { suggestionLogOperations, suggestionLogs, selectedDate } from '../data.js';
import { uiActions, currentSuggestion } from '../ui.js';
import { gaps } from '../gaps.js';
import { suggestionService } from '../../services/suggestion.js';
import type { Gap } from '../../types.js';

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
    uiActions.setCurrentSuggestion(suggestion);
  },

  /**
   * Generate suggestion for a specific gap
   */
  generateSuggestionForGap(gap: Gap): void {
    const suggestion = suggestionService.generateSuggestionForGap(gap);
    uiActions.setCurrentSuggestion(suggestion);
  },

  /**
   * Generate a new suggestion for the current context
   */
  generateNewSuggestion(): void {
    const suggestion = suggestionService.generateNewSuggestion();
    uiActions.setCurrentSuggestion(suggestion);
  },

  /**
   * React to a suggestion
   */
  reactToSuggestion(reaction: "accepted" | "rejected" | "later"): void {
    const active = get(currentSuggestion);
    if (!active) return;

    // Log the reaction
    suggestionService.logReaction(active, reaction);
    
    // Clear the current suggestion
    uiActions.clearCurrentSuggestion();
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
    uiActions.clearCurrentSuggestion();
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
    const logs = get(suggestionLogs) as any[];
    
    const total = logs.length;
    const accepted = logs.filter(log => log.reaction === "accepted").length;
    const rejected = logs.filter(log => log.reaction === "rejected").length;
    const later = logs.filter(log => log.reaction === "later").length;
    const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

    return {
      total,
      accepted,
      rejected,
      later,
      acceptanceRate
    };
  },

  /**
   * Clear all suggestion logs
   */
  clearSuggestionLogs(): void {
    // This would need to be implemented in the suggestionLogOperations
    // For now, we'll just clear the current suggestion
    uiActions.clearCurrentSuggestion();
  },

  /**
   * Force check for suggestions (ignore recent suggestion check)
   */
  forceCheckForSuggestion(): void {
    const suggestion = suggestionService.checkForSuggestion();
    uiActions.setCurrentSuggestion(suggestion);
  },

  /**
   * Initialize reactive suggestion checks based on gaps and selected date changes
   */
  initializeReactive(): void {
    // Fire immediately on init
    this.checkForSuggestion();

    // React to gap changes
    gaps.subscribe(() => {
      this.checkForSuggestion();
    });

    // React to date changes
    selectedDate.subscribe(() => {
      this.checkForSuggestion();
    });
  }
};
