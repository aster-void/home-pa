/**
 * @fileoverview UI Actions
 * 
 * Contains all business logic and operations for UI state management.
 * This includes navigation, view switching, and UI state coordination.
 * 
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { get } from 'svelte/store';
import { selectedDate } from '../data.js';
import { uiActions as uiStateActions, currentSuggestion } from '../ui.js';
import { suggestionService } from '../../services/suggestion.js';

/**
 * UI Actions
 * Functions that handle UI business logic and operations
 */
export const uiActions = {
  /**
   * Switch between calendar and personal assistant views
   */
  setView(view: "calendar" | "personal-assistant"): void {
    uiStateActions.setView(view);

    // Check for suggestions when returning to calendar
    if (view === "calendar") {
      this.checkForSuggestion();
    }
  },

  /**
   * Change the calendar view mode
   */
  setViewMode(mode: "day" | "list"): void {
    uiStateActions.setViewMode(mode);
  },

  /**
   * Toggle the memo panel open/closed
   */
  toggleMemo(): void {
    uiStateActions.toggleMemo();
  },

  /**
   * Set the memo panel state
   */
  setMemoOpen(open: boolean): void {
    uiStateActions.setMemoOpen(open);
  },

  /**
   * Navigate to a specific date
   */
  setSelectedDate(date: Date): void {
    selectedDate.set(date);
  },

  /**
   * Navigate date by a number of days
   */
  navigateDate(days: number): void {
    const currentDate = new Date(get(selectedDate));
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
    const currentDate = new Date(get(selectedDate));
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.setSelectedDate(newDate);
  },

  /**
   * Navigate to next month
   */
  navigateToNextMonth(): void {
    const currentDate = new Date(get(selectedDate));
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.setSelectedDate(newDate);
  },

  /**
   * Navigate to previous year
   */
  navigateToPreviousYear(): void {
    const currentDate = new Date(get(selectedDate));
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    this.setSelectedDate(newDate);
  },

  /**
   * Navigate to next year
   */
  navigateToNextYear(): void {
    const currentDate = new Date(get(selectedDate));
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    this.setSelectedDate(newDate);
  },

  /**
   * Show the event form
   */
  showEventForm(): void {
    uiStateActions.showEventForm();
  },

  /**
   * Hide the event form
   */
  hideEventForm(): void {
    uiStateActions.hideEventForm();
  },

  /**
   * Toggle the event form visibility
   */
  toggleEventForm(): void {
    uiStateActions.toggleEventForm();
  },

  /**
   * Show the timeline popup
   */
  showTimelinePopup(): void {
    uiStateActions.showTimelinePopup();
  },

  /**
   * Hide the timeline popup
   */
  hideTimelinePopup(): void {
    uiStateActions.hideTimelinePopup();
  },

  /**
   * Check for suggestions
   */
  checkForSuggestion(): void {
    if (suggestionService.hasRecentSuggestion()) {
      return;
    }

    const suggestion = suggestionService.checkForSuggestion();
    uiStateActions.setCurrentSuggestion(suggestion);
  },

  /**
   * React to a suggestion
   */
  reactToSuggestion(reaction: "accepted" | "rejected" | "later"): void {
    const active: any = get(currentSuggestion as any);
    if (!active) return;
    suggestionService.logReaction(active, reaction);
    uiStateActions.clearCurrentSuggestion();
  },

  /**
   * Dismiss the current suggestion
   */
  dismissSuggestion(): void {
    uiStateActions.clearCurrentSuggestion();
  },

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    uiStateActions.setLoading(loading);
  },

  /**
   * Set error message
   */
  setError(message: string | null): void {
    uiStateActions.setError(message);
  },

  /**
   * Clear error message
   */
  clearError(): void {
    uiStateActions.clearError();
  },

  /**
   * Initialize the UI state
   */
  initialize(): void {
    // Set initial selected date to today
    this.setSelectedDate(new Date());
    
    // Check for initial suggestion
    this.checkForSuggestion();
  }
};
