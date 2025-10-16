/**
 * @fileoverview Recurrence Form Store
 */

import { writable, derived } from 'svelte/store';

export interface RecurrenceFormData {
  enabled: boolean;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  until: string; // YYYY-MM-DD or ""
  weeklyDays: boolean[]; // 7-length
  monthlyType: "dayOfMonth" | "nthWeekday";
}

const initialState: RecurrenceFormData = {
  enabled: false,
  frequency: "WEEKLY",
  interval: 1,
  until: "",
  weeklyDays: [false, false, false, false, false, false, false],
  monthlyType: "nthWeekday"
};

export const recurrenceForm = writable<RecurrenceFormData>(initialState);

export const isRecurrenceEnabled = derived(recurrenceForm, ($f) => $f.enabled);

export const recurrenceFormActions = {
  update(updates: Partial<RecurrenceFormData>): void {
    recurrenceForm.update(f => ({ ...f, ...updates }));
  },
  setEnabled(enabled: boolean): void {
    recurrenceForm.update(f => ({ ...f, enabled }));
  },
  toggleWeeklyDay(index: number): void {
    recurrenceForm.update(f => {
      const days = [...f.weeklyDays];
      days[index] = !days[index];
      return { ...f, weeklyDays: days };
    });
  },
  reset(): void {
    recurrenceForm.set(initialState);
  }
};


