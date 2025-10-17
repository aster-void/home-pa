/**
 * @fileoverview Event Form Store
 * 
 * Manages the state of the event creation/editing form.
 * This includes form fields, validation state, and form-specific UI state.
 * 
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { writable, derived, get } from 'svelte/store';
import { selectedDate } from '../data.js';
import type { Event } from '../../types.js';
import { utcToLocalDateTimeString, utcToLocalDateString } from '../../utils/date-utils.js';

/**
 * Event form data interface
 */
export interface EventFormData {
  title: string;
  start: string;
  end: string;
  description?: string;
  address?: string;
  importance?: "low" | "medium" | "high";
  timeLabel: "all-day" | "some-timing" | "timed";
  isEditing: boolean;
  editingId: string | null;
}

/**
 * Form validation errors
 */
export interface EventFormErrors {
  title?: string;
  start?: string;
  end?: string;
  general?: string;
}

/**
 * Initial form state
 */
const initialFormState: EventFormData = {
  title: "",
  start: "",
  end: "",
  description: "",
  address: "",
  importance: "medium",
  timeLabel: "all-day",
  isEditing: false,
  editingId: null,
};

/**
 * Main event form store
 * Contains all form field values and editing state
 */
export const eventForm = writable<EventFormData>(initialFormState);

/**
 * Form validation errors store
 * Contains validation error messages for each field
 */
export const eventFormErrors = writable<EventFormErrors>({});

/**
 * Whether the form is currently being submitted
 * Used to prevent double submissions and show loading state
 */
export const isSubmitting = writable<boolean>(false);

/**
 * Derived form state
 * Computed values based on form data
 */

/**
 * Whether the form has any content
 */
export const hasFormContent = derived(
  eventForm,
  ($form) => {
    return $form.title.trim() !== "" || 
           $form.description?.trim() !== "" || 
           $form.address?.trim() !== "";
  }
);

/**
 * Whether the form has time content (for timed events)
 */
export const hasTimeContent = derived(
  eventForm,
  ($form) => {
    return $form.timeLabel === "timed" && 
           ($form.start.trim() !== "" || $form.end.trim() !== "");
  }
);

/**
 * Whether the form is valid
 */
export const isFormValid = derived(
  [eventForm, eventFormErrors],
  ([$form, $errors]) => {
    return $form.title.trim() !== "" && 
           Object.keys($errors).length === 0;
  }
);

/**
 * Whether the form is in editing mode
 */
export const isEditing = derived(
  eventForm,
  ($form) => $form.isEditing
);

/**
 * Event Form Actions
 * Functions to manage form state - these should be called by components
 */
export const eventFormActions = {
  /**
   * Validate the current form and set reactive errors
   */
  validate(): { isValid: boolean; errors: Record<string, string> } {
    const result = validateEventFormData(getCurrentForm());
    eventFormErrors.set(result.errors);
    return result;
  },
  /**
   * Update a form field
   */
  updateField<K extends keyof EventFormData>(
    field: K, 
    value: EventFormData[K]
  ): void {
    eventForm.update(form => ({
      ...form,
      [field]: value
    }));
    // Clear field-specific error on change
    if (field === 'title' || field === 'start' || field === 'end') {
      this.clearFieldError(field as any);
    }
  },

  /**
   * Update multiple form fields at once
   */
  updateFields(updates: Partial<EventFormData>): void {
    eventForm.update(form => ({
      ...form,
      ...updates
    }));
    // Best-effort clear basic field errors when updating them
    Object.keys(updates).forEach((k) => {
      if (k === 'title' || k === 'start' || k === 'end') {
        this.clearFieldError(k as keyof EventFormErrors);
      }
    });
  },

  /**
   * Set form data for editing an existing event
   */
  setFormForEditing(event: Event): void {
    // Use the event's timeLabel directly, defaulting to "all-day" if not set
    const timeLabel = event.timeLabel || "all-day";

    // For date-only events, show only the date
    // For timed events, show the datetime
    let startValue = "";
    let endValue = "";
    
    if (timeLabel === "timed") {
      startValue = utcToLocalDateTimeString(new Date(event.start));
      endValue = utcToLocalDateTimeString(new Date(event.end));
    } else {
      // For all-day and some-timing events, show only the date
      startValue = utcToLocalDateString(new Date(event.start));
      endValue = utcToLocalDateString(new Date(event.end));
    }

    eventForm.set({
      title: event.title,
      start: startValue,
      end: endValue,
      description: event.description || "",
      address: event.address || "",
      importance: event.importance || "medium",
      timeLabel: timeLabel,
      isEditing: true,
      editingId: event.id,
    });
  },

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    eventForm.set(initialFormState);
    eventFormErrors.set({});
    isSubmitting.set(false);
  },

  /**
   * Set form to create new event mode
   */
  setCreateMode(): void {
    eventForm.update(form => ({
      ...form,
      isEditing: false,
      editingId: null,
    }));
  },

  /**
   * Switch between time labels
   */
  switchTimeLabel(label: "all-day" | "some-timing" | "timed"): void {
    eventForm.update(form => {
      if (label === "some-timing") {
        // Some-timing events: start and end must be the same date
        const currentStart = form.start ? form.start.split('T')[0] : "";
        return {
          ...form,
          timeLabel: label,
          start: currentStart,
          end: currentStart, // Force end date to match start date
        };
      } else if (label === "all-day") {
        // All-day events: can span multiple days, preserve existing dates
        return {
          ...form,
          timeLabel: label,
          // Don't clear start/end dates - preserve user input
        };
      } else {
        // Timed events: keep current values
        return {
          ...form,
          timeLabel: label,
        };
      }
    });
  },

  /**
   * Set validation error for a field
   */
  setFieldError(field: keyof EventFormErrors, error: string): void {
    eventFormErrors.update(errors => ({
      ...errors,
      [field]: error
    }));
  },

  /**
   * Clear validation error for a field
   */
  clearFieldError(field: keyof EventFormErrors): void {
    eventFormErrors.update(errors => {
      const newErrors = { ...errors };
      delete newErrors[field];
      return newErrors;
    });
  },

  /**
   * Clear all validation errors
   */
  clearAllErrors(): void {
    eventFormErrors.set({});
  },

  /**
   * Set general error message
   */
  setGeneralError(message: string): void {
    eventFormErrors.update(errors => ({
      ...errors,
      general: message
    }));
  },

  /**
   * Set submitting state
   */
  setSubmitting(submitting: boolean): void {
    isSubmitting.set(submitting);
  },

  /**
   * Initialize form with default values for new event
   */
  initializeForNewEvent(): void {
    // Default to the currently selected date in UI
    const sel = get(selectedDate);
    const yyyy = sel.getFullYear();
    const mm = String(sel.getMonth() + 1).padStart(2, '0');
    const dd = String(sel.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    eventForm.set({
      ...initialFormState,
      timeLabel: 'all-day',
      start: dateStr, // Date-only for all-day events
      end: dateStr,   // Date-only for all-day events
    });
  }
};

/**
 * Read current form value synchronously
 */
function getCurrentForm(): EventFormData {
  return get(eventForm);
}

/**
 * Shared validation logic for event form data
 */
export function validateEventFormData(formData: EventFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!formData.title?.trim()) {
    errors.title = "タイトルを入力してください";
  }

  // For timed events, validate start/end times
  if (formData.timeLabel === "timed") {
    if ((formData.start || formData.end) && (!formData.start || !formData.end)) {
      errors.start = "開始時間と終了時間を入力してください";
      errors.end = "開始時間と終了時間を入力してください";
    }

    if (formData.start && formData.end) {
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);
      if (startDate >= endDate) {
        errors.end = "終了時間は開始時間より後にしてください";
      }
      const now = new Date();
      if (startDate < now) {
        errors.start = "過去の時間に予定を作成することはできません";
      }
    }
  }
  // For date-only events (all-day, some-timing), no time validation needed

  return { isValid: Object.keys(errors).length === 0, errors };
}
