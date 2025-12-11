<script lang="ts">
  import { onMount } from "svelte";
  import type { Event, Recurrence } from "$lib/types.ts";
  import {
    calendarState,
    calendarActions,
    dataState,
    uiState,
    eventFormState,
    eventFormActions,
    eventActions,
    uiActions,
    type ExpandedOccurrence,
  } from "$lib/bootstrap/compat.svelte.ts";
  import {
    localDateTimeToUTC,
    utcToLocalDateString,
    utcToLocalTimeString,
  } from "$lib/utils/date-utils.ts";

  // Local reactive variables for calendar state
  let currentMonth = $state(new Date());

  // Form state - now using stores directly
  let eventTitle = $state("");
  let eventStartDate = $state("");
  let eventEndDate = $state("");
  let eventStartTime = $state("");
  let eventEndTime = $state("");
  let eventAddress = $state("");
  let eventImportance = $state<"low" | "medium" | "high">("medium");
  let eventTimeLabel = $state<"all-day" | "some-timing" | "timed">("all-day");
  // Tri-state for clarity: default (grey), all-day, some-timing
  type TimeMode = "default" | "all-day" | "some-timing";
  let timeMode = $state<TimeMode>("default");
  let isGreyState = $derived(timeMode === "default");
  let isEventEditing = $state(false);
  let isManualDateOrTimeEdit = $state(false);

  // These derived values are computed but not currently used - kept for future UI enhancements
  // Check if time fields have content (for timed events)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _hasTimeContent = $derived(
    eventTimeLabel === "timed" &&
      (eventStartTime.trim() !== "" || eventEndTime.trim() !== ""),
  );

  // Check if we're in timed mode (either explicitly timed or user has manually edited times)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _isTimedMode = $derived(
    eventTimeLabel === "timed" || isManualDateOrTimeEdit,
  );

  // Initialize dates when form opens
  function initializeDates() {
    // Use unified date utility to get local date string
    const dateString = utcToLocalDateString(dataState.selectedDate);

    if (!eventStartDate) {
      eventStartDate = dateString;
    }
    if (!eventEndDate) {
      eventEndDate = dateString;
    }
  }

  // Handle time label changes
  $effect(() => {
    if (eventTimeLabel === "some-timing") {
      // For some-timing, ensure start and end dates are the same
      if (eventStartDate && eventEndDate !== eventStartDate) {
        eventEndDate = eventStartDate;
      }
    }
  });

  // Recurrence form fields
  let isRecurring = $state(false);
  let recurrenceFrequency = $state<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">(
    "WEEKLY",
  );
  let recurrenceInterval = $state(1);
  let recurrenceEndDate = $state<string>(""); // Empty = forever
  let weeklyDays = $state<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]); // Sun-Sat
  let monthlyType = $state<"dayOfMonth" | "nthWeekday">("nthWeekday");
  let monthlyPosition = $state(1);

  // Subscribe to store changes
  $effect(() => {
    const form = eventFormState.formData;
    eventTitle = form.title;

    // Parse the datetime-local format to separate date and time using unified utilities
    // Handle start date/time
    if (form.start) {
      const startDateTime = new Date(form.start);
      eventStartDate = utcToLocalDateString(startDateTime);
      eventStartTime = utcToLocalTimeString(startDateTime);
    } else {
      eventStartDate = "";
      eventStartTime = "";
    }

    // Handle end date/time
    if (form.end) {
      const endDateTime = new Date(form.end);
      eventEndDate = utcToLocalDateString(endDateTime);
      eventEndTime = utcToLocalTimeString(endDateTime);
    } else {
      eventEndDate = "";
      eventEndTime = "";
    }

    // Override time fields based on time label (but preserve user edits within session)
    if (!isManualDateOrTimeEdit) {
      if (form.timeLabel === "all-day") {
        eventStartTime = "00:00";
        eventEndTime = "23:59";
      } else if (form.timeLabel === "some-timing") {
        eventStartTime = "";
        eventEndTime = "";
      } else if (form.timeLabel === "timed") {
        // For timed events, keep the actual time values from the form
        // Don't override them
      }
    }

    eventAddress = form.address || "";
    eventImportance = form.importance || "medium";
    eventTimeLabel = form.timeLabel || "all-day";
    isEventEditing = form.isEditing;
  });

  // Note: Form state synchronization now happens via event handlers
  // instead of $effect to prevent infinite loops
  // Date/time combinations are updated in input handlers

  // Track previous month to only fetch when month actually changes
  let previousMonthKey = $state<string | null>(null);

  function getMonthKey(month: Date): string {
    return `${month.getFullYear()}-${month.getMonth()}`;
  }

  function fetchEventsForCurrentMonth() {
    const windowStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 3,
      1,
    );
    const windowEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 4,
      0,
    );
    calendarActions.fetchEvents(windowStart, windowEnd, true);
  }

  // Load events on mount
  onMount(() => {
    const monthKey = getMonthKey(currentMonth);
    previousMonthKey = monthKey;
    fetchEventsForCurrentMonth();
  });

  // Reload events when month actually changes (not on every render)
  $effect(() => {
    const monthKey = getMonthKey(currentMonth);

    // Only fetch if month actually changed (skip initial render/mount)
    if (previousMonthKey !== null && previousMonthKey !== monthKey) {
      previousMonthKey = monthKey;
      fetchEventsForCurrentMonth();
    }
  });

  // Also reload occurrences when form data changes (for real-time preview)
  $effect(() => {
    if (isEventEditing) {
      const currentForm = eventFormState.formData;
      const windowStart = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 3,
        1,
      );
      const windowEnd = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 4,
        0,
      );

      // Create a temporary event object for preview
      if (currentForm.start && currentForm.end) {
        const tempEvent: Event = {
          id: currentForm.editingId || "temp",
          title: currentForm.title,
          start: new Date(currentForm.start),
          end: new Date(currentForm.end),
          description: currentForm.description,
          address: currentForm.address,
          importance: currentForm.importance,
          timeLabel: currentForm.timeLabel,
          tzid: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        // Debounce to avoid excessive reloads during typing
        const timeout = setTimeout(() => {
          // For preview, manually expand occurrences with the temporary event
          const eventsWithPreview = calendarState.events.map((e) =>
            e.id === currentForm.editingId ? tempEvent : e,
          );
          // Use the calendar store's expand function for preview
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const previewOccurrences = calendarActions.expandRecurringEvents(
            eventsWithPreview,
            windowStart,
            windowEnd,
          );
          // Note: Preview occurrences computed but not currently rendered - kept for future enhancement
        }, 200);

        return () => clearTimeout(timeout);
      }
    }
  });

  // Combine regular events with recurring occurrences for display
  let allDisplayEvents = $derived.by(() => {
    const regularEvents = calendarState.events.filter(
      (e) => !e.recurrence || e.recurrence.type === "NONE",
    );

    // Filter occurrences to only include those for events that are still recurring
    const recurringEventIds = new Set(
      calendarState.events
        .filter((e) => e.recurrence && e.recurrence.type !== "NONE")
        .map((e) => e.id),
    );

    const occurrences = calendarState.occurrences
      .filter((occ) => recurringEventIds.has(occ.masterEventId))
      .map(
        (occ: ExpandedOccurrence) =>
          ({
            id: occ.id, // Use unique occurrence ID, not the master event ID
            eventId: occ.masterEventId, // Keep reference to master event ID
            title: occ.title,
            start: occ.start,
            end: occ.end,
            description: occ.description,
            address: occ.location,
            importance: occ.importance,
            timeLabel: occ.timeLabel,
            isRecurring: true,
            originalEventId: occ.masterEventId,
            // New sliding window fields
            isForever: occ.isForever,
          }) as Event & {
            eventId: string;
            isRecurring: boolean;
            originalEventId: string;
            isForever?: boolean;
          },
      );

    // Debug logging (can be disabled for production)
    // eslint-disable-next-line no-constant-condition
    if (false) {
      // Set to true for debugging
      console.log("[CalendarView] allDisplayEvents update:", {
        regularEvents: regularEvents.length,
        occurrences: occurrences.length,
        total: regularEvents.length + occurrences.length,
        recurringEventIds: Array.from(recurringEventIds),
        calendarOccurrences: calendarState.occurrences.length,
      });
    }

    return [...regularEvents, ...occurrences].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );
  });

  // Get forever recurring events for special handling
  let foreverEvents = $derived.by(() => {
    return calendarState.occurrences.filter((occ) => occ.isForever);
  });

  // Debug info
  let showDebugInfo = $state(false);

  // Calendar grid generation
  function getCalendarDays() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0); // Last day of the month
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const currentDate = new Date(startDate);

    // Calculate how many days we need to show
    // We need to go from startDate to the end of the month plus enough days to complete the last week
    const endOfMonth = new Date(lastDay);
    const daysToCompleteLastWeek = (6 - lastDay.getDay()) % 7; // Days needed to complete the last week
    const totalDaysNeeded =
      Math.ceil(
        (endOfMonth.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) +
      1 +
      daysToCompleteLastWeek;

    // Generate days dynamically to cover the full month plus complete weeks
    for (let i = 0; i < totalDaysNeeded; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  function isToday(date: Date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function isSelected(date: Date) {
    return date.toDateString() === dataState.selectedDate.toDateString();
  }

  function isCurrentMonth(date: Date) {
    return date.getMonth() === currentMonth.getMonth();
  }

  function selectDate(date: Date) {
    // Check if this date is already selected
    const wasAlreadySelected = isSelected(date);

    // Always update the selected date
    dataState.setSelectedDate(date);

    // Re-click on selected date toggles the timeline popup
    if (wasAlreadySelected) {
      if (uiState.showTimelinePopup) {
        uiActions.hideTimelinePopup();
      } else {
        uiActions.showTimelinePopup();
      }
    } else {
      uiActions.hideTimelinePopup();
    }
  }

  function navigateMonth(direction: number) {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + direction,
      1,
    );
  }

  function createEvent() {
    // Use the event actions to create a new event
    eventActions.createNewEvent();

    // Initialize dates to selected date
    initializeDates();

    // Reset local variables
    eventTitle = "";
    eventStartTime = "00:00";
    eventEndTime = "23:59";
    eventAddress = "";
    eventImportance = "medium";
    eventTimeLabel = "all-day";
    isEventEditing = false;
    isManualDateOrTimeEdit = false;

    // Reset recurrence with smart defaults
    isRecurring = false;
    recurrenceFrequency = "WEEKLY";
    recurrenceInterval = 1;
    recurrenceEndDate = "";
    // Auto-select weekday of selected date
    weeklyDays = [false, false, false, false, false, false, false];
    weeklyDays[dataState.selectedDate.getDay()] = true;
    // Calculate week position for monthly
    const dayOfMonth = dataState.selectedDate.getDate();
    monthlyPosition = Math.ceil(dayOfMonth / 7);
    if (monthlyPosition > 4) monthlyPosition = -1;
    monthlyType = "nthWeekday";
  }

  function buildRecurrenceObject(): Recurrence {
    if (!isRecurring) {
      return { type: "NONE" } as const;
    }

    let rrule = `FREQ=${recurrenceFrequency}`;

    if (recurrenceInterval > 1) {
      rrule += `;INTERVAL=${recurrenceInterval}`;
    }

    if (recurrenceFrequency === "WEEKLY" && weeklyDays.some((d) => d)) {
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const selectedDays = days.filter((_, i) => weeklyDays[i]);
      if (selectedDays.length > 0) {
        rrule += `;BYDAY=${selectedDays.join(",")}`;
      }
    }

    if (recurrenceFrequency === "MONTHLY") {
      const start = localDateTimeToUTC(
        eventStartDate,
        eventStartTime || "00:00",
      );
      if (monthlyType === "nthWeekday") {
        const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
        const dayOfWeek = days[start.getDay()];
        const dayOfMonth = start.getDate();
        const position = Math.ceil(dayOfMonth / 7);
        const actualPosition = position > 4 ? -1 : position;
        rrule += `;BYDAY=${dayOfWeek};BYSETPOS=${actualPosition}`;
      }
    }

    if (recurrenceEndDate) {
      const untilDate = new Date(recurrenceEndDate);
      const utcDate = new Date(
        Date.UTC(
          untilDate.getFullYear(),
          untilDate.getMonth(),
          untilDate.getDate(),
          23,
          59,
          59,
        ),
      );
      rrule += `;UNTIL=${utcDate.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
    }

    const recurrenceObj = {
      type: "RRULE" as const,
      rrule,
      frequency: recurrenceFrequency,
      count: null,
      until: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
    };

    return recurrenceObj;
  }

  function parseRecurrenceForEdit(event: Event) {
    if (!event.recurrence || event.recurrence.type === "NONE") {
      isRecurring = false;
      return;
    }

    isRecurring = true;

    if (event.recurrence.type === "WEEKLY_BITMASK") {
      recurrenceFrequency = "WEEKLY";
      recurrenceInterval = event.recurrence.intervalWeeks;
      const bitmask = event.recurrence.daysBitmask;
      for (let i = 0; i < 7; i++) {
        weeklyDays[i] = (bitmask & (1 << i)) !== 0;
      }
      recurrenceEndDate = event.recurrence.until
        ? event.recurrence.until.toISOString().slice(0, 10)
        : "";
    } else if (event.recurrence.type === "RRULE") {
      const rrule = event.recurrence.rrule;
      recurrenceFrequency = event.recurrence.frequency || "WEEKLY";

      const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
      recurrenceInterval = intervalMatch ? parseInt(intervalMatch[1]) : 1;

      if (rrule.includes("BYDAY=")) {
        const bydayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
        if (bydayMatch) {
          const days = bydayMatch[1].split(",");
          const dayMap: Record<string, number> = {
            SU: 0,
            MO: 1,
            TU: 2,
            WE: 3,
            TH: 4,
            FR: 5,
            SA: 6,
          };
          weeklyDays = [false, false, false, false, false, false, false];
          days.forEach((day) => {
            const cleanDay = day.replace(/[+-]?\d+/, "");
            if (dayMap[cleanDay] !== undefined) {
              weeklyDays[dayMap[cleanDay]] = true;
            }
          });
        }
      }

      if (recurrenceFrequency === "MONTHLY") {
        if (rrule.includes("BYSETPOS=")) {
          const posMatch = rrule.match(/BYSETPOS=([-]?\d+)/);
          if (posMatch) {
            monthlyPosition = parseInt(posMatch[1]);
            monthlyType = "nthWeekday";
          }
        } else {
          monthlyType = "dayOfMonth";
        }
      }

      recurrenceEndDate = event.recurrence.until
        ? event.recurrence.until.toISOString().slice(0, 10)
        : "";
    }
  }

  function parseFreqFromRrule(
    rrule: string | undefined,
  ): "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null {
    if (!rrule) return null;
    const match = rrule.match(/FREQ=([A-Z]+)/);
    if (match) {
      const freq = match[1] as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
      return freq;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  function _formatRecurrenceText(recurrence: any): string {
    if (!recurrence || recurrence.type === "NONE") {
      return "";
    }

    if (recurrence.type === "WEEKLY_BITMASK") {
      const days = ["日", "月", "火", "水", "木", "金", "土"];
      const selectedDays = days.filter(
        (_, i) => (recurrence.daysBitmask & (1 << i)) !== 0,
      );
      const interval =
        recurrence.intervalWeeks > 1
          ? `${recurrence.intervalWeeks}週ごと `
          : "毎週 ";
      return `${interval}${selectedDays.join("・")}${recurrence.count ? ` (${recurrence.count}回)` : ""}`;
    }

    if (recurrence.type === "RRULE") {
      const freq =
        recurrence.frequency || parseFreqFromRrule(recurrence.rrule) || "DAILY";
      const freqMap: Record<string, string> = {
        DAILY: "毎日",
        WEEKLY: "毎週",
        MONTHLY: "毎月",
        YEARLY: "毎年",
      };
      const freqText = freqMap[freq] || freq;

      let result = freqText;

      if (recurrence.rrule.includes("INTERVAL=")) {
        const match = recurrence.rrule.match(/INTERVAL=(\d+)/);
        if (match && parseInt(match[1]) > 1) {
          result =
            freq === "DAILY"
              ? `${match[1]}日ごと`
              : freq === "WEEKLY"
                ? `${match[1]}週ごと`
                : freq === "MONTHLY"
                  ? `${match[1]}ヶ月ごと`
                  : `${match[1]}年ごと`;
        }
      }

      if (freq === "WEEKLY" && recurrence.rrule.includes("BYDAY=")) {
        const match = recurrence.rrule.match(/BYDAY=([A-Z,]+)/);
        if (match) {
          const dayMap: Record<string, string> = {
            SU: "日",
            MO: "月",
            TU: "火",
            WE: "水",
            TH: "木",
            FR: "金",
            SA: "土",
          };
          const days = match[1].split(",").map((d: string) => {
            const cleanDay = d.replace(/[+-]?\d+/, "");
            return dayMap[cleanDay] || d;
          });
          result += ` (${days.join("・")})`;
        }
      }

      if (recurrence.count) {
        result += ` ${recurrence.count}回`;
      } else if (recurrence.until) {
        const date = new Date(recurrence.until);
        result += ` ${date.toLocaleDateString("ja-JP")}まで`;
      } else {
        result += " (永続)"; // Forever indicator
      }

      return result;
    }

    return "繰り返し";
  }

  function getEventColor(event: Event): string {
    // Simple color assignment based on event title hash
    const colors = [
      "#3b82f6",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
    ];
    const hash = event.title.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function getCurrentTimePositionScaled(): number {
    const now = new Date();
    const currentDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const selectedDateOnly = new Date(
      dataState.selectedDate.getFullYear(),
      dataState.selectedDate.getMonth(),
      dataState.selectedDate.getDate(),
    );

    // Only show current time line if it's today
    if (currentDate.toDateString() !== selectedDateOnly.toDateString()) {
      return -1000; // Hide the line
    }

    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours * 60 + minutes) * (400 / 1440); // Scale to fit 400px height
  }

  function getEventPositionScaled(startTime: Date, timeLabel?: string): number {
    // All-day events start at 00:00 (position 0)
    if (timeLabel === "all-day") {
      return 0;
    }

    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    return (hours * 60 + minutes) * (400 / 1440); // Scale to fit 400px height
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getEventHeight(event: Event): number {
    const startTime = event.start;
    const endTime = event.end;
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.max(durationMs / (1000 * 60), 30); // Minimum 30 minutes
    return durationMinutes;
  }

  function _getEventHeightScaled(event: Event): number {
    // All-day events span the full timeline height (00:00 to 23:59 = 24 hours)
    if (event.timeLabel === "all-day") {
      return 400; // Full height (24 hours * 400px / 1440 minutes)
    }

    const startTime = event.start;
    const endTime = event.end;
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.max(durationMs / (1000 * 60), 15); // Minimum 15 minutes scaled
    return durationMinutes * (400 / 1440); // Scale to fit 400px height
  }

  // Helper function to check if an event should be shown on a specific date
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _shouldShowEventOnDate(event: Event, targetDate: Date): boolean {
    const eventStartDate = new Date(event.start);
    const eventEndDate = new Date(event.end);
    const targetDateString = targetDate.toDateString();

    // Show event if it starts OR ends on the target date
    return (
      eventStartDate.toDateString() === targetDateString ||
      eventEndDate.toDateString() === targetDateString
    );
  }

  // Helper function to get events for a specific date (including midnight-crossing events)
  function getEventsForDate(events: Event[], targetDate: Date): Event[] {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const targetDateStart = new Date(targetDate);
    targetDateStart.setHours(0, 0, 0, 0);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);
    const targetDateStartTime = targetDateStart.getTime();
    const targetDateEndTime = targetDateEnd.getTime();

    return events
      .filter((event) => {
        const eventStartDate = new Date(event.start);
        const eventEndDate = new Date(event.end);
        const eventStartTime = eventStartDate.getTime();
        const eventEndTime = eventEndDate.getTime();

        // Include events where target date falls between start and end (inclusive)
        return (
          eventStartTime <= targetDateEndTime &&
          eventEndTime >= targetDateStartTime
        );
      })
      .map((event) => {
        const eventStartDate = new Date(event.start);
        const eventEndDate = new Date(event.end);
        const eventStartTime = eventStartDate.getTime();
        const eventEndTime = eventEndDate.getTime();

        const startsOnTarget =
          eventStartTime >= targetDateStartTime &&
          eventStartTime <= targetDateEndTime;
        const endsOnTarget =
          eventEndTime >= targetDateStartTime &&
          eventEndTime <= targetDateEndTime;
        const spansTarget =
          eventStartTime < targetDateStartTime &&
          eventEndTime > targetDateEndTime;

        // If event starts and ends on the same day, return as is
        if (startsOnTarget && endsOnTarget) {
          return event;
        }

        // If event starts on target date but ends next day, truncate at midnight
        if (startsOnTarget && !endsOnTarget) {
          // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
          const truncatedEnd = new Date(targetDate);
          truncatedEnd.setHours(23, 59, 59, 999);
          return {
            ...event,
            end: truncatedEnd,
          };
        }

        // If event ends on target date but started yesterday, start at midnight
        if (!startsOnTarget && endsOnTarget) {
          // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
          const truncatedStart = new Date(targetDate);
          truncatedStart.setHours(0, 0, 0, 0);
          return {
            ...event,
            start: truncatedStart,
          };
        }

        // If event spans the target date (starts before and ends after), truncate to full day
        if (spansTarget) {
          // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
          const truncatedStart = new Date(targetDate);
          truncatedStart.setHours(0, 0, 0, 0);
          // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
          const truncatedEnd = new Date(targetDate);
          truncatedEnd.setHours(23, 59, 59, 999);
          return {
            ...event,
            start: truncatedStart,
            end: truncatedEnd,
          };
        }

        return event;
      });
  }

  // Helper function to get events for timeline (includes timed and all-day events)
  function getEventsForTimeline(events: Event[], targetDate: Date): Event[] {
    return getEventsForDate(events, targetDate).filter((event) => {
      // Include timed events and all-day events in timeline
      // Exclude only some-timing events (they don't belong in timeline)
      return event.timeLabel === "timed" || event.timeLabel === "all-day";
    });
  }

  function getEventColumns(events: Event[]): Event[][] {
    if (events.length === 0) return [];

    // Separate all-day events from timed events
    const allDayEvents = events.filter((e) => e.timeLabel === "all-day");
    const timedEvents = events.filter((e) => e.timeLabel !== "all-day");

    // Sort timed events by start time
    const sortedTimedEvents = [...timedEvents].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    // First, allocate columns for all-day events (each gets its own column)
    // Since all-day events span the full day, they always overlap each other
    const allDayColumns: Event[][] = [];
    for (const allDayEvent of allDayEvents) {
      allDayColumns.push([allDayEvent]);
    }

    // Handle timed events with overlap detection (only among timed events)
    const timedColumns: Event[][] = [];
    for (const event of sortedTimedEvents) {
      // Find the first column where this event doesn't overlap with other timed events
      let columnIndex = 0;
      while (columnIndex < timedColumns.length) {
        const column = timedColumns[columnIndex];
        const lastEvent = column[column.length - 1];

        // For timed events, check actual time overlap
        if (event.start >= lastEvent.end) {
          break;
        }
        columnIndex++;
      }

      // If no suitable column found, create a new one
      if (columnIndex >= timedColumns.length) {
        timedColumns.push([]);
      }

      timedColumns[columnIndex].push(event);
    }

    // Combine: all-day columns first, then timed columns
    return [...allDayColumns, ...timedColumns];
  }

  // Helper to check if this is the first day of an event
  function isFirstDayOfEvent(event: Event, targetDate: Date): boolean {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const eventStartDate = new Date(event.start);
    eventStartDate.setHours(0, 0, 0, 0);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const targetDateOnly = new Date(targetDate);
    targetDateOnly.setHours(0, 0, 0, 0);
    return eventStartDate.getTime() === targetDateOnly.getTime();
  }

  // Helper to check if event spans multiple days
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _isMultiDayEvent(event: Event): boolean {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const eventStartDate = new Date(event.start);
    eventStartDate.setHours(0, 0, 0, 0);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const eventEndDate = new Date(event.end);
    eventEndDate.setHours(0, 0, 0, 0);
    return eventEndDate.getTime() > eventStartDate.getTime();
  }

  // Helper to determine bar position in multi-day event
  function getEventBarPosition(
    eventStart: Date,
    eventEnd: Date,
    targetDate: Date,
  ): "start" | "middle" | "end" | "single" {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const eventStartDate = new Date(eventStart);
    eventStartDate.setHours(0, 0, 0, 0);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const eventEndDate = new Date(eventEnd);
    eventEndDate.setHours(0, 0, 0, 0);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
    const targetDateOnly = new Date(targetDate);
    targetDateOnly.setHours(0, 0, 0, 0);

    const isStart = eventStartDate.getTime() === targetDateOnly.getTime();
    const isEnd = eventEndDate.getTime() === targetDateOnly.getTime();
    const isMultiDay = eventEndDate.getTime() > eventStartDate.getTime();

    if (!isMultiDay) return "single";
    if (isStart) return "start";
    if (isEnd) return "end";
    return "middle";
  }

  // Assign row indices to events so multi-day events maintain same row across days
  function assignEventRows(events: Event[]): Map<string, number> {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Map used in utility function, not reactive state
    const eventRows = new Map<string, number>();

    // Sort events by start date, then by duration (longer first)
    const sortedEvents = [...events].sort((a, b) => {
      const startDiff = a.start.getTime() - b.start.getTime();
      if (startDiff !== 0) return startDiff;
      // If same start, longer events first
      const aDuration = a.end.getTime() - a.start.getTime();
      const bDuration = b.end.getTime() - b.start.getTime();
      return bDuration - aDuration;
    });

    for (const event of sortedEvents) {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
      const eventStartDate = new Date(event.start);
      eventStartDate.setHours(0, 0, 0, 0);
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
      const eventEndDate = new Date(event.end);
      eventEndDate.setHours(0, 0, 0, 0);

      // Find the first available row
      let row = 0;
      let rowAvailable = false;

      while (!rowAvailable) {
        rowAvailable = true;

        // Check if this row is occupied by any conflicting event
        for (const [otherEventId, otherRow] of eventRows.entries()) {
          if (otherRow !== row) continue;

          const otherEvent = events.find((e) => e.id === otherEventId);
          if (!otherEvent) continue;

          // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
          const otherStartDate = new Date(otherEvent.start);
          otherStartDate.setHours(0, 0, 0, 0);
          // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date manipulation in utility function, not reactive state
          const otherEndDate = new Date(otherEvent.end);
          otherEndDate.setHours(0, 0, 0, 0);

          // Check if events overlap in date range
          if (
            eventStartDate.getTime() <= otherEndDate.getTime() &&
            eventEndDate.getTime() >= otherStartDate.getTime()
          ) {
            rowAvailable = false;
            break;
          }
        }

        if (!rowAvailable) {
          row++;
        }
      }

      eventRows.set(event.id, row);
    }

    return eventRows;
  }

  // Get the row assignment map for current events (including recurring occurrences)
  let eventRowMap = $derived(assignEventRows(allDisplayEvents));
</script>

<div class="calendar-view">
  <!-- Calendar Header -->
  <div class="calendar-header">
    <div class="month-navigation">
      <button onclick={() => navigateMonth(-1)}>←</button>
      <h2>
        {currentMonth.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
        })}
      </h2>
      <button onclick={() => navigateMonth(1)}>→</button>
    </div>

    <div class="header-actions">
      <button
        class="debug-toggle"
        onclick={() => (showDebugInfo = !showDebugInfo)}
        title="Toggle debug information"
      >
        {showDebugInfo ? "Hide" : "Show"} Debug
      </button>
      {#if calendarState.error}
        <div class="recurrence-error" title={calendarState.error}>
          ⚠️ Recurring events unavailable
        </div>
      {/if}
      <button class="add-event-button" onclick={createEvent}>+</button>
    </div>
  </div>

  <!-- Debug Information -->
  {#if showDebugInfo}
    <div class="debug-info">
      <h3>Sliding Window Debug Info</h3>
      <div class="debug-stats">
        <div class="debug-stat">
          <strong>Window:</strong>
          {new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() - 3,
            1,
          ).toLocaleDateString()} -
          {new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 4,
            0,
          ).toLocaleDateString()}
        </div>
        <div class="debug-stat">
          <strong>Total Events:</strong>
          {calendarState.events.length}
        </div>
        <div class="debug-stat">
          <strong>Display Events:</strong>
          {allDisplayEvents.length}
        </div>
        <div class="debug-stat">
          <strong>Forever Events:</strong>
          {foreverEvents.length}
        </div>
        <div class="debug-stat">
          <strong>Calendar Store:</strong>
          Loading: {calendarState.loading ? "Yes" : "No"}, Error: {calendarState.error ||
            "None"}
        </div>
      </div>
      {#if foreverEvents.length > 0}
        <div class="forever-events-list">
          <h4>Forever Recurring Events:</h4>
          <ul>
            {#each foreverEvents as event (event.id)}
              <li>
                {event.title}
                <span class="forever-indicator">∞</span>
                (Master ID: {(event as Event & { eventId?: string }).eventId ||
                  event.id})
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Calendar Grid -->
  <div class="calendar-grid">
    <div class="calendar-weekdays">
      <div class="weekday">日</div>
      <div class="weekday">月</div>
      <div class="weekday">火</div>
      <div class="weekday">水</div>
      <div class="weekday">木</div>
      <div class="weekday">金</div>
      <div class="weekday">土</div>
    </div>

    <div class="calendar-days">
      {#each getCalendarDays() as day (day.getTime())}
        <div
          class="calendar-day {isToday(day) ? 'today' : ''} {isSelected(day)
            ? 'selected'
            : ''} {!isCurrentMonth(day) ? 'other-month' : ''}"
          onclick={() => selectDate(day)}
          onkeydown={(e) => e.key === "Enter" && selectDate(day)}
          role="button"
          tabindex="0"
        >
          <div class="day-number">{day.getDate()}</div>
          <div class="day-events">
            {#each getEventsForDate(allDisplayEvents, day) as truncatedEvent (truncatedEvent.id)}
              {@const originalEvent =
                allDisplayEvents.find((e) => e.id === truncatedEvent.id) ||
                truncatedEvent}
              {@const barPosition = getEventBarPosition(
                originalEvent.start,
                originalEvent.end,
                day,
              )}
              {@const showLabel = isFirstDayOfEvent(originalEvent, day)}
              {@const rowIndex = eventRowMap.get(truncatedEvent.id) ?? 0}
              <div
                class="event-bar {barPosition}"
                style="background-color: {getEventColor(
                  truncatedEvent,
                )}; top: {rowIndex * 18}px;"
              >
                {#if showLabel}
                  <span class="event-label">
                    {truncatedEvent.title}
                    {#if (truncatedEvent as Event & { isForever?: boolean }).isForever}
                      <span class="forever-indicator" title="Forever recurring"
                        >∞</span
                      >
                    {/if}
                    {#if (truncatedEvent as Event & { isDuplicate?: boolean }).isDuplicate}
                      <span
                        class="duplicate-indicator"
                        title="Auto-generated duplicate">↻</span
                      >
                    {/if}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Timeline Popup -->
  {#if uiState.showTimelinePopup}
    <div
      class="timeline-popup"
      onclick={() => uiActions.hideTimelinePopup()}
      onkeydown={(e) => e.key === "Escape" && uiActions.hideTimelinePopup()}
      role="button"
      tabindex="-1"
      aria-label="Close timeline"
    >
      <div
        class="popup-content"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.key === "Escape" && uiActions.hideTimelinePopup()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="popup-header">
          <h3>
            タイムライン - {dataState.selectedDate.toLocaleDateString("ja-JP")}
          </h3>
          <button
            class="close-button"
            onclick={() => uiActions.hideTimelinePopup()}
            aria-label="Close">✕</button
          >
        </div>

        <div class="timeline-container">
          {#if getEventsForTimeline(allDisplayEvents, dataState.selectedDate).length === 0}
            <p class="empty-state">この日の予定はありません</p>
          {:else}
            <div class="timeline-view">
              <!-- Hour indicators -->
              <div class="timeline-hours">
                <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
                {#each Array(24) as _, hour (hour)}
                  <div class="hour-indicator" style="top: {hour * 16.67}px;">
                    <span class="hour-label"
                      >{hour.toString().padStart(2, "0")}:00</span
                    >
                    <div class="hour-line"></div>
                  </div>
                {/each}
              </div>

              <!-- Current time indicator -->
              <div
                class="current-time-line"
                style="top: {getCurrentTimePositionScaled()}px;"
              ></div>

              <!-- Event columns -->
              <div class="timeline-columns">
                {#each getEventColumns(getEventsForTimeline(allDisplayEvents, dataState.selectedDate)) as column, columnIndex (columnIndex)}
                  <div
                    class="timeline-column"
                    style="width: {100 /
                      getEventColumns(
                        getEventsForTimeline(
                          allDisplayEvents,
                          dataState.selectedDate,
                        ),
                      ).length}%;"
                  >
                    {#each column as event (event.id)}
                      <div
                        class="timeline-event-block"
                        onclick={() => {
                          // Find master event if this is a recurring occurrence
                          const masterEvent =
                            calendarState.events.find(
                              (e) =>
                                e.id ===
                                  (event as Event & { eventId?: string })
                                    .eventId || e.id === event.id,
                            ) || event;
                          eventActions.editEvent(masterEvent);
                          parseRecurrenceForEdit(masterEvent);
                        }}
                        onkeydown={(e) => {
                          if (e.key === "Enter") {
                            const masterEvent =
                              calendarState.events.find(
                                (evt) =>
                                  evt.id ===
                                    (event as Event & { eventId?: string })
                                      .eventId || evt.id === event.id,
                              ) || event;
                            eventActions.editEvent(masterEvent);
                            parseRecurrenceForEdit(masterEvent);
                          }
                        }}
                        role="button"
                        tabindex="0"
                        style="
                          top: {getEventPositionScaled(
                          event.start,
                          event.timeLabel,
                        )}px;
                          height: {_getEventHeightScaled(event)}px;
                          background-color: {getEventColor(event)};
                          color: white;
                        "
                      >
                        <div class="timeline-event-title">{event.title}</div>
                        <div class="timeline-event-time">
                          {#if event.timeLabel === "all-day"}
                            00:00 - 23:59
                          {:else}
                            {formatTime(event.start)} - {formatTime(event.end)}
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Event Form Modal -->
  {#if uiState.showEventForm}
    <div
      class="event-form-modal"
      onclick={() => uiActions.hideEventForm()}
      onkeydown={(e) => e.key === "Escape" && uiActions.hideEventForm()}
      role="button"
      tabindex="-1"
      aria-label="Close event form"
    >
      <div
        class="modal-content"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.key === "Escape" && uiActions.hideEventForm()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="modal-header">
          <h3>{isEventEditing ? "予定を編集" : "新しい予定"}</h3>
          <button
            class="close-button"
            onclick={() => uiActions.hideEventForm()}
            aria-label="Close">✕</button
          >
        </div>

        <div class="modal-body">
          <div class="form-group sticky-title">
            <div class="inline-field">
              <label for="event-title">タイトル</label>
              <input
                id="event-title"
                type="text"
                bind:value={eventTitle}
                oninput={() =>
                  eventFormActions.updateField("title", eventTitle)}
                placeholder="予定のタイトルを入力"
                class:error={eventFormState.errors.title}
              />
              {#if eventFormState.errors.title}
                <div class="field-error">{eventFormState.errors.title}</div>
              {/if}
            </div>
          </div>

          <div class="form-group">
            <div class="inline-field">
              <label for="event-address">場所</label>
              <input
                id="event-address"
                type="text"
                bind:value={eventAddress}
                oninput={() =>
                  eventFormActions.updateField("address", eventAddress)}
                placeholder="場所を入力（任意）"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="inline-field" id="event-importance">
              <label for="event-importance">重要度</label>
              <button
                type="button"
                class="star-button {eventImportance === 'low' ? 'active' : ''}"
                onclick={() => {
                  eventImportance = "low";
                  eventFormActions.updateField("importance", "low");
                }}
              >
                ⭐
              </button>
              <button
                type="button"
                class="star-button {eventImportance === 'medium'
                  ? 'active'
                  : ''}"
                onclick={() => {
                  eventImportance = "medium";
                  eventFormActions.updateField("importance", "medium");
                }}
              >
                ⭐⭐
              </button>
              <button
                type="button"
                class="star-button {eventImportance === 'high' ? 'active' : ''}"
                onclick={() => {
                  eventImportance = "high";
                  eventFormActions.updateField("importance", "high");
                }}
              >
                ⭐⭐⭐
              </button>
            </div>
          </div>

          <!-- Time Label Switches -->
          <div class="form-group">
            <div class="time-label-switches" id="time-label-switches">
              <button
                type="button"
                class="time-switch {timeMode === 'all-day'
                  ? 'active'
                  : ''} {isGreyState ? 'grey' : ''}"
                onclick={() => {
                  timeMode = "all-day";
                  eventTimeLabel = "all-day";
                  eventFormActions.switchTimeLabel("all-day");
                  // Set time fields to show all-day times (but user can edit them)
                  eventStartTime = "00:00";
                  eventEndTime = "23:59";
                  isManualDateOrTimeEdit = false;
                }}
              >
                終日
              </button>
              <button
                type="button"
                class="time-switch {timeMode === 'some-timing'
                  ? 'active'
                  : ''} {isGreyState ? 'grey' : ''}"
                onclick={() => {
                  timeMode = "some-timing";
                  eventTimeLabel = "some-timing";
                  eventFormActions.switchTimeLabel("some-timing");
                  // Fix date to selected date when some-timing is chosen
                  const dateString = utcToLocalDateString(
                    dataState.selectedDate,
                  );
                  eventStartDate = dateString;
                  eventEndDate = dateString;
                  isManualDateOrTimeEdit = false;
                }}
              >
                どこかのタイミングで
              </button>
            </div>
          </div>

          <!-- Date Settings -->
          <div class="form-group">
            <div class="inline-field">
              <label for="event-start-date">開始日</label>
              <input
                id="event-start-date"
                type="date"
                bind:value={eventStartDate}
                onfocus={() => {
                  if (eventTimeLabel === "some-timing") {
                    timeMode = "default";
                    isManualDateOrTimeEdit = true;
                    eventTimeLabel = "timed";
                    eventFormActions.switchTimeLabel("timed");
                  }
                }}
                oninput={() => {
                  if (eventTimeLabel === "some-timing") {
                    timeMode = "default";
                    isManualDateOrTimeEdit = true;
                    eventTimeLabel = "timed";
                    eventFormActions.switchTimeLabel("timed");
                  }
                  // Update form state with combined date and time
                  const startDateTime =
                    eventStartDate && eventStartTime
                      ? `${eventStartDate}T${eventStartTime}`
                      : "";
                  eventFormActions.updateField("start", startDateTime);
                }}
              />
            </div>
            <div class="inline-field">
              <label for="event-end-date">終了日</label>
              <input
                id="event-end-date"
                type="date"
                bind:value={eventEndDate}
                onfocus={() => {
                  if (eventTimeLabel === "some-timing") {
                    timeMode = "default";
                    isManualDateOrTimeEdit = true;
                    eventTimeLabel = "timed";
                    eventFormActions.switchTimeLabel("timed");
                  }
                }}
                oninput={() => {
                  if (eventTimeLabel === "some-timing") {
                    timeMode = "default";
                    isManualDateOrTimeEdit = true;
                    eventTimeLabel = "timed";
                    eventFormActions.switchTimeLabel("timed");
                  }
                  // Update form state with combined date and time
                  const endDateTime =
                    eventEndDate && eventEndTime
                      ? `${eventEndDate}T${eventEndTime}`
                      : "";
                  eventFormActions.updateField("end", endDateTime);
                }}
              />
            </div>
          </div>

          <!-- Time Settings -->
          <div class="form-group">
            <div class="inline-field">
              <label for="event-start-time">開始時間</label>
              <input
                id="event-start-time"
                type="time"
                bind:value={eventStartTime}
                class:error={eventFormState.errors.start}
                onfocus={() => {
                  if (
                    eventTimeLabel === "all-day" ||
                    eventTimeLabel === "some-timing"
                  ) {
                    timeMode = "default";
                    isManualDateOrTimeEdit = true;
                    eventTimeLabel = "timed";
                    eventFormActions.switchTimeLabel("timed");
                  }
                }}
                oninput={() => {
                  if (
                    eventTimeLabel === "all-day" ||
                    eventTimeLabel === "some-timing"
                  ) {
                    timeMode = "default";
                    isManualDateOrTimeEdit = true;
                    eventTimeLabel = "timed";
                    eventFormActions.switchTimeLabel("timed");
                  }
                  // Update form state with combined date and time
                  const startDateTime =
                    eventStartDate && eventStartTime
                      ? `${eventStartDate}T${eventStartTime}`
                      : "";
                  eventFormActions.updateField("start", startDateTime);
                }}
              />
              {#if eventFormState.errors.start}
                <div class="field-error">{eventFormState.errors.start}</div>
              {/if}
            </div>
            <div class="inline-field">
              <label for="event-end-time">終了時間</label>
              <input
                id="event-end-time"
                type="time"
                bind:value={eventEndTime}
                class:error={eventFormState.errors.end}
                onfocus={() => {
                  if (
                    eventTimeLabel === "all-day" ||
                    eventTimeLabel === "some-timing"
                  ) {
                    timeMode = "default";
                    isManualDateOrTimeEdit = true;
                    eventTimeLabel = "timed";
                    eventFormActions.switchTimeLabel("timed");
                  }
                }}
                oninput={() => {
                  if (
                    eventTimeLabel === "all-day" ||
                    eventTimeLabel === "some-timing"
                  ) {
                    timeMode = "default";
                    isManualDateOrTimeEdit = true;
                    eventTimeLabel = "timed";
                    eventFormActions.switchTimeLabel("timed");
                  }
                  // Update form state with combined date and time
                  const endDateTime =
                    eventEndDate && eventEndTime
                      ? `${eventEndDate}T${eventEndTime}`
                      : "";
                  eventFormActions.updateField("end", endDateTime);
                }}
              />
              {#if eventFormState.errors.end}
                <div class="field-error">{eventFormState.errors.end}</div>
              {/if}
            </div>
          </div>

          <!-- Recurrence Settings -->
          <div class="recurrence-toggle">
            <label class="toggle-switch">
              <input type="checkbox" bind:checked={isRecurring} />
              <span class="toggle-slider"></span>
              <span class="toggle-label">繰り返し設定</span>
            </label>
          </div>

          {#if isRecurring}
            <div class="recurrence-panel">
              <div class="recurrence-field">
                <label for="recurrence-interval-input" class="field-label"
                  >繰り返し</label
                >
                <div class="interval-row">
                  <input
                    id="recurrence-interval-input"
                    type="number"
                    min="1"
                    bind:value={recurrenceInterval}
                    class="interval-number"
                    placeholder="1"
                  />
                  <select bind:value={recurrenceFrequency} class="unit-select">
                    <option value="DAILY">日</option>
                    <option value="WEEKLY">週</option>
                    <option value="MONTHLY">月</option>
                    <option value="YEARLY">年</option>
                  </select>
                  <span class="unit-suffix">ごと</span>
                </div>
              </div>

              {#if recurrenceFrequency === "WEEKLY"}
                <div class="recurrence-field">
                  <span class="field-label">曜日</span>
                  <div class="day-grid">
                    {#each ["日", "月", "火", "水", "木", "金", "土"] as day, i (i)}
                      <label class="day-pill {weeklyDays[i] ? 'active' : ''}">
                        <input type="checkbox" bind:checked={weeklyDays[i]} />
                        {day}
                      </label>
                    {/each}
                  </div>
                </div>
              {/if}

              {#if recurrenceFrequency === "MONTHLY"}
                {@const startDate = new Date(
                  eventStartDate + "T" + (eventStartTime || "00:00"),
                )}
                {@const dayOfMonth = startDate.getDate()}
                {@const weekdays = ["日", "月", "火", "水", "木", "金", "土"]}
                {@const weekday = weekdays[startDate.getDay()]}
                {@const weekOfMonth = Math.ceil(dayOfMonth / 7)}
                {@const positionText =
                  weekOfMonth > 4 ? "最終" : `第${weekOfMonth}`}

                <div class="recurrence-field">
                  <span class="field-label">繰り返しパターン</span>
                  <div class="monthly-options">
                    <label
                      class="option-card {monthlyType === 'dayOfMonth'
                        ? 'selected'
                        : ''}"
                    >
                      <input
                        type="radio"
                        name="monthly-type"
                        value="dayOfMonth"
                        bind:group={monthlyType}
                      />
                      <span class="option-text">毎月{dayOfMonth}日</span>
                    </label>
                    <label
                      class="option-card {monthlyType === 'nthWeekday'
                        ? 'selected'
                        : ''}"
                    >
                      <input
                        type="radio"
                        name="monthly-type"
                        value="nthWeekday"
                        bind:group={monthlyType}
                      />
                      <span class="option-text"
                        >毎月{positionText}{weekday}曜日</span
                      >
                    </label>
                  </div>
                </div>
              {/if}

              {#if recurrenceFrequency === "YEARLY"}
                {@const startDate = new Date(
                  eventStartDate + "T" + (eventStartTime || "00:00"),
                )}
                {@const month = startDate.getMonth() + 1}
                {@const day = startDate.getDate()}

                <div class="recurrence-field">
                  <span class="field-label">繰り返しパターン</span>
                  <div class="yearly-info">
                    毎年{month}月{day}日
                  </div>
                </div>
              {/if}

              <div class="recurrence-field">
                <label for="recurrence-end" class="field-label">
                  終了日
                  <small class="field-hint">空欄 = ずっと繰り返す</small>
                </label>
                <input
                  id="recurrence-end"
                  type="date"
                  bind:value={recurrenceEndDate}
                  class="date-input"
                />
              </div>
            </div>
          {/if}
        </div>

        <!-- General Error Display -->
        {#if eventFormState.errors.general}
          <div class="general-error">
            <div class="error-icon">⚠️</div>
            <div class="error-message">{eventFormState.errors.general}</div>
          </div>
        {/if}

        <div class="form-actions">
          {#if isEventEditing}
            <button
              type="button"
              class="cancel-btn"
              onclick={() => {
                eventActions.cancelEventForm();
              }}>キャンセル</button
            >
            <button
              type="button"
              class="submit-btn"
              onclick={() => {
                eventActions.submitEventForm();
              }}>更新</button
            >
          {:else}
            <button
              type="button"
              class="cancel-btn"
              onclick={() => eventActions.cancelEventForm()}>キャンセル</button
            >
            <button
              type="button"
              class="submit-btn"
              onclick={() => {
                eventActions.submitEventForm();
              }}>作成</button
            >
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Hide all scrollbars */
  * {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
  }

  *::-webkit-scrollbar {
    display: none; /* Chrome/Safari/Opera */
  }

  .calendar-view {
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    backdrop-filter: blur(6px) saturate(110%);
    overflow: hidden;
    min-height: 0;
    box-sizing: border-box;
  }

  .calendar-grid {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-xs) var(--space-sm);
    border-bottom: 1px solid var(--glass-border);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-weight: var(--font-weight-light);
    position: sticky;
    top: 0;
    z-index: 10;
    flex-shrink: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .recurrence-loading {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--fs-xs);
    color: var(--primary);
    padding: var(--space-xs) var(--space-sm);
    background: rgba(0, 200, 255, 0.1);
    border-radius: var(--radius-sm);
  }

  .loading-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(0, 200, 255, 0.2);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    white-space: nowrap;
  }

  .recurrence-error {
    font-size: var(--fs-xs);
    color: var(--danger, #ff4444);
    padding: var(--space-xs) var(--space-sm);
    background: rgba(255, 68, 68, 0.1);
    border-radius: var(--radius-sm);
    cursor: help;
    white-space: nowrap;
  }

  .month-navigation {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .month-navigation h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--fs-md);
    color: var(--primary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-shadow: 0 0 8px rgba(0, 200, 255, 0.15);
  }

  .month-navigation button {
    width: 1.75rem;
    height: 1.75rem;
    border: 1px solid var(--primary);
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-family: var(--font-display);
    transition: all 0.18s ease;
  }

  .month-navigation button:hover {
    background: var(--primary);
    color: var(--bg);
    box-shadow: 0 0 14px rgba(0, 200, 255, 0.22);
    transform: translateY(-2px);
  }

  .add-event-button {
    width: 2rem;
    height: 2rem;
    background: var(--coral);
    color: var(--white);
    border: 1px solid var(--coral);
    border-radius: 50%;
    cursor: pointer;
    font-weight: 600;
    font-family: var(--font-family);
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .add-event-button:hover {
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    min-height: 0;
    grid-auto-rows: minmax(60px, 1fr); /* minimum 60px height per row */
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--glass-border);
    flex-shrink: 0;
  }

  .weekday {
    padding: var(--space-sm) var(--space-xs);
    text-align: center;
    font-weight: var(--font-weight-bold);
    color: var(--text-tertiary);
    font-size: var(--fs-xs);
    font-family: var(--font-family);
    text-transform: uppercase;
    letter-spacing: 0.7px;
    letter-spacing: 0.05em;
  }

  .calendar-day {
    border: 1px solid var(--glass-border);
    padding: var(--space-sm);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    min-height: 100%; /* fill the grid row height */
    background: var(--bg-card);
    position: relative;
    overflow: visible; /* Allow event bars to extend beyond day boundaries */
    outline: none; /* Remove browser default focus outline */
  }

  .calendar-day:hover {
    background: rgba(240, 138, 119, 0.15);
    border: 1px solid var(--coral);
  }

  .calendar-day:focus,
  .calendar-day:active {
    outline: none;
  }

  .calendar-day.today {
    background: rgba(156, 202, 235, 0.15);
    box-shadow: inset 0 0 12px rgba(156, 202, 235, 0.2);
  }

  .calendar-day.today .day-number {
    background: var(--event-blue);
    color: var(--white);
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family);
    box-shadow: 0 0 8px rgba(156, 202, 235, 0.3);
  }

  .calendar-day.selected {
    border: 1px solid var(--coral);
  }

  .calendar-day.other-month {
    color: var(--text-secondary);
    background: var(--bg-card);
    opacity: 0.6;
  }

  .day-number {
    font-weight: var(--font-weight-normal);
    margin-bottom: var(--space-xs);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: var(--fs-xl);
    letter-spacing: 1.5px;
  }

  .day-events {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  .event-bar {
    height: 16px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    padding: 0 4px;
    box-shadow: 0 0 4px rgba(0, 200, 255, 0.3);
    overflow: visible;
    position: absolute;
    left: 0;
    right: 0;
  }

  .event-bar.start {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    margin-right: calc(-1 * var(--space-sm) - 1px);
    padding-right: calc(var(--space-sm) + 1px);
    z-index: 2;
  }

  .event-bar.middle {
    border-radius: 0;
    margin-left: calc(-1 * var(--space-sm) - 1px);
    margin-right: calc(-1 * var(--space-sm) - 1px);
    padding-left: calc(var(--space-sm) + 1px);
    padding-right: calc(var(--space-sm) + 1px);
    z-index: 1;
  }

  .event-bar.end {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: calc(-1 * var(--space-sm) - 1px);
    padding-left: calc(var(--space-sm) + 1px);
    z-index: 2;
  }

  .event-label {
    font-size: var(--fs-xs);
    color: var(--text-primary);
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--font-family);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .forever-indicator {
    color: #ff9800;
    font-weight: bold;
    font-size: 0.9em;
    margin-left: 4px;
  }

  .duplicate-indicator {
    color: #9c27b0;
    font-weight: bold;
    font-size: 0.9em;
    margin-left: 4px;
  }

  .debug-toggle {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--text);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    margin-right: 8px;
  }

  .debug-toggle:hover {
    background: var(--glass-hover);
  }

  .debug-info {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    padding: 16px;
    margin: 16px;
    font-family: monospace;
    font-size: 0.8rem;
  }

  .debug-info h3 {
    margin: 0 0 12px 0;
    color: var(--text);
    font-family: var(--font-display);
  }

  .debug-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
  }

  .debug-stat {
    background: var(--glass-bg);
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--glass-border);
  }

  .forever-events-list {
    background: var(--glass-bg);
    padding: 12px;
    border-radius: 4px;
    border: 1px solid var(--glass-border);
  }

  .forever-events-list h4 {
    margin: 0 0 8px 0;
    color: var(--text);
    font-family: var(--font-display);
  }

  .forever-events-list ul {
    margin: 0;
    padding-left: 16px;
  }

  .forever-events-list li {
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .event-time {
    font-size: 0.75rem;
    color: var(--muted);
    font-family: var(--font-display);
  }

  .empty-state {
    text-align: center;
    color: var(--muted);
    font-style: italic;
    padding: var(--space-md);
  }

  /* Timeline Popup Styles */
  .timeline-popup {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    z-index: 2100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  .popup-content {
    background: var(--bg-card);
    border: 1px solid var(--ui-border);
    border-radius: 16px 16px 0 0;
    padding: var(--space-md);
    width: 100%;
    max-width: 600px;
    max-height: calc(90vh - var(--bottom-nav-height, 80px));
    overflow-y: auto;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
    animation: slideUp 0.3s ease;
    scrollbar-width: thin;
    scrollbar-color: var(--accent-primary) transparent;
    margin-bottom: calc(
      var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom)
    );
    padding-bottom: var(--space-md);
  }

  @media (max-width: 768px) {
    .popup-content {
      padding-left: var(--space-sm);
      padding-right: var(--space-sm);
      padding-top: var(--space-md);
      padding-bottom: var(--space-md);
      margin-bottom: calc(
        var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom)
      );
    }
  }

  .popup-content::-webkit-scrollbar {
    width: 6px;
  }

  .popup-content::-webkit-scrollbar-thumb {
    background: var(--accent-primary);
    border-radius: var(--radius-md);
  }

  .popup-content::-webkit-scrollbar-track {
    background: transparent;
  }

  @media (min-width: 768px) {
    .timeline-popup {
      align-items: center;
    }

    .popup-content {
      border-radius: var(--radius-lg);
      max-height: 80vh;
      margin-bottom: 0;
      padding: var(--space-lg);
      padding-bottom: var(--space-lg);
    }

    .popup-header {
      margin-bottom: var(--space-lg);
      padding-bottom: var(--space-md);
    }
  }

  .timeline-container {
    height: 70vh;
    max-height: calc(90vh - 200px);
    overflow: hidden;
    position: relative;
  }

  @media (max-width: 768px) {
    .timeline-container {
      height: calc(100vh - 180px);
      max-height: calc(100vh - 180px);
      min-height: 300px;
    }

    .timeline-view {
      height: 100%;
    }
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--ui-border);
  }

  @media (max-width: 768px) {
    .popup-header {
      margin-bottom: var(--space-sm);
      padding-bottom: var(--space-xs);
    }
  }

  .popup-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--fs-lg);
    font-family: var(--font-family);
    font-weight: var(--font-weight-normal);
  }

  .popup-header .close-button {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--text-secondary);
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .popup-header .close-button:hover {
    background: var(--danger);
    color: white;
  }

  .timeline-view {
    position: relative;
    height: 100%;
    min-height: 400px;
    background: var(--bg-card);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .timeline-hours {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .hour-indicator {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    display: flex;
    align-items: center;
  }

  .hour-label {
    position: absolute;
    left: 0.25rem;
    top: -0.5rem;
    font-size: 0.625rem;
    color: var(--text-secondary);
    background: var(--bg-card);
    padding: 0 0.125rem;
    font-weight: 500;
    line-height: 1;
    font-family: var(--font-family);
  }

  .hour-line {
    width: 100%;
    height: 1px;
    background: var(--glass-border);
    margin-left: 2.5rem;
  }

  .current-time-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent-primary);
    z-index: 10;
    pointer-events: none;
    box-shadow: 0 0 8px rgba(240, 138, 119, 0.5);
  }

  .current-time-line::before {
    content: "";
    position: absolute;
    left: 0;
    top: -4px;
    width: 0;
    height: 0;
    border-left: 6px solid var(--accent-primary);
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
  }

  .timeline-columns {
    position: absolute;
    top: 0;
    left: 2.5rem;
    right: 0;
    height: 100%;
    display: flex;
  }

  .timeline-column {
    position: relative;
    height: 100%;
    border-right: 1px solid var(--glass-border);
  }

  .timeline-column:last-child {
    border-right: none;
  }

  .timeline-event-block {
    position: absolute;
    left: 0.125rem;
    right: 0.125rem;
    padding: 0.25rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.18s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 8px rgba(0, 200, 255, 0.2);
    overflow: hidden;
    min-height: 20px;
  }

  .timeline-event-block:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    z-index: 5;
  }

  .timeline-event-title {
    font-weight: 600;
    font-size: 0.75rem;
    line-height: 1.1;
    margin-bottom: 0.125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--font-family);
  }

  .timeline-event-time {
    font-size: 0.625rem;
    opacity: 0.9;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--font-display);
  }

  /* Modal Styles */
  .event-form-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    z-index: 2100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: var(--bg-card);
    border: 1px solid var(--ui-border);
    border-radius: 16px 16px 0 0;
    padding: var(--space-lg);
    padding-bottom: calc(
      var(--space-lg) + var(--bottom-nav-height, 80px) +
        env(safe-area-inset-bottom)
    );
    margin-bottom: calc(
      var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom)
    );
    width: 100%;
    max-width: 500px;
    max-height: calc(90vh - var(--bottom-nav-height, 80px));
    display: flex;
    flex-direction: column;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
    overflow-y: auto;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (min-width: 768px) {
    .event-form-modal {
      align-items: center;
    }

    .modal-content {
      border-radius: var(--radius-lg);
      max-height: 80vh;
      margin-bottom: 0;
      padding-bottom: var(--space-lg);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--ui-border);
    flex-shrink: 0;
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    scrollbar-width: thin;
    scrollbar-color: var(--accent-primary) transparent;
  }

  .modal-body > * {
    padding-left: var(--space-lg);
    padding-right: var(--space-lg);
  }

  .modal-body > .form-group {
    margin-bottom: var(--space-md);
  }

  .modal-body > .form-group:first-child {
    padding-top: 0;
  }

  .modal-body::-webkit-scrollbar {
    width: 6px;
  }

  .modal-body::-webkit-scrollbar-thumb {
    background: var(--accent-primary);
    border-radius: var(--radius-md);
  }

  .modal-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .modal-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-family: var(--font-family);
    font-weight: var(--font-weight-normal);
    font-size: var(--fs-lg);
    letter-spacing: 0;
  }

  .close-button {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    color: var(--text-secondary);
    transition: all 0.15s ease;
  }

  .close-button:hover {
    background: var(--danger);
    color: white;
  }

  .form-group {
    margin-bottom: var(--space-sm);
  }

  .sticky-title {
    position: sticky;
    top: 0;
    background: var(--bg-card);
    z-index: 10;
    padding: var(--space-sm) 0;
    border-bottom: 1px solid rgba(15, 34, 48, 0.1);
    margin-bottom: var(--space-md);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .form-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
    padding-top: var(--space-md);
    border-top: 1px solid var(--ui-border);
    flex-shrink: 0;
  }

  .cancel-btn,
  .submit-btn {
    flex: 1;
    padding: 12px var(--space-md);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
    font-weight: var(--font-weight-normal);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cancel-btn {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border: 1px solid var(--ui-border);
  }

  .cancel-btn:hover {
    background: var(--bg-tertiary);
    border-color: var(--text-tertiary);
  }

  .submit-btn {
    background: var(--accent-primary);
    color: white;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(240, 138, 119, 0.3);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Error Styling */
  .field-error {
    color: var(--danger, #ff4444);
    font-size: 0.75rem;
    margin-top: 0.25rem;
    font-weight: 500;
  }

  .general-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 68, 68, 0.1);
    border: 1px solid rgba(255, 68, 68, 0.3);
    border-radius: 6px;
    padding: 0.75rem;
    margin: 1rem 0;
  }

  .error-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .error-message {
    color: var(--danger, #ff4444);
    font-size: 0.875rem;
    font-weight: 500;
  }

  input.error {
    border-color: var(--danger, #ff4444);
    box-shadow: 0 0 0 1px rgba(255, 68, 68, 0.2);
  }

  input.error:focus {
    border-color: var(--danger, #ff4444);
    box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.3);
  }

  /* Recurrence UI */
  .recurrence-toggle {
    border-top: 1px solid rgba(0, 200, 255, 0.1);
    padding-top: var(--space-md);
    margin-top: var(--space-md);
  }

  .toggle-switch {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
    user-select: none;
  }

  .toggle-switch input[type="checkbox"] {
    position: relative;
    appearance: none;
    width: 44px;
    height: 24px;
    background: #e6eef4;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.18s ease;
  }

  .toggle-switch input[type="checkbox"]::after {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    left: 3px;
    top: 3px;
    transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .toggle-switch input[type="checkbox"]:checked {
    background: var(--primary);
  }

  .toggle-switch input[type="checkbox"]:checked::after {
    transform: translateX(20px);
  }

  .toggle-label {
    font-weight: 600;
    font-size: var(--fs-sm);
    color: var(--navy-700);
  }

  .recurrence-panel {
    margin-top: var(--space-md);
    padding: var(--space-md);
    background: linear-gradient(
      135deg,
      rgba(0, 200, 255, 0.03),
      rgba(240, 138, 119, 0.03)
    );
    border: 1px solid rgba(0, 200, 255, 0.15);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .recurrence-field {
    margin-bottom: var(--space-md);
  }

  .recurrence-field:last-child {
    margin-bottom: 0;
  }

  .field-label {
    display: block;
    margin-bottom: var(--space-sm);
    font-weight: 600;
    font-size: var(--fs-sm);
    color: var(--navy-700);
  }

  .field-hint {
    font-weight: normal;
    color: var(--muted);
    font-size: 0.9em;
    margin-left: var(--space-xs);
  }

  .interval-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .interval-number {
    width: 70px;
    padding: 10px 12px;
    border: 1px solid rgba(15, 34, 48, 0.1);
    border-radius: var(--radius-sm);
    background: white;
    color: var(--navy-700);
    font-size: var(--fs-md);
    font-family: var(--font-family);
    transition: border 0.18s ease;
  }

  .interval-number:focus {
    border-color: var(--primary);
    outline: none;
  }

  .unit-select {
    padding: 10px 12px;
    border: 1px solid rgba(15, 34, 48, 0.1);
    border-radius: var(--radius-sm);
    background: white;
    color: var(--navy-700);
    font-size: var(--fs-md);
    font-family: var(--font-family);
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .unit-select:hover {
    border-color: var(--primary);
  }

  .unit-select:focus {
    border-color: var(--primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 200, 255, 0.1);
  }

  .unit-suffix {
    font-size: var(--fs-md);
    color: var(--navy-700);
  }

  .day-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--space-xs);
  }

  .day-pill {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 4px;
    border: 1px solid rgba(15, 34, 48, 0.1);
    border-radius: var(--radius-sm);
    background: white;
    cursor: pointer;
    font-size: var(--fs-sm);
    font-weight: 500;
    color: var(--navy-700);
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
    user-select: none;
  }

  .day-pill input[type="checkbox"] {
    display: none;
  }

  .day-pill:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 200, 255, 0.15);
  }

  .day-pill.active {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 200, 255, 0.3);
  }

  .monthly-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .option-card {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid rgba(15, 34, 48, 0.1);
    border-radius: var(--radius-sm);
    background: white;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .option-card input[type="radio"] {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(15, 34, 48, 0.2);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.18s ease;
    position: relative;
  }

  .option-card input[type="radio"]:checked::after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    background: var(--primary);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .option-card:hover {
    border-color: var(--primary);
    background: rgba(0, 200, 255, 0.02);
    transform: translateX(2px);
  }

  .option-card.selected {
    border-color: var(--primary);
    background: rgba(0, 200, 255, 0.05);
    box-shadow: 0 2px 8px rgba(0, 200, 255, 0.15);
  }

  .option-card.selected input[type="radio"] {
    border-color: var(--primary);
  }

  .option-text {
    font-size: var(--fs-md);
    font-weight: 500;
    color: var(--navy-700);
  }

  .yearly-info {
    padding: var(--space-md);
    background: rgba(0, 200, 255, 0.05);
    border: 1px solid rgba(0, 200, 255, 0.2);
    border-radius: var(--radius-sm);
    text-align: center;
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--primary);
  }

  .date-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid rgba(15, 34, 48, 0.1);
    border-radius: var(--radius-sm);
    background: white;
    color: var(--navy-700);
    font-size: var(--fs-md);
    font-family: var(--font-family);
    transition: border 0.18s ease;
  }

  .date-input:focus {
    border-color: var(--primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 200, 255, 0.1);
  }

  .form-label {
    display: block;
    margin-bottom: var(--space-sm);
    font-weight: 600;
    color: var(--muted);
    font-family: var(--font-family);
    font-size: var(--fs-sm);
  }

  .event-recurrence {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin-top: var(--space-xs);
    font-size: var(--fs-xs);
    color: var(--primary);
  }

  .recurrence-icon {
    font-size: 0.875rem;
  }

  .recurrence-text {
    font-style: italic;
  }

  .form-group label {
    display: block;
    margin-bottom: var(--space-sm);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: var(--fs-sm);
    letter-spacing: 0.5px;
  }

  .colored-label {
    color: var(--coral) !important;
    font-weight: 700;
  }

  .form-group input {
    width: 100%;
    padding: var(--space-sm);
    border: 2px solid rgba(15, 34, 48, 0.1);
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
    font-weight: 500;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-family);
    transition: all 0.18s ease;
  }

  .form-group input:focus {
    border-color: var(--coral);
    background: rgba(240, 138, 119, 0.05);
    outline: none;
  }

  /* Inline form fields */
  .inline-field {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  .inline-field label {
    font-size: var(--fs-sm);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    white-space: nowrap;
    min-width: fit-content;
  }

  .inline-field input {
    flex: 1;
    min-width: 0;
  }

  /* Time Label Switches */
  .time-label-switches {
    display: flex;
    gap: var(--space-xs);
    margin-top: var(--space-sm);
  }

  .time-switch {
    flex: 1;
    padding: var(--space-sm) var(--space-xs);
    border: 2px solid rgba(15, 34, 48, 0.1);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: var(--fs-xs);
    font-weight: 500;
    transition: all 0.18s ease;
    cursor: pointer;
  }

  .time-switch:hover {
    border-color: var(--coral);
    background: rgba(240, 138, 119, 0.05);
  }

  .time-switch.active {
    background: var(--coral);
    color: var(--white);
    border-color: var(--coral);
  }

  /* Ensure 終日 button stays coral when active, not gray */
  .time-switch.active:not(.grey) {
    background: var(--coral) !important;
    color: var(--white) !important;
    border-color: var(--coral) !important;
  }

  .time-switch.grey {
    background: #e5e7eb;
    color: #6b7280;
    border-color: #d1d5db;
  }

  .time-switch.grey.active {
    background: #9ca3af;
    color: var(--white);
    border-color: #9ca3af;
  }

  /* Importance Star Buttons */
  .importance-stars {
    display: flex;
    gap: 0;
    margin-top: var(--space-sm);
    margin-left: 0;
    padding-left: 0;
  }

  .star-button {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    border: 2px solid rgba(15, 34, 48, 0.1);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: var(--fs-lg);
    font-weight: 500;
    transition: all 0.18s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .star-button:first-child {
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    border-right: 1px solid rgba(15, 34, 48, 0.1);
  }

  .star-button:last-child {
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    border-left: 1px solid rgba(15, 34, 48, 0.1);
  }

  .star-button:not(:first-child):not(:last-child) {
    border-left: 1px solid rgba(15, 34, 48, 0.1);
    border-right: 1px solid rgba(15, 34, 48, 0.1);
  }

  .star-button:hover {
    border-color: var(--coral);
    background: rgba(240, 138, 119, 0.05);
  }

  .star-button.active {
    background: var(--coral);
    color: var(--white);
    border-color: var(--coral);
  }

  .form-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-sm);
  }

  .form-actions button {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--coral);
    background: transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--fs-sm);
    color: var(--coral);
    font-family: var(--font-family);
    font-weight: 600;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  .form-actions button:first-child {
    background: var(--coral);
    color: var(--white);
  }

  .form-actions button:first-child:hover {
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  .form-actions button:hover {
    background: var(--coral);
    color: var(--white);
    box-shadow: 0 4px 14px rgba(240, 138, 119, 0.3);
    transform: translateY(-2px);
  }

  /* responsive adjustment: height→auto, max-height→50vh */
  @media (max-width: 768px) {
    .recurrence-error {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
    }

    .header-actions {
      gap: var(--space-xs);
    }

    .modal-content {
      width: 95%;
      max-height: calc(100vh - 80px);
      margin: var(--space-lg) 0;
    }

    .modal-body {
      padding: var(--space-md);
    }

    .form-actions {
      padding: var(--space-sm) var(--space-md);
    }

    .recurrence-panel {
      padding: var(--space-sm);
    }

    .day-grid {
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .day-pill {
      padding: 6px 2px;
      font-size: 0.7rem;
    }

    .interval-row {
      flex-wrap: wrap;
    }

    .timeline-view {
      height: auto;
      max-height: 50vh;
    }

    .calendar-day {
      min-height: 60px;
      padding: var(--space-xs);
    }

    .day-number {
      font-size: 0.625rem;
    }

    .event-bar {
      height: 14px;
    }

    .event-label {
      font-size: 0.5rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .calendar-header {
      justify-content: flex-start;
      padding: var(--space-xs);
    }

    .month-navigation {
      gap: var(--space-xs);
    }

    .month-navigation h2 {
      font-size: var(--fs-sm);
    }

    .month-navigation button {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 0.875rem;
    }

    .add-event-button {
      display: none; /* Hide add button on mobile, save space */
    }
  }
</style>
