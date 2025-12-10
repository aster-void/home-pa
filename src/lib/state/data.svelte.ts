/**
 * @fileoverview Core Data Store - Reactive Class
 *
 * This module provides centralized state management for the personal assistant application.
 * It includes stores for memos, suggestion logs, and derived computed values.
 *
 * Migrated from writable stores to Svelte 5 reactive class ($state).
 */

import type { SuggestionLog } from "../types.js";
import { toastState } from "./toast.svelte.js";

/**
 * Simple memo type (will be enhanced in future phases)
 */
export interface SimpleMemo {
  id: string;
  text: string;
}

/**
 * Core data store reactive class
 */
class DataState {
  // ============================================================================
  // Reactive State
  // ============================================================================

  /**
   * User memos list
   */
  memos = $state<SimpleMemo[]>([]);

  /**
   * Suggestion interaction logs
   */
  suggestionLogs = $state<SuggestionLog[]>([]);

  /**
   * Currently selected date
   */
  selectedDate = $state<Date>(new Date());

  // ============================================================================
  // Derived State (getters)
  // ============================================================================

  /**
   * Number of memos
   */
  get memoCount(): number {
    return this.memos.length;
  }

  /**
   * Number of suggestion logs
   */
  get suggestionLogCount(): number {
    return this.suggestionLogs.length;
  }

  // ============================================================================
  // Memo Operations
  // ============================================================================

  /**
   * Create a new memo
   */
  createMemo(text: string): SimpleMemo {
    const newMemo: SimpleMemo = {
      id: crypto.randomUUID(),
      text,
    };
    this.memos = [...this.memos, newMemo];
    toastState.show("Memo saved", "success");
    return newMemo;
  }

  /**
   * Update an existing memo
   */
  updateMemo(id: string, text: string): SimpleMemo | null {
    const index = this.memos.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const updatedMemo: SimpleMemo = { ...this.memos[index], text };
    const newMemos = [...this.memos];
    newMemos[index] = updatedMemo;
    this.memos = newMemos;

    toastState.show("Memo updated", "success");
    return updatedMemo;
  }

  /**
   * Delete a memo by ID
   */
  deleteMemo(id: string): boolean {
    const index = this.memos.findIndex((m) => m.id === id);
    if (index === -1) return false;

    const newMemos = [...this.memos];
    newMemos.splice(index, 1);
    this.memos = newMemos;

    toastState.show("Memo deleted", "success");
    return true;
  }

  /**
   * Get a memo by ID
   */
  getMemo(id: string): SimpleMemo | undefined {
    return this.memos.find((m) => m.id === id);
  }

  // ============================================================================
  // Suggestion Log Operations
  // ============================================================================

  /**
   * Create a new suggestion log
   */
  createSuggestionLog(log: Omit<SuggestionLog, "id">): SuggestionLog {
    const newLog: SuggestionLog = {
      ...log,
      id: crypto.randomUUID(),
    };
    this.suggestionLogs = [...this.suggestionLogs, newLog];
    return newLog;
  }

  // ============================================================================
  // Date Operations
  // ============================================================================

  /**
   * Set the selected date
   */
  setSelectedDate(date: Date): void {
    this.selectedDate = date;
  }

  /**
   * Move to today
   */
  goToToday(): void {
    this.selectedDate = new Date();
  }

  /**
   * Move to the next day
   */
  nextDay(): void {
    const current = this.selectedDate;
    this.selectedDate = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + 1,
    );
  }

  /**
   * Move to the previous day
   */
  previousDay(): void {
    const current = this.selectedDate;
    this.selectedDate = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() - 1,
    );
  }

  // ============================================================================
  // Utility
  // ============================================================================

  /**
   * Clear all application data
   * @warning This will permanently delete all local user data
   */
  clearAll(): void {
    this.memos = [];
    this.suggestionLogs = [];
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.memos = [];
    this.suggestionLogs = [];
    this.selectedDate = new Date();
  }
}

/**
 * Global data state instance
 */
export const dataState = new DataState();
