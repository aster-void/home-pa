/**
 * @fileoverview Minimal store devtools hooks
 */

import { writable, get, type Readable } from 'svelte/store';

export const devtoolsEnabled = writable<boolean>(false);

export const devtools = {
  enable(): void { devtoolsEnabled.set(true); },
  disable(): void { devtoolsEnabled.set(false); },
  toggle(): void { devtoolsEnabled.update(v => !v); },
  logStore<T>(name: string, store: Readable<T>): void {
    store.subscribe((value) => {
      if (get(devtoolsEnabled)) {
        // eslint-disable-next-line no-console
        console.debug(`[store:${name}]`, value);
      }
    });
  }
};


