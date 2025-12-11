<script lang="ts">
  import CalendarSettings from "./calendar_components/CalendarSettings.svelte";
  import { dayBoundaries, dayBoundaryActions } from "../stores/index.js";

  type AppId = "settings" | "weather" | "transit";

  const appTiles: Array<{ id: AppId; name: string; icon: string; description: string }> = [
    { id: "settings", name: "Settings", icon: "⚙️", description: "Account, sync, active hours" },
    { id: "weather", name: "Weather", icon: "⛅️", description: "Quick glance forecast demo" },
    { id: "transit", name: "Transit", icon: "🚌", description: "Route status demo" },
  ];

  let openApp = $state<AppId | null>(null);
  let activeStart = $state("08:00");
  let activeEnd = $state("23:00");
  let weatherCity = $state("Tokyo");
  let transitRoute = $state("Chuo Line");

  $effect(() => {
    const unsubscribe = dayBoundaries.subscribe((value) => {
      activeStart = value.dayStart;
      activeEnd = value.dayEnd;
    });
    return () => unsubscribe();
  });

  function updateActiveStart(value: string) {
    activeStart = value;
    dayBoundaryActions.updateDayStart(value);
  }

  function updateActiveEnd(value: string) {
    activeEnd = value;
    dayBoundaryActions.updateDayEnd(value);
  }

  const weatherDemo = [
    { day: "Today", high: "24°C", low: "17°C", status: "Partly cloudy" },
    { day: "Tomorrow", high: "22°C", low: "16°C", status: "Light showers" },
    { day: "Fri", high: "21°C", low: "15°C", status: "Sunny intervals" },
  ];

  const transitDemo = [
    { line: "Chuo Rapid", status: "Minor delays", note: "Crowding near Shinjuku" },
    { line: "Yamanote", status: "On time", note: "Trains every 3 min" },
    { line: "Ginza Metro", status: "Planned maintenance 23:00", note: "Expect slower service" },
  ];
</script>

<div class="utilities-view">
  <header class="utilities-hero">
    <div>
      <p class="eyebrow">Utilities</p>
      <h1>Quick tools and settings hub</h1>
      <p class="lede">
        Open mini apps for settings, weather, and transit. Click an icon to pop a window.
      </p>
    </div>
  </header>

  <section class="apps-grid" aria-label="Utilities apps">
    {#each appTiles as tile}
      <button class="app-card" onclick={() => (openApp = tile.id)} aria-label={`Open ${tile.name}`}>
        <div class="app-icon">{tile.icon}</div>
        <div class="app-meta">
          <span class="app-name">{tile.name}</span>
          <span class="app-desc">{tile.description}</span>
        </div>
      </button>
    {/each}
  </section>

  {#if openApp}
    <div
      class="modal-backdrop"
      role="button"
      tabindex="0"
      onclick={() => (openApp = null)}
      onkeydown={(e) => {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") openApp = null;
      }}
      aria-label="Close utilities window"
    ></div>
    <section class="modal-window" role="dialog" aria-modal="true">
      <header class="window-header">
        <div class="window-title">
          <span class="window-icon">
            {openApp === "settings" ? "⚙️" : openApp === "weather" ? "⛅️" : "🚌"}
          </span>
          <span>
            {openApp === "settings" ? "Settings" : openApp === "weather" ? "Weather" : "Transit"}
          </span>
        </div>
        <button class="close-btn" onclick={() => (openApp = null)} aria-label="Close">✕</button>
      </header>

      <div class="window-body">
        {#if openApp === "settings"}
          <div class="window-section">
            <div class="section-head">
              <h3>Active hours</h3>
              <p>Used for gap finding and schedule generation.</p>
            </div>
            <div class="time-inputs">
              <label>
                <span>Start</span>
                <input
                  type="time"
                  value={activeStart}
                  onchange={(e) => updateActiveStart((e.currentTarget as HTMLInputElement).value)}
                />
              </label>
              <span class="dash">–</span>
              <label>
                <span>End</span>
                <input
                  type="time"
                  value={activeEnd}
                  onchange={(e) => updateActiveEnd((e.currentTarget as HTMLInputElement).value)}
                />
              </label>
            </div>
  </div>

          <div class="window-section scrollable">
    <CalendarSettings />
  </div>
        {:else if openApp === "weather"}
          <div class="window-section">
            <div class="section-head">
              <h3>Weather snapshot</h3>
              <p>Static demo card to show how app windows will look.</p>
            </div>
            <div class="form-row">
              <label>
                <span>City</span>
                <input
                  type="text"
                  value={weatherCity}
                  oninput={(e) => (weatherCity = (e.currentTarget as HTMLInputElement).value)}
                  placeholder="City"
                />
              </label>
              <button class="ghost-btn" type="button">Refresh</button>
            </div>
            <ul class="list">
              {#each weatherDemo as item}
                <li class="list-row">
                  <div>
                    <div class="row-title">{item.day}</div>
                    <div class="row-sub">{item.status}</div>
                  </div>
                  <div class="row-meta">{item.high} / {item.low}</div>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <div class="window-section">
            <div class="section-head">
              <h3>Transit status</h3>
              <p>Static demo for future transit integrations.</p>
            </div>
            <div class="form-row">
              <label>
                <span>Route</span>
                <input
                  type="text"
                  value={transitRoute}
                  oninput={(e) => (transitRoute = (e.currentTarget as HTMLInputElement).value)}
                  placeholder="Line or route"
                />
              </label>
              <button class="ghost-btn" type="button">Check</button>
            </div>
            <ul class="list">
              {#each transitDemo as item}
                <li class="list-row">
                  <div>
                    <div class="row-title">{item.line}</div>
                    <div class="row-sub">{item.note}</div>
                  </div>
                  <div class="status-pill">{item.status}</div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .utilities-view {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-lg);
    min-height: calc(100vh - 120px);
  }

  .utilities-hero {
    padding: var(--space-lg);
    background: linear-gradient(135deg, rgba(240, 138, 119, 0.12), rgba(99, 102, 241, 0.1));
    border: 1px solid rgba(15, 34, 48, 0.08);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-lg);
    box-shadow: var(--shadow-soft);
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: var(--fs-xs);
    color: var(--text-secondary);
    margin: 0 0 var(--space-xs) 0;
  }

  .utilities-hero h1 {
    margin: 0 0 var(--space-sm) 0;
    font-size: var(--fs-xl);
    color: var(--text-primary);
  }

  .lede {
    margin: 0;
    color: var(--text-secondary);
    max-width: 720px;
  }

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-md);
  }

  .app-card {
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    padding: var(--space-md);
    display: flex;
    gap: var(--space-md);
    align-items: center;
    cursor: pointer;
    transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
    text-align: left;
  }

  .app-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-soft);
    border-color: rgba(240, 138, 119, 0.5);
  }

  .app-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
  }

  .app-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .app-name {
    font-weight: 600;
    color: var(--text-primary);
  }

  .app-desc {
    color: var(--text-secondary);
    font-size: var(--fs-sm);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px);
    z-index: 450;
  }

  .modal-window {
    position: fixed;
    inset: 10vh auto auto 50%;
    transform: translateX(-50%);
    width: min(900px, 92vw);
    max-height: 80vh;
    background: var(--bg-card);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.18);
    z-index: 460;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .window-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--ui-border);
    background: var(--bg-secondary);
  }

  .window-title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    font-weight: 600;
  }

  .window-icon {
    font-size: 1.2rem;
  }

  .close-btn {
    border: none;
    background: transparent;
    font-size: 1rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    transition: background 0.15s ease;
  }

  .close-btn:hover {
    background: var(--bg-card);
  }

  .window-body {
    padding: var(--space-lg);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .window-section {
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    background: var(--bg-secondary);
  }

  .window-section.scrollable {
    max-height: 400px;
    overflow-y: auto;
  }

  .section-head h3 {
    margin: 0 0 var(--space-xs) 0;
  }

  .section-head p {
    margin: 0;
    color: var(--text-secondary);
  }

  .time-inputs {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    margin-top: var(--space-sm);
  }

  .time-inputs label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-sm);
    color: var(--text-secondary);
  }

  .time-inputs input {
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--ui-border);
    background: var(--bg-card);
  }

  .dash {
    color: var(--text-tertiary);
  }

  .form-row {
    display: flex;
    gap: var(--space-sm);
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .form-row label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--text-secondary);
  }

  .form-row input {
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--ui-border);
    background: var(--bg-card);
  }

  .ghost-btn {
    border: 1px solid var(--ui-border);
    background: var(--bg-card);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-primary);
    transition: border-color 0.15s ease, transform 0.15s ease;
  }

  .ghost-btn:hover {
    border-color: var(--coral);
    transform: translateY(-1px);
  }

  .list {
    list-style: none;
    padding: 0;
    margin: var(--space-md) 0 0 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .list-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    border: 1px solid var(--ui-border);
  }

  .row-title {
    font-weight: 600;
    color: var(--text-primary);
  }

  .row-sub {
    color: var(--text-secondary);
    font-size: var(--fs-sm);
  }

  .row-meta {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .status-pill {
    padding: 6px 10px;
    border-radius: var(--radius-full, 999px);
    border: 1px solid var(--ui-border);
    background: rgba(240, 138, 119, 0.12);
    color: var(--text-primary);
    font-size: var(--fs-xs);
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .utilities-view {
      padding: var(--space-md);
    }

    .utilities-hero {
      padding: var(--space-md);
    }

    .modal-window {
      inset: 6vh 0 auto 50%;
      width: 94vw;
    }

    .window-body {
      padding: var(--space-md);
    }
  }
</style>
