<script lang="ts">
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import { events, selectedDate } from "../../stores/data.js";
  import type { Event as MyEvent } from "../../types.js";

  // props (明示的にエクスポート)
  export let side: "left" | "right" = "left";
  export let arcDegrees: number = 120; // Arc angle in degrees
  export let opacity: number = 0.3;
  export let showLog: boolean = false; // toggles on-screen debug log panel
  export let externalGaps: Array<{ start: string; end: string; duration: number }> | null = null;

  // DOM refs
  let containerElement: HTMLDivElement | null = null;
  let svgElement: SVGSVGElement | null = null;

  // measured size
  let containerWidth = 0;
  let containerHeight = 0;

  // dispatcher
  const dispatch = createEventDispatcher<{ eventSelected: MyEvent; gapSelected: any }>();

  // Subscribe to all events; per-day selection handled in normalize like CalendarView
  let allEvents: MyEvent[] = [];
  const unsubEvents = events.subscribe((v) => (allEvents = v));
  // Track selected date locally for normalization
  let selectedDateCurrent: Date = new Date();
  const unsubSelected = selectedDate.subscribe((d) => {
    selectedDateCurrent = new Date(d);
  });

  // center/radius をリアクティブに計算
  $: radius = Math.min(containerHeight * 0.4, containerWidth * 0.4);
  $: centerY = containerHeight / 2;
  $: centerX = (side === "left"
    ? -radius * Math.cos(Math.PI / 3)
    : containerWidth + radius * Math.cos(Math.PI / 3));

  // Utility: time string "HH:MM" -> angle (0 .. arcDegrees), 0=top, increasing clockwise
  function timeStringToAngle(time: string) {
    const [h, m] = time.split(":").map(Number);
    const minutes = h * 60 + m;
    const arcRadians = (arcDegrees * Math.PI) / 180;
    return (minutes / (24 * 60)) * arcRadians;
  }

  // Date -> "HH:MM"
  function dateToHM(d: Date) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // 正規化された角度差（0..arcRadians の範囲）を返す（SVG arc の判断用）
  function normalizedAngleDelta(start: number, end: number) {
    const arcRadians = (arcDegrees * Math.PI) / 180;
    let delta = end - start;
    if (delta < 0) delta += arcRadians;
    return delta;
  }

  // イベント -> SVG A コマンド付き path（角度のラップや large/sweep を考慮）
  function eventToArcPathWithLane(startA: number, endA: number, laneIndex: number) {
    const arcRadians = (arcDegrees * Math.PI) / 180;
    if (endA < startA) endA += arcRadians;

    // Lane-based ring radius packing (outer to inner)
    const laneStep = 0.06; // 6% inward per lane
    const ringRadius = radius * (0.95 - laneIndex * laneStep);

    const toX = (a: number) => centerX + ringRadius * Math.cos(a - arcRadians / 2);
    const toY = (a: number) => centerY + ringRadius * Math.sin(a - arcRadians / 2);

    const startX = toX(startA);
    const startY = toY(startA);
    const endX = toX(endA);
    const endY = toY(endA);

    const delta = normalizedAngleDelta(startA, endA);
    const largeArcFlag = delta > Math.PI ? 1 : 0;
    const sweepFlag = side === "left" ? 1 : 0;
    const xAxisRotation = 0;

    return { d: `M ${startX} ${startY} A ${ringRadius} ${ringRadius} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`, ringRadius };
  }

  // Normalize events for selected date (truncate at day boundaries, like CalendarView)
  function normalizeEventsForDate(list: MyEvent[], day: Date): { startA: number; endA: number; lane: number; ref: MyEvent }[] {
    const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
    const ds = dayStart.getTime();
    const de = dayEnd.getTime();

    // Map and truncate
    const truncated = list
      .filter((ev) => {
        const s = new Date(ev.start).getTime();
        const e = new Date(ev.end).getTime();
        return s <= de && e >= ds;
      })
      .map((ev) => {
        let s = new Date(ev.start);
        let e = new Date(ev.end);
        if (s.getTime() < ds) s = new Date(ds);
        if (e.getTime() > de) e = new Date(de);
        const startStr = dateToHM(s);
        const endStr = dateToHM(e);
        return { ref: ev, startA: timeStringToAngle(startStr), endA: timeStringToAngle(endStr) };
      })
      .sort((a, b) => a.startA - b.startA);

    // Simple lane packing by non-overlap in angle space
    const laneEnds: number[] = []; // end angle per lane
    const placed: { startA: number; endA: number; lane: number; ref: MyEvent }[] = [];
    const arcRadians = (arcDegrees * Math.PI) / 180;
    for (const ev of truncated) {
      let placedLane = 0;
      // handle wrap for comparison by ensuring endA >= startA
      let endAdj = ev.endA < ev.startA ? ev.endA + arcRadians : ev.endA;
      for (let i = 0; i < laneEnds.length; i++) {
        if (ev.startA >= laneEnds[i]) { placedLane = i; break; }
        placedLane = laneEnds.length; // need new lane
      }
      if (placedLane === laneEnds.length) laneEnds.push(endAdj); else laneEnds[placedLane] = Math.max(laneEnds[placedLane], endAdj);
      placed.push({ startA: ev.startA, endA: endAdj, lane: placedLane, ref: ev.ref });
    }
    return placed;
  }

  // IMPORTANT: do not run normalization/rendering until we have container measurements
  $: renderedEvents = (containerWidth > 0 && containerHeight > 0 && radius > 0)
    ? normalizeEventsForDate(allEvents, selectedDateCurrent)
    : [];

  // Free-time gaps: rely only on external input; no local computation until size known
  $: gaps = (containerWidth > 0 && containerHeight > 0 && radius > 0)
    ? (externalGaps ?? []).map((g) => {
      const arcRadians = (arcDegrees * Math.PI) / 180;
      const startA = timeStringToAngle(g.start);
      let endA = timeStringToAngle(g.end);
      if (endA < startA) endA = endA + arcRadians; // handle wrap
      return { ...g, startAngle: startA, endAngle: endA };
    })
    : [];

  // resize handling (throttle)
  let resizeObserver: ResizeObserver | null = null;
  function handleResize() {
    if (!containerElement) return;
    const r = containerElement.getBoundingClientRect();
    containerWidth = r.width;
    containerHeight = r.height;
  }

  onMount(() => {
    handleResize();
    resizeObserver = new ResizeObserver(() => handleResize());
    if (containerElement) resizeObserver.observe(containerElement);
    return () => {
      if (resizeObserver && containerElement) resizeObserver.unobserve(containerElement);
      unsubEvents();
      unsubSelected();
    };
  });

  // hover state (local)
  let hoveredEvent: MyEvent | null = null;
  let hoveredGap: { start: string; end: string; duration: number } | null = null;

  function onEventClick(ev: MyEvent) {
    dispatch("eventSelected", ev);
  }
  function onGapClick(gap: { start: string; end: string; duration: number }) {
    dispatch("gapSelected", gap);
  }

  // Debug logs removed; geometry and overlays are always rendered
</script>

<div bind:this={containerElement} class="circular-timeline-container">
  <svg
    bind:this={svgElement}
    class="circular-timeline-svg"
    width="100%"
    height="100%"
    viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    preserveAspectRatio="none"
  >
    <!-- viewBox boundary -->
    <rect x="0" y="0" width={containerWidth} height={containerHeight} fill="none" stroke="lime" stroke-width="1" opacity="0.3" />
    <!-- center marker -->
    <circle cx={centerX} cy={centerY} r="4" fill="#00e5ff" opacity="0.8" />

    <!-- Base arc (outline of visible arc) -->
     {#if containerWidth > 0 && containerHeight > 0}
      {@const arcRadians = (arcDegrees * Math.PI) / 180}
      {@const startAngle = -arcRadians / 2}
      {@const endAngle = arcRadians / 2}
      {@const startX = centerX + radius * Math.cos(startAngle)}
      {@const startY = centerY + radius * Math.sin(startAngle)}
      {@const endX = centerX + radius * Math.cos(endAngle)}
      {@const endY = centerY + radius * Math.sin(endAngle)}
      {@const largeArcFlag = arcDegrees > 180 ? 1 : 0}
       {@const sweepFlag = side === "left" ? 0 : 1}
      
      <path
         d="M {startX} {startY} A {radius} {radius} 0 {largeArcFlag} {sweepFlag} {endX} {endY}"
        fill="none"
         stroke="rgba(15,34,48,0.1)"
         stroke-width={2}
         opacity={opacity}
      />

      <!-- lane guide rings using same packing as event lanes -->
      {@const lanesCount = Math.max(0, ...renderedEvents.map(e => e.lane)) + 1}
      {#each Array.from({ length: lanesCount }, (_, laneIndex) => laneIndex) as laneIndex}
        {@const laneStep = 0.06}
        {@const ringR = radius * (0.95 - laneIndex * laneStep)}
        {@const lsx = centerX + ringR * Math.cos(startAngle)}
        {@const lsy = centerY + ringR * Math.sin(startAngle)}
        {@const lex = centerX + ringR * Math.cos(endAngle)}
        {@const ley = centerY + ringR * Math.sin(endAngle)}
        <path
          d={`M ${lsx} ${lsy} A ${ringR} ${ringR} 0 ${largeArcFlag} 1 ${lex} ${ley}`}
          fill="none"
          stroke="#00c2ff"
          stroke-width="1.5"
          stroke-dasharray="4 4"
          opacity="0.6"
        />
        <!-- lane label near mid of arc -->
        {@const midA = 0}
        {@const lx = centerX + ringR * Math.cos(midA)}
        {@const ly = centerY + ringR * Math.sin(midA)}
        <text x={lx + 8} y={ly - 8} font-family="var(--font-family)" font-size="11" fill="#00c2ff" opacity="0.8">
          lane {laneIndex}
        </text>
      {/each}
    {/if}

    <!-- event arcs -->
    {#if containerWidth > 0 && containerHeight > 0 && radius > 0}
      {#each renderedEvents as ev (ev.ref.id)}
        {@const pathData = eventToArcPathWithLane(ev.startA, ev.endA, ev.lane)}
        <path
          d={pathData.d}
          fill="none"
           stroke={'red'}
           stroke-width={4}
          class={`event-arc ${hoveredEvent?.id === ev.ref.id ? 'hovered' : ''}`}
          role="button"
          tabindex="0"
          aria-label={`Event: ${ev.ref.title}`}
          on:mouseenter={() => (hoveredEvent = ev.ref)}
          on:mouseleave={() => (hoveredEvent = null)}
          on:click={() => onEventClick(ev.ref)}
          on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick(ev.ref); } }}
        />
        {@const arcRadians = (arcDegrees * Math.PI) / 180}
        {@const sx = centerX + pathData.ringRadius * Math.cos(ev.startA - arcRadians / 2)}
        {@const sy = centerY + pathData.ringRadius * Math.sin(ev.startA - arcRadians / 2)}
        {@const ex = centerX + pathData.ringRadius * Math.cos(ev.endA - arcRadians / 2)}
        {@const ey = centerY + pathData.ringRadius * Math.sin(ev.endA - arcRadians / 2)}
        <circle cx={sx} cy={sy} r="3.5" fill="#00ff88" />
        <circle cx={ex} cy={ey} r="3.5" fill="#ff8800" />
        <!-- event label -->
        <text x={sx} y={sy - 8} font-size="10" fill="#ff00ff" opacity="0.8">
          {Math.round(ev.startA * 100) / 100}→{Math.round(ev.endA * 100) / 100}
        </text>
      {/each}
    {/if}

    <!-- gap indicators as midpoint dots along the circle -->
    {#if containerWidth > 0 && containerHeight > 0 && radius > 0}
      {@const arcRadians = (arcDegrees * Math.PI) / 180}
      {#each gaps as gap (gap.start + gap.end)}
        {@const startA = gap.startAngle}
        {@const endA = gap.endAngle}
        {@const midA = (startA + endA) / 2}
        {@const ringR = radius * 1.02}
        {@const gx = centerX + ringR * Math.cos(midA - arcRadians / 2)}
        {@const gy = centerY + ringR * Math.sin(midA - arcRadians / 2)}
        <g transform={`translate(${gx}, ${gy})`}>
          <circle
            r={hoveredGap?.start === gap.start && hoveredGap?.end === gap.end ? 6 : 4}
            class={`gap-indicator ${hoveredGap?.start === gap.start && hoveredGap?.end === gap.end ? 'hovered' : ''}`}
            role="button"
            tabindex="0"
            aria-label={`Free time from ${gap.start} to ${gap.end}, ${gap.duration} minutes available`}
            on:mouseenter={() => (hoveredGap = { start: gap.start, end: gap.end, duration: gap.duration })}
            on:mouseleave={() => (hoveredGap = null)}
            on:click={() => onGapClick({ start: gap.start, end: gap.end, duration: gap.duration })}
            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGapClick({ start: gap.start, end: gap.end, duration: gap.duration }); } }}
          />
        </g>
      {/each}
    {/if}

    <!-- time markers (every hour, annotated every 4 hours) -->
    {#if containerWidth > 0 && containerHeight > 0 && radius > 0}
      {@const arcRadians = (arcDegrees * Math.PI) / 180}
      {#each Array.from({ length: 25 }, (_, i) => i) as hour}
        {@const angle = (hour / 24) * arcRadians - arcRadians / 2}
        {@const innerX = centerX + radius * 0.95 * Math.cos(angle)}
        {@const innerY = centerY + radius * 0.95 * Math.sin(angle)}
        {@const outerX = centerX + radius * 1.05 * Math.cos(angle)}
        {@const outerY = centerY + radius * 1.05 * Math.sin(angle)}
        <line x1={innerX} y1={innerY} x2={outerX} y2={outerY} stroke="rgba(15,34,48,0.2)" stroke-width="1" opacity={hour % 4 === 0 ? 0.6 : 0.3} />
        {#if hour % 4 === 0}
          <text x={outerX + 10} y={outerY + 5} font-family="var(--font-family)" font-size="12" fill="var(--navy-600)" opacity="0.7">
            {String(hour).padStart(2, '0')}:00
          </text>
        {/if}
      {/each}
    {/if}
  </svg>

  <!-- event tooltip (simple absolute positioned tooltip linked to center for demonstration) -->
  {#if hoveredEvent}
    <div class="event-tooltip" style={`left: ${centerX + radius * 0.7}px; top: ${centerY - 20}px;`}>
      <div class="tooltip-content">
        <h4>{hoveredEvent.title}</h4>
        <p>{dateToHM(new Date(hoveredEvent.start))} - {dateToHM(new Date(hoveredEvent.end))}</p>
        {#if hoveredEvent.description}
          <p class="description">{hoveredEvent.description}</p>
        {/if}
      </div>
    </div>
  {/if}

  {#if hoveredGap}
    <div class="gap-tooltip" style={`left: ${centerX + radius * 1.2}px; top: ${centerY - 20}px;`}>
      <div class="tooltip-content">
        <h4>Free Time</h4>
        <p>{hoveredGap.start} - {hoveredGap.end}</p>
        <p class="duration">{hoveredGap.duration} minutes available</p>
        <div class="suggestions">
          <button class="suggestion-btn">Add Task</button>
          <button class="suggestion-btn">Take Break</button>
        </div>
      </div>
    </div>
  {/if}
  {#if showLog}
    <div class="debug-overlay">
      <div>size: {Math.round(containerWidth)}×{Math.round(containerHeight)}</div>
      <div>events (all): {allEvents.length}</div>
      <div>events (rendered): {renderedEvents.length}</div>
      <div>gaps: {gaps.length}</div>
      <div>radius: {Math.round(radius)}</div>
      <div class="debug-list">
        <div class="debug-list-title">Rendered events (selected date):</div>
        {#if renderedEvents.length === 0}
          <div class="debug-empty">(no events)</div>
        {:else}
          <ul class="debug-events">
            {#each renderedEvents as ev}
              <li>
                <span class="ev-title">{ev.ref.title || '(untitled)'}:</span>
                <span class="ev-time">{dateToHM(new Date(ev.ref.start))}→{dateToHM(new Date(ev.ref.end))}</span>
                <span class="ev-meta">lane={ev.lane} startA={Math.round(ev.startA*100)/100} endA={Math.round(ev.endA*100)/100}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .circular-timeline-container { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .event-arc { cursor: pointer; transition: filter 0.15s, stroke-width 0.15s; opacity: 0.9; }
  .event-arc.hovered { stroke-width: 8 !important; filter: drop-shadow(0 0 8px currentColor); }
  .gap-indicator { fill: var(--coral); cursor: pointer; transform-origin: center; transition: filter 0.12s ease; }
  .gap-indicator:hover, .gap-indicator.hovered { filter: drop-shadow(0 0 6px var(--coral)); }
  /* tooltip styles ...（既存のスタイルを使用） */
  .debug-overlay { position: absolute; left: 8px; bottom: 100px; background: rgba(0,0,0,0.6); color: white; font-size: 12px; padding: 6px 8px; border-radius: 6px; display: grid; gap: 2px; pointer-events: none; }
</style>
