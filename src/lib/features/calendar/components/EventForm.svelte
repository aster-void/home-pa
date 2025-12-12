<script lang="ts">
  import type { Recurrence } from "$lib/types.ts";
  import {
    dataState,
    eventFormState,
    eventFormActions,
    eventActions,
    uiActions,
  } from "$lib/bootstrap/compat.svelte.ts";
  import {
    utcToLocalDateString,
    utcToLocalTimeString,
  } from "$lib/utils/date-utils.ts";

  // Form state
  let eventTitle = $state("");
  let eventStartDate = $state("");
  let eventEndDate = $state("");
  let eventStartTime = $state("");
  let eventEndTime = $state("");
  let eventAddress = $state("");
  let eventImportance = $state<"low" | "medium" | "high">("medium");
  let eventTimeLabel = $state<"all-day" | "some-timing" | "timed">("all-day");

  // Tri-state for clarity
  type TimeMode = "default" | "all-day" | "some-timing";
  let timeMode = $state<TimeMode>("default");
  let isGreyState = $derived(timeMode === "default");
  let isEventEditing = $state(false);
  let isManualDateOrTimeEdit = $state(false);

  // Recurrence state
  let isRecurring = $state(false);
  let recurrenceFrequency = $state<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">(
    "WEEKLY",
  );
  let recurrenceInterval = $state(1);
  let recurrenceEndDate = $state<string>("");
  let weeklyDays = $state<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  let monthlyType = $state<"dayOfMonth" | "nthWeekday">("nthWeekday");

  // Sync from store
  $effect(() => {
    const form = eventFormState.formData;
    eventTitle = form.title;

    if (form.start) {
      const startDateTime = new Date(form.start);
      eventStartDate = utcToLocalDateString(startDateTime);
      eventStartTime = utcToLocalTimeString(startDateTime);
    } else {
      eventStartDate = "";
      eventStartTime = "";
    }

    if (form.end) {
      const endDateTime = new Date(form.end);
      eventEndDate = utcToLocalDateString(endDateTime);
      eventEndTime = utcToLocalTimeString(endDateTime);
    } else {
      eventEndDate = "";
      eventEndTime = "";
    }

    if (!isManualDateOrTimeEdit) {
      if (form.timeLabel === "all-day") {
        eventStartTime = "00:00";
        eventEndTime = "23:59";
      } else if (form.timeLabel === "some-timing") {
        eventStartTime = "";
        eventEndTime = "";
      }
    }

    eventAddress = form.address || "";
    eventImportance = form.importance || "medium";
    eventTimeLabel = form.timeLabel || "all-day";
    isEventEditing = form.isEditing;
  });

  // Sync to store
  $effect(() => {
    eventFormActions.updateField("title", eventTitle);
  });

  $effect(() => {
    eventFormActions.updateField("address", eventAddress);
  });

  $effect(() => {
    eventFormActions.updateField("importance", eventImportance);
  });

  $effect(() => {
    eventFormActions.updateField("timeLabel", eventTimeLabel);
  });

  $effect(() => {
    const recurrence = buildRecurrenceObject();
    eventFormActions.updateField("recurrence", recurrence);
  });

  $effect(() => {
    const startDateTime =
      eventStartDate && eventStartTime
        ? `${eventStartDate}T${eventStartTime}`
        : "";
    const endDateTime =
      eventEndDate && eventEndTime ? `${eventEndDate}T${eventEndTime}` : "";

    eventFormActions.updateFields({
      start: startDateTime,
      end: endDateTime,
    });
  });

  function buildRecurrenceObject(): Recurrence {
    if (!isRecurring) {
      return { type: "NONE" };
    }

    let rrule = `FREQ=${recurrenceFrequency}`;

    if (recurrenceInterval > 1) {
      rrule += `;INTERVAL=${recurrenceInterval}`;
    }

    if (recurrenceFrequency === "WEEKLY" && weeklyDays.some((d) => d)) {
      const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const selectedDays = weeklyDays
        .map((selected, i) => (selected ? dayNames[i] : null))
        .filter(Boolean)
        .join(",");
      if (selectedDays) {
        rrule += `;BYDAY=${selectedDays}`;
      }
    }

    if (recurrenceFrequency === "MONTHLY") {
      if (monthlyType === "dayOfMonth") {
        const startDate = new Date(
          eventStartDate + "T" + (eventStartTime || "00:00"),
        );
        rrule += `;BYMONTHDAY=${startDate.getDate()}`;
      } else {
        const startDate = new Date(
          eventStartDate + "T" + (eventStartTime || "00:00"),
        );
        const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][
          startDate.getDay()
        ];
        const weekOfMonth = Math.ceil(startDate.getDate() / 7);
        const position = weekOfMonth > 4 ? -1 : weekOfMonth;
        rrule += `;BYDAY=${position}${dayOfWeek}`;
      }
    }

    if (recurrenceEndDate) {
      const endDate = new Date(recurrenceEndDate + "T23:59:59");
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, "0");
      const day = String(endDate.getDate()).padStart(2, "0");
      rrule += `;UNTIL=${year}${month}${day}T235959Z`;
    }

    return { type: "RRULE", rrule };
  }

  function switchToTimedMode() {
    timeMode = "default";
    isManualDateOrTimeEdit = true;
    eventTimeLabel = "timed";
    eventFormActions.switchTimeLabel("timed");
  }
</script>

<div
  class="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
  onclick={() => uiActions.hideEventForm()}
  onkeydown={(e) => e.key === "Escape" && uiActions.hideEventForm()}
  role="button"
  tabindex="-1"
  aria-label="Close event form"
>
  <div
    class="modal-box max-h-[90vh] w-full max-w-[500px] overflow-y-auto rounded-xl border border-base-300 bg-base-100 shadow-lg"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && uiActions.hideEventForm()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="sticky top-0 z-[1] flex items-center justify-between border-b border-base-300 bg-base-100 p-4"
    >
      <h3 class="m-0 text-lg font-normal text-base-content">
        {isEventEditing ? "予定を編集" : "新しい予定"}
      </h3>
      <button
        class="btn btn-ghost transition-all duration-200 btn-sm hover:bg-error hover:text-white"
        onclick={() => uiActions.hideEventForm()}
        aria-label="Close"
      >
        ✕
      </button>
    </div>

    <div class="flex flex-col gap-4 p-4">
      <!-- Title -->
      <div class="form-control">
        <label class="label" for="event-title">
          <span class="label-text text-sm text-base-content/60">タイトル</span>
        </label>
        <input
          id="event-title"
          type="text"
          class="input-bordered input w-full {eventFormState.errors.title
            ? 'input-error'
            : ''}"
          bind:value={eventTitle}
          placeholder="予定のタイトルを入力"
        />
        {#if eventFormState.errors.title}
          <label class="label">
            <span class="label-text-alt text-error"
              >{eventFormState.errors.title}</span
            >
          </label>
        {/if}
      </div>

      <!-- Address -->
      <div class="form-control">
        <label class="label" for="event-address">
          <span class="label-text text-sm text-base-content/60">場所</span>
        </label>
        <input
          id="event-address"
          type="text"
          class="input-bordered input w-full"
          bind:value={eventAddress}
          placeholder="場所を入力（任意）"
        />
      </div>

      <!-- Importance -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-sm text-base-content/60">重要度</span>
        </label>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn flex-1 btn-sm {eventImportance === 'low'
              ? 'border-[#F08A77] bg-[#F08A77]/10'
              : 'border-base-300 btn-ghost'} border transition-all duration-200"
            onclick={() => (eventImportance = "low")}
          >
            ⭐
          </button>
          <button
            type="button"
            class="btn flex-1 btn-sm {eventImportance === 'medium'
              ? 'border-[#F08A77] bg-[#F08A77]/10'
              : 'border-base-300 btn-ghost'} border transition-all duration-200"
            onclick={() => (eventImportance = "medium")}
          >
            ⭐⭐
          </button>
          <button
            type="button"
            class="btn flex-1 btn-sm {eventImportance === 'high'
              ? 'border-[#F08A77] bg-[#F08A77]/10'
              : 'border-base-300 btn-ghost'} border transition-all duration-200"
            onclick={() => (eventImportance = "high")}
          >
            ⭐⭐⭐
          </button>
        </div>
      </div>

      <!-- Time Label Switches -->
      <div class="form-control">
        <div class="flex gap-2">
          <button
            type="button"
            class="btn flex-1 transition-all duration-200 btn-sm
              {timeMode === 'all-day'
              ? 'border-[#F08A77] bg-[#F08A77]/10 text-[#F08A77]'
              : 'border-base-300 btn-ghost'}
              {isGreyState ? 'opacity-60' : ''}"
            onclick={() => {
              timeMode = "all-day";
              eventTimeLabel = "all-day";
              eventFormActions.switchTimeLabel("all-day");
              eventStartTime = "00:00";
              eventEndTime = "23:59";
              isManualDateOrTimeEdit = false;
            }}
          >
            終日
          </button>
          <button
            type="button"
            class="btn flex-1 transition-all duration-200 btn-sm
              {timeMode === 'some-timing'
              ? 'border-[#F08A77] bg-[#F08A77]/10 text-[#F08A77]'
              : 'border-base-300 btn-ghost'}
              {isGreyState ? 'opacity-60' : ''}"
            onclick={() => {
              timeMode = "some-timing";
              eventTimeLabel = "some-timing";
              eventFormActions.switchTimeLabel("some-timing");
              const dateString = utcToLocalDateString(dataState.selectedDate);
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
      <div class="form-control">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="label" for="event-start-date">
              <span class="label-text text-sm text-base-content/60">開始日</span
              >
            </label>
            <input
              id="event-start-date"
              type="date"
              class="input-bordered input w-full"
              bind:value={eventStartDate}
              onfocus={() =>
                eventTimeLabel === "some-timing" && switchToTimedMode()}
              oninput={() =>
                eventTimeLabel === "some-timing" && switchToTimedMode()}
            />
          </div>
          <div>
            <label class="label" for="event-end-date">
              <span class="label-text text-sm text-base-content/60">終了日</span
              >
            </label>
            <input
              id="event-end-date"
              type="date"
              class="input-bordered input w-full"
              bind:value={eventEndDate}
              onfocus={() =>
                eventTimeLabel === "some-timing" && switchToTimedMode()}
              oninput={() =>
                eventTimeLabel === "some-timing" && switchToTimedMode()}
            />
          </div>
        </div>
      </div>

      <!-- Time Settings -->
      <div class="form-control">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="label" for="event-start-time">
              <span class="label-text text-sm text-base-content/60"
                >開始時間</span
              >
            </label>
            <input
              id="event-start-time"
              type="time"
              class="input-bordered input w-full {eventFormState.errors.start
                ? 'input-error'
                : ''}"
              bind:value={eventStartTime}
              onfocus={() =>
                (eventTimeLabel === "all-day" ||
                  eventTimeLabel === "some-timing") &&
                switchToTimedMode()}
              oninput={() =>
                (eventTimeLabel === "all-day" ||
                  eventTimeLabel === "some-timing") &&
                switchToTimedMode()}
            />
            {#if eventFormState.errors.start}
              <label class="label">
                <span class="label-text-alt text-error"
                  >{eventFormState.errors.start}</span
                >
              </label>
            {/if}
          </div>
          <div>
            <label class="label" for="event-end-time">
              <span class="label-text text-sm text-base-content/60"
                >終了時間</span
              >
            </label>
            <input
              id="event-end-time"
              type="time"
              class="input-bordered input w-full {eventFormState.errors.end
                ? 'input-error'
                : ''}"
              bind:value={eventEndTime}
              onfocus={() =>
                (eventTimeLabel === "all-day" ||
                  eventTimeLabel === "some-timing") &&
                switchToTimedMode()}
              oninput={() =>
                (eventTimeLabel === "all-day" ||
                  eventTimeLabel === "some-timing") &&
                switchToTimedMode()}
            />
            {#if eventFormState.errors.end}
              <label class="label">
                <span class="label-text-alt text-error"
                  >{eventFormState.errors.end}</span
                >
              </label>
            {/if}
          </div>
        </div>
      </div>

      <!-- Recurrence Toggle -->
      <div class="form-control py-2">
        <label class="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            class="toggle toggle-primary"
            bind:checked={isRecurring}
          />
          <span class="label-text text-sm text-base-content">繰り返し設定</span>
        </label>
      </div>

      {#if isRecurring}
        <div class="card flex flex-col gap-4 bg-base-200 p-4">
          <div class="form-control">
            <label class="label" for="recurrence-interval-input">
              <span class="label-text text-sm text-base-content/60"
                >繰り返し</span
              >
            </label>
            <div class="flex items-center gap-2">
              <input
                id="recurrence-interval-input"
                type="number"
                min="1"
                class="input-bordered input w-[60px] text-center"
                bind:value={recurrenceInterval}
                placeholder="1"
              />
              <select
                class="select-bordered select"
                bind:value={recurrenceFrequency}
              >
                <option value="DAILY">日</option>
                <option value="WEEKLY">週</option>
                <option value="MONTHLY">月</option>
                <option value="YEARLY">年</option>
              </select>
              <span class="text-sm text-base-content/60">ごと</span>
            </div>
          </div>

          {#if recurrenceFrequency === "WEEKLY"}
            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm text-base-content/60">曜日</span
                >
              </label>
              <div class="flex flex-wrap gap-1">
                {#each ["日", "月", "火", "水", "木", "金", "土"] as day, i (i)}
                  <label
                    class="btn btn-sm {weeklyDays[i]
                      ? 'border-[#F08A77] bg-[#F08A77] text-white'
                      : 'border-base-300 btn-ghost'} cursor-pointer transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      class="hidden"
                      bind:checked={weeklyDays[i]}
                    />
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

            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm text-base-content/60"
                  >繰り返しパターン</span
                >
              </label>
              <div class="flex flex-col gap-2">
                <label
                  class="card cursor-pointer border border-base-300 p-2 transition-all duration-200 {monthlyType ===
                  'dayOfMonth'
                    ? 'border-[#F08A77] bg-[#F08A77]/10'
                    : ''}"
                >
                  <div class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="monthly-type"
                      value="dayOfMonth"
                      class="radio radio-sm radio-primary"
                      bind:group={monthlyType}
                    />
                    <span class="text-sm">毎月{dayOfMonth}日</span>
                  </div>
                </label>
                <label
                  class="card cursor-pointer border border-base-300 p-2 transition-all duration-200 {monthlyType ===
                  'nthWeekday'
                    ? 'border-[#F08A77] bg-[#F08A77]/10'
                    : ''}"
                >
                  <div class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="monthly-type"
                      value="nthWeekday"
                      class="radio radio-sm radio-primary"
                      bind:group={monthlyType}
                    />
                    <span class="text-sm">毎月{positionText}{weekday}曜日</span>
                  </div>
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

            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm text-base-content/60"
                  >繰り返しパターン</span
                >
              </label>
              <div class="rounded bg-base-100 p-2 text-sm text-base-content">
                毎年{month}月{day}日
              </div>
            </div>
          {/if}

          <div class="form-control">
            <label class="label" for="recurrence-end">
              <span class="label-text text-sm text-base-content/60">
                終了日
                <span class="ml-1 text-xs opacity-70"
                  >空欄 = ずっと繰り返す</span
                >
              </span>
            </label>
            <input
              id="recurrence-end"
              type="date"
              class="input-bordered input w-full"
              bind:value={recurrenceEndDate}
            />
          </div>
        </div>
      {/if}
    </div>

    <!-- General Error Display -->
    {#if eventFormState.errors.general}
      <div
        class="mx-4 flex items-center gap-2 rounded-lg border border-error bg-error/10 p-3"
      >
        <div class="text-xl">⚠️</div>
        <div class="text-sm text-error">{eventFormState.errors.general}</div>
      </div>
    {/if}

    <div class="flex justify-end gap-2 border-t border-base-300 p-4">
      {#if isEventEditing}
        <button
          type="button"
          class="btn border border-base-300 btn-ghost"
          onclick={() => eventActions.cancelEventForm()}
        >
          キャンセル
        </button>
        <button
          type="button"
          class="btn border-none bg-[#F08A77] text-white hover:bg-[#E87862]"
          onclick={() => eventActions.submitEventForm()}
        >
          更新
        </button>
      {:else}
        <button
          type="button"
          class="btn border border-base-300 btn-ghost"
          onclick={() => eventActions.cancelEventForm()}
        >
          キャンセル
        </button>
        <button
          type="button"
          class="btn border-none bg-[#F08A77] text-white hover:bg-[#E87862]"
          onclick={() => eventActions.submitEventForm()}
        >
          作成
        </button>
      {/if}
    </div>
  </div>
</div>
