/**
 * @fileoverview Timezone store and helpers
 */

import { writable, derived } from "svelte/store";

/**
 * Current IANA timezone identifier
 */
export const timezone = writable<string>(
  Intl.DateTimeFormat().resolvedOptions().timeZone,
);

/**
 * Actions to manage timezone
 */
export const timezoneActions = {
  set(tz: string): void {
    timezone.set(tz);
  },
  detect(): void {
    timezone.set(Intl.DateTimeFormat().resolvedOptions().timeZone);
  },
};

/**
 * Human-friendly timezone label
 */
export const timezoneLabel = derived(timezone, ($tz) => $tz);
