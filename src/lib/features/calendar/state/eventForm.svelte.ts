/**
 * @fileoverview Event Form State - Reactive Class
 *
 * Manages the state of the event creation/editing form.
 * This includes form fields, validation state, and form-specific UI state.
 *
 * Migrated from writable stores to Svelte 5 reactive class ($state).
 */

import type { Event, Recurrence } from "../../../types.ts";
import { dataState } from "../../../bootstrap/data.svelte.ts";
import {
  utcToLocalDateTimeString,
  utcToLocalDateString,
} from "../../../utils/date-utils.ts";

/**
 * Event form data interface
 */
export interface EventFormData {
  title: string;
  start: string;
  end: string;
  description: string;
  address: string;
  importance: "low" | "medium" | "high";
  timeLabel: "all-day" | "some-timing" | "timed";
  isEditing: boolean;
  editingId: string | null;
  recurrence?: Recurrence;
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

// ============================================================================
// EVENT FORM STATE CLASS
// ============================================================================

/**
 * Event form state reactive class
 */
class EventFormState {
  // ============================================================================
  // Reactive State
  // ============================================================================

  /** Whether the event form is currently visible */
  isOpen = $state(false);

  title = $state("");
  start = $state("");
  end = $state("");
  description = $state("");
  address = $state("");
  importance = $state<"low" | "medium" | "high">("medium");
  timeLabel = $state<"all-day" | "some-timing" | "timed">("all-day");
  isEditing = $state(false);
  editingId = $state<string | null>(null);
  recurrence = $state<Recurrence | undefined>(undefined);

  // Validation errors
  errors = $state<EventFormErrors>({});

  // Submission state
  isSubmitting = $state(false);

  // ============================================================================
  // Derived State (getters)
  // ============================================================================

  /**
   * Whether the form has any content
   */
  get hasContent(): boolean {
    return (
      this.title.trim() !== "" ||
      this.description.trim() !== "" ||
      this.address.trim() !== ""
    );
  }

  /**
   * Whether the form has time content (for timed events)
   */
  get hasTimeContent(): boolean {
    return (
      this.timeLabel === "timed" &&
      (this.start.trim() !== "" || this.end.trim() !== "")
    );
  }

  /**
   * Whether the form is valid
   */
  get isValid(): boolean {
    return this.title.trim() !== "" && Object.keys(this.errors).length === 0;
  }

  /**
   * Whether there are any validation errors
   */
  get hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  /**
   * Get form data as an object
   */
  get formData(): EventFormData {
    return {
      title: this.title,
      start: this.start,
      end: this.end,
      description: this.description,
      address: this.address,
      importance: this.importance,
      timeLabel: this.timeLabel,
      isEditing: this.isEditing,
      editingId: this.editingId,
      recurrence: this.recurrence,
    };
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Validate the current form
   */
  validate(): { isValid: boolean; errors: EventFormErrors } {
    const errors: EventFormErrors = {};

    if (!this.title.trim()) {
      errors.title = "タイトルを入力してください";
    }

    // For timed events, validate start/end times
    if (this.timeLabel === "timed") {
      if ((this.start || this.end) && (!this.start || !this.end)) {
        errors.start = "開始時間と終了時間を入力してください";
        errors.end = "開始時間と終了時間を入力してください";
      }

      if (this.start && this.end) {
        const startDate = new Date(this.start);
        const endDate = new Date(this.end);
        if (startDate >= endDate) {
          errors.end = "終了時間は開始時間より後にしてください";
        }
        const now = new Date();
        if (startDate < now) {
          errors.start = "過去の時間に予定を作成することはできません";
        }
      }
    }

    this.errors = errors;
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  /**
   * Update a form field
   */
  updateField<K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K],
  ): void {
    // Type-safe field updates
    switch (field) {
      case "title":
        this.title = value as string;
        break;
      case "start":
        this.start = value as string;
        break;
      case "end":
        this.end = value as string;
        break;
      case "description":
        this.description = value as string;
        break;
      case "address":
        this.address = value as string;
        break;
      case "importance":
        this.importance = value as "low" | "medium" | "high";
        break;
      case "timeLabel":
        this.timeLabel = value as "all-day" | "some-timing" | "timed";
        break;
      case "isEditing":
        this.isEditing = value as boolean;
        break;
      case "editingId":
        this.editingId = value as string | null;
        break;
      case "recurrence":
        this.recurrence = value as Recurrence | undefined;
        break;
    }

    // Clear field-specific error on change
    if (field === "title" || field === "start" || field === "end") {
      this.clearFieldError(field as keyof EventFormErrors);
    }
  }

  /**
   * Set form data for editing an existing event
   */
  setForEditing(event: Event): void {
    const timeLabel = event.timeLabel || "all-day";

    let startValue = "";
    let endValue = "";

    if (timeLabel === "timed") {
      startValue = utcToLocalDateTimeString(new Date(event.start));
      endValue = utcToLocalDateTimeString(new Date(event.end));
    } else {
      startValue = utcToLocalDateString(new Date(event.start));
      endValue = utcToLocalDateString(new Date(event.end));
    }

    this.title = event.title;
    this.start = startValue;
    this.end = endValue;
    this.description = event.description || "";
    this.address = event.address || "";
    this.importance = event.importance || "medium";
    this.timeLabel = timeLabel;
    this.isEditing = true;
    this.editingId = event.id;
    this.recurrence = event.recurrence;
    this.errors = {};
  }

  /**
   * Reset form to initial state
   */
  reset(): void {
    this.title = "";
    this.start = "";
    this.end = "";
    this.description = "";
    this.address = "";
    this.importance = "medium";
    this.timeLabel = "all-day";
    this.isEditing = false;
    this.editingId = null;
    this.recurrence = undefined;
    this.errors = {};
    this.isSubmitting = false;
  }

  /**
   * Set form to create new event mode
   */
  setCreateMode(): void {
    this.isEditing = false;
    this.editingId = null;
  }

  /** Open the event form */
  open(): void {
    this.isOpen = true;
  }

  /** Close the event form */
  close(): void {
    this.isOpen = false;
  }

  /**
   * Switch between time labels
   */
  switchTimeLabel(label: "all-day" | "some-timing" | "timed"): void {
    if (label === "some-timing") {
      // Some-timing events: start and end must be the same date
      const currentStart = this.start ? this.start.split("T")[0] : "";
      this.timeLabel = label;
      this.start = currentStart;
      this.end = currentStart;
    } else if (label === "all-day") {
      // All-day events: can span multiple days, preserve existing dates
      this.timeLabel = label;
    } else {
      // Timed events: keep current values
      this.timeLabel = label;
    }
  }

  /**
   * Set validation error for a field
   */
  setFieldError(field: keyof EventFormErrors, error: string): void {
    this.errors = { ...this.errors, [field]: error };
  }

  /**
   * Clear validation error for a field
   */
  clearFieldError(field: keyof EventFormErrors): void {
    const newErrors = { ...this.errors };
    delete newErrors[field];
    this.errors = newErrors;
  }

  /**
   * Clear all validation errors
   */
  clearAllErrors(): void {
    this.errors = {};
  }

  /**
   * Set general error message
   */
  setGeneralError(message: string): void {
    this.errors = { ...this.errors, general: message };
  }

  /**
   * Set submitting state
   */
  setSubmitting(submitting: boolean): void {
    this.isSubmitting = submitting;
  }

  /**
   * Initialize form with default values for new event
   */
  initializeForNewEvent(): void {
    const sel = dataState.selectedDate;
    const yyyy = sel.getFullYear();
    const mm = String(sel.getMonth() + 1).padStart(2, "0");
    const dd = String(sel.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    this.reset();
    this.timeLabel = "all-day";
    this.start = dateStr;
    this.end = dateStr;
  }
}

/**
 * Global event form state instance
 */
export const eventFormState = new EventFormState();
