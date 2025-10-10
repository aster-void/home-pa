import { writable } from "svelte/store";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    show: (message: string, type: ToastType = "success", duration = 3000) => {
      const id = Date.now().toString() + Math.random().toString(36);
      const toast: Toast = { id, message, type, duration };

      update((toasts) => [...toasts, toast]);

      // Auto remove after duration
      setTimeout(() => {
        update((toasts) => toasts.filter((t) => t.id !== id));
      }, duration);
    },
    remove: (id: string) => {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },
  };
}

export const toasts = createToastStore();

