/**
 * @fileoverview UI Actions
 *
 * Contains all business logic and operations for UI state management.
 * This includes navigation, view switching, and UI state coordination.
 *
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { dataState } from "./data.svelte.ts";
import { uiState, type AppView } from "./ui.svelte.ts";
import { suggestionService } from "../features/assistant/services/suggestion.ts";

/**
 * UI Actions
 * Functions that handle UI business logic and operations
 */
export const uiActions = {
  /**
   * Switch between calendar, personal assistant, tasks, and utilities views
   */
  setView(view: AppView): void {
    uiState.setView(view);

    // Check for suggestions when returning to calendar
    if (view === "calendar") {
      this.checkForSuggestion();
    }
  },

  /**
   * Change the calendar view mode
   */
  setViewMode(mode: "day" | "list"): void {
    uiState.setViewMode(mode);
  },

  /**
   * Toggle the memo panel open/closed
   */
  toggleMemo(): void {
    uiState.toggleMemo();
  },

  /**
   * Set the memo panel state
   */
  setMemoOpen(open: boolean): void {
    uiState.setMemoOpen(open);
  },

  /**
   * Navigate to a specific date
   */
  setSelectedDate(date: Date): void {
    dataState.setSelectedDate(date);
  },

  /**
   * Navigate date by a number of days
   */
  navigateDate(days: number): void {
    const currentDate = new Date(dataState.selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    this.setSelectedDate(newDate);
  },

  /**
   * Navigate to today
   */
  navigateToToday(): void {
    this.setSelectedDate(new Date());
  },

  /**
   * Navigate to previous day
   */
  navigateToPreviousDay(): void {
    this.navigateDate(-1);
  },

  /**
   * Navigate to next day
   */
  navigateToNextDay(): void {
    this.navigateDate(1);
  },

  /**
   * Navigate to previous week
   */
  navigateToPreviousWeek(): void {
    this.navigateDate(-7);
  },

  /**
   * Navigate to next week
   */
  navigateToNextWeek(): void {
    this.navigateDate(7);
  },

  /**
   * Navigate to previous month
   */
  navigateToPreviousMonth(): void {
    const currentDate = new Date(dataState.selectedDate);
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.setSelectedDate(newDate);
  },

  /**
   * Navigate to next month
   */
  navigateToNextMonth(): void {
    const currentDate = new Date(dataState.selectedDate);
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.setSelectedDate(newDate);
  },

  /**
   * Navigate to previous year
   */
  navigateToPreviousYear(): void {
    const currentDate = new Date(dataState.selectedDate);
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    this.setSelectedDate(newDate);
  },

  /**
   * Navigate to next year
   */
  navigateToNextYear(): void {
    const currentDate = new Date(dataState.selectedDate);
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    this.setSelectedDate(newDate);
  },

  /**
   * Show the event form
   */
  showEventForm(): void {
    uiState.openEventForm();
  },

  /**
   * Hide the event form
   */
  hideEventForm(): void {
    uiState.closeEventForm();
  },

  /**
   * Toggle the event form visibility
   */
  toggleEventForm(): void {
    uiState.toggleEventForm();
  },

  /**
   * Show the timeline popup
   */
  showTimelinePopup(): void {
    uiState.openTimelinePopup();
  },

  /**
   * Hide the timeline popup
   */
  hideTimelinePopup(): void {
    uiState.closeTimelinePopup();
  },

  /**
   * Check for suggestions
   */
  checkForSuggestion(): void {
    if (suggestionService.hasRecentSuggestion()) {
      return;
    }

    const suggestion = suggestionService.checkForSuggestion();
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

  /**
   * Dismiss the current suggestion
   */
  dismissSuggestion(): void {
    uiState.clearCurrentSuggestion();
  },

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    uiState.setLoading(loading);
  },

  /**
   * Set error message
   */
  setError(message: string | null): void {
    uiState.setError(message);
  },

  /**
   * Clear error message
   */
  clearError(): void {
    uiState.clearError();
  },

  /**
   * Initialize the UI state
   */
  initialize(): void {
    // Set initial selected date to today
    this.setSelectedDate(new Date());

    // Check for initial suggestion
    this.checkForSuggestion();
  },
};
