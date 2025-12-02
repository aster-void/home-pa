# Suggestion Logic Update Strategy

This document outlines a detailed workflow for integrating the new scheduling-and-suggestion logic into Home‑PA. The tasks are sequenced to minimize churn and clarify dependencies.

---

## 1. Baseline Inventory

1. Audit current suggestion flow (`src/lib/services/suggestion.ts`, stores, UI usage).
2. Catalog data sources (events, memos, logs) and identify gaps in metadata (locations, durations, priorities).
3. Confirm existing persistence (Prisma models, local stores) and note required schema changes.

Deliverables:
- Annotated map of current suggestion pipeline.
- Checklist of missing fields per entity (event, gap, suggestion, user settings).

## 2. Data Model Extensions

1. Update `src/lib/types.ts` to add:
   - `Suggestion`: `need`, `importance`, `duration`, `location?: Coordinate`, `locationPreference?: string`, `status`, `lastReaction`.
   - `Gap`: `gapId`, `startLocation`, `endLocation`, `startLabel?`, `endLabel?`.
   - `Event`: `location?: Coordinate`, `locationLabel?: string`, optional travel metadata.
2. Mirror changes in persistence layer (Prisma schema and migrations or local store definitions).
3. Add helper `Coordinate` type and shared constants (`MINUTES_PER_DISTANCE_UNIT`, etc.).

Deliverables:
- Updated type definitions and schema migration (if needed).
- Notes on backward compatibility and default values.

## 3. Location & Travel Metrics Module

Create `src/lib/services/suggestions/travel-metrics.ts`:

1. Define `Coordinate` utilities, `setHomeLocation`, `getHomeLocation`.
2. Implement deterministic address→coordinate mapper:
   - Hash address → pseudo-random seed → bounded grid coordinate.
   - Cache results per session/user.
3. Provide `euclideanDistance`, `travelMinutesBetween`, `formatTravelLog`.
4. Expose configuration hooks for `MINUTES_PER_DISTANCE_UNIT`.

Deliverables:
- Travel helper module with tests.
- Documentation on pseudo-geocode fallback.

## 4. Suggestion Registry

Create `src/lib/services/suggestions/suggestion-registry.ts`:

1. In-memory store with optional persistence for all potential suggestions.
2. APIs:
   - `register(rawTask)`, `updateStatus(id, status)`, `getByStatus(status)`.
   - `markReaction(id, reaction)` to feed scoring.
3. Store derived metadata: creation time, last scheduled, streaks, reaction history.
4. Wire to `suggestionLogOperations` for durability.

Deliverables:
- Registry module + unit tests.
- Seed/import script to bootstrap suggestions (if needed).

## 5. Scoring Layer

Create `src/lib/services/suggestions/suggestion-scoring.ts`:

1. Define `ScoreInput` (task attributes, reactions, deadlines, user prefs).
2. Implement:
   - `normalizeNeed(value)`, `normalizeImportance(value)`.
   - `computeNeed(input)`, `computeImportance(input)`.
   - `toSuggestionModel(input)` -> returns fully populated `Suggestion`.
3. Encode rules:
   - Mandatory threshold handling (`need >= 1.0`).
   - Recency decay, streak bonuses, urgency factors.
4. Provide hooks for future ML/AI replacements via strategy pattern.

Deliverables:
- Scoring module with deterministic fixtures.
- Doc comments explaining heuristics and tunables.

## 6. Scheduler Port

Create `src/lib/services/suggestions/suggestion-scheduler.ts`:

1. Translate Python dataclasses to TS interfaces (`Gap`, `Suggestion`, `ScheduledBlock`, `ScheduleResult`).
2. Port core functions:
   - `greedySelectCandidates` (knapsack).
   - `enumerateBestOrder` (permutation search).
   - `assignOrderToGaps`.
   - `scheduleSuggestions`.
3. Integrate with travel module:
   - Skip travel when suggestion or cursor lacks coordinates.
   - Enforce `locationPreference` rules (e.g., `near_home` boundaries).
4. Include logging utilities (`movementLog`, `formatSchedule`).
5. Add exhaustive unit tests mirroring Python samples.

Deliverables:
- TS implementation parity with Python version.
- Test suite (`bun test` or Vitest) covering mandatory inclusion, travel units, infeasible cases.

## 7. Gap Enrichment

1. Extend `GapFinder` to attach:
   - Coordinates (inherit from adjacent events or fallback to home/work labels).
   - Human-readable labels for start/end.
   - Unique `gapId`.
2. Ensure midnight and boundary handling preserve labels and coordinates.
3. Provide helper `deriveGapLocations(events)` to reuse in other contexts.

Deliverables:
- Updated gap finder module.
- Tests for gaps with/without events, midnight crossings, and custom boundaries.

## 8. Orchestration Service

Create `src/lib/services/suggestions/suggestion-engine.ts`:

1. Pipeline:
   - Fetch candidate suggestions from registry.
   - Score them via scoring module.
   - Fetch gaps (current day/time window) with enriched data.
   - Call scheduler and receive `ScheduleResult`.
   - Update registry statuses + logs.
2. Handle no-gap / no-suggestion scenarios gracefully (return null or fallback template).
3. Expose API:
   - `generateSuggestions(context)`.
   - `refreshSchedule()` (for manual triggers).
   - Observables/stores for UI consumption.

Deliverables:
- Engine module + integration tests (mock registry/gap data).
- Documentation of state transitions.

## 9. UI & Store Integration

1. Update Svelte stores to subscribe to `ScheduleResult` (scheduled blocks, travel cost, dropped suggestions).
2. Enhance `SuggestionService` or create controller class using runes:
   - Display next recommended action with context (gap, travel time).
   - Show movement log or summary in calendar UI.
3. Add user controls:
   - Accept/Reject/Later actions wired to registry/logs.
   - Option to pin mandatory suggestions or adjust priorities.

Deliverables:
- UI components updated with runes syntax.
- Interaction tests or manual QA plan.

## 10. Configuration & Settings

1. Add config surface (env or user settings) for:
   - `MINUTES_PER_DISTANCE_UNIT`, `MANDATORY_NEED_THRESHOLD`.
   - Day boundaries, home/work locations.
   - Scheduler limits (`permutationLimit`, `maxDistance`).
2. Provide defaults and validation.
3. Document how to tune values per user or environment.

Deliverables:
- Config module or schema updates.
- Docs describing knob effects and safe ranges.

## 11. Testing & Validation

1. Unit tests for each new module (travel, scoring, registry, scheduler, engine).
2. Integration test simulating a day:
   - Seed events + suggestions -> expect specific schedule result.
3. Regression tests to ensure legacy simple suggestions still function (if fallback needed).
4. Manual verification in dev environment with sample data:
   - Check deterministic coordinates.
   - Confirm scheduler handles location-less suggestions.
   - Validate UI updates and logs.

Deliverables:
- Test matrix with pass/fail results.
- QA checklist recorded in docs or issue tracker.

## 12. Documentation & Rollout

1. Update README / AGENTS doc with overview of the new suggestion stack.
2. Add developer notes on how to add new suggestion templates or scoring heuristics.
3. Provide migration guide for existing data (if schema changes affect stored suggestions).
4. Plan rollout:
   - Feature flag or staged deployment if needed.
   - Monitoring hooks (reaction rate, scheduler success).

Deliverables:
- Documentation updates.
- Rollout/monitoring plan linked to repo roadmap.

---

Following this strategy ensures we introduce the advanced scheduler in layers, keep data consistent, and maintain clear upgrade paths for future integrations (real geocoding, AI scoring, etc.).***

