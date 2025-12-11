import { describe, it, expect } from "vitest";
import {
  parseVEventString,
  expandRecurrences,
  generateICS,
  isValidRRule,
  formatRRule,
} from "../ical-service.js";

describe("ical-service", () => {
  it("parses all-day VEVENT with exclusive DTEND", () => {
    const vevent = `
BEGIN:VEVENT
UID:test-all-day
DTSTAMP:20250101T000000Z
DTSTART;VALUE=DATE:20251211
DTEND;VALUE=DATE:20251213
SUMMARY:All-day span
END:VEVENT
`.trim();

    const parsed = parseVEventString(vevent);

    expect(parsed.isAllDay).toBe(true);
    // DTEND is exclusive in iCal; expect +2 days window start->exclusive end
    const durationMs = parsed.dtend!.getTime() - parsed.dtstart.getTime();
    expect(durationMs).toBe(2 * 24 * 60 * 60 * 1000);
    expect(parsed.summary).toBe("All-day span");
  });

  it("expands weekly RRULE occurrences", () => {
    const vevent = `
BEGIN:VEVENT
UID:test-weekly
DTSTAMP:20250101T000000Z
DTSTART;VALUE=DATE:20251204
DTEND;VALUE=DATE:20251205
RRULE:FREQ=WEEKLY;BYDAY=TH;COUNT=3
SUMMARY:Weekly Standup
END:VEVENT
`.trim();

    const windowStart = new Date("2025-12-01T00:00:00Z");
    const windowEnd = new Date("2025-12-31T23:59:59Z");

    const occurrences = expandRecurrences(vevent, windowStart, windowEnd);
    expect(occurrences.length).toBe(3);
    expect(occurrences[0].startDate.toISOString()).toBe(
      "2025-12-04T00:00:00.000Z",
    );
    expect(occurrences[1].startDate.toISOString()).toBe(
      "2025-12-11T00:00:00.000Z",
    );
    expect(occurrences[2].startDate.toISOString()).toBe(
      "2025-12-18T00:00:00.000Z",
    );
  });

  it("generates ICS with VEVENT entries", () => {
    const vevent = `
BEGIN:VEVENT
UID:ics-test-1
DTSTAMP:20250101T000000Z
DTSTART:20251210T100000Z
DTEND:20251210T110000Z
SUMMARY:Exported Event
DESCRIPTION:desc
LOCATION:loc
END:VEVENT
`.trim();

    const ics = generateICS([
      {
        uid: "ics-test-1",
        summary: "Exported Event",
        dtstart: new Date("2025-12-10T10:00:00Z"),
        dtend: new Date("2025-12-10T11:00:00Z"),
        dtstartTzid: null,
        isAllDay: false,
        rrule: null,
        description: "desc",
        location: "loc",
        icalData: vevent,
      },
    ]);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Exported Event");
    expect(ics).toContain("DTSTART:20251210T100000Z");
    expect(ics).toContain("DTEND:20251210T110000Z");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  describe("isValidRRule", () => {
    it("returns true for valid RRULE strings", () => {
      expect(isValidRRule("FREQ=DAILY")).toBe(true);
      expect(isValidRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR")).toBe(true);
      expect(isValidRRule("FREQ=MONTHLY;INTERVAL=2")).toBe(true);
      expect(isValidRRule("FREQ=YEARLY;COUNT=5")).toBe(true);
      expect(isValidRRule("FREQ=WEEKLY;BYDAY=TH;UNTIL=20251231T235959Z")).toBe(true);
    });

    it("returns false for invalid RRULE strings", () => {
      expect(isValidRRule("")).toBe(false);
      expect(isValidRRule("INVALID")).toBe(false);
      expect(isValidRRule("FREQ=INVALID")).toBe(false);
    });
  });

  describe("formatRRule", () => {
    it("formats daily recurrence in Japanese", () => {
      expect(formatRRule("FREQ=DAILY", "ja")).toBe("毎日 (永続)");
      expect(formatRRule("FREQ=DAILY;INTERVAL=3", "ja")).toBe("3日ごと (永続)");
    });

    it("formats weekly recurrence with days in Japanese", () => {
      const result = formatRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR", "ja");
      expect(result).toContain("毎週");
      expect(result).toContain("月");
      expect(result).toContain("水");
      expect(result).toContain("金");
    });

    it("formats monthly recurrence in Japanese", () => {
      expect(formatRRule("FREQ=MONTHLY", "ja")).toBe("毎月 (永続)");
      expect(formatRRule("FREQ=MONTHLY;INTERVAL=2", "ja")).toBe("2ヶ月ごと (永続)");
    });

    it("formats recurrence with count in Japanese", () => {
      const result = formatRRule("FREQ=WEEKLY;COUNT=10", "ja");
      expect(result).toContain("10回");
    });

    it("formats daily recurrence in English", () => {
      expect(formatRRule("FREQ=DAILY", "en")).toBe("Every day (forever)");
      expect(formatRRule("FREQ=DAILY;INTERVAL=3", "en")).toBe("Every 3 days (forever)");
    });

    it("formats weekly recurrence with days in English", () => {
      const result = formatRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR", "en");
      expect(result).toContain("Every week");
      expect(result).toContain("Monday");
      expect(result).toContain("Wednesday");
      expect(result).toContain("Friday");
    });

    it("defaults to Japanese locale", () => {
      expect(formatRRule("FREQ=DAILY")).toBe("毎日 (永続)");
    });
  });
});
