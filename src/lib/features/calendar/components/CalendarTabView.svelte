<script lang="ts">
  import CalendarView from "./CalendarView.svelte";

  // No props required for this component
</script>

<div
  class="flex min-h-0 flex-col overflow-visible p-4"
  style="height: calc(100vh - var(--bottom-nav-height, 80px) - env(safe-area-inset-bottom)); max-height: calc(100vh - var(--bottom-nav-height, 80px) - env(safe-area-inset-bottom));"
>
  <div class="h-full min-h-0 overflow-hidden">
    <CalendarView />
  </div>
</div>
