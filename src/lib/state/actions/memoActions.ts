/**
 * @fileoverview Memo Actions
 *
 * Contains all business logic and operations for memo management.
 * This includes CRUD operations, validation, and data transformations.
 *
 * @author Personal Assistant Team
 * @version 2.0.0
 */

import { dataState } from "../data.svelte.ts";
import {
  memoState,
  type SimpleMemo,
  type MemoFormData,
  type MemoFormErrors,
} from "../forms/memoForm.svelte.ts";
import { toastState } from "../toast.svelte.ts";

type Memo = SimpleMemo;

/**
 * Memo Actions
 * Functions that handle memo business logic and operations
 */
export const memoActions = {
  /**
   * Create a new memo from the current form data
   */
  async create(): Promise<Memo | null> {
    const formData = memoState.formData;

    // Clear previous errors
    memoState.clearAllErrors();

    // Validate form data
    const validationResult = validateMemoForm(formData);
    if (!validationResult.isValid) {
      // Set validation errors
      Object.entries(validationResult.errors).forEach(([field, error]) => {
        memoState.setFieldError(field as keyof MemoFormErrors, error);
      });
      return null;
    }

    try {
      // Set submitting state
      memoState.setSubmitting(true);

      // Create the memo
      const newMemo = dataState.createMemo(formData.text.trim());

      // Reset form
      memoState.reset();

      // Show success message
      toastState.success("Memo saved");

      return newMemo;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create memo";
      memoState.setGeneralError(message);
      return null;
    } finally {
      memoState.setSubmitting(false);
    }
  },

  /**
   * Update an existing memo from the current form data
   */
  async update(): Promise<Memo | null> {
    const formData = memoState.formData;

    if (!formData.editingId) {
      memoState.setGeneralError("No memo selected for editing");
      return null;
    }

    // Clear previous errors
    memoState.clearAllErrors();

    // Validate form data
    const validationResult = validateMemoForm(formData);
    if (!validationResult.isValid) {
      // Set validation errors
      Object.entries(validationResult.errors).forEach(([field, error]) => {
        memoState.setFieldError(field as keyof MemoFormErrors, error);
      });
      return null;
    }

    try {
      // Set submitting state
      memoState.setSubmitting(true);

      // Update the memo
      const updatedMemo = dataState.updateMemo(
        formData.editingId,
        formData.text.trim(),
      );

      if (!updatedMemo) {
        memoState.setGeneralError("Memo not found");
        return null;
      }

      // Reset form
      memoState.reset();

      // Show success message
      toastState.success("Memo updated");

      return updatedMemo;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update memo";
      memoState.setGeneralError(message);
      return null;
    } finally {
      memoState.setSubmitting(false);
    }
  },

  /**
   * Delete a memo by ID
   */
  async delete(memoId: string): Promise<boolean> {
    try {
      const deleted = dataState.deleteMemo(memoId);

      if (deleted) {
        toastState.success("Memo deleted");
      } else {
        toastState.error("Memo not found");
      }

      return deleted;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete memo";
      toastState.error(message);
      return false;
    }
  },

  /**
   * Start editing a memo
   */
  editMemo(memo: Memo): void {
    // Set form data for editing
    memoState.setForEditing(memo);
  },

  /**
   * Start creating a new memo
   */
  createNewMemo(): void {
    // Reset form and set to create mode
    memoState.reset();
    memoState.setCreateMode();
  },

  /**
   * Cancel memo editing/creation
   */
  cancelMemoForm(): void {
    memoState.reset();
  },

  /**
   * Submit the memo form (create or update based on editing state)
   */
  async submitMemoForm(): Promise<Memo | null> {
    const formData = memoState.formData;

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
    const formData = memoState.formData;

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
    const formData = memoState.formData;

    // Only auto-save if there's content and it's not currently submitting
    if (formData.text.trim() && !memoState.isSubmitting) {
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
function validateMemoForm(formData: MemoFormData): {
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
