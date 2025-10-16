/**
 * @fileoverview Event Actions
 * 
 * Contains all business logic and operations for event management.
 * This includes CRUD operations, validation, and data transformations.
 * 
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { get } from 'svelte/store';
import type { Event } from '../../types.js';
import { eventOperations, selectedDate } from '../data.js';
import { eventForm, eventFormActions, eventFormErrors, validateEventFormData } from '../forms/eventForm.js';
import { uiActions } from '../ui.js';
import { toasts } from '../toast.js';
import { 
  utcToLocalDateTimeString,
  createAllDayUTCRange,
  createMultiDayAllDayUTCRange,
  localDateTimeToUTC
} from '../../utils/date-utils.js';

/**
 * Event Actions
 * Functions that handle event business logic and operations
 */
export const eventActions = {
  /**
   * Create a new event from the current form data
   */
  async create(): Promise<Event | null> {
    const formData = get(eventForm);
    
    // Clear previous errors
    eventFormActions.clearAllErrors();
    
    // Validate form data
    const validationResult = validateEventFormData(formData);
    if (!validationResult.isValid) {
      // Set validation errors
      (Object.entries(validationResult.errors) as Array<[keyof typeof validationResult.errors, string]>).forEach(([field, error]) => {
        eventFormActions.setFieldError(field as any, error);
      });
      return null;
    }

    try {
      // Set submitting state
      eventFormActions.setSubmitting(true);

      // Create UTC dates for storage based on time label
      const { startDate, endDate } = createEventDates(formData);

      // Create the event
      const newEvent = eventOperations.create({
        title: formData.title.trim(),
        start: startDate,
        end: endDate,
        description: formData.description?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        importance: formData.importance || "medium",
        timeLabel: formData.timeLabel || "all-day",
      });

      // Reset form and hide it
      eventFormActions.resetForm();
      uiActions.hideEventForm();

      // Show success message
      toasts.show("Event created successfully", "success");

      return newEvent;
    } catch (error: any) {
      eventFormActions.setGeneralError(error.message || "Failed to create event");
      return null;
    } finally {
      eventFormActions.setSubmitting(false);
    }
  },

  /**
   * Update an existing event from the current form data
   */
  async update(): Promise<Event | null> {
    const formData = get(eventForm);
    
    if (!formData.editingId) {
      eventFormActions.setGeneralError("No event selected for editing");
      return null;
    }

    // Clear previous errors
    eventFormActions.clearAllErrors();
    
    // Validate form data
    const validationResult = validateEventFormData(formData);
    if (!validationResult.isValid) {
      // Set validation errors
      (Object.entries(validationResult.errors) as Array<[keyof typeof validationResult.errors, string]>).forEach(([field, error]) => {
        eventFormActions.setFieldError(field as any, error);
      });
      return null;
    }

    try {
      // Set submitting state
      eventFormActions.setSubmitting(true);

      // Create UTC dates for storage based on time label
      const { startDate, endDate } = createEventDates(formData);

      // Update the event
      const updatedEvent = eventOperations.update(formData.editingId, {
        title: formData.title.trim(),
        start: startDate,
        end: endDate,
        description: formData.description?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        importance: formData.importance || "medium",
        timeLabel: formData.timeLabel || "all-day",
      });

      if (!updatedEvent) {
        eventFormActions.setGeneralError("Event not found");
        return null;
      }

      // Reset form and hide it
      eventFormActions.resetForm();
      uiActions.hideEventForm();

      // Show success message
      toasts.show("Event updated successfully", "success");

      return updatedEvent;
    } catch (error: any) {
      eventFormActions.setGeneralError(error.message || "Failed to update event");
      return null;
    } finally {
      eventFormActions.setSubmitting(false);
    }
  },

  /**
   * Delete an event by ID
   */
  async delete(eventId: string): Promise<boolean> {
    try {
      const deleted = eventOperations.delete(eventId);
      
      if (deleted) {
        toasts.show("Event deleted", "success");
      } else {
        toasts.show("Event not found", "error");
      }
      
      return deleted;
    } catch (error: any) {
      toasts.show(error.message || "Failed to delete event", "error");
      return false;
    }
  },

  /**
   * Start editing an event
   */
  editEvent(event: Event): void {
    // Determine time label based on event duration
    const isAllDay = event.end.getTime() - event.start.getTime() >= 24 * 60 * 60 * 1000 - 1000;
    const timeLabel = event.timeLabel || (isAllDay ? "all-day" : "some-timing");

    // Set form data for editing
    eventFormActions.setFormForEditing({
      ...event,
      timeLabel
    });

    // Show the form
    uiActions.showEventForm();
  },

  /**
   * Start creating a new event
   */
  createNewEvent(): void {
    // Reset form and set to create mode
    eventFormActions.resetForm();
    eventFormActions.setCreateMode();
    eventFormActions.initializeForNewEvent();

    // Show the form
    uiActions.showEventForm();
  },

  /**
   * Cancel event editing/creation
   */
  cancelEventForm(): void {
    eventFormActions.resetForm();
    uiActions.hideEventForm();
  },

  /**
   * Submit the event form (create or update based on editing state)
   */
  async submitEventForm(): Promise<Event | null> {
    const formData = get(eventForm);
    
    if (formData.isEditing) {
      return await this.update();
    } else {
      return await this.create();
    }
  }
};

/**
 * Validation function for event form data
 */
function validateEventForm(formData: any): { isValid: boolean; errors: Record<string, string> } {
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
    errors
  };
}

/**
 * Create UTC dates for event storage based on form data
 */
function createEventDates(formData: any): { startDate: Date; endDate: Date } {
  let startDate: Date;
  let endDate: Date;
  
  if (formData.start && formData.end) {
    // Parse datetime-local format and convert to UTC
    startDate = new Date(formData.start);
    endDate = new Date(formData.end);
  } else {
    // Use selected date for all-day or some-timing events
    const currentSelectedDate = get(selectedDate);
    const dateString = `${currentSelectedDate.getFullYear()}-${String(currentSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(currentSelectedDate.getDate()).padStart(2, '0')}`;
    
    if (formData.timeLabel === "some-timing") {
      // For some-timing events, they don't have specific times
      // Just set them to the same time (no duration) so they don't appear in timeline
      const [year, month, day] = dateString.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    } else {
      // For all-day events, check if it spans multiple days
      if (formData.start && formData.end) {
        const startDateStr = formData.start.split('T')[0];
        const endDateStr = formData.end.split('T')[0];
        if (startDateStr === endDateStr) {
          // Single day all-day event
          const range = createAllDayUTCRange(startDateStr);
          startDate = range.start;
          endDate = range.end;
        } else {
          // Multi-day all-day event
          const range = createMultiDayAllDayUTCRange(startDateStr, endDateStr);
          startDate = range.start;
          endDate = range.end;
        }
      } else {
        const range = createAllDayUTCRange(dateString);
        startDate = range.start;
        endDate = range.end;
      }
    }
  }

  return { startDate, endDate };
}
