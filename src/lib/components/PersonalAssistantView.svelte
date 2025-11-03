<script lang="ts">
  // LogsView removed from header; settings panel is minimal
  import LogsView from "./LogsView.svelte";
  import { CircularTimeline } from "./pa_components/index.js";
  import { events, selectedDate } from "../stores/data.js";
  import type { Event, Gap } from "../types.js";
  import { GapFinder } from "../services/gap-finder.js";

  // Local state
  // Settings panel toggle (replaces top header controls)
  let showSettings = $state(false);
  let selectedGap = $state<Gap | null>(null);
  let selectedEvent = $state<Event | null>(null);

  // Active hours (day boundaries for gap finding)
  let activeStart = $state("08:00");
  let activeEnd = $state("23:00");

  // Computed gaps using GapFinder for the selected day
  let computedGaps = $state<Gap[]>([]);

  function recomputeGaps() {
    const gf = new GapFinder({ dayStart: activeStart, dayEnd: activeEnd });
    let todaysEvents: Event[] = [];
    events.subscribe(($events) => {
      selectedDate.subscribe(($date) => {
        todaysEvents = $events.filter((ev) => new Date(ev.start).toDateString() === new Date($date).toDateString());
      })();
    })();
    // Map to GapFinder.Event (HH:mm strings)
    const mapped = todaysEvents.map((e) => {
      // Handle all-day events specially: span full day (00:00 to 23:59)
      if (e.timeLabel === "all-day") {
        return {
          id: e.id,
          title: e.title,
          start: "00:00",
          end: "23:59",
        };
      }
      // For timed events, use actual times
      return {
        id: e.id,
        title: e.title,
        start: new Date(e.start).toTimeString().slice(0, 5),
        end: new Date(e.end).toTimeString().slice(0, 5),
      };
    });
    computedGaps = gf.findGaps(mapped);
  }

  // Recompute gaps when active hours, events, or date change
  $effect(() => {
    recomputeGaps();
  });

  // Component-level event handling is wired directly on the child via on: handlers below
</script>

<div class="personal-assistant-view">
  <!-- Minimal bottom-left Settings trigger -->
  <button class="settings-trigger" onclick={() => (showSettings = true)}>settings</button>

  <!-- Main Content -->
  <main class="pa-main">
    <!-- Timeline Section - Centered full circle -->
    <section class="timeline-section">
      <div class="timeline-container">
        <CircularTimeline
          externalGaps={computedGaps}
          on:eventSelected={(e) => (selectedEvent = e.detail)}
          on:gapSelected={(e) => (selectedGap = e.detail)}
        />
      </div>
    </section>

    <!-- Content Section
    <section class="content-section">
     
      {#if selectedGap}
        <div class="gap-details">
          <h3>Free Time: {selectedGap.start} - {selectedGap.end}</h3>
          <p>{selectedGap.duration} minutes available</p>
          <div class="gap-actions">
            <button class="action-btn primary">Add Task</button>
            <button class="action-btn secondary">Take Break</button>
          </div>
        </div>
      {/if}

      
      {#if selectedEvent}
        <div class="event-details">
          <h3>{selectedEvent.title}</h3>
          <p>{selectedEvent.start.toTimeString().slice(0, 5)} - {selectedEvent.end.toTimeString().slice(0, 5)}</p>
          {#if selectedEvent.description}
            <p class="description">{selectedEvent.description}</p>
          {/if}
          <div class="event-actions">
            <button class="action-btn secondary">Edit</button>
            <button class="action-btn danger">Delete</button>
          </div>
        </div>
      {/if}
    </section>-->
  </main>

  <!-- Settings Panel (bottom sheet) -->
  {#if showSettings}
    <section class="settings-section">
      <div class="settings-header">
        <span>Settings</span>
        <button class="settings-close" onclick={() => (showSettings = false)}>close</button>
      </div>
      <div class="settings-content">
        <div class="settings-row">
          <span class="label">Active hours</span>
          <div class="inputs">
            <input type="time" bind:value={activeStart} onchange={recomputeGaps} />
            <span>–</span>
            <input type="time" bind:value={activeEnd} onchange={recomputeGaps} />
          </div>
        </div>
        <div class="settings-logs">
          <LogsView />
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .personal-assistant-view {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  /* Settings trigger (minimal, bottom-left) */
  .settings-trigger {
    position: fixed;
    left: 8px;
    top: 8px;
    z-index: 250;
    background: transparent;
    border: none;
    padding: 2px 4px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
  }

  /* Main Layout */
  .pa-main {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
  }

  /* Timeline Section - Left side circle */
  .timeline-section {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .timeline-container {
    width: 100%;
    height: 100%;
    max-width: 90vh;
    max-height: 95vh;
    position: relative;
    overflow: visible;
  }

  /* Content Section 
  .content-section {
    position: absolute;
    right: 0;
    top: 0;
    width: 50vw;
    height: 100vh;
    padding: calc(var(--space-lg) + 60px) var(--space-md) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    overflow-y: auto;
    background: var(--white);
    z-index: 5;
  }*/

  /* Gap Details 
  .gap-details {
    background: var(--coral);
    color: var(--white);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 20px rgba(240, 138, 119, 0.3);
  }

  .gap-details h3 {
    margin: 0 0 var(--space-sm) 0;
    font-family: var(--font-family);
    font-size: var(--fs-md);
    font-weight: var(--font-weight-bold);
  }

  .gap-details p {
    margin: 0 0 var(--space-md) 0;
    font-family: var(--font-family);
    font-size: var(--fs-sm);
    opacity: 0.9;
  }

  .gap-actions {
    display: flex;
    gap: var(--space-sm);
  }

  /* Event Details 
  .event-details {
    background: var(--navy-50);
    border: 2px solid var(--navy-200);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
  }

  .event-details h3 {
    margin: 0 0 var(--space-sm) 0;
    font-family: var(--font-family);
    font-size: var(--fs-md);
    font-weight: var(--font-weight-bold);
    color: var(--navy-900);
  }

  .event-details p {
    margin: 0 0 var(--space-sm) 0;
    font-family: var(--font-family);
    font-size: var(--fs-sm);
    color: var(--navy-600);
  }

  .event-details .description {
    font-style: italic;
    color: var(--navy-500);
  }

  .event-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }*/

  /* Action Buttons 
  .action-btn {
    padding: var(--space-sm) var(--space-md);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--fs-sm);
    font-family: var(--font-family);
    font-weight: var(--font-weight-bold);
    transition: all 0.2s ease;
  }

  .action-btn.primary {
    background: var(--coral);
    color: var(--white);
  }

  .action-btn.primary:hover {
    background: var(--navy-600);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(240, 138, 119, 0.3);
  }

  .action-btn.secondary {
    background: var(--navy-100);
    color: var(--navy-700);
  }

  .action-btn.secondary:hover {
    background: var(--navy-200);
    transform: translateY(-2px);
  }

  .action-btn.danger {
    background: var(--red-100);
    color: var(--red-700);
  }

  .action-btn.danger:hover {
    background: var(--red-200);
    transform: translateY(-2px);
  }*/
  /* Settings Panel (bottom sheet) */
  .settings-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50vh;
    background: var(--white);
    border-top: 1px solid var(--ui-border);
    padding: var(--space-md);
    box-shadow: 0 -4px 20px rgba(15, 34, 48, 0.08);
    z-index: 220;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .settings-close {
    background: transparent;
    border: none;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .settings-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: 12px;
    color: var(--text-secondary);
  }

  .settings-row .inputs {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .settings-logs {
    margin-top: var(--space-sm);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .timeline-section {
      width: 100%;
      height: 50vh;
    }
    /*.content-section {
      width: 100vw;
      height: 50vh;
      top: 50vh;
      padding: var(--space-sm);
    }*/

    /* (header removed in mobile) */
  }
</style>