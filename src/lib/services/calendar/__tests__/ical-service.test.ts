import { describe, it, expect } from "vitest";
import {
  parseVEventString,
  expandRecurrences,
  generateICS,
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
});
