/**
 * @fileoverview Centralized store initialization
 */

import { uiActions } from './actions/uiActions.js';
import { suggestionActions } from './actions/suggestionActions.js';
import { timezoneActions } from './timezone.js';

export function initializeStores(): void {
  timezoneActions.detect();
  uiActions.initialize();
  suggestionActions.initializeReactive();
}


