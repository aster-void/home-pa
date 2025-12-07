<script lang="ts">
  import CalendarView from "./CalendarView.svelte";

  const {} = $props();
</script>

<div class="calendar-tab">
      <CalendarView />
</div>

<style>
  .calendar-tab {
    height: calc(
      100vh - var(--bottom-nav-height, 80px) - env(safe-area-inset-bottom)
    );
    max-height: calc(
      100vh - var(--bottom-nav-height, 80px) - env(safe-area-inset-bottom)
    );
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-height: 0;
    padding: var(--space-md);
    overflow: hidden;
  }

  .calendar-tab :global(> *) {
    height: 100%;
    min-height: 0;
  }
</style>
