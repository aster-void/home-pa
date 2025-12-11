<script lang="ts">
  import type { Recurrence } from "$lib/types.ts";
  import {
    selectedDate,
    eventForm,
    eventFormActions,
    eventFormErrors,
    eventActions,
    uiActions,
  } from "$lib/bootstrap/compat.ts";
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
    const form = $eventForm;
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
        aria-label="Close"
      >
        ✕
      </button>
    </div>

    <div class="modal-body">
      <!-- Title -->
      <div class="form-group sticky-title">
        <div class="inline-field">
          <label for="event-title">タイトル</label>
          <input
            id="event-title"
            type="text"
            bind:value={eventTitle}
            placeholder="予定のタイトルを入力"
            class:error={$eventFormErrors.title}
          />
          {#if $eventFormErrors.title}
            <div class="field-error">{$eventFormErrors.title}</div>
          {/if}
        </div>
      </div>

      <!-- Address -->
      <div class="form-group">
        <div class="inline-field">
          <label for="event-address">場所</label>
          <input
            id="event-address"
            type="text"
            bind:value={eventAddress}
            placeholder="場所を入力（任意）"
          />
        </div>
      </div>

      <!-- Importance -->
      <div class="form-group">
        <div class="inline-field" id="event-importance">
          <label for="event-importance">重要度</label>
          <button
            type="button"
            class="star-button {eventImportance === 'low' ? 'active' : ''}"
            onclick={() => (eventImportance = "low")}
          >
            ⭐
          </button>
          <button
            type="button"
            class="star-button {eventImportance === 'medium' ? 'active' : ''}"
            onclick={() => (eventImportance = "medium")}
          >
            ⭐⭐
          </button>
          <button
            type="button"
            class="star-button {eventImportance === 'high' ? 'active' : ''}"
            onclick={() => (eventImportance = "high")}
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
              const dateString = utcToLocalDateString($selectedDate);
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
            onfocus={() =>
              eventTimeLabel === "some-timing" && switchToTimedMode()}
            oninput={() =>
              eventTimeLabel === "some-timing" && switchToTimedMode()}
          />
        </div>
        <div class="inline-field">
          <label for="event-end-date">終了日</label>
          <input
            id="event-end-date"
            type="date"
            bind:value={eventEndDate}
            onfocus={() =>
              eventTimeLabel === "some-timing" && switchToTimedMode()}
            oninput={() =>
              eventTimeLabel === "some-timing" && switchToTimedMode()}
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
            class:error={$eventFormErrors.start}
            onfocus={() =>
              (eventTimeLabel === "all-day" ||
                eventTimeLabel === "some-timing") &&
              switchToTimedMode()}
            oninput={() =>
              (eventTimeLabel === "all-day" ||
                eventTimeLabel === "some-timing") &&
              switchToTimedMode()}
          />
          {#if $eventFormErrors.start}
            <div class="field-error">{$eventFormErrors.start}</div>
          {/if}
        </div>
        <div class="inline-field">
          <label for="event-end-time">終了時間</label>
          <input
            id="event-end-time"
            type="time"
            bind:value={eventEndTime}
            class:error={$eventFormErrors.end}
            onfocus={() =>
              (eventTimeLabel === "all-day" ||
                eventTimeLabel === "some-timing") &&
              switchToTimedMode()}
            oninput={() =>
              (eventTimeLabel === "all-day" ||
                eventTimeLabel === "some-timing") &&
              switchToTimedMode()}
          />
          {#if $eventFormErrors.end}
            <div class="field-error">{$eventFormErrors.end}</div>
          {/if}
        </div>
      </div>

      <!-- Recurrence Toggle -->
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
              <div class="yearly-info">毎年{month}月{day}日</div>
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
    {#if $eventFormErrors.general}
      <div class="general-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">{$eventFormErrors.general}</div>
      </div>
    {/if}

    <div class="form-actions">
      {#if isEventEditing}
        <button
          type="button"
          class="cancel-btn"
          onclick={() => eventActions.cancelEventForm()}
        >
          キャンセル
        </button>
        <button
          type="button"
          class="submit-btn"
          onclick={() => eventActions.submitEventForm()}
        >
          更新
        </button>
      {:else}
        <button
          type="button"
          class="cancel-btn"
          onclick={() => eventActions.cancelEventForm()}
        >
          キャンセル
        </button>
        <button
          type="button"
          class="submit-btn"
          onclick={() => eventActions.submitEventForm()}
        >
          作成
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .event-form-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
  }

  .modal-content {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--ui-border);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    border-bottom: 1px solid var(--ui-border);
    position: sticky;
    top: 0;
    background: var(--bg-card);
    z-index: 1;
  }

  .modal-header h3 {
    margin: 0;
    font-size: var(--fs-lg);
    font-weight: var(--font-weight-normal);
    color: var(--text-primary);
  }

  .close-button {
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    transition: all 0.15s ease;
  }

  .close-button:hover {
    background: var(--danger);
    color: white;
  }

  .modal-body {
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .inline-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .inline-field label {
    font-size: var(--fs-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-normal);
  }

  .inline-field input {
    padding: var(--space-sm);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: var(--fs-base);
    transition: border-color 0.15s ease;
  }

  .inline-field input:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .inline-field input.error {
    border-color: var(--danger);
  }

  .field-error {
    font-size: var(--fs-xs);
    color: var(--danger);
  }

  .star-button {
    background: transparent;
    border: 1px solid var(--ui-border);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    cursor: pointer;
    opacity: 0.5;
    transition: all 0.15s ease;
  }

  .star-button.active {
    opacity: 1;
    border-color: var(--accent-primary);
    background: rgba(240, 138, 119, 0.1);
  }

  .time-label-switches {
    display: flex;
    gap: var(--space-sm);
  }

  .time-switch {
    flex: 1;
    padding: var(--space-sm);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: var(--fs-sm);
  }

  .time-switch.active {
    border-color: var(--accent-primary);
    background: rgba(240, 138, 119, 0.1);
    color: var(--accent-primary);
  }

  .time-switch.grey {
    opacity: 0.6;
  }

  .recurrence-toggle {
    padding: var(--space-sm) 0;
  }

  .toggle-switch {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
  }

  .toggle-switch input {
    display: none;
  }

  .toggle-slider {
    width: 40px;
    height: 22px;
    background: var(--ui-border);
    border-radius: 11px;
    position: relative;
    transition: background 0.2s ease;
  }

  .toggle-slider::after {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.2s ease;
  }

  .toggle-switch input:checked + .toggle-slider {
    background: var(--accent-primary);
  }

  .toggle-switch input:checked + .toggle-slider::after {
    transform: translateX(18px);
  }

  .toggle-label {
    font-size: var(--fs-sm);
    color: var(--text-primary);
  }

  .recurrence-panel {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .recurrence-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .field-label {
    font-size: var(--fs-sm);
    color: var(--text-secondary);
  }

  .field-hint {
    opacity: 0.7;
    margin-left: var(--space-xs);
  }

  .interval-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .interval-number {
    width: 60px;
    padding: var(--space-sm);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    color: var(--text-primary);
    text-align: center;
  }

  .unit-select {
    padding: var(--space-sm);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .unit-suffix {
    color: var(--text-secondary);
    font-size: var(--fs-sm);
  }

  .day-grid {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .day-pill {
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-full, 20px);
    cursor: pointer;
    font-size: var(--fs-sm);
    transition: all 0.15s ease;
  }

  .day-pill input {
    display: none;
  }

  .day-pill.active {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: white;
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
    padding: var(--space-sm);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .option-card input {
    display: none;
  }

  .option-card.selected {
    border-color: var(--accent-primary);
    background: rgba(240, 138, 119, 0.1);
  }

  .yearly-info {
    padding: var(--space-sm);
    background: var(--bg-card);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
  }

  .date-input {
    padding: var(--space-sm);
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .general-error {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: rgba(255, 59, 59, 0.1);
    border: 1px solid var(--danger);
    border-radius: var(--radius-md);
    margin: 0 var(--space-md);
  }

  .error-icon {
    font-size: 1.2rem;
  }

  .error-message {
    color: var(--danger);
    font-size: var(--fs-sm);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding: var(--space-md);
    border-top: 1px solid var(--ui-border);
  }

  .cancel-btn,
  .submit-btn {
    padding: var(--space-sm) var(--space-lg);
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
    font-weight: var(--font-weight-normal);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cancel-btn {
    background: transparent;
    border: 1px solid var(--ui-border);
    color: var(--text-secondary);
  }

  .cancel-btn:hover {
    background: var(--bg-secondary);
  }

  .submit-btn {
    background: var(--accent-primary);
    border: none;
    color: white;
  }

  .submit-btn:hover {
    opacity: 0.9;
  }
</style>
