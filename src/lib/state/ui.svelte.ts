/**
 * @fileoverview UI State - Reactive Class
 *
 * Manages UI state that affects the overall application layout and navigation.
 * This includes current view, view modes, panel states, and navigation state.
 *
 * Migrated from writable stores to Svelte 5 reactive class ($state).
 */

import type { ViewMode } from "../types.ts";

/**
 * Application view type
 */
export type AppView = "calendar" | "personal-assistant" | "tasks" | "utilities";

/**
 * UI State reactive class
 *
 * Usage:
 *   import { uiState } from "$lib/state/ui.svelte.ts";
 *   // In template: {uiState.currentView}
 *   // In script: uiState.setView("calendar")
 */
class UIState {
  // ============================================================================
  // Reactive State
  // ============================================================================

  /**
   * Current application view
   * Controls which main view is displayed
   */
  currentView = $state<AppView>("calendar");

  /**
   * Current view mode for the calendar
   * Controls how events are displayed (day, week, month, list)
   */
  viewMode = $state<ViewMode>("day");

  /**
   * Whether the memo panel is currently open
   * Controls the visibility of the memo editing panel
   */
  isMemoOpen = $state(false);

  /**
   * Whether the event form is currently visible
   * Controls the visibility of the event creation/editing form
   */
  showEventForm = $state(false);

  /**
   * Whether the timeline popup is currently visible
   * Controls the visibility of the timeline event details popup
   */
  showTimelinePopup = $state(false);

  /**
   * Current suggestion being displayed
   * Stores the active suggestion for the user to react to
   */
  currentSuggestion = $state<unknown>(null);

  /**
   * Whether the application is in loading state
   * Used for showing loading indicators during async operations
   */
  isLoading = $state(false);

  /**
   * Current error message
   * Stores error messages to display to the user
   */
  errorMessage = $state<string | null>(null);

  // ============================================================================
  // Derived State (getters)
  // ============================================================================

  /**
   * Whether the calendar view is currently active
   */
  get isCalendarView(): boolean {
    return this.currentView === "calendar";
  }

  /**
   * Whether the personal assistant view is currently active
   */
  get isPersonalAssistantView(): boolean {
    return this.currentView === "personal-assistant";
  }

  /**
   * Whether the tasks view is currently active
   */
  get isTasksView(): boolean {
    return this.currentView === "tasks";
  }

  /**
   * Whether the utilities view is currently active
   */
  get isUtilitiesView(): boolean {
    return this.currentView === "utilities";
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Switch between application views
   */
  setView(view: AppView): void {
    this.currentView = view;
  }

  /**
   * Change the calendar view mode
   */
  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  /**
   * Toggle the memo panel open/closed
   */
  toggleMemo(): void {
    this.isMemoOpen = !this.isMemoOpen;
  }

  /**
   * Set the memo panel state
   */
  setMemoOpen(open: boolean): void {
    this.isMemoOpen = open;
  }

  /**
   * Show the event form
   */
  openEventForm(): void {
    this.showEventForm = true;
  }

  /**
   * Hide the event form
   */
  closeEventForm(): void {
    this.showEventForm = false;
  }

  /**
   * Toggle the event form visibility
   */
  toggleEventForm(): void {
    this.showEventForm = !this.showEventForm;
  }

  /**
   * Show the timeline popup
   */
  openTimelinePopup(): void {
    this.showTimelinePopup = true;
  }

  /**
   * Hide the timeline popup
   */
  closeTimelinePopup(): void {
    this.showTimelinePopup = false;
  }

  /**
   * Set the current suggestion
   */
  setCurrentSuggestion(suggestion: unknown): void {
    this.currentSuggestion = suggestion;
  }

  /**
   * Clear the current suggestion
   */
  clearCurrentSuggestion(): void {
    this.currentSuggestion = null;
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  /**
   * Set error message
   */
  setError(message: string | null): void {
    this.errorMessage = message;
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorMessage = null;
  }

  /**
   * Reset all UI state to defaults
   */
  reset(): void {
    this.currentView = "calendar";
    this.viewMode = "day";
    this.isMemoOpen = false;
    this.showEventForm = false;
    this.showTimelinePopup = false;
    this.currentSuggestion = null;
    this.isLoading = false;
    this.errorMessage = null;
  }
}

/**
 * Global UI state instance
 *
 * Import this singleton to access/modify UI state throughout the app.
 */
export const uiState = new UIState();
