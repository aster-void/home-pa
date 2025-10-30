<script lang="ts">
  import LogsView from "./LogsView.svelte";
  import { CircularTimeline } from "./pa_components/index.js";
  import { events, selectedDate } from "../stores/data.js";
  import type { Event, Gap } from "../types.js";
  import { GapFinder } from "../services/gap-finder.js";

  // Local state
  let showLogs = $state(false);
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
    const mapped = todaysEvents.map((e) => ({
      id: e.id,
      title: e.title,
      start: new Date(e.start).toTimeString().slice(0, 5),
      end: new Date(e.end).toTimeString().slice(0, 5),
    }));
    computedGaps = gf.findGaps(mapped);
  }

  // Recompute gaps when active hours, events, or date change
  $effect(() => {
    recomputeGaps();
  });

  // Component-level event handling is wired directly on the child via on: handlers below
</script>

<div class="personal-assistant-view">
  <!-- Header -->
  <header class="pa-header">
    <h1>Personal Assistant</h1>
    <div class="header-controls">
      <label class="active-hours">
        <span>Active:</span>
        <input type="time" bind:value={activeStart} onchange={recomputeGaps} />
        <span>–</span>
        <input type="time" bind:value={activeEnd} onchange={recomputeGaps} />
      </label>
      <button
        class="control-btn"
        class:active={showLogs}
        onclick={() => (showLogs = !showLogs)}
      >
        {showLogs ? "Hide" : "Show"} Logs
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="pa-main">
    <!-- Timeline Section - Left side circle -->
    <section class="timeline-section">
      <div class="timeline-container">
        <CircularTimeline
          side="left"
          arcDegrees={120}
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

  <!-- Developer Logs -->
  {#if showLogs}
    <section class="logs-section">
      <LogsView />
    </section>
  {/if}
</div>

<style>
  .personal-assistant-view {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  /* Header */
  .pa-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md) var(--space-md);
    background: var(--white);
    border-bottom: 2px solid var(--navy-100);
    box-shadow: 0 2px 10px rgba(15, 34, 48, 0.1);
  }

  .pa-header h1 {
    margin: 0;
    font-family: var(--font-family);
    font-size: var(--fs-xl);
    font-weight: var(--font-weight-bold);
    color: var(--navy-900);
  }

  .header-controls {
    display: flex;
    gap: var(--space-sm);
  }

  .control-btn {
    padding: var(--space-sm) var(--space-md);
    border: 2px solid var(--coral);
    background: transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--fs-sm);
    color: var(--coral);
    font-family: var(--font-family);
    font-weight: var(--font-weight-bold);
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background: var(--coral);
    color: var(--white);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(240, 138, 119, 0.3);
  }

  .control-btn.active {
    background: var(--coral);
    color: var(--white);
  }

  /* Main Layout */
  .pa-main {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
  }

  /* Timeline Section - Left side circle */
  .timeline-section {
    position: absolute;
    left: 0;
    top: 0;
    width: 50vw;
    height: 100vh;
    z-index: 10;
  }

  .timeline-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
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
  /* Logs Section */
  .logs-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50vh;
    background: var(--white);
    border-top: 2px solid var(--navy-100);
    padding: var(--space-lg);
    box-shadow: 0 -4px 20px rgba(15, 34, 48, 0.1);
    z-index: 200;
    overflow-y: auto;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .timeline-section {
      width: 100vw;
      height: 50vh;
    }

    /*.content-section {
      width: 100vw;
      height: 50vh;
      top: 50vh;
      padding: var(--space-sm);
    }*/

    .pa-header {
      padding: var(--space-sm) var(--space-sm);
    }

    .pa-header h1 {
      font-size: var(--fs-lg);
    }
  }
</style>