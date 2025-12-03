import { describe, it, expect, beforeEach } from "vitest";
import { events, selectedDate, clearAllData } from "../../stores/data.js";
import { displayEvents } from "../../stores/recurrence.store.js";
import { gaps } from "../../stores/gaps.js";

function setStore<T>(store: any, value: T) {
  store.set(value as any);
}

describe("App integration (stores)", () => {
  beforeEach(() => {
    clearAllData();
    setStore(selectedDate, new Date("2025-03-10T00:00:00Z"));
  });

  it("reflects events in displayEvents and gaps", async () => {
    const e = {
      id: "x1",
      title: "Work Block",
      start: new Date("2025-03-10T09:00:00Z"),
      end: new Date("2025-03-10T10:00:00Z"),
      timeLabel: "some-timing" as const,
    } as any;
    setStore(events, [e]);

    let list: any[] = [];
    displayEvents.subscribe((v) => (list = v))();
    expect(list.find((v) => v.id === "x1")).toBeTruthy();

    let gapList: any[] = [];
    gaps.subscribe((v) => (gapList = v))();
    expect(gapList).toBeInstanceOf(Array);
  });
});
