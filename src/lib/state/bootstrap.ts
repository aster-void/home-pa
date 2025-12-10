/**
 * @fileoverview Centralized store initialization
 */

import { uiActions } from "./actions/uiActions.ts";
import { suggestionActions } from "./actions/suggestionActions.ts";
import { timezoneActions } from "./timezone.ts";

export function initializeStores(): void {
  timezoneActions.detect();
  uiActions.initialize();
  suggestionActions.initializeReactive();
}
