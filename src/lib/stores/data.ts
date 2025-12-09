/**
 * @fileoverview Svelte stores for reactive data management
 *
 * This module provides centralized state management for the personal assistant application.
 * It includes stores for memos, suggestion logs, and derived computed values.
 *
 * NOTE: Calendar events have been migrated to `calendar.ts` which uses
 * the iCalendar-backed API for persistent storage.
 *
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { writable } from "svelte/store";
import type { SuggestionLog } from "../types.js";

// Temporary simple memo type (will be replaced with new Memo in Phase 4)
interface SimpleMemo {
  id: string;
  text: string;
}
type Memo = SimpleMemo;
import { toasts } from "./toast.js";

/**
 * Core application data stores
 */
/** @type {import('svelte/store').Writable<Memo[]>} Memos store */
export const memos = writable<Memo[]>([]);

/** @type {import('svelte/store').Writable<SuggestionLog[]>} Suggestion logs store */
export const suggestionLogs = writable<SuggestionLog[]>([]);

/** @type {import('svelte/store').Writable<Date>} Currently selected date store */
export const selectedDate = writable<Date>(new Date());

/**
 * Helper function to create a new memo with generated ID
 * @param text - Memo text content
 * @returns Memo with generated UUID
 */
function createMemo(text: string): Memo {
  return {
    id: crypto.randomUUID(),
    text,
  };
}

/**
 * Helper function to create a new suggestion log with generated ID
 * @param log - Log data without ID
 * @returns SuggestionLog with generated UUID
 */
function createSuggestionLog(log: Omit<SuggestionLog, "id">): SuggestionLog {
  return {
    ...log,
    id: crypto.randomUUID(),
  };
}

/**
 * Memo management operations
 * Provides CRUD operations for user memos
 */
export const memoOperations = {
  create(text: string): Memo {
    const newMemo = createMemo(text);
    memos.update((currentMemos) => [...currentMemos, newMemo]);
    toasts.show("Memo saved", "success");
    return newMemo;
  },

  update(id: string, text: string): Memo | null {
    let updatedMemo: Memo | null = null;

    memos.update((currentMemos) => {
      const index = currentMemos.findIndex((m) => m.id === id);
      if (index === -1) return currentMemos;

      updatedMemo = { ...currentMemos[index], text };
      const newMemos = [...currentMemos];
      newMemos[index] = updatedMemo;
      return newMemos;
    });

    if (updatedMemo) {
      toasts.show("Memo updated", "success");
    }

    return updatedMemo;
  },

  delete(id: string): boolean {
    let deleted = false;

    memos.update((currentMemos) => {
      const index = currentMemos.findIndex((m) => m.id === id);
      if (index === -1) return currentMemos;

      deleted = true;
      const newMemos = [...currentMemos];
      newMemos.splice(index, 1);
      return newMemos;
    });

    if (deleted) {
      toasts.show("Memo deleted", "success");
    }

    return deleted;
  },
};

/**
 * Suggestion log management operations
 * Provides operations for tracking user interactions with suggestions
 */
export const suggestionLogOperations = {
  create(log: Omit<SuggestionLog, "id">): SuggestionLog {
    const newLog = createSuggestionLog(log);
    suggestionLogs.update((currentLogs) => [...currentLogs, newLog]);
    return newLog;
  },
};

/**
 * Utility function to clear all application data (memos and suggestion logs)
 * For events, use calendarActions from calendar.ts
 * Primarily used for testing and development
 * @warning This will permanently delete all local user data
 */
export function clearAllData(): void {
  memos.set([]);
  suggestionLogs.set([]);
}
