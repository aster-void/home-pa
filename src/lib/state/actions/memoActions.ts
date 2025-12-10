/**
 * @fileoverview Memo Actions
 *
 * Contains all business logic and operations for memo management.
 * This includes CRUD operations, validation, and data transformations.
 *
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { get } from "svelte/store";
// Temporary simple memo type (will be replaced with new Memo in Phase 4)
interface SimpleMemo {
  id: string;
  text: string;
}
type Memo = SimpleMemo;
import { memoOperations } from "../data.js";
import {
  memoForm,
  memoFormActions,
  memoFormErrors,
  isSubmitting,
  type MemoFormErrors,
} from "../forms/memoForm.js";
import { uiActions } from "../ui.js";
import { toasts } from "../toast.js";

/**
 * Memo Actions
 * Functions that handle memo business logic and operations
 */
export const memoActions = {
  /**
   * Create a new memo from the current form data
   */
  async create(): Promise<Memo | null> {
    const formData = get(memoForm);

    // Clear previous errors
    memoFormActions.clearAllErrors();

    // Validate form data
    const validationResult = validateMemoForm(formData);
    if (!validationResult.isValid) {
      // Set validation errors
      Object.entries(validationResult.errors).forEach(([field, error]) => {
        memoFormActions.setFieldError(field as keyof MemoFormErrors, error);
      });
      return null;
    }

    try {
      // Set submitting state
      memoFormActions.setSubmitting(true);

      // Create the memo
      const newMemo = memoOperations.create(formData.text.trim());

      // Reset form
      memoFormActions.resetForm();

      // Show success message
      toasts.show("Memo saved", "success");

      return newMemo;
    } catch (error: any) {
      memoFormActions.setGeneralError(error.message || "Failed to create memo");
      return null;
    } finally {
      memoFormActions.setSubmitting(false);
    }
  },

  /**
   * Update an existing memo from the current form data
   */
  async update(): Promise<Memo | null> {
    const formData = get(memoForm);

    if (!formData.editingId) {
      memoFormActions.setGeneralError("No memo selected for editing");
      return null;
    }

    // Clear previous errors
    memoFormActions.clearAllErrors();

    // Validate form data
    const validationResult = validateMemoForm(formData);
    if (!validationResult.isValid) {
      // Set validation errors
      Object.entries(validationResult.errors).forEach(([field, error]) => {
        memoFormActions.setFieldError(field as keyof MemoFormErrors, error);
      });
      return null;
    }

    try {
      // Set submitting state
      memoFormActions.setSubmitting(true);

      // Update the memo
      const updatedMemo = memoOperations.update(
        formData.editingId,
        formData.text.trim(),
      );

      if (!updatedMemo) {
        memoFormActions.setGeneralError("Memo not found");
        return null;
      }

      // Reset form
      memoFormActions.resetForm();

      // Show success message
      toasts.show("Memo updated", "success");

      return updatedMemo;
    } catch (error: any) {
      memoFormActions.setGeneralError(error.message || "Failed to update memo");
      return null;
    } finally {
      memoFormActions.setSubmitting(false);
    }
  },

  /**
   * Delete a memo by ID
   */
  async delete(memoId: string): Promise<boolean> {
    try {
      const deleted = memoOperations.delete(memoId);

      if (deleted) {
        toasts.show("Memo deleted", "success");
      } else {
        toasts.show("Memo not found", "error");
      }

      return deleted;
    } catch (error: any) {
      toasts.show(error.message || "Failed to delete memo", "error");
      return false;
    }
  },

  /**
   * Start editing a memo
   */
  editMemo(memo: Memo): void {
    // Set form data for editing
    memoFormActions.setFormForEditing(memo);
  },

  /**
   * Start creating a new memo
   */
  createNewMemo(): void {
    // Reset form and set to create mode
    memoFormActions.resetForm();
    memoFormActions.setCreateMode();
  },

  /**
   * Cancel memo editing/creation
   */
  cancelMemoForm(): void {
    memoFormActions.resetForm();
  },

  /**
   * Submit the memo form (create or update based on editing state)
   */
  async submitMemoForm(): Promise<Memo | null> {
    const formData = get(memoForm);

    if (formData.isEditing) {
      return await this.update();
    } else {
      return await this.create();
    }
  },

  /**
   * Quick save memo (save without closing form)
   */
  async quickSave(): Promise<Memo | null> {
    const formData = get(memoForm);

    if (!formData.text.trim()) {
      return null;
    }

    if (formData.isEditing) {
      return await this.update();
    } else {
      return await this.create();
    }
  },

  /**
   * Auto-save memo (save periodically while typing)
   */
  async autoSave(): Promise<void> {
    const formData = get(memoForm);

    // Only auto-save if there's content and it's not currently submitting
    if (formData.text.trim() && !get(isSubmitting)) {
      try {
        if (formData.isEditing) {
          await this.update();
        } else {
          await this.create();
        }
      } catch (error) {
        // Silently fail for auto-save
        console.warn("Auto-save failed:", error);
      }
    }
  },
};

/**
 * Validation function for memo form data
 */
function validateMemoForm(formData: any): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Validate text content
  if (!formData.text?.trim()) {
    errors.text = "メモの内容を入力してください";
  }

  // Check for maximum length (optional)
  const maxLength = 10000; // 10,000 characters
  if (formData.text && formData.text.length > maxLength) {
    errors.text = `メモは${maxLength}文字以内で入力してください`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
