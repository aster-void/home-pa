<script lang="ts">
  import BaseCard from "./BaseCard.svelte";
  import { eventsForSelectedDate } from "../../stores/recurrence.store.js";
  import { selectedDate } from "../../stores/data.js";
  import type { Event } from "../../types.js";
  import { onMount } from "svelte";
  
    /************************************************************************
     * Note:
     * - I kept your original import lines and the key variable/function names.
     * - Added safer date parsing and ARIA/semantic improvements.
     ************************************************************************/
  
    // Get current time (kept variable name `currentTime` as requested)
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
  
    // Format time for display (kept `formatTime`)
    function formatTime(time: string): string {
      // Accept 'HH:MM' or ISO strings; try to parse robustly
      try {
        // If already "HH:MM"
        if (/^\d{1,2}:\d{2}$/.test(time)) {
          const [hours, minutes] = time.split(":").map(Number);
          const hour = hours;
          const ampm = hour >= 12 ? "PM" : "AM";
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${displayHour}:${String(minutes).padStart(2, "0")} ${ampm}`;
        }
        const d = new Date(time);
        if (!isNaN(d.getTime())) {
          const hours = d.getHours();
          const minutes = d.getMinutes();
          const ampm = hours >= 12 ? "PM" : "AM";
          const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
          return `${displayHour}:${String(minutes).padStart(2, "0")} ${ampm}`;
        }
      } catch (e) {
        // fallback
      }
      return time;
    }
  
    // Convert time to minutes for comparison (kept `timeToMinutes` but made robust)
    function timeToMinutes(time: string | Date): number {
      if (time instanceof Date) {
        return time.getHours() * 60 + time.getMinutes();
      }
      // time could be "HH:MM" or ISO string
      if (/^\d{1,2}:\d{2}$/.test(String(time))) {
        const [hours, minutes] = String(time).split(":").map(Number);
        return hours * 60 + minutes;
      }
      const d = new Date(String(time));
      if (!isNaN(d.getTime())) {
        return d.getHours() * 60 + d.getMinutes();
      }
      // fallback: 0
      return 0;
    }
  
    // Robust helper: normalize event start to Date (handles string/Date)
    function eventStartToDate(evStart: any, referenceDate?: Date): Date | null {
      if (!evStart) return null;
      // If it's already Date
      if (evStart instanceof Date) return evStart;
      // If it's a number (ms)
      if (typeof evStart === "number") return new Date(evStart);
      // If it's a string: could be ISO or "HH:MM" => if only time, combine with selectedDate
      if (typeof evStart === "string") {
        // ISO-like?
        const isoTry = new Date(evStart);
        if (!isNaN(isoTry.getTime())) return isoTry;
  
        // If format "HH:MM", attach to referenceDate (date without time)
        if (/^\d{1,2}:\d{2}$/.test(evStart) && referenceDate) {
          const [h, m] = evStart.split(":").map(Number);
          const d = new Date(referenceDate);
          d.setHours(h, m, 0, 0);
          return d;
        }
      }
      return null;
    }
  
    // Get upcoming events with locations (kept function name)
    function getUpcomingEventsWithLocation() {
      // Use $-store shorthand to read reactive value (Svelte)
      const selDate = $selectedDate ? new Date($selectedDate) : new Date();
      const dayStart = new Date(selDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selDate);
      dayEnd.setHours(23, 59, 59, 999);
  
      // Defensive: ensure $eventsForSelectedDate is iterable
      const evs = Array.isArray($eventsForSelectedDate) ? $eventsForSelectedDate : [];
  
      return evs
        .filter((event: Event) => {
          // require address
          if (!event?.address) return false;
  
          // normalize start
          const startDate = eventStartToDate(event.start, selDate);
          if (!startDate) return false;
  
          // check same day
          if (startDate < dayStart || startDate > dayEnd) return false;
  
          // check future relative to "now" if selected date is today
          if (startDate.toDateString() === new Date().toDateString()) {
            const eventMinutes = timeToMinutes(startDate);
            if (eventMinutes <= currentTime) return false;
          } else {
            // if selected date is in the past relative to today, filter out
            const sel = new Date(selDate);
            const today = new Date();
            sel.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            if (sel < today) return false;
          }
          return true;
        })
        .sort((a: any, b: any) => {
          const sa = eventStartToDate(a.start, selDate) || new Date(0);
          const sb = eventStartToDate(b.start, selDate) || new Date(0);
          return sa.getTime() - sb.getTime();
        });
    }
  
    // Dummy current location (kept `currentLocation`)
    const currentLocation = "Downtown Office Building, 123 Main St";
  
    // Generate dummy transit data with directions (kept name)
    function generateTransitSuggestion(event: Event) {
      const startDate = eventStartToDate(event.start, new Date($selectedDate)) || new Date();
      const eventStartMinutes = timeToMinutes(startDate);
      const timeUntilEvent = eventStartMinutes - currentTime;
  
      // ensure non-negative
      const ttl = Math.max(0, Math.round(timeUntilEvent));
  
      // Transit options simplified and textual (preserve your option types)
      const transitOptions = [
        {
          type: "🚶‍♂️ Walk",
          duration: Math.max(1, Math.floor(ttl * 0.35)), // tuned %
          description: "最短徒歩ルート。距離は近いが時間に余裕が必要。",
          directions: [
            "Main St を北へ進む",
            "5th Ave を右折",
            "約1.2km直進",
            "目的地に到着"
          ],
          distance: "0.8 miles"
        },
        {
          type: "🚌 Bus",
          duration: Math.max(1, Math.floor(ttl * 0.25)),
          description: "路線15（2停留所）を使用。発車間隔が短い場合は最速。",
          directions: [
            "Main St & 3rd Ave の停留所へ徒歩2分",
            "Route 15 に乗車（北行）",
            "Central Stationで下車（2停）",
            "徒歩5分で到着"
          ],
          distance: "1.2 miles"
        },
        {
          type: "🚇 Metro",
          duration: Math.max(1, Math.floor(ttl * 0.18)),
          description: "地下鉄（Blue → Green）を1回乗換。駅徒歩を含む。",
          directions: [
            "Downtown Metro Station へ徒歩3分",
            "Blue line に乗車（北行）",
            "Central Hub で Green line に乗換",
            "University Station 下車、徒歩2分"
          ],
          distance: "2.1 miles"
        },
        {
          type: "🚗 Drive",
          duration: Math.max(1, Math.floor(ttl * 0.12)),
          description: "車移動（通常時）。渋滞による変動あり。",
          directions: [
            "Main St を北へ進む",
            "Highway 101 に入る",
            "Exit 15 で University Ave へ",
            "University Ave を左折して到着"
          ],
          distance: "1.8 miles"
        }
      ];
  
      return {
        event,
        timeUntilEvent: ttl,
        currentLocation,
        destination: event.address,
        transitOptions: transitOptions.filter(option => option.duration > 0)
      };
    }
  
    // Format duration in minutes to human readable (kept `formatDuration`)
    function formatDuration(minutes: number): string {
      if (minutes <= 0) return "0m";
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    }
  
    // Reactive: compute upcoming events and transit suggestions
    // Keep names `upcomingEvents` and `transitSuggestions`
    $: upcomingEvents = getUpcomingEventsWithLocation();
    $: transitSuggestions = upcomingEvents.map(generateTransitSuggestion);
  
    // small runtime sanity-check log (dev-only)
    onMount(() => {
      // console.debug("Transit suggestions computed:", transitSuggestions);
    });
  </script>
  
  <BaseCard title="Transit Suggestions" class="transit-card">
    <h2 id="transit-title" class="sr-only">Transit suggestions</h2>
  
    {#if transitSuggestions.length === 0}
      <div class="no-transit" role="status" aria-live="polite">
        <p>No upcoming events with locations found.</p>
        <p class="no-transit-hint">住所つきのイベントを追加すると移動案内が表示されます。</p>
      </div>
    {:else}
      <div class="transit-list" aria-live="polite">
        {#each transitSuggestions as suggestion (suggestion.event.id || suggestion.event.start)}
          <article class="transit-item" aria-labelledby={"title-" + (suggestion.event.id || suggestion.event.start)}>
            <header class="event-header">
              <div class="event-info">
                <h3 id={"title-" + (suggestion.event.id || suggestion.event.start)} class="event-title">
                  {suggestion.event.title}
                </h3>
                <div class="event-details">
                  <div class="event-topline">
                    <time class="event-time" datetime={new Date(suggestion.event.start).toISOString()}>
                      {formatTime(new Date(suggestion.event.start).toISOString())}
                    </time>
                    <span class="dot-sep" aria-hidden="true">•</span>
                    <span class="event-location">📍 {suggestion.event.address}</span>
                  </div>
                  <div class="event-sub">
                    <span class="muted">予定の種類: {suggestion.event.timeLabel || "一般"}</span>
                  </div>
                </div>
              </div>
  
              <div class="time-until" aria-hidden="false">
                <span class="time-label">IN</span>
                <div class="time-value" aria-label={`Time until event: ${formatDuration(suggestion.timeUntilEvent)}`}>
                  {formatDuration(suggestion.timeUntilEvent)}
                </div>
              </div>
            </header>
  
            <!-- Route summary -->
            <div class="route-info" role="group" aria-label="Route summary">
              <div class="route-header">
                <span class="route-label">Route from</span>
              </div>
              <div class="location-flow">
                <div class="location-item current" title="current location">
                  <div class="location-icon" aria-hidden="true">📍</div>
                  <div class="location-text">{suggestion.currentLocation}</div>
                </div>
                <div class="route-arrow" aria-hidden="true">→</div>
                <div class="location-item destination">
                  <div class="location-icon" aria-hidden="true">🎯</div>
                  <div class="location-text">{suggestion.destination}</div>
                </div>
              </div>
            </div>
  
            <!-- Transit options: condensed list with progressive disclosure -->
            <div class="transit-options" role="list" aria-label="Transit options">
              {#each suggestion.transitOptions as option, idx (option.type)}
                <div class="transit-option" role="listitem" aria-labelledby={"opt-" + (suggestion.event.id || suggestion.event.start) + "-" + idx}>
                  <div class="option-header">
                    <div id={"opt-" + (suggestion.event.id || suggestion.event.start) + "-" + idx} class="option-type">
                      <strong>{option.type}</strong>
                      <span class="option-distance" aria-hidden="true"> — {option.distance}</span>
                    </div>
                    <div class="option-duration" aria-label={`Duration ${formatDuration(option.duration)}`}>
                      {formatDuration(option.duration)}
                    </div>
                  </div>
                  <div class="option-description">{option.description}</div>
  
                  <!-- Directions: textual, accessible -->
                  <div class="directions" aria-label="Directions">
                    <div class="directions-header">Directions</div>
                    <ol class="directions-list">
                      {#each option.directions as direction}
                        <li class="direction-step">{direction}</li>
                      {/each}
                    </ol>
                  </div>
                </div>
              {/each}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </BaseCard>
  
  <style>
    /* small utility */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }
  
    /* Use project design system variables */
  
    .no-transit {
      text-align: center;
      padding: 1.6rem 1rem;
      color: var(--muted);
    }
  
    .no-transit-hint {
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }
  
    .transit-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  
    .transit-item {
      background: var(--bg-card);
      border: 1px solid rgba(15, 34, 48, 0.05);
      border-radius: var(--radius-md);
      padding: var(--space-md);
      box-shadow: var(--shadow-subtle);
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
  
    .transit-item:focus-within,
    .transit-item:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-soft);
      border-color: var(--primary);
    }
  
    /* header */
    .event-header {
      display: flex;
      justify-content: space-between;
      gap: var(--space-md);
      align-items: start;
      margin-bottom: 0.75rem;
    }
  
    .event-info {
      flex: 1;
      min-width: 0; /* allow truncation */
    }
  
    .event-title {
      font-size: var(--fs-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 0.375rem 0;
      line-height: 1.15;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  
    .event-topline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.92rem;
    }
  
    .event-time {
      font-weight: var(--font-weight-bold);
      color: var(--primary);
      font-family: var(--font-family);
    }
  
    .dot-sep {
      color: var(--muted);
    }
  
    .event-location {
      color: var(--muted);
      font-size: 0.9rem;
    }
  
    .event-sub .muted {
      color: var(--muted);
      font-size: 0.78rem;
      margin-top: 0.375rem;
      display: inline-block;
    }
  
    .time-until {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 72px;
      text-align: center;
    }
  
    .time-label {
      font-size: 0.72rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
  
    .time-value {
      font-size: var(--fs-xl);
      font-weight: var(--font-weight-bold);
      color: var(--coral);
      margin-top: 0.25rem;
    }
  
    /* route */
    .route-info {
      margin: 0.6rem 0;
      padding: 0.75rem;
      background: rgba(0, 200, 255, 0.03);
      border: 1px solid rgba(0, 200, 255, 0.06);
      border-radius: var(--radius-sm);
    }
  
    .route-header {
      margin-bottom: 0.5rem;
    }
  
    .route-label {
      font-size: 0.72rem;
      color: var(--muted);
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
  
    .location-flow {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
  
    .location-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      min-width: 120px;
      flex: 1;
      font-weight: 600;
    }
  
    .location-icon { font-size: 1.1rem; }
  
    .location-text { font-size: 0.92rem; color: var(--text); }
  
    .route-arrow { font-size: 1.25rem; color: var(--primary); }
  
    /* transit options grid */
    .transit-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.75rem;
    }
  
    .transit-option {
      background: rgba(0, 200, 255, 0.02);
      border: 1px solid rgba(0, 200, 255, 0.06);
      border-radius: var(--radius-sm);
      padding: 0.6rem;
      transition: box-shadow 160ms ease, transform 160ms ease;
    }
  
    .transit-option:focus,
    .transit-option:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(2,6,23,0.06);
      outline: none;
    }
  
    .option-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
  
    .option-type {
      font-size: 0.92rem;
    }
  
    .option-duration {
      font-weight: var(--font-weight-bold);
      font-family: var(--font-family);
    }
  
    .option-description {
      font-size: 0.82rem;
      color: var(--muted);
    }
  
    .directions {
      border-top: 1px solid rgba(0, 200, 255, 0.06);
      padding-top: 0.5rem;
      margin-top: 0.5rem;
    }
  
    .directions-header {
      font-size: 0.72rem;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 700;
      margin-bottom: 0.35rem;
    }
  
    .directions-list {
      margin: 0;
      padding-left: 1rem;
      font-size: 0.85rem;
      color: var(--text);
    }
  
    .direction-step {
      margin-bottom: 0.35rem;
    }
  
    /* Responsive */
    @media (max-width: 720px) {
      .event-header { flex-direction: column; align-items: stretch; }
      .time-until { order: 2; align-self: flex-end; }
      .transit-options { grid-template-columns: 1fr; }
      .route-arrow { transform: rotate(90deg); }
      .event-title { white-space: normal; }
    }
  </style>
  