<script lang="ts">
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import { events, selectedDate } from "../../stores/data.js";
  import type { Event as MyEvent } from "../../types.js";

  // props using Svelte 5 runes
  interface Props {
    showLog?: boolean;
    externalGaps?: Array<{ start: string; end: string; duration: number }> | null;
  }
  let { showLog = $bindable(false), externalGaps = $bindable(null) }: Props = $props();

  // DOM refs
  let containerElement: HTMLDivElement | null = null;
  let svgElement: SVGSVGElement | null = null;

  // measured size
  let containerWidth = $state(0);
  let containerHeight = $state(0);

  // dispatcher
  const dispatch = createEventDispatcher<{ eventSelected: MyEvent; gapSelected: any }>();

  // Subscribe to all events; per-day selection handled in normalize like CalendarView
  let allEvents = $state<MyEvent[]>([]);
  const unsubEvents = events.subscribe((v) => (allEvents = v));
  // Track selected date locally for normalization
  let selectedDateCurrent = $state(new Date());
  const unsubSelected = selectedDate.subscribe((d) => {
    selectedDateCurrent = new Date(d);
  });

  // Full circle: 360 degrees, centered
  const fullCircleDegrees = 360;
  const fullCircleRadians = (fullCircleDegrees * Math.PI) / 180;
  
  // center/radius calculation - centered in container
  let radius = $derived(Math.min(containerHeight * 0.4, containerWidth * 0.4)); // Smaller to leave room for labels
  let centerY = $derived(containerHeight / 2);
  let centerX = $derived(containerWidth / 2);

  // Current time for central display
  let currentTime = $state(new Date());
  let currentTimeString = $derived(dateToHM(currentTime));
  let selectedDateString = $derived(formatDate(selectedDateCurrent));

  // Utility: time string "HH:MM" -> angle (0 = top/12:00, clockwise, full 360°)
  function timeStringToAngle(time: string): number {
    const [h, m] = time.split(":").map(Number);
    const minutes = h * 60 + m;
    // 0° = top (12:00), increasing clockwise, full 360°
    return (minutes / (24 * 60)) * fullCircleRadians;
  }

  // Date -> "HH:MM"
  function dateToHM(d: Date) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // Date -> formatted date string (e.g., "Jan 15, 2024")
  function formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  // Normalized angle delta (0..2π) for SVG arc calculations
  function normalizedAngleDelta(start: number, end: number): number {
    let delta = end - start;
    if (delta < 0) delta += fullCircleRadians;
    return delta;
  }

  // Build slope path for gap indicators (starts small, gets taller toward end)
  function buildSlopePath(
    startAngle: number,
    endAngle: number,
    gapRingRadius: number,
    centerX: number,
    centerY: number,
    minHeight: number,
    maxHeight: number,
    numSegments: number
  ): string {
    const delta = normalizedAngleDelta(startAngle, endAngle);
    const outerPoints: string[] = [];
    const innerPoints: string[] = [];
    
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const angle = startAngle + t * delta;
      const x = centerX + gapRingRadius * Math.cos(angle - Math.PI / 2);
      const y = centerY + gapRingRadius * Math.sin(angle - Math.PI / 2);
      
      if (i === 0) {
        outerPoints.push(`M ${x},${y}`);
      } else {
        outerPoints.push(`L ${x},${y}`);
      }
      
      const height = minHeight + t * (maxHeight - minHeight);
      const directionAngle = angle - Math.PI / 2;
      const innerX = x + height * Math.cos(directionAngle);
      const innerY = y + height * Math.sin(directionAngle);
      innerPoints.push(`${innerX},${innerY}`);
    }
    
    return `${outerPoints.join(' ')} L ${innerPoints.reverse().join(' L ')} Z`;
  }

  // Event -> SVG arc path with lane (full circle)
  function eventToArcPathWithLane(startA: number, endA: number, laneIndex: number) {
    if (endA < startA) endA += fullCircleRadians;

    // Lane-based ring radius packing (outer to inner)
    const laneStep = 0.07; // 8% inward per lane (increased for more spacing)
    const ringRadius = radius * (0.85 - laneIndex * laneStep);

    const toX = (a: number) => centerX + ringRadius * Math.cos(a - Math.PI / 2); // -π/2 rotates so 0° is top
    const toY = (a: number) => centerY + ringRadius * Math.sin(a - Math.PI / 2);

    const startX = toX(startA);
    const startY = toY(startA);
    const endX = toX(endA);
    const endY = toY(endA);

    const delta = normalizedAngleDelta(startA, endA);
    const largeArcFlag = delta > Math.PI ? 1 : 0;
    const sweepFlag = 1; // Clockwise for full circle
    const xAxisRotation = 0;

    return { 
      d: `M ${startX} ${startY} A ${ringRadius} ${ringRadius} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`, 
      ringRadius 
    };
  }

  // Normalize events for selected date (full 24-hour circle)
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
        // Handle all-day events: span full day (00:00 to 23:59)
        if (ev.timeLabel === "all-day") {
          const startStr = "00:00";
          const endStr = "23:59";
          return { ref: ev, startA: timeStringToAngle(startStr), endA: timeStringToAngle(endStr) };
        }
        
        // For timed events, truncate at day boundaries
        let s = new Date(ev.start);
        let e = new Date(ev.end);
        if (s.getTime() < ds) s = new Date(ds);
        if (e.getTime() > de) e = new Date(de);
        const startStr = dateToHM(s);
        const endStr = dateToHM(e);
        return { ref: ev, startA: timeStringToAngle(startStr), endA: timeStringToAngle(endStr) };
      })
      .sort((a, b) => a.startA - b.startA);

    // Separate timed and all-day events for proper lane packing
    const timedEvents = truncated.filter(ev => ev.ref.timeLabel !== "all-day");
    const allDayEvents = truncated.filter(ev => ev.ref.timeLabel === "all-day");
    
    // Pack timed events first (they go to outer lanes starting from lane 0)
    const laneEnds: number[] = [];
    const timedPlaced: { startA: number; endA: number; lane: number; ref: MyEvent }[] = [];
    
    for (const ev of timedEvents) {
      let placedLane = 0;
      let endAdj = ev.endA < ev.startA ? ev.endA + fullCircleRadians : ev.endA;
      for (let i = 0; i < laneEnds.length; i++) {
        if (ev.startA >= laneEnds[i]) { placedLane = i; break; }
        placedLane = laneEnds.length;
      }
      if (placedLane === laneEnds.length) laneEnds.push(endAdj); 
      else laneEnds[placedLane] = Math.max(laneEnds[placedLane], endAdj);
      timedPlaced.push({ startA: ev.startA, endA: endAdj, lane: placedLane, ref: ev.ref });
    }
    
    // All timed events are now in their final lanes (lane 0, 1, 2, ...)
    // All-day events go to inner lanes after the last timed event lane
    const maxTimedLane = timedPlaced.length > 0 ? Math.max(...timedPlaced.map(p => p.lane)) : -1;
    const allDayPlaced = allDayEvents.map((ev, index) => {
      let endAdj = ev.endA < ev.startA ? ev.endA + fullCircleRadians : ev.endA;
      // All-day events go to inner lanes starting from maxTimedLane + 1
      const innerLane = maxTimedLane + 1 + index;
      return { startA: ev.startA, endA: endAdj, lane: innerLane, ref: ev.ref };
    });
    
    // Combine: timed events keep their lanes (lane 0 will always be at 0.85 radius), all-day in inner lanes
    return [...timedPlaced, ...allDayPlaced];
  }

  // Render events only when measurements available
  let renderedEvents = $derived((containerWidth > 0 && containerHeight > 0 && radius > 0)
    ? normalizeEventsForDate(allEvents, selectedDateCurrent)
    : []);

  // Free-time gaps (full circle)
  let gaps = $derived((containerWidth > 0 && containerHeight > 0 && radius > 0)
    ? (externalGaps ?? []).map((g) => {
      const startA = timeStringToAngle(g.start);
      let endA = timeStringToAngle(g.end);
      if (endA < startA) endA = endA + fullCircleRadians;
      return { ...g, startAngle: startA, endAngle: endA };
    })
    : []);

  // Resize handling
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
    
    // Update current time every minute
    const interval = setInterval(() => {
      currentTime = new Date();
    }, 60000);
    
    return () => {
      if (resizeObserver && containerElement) resizeObserver.unobserve(containerElement);
      clearInterval(interval);
      unsubEvents();
      unsubSelected();
    };
  });

  // Hover state
  let hoveredEvent = $state<MyEvent | null>(null);
  let hoveredGap = $state<{ start: string; end: string; duration: number } | null>(null);

  function onEventClick(ev: MyEvent) {
    dispatch("eventSelected", ev);
  }
  function onGapClick(gap: { start: string; end: string; duration: number }) {
    dispatch("gapSelected", gap);
  }
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
    <defs>
      <!-- Orange/amber gradient for timed events -->
      <linearGradient id="eventGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FF8C42;stop-opacity:0.9" />
        <stop offset="50%" style="stop-color:#FFA500;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#FFD700;stop-opacity:0.9" />
      </linearGradient>
      
      <!-- Gradient for all-day events (slightly different, more subtle) -->
      <linearGradient id="allDayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFB84D;stop-opacity:0.4" />
        <stop offset="50%" style="stop-color:#FFC966;stop-opacity:0.5" />
        <stop offset="100%" style="stop-color:#FFD98C;stop-opacity:0.4" />
      </linearGradient>
      
      <!-- Radial gradient for innermost all-day sector (for depth effect) -->
      <radialGradient id="allDaySectorGradient" cx="50%" cy="50%" r="70%">
        <stop offset="0%" style="stop-color:#FFC966;stop-opacity:0.15" />
        <stop offset="60%" style="stop-color:#FFB84D;stop-opacity:0.25" />
        <stop offset="100%" style="stop-color:#FFA500;stop-opacity:0.35" />
      </radialGradient>
      
      <!-- Glow filter for events -->
      <filter id="eventGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- Soft glow for gaps -->
      <filter id="gapGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- Glass effect filter for gap bars -->
      <filter id="gapGlass" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1" result="blur"/>
        <feOffset in="blur" dx="0" dy="1" result="offsetBlur"/>
        <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.5" specularExponent="20" result="specOut">
          <fePointLight x="50%" y="0%" z="200"/>
        </feSpecularLighting>
        <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
        <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
      </filter>
      
      <!-- Inner shadow for depth -->
      <filter id="innerShadow">
        <feOffset dx="0" dy="2"/>
        <feGaussianBlur stdDeviation="2" result="offsetblur"/>
        <feComposite operator="out" in="SourceGraphic" in2="offsetblur" result="inverse"/>
        <feFlood flood-color="#000000" flood-opacity="0.1" result="color"/>
        <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
        <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
      </filter>
    </defs>

    <!-- Outer base ring (glass-like) - must match lane 0 radius exactly -->
    {#if containerWidth > 0 && containerHeight > 0 && radius > 0}
      {@const laneStep = 0.07}
      {@const baseRingRadius = radius * (0.85 - 0 * laneStep)}
      <circle
        cx={centerX}
        cy={centerY}
        r={baseRingRadius}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        stroke-width={2}
        opacity={0.6}
      />
      
      <!-- Outer rim with subtle glow -->
      <circle
        cx={centerX}
        cy={centerY}
        r={baseRingRadius}
        fill="none"
        stroke="rgba(255,140,66,0.15)"
        stroke-width={1}
        filter="url(#gapGlow)"
        opacity={0.5}
      />
    {/if}

    <!-- 24-hour tick marks and labels -->
    {#if containerWidth > 0 && containerHeight > 0 && radius > 0}
      {@const laneStep = 0.07}
      {@const baseRingRadius = radius * (0.85 - 0 * laneStep)}
      {#each Array.from({ length: 24 }, (_, i) => i) as hour}
        {@const angle = (hour / 24) * fullCircleRadians - Math.PI / 2}
        {@const innerRadius = baseRingRadius * 0.965}
        {@const outerRadius = baseRingRadius * 1.035}
        {@const labelRadius = radius * 0.95}
        {@const innerX = centerX + innerRadius * Math.cos(angle)}
        {@const innerY = centerY + innerRadius * Math.sin(angle)}
        {@const outerX = centerX + outerRadius * Math.cos(angle)}
        {@const outerY = centerY + outerRadius * Math.sin(angle)}
        {@const labelX = centerX + labelRadius * Math.cos(angle)}
        {@const labelY = centerY + labelRadius * Math.sin(angle)}
        {@const isMajorHour = hour % 6 === 0}
        
        <line 
          x1={innerX} 
          y1={innerY} 
          x2={outerX} 
          y2={outerY} 
          stroke={isMajorHour ? "rgba(255,140,66,0.4)" : "rgba(0,0,0,0.15)"}
          stroke-width={isMajorHour ? 2 : 1}
          opacity={isMajorHour ? 1 : 0.6}
        />
        
        {#if isMajorHour}
          <text 
            x={labelX} 
            y={labelY + 4} 
            font-family="var(--font-family)" 
            font-size="11" 
            fill="var(--text-secondary)" 
            text-anchor="middle"
            font-weight="var(--font-weight-normal)"
            opacity="0.8"
          >
            {String(hour).padStart(2, '0')}
          </text>
        {/if}
      {/each}
    {/if}

    <!-- Event arcs with orange/amber gradient and glow -->
    {#if containerWidth > 0 && containerHeight > 0 && radius > 0}
      {@const maxLane = Math.max(...renderedEvents.map(e => e.lane), 0)}
      {#each renderedEvents as ev (ev.ref.id)}
        {@const pathData = eventToArcPathWithLane(ev.startA, ev.endA, ev.lane)}
        {@const isInnerMost = ev.lane === maxLane}
        {@const isAllDay = ev.ref.timeLabel === "all-day"}
        {@const endAdj = ev.endA < ev.startA ? ev.endA + fullCircleRadians : ev.endA}
        {@const toX = (a: number) => centerX + pathData.ringRadius * Math.cos(a - Math.PI / 2)}
        {@const toY = (a: number) => centerY + pathData.ringRadius * Math.sin(a - Math.PI / 2)}
        {@const sx = toX(ev.startA)}
        {@const sy = toY(ev.startA)}
        {@const ex = toX(endAdj)}
        {@const ey = toY(endAdj)}
        {@const delta = normalizedAngleDelta(ev.startA, endAdj)}
        {@const largeArcFlag = delta > Math.PI ? 1 : 0}
        {@const isAllDayInnermost = isInnerMost && isAllDay}
        
        {#if isAllDayInnermost}
          <!-- Innermost all-day events: render as filled ring sector from inner cutoff to event ring -->
          {@const defaultInnerRadius = radius * 0.5}
          {@const laneStep = 0.07}
          {@const maxLaneCheck = Math.max(...renderedEvents.map(e => e.lane), 0)}
          {@const innermostEventRadiusCheck = radius * (0.85 - maxLaneCheck * laneStep)}
          {@const innerRadius = innermostEventRadiusCheck < defaultInnerRadius ? innermostEventRadiusCheck : defaultInnerRadius}
          {@const outerRadius = pathData.ringRadius}
          {@const innerStartX = centerX + innerRadius * Math.cos(ev.startA - Math.PI / 2)}
          {@const innerStartY = centerY + innerRadius * Math.sin(ev.startA - Math.PI / 2)}
          {@const innerEndX = centerX + innerRadius * Math.cos(endAdj - Math.PI / 2)}
          {@const innerEndY = centerY + innerRadius * Math.sin(endAdj - Math.PI / 2)}
          {@const sectorPath = `M ${innerStartX} ${innerStartY} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEndX} ${innerEndY} L ${ex} ${ey} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${sx} ${sy} Z`}
          
          <path
            d={sectorPath}
            fill="url(#allDaySectorGradient)"
            fill-opacity="1"
            stroke="url(#allDayGradient)"
            stroke-width={6}
            class={`event-arc all-day-innermost ${hoveredEvent?.id === ev.ref.id ? 'hovered' : ''}`}
            role="button"
            tabindex="0"
            aria-label={`All-day event: ${ev.ref.title}`}
            onmouseenter={() => (hoveredEvent = ev.ref)}
            onmouseleave={() => (hoveredEvent = null)}
            onclick={() => onEventClick(ev.ref)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick(ev.ref); } }}
          />
        {:else if isAllDay}
          <!-- Other all-day events: render as thicker arc with all-day gradient -->
          <path
            d={pathData.d}
            fill="none"
            stroke="url(#allDayGradient)"
            stroke-width={10}
            stroke-linecap="round"
            class={`event-arc all-day ${hoveredEvent?.id === ev.ref.id ? 'hovered' : ''}`}
            role="button"
            tabindex="0"
            aria-label={`All-day event: ${ev.ref.title}`}
            onmouseenter={() => (hoveredEvent = ev.ref)}
            onmouseleave={() => (hoveredEvent = null)}
            onclick={() => onEventClick(ev.ref)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick(ev.ref); } }}
          />
        {:else}
          <!-- Timed events: render with standard gradient and glow -->
          <path
            d={pathData.d}
            fill="none"
            stroke="url(#eventGradient)"
            stroke-width={8}
            class={`event-arc timed ${hoveredEvent?.id === ev.ref.id ? 'hovered' : ''}`}
            filter="url(#eventGlow)"
            role="button"
            tabindex="0"
            aria-label={`Event: ${ev.ref.title}`}
            onmouseenter={() => (hoveredEvent = ev.ref)}
            onmouseleave={() => (hoveredEvent = null)}
            onclick={() => onEventClick(ev.ref)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick(ev.ref); } }}
          />
        {/if}
      {/each}
    {/if}

    <!-- Gap indicators: slope shape extending inward, taller toward the end -->
    {#if containerWidth > 0 && containerHeight > 0 && radius > 0}
      {@const laneStep = 0.07}
      {@const baseRingRadius = radius * (0.85 - 0 * laneStep)}
      {#each gaps as gap (gap.start + gap.end)}
        {@const startA = gap.startAngle}
        {@const endA = gap.endAngle}
        {@const endAdj = endA < startA ? endA + fullCircleRadians : endA}
        {@const gapRingRadius = baseRingRadius}
        {@const delta = normalizedAngleDelta(startA, endAdj)}
        
        <!-- Create slope: starts small at beginning, taller at end -->
        {@const minHeight = 3}
        {@const maxHeight = 20}
        {@const numSegments = Math.max(30, Math.floor(gap.duration / 3))}
        {@const pathData = buildSlopePath(startA, endAdj, gapRingRadius, centerX, centerY, minHeight, maxHeight, numSegments)}
        
        <path
          d={pathData}
          fill="#90EE90"
          stroke="none"
          class={`gap-slope ${hoveredGap?.start === gap.start && hoveredGap?.end === gap.end ? 'hovered' : ''}`}
          role="button"
          tabindex="0"
          aria-label={`Free time from ${gap.start} to ${gap.end}, ${gap.duration} minutes available`}
          onmouseenter={() => (hoveredGap = { start: gap.start, end: gap.end, duration: gap.duration })}
          onmouseleave={() => (hoveredGap = null)}
          onclick={() => onGapClick({ start: gap.start, end: gap.end, duration: gap.duration })}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGapClick({ start: gap.start, end: gap.end, duration: gap.duration }); } }}
          opacity="0.85"
        />
      {/each}
    {/if}

    <!-- Inner ring mask (glass effect, cut off center) -->
    {#if containerWidth > 0 && containerHeight > 0 && radius > 0}
      {@const defaultInnerRadius = radius * 0.5}
      {@const laneStep = 0.07}
      {@const maxLane = Math.max(...renderedEvents.map(e => e.lane), 0)}
      {@const innermostEventRadius = radius * (0.85 - maxLane * laneStep)}
      {@const innerRadius = innermostEventRadius < defaultInnerRadius ? innermostEventRadius : defaultInnerRadius}
      
      <circle
        cx={centerX}
        cy={centerY}
        r={innerRadius}
        fill="var(--bg-primary)"
        stroke="rgba(0,0,0,0.05)"
        stroke-width={1}
        filter="url(#innerShadow)"
        opacity={0.95}
      />
    {/if}
  </svg>

  <!-- Central date display (futuristic readout) -->
  {#if containerWidth > 0 && containerHeight > 0 && radius > 0}
    <div class="central-display" style={`left: ${centerX}px; top: ${centerY - 30}px;`}>
      <div class="time-readout">{selectedDateString}</div>
      <div class="time-label">Selected Date</div>
    </div>
  {/if}

  <!-- Event tooltip -->
  {#if hoveredEvent}
    <div class="event-tooltip" style={`left: ${centerX + radius * 0.6}px; top: ${centerY - 20}px;`}>
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
    <div class="gap-tooltip" style={`left: ${centerX + radius * 1.1}px; top: ${centerY - 20}px;`}>
      <div class="tooltip-content">
        <h4>Free Time</h4>
        <p>{hoveredGap.start} - {hoveredGap.end}</p>
        <p class="duration">{hoveredGap.duration} minutes available</p>
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
    </div>
  {/if}
</div>

<style>
  .circular-timeline-container { 
    position: relative; 
    width: 100%; 
    height: 100%; 
    overflow: visible;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .circular-timeline-svg {
    filter: drop-shadow(0 4px 12px rgba(255,140,66,0.1));
  }
  
  .event-arc { 
    cursor: pointer; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
  }
  
  .event-arc:focus {
    outline: none;
  }
  
  /* Timed events styling */
  .event-arc.timed {
    opacity: 0.9;
  }
  
  .event-arc.timed.hovered { 
    stroke-width: 12 !important;
    opacity: 1;
    filter: url(#eventGlow);
  }
  
  /* All-day events styling */
  .event-arc.all-day {
    opacity: 0.85;
    filter: none;
  }
  
  .event-arc.all-day.hovered {
    stroke-width: 12 !important;
    opacity: 1;
  }
  
  /* Innermost all-day events (sectors) */
  .event-arc.all-day-innermost {
    opacity: 1;
    filter: none;
  }
  
  .event-arc.all-day-innermost.hovered {
    stroke-width: 8 !important;
    opacity: 1;
    filter: drop-shadow(0 0 8px rgba(255,184,77,0.4));
  }
  
  /* Mobile: smaller stroke width for better lane distinction */
  @media (max-width: 768px) {
    .event-arc.timed {
      stroke-width: 5;
    }
    
    .event-arc.timed.hovered {
      stroke-width: 8 !important;
    }
    
    .event-arc.all-day {
      stroke-width: 6;
    }
    
    .event-arc.all-day.hovered {
      stroke-width: 9 !important;
    }
    
    .event-arc.all-day-innermost {
      stroke-width: 4;
    }
    
    .event-arc.all-day-innermost.hovered {
      stroke-width: 6 !important;
    }
  }
  
   .gap-slope {
     cursor: pointer;
     transition: all 0.2s ease;
   }
   
   .gap-slope.hovered {
     opacity: 1 !important;
     filter: drop-shadow(0 0 6px rgba(144, 238, 144, 0.5));
   }
   
   .gap-slope:focus {
     outline: none;
   }
   
   /* Mobile: gap bars are already responsive via barHeight calculation */
  
  .central-display {
    position: absolute;
    transform: translateX(-50%);
    text-align: center;
    pointer-events: none;
    z-index: 10;
  }
  
  .time-readout {
    font-family: var(--font-family);
    font-size: 28px;
    font-weight: var(--font-weight-light);
    color: var(--text-primary);
    letter-spacing: 0.05em;
    text-shadow: 0 0 8px rgba(255,140,66,0.3);
    line-height: 1.2;
  }
  
  .time-label {
    font-family: var(--font-family);
    font-size: 10px;
    font-weight: var(--font-weight-light);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 4px;
    opacity: 0.7;
  }
  
  /* Mobile: smaller center date display */
  @media (max-width: 768px) {
    .time-readout {
      font-size: 18px;
      letter-spacing: 0.03em;
    }
    
    .time-label {
      font-size: 8px;
      margin-top: 2px;
    }
  }
  
  .event-tooltip, .gap-tooltip {
    position: absolute;
    background: var(--bg-card);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    box-shadow: var(--shadow-soft);
    z-index: 100;
    pointer-events: none;
    max-width: 200px;
    font-family: var(--font-family);
    font-size: var(--fs-sm);
  }
  
  .event-tooltip h4, .gap-tooltip h4 {
    font-size: var(--fs-md);
    font-weight: var(--font-weight-normal);
    color: var(--text-primary);
    margin: 0 0 var(--space-xs) 0;
  }
  
  .event-tooltip p, .gap-tooltip p {
    margin: var(--space-xs) 0;
    color: var(--text-secondary);
    font-size: var(--fs-sm);
  }
  
  .debug-overlay { 
    position: absolute; 
    left: 8px; 
    bottom: 100px; 
    background: rgba(0,0,0,0.6); 
    color: white; 
    font-size: 12px; 
    padding: 6px 8px; 
    border-radius: 6px; 
    display: grid; 
    gap: 2px; 
    pointer-events: none; 
  }
</style>
