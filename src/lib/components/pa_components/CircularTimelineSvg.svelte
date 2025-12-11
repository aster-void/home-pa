<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { createEventDispatcher } from "svelte";
  import { selectedDate } from "../../stores/data.js";
  import {
    calendarEvents,
    calendarOccurrences,
  } from "../../stores/calendar.js";
  import type { Event as MyEvent } from "../../types.js";
  import type { ExpandedOccurrence } from "../../stores/calendar.js";
  import type {
    PendingSuggestion,
    AcceptedSuggestion,
  } from "../../stores/schedule.js";
  import SuggestionCard from "./SuggestionCard.svelte";

  interface Props {
    showLog?: boolean;
    externalGaps?: Array<{
      start: string;
      end: string;
      duration: number;
    }> | null;
    extraEvents?: MyEvent[] | null;
    pendingSuggestions?: PendingSuggestion[];
    acceptedSuggestions?: AcceptedSuggestion[];
    getTaskTitle?: (memoId: string) => string;
  }

  let {
    showLog = $bindable(false),
    externalGaps = $bindable(null),
    extraEvents = $bindable(null),
    pendingSuggestions = [],
    acceptedSuggestions = [],
    getTaskTitle = () => "Task",
  }: Props = $props();

  // DOM refs & sizing
  let containerElement: HTMLDivElement | null = null;
  let size = $state(300);

  // Dispatcher
  const dispatch = createEventDispatcher<{
    eventSelected: MyEvent;
    eventDelete: MyEvent;
    gapSelected: any;
    suggestionAccept: string;
    suggestionSkip: string;
    suggestionDelete: string;
    suggestionResize: { suggestionId: string; newDuration: number };
  }>();

  // Subscriptions
  let masterEvents = $state<MyEvent[]>([]);
  let occurrences = $state<ExpandedOccurrence[]>([]);
  let selectedDateCurrent = $state(new Date());

  const unsubEvents = calendarEvents.subscribe((v) => (masterEvents = v));
  const unsubOccurrences = calendarOccurrences.subscribe(
    (v) => (occurrences = v),
  );
  const unsubSelected = selectedDate.subscribe(
    (d) => (selectedDateCurrent = new Date(d)),
  );

  let centerDateInput: HTMLInputElement | null = null;

  // Combine events
  let allEvents = $derived.by(() => {
    const regular = masterEvents.filter(
      (e) => !e.recurrence || e.recurrence.type === "NONE",
    );
    const recurringIds = new Set(
      masterEvents
        .filter((e) => e.recurrence && e.recurrence.type !== "NONE")
        .map((e) => e.id),
    );
    const expanded: MyEvent[] = occurrences
      .filter((o) => recurringIds.has(o.masterEventId))
      .map((o) => ({
        id: o.id,
        title: o.title,
        start: o.start,
        end: o.end,
        description: o.description,
        address: o.location,
        importance: o.importance,
        timeLabel: o.timeLabel as "all-day" | "timed" | "some-timing",
      }));
    return [...regular, ...expanded, ...(extraEvents ?? [])];
  });

  // Constants
  const TWO_PI = Math.PI * 2;
  const center = 50; // SVG viewBox center
  const outerRadius = 42; // Outermost ring (reduced to make room for time indicators)
  const laneWidth = 5; // Width per lane
  const laneGap = 1; // Gap between lanes

  // Time utilities
  function timeToAngle(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return ((h * 60 + m) / (24 * 60)) * TWO_PI;
  }

  function dateToAngle(d: Date): number {
    return ((d.getHours() * 60 + d.getMinutes()) / (24 * 60)) * TWO_PI;
  }

  function dateToHM(d: Date): string {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatDate(d: Date): string {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getEffectiveEnd(ev: MyEvent): Date {
    // All-day events now have inclusive end dates (23:59:59.999), so use as-is
    return new Date(ev.end);
  }

  // Build arc path
  function arcPath(
    startAngle: number,
    endAngle: number,
    radius: number,
  ): string {
    if (endAngle < startAngle) endAngle += TWO_PI;
    const delta = endAngle - startAngle;
    const largeArc = delta > Math.PI ? 1 : 0;

    // Rotate -90deg so 0 is at top
    const x1 = center + radius * Math.cos(startAngle - Math.PI / 2);
    const y1 = center + radius * Math.sin(startAngle - Math.PI / 2);
    const x2 = center + radius * Math.cos(endAngle - Math.PI / 2);
    const y2 = center + radius * Math.sin(endAngle - Math.PI / 2);

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // Normalize events for date with lane packing
  interface NormalizedEvent {
    ref: MyEvent;
    startAngle: number;
    endAngle: number;
    lane: number;
  }

  let normalizedEvents = $derived.by((): NormalizedEvent[] => {
    const dayStart = new Date(selectedDateCurrent);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDateCurrent);
    dayEnd.setHours(23, 59, 59, 999);
    const ds = dayStart.getTime();
    const de = dayEnd.getTime();

    // Filter and map events
    const events = allEvents
      .filter((ev) => {
        const s = new Date(ev.start).getTime();
        const e = getEffectiveEnd(ev).getTime();
        return s <= de && e >= ds;
      })
      .map((ev) => {
        if (ev.timeLabel === "all-day") {
          return { ref: ev, startAngle: 0, endAngle: TWO_PI * 0.9999 };
        }
        let s = new Date(ev.start);
        let e = new Date(ev.end);
        if (s.getTime() < ds) s = dayStart;
        if (e.getTime() > de) e = dayEnd;
        return {
          ref: ev,
          startAngle: dateToAngle(s),
          endAngle: dateToAngle(e),
        };
      })
      .sort((a, b) => a.startAngle - b.startAngle);

    // Separate timed and all-day
    const timed = events.filter((e) => e.ref.timeLabel !== "all-day");
    const allDay = events.filter((e) => e.ref.timeLabel === "all-day");

    // Lane packing for timed events
    const laneEnds: number[] = [];
    const placed: NormalizedEvent[] = [];

    for (const ev of timed) {
      let lane = 0;
      const endAdj =
        ev.endAngle < ev.startAngle ? ev.endAngle + TWO_PI : ev.endAngle;

      for (let i = 0; i < laneEnds.length; i++) {
        if (ev.startAngle >= laneEnds[i]) {
          lane = i;
          break;
        }
        lane = laneEnds.length;
      }

      if (lane === laneEnds.length) laneEnds.push(endAdj);
      else laneEnds[lane] = Math.max(laneEnds[lane], endAdj);

      placed.push({ ...ev, endAngle: endAdj, lane });
    }

    // All-day events go to inner lanes
    const maxLane =
      placed.length > 0 ? Math.max(...placed.map((p) => p.lane)) : -1;
    const allDayPlaced = allDay.map((ev, i) => ({
      ...ev,
      endAngle:
        ev.endAngle < ev.startAngle ? ev.endAngle + TWO_PI : ev.endAngle,
      lane: maxLane + 1 + i,
    }));

    return [...placed, ...allDayPlaced];
  });

  // Normalize gaps
  interface NormalizedGap {
    start: string;
    end: string;
    duration: number;
    startAngle: number;
    endAngle: number;
  }

  let normalizedGaps = $derived.by((): NormalizedGap[] => {
    return (externalGaps ?? []).map((g) => ({
      ...g,
      startAngle: timeToAngle(g.start),
      endAngle: timeToAngle(g.end),
    }));
  });

  // Normalize suggestions
  interface NormalizedSuggestion {
    data: PendingSuggestion | AcceptedSuggestion;
    startAngle: number;
    endAngle: number;
    isAccepted: boolean;
  }

  let normalizedSuggestions = $derived.by((): NormalizedSuggestion[] => {
    const pending = pendingSuggestions.map((s) => ({
      data: s,
      startAngle: timeToAngle(s.startTime),
      endAngle: timeToAngle(s.endTime),
      isAccepted: false,
    }));
    const accepted = acceptedSuggestions.map((s) => ({
      data: s,
      startAngle: timeToAngle(s.startTime),
      endAngle: timeToAngle(s.endTime),
      isAccepted: true,
    }));
    return [...pending, ...accepted];
  });

  // Ring radii - gap arcs on outermost, then events, then suggestions
  const gapRingRadius = outerRadius - 1; // Outermost ring for gaps
  const eventBaseRadius = outerRadius - 6; // Events next layer in
  const suggestionRingRadius = outerRadius - 12; // Suggestions inner layer

  // Current time
  let currentTime = $state(new Date());
  let currentTimeAngle = $derived(dateToAngle(currentTime));

  // Hover state with fixed positioning
  let hoveredEvent = $state<MyEvent | null>(null);
  let hoveredGap = $state<NormalizedGap | null>(null);
  let mousePos = $state({ x: 0, y: 0 });

  function updateMouse(e: MouseEvent) {
    const pad = 15;
    let x = e.clientX + pad;
    let y = e.clientY - pad;
    if (x + 220 > window.innerWidth) x = e.clientX - 220 - pad;
    if (y < pad) y = pad;
    if (y + 100 > window.innerHeight) y = window.innerHeight - 100 - pad;
    mousePos = { x, y };
  }

  function hoverEvent(ev: MyEvent, e: MouseEvent) {
    hoveredEvent = ev;
    hoveredGap = null;
    updateMouse(e);
  }

  function hoverGap(gap: NormalizedGap, e: MouseEvent) {
    hoveredGap = gap;
    hoveredEvent = null;
    updateMouse(e);
  }

  function clearHover() {
    hoveredEvent = null;
    hoveredGap = null;
  }

  // Suggestion card state
  let selectedSuggestion = $state<{
    suggestion: PendingSuggestion | AcceptedSuggestion;
    isAccepted: boolean;
    position: { x: number; y: number };
  } | null>(null);

  // Drag state
  let isDragging = $state(false);
  let dragId = $state<string | null>(null);
  let dragStartY = $state(0);
  let dragOrigDuration = $state(0);

  // Handlers
  function handleCenterClick() {
    centerDateInput?.showPicker?.() ?? centerDateInput?.click();
  }

  function handleDateChange(e: Event) {
    const val = (e.target as HTMLInputElement)?.value;
    if (val) {
      const [y, m, d] = val.split("-").map(Number);
      const next = new Date(y, m - 1, d);
      next.setHours(0, 0, 0, 0);
      selectedDate.set(next);
    }
  }

  function onSuggestionClick(
    s: PendingSuggestion | AcceptedSuggestion,
    isAccepted: boolean,
    e: MouseEvent | KeyboardEvent,
  ) {
    let x: number, y: number;
    if (e instanceof MouseEvent) {
      x = e.clientX + 10;
      y = e.clientY - 50;
    } else {
      // For keyboard events, get position from the target element
      const target = e.currentTarget as SVGPathElement;
      const rect = target.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    selectedSuggestion = {
      suggestion: s,
      isAccepted,
      position: { x, y },
    };
  }

  function closeSuggestionCard() {
    selectedSuggestion = null;
  }
  function handleAccept() {
    if (selectedSuggestion)
      dispatch("suggestionAccept", selectedSuggestion.suggestion.suggestionId);
    closeSuggestionCard();
  }
  function handleSkip() {
    if (selectedSuggestion)
      dispatch("suggestionSkip", selectedSuggestion.suggestion.suggestionId);
    closeSuggestionCard();
  }
  function handleDelete() {
    if (selectedSuggestion)
      dispatch("suggestionDelete", selectedSuggestion.suggestion.suggestionId);
    closeSuggestionCard();
  }

  function startResize(id: string, duration: number, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    dragId = id;
    dragStartY = e.clientY;
    dragOrigDuration = duration;
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
  }

  function onDrag(e: MouseEvent) {
    if (!isDragging || !dragId) return;
    const delta = Math.round((dragStartY - e.clientY) / 5) * 5;
    dispatch("suggestionResize", {
      suggestionId: dragId,
      newDuration: Math.max(5, dragOrigDuration + delta),
    });
  }

  function endDrag() {
    isDragging = false;
    dragId = null;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", endDrag);
  }

  // Resize observer with throttle
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleResize() {
    if (!containerElement) return;
    const rect = containerElement.getBoundingClientRect();
    size = Math.min(rect.width, rect.height);
  }

  onMount(() => {
    handleResize();
    const ro = new ResizeObserver(() => {
      if (resizeTimeout) return;
      resizeTimeout = setTimeout(() => {
        handleResize();
        resizeTimeout = null;
      }, 50);
    });
    if (containerElement) ro.observe(containerElement);

    const interval = setInterval(() => {
      currentTime = new Date();
    }, 60000);

    return () => {
      ro.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      clearInterval(interval);
    };
  });

  onDestroy(() => {
    unsubEvents();
    unsubOccurrences();
    unsubSelected();
  });

  // Helper to get resize handle position
  function getHandlePos(
    endAngle: number,
    radius: number,
  ): { x: number; y: number } {
    const x = center + radius * Math.cos(endAngle - Math.PI / 2);
    const y = center + radius * Math.sin(endAngle - Math.PI / 2);
    return { x, y };
  }
</script>

<div bind:this={containerElement} class="timeline-container">
  <svg viewBox="0 0 100 100" class="timeline-svg">
    <defs>
      <!-- Gradients -->
      <linearGradient id="eventGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF6B6B" stop-opacity="0.9" />
        <stop offset="50%" stop-color="#FF8E53" stop-opacity="1" />
        <stop offset="100%" stop-color="#FFA726" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="pendingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#667EEA" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#764BA2" stop-opacity="0.8" />
      </linearGradient>
      <linearGradient id="acceptedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#11998E" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#38EF7D" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="gapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a8edea" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#fed6e3" stop-opacity="0.6" />
      </linearGradient>

      <!-- Glow filters -->
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="0.5" result="blur" />
        <feMerge
          ><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge
        >
      </filter>
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="0.3" result="blur" />
        <feMerge
          ><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge
        >
      </filter>
    </defs>

    <!-- Background rings -->
    <circle
      cx={center}
      cy={center}
      r={outerRadius}
      fill="none"
      stroke="rgba(0,0,0,0.1)"
      stroke-width="0.3"
    />
    <circle
      cx={center}
      cy={center}
      r={eventBaseRadius}
      fill="none"
      stroke="rgba(0,0,0,0.05)"
      stroke-width="0.2"
    />
    <circle
      cx={center}
      cy={center}
      r={suggestionRingRadius}
      fill="none"
      stroke="rgba(0,0,0,0.05)"
      stroke-width="0.2"
    />

    <!-- Hour markers -->
    {#each [0, 6, 12, 18] as hour}
      {@const angle = (hour / 24) * TWO_PI - Math.PI / 2}
      {@const x1 = center + (outerRadius - 0.5) * Math.cos(angle)}
      {@const y1 = center + (outerRadius - 0.5) * Math.sin(angle)}
      {@const x2 = center + (outerRadius + 1.5) * Math.cos(angle)}
      {@const y2 = center + (outerRadius + 1.5) * Math.sin(angle)}
      {@const lx = center + (outerRadius + 5) * Math.cos(angle)}
      {@const ly = center + (outerRadius + 5) * Math.sin(angle)}
      <line {x1} {y1} {x2} {y2} stroke="rgba(0,0,0,0.4)" stroke-width="0.5" />
      <circle
        cx={lx}
        cy={ly}
        r="2.5"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(0,0,0,0.2)"
        stroke-width="0.3"
      />
      <text
        x={lx}
        y={ly}
        font-size="3"
        font-weight="600"
        fill="rgba(0,0,0,0.8)"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        {String(hour).padStart(2, "0")}
      </text>
    {/each}

    <!-- Suggestion arcs -->
    {#each normalizedSuggestions as s (s.data.suggestionId)}
      {@const isPending = !s.isAccepted}
      {@const handlePos = getHandlePos(s.endAngle, suggestionRingRadius)}
      <path
        d={arcPath(s.startAngle, s.endAngle, suggestionRingRadius)}
        fill="none"
        stroke={isPending ? "url(#pendingGrad)" : "url(#acceptedGrad)"}
        stroke-width={isPending ? "2.5" : "3"}
        stroke-linecap="round"
        stroke-dasharray={isPending ? "2 1" : "none"}
        class="suggestion-arc"
        class:pending={isPending}
        class:accepted={!isPending}
        filter="url(#glow)"
        role="button"
        tabindex="0"
        aria-label={isPending ? `Pending suggestion: ${getTaskTitle(s.data.memoId)}` : `Accepted suggestion: ${getTaskTitle(s.data.memoId)}`}
        onclick={(e) => onSuggestionClick(s.data, s.isAccepted, e)}
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSuggestionClick(s.data, s.isAccepted, e);
          }
        }}
      />
      {#if !isPending}
        <circle
          cx={handlePos.x}
          cy={handlePos.y}
          r="1.2"
          fill="#38EF7D"
          stroke="rgba(255,255,255,0.9)"
          stroke-width="0.3"
          class="resize-handle"
          role="button"
          tabindex="0"
          aria-label="Resize suggestion duration"
          onmousedown={(e) =>
            startResize(s.data.suggestionId, s.data.duration, e)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              // For keyboard, we could show a dialog or use arrow keys
              // For now, just focus the element
            }
          }}
        />
      {/if}
    {/each}

    <!-- Event arcs with lane packing -->
    {#each normalizedEvents as ev (ev.ref.id)}
      {@const radius = eventBaseRadius - ev.lane * (laneWidth + laneGap)}
      {@const isAllDay = ev.ref.timeLabel === "all-day"}
      {@const midAngle = (ev.startAngle + ev.endAngle) / 2}
      {@const deleteX = center + (radius - 2) * Math.cos(midAngle - Math.PI / 2)}
      {@const deleteY = center + (radius - 2) * Math.sin(midAngle - Math.PI / 2)}
      <g class="event-group">
        <path
          d={arcPath(ev.startAngle, ev.endAngle, radius)}
          fill="none"
          stroke="url(#eventGrad)"
          stroke-width={isAllDay ? "2" : "3.5"}
          stroke-linecap="round"
          stroke-opacity={isAllDay ? 0.5 : 0.95}
          class="event-arc"
          class:all-day={isAllDay}
          filter="url(#glow)"
          role="button"
          tabindex="0"
          aria-label={`Event: ${ev.ref.title}`}
          onmouseenter={(e) => hoverEvent(ev.ref, e)}
          onmousemove={updateMouse}
          onmouseleave={clearHover}
          onclick={() => dispatch("eventSelected", ev.ref)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              dispatch("eventSelected", ev.ref);
            }
          }}
        />
        <!-- Delete button (small, appears on hover) -->
        <circle
          cx={deleteX}
          cy={deleteY}
          r="1.5"
          fill="rgba(239, 68, 68, 0.9)"
          stroke="white"
          stroke-width="0.3"
          class="delete-btn"
          role="button"
          tabindex="0"
          aria-label={`Delete event: ${ev.ref.title}`}
          onclick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${ev.ref.title}"?`)) {
              dispatch("eventDelete", ev.ref);
            }
          }}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              if (confirm(`Delete "${ev.ref.title}"?`)) {
                dispatch("eventDelete", ev.ref);
              }
            }
          }}
          style="cursor: pointer; opacity: 0; transition: opacity 0.2s;"
        />
        <text
          x={deleteX}
          y={deleteY}
          font-size="1.8"
          fill="white"
          text-anchor="middle"
          dominant-baseline="middle"
          class="delete-icon"
          aria-hidden="true"
          style="cursor: pointer; opacity: 0; transition: opacity 0.2s; pointer-events: none;"
        >×</text>
      </g>
    {/each}

    <!-- Gap arcs (outermost, rendered last to appear on top) -->
    {#each normalizedGaps as gap (gap.start + gap.end)}
      <path
        d={arcPath(gap.startAngle, gap.endAngle, gapRingRadius)}
        fill="none"
        stroke="url(#gapGrad)"
        stroke-width="3"
        stroke-linecap="round"
        class="gap-arc"
        filter="url(#softGlow)"
        role="button"
        tabindex="0"
        aria-label={`Free time gap: ${gap.start} to ${gap.end}`}
        onmouseenter={(e) => hoverGap(gap, e)}
        onmousemove={updateMouse}
        onmouseleave={clearHover}
        onclick={() => dispatch("gapSelected", gap)}
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            dispatch("gapSelected", gap);
          }
        }}
      />
    {/each}

    <!-- Current time indicator -->
    {#if true}
      {@const timeX =
        center + (outerRadius - 2) * Math.cos(currentTimeAngle - Math.PI / 2)}
      {@const timeY =
        center + (outerRadius - 2) * Math.sin(currentTimeAngle - Math.PI / 2)}
      <line
        x1={center}
        y1={center}
        x2={timeX}
        y2={timeY}
        stroke="#FF6B6B"
        stroke-width="0.5"
        stroke-linecap="round"
        filter="url(#glow)"
      />
      <circle
        cx={timeX}
        cy={timeY}
        r="1.2"
        fill="#FF6B6B"
        filter="url(#glow)"
      />
    {/if}

    <!-- Center circle -->
    <circle
      cx={center}
      cy={center}
      r="15"
      fill="rgba(255, 255, 255, 0.95)"
      stroke="rgba(0,0,0,0.1)"
      stroke-width="0.3"
    />
  </svg>

  <!-- Center display -->
  <button class="center-display" onclick={handleCenterClick}>
    <div class="date-text">{formatDate(selectedDateCurrent)}</div>
    <div class="date-label">tap to change</div>
  </button>

  <input
    bind:this={centerDateInput}
    type="date"
    class="hidden-input"
    value={selectedDateCurrent.toISOString().slice(0, 10)}
    onchange={handleDateChange}
  />

  <!-- Tooltips (fixed position) -->
  {#if hoveredEvent}
    <div class="tooltip" style="left: {mousePos.x}px; top: {mousePos.y}px;">
      <div class="tooltip-title">{hoveredEvent.title}</div>
      <div class="tooltip-time">
        {hoveredEvent.timeLabel === "all-day"
          ? "All day"
          : `${dateToHM(new Date(hoveredEvent.start))} - ${dateToHM(new Date(hoveredEvent.end))}`}
      </div>
      {#if hoveredEvent.description}
        <div class="tooltip-desc">{hoveredEvent.description}</div>
      {/if}
    </div>
  {/if}

  {#if hoveredGap}
    <div class="tooltip gap" style="left: {mousePos.x}px; top: {mousePos.y}px;">
      <div class="tooltip-title">Free Time</div>
      <div class="tooltip-time">{hoveredGap.start} - {hoveredGap.end}</div>
      <div class="tooltip-duration">{hoveredGap.duration} min available</div>
    </div>
  {/if}

  {#if showLog}
    <div class="debug">
      events: {normalizedEvents.length} | gaps: {normalizedGaps.length} | suggestions:
      {normalizedSuggestions.length}
    </div>
  {/if}

  <!-- Suggestion Card -->
  {#if selectedSuggestion}
    <div
      class="backdrop"
      onclick={closeSuggestionCard}
      onkeydown={(e) => e.key === "Escape" && closeSuggestionCard()}
      role="button"
      tabindex="-1"
      aria-label="Close"
    ></div>
    <SuggestionCard
      suggestion={selectedSuggestion.suggestion}
      taskTitle={getTaskTitle(selectedSuggestion.suggestion.memoId)}
      isAccepted={selectedSuggestion.isAccepted}
      position={selectedSuggestion.position}
      onAccept={handleAccept}
      onSkip={handleSkip}
      onDelete={handleDelete}
      onClose={closeSuggestionCard}
    />
  {/if}
</div>

<style>
  .timeline-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border-radius: 50%;
    overflow: visible;
  }

  .timeline-svg {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  .event-arc {
    cursor: pointer;
    transition:
      stroke-width 0.2s ease,
      stroke-opacity 0.2s ease;
  }

  .event-arc:hover {
    stroke-width: 5 !important;
    stroke-opacity: 1 !important;
  }

  .event-arc.all-day:hover {
    stroke-width: 3 !important;
  }

  .event-group {
    position: relative;
  }

  .event-group:hover .delete-btn {
    opacity: 1 !important;
    pointer-events: auto;
  }

  .event-group:hover .delete-icon {
    opacity: 1 !important;
    pointer-events: none;
  }

  .delete-btn:hover {
    r: 2;
    filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.8));
  }

  .gap-arc {
    cursor: pointer;
    transition: stroke-width 0.2s ease;
  }

  .gap-arc:hover {
    stroke-width: 4;
  }

  .suggestion-arc {
    cursor: pointer;
    transition: stroke-width 0.2s ease;
  }

  .suggestion-arc:hover {
    stroke-width: 4 !important;
  }

  .resize-handle {
    cursor: ns-resize;
    transition: r 0.15s ease;
  }

  .resize-handle:hover {
    r: 1.8;
  }

  .center-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: center;
    padding: 8px;
  }

  .date-text {
    font-size: clamp(10px, 3vw, 16px);
    font-weight: 300;
    color: rgba(0, 0, 0, 0.8);
    letter-spacing: 0.05em;
  }

  .date-label {
    font-size: clamp(6px, 1.5vw, 8px);
    color: rgba(0, 0, 0, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 2px;
  }

  .hidden-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .tooltip {
    position: fixed;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 10px 14px;
    z-index: 1000;
    pointer-events: none;
    max-width: 220px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: fadeIn 0.15s ease;
  }

  .tooltip.gap {
    border-color: rgba(168, 237, 234, 0.4);
  }

  .tooltip-title {
    font-size: 13px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.9);
    margin-bottom: 4px;
  }

  .tooltip-time {
    font-size: 11px;
    color: rgba(0, 0, 0, 0.7);
  }

  .tooltip-desc {
    font-size: 10px;
    color: rgba(0, 0, 0, 0.6);
    margin-top: 4px;
    font-style: italic;
  }

  .tooltip-duration {
    font-size: 11px;
    color: #11998e;
    margin-top: 2px;
  }

  .debug {
    position: absolute;
    bottom: 4px;
    left: 4px;
    font-size: 8px;
    color: rgba(0, 0, 0, 0.4);
    pointer-events: none;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 998;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .event-arc {
      stroke-width: 2.5;
    }
    .event-arc.all-day {
      stroke-width: 1.5;
    }
    .suggestion-arc {
      stroke-width: 2;
    }
    .gap-arc {
      stroke-width: 2;
    }
  }
</style>
