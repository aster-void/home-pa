<script lang="ts">
  import CalendarSettings from "$lib/features/calendar/components/CalendarSettings.svelte";

  // No props required for this component
</script>

<div
  class="scrollbar-thin scrollbar-thumb-[#ed8936] scrollbar-track-transparent mx-auto max-h-[calc(100vh-120px)] min-h-[calc(100vh-120px)] max-w-screen-xl overflow-y-auto bg-white/60 p-8 backdrop-blur-sm max-md:p-4"
>
  <div class="mb-8 border-b border-[#1a202c]/5 pb-4 max-md:mb-4">
    <h2 class="m-0 mb-2 font-serif text-3xl font-normal text-[#1a202c]">
      Utilities
    </h2>
    <p class="m-0 text-base text-[#718096]">
      Account settings, calendar import/export, and other tools
    </p>
  </div>

  <div class="flex flex-col gap-8 max-md:gap-4">
    <CalendarSettings />
  </div>
</div>
