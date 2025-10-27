/**
 * @fileoverview Gap-finding algorithm for personal assistant
 *
 * This module implements the core algorithm for finding free time gaps between events.
 * It handles event sorting, merging overlapping events, and calculating available time slots.
 *
 * @author Personal Assistant Team
 * @version 1.0.0
 */

/**
 * Time slot interface for gap calculations
 */
export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

/**
 * Event interface for gap-finder algorithm
 * Uses HH:mm format for time representation
 */
export interface Event {
  id: string;
  title: string;
  start: string; // HH:mm format
  end: string; // HH:mm format
  crossesMidnight?: boolean;
}

/**
 * Gap interface representing free time slots
 */
export interface Gap {
  start: string;
  end: string;
  duration: number; // in minutes
}

/**
 * Day boundaries for gap calculation
 * Defines the active hours for gap finding
 */
export interface DayBoundaries {
  dayStart: string; // HH:mm format, e.g., "08:00"
  dayEnd: string; // HH:mm format, e.g., "23:00"
}

/**
 * Gap-Finding Algorithm for Personal Assistant
 *
 * 1. Collect all events for the target day
 * 2. Represent each event by its start (X) and end (X')
 * 3. Sort events by start time
 * 4. Build event blocks (merge overlapping events)
 * 5. Find gaps between blocks and day boundaries
 * 6. Handle midnight-crossing events
 */
export class GapFinder {
  private dayBoundaries: DayBoundaries;

  constructor(
    dayBoundaries: DayBoundaries = { dayStart: "08:00", dayEnd: "23:00" },
  ) {
    this.dayBoundaries = dayBoundaries;
  }

  /**
   * Find gaps in a day given a list of events
   */
  findGaps(events: Event[]): Gap[] {
    if (events.length === 0) {
      // No events = one big gap from day start to day end
      return [
        this.createGap(this.dayBoundaries.dayStart, this.dayBoundaries.dayEnd),
      ];
    }

    // 1. Handle midnight-crossing events
    const processedEvents = this.processMidnightEvents(events);

    // 2. Sort events by start time
    const sortedEvents = this.sortEventsByStart(processedEvents);

    // 3. Build non-overlapping event blocks
    const eventBlocks = this.buildEventBlocks(sortedEvents);

    // 4. Find gaps between blocks and day boundaries
    const gaps = this.findGapsBetweenBlocks(eventBlocks);

    return gaps;
  }

  /**
   * Process events that cross midnight or start before day boundaries
   */
  private processMidnightEvents(events: Event[]): Event[] {
    return events.map((event) => {
      // Handle events that start before day boundaries (e.g., from previous day)
      if (this.timeToMinutes(event.start) < this.timeToMinutes(this.dayBoundaries.dayStart)) {
        return {
          ...event,
          start: this.dayBoundaries.dayStart, // Adjust start to day boundary
        };
      }
      
      if (this.timeToMinutes(event.start) > this.timeToMinutes(event.end)) {
        // Event crosses midnight
        return {
          ...event,
          crossesMidnight: true,
          // Split into two events: end of day and start of day
          end: this.dayBoundaries.dayEnd,
        };
      }
      return event;
    });
  }

  /**
   * Sort events by start time
   */
  private sortEventsByStart(events: Event[]): Event[] {
    return events.sort((a, b) => {
      return this.timeToMinutes(a.start) - this.timeToMinutes(b.start);
    });
  }

  /**
   * Build non-overlapping event blocks by merging overlapping events
   */
  private buildEventBlocks(events: Event[]): TimeSlot[] {
    if (events.length === 0) return [];

    const blocks: TimeSlot[] = [];
    let currentBlock = { start: events[0].start, end: events[0].end };

    for (let i = 1; i < events.length; i++) {
      const event = events[i];

      // Check if event overlaps with current block
      if (
        this.timeToMinutes(event.start) <= this.timeToMinutes(currentBlock.end)
      ) {
        // Merge: extend current block's end time
        currentBlock.end = this.maxTime(currentBlock.end, event.end);
      } else {
        // No overlap: save current block and start new one
        blocks.push({ ...currentBlock });
        currentBlock = { start: event.start, end: event.end };
      }
    }

    // Add the last block
    blocks.push(currentBlock);

    return blocks;
  }

  /**
   * Find gaps between event blocks and day boundaries
   */
  private findGapsBetweenBlocks(blocks: TimeSlot[]): Gap[] {
    const gaps: Gap[] = [];

    // Gap before first event (from day start)
    if (blocks.length > 0) {
      const firstBlock = blocks[0];
      if (
        this.timeToMinutes(firstBlock.start) >
        this.timeToMinutes(this.dayBoundaries.dayStart)
      ) {
        gaps.push(
          this.createGap(this.dayBoundaries.dayStart, firstBlock.start),
        );
      }
    } else {
      // No events = one big gap
      gaps.push(
        this.createGap(this.dayBoundaries.dayStart, this.dayBoundaries.dayEnd),
      );
      return gaps;
    }

    // Gaps between consecutive blocks
    for (let i = 0; i < blocks.length - 1; i++) {
      const currentBlock = blocks[i];
      const nextBlock = blocks[i + 1];

      if (
        this.timeToMinutes(currentBlock.end) <
        this.timeToMinutes(nextBlock.start)
      ) {
        gaps.push(this.createGap(currentBlock.end, nextBlock.start));
      }
    }

    // Gap after last event (to day end)
    const lastBlock = blocks[blocks.length - 1];
    if (
      this.timeToMinutes(lastBlock.end) <
      this.timeToMinutes(this.dayBoundaries.dayEnd)
    ) {
      gaps.push(this.createGap(lastBlock.end, this.dayBoundaries.dayEnd));
    }

    return gaps;
  }

  /**
   * Create a gap object with duration calculation
   */
  private createGap(start: string, end: string): Gap {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    const duration = endMinutes - startMinutes;

    return {
      start,
      end,
      duration: Math.max(0, duration), // Ensure non-negative duration
    };
  }

  /**
   * Convert time string (HH:mm) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string (HH:mm)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  /**
   * Return the later of two times
   */
  private maxTime(time1: string, time2: string): string {
    return this.timeToMinutes(time1) > this.timeToMinutes(time2)
      ? time1
      : time2;
  }

  /**
   * Update day boundaries
   */
  updateDayBoundaries(dayBoundaries: DayBoundaries): void {
    this.dayBoundaries = dayBoundaries;
  }

  /**
   * Get current day boundaries
   */
  getDayBoundaries(): DayBoundaries {
    return { ...this.dayBoundaries };
  }

  /**
   * Format gap duration as human-readable string
   */
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }
}
