/**
 * @fileoverview Memo Form State - Reactive Class
 *
 * Manages the state of the memo creation/editing form.
 * This includes form fields, validation state, and form-specific UI state.
 *
 * Migrated from writable stores to Svelte 5 reactive class ($state).
 */

import { toastState } from "../../../bootstrap/toast.svelte.ts";

/**
 * Simple memo type
 */
export interface SimpleMemo {
  id: string;
  text: string;
}

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

// ============================================================================
// MEMO STATE CLASS
// ============================================================================

/**
 * Memo state reactive class
 * Manages both memo list and form state
 */
class MemoState {
  // ============================================================================
  // Memo List State
  // ============================================================================

  /**
   * All memos
   */
  memos = $state<SimpleMemo[]>([]);

  // ============================================================================
  // Form State
  // ============================================================================

  /**
   * Current memo text in form
   */
  text = $state("");

  /**
   * Whether currently editing an existing memo
   */
  isEditing = $state(false);

  /**
   * ID of memo being edited (null for new memo)
   */
  editingId = $state<string | null>(null);

  /**
   * Validation errors
   */
  errors = $state<MemoFormErrors>({});

  /**
   * Whether form is being submitted
   */
  isSubmitting = $state(false);

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
   * Whether the form has content
   */
  get hasContent(): boolean {
    return this.text.trim() !== "";
  }

  /**
   * Whether the form is valid
   */
  get isValid(): boolean {
    return this.text.trim() !== "" && Object.keys(this.errors).length === 0;
  }

  /**
   * Character count
   */
  get characterCount(): number {
    return this.text.length;
  }

  /**
   * Word count
   */
  get wordCount(): number {
    const words = this.text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    return words.length;
  }

  /**
   * Get form data as object
   */
  get formData(): MemoFormData {
    return {
      text: this.text,
      isEditing: this.isEditing,
      editingId: this.editingId,
    };
  }

  // ============================================================================
  // Memo CRUD Operations
  // ============================================================================

  /**
   * Create a new memo
   */
  create(text?: string): SimpleMemo | null {
    const memoText = text ?? this.text.trim();

    // Validate
    if (!memoText) {
      this.setFieldError("text", "メモの内容を入力してください");
      return null;
    }

    const maxLength = 10000;
    if (memoText.length > maxLength) {
      this.setFieldError(
        "text",
        `メモは${maxLength}文字以内で入力してください`,
      );
      return null;
    }

    const newMemo: SimpleMemo = {
      id: crypto.randomUUID(),
      text: memoText,
    };

    this.memos = [...this.memos, newMemo];
    this.resetForm();
    toastState.show("Memo saved", "success");
    return newMemo;
  }

  /**
   * Update an existing memo
   */
  update(id?: string, text?: string): SimpleMemo | null {
    const memoId = id ?? this.editingId;
    const memoText = text ?? this.text.trim();

    if (!memoId) {
      this.setGeneralError("No memo selected for editing");
      return null;
    }

    if (!memoText) {
      this.setFieldError("text", "メモの内容を入力してください");
      return null;
    }

    const index = this.memos.findIndex((m) => m.id === memoId);
    if (index === -1) {
      this.setGeneralError("Memo not found");
      return null;
    }

    const updatedMemo: SimpleMemo = { id: memoId, text: memoText };
    const newMemos = [...this.memos];
    newMemos[index] = updatedMemo;
    this.memos = newMemos;

    this.resetForm();
    toastState.show("Memo updated", "success");
    return updatedMemo;
  }

  /**
   * Delete a memo by ID
   */
  delete(memoId: string): boolean {
    const index = this.memos.findIndex((m) => m.id === memoId);
    if (index === -1) {
      toastState.show("Memo not found", "error");
      return false;
    }

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
  // Form Actions
  // ============================================================================

  /**
   * Update the memo text
   */
  updateText(text: string): void {
    this.text = text;
    // Clear text error when user types
    if (this.errors.text) {
      this.clearFieldError("text");
    }
  }

  /**
   * Update multiple form fields at once
   */
  updateFields(updates: Partial<MemoFormData>): void {
    if (updates.text !== undefined) this.text = updates.text;
    if (updates.isEditing !== undefined) this.isEditing = updates.isEditing;
    if (updates.editingId !== undefined) this.editingId = updates.editingId;
  }

  /**
   * Set form data for editing an existing memo
   */
  setFormForEditing(memo: SimpleMemo): void {
    this.text = memo.text;
    this.isEditing = true;
    this.editingId = memo.id;
    this.errors = {};
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.text = "";
    this.isEditing = false;
    this.editingId = null;
    this.errors = {};
    this.isSubmitting = false;
  }

  /**
   * Reset form to initial state (alias for resetForm)
   */
  reset(): void {
    this.resetForm();
  }

  /**
   * Set form for editing (alias for setFormForEditing)
   */
  setForEditing(memo: SimpleMemo): void {
    this.setFormForEditing(memo);
  }

  /**
   * Set form to create new memo mode
   */
  setCreateMode(): void {
    this.isEditing = false;
    this.editingId = null;
  }

  /**
   * Set validation error for a field
   */
  setFieldError(field: keyof MemoFormErrors, error: string): void {
    this.errors = { ...this.errors, [field]: error };
  }

  /**
   * Clear validation error for a field
   */
  clearFieldError(field: keyof MemoFormErrors): void {
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
   * Submit the memo form (create or update based on editing state)
   */
  submit(): SimpleMemo | null {
    if (this.isEditing) {
      return this.update();
    } else {
      return this.create();
    }
  }

  /**
   * Clear all memos
   */
  clearAll(): void {
    this.memos = [];
  }
}

/**
 * Global memo state instance
 */
export const memoState = new MemoState();
