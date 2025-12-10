/**
 * @fileoverview UI State Store
 *
 * Manages UI state that affects the overall application layout and navigation.
 * This includes current view, view modes, panel states, and navigation state.
 *
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { writable } from "svelte/store";
import type { ViewMode } from "../types.ts";

/**
 * Application view type
 */
export type AppView = "calendar" | "personal-assistant" | "tasks" | "utilities";

/**
 * Current application view
 * Controls which main view is displayed
 */
export const currentView = writable<AppView>("calendar");

/**
 * Current view mode for the calendar
 * Controls how events are displayed (day, week, month, list)
 */
export const viewMode = writable<ViewMode>("day");

/**
 * Whether the memo panel is currently open
 * Controls the visibility of the memo editing panel
 */
export const isMemoOpen = writable<boolean>(false);

/**
 * Whether the event form is currently visible
 * Controls the visibility of the event creation/editing form
 */
export const showEventForm = writable<boolean>(false);

/**
 * Whether the timeline popup is currently visible
 * Controls the visibility of the timeline event details popup
 */
export const showTimelinePopup = writable<boolean>(false);

/**
 * Current suggestion being displayed
 * Stores the active suggestion for the user to react to
 */
export const currentSuggestion = writable<any>(null);

/**
 * Whether the application is in loading state
 * Used for showing loading indicators during async operations
 */
export const isLoading = writable<boolean>(false);

/**
 * Current error message
 * Stores error messages to display to the user
 */
export const errorMessage = writable<string | null>(null);

/**
 * UI State Actions
 * Functions to update UI state - these should be called by components
 */
export const uiActions = {
  /**
   * Switch between application views
   */
  setView(view: AppView): void {
    currentView.set(view);
  },

  /**
   * Change the calendar view mode
   */
  setViewMode(mode: ViewMode): void {
    viewMode.set(mode);
  },

  /**
   * Toggle the memo panel open/closed
   */
  toggleMemo(): void {
    isMemoOpen.update((open) => !open);
  },

  /**
   * Set the memo panel state
   */
  setMemoOpen(open: boolean): void {
    isMemoOpen.set(open);
  },

  /**
   * Show the event form
   */
  showEventForm(): void {
    showEventForm.set(true);
  },

  /**
   * Hide the event form
   */
  hideEventForm(): void {
    showEventForm.set(false);
  },

  /**
   * Toggle the event form visibility
   */
  toggleEventForm(): void {
    showEventForm.update((visible) => !visible);
  },

  /**
   * Show the timeline popup
   */
  showTimelinePopup(): void {
    showTimelinePopup.set(true);
  },

  /**
   * Hide the timeline popup
   */
  hideTimelinePopup(): void {
    showTimelinePopup.set(false);
  },

  /**
   * Set the current suggestion
   */
  setCurrentSuggestion(suggestion: any): void {
    currentSuggestion.set(suggestion);
  },

  /**
   * Clear the current suggestion
   */
  clearCurrentSuggestion(): void {
    currentSuggestion.set(null);
  },

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    isLoading.set(loading);
  },

  /**
   * Set error message
   */
  setError(message: string | null): void {
    errorMessage.set(message);
  },

  /**
   * Clear error message
   */
  clearError(): void {
    errorMessage.set(null);
  },
};

/**
 * Derived UI State
 * Computed values based on UI state
 */

/**
 * Whether the calendar view is currently active
 */
export const isCalendarView = writable<boolean>(true);

/**
 * Whether the personal assistant view is currently active
 */
export const isPersonalAssistantView = writable<boolean>(false);

/**
 * Whether the tasks view is currently active
 */
export const isTasksView = writable<boolean>(false);

// Update derived states when currentView changes
currentView.subscribe((view) => {
  isCalendarView.set(view === "calendar");
  isPersonalAssistantView.set(view === "personal-assistant");
  isTasksView.set(view === "tasks");
});
