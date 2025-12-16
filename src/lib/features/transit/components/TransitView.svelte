<script lang="ts">
  /**
   * TransitView Component
   *
   * Mini app for viewing transit schedules and routes.
   * Currently UI-only, external API integration planned.
   */

  interface Props {
    onClose?: () => void;
  }

  const { onClose }: Props = $props();

  // Mock data for UI
  const routes = $state([
    {
      id: "1",
      name: "Central Line",
      from: "Home",
      to: "Office",
      departure: "08:15",
      arrival: "08:52",
      status: "on-time" as const,
      transfers: 1,
    },
    {
      id: "2",
      name: "Express Bus 42",
      from: "Home",
      to: "Office",
      departure: "08:30",
      arrival: "09:05",
      status: "delayed" as const,
      transfers: 0,
    },
    {
      id: "3",
      name: "Metro + Walk",
      from: "Home",
      to: "Office",
      departure: "08:45",
      arrival: "09:20",
      status: "on-time" as const,
      transfers: 2,
    },
  ]);

  const savedRoutes = $state([
    { id: "r1", name: "Home → Office", icon: "🏢" },
    { id: "r2", name: "Home → Gym", icon: "🏋️" },
    { id: "r3", name: "Office → Station", icon: "🚉" },
  ]);

  let _selectedRoute = $state<string | null>(null);

  function getStatusColor(status: "on-time" | "delayed" | "cancelled") {
    switch (status) {
      case "on-time":
        return "text-[var(--color-success-500)]";
      case "delayed":
        return "text-[var(--color-warning-500)]";
      case "cancelled":
        return "text-[var(--color-error-500)]";
    }
  }

  function getStatusBg(status: "on-time" | "delayed" | "cancelled") {
    switch (status) {
      case "on-time":
        return "bg-[var(--color-success-100)]";
      case "delayed":
        return "bg-[var(--color-warning-100)]";
      case "cancelled":
        return "bg-[var(--color-error-100)]";
    }
  }
</script>

<div class="flex h-full min-h-0 flex-col">
  <!-- Header -->
  <div
    class="flex items-center justify-between border-b border-[var(--color-border-default)] p-4"
  >
    <div class="flex items-center gap-3">
      <span class="text-2xl">🚃</span>
      <h2 class="m-0 text-xl font-medium text-[var(--color-text-primary)]">
        Transit
      </h2>
    </div>
    {#if onClose}
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
        onclick={onClose}
        aria-label="Close"
      >
        ×
      </button>
    {/if}
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-4">
    <!-- Search / Quick Routes -->
    <div class="mb-6">
      <div
        class="flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 py-3"
      >
        <span class="text-[var(--color-text-muted)]">🔍</span>
        <input
          type="text"
          placeholder="Search destination..."
          class="flex-1 border-none bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>
    </div>

    <!-- Saved Routes -->
    <section class="mb-6">
      <h3 class="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
        Saved Routes
      </h3>
      <div class="flex flex-wrap gap-2">
        {#each savedRoutes as route (route.id)}
          <button
            class="flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-app)] px-4 py-2 text-sm text-[var(--color-text-primary)] transition-all duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-100)]"
            onclick={() => (_selectedRoute = route.id)}
          >
            <span>{route.icon}</span>
            <span>{route.name}</span>
          </button>
        {/each}
      </div>
    </section>

    <!-- Available Routes -->
    <section>
      <h3 class="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
        Next Departures
      </h3>
      <div class="flex flex-col gap-3">
        {#each routes as route (route.id)}
          <div
            class="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] p-4 transition-all duration-200 hover:border-[var(--color-primary)]/50 hover:shadow-sm"
          >
            <div class="mb-2 flex items-start justify-between">
              <div>
                <span
                  class="text-base font-medium text-[var(--color-text-primary)]"
                  >{route.name}</span
                >
                <div class="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {route.from} → {route.to}
                </div>
              </div>
              <span
                class="rounded-full px-2 py-1 text-xs font-medium {getStatusBg(
                  route.status,
                )} {getStatusColor(route.status)}"
              >
                {route.status === "on-time"
                  ? "On Time"
                  : route.status === "delayed"
                    ? "Delayed"
                    : "Cancelled"}
              </span>
            </div>

            <div
              class="flex items-center justify-between border-t border-[var(--color-border-default)] pt-3"
            >
              <div class="flex items-center gap-4">
                <div class="text-center">
                  <div
                    class="text-lg font-semibold text-[var(--color-text-primary)]"
                  >
                    {route.departure}
                  </div>
                  <div class="text-xs text-[var(--color-text-muted)]">
                    Depart
                  </div>
                </div>
                <div class="text-[var(--color-text-muted)]">→</div>
                <div class="text-center">
                  <div
                    class="text-lg font-semibold text-[var(--color-text-primary)]"
                  >
                    {route.arrival}
                  </div>
                  <div class="text-xs text-[var(--color-text-muted)]">
                    Arrive
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-[var(--color-text-secondary)]">
                  {route.transfers === 0
                    ? "Direct"
                    : `${route.transfers} transfer${route.transfers > 1 ? "s" : ""}`}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- API Notice -->
    <div
      class="mt-6 rounded-xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-center"
    >
      <p class="text-sm text-[var(--color-text-muted)]">
        🚧 Live transit data coming soon
      </p>
      <p class="mt-1 text-xs text-[var(--color-text-muted)]">
        Currently showing mock data
      </p>
    </div>
  </div>
</div>
