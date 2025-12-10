/**
 * @fileoverview Toast Notification State - Reactive Class
 *
 * Manages toast notifications with auto-dismiss functionality.
 *
 * Migrated from writable stores to Svelte 5 reactive class ($state).
 */

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

/**
 * Toast state reactive class
 */
class ToastState {
  // ============================================================================
  // Reactive State
  // ============================================================================

  /**
   * Active toasts list
   */
  toasts = $state<Toast[]>([]);

  // ============================================================================
  // Derived State
  // ============================================================================

  /**
   * Whether there are any active toasts
   */
  get hasToasts(): boolean {
    return this.toasts.length > 0;
  }

  /**
   * Number of active toasts
   */
  get count(): number {
    return this.toasts.length;
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Show a toast notification
   */
  show(message: string, type: ToastType = "success", duration = 3000): void {
    const id = Date.now().toString() + Math.random().toString(36);
    const toast: Toast = { id, message, type, duration };

    this.toasts = [...this.toasts, toast];

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  /**
   * Remove a toast by ID
   */
  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toasts = [];
  }

  /**
   * Dismiss a toast by ID (alias for remove)
   */
  dismiss(id: string): void {
    this.remove(id);
  }

  /**
   * Clear all toasts (alias for clearAll)
   */
  clear(): void {
    this.clearAll();
  }

  /**
   * Show a success toast
   */
  success(message: string, duration?: number): void {
    this.show(message, "success", duration);
  }

  /**
   * Show an error toast
   */
  error(message: string, duration?: number): void {
    this.show(message, "error", duration);
  }

  /**
   * Show an info toast
   */
  info(message: string, duration?: number): void {
    this.show(message, "info", duration);
  }
}

/**
 * Global toast state instance
 */
export const toastState = new ToastState();
