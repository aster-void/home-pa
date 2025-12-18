<script lang="ts">
  import CalendarTabView from "$lib/features/calendar/components/CalendarTabView.svelte";
  import EventForm from "$lib/features/calendar/components/EventForm.svelte";
  import { eventFormState } from "$lib/bootstrap/compat.svelte.ts";
</script>

<CalendarTabView />

<!-- Event Form Modal - rendered at page level to avoid stacking context issues -->
{#if eventFormState.isOpen}
  <EventForm />
{/if}
