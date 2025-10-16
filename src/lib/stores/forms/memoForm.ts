/**
 * @fileoverview Memo Form Store
 * 
 * Manages the state of the memo creation/editing form.
 * This includes form fields, validation state, and form-specific UI state.
 * 
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { writable, derived } from 'svelte/store';
import type { Memo } from '../../types.js';

/**
 * Memo form data interface
 */
export interface MemoFormData {
  text: string;
  isEditing: boolean;
  editingId: string | null;
}

/**
 * Form validation errors
 */
export interface MemoFormErrors {
  text?: string;
  general?: string;
}

/**
 * Initial form state
 */
const initialFormState: MemoFormData = {
  text: "",
  isEditing: false,
  editingId: null,
};

/**
 * Main memo form store
 * Contains all form field values and editing state
 */
export const memoForm = writable<MemoFormData>(initialFormState);

/**
 * Form validation errors store
 * Contains validation error messages for each field
 */
export const memoFormErrors = writable<MemoFormErrors>({});

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
  memoForm,
  ($form) => $form.text.trim() !== ""
);

/**
 * Whether the form is valid
 */
export const isFormValid = derived(
  [memoForm, memoFormErrors],
  ([$form, $errors]) => {
    return $form.text.trim() !== "" && 
           Object.keys($errors).length === 0;
  }
);

/**
 * Whether the form is in editing mode
 */
export const isEditing = derived(
  memoForm,
  ($form) => $form.isEditing
);

/**
 * Character count for the memo text
 */
export const characterCount = derived(
  memoForm,
  ($form) => $form.text.length
);

/**
 * Word count for the memo text
 */
export const wordCount = derived(
  memoForm,
  ($form) => {
    const words = $form.text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }
);

/**
 * Memo Form Actions
 * Functions to manage form state - these should be called by components
 */
export const memoFormActions = {
  /**
   * Update the memo text
   */
  updateText(text: string): void {
    memoForm.update(form => ({
      ...form,
      text
    }));
  },

  /**
   * Update multiple form fields at once
   */
  updateFields(updates: Partial<MemoFormData>): void {
    memoForm.update(form => ({
      ...form,
      ...updates
    }));
  },

  /**
   * Set form data for editing an existing memo
   */
  setFormForEditing(memo: Memo): void {
    memoForm.set({
      text: memo.text,
      isEditing: true,
      editingId: memo.id,
    });
  },

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    memoForm.set(initialFormState);
    memoFormErrors.set({});
    isSubmitting.set(false);
  },

  /**
   * Set form to create new memo mode
   */
  setCreateMode(): void {
    memoForm.update(form => ({
      ...form,
      isEditing: false,
      editingId: null,
    }));
  },

  /**
   * Set validation error for a field
   */
  setFieldError(field: keyof MemoFormErrors, error: string): void {
    memoFormErrors.update(errors => ({
      ...errors,
      [field]: error
    }));
  },

  /**
   * Clear validation error for a field
   */
  clearFieldError(field: keyof MemoFormErrors): void {
    memoFormErrors.update(errors => {
      const newErrors = { ...errors };
      delete newErrors[field];
      return newErrors;
    });
  },

  /**
   * Clear all validation errors
   */
  clearAllErrors(): void {
    memoFormErrors.set({});
  },

  /**
   * Set general error message
   */
  setGeneralError(message: string): void {
    memoFormErrors.update(errors => ({
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
   * Clear the memo text
   */
  clearText(): void {
    memoForm.update(form => ({
      ...form,
      text: ""
    }));
  },

  /**
   * Append text to the memo
   */
  appendText(text: string): void {
    memoForm.update(form => ({
      ...form,
      text: form.text + text
    }));
  },

  /**
   * Insert text at cursor position (if supported by component)
   */
  insertTextAtPosition(text: string, position: number): void {
    memoForm.update(form => {
      const before = form.text.slice(0, position);
      const after = form.text.slice(position);
      return {
        ...form,
        text: before + text + after
      };
    });
  }
};
