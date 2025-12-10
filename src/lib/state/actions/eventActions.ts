/**
 * @fileoverview Event Actions
 *
 * Contains all business logic and operations for event management.
 * This includes CRUD operations, validation, and data transformations.
 *
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import type { Event } from "../../types.ts";
import { dataState } from "../data.svelte.ts";
import { calendarState } from "../calendar.svelte.ts";
import {
  eventFormState,
  type EventFormData,
} from "../forms/eventForm.svelte.ts";
import { uiState } from "../ui.svelte.ts";
import { toastState } from "../toast.svelte.ts";
import {
  utcToLocalDateString,
  localDateTimeStringToUTC,
  createDateOnlyUTC,
  createMultiDayAllDayUTCRange,
} from "../../utils/date-utils.ts";

/**
 * Event Actions
 * Functions that handle event business logic and operations
 */
export const eventActions = {
  /**
   * Create a new event from the current form data
   */
  async create(): Promise<Event | null> {
    const formData = eventFormState.formData;

    // Clear previous errors
    eventFormState.clearAllErrors();

    // Validate form data
    const validationResult = eventFormState.validate();
    if (!validationResult.isValid) {
      return null;
    }

    try {
      // Set submitting state
      eventFormState.setSubmitting(true);

      // Create UTC dates for storage based on time label
      const { startDate, endDate } = createEventDates(formData);

      // Debug: verify storage vs input
      console.debug("[eventActions.create] form inputs", {
        startInput: formData.start,
        endInput: formData.end,
        timeLabel: formData.timeLabel,
      });
      console.debug("[eventActions.create] computed UTC dates", {
        startISO: startDate.toISOString(),
        endISO: endDate.toISOString(),
        startMs: startDate.getTime(),
        endMs: endDate.getTime(),
      });

      // Create the event via API
      const newEvent = await calendarState.createEvent({
        title: formData.title.trim(),
        start: startDate,
        end: endDate,
        description: formData.description?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        importance: formData.importance || "medium",
        timeLabel: formData.timeLabel || "all-day",
        recurrence: formData.recurrence,
      });

      if (!newEvent) {
        throw new Error("Failed to create event");
      }

      // Reset form and hide it
      eventFormState.reset();
      uiState.closeEventForm();

      // Show success message
      toastState.success("Event created successfully");

      return newEvent;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create event";
      eventFormState.setGeneralError(message);
      return null;
    } finally {
      eventFormState.setSubmitting(false);
    }
  },

  /**
   * Update an existing event from the current form data
   */
  async update(): Promise<Event | null> {
    const formData = eventFormState.formData;

    if (!formData.editingId) {
      eventFormState.setGeneralError("No event selected for editing");
      return null;
    }

    // Clear previous errors
    eventFormState.clearAllErrors();

    // Validate form data
    const validationResult = eventFormState.validate();
    if (!validationResult.isValid) {
      return null;
    }

    try {
      // Set submitting state
      eventFormState.setSubmitting(true);

      // Create UTC dates for storage based on time label
      const { startDate, endDate } = createEventDates(formData);

      // Update the event via API
      const success = await calendarState.updateEvent(formData.editingId, {
        title: formData.title.trim(),
        start: startDate,
        end: endDate,
        description: formData.description?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        importance: formData.importance || "medium",
        timeLabel: formData.timeLabel || "all-day",
        recurrence: formData.recurrence,
      });

      if (!success) {
        eventFormState.setGeneralError("Event not found");
        return null;
      }

      // Get the updated event from the state
      const updatedEvent = calendarState.getEvent(formData.editingId);

      if (!updatedEvent) {
        eventFormState.setGeneralError("Event not found after update");
        return null;
      }

      // Reset form and hide it
      eventFormState.reset();
      uiState.closeEventForm();

      // Show success message
      toastState.success("Event updated successfully");

      return updatedEvent;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update event";
      eventFormState.setGeneralError(message);
      return null;
    } finally {
      eventFormState.setSubmitting(false);
    }
  },

  /**
   * Delete an event by ID
   */
  async delete(eventId: string): Promise<boolean> {
    try {
      const deleted = await calendarState.deleteEvent(eventId);

      if (deleted) {
        toastState.success("Event deleted");
      } else {
        toastState.error("Event not found");
      }

      return deleted;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete event";
      toastState.error(message);
      return false;
    }
  },

  /**
   * Start editing an event
   */
  editEvent(event: Event): void {
    // Use the event's timeLabel directly, defaulting to "all-day" if not set
    const timeLabel = event.timeLabel || "all-day";

    // Set form data for editing
    eventFormState.setForEditing({
      ...event,
      timeLabel,
    });

    // Show the form
    uiState.openEventForm();
  },

  /**
   * Start creating a new event
   */
  createNewEvent(): void {
    // Reset form and set to create mode
    eventFormState.reset();
    eventFormState.setCreateMode();
    eventFormState.initializeForNewEvent();

    // Show the form
    uiState.openEventForm();
  },

  /**
   * Cancel event editing/creation
   */
  cancelEventForm(): void {
    eventFormState.reset();
    uiState.closeEventForm();
  },

  /**
   * Submit the event form (create or update based on editing state)
   */
  async submitEventForm(): Promise<Event | null> {
    const formData = eventFormState.formData;

    if (formData.isEditing) {
      return await this.update();
    } else {
      return await this.create();
    }
  },
};

/**
 * Validation function for event form data
 */
function validateEventForm(formData: any): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Validate title
  if (!formData.title?.trim()) {
    errors.title = "タイトルを入力してください";
  }

  // Validate start/end times if they have content
  if ((formData.start || formData.end) && (!formData.start || !formData.end)) {
    errors.start = "開始時間と終了時間を入力してください";
    errors.end = "開始時間と終了時間を入力してください";
  }

  // If both start and end are provided, validate them
  if (formData.start && formData.end) {
    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);

    if (startDate >= endDate) {
      errors.end = "終了時間は開始時間より後にしてください";
    }

    // Check if event is in the past (only for specific-time events)
    const now = new Date();
    if (startDate < now) {
      errors.start = "過去の時間に予定を作成することはできません";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Create UTC dates for event storage based on form data
 */
function createEventDates(formData: EventFormData): {
  startDate: Date;
  endDate: Date;
} {
  if (formData.timeLabel === "timed") {
    // For timed events, use actual start/end times
    if (!formData.start || !formData.end) {
      throw new Error("Timed events require both start and end times");
    }

    const startDate = localDateTimeStringToUTC(formData.start);
    const endDate = localDateTimeStringToUTC(formData.end);
    return { startDate, endDate };
  }

  // For date-only events (all-day, some-timing)
  let startDateStr: string;
  let endDateStr: string;

  if (formData.start && formData.end) {
    // Extract date parts (remove time if present)
    startDateStr = formData.start.includes("T")
      ? formData.start.split("T")[0]
      : formData.start;
    endDateStr = formData.end.includes("T")
      ? formData.end.split("T")[0]
      : formData.end;
  } else {
    // Use selected date as fallback
    const currentSelectedDate = dataState.selectedDate;
    const dateString = utcToLocalDateString(currentSelectedDate);
    startDateStr = dateString;
    endDateStr = dateString;
  }

  if (formData.timeLabel === "some-timing") {
    // Some-timing events: start and end must be the same date (single day only)
    const dateOnly = createDateOnlyUTC(startDateStr);
    return { startDate: dateOnly, endDate: dateOnly };
  } else {
    // All-day events: can span multiple days
    if (startDateStr === endDateStr) {
      // Single day all-day event - start and end are the same (date at 00:00 UTC)
      const dateOnly = createDateOnlyUTC(startDateStr);
      return { startDate: dateOnly, endDate: dateOnly };
    } else {
      // Multi-day all-day event - start is first day, end is last day (both at 00:00 UTC)
      const range = createMultiDayAllDayUTCRange(startDateStr, endDateStr);
      return { startDate: range.start, endDate: range.end };
    }
  }
}
