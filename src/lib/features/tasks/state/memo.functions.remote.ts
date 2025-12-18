/**
 * Memo Remote Functions (Server-side)
 *
 * Server-side Remote Functions for memo operations.
 * These run on the server and are callable from client with type safety.
 */
import { query, command, getRequestEvent } from "$app/server";
import * as v from "valibot";
import { prisma } from "$lib/server/prisma";

// ============================================================================
// HELPER - Get authenticated user
// ============================================================================

function getAuthenticatedUser(): string {
  const event = getRequestEvent();
  if (!event.locals.user?.id) {
    throw new Error("Unauthorized");
  }
  return event.locals.user.id;
}

// ============================================================================
// SCHEMAS
// ============================================================================

const RecurrenceGoalSchema = v.object({
  count: v.number(),
  period: v.picklist(["day", "week", "month"]),
});

const MemoStatusSchema = v.object({
  timeSpentMinutes: v.number(),
  completionState: v.picklist(["not_started", "in_progress", "completed"]),
  completionsThisPeriod: v.optional(v.number()),
  periodStartDate: v.optional(v.string()),
});

const MemoInputSchema = v.object({
  title: v.string(),
  genre: v.optional(v.string()),
  type: v.picklist(["期限付き", "バックログ", "ルーティン"]),
  createdAt: v.string(),
  deadline: v.optional(v.string()),
  recurrenceGoal: v.optional(RecurrenceGoalSchema),
  locationPreference: v.picklist([
    "home/near_home",
    "workplace/near_workplace",
    "no_preference",
  ]),
  status: MemoStatusSchema,
  sessionDuration: v.optional(v.number()),
  totalDurationExpected: v.optional(v.number()),
  lastActivity: v.optional(v.string()),
  importance: v.optional(v.picklist(["low", "medium", "high"])),
});

const MemoUpdateSchema = v.object({
  id: v.string(),
  updates: v.object({
    title: v.optional(v.string()),
    genre: v.optional(v.string()),
    type: v.optional(v.picklist(["期限付き", "バックログ", "ルーティン"])),
    deadline: v.optional(v.string()),
    recurrenceGoal: v.optional(RecurrenceGoalSchema),
    locationPreference: v.optional(
      v.picklist([
        "home/near_home",
        "workplace/near_workplace",
        "no_preference",
      ]),
    ),
    status: v.optional(MemoStatusSchema),
    sessionDuration: v.optional(v.number()),
    totalDurationExpected: v.optional(v.number()),
    lastActivity: v.optional(v.string()),
    importance: v.optional(v.picklist(["low", "medium", "high"])),
  }),
});

// ============================================================================
// REMOTE FUNCTIONS
// ============================================================================

/**
 * Fetch all memos for the authenticated user
 */
export const fetchMemos = query(v.optional(v.object({})), async () => {
  const userId = getAuthenticatedUser();

  try {
    const dbMemos = await prisma.memo.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Convert DB flat fields to app nested structure
    return dbMemos.map((memo) => ({
      id: memo.id,
      title: memo.title,
      genre: memo.genre ?? undefined,
      type: memo.type as "期限付き" | "バックログ" | "ルーティン",
      createdAt: memo.createdAt.toISOString(),
      deadline: memo.deadline?.toISOString(),
      recurrenceGoal:
        memo.recurrenceGoalCount && memo.recurrenceGoalPeriod
          ? {
              count: memo.recurrenceGoalCount,
              period: memo.recurrenceGoalPeriod as "day" | "week" | "month",
            }
          : undefined,
      locationPreference: memo.locationPreference as
        | "home/near_home"
        | "workplace/near_workplace"
        | "no_preference",
      status: {
        timeSpentMinutes: memo.timeSpentMinutes,
        completionState: memo.completionState as
          | "not_started"
          | "in_progress"
          | "completed",
        completionsThisPeriod: memo.completionsThisPeriod ?? undefined,
        periodStartDate: memo.periodStartDate?.toISOString(),
      },
      sessionDuration: memo.sessionDuration ?? undefined,
      totalDurationExpected: memo.totalDurationExpected ?? undefined,
      lastActivity: memo.lastActivity?.toISOString(),
      importance: memo.importance as "low" | "medium" | "high" | undefined,
    }));
  } catch (err) {
    console.error("[fetchMemos] Error:", err);
    throw new Error(
      `Failed to fetch memos: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
});

/**
 * Create a new memo
 */
export const createMemo = command(MemoInputSchema, async (input) => {
  const userId = getAuthenticatedUser();

  try {
    const created = await prisma.memo.create({
      data: {
        userId,
        title: input.title,
        genre: input.genre,
        type: input.type,
        createdAt: new Date(input.createdAt),
        deadline: input.deadline ? new Date(input.deadline) : undefined,
        recurrenceGoalCount: input.recurrenceGoal?.count,
        recurrenceGoalPeriod: input.recurrenceGoal?.period,
        locationPreference: input.locationPreference,
        timeSpentMinutes: input.status.timeSpentMinutes,
        completionState: input.status.completionState,
        completionsThisPeriod: input.status.completionsThisPeriod,
        periodStartDate: input.status.periodStartDate
          ? new Date(input.status.periodStartDate)
          : undefined,
        sessionDuration: input.sessionDuration,
        totalDurationExpected: input.totalDurationExpected,
        lastActivity: input.lastActivity
          ? new Date(input.lastActivity)
          : undefined,
        importance: input.importance,
      },
    });

    return {
      id: created.id,
      title: created.title,
      genre: created.genre ?? undefined,
      type: created.type as "期限付き" | "バックログ" | "ルーティン",
      createdAt: created.createdAt.toISOString(),
      deadline: created.deadline?.toISOString(),
      recurrenceGoal:
        created.recurrenceGoalCount && created.recurrenceGoalPeriod
          ? {
              count: created.recurrenceGoalCount,
              period: created.recurrenceGoalPeriod as "day" | "week" | "month",
            }
          : undefined,
      locationPreference: created.locationPreference as
        | "home/near_home"
        | "workplace/near_workplace"
        | "no_preference",
      status: {
        timeSpentMinutes: created.timeSpentMinutes,
        completionState: created.completionState as
          | "not_started"
          | "in_progress"
          | "completed",
        completionsThisPeriod: created.completionsThisPeriod ?? undefined,
        periodStartDate: created.periodStartDate?.toISOString(),
      },
      sessionDuration: created.sessionDuration ?? undefined,
      totalDurationExpected: created.totalDurationExpected ?? undefined,
      lastActivity: created.lastActivity?.toISOString(),
      importance: created.importance as "low" | "medium" | "high" | undefined,
    };
  } catch (err) {
    console.error("[createMemo] Error:", err);
    throw new Error("Failed to create memo");
  }
});

/**
 * Update an existing memo
 */
export const updateMemo = command(MemoUpdateSchema, async (input) => {
  const userId = getAuthenticatedUser();

  try {
    // Verify ownership
    const existing = await prisma.memo.findFirst({
      where: {
        id: input.id,
        userId,
      },
    });

    if (!existing) {
      throw new Error("Memo not found");
    }

    // Build update data (flat fields for Prisma)
    const updateData: Record<string, unknown> = {};
    if (input.updates.title !== undefined)
      updateData.title = input.updates.title;
    if (input.updates.genre !== undefined)
      updateData.genre = input.updates.genre;
    if (input.updates.type !== undefined) updateData.type = input.updates.type;
    if (input.updates.deadline !== undefined)
      updateData.deadline = input.updates.deadline
        ? new Date(input.updates.deadline)
        : null;
    if (input.updates.recurrenceGoal !== undefined) {
      updateData.recurrenceGoalCount =
        input.updates.recurrenceGoal?.count ?? null;
      updateData.recurrenceGoalPeriod =
        input.updates.recurrenceGoal?.period ?? null;
    }
    if (input.updates.locationPreference !== undefined)
      updateData.locationPreference = input.updates.locationPreference;
    if (input.updates.status !== undefined) {
      updateData.timeSpentMinutes = input.updates.status.timeSpentMinutes;
      updateData.completionState = input.updates.status.completionState;
      updateData.completionsThisPeriod =
        input.updates.status.completionsThisPeriod;
      updateData.periodStartDate = input.updates.status.periodStartDate
        ? new Date(input.updates.status.periodStartDate)
        : null;
    }
    if (input.updates.sessionDuration !== undefined)
      updateData.sessionDuration = input.updates.sessionDuration;
    if (input.updates.totalDurationExpected !== undefined)
      updateData.totalDurationExpected = input.updates.totalDurationExpected;
    if (input.updates.lastActivity !== undefined)
      updateData.lastActivity = input.updates.lastActivity
        ? new Date(input.updates.lastActivity)
        : null;
    if (input.updates.importance !== undefined)
      updateData.importance = input.updates.importance;

    const updated = await prisma.memo.update({
      where: { id: input.id },
      data: updateData,
    });

    return {
      id: updated.id,
      title: updated.title,
      genre: updated.genre ?? undefined,
      type: updated.type as "期限付き" | "バックログ" | "ルーティン",
      createdAt: updated.createdAt.toISOString(),
      deadline: updated.deadline?.toISOString(),
      recurrenceGoal:
        updated.recurrenceGoalCount && updated.recurrenceGoalPeriod
          ? {
              count: updated.recurrenceGoalCount,
              period: updated.recurrenceGoalPeriod as "day" | "week" | "month",
            }
          : undefined,
      locationPreference: updated.locationPreference as
        | "home/near_home"
        | "workplace/near_workplace"
        | "no_preference",
      status: {
        timeSpentMinutes: updated.timeSpentMinutes,
        completionState: updated.completionState as
          | "not_started"
          | "in_progress"
          | "completed",
        completionsThisPeriod: updated.completionsThisPeriod ?? undefined,
        periodStartDate: updated.periodStartDate?.toISOString(),
      },
      sessionDuration: updated.sessionDuration ?? undefined,
      totalDurationExpected: updated.totalDurationExpected ?? undefined,
      lastActivity: updated.lastActivity?.toISOString(),
      importance: updated.importance as "low" | "medium" | "high" | undefined,
    };
  } catch (err) {
    console.error("[updateMemo] Error:", err);
    throw new Error("Failed to update memo");
  }
});

/**
 * Delete a memo
 */
export const deleteMemo = command(
  v.object({ id: v.string() }),
  async (input) => {
    const userId = getAuthenticatedUser();

    try {
      // Verify ownership
      const existing = await prisma.memo.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existing) {
        throw new Error("Memo not found");
      }

      // Delete
      await prisma.memo.delete({
        where: { id: input.id },
      });

      return { success: true };
    } catch (err) {
      console.error("[deleteMemo] Error:", err);
      throw new Error("Failed to delete memo");
    }
  },
);
