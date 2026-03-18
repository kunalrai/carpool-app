import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// IST = UTC + 5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Returns today's day-of-week in IST (0=Sun…6=Sat) and UTC boundaries for today IST. */
function getISTToday(): {
  dayOfWeek: number;
  todayStartUTC: number;
  todayEndUTC: number;
} {
  const now = Date.now();
  const nowIST = now + IST_OFFSET_MS;
  const midnightIST = nowIST - (nowIST % (24 * 3600 * 1000));
  return {
    dayOfWeek: new Date(midnightIST).getUTCDay(),
    todayStartUTC: midnightIST - IST_OFFSET_MS,
    todayEndUTC: midnightIST - IST_OFFSET_MS + 24 * 3600 * 1000,
  };
}

/** Convert "HH:MM" + today's IST midnight (as UTC ms) → UTC departure timestamp. */
function buildDepartureUTC(hhmm: string, todayStartUTC: number): number {
  const [h, m] = hhmm.split(":").map(Number);
  return todayStartUTC + h * 3600000 + m * 60000;
}

function isListingActive(l: { status: string; departureTime: number }): boolean {
  return (
    (l.status === "open" || l.status === "full" || l.status === "started") &&
    Date.now() <= l.departureTime + 60 * 60 * 1000
  );
}

// ── Public mutations ──────────────────────────────────────────────────────────

export const createTemplate = mutation({
  args: {
    userId: v.id("users"),
    direction: v.union(v.literal("GC_TO_HCL"), v.literal("HCL_TO_GC")),
    departureTimeHHMM: v.string(),
    totalSeats: v.number(),
    daysOfWeek: v.array(v.number()),
    pickupPoint: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, daysOfWeek, ...args }) => {
    const user = await ctx.db.get(userId);
    if (user?.isSuspended) throw new Error("Your account has been suspended.");
    if (daysOfWeek.length === 0) throw new Error("Select at least one day");
    if (args.totalSeats < 1 || args.totalSeats > 4)
      throw new Error("Seats must be between 1 and 4");

    const templateId = await ctx.db.insert("recurringTemplates", {
      driverId: userId,
      direction: args.direction,
      departureTimeHHMM: args.departureTimeHHMM,
      totalSeats: args.totalSeats,
      daysOfWeek,
      pickupPoint: args.pickupPoint,
      note: args.note,
      isActive: true,
      createdAt: Date.now(),
    });

    // Immediately create today's listing if today matches and departure is future
    const { dayOfWeek, todayStartUTC, todayEndUTC } = getISTToday();
    if (daysOfWeek.includes(dayOfWeek)) {
      const departureTime = buildDepartureUTC(args.departureTimeHHMM, todayStartUTC);
      if (departureTime > Date.now() + 5 * 60 * 1000) {
        const existing = await ctx.db
          .query("listings")
          .withIndex("by_driver", (q) => q.eq("driverId", userId))
          .collect();

        const hasActive = existing.some(isListingActive);
        const alreadyCreated = existing.some(
          (l) =>
            l.templateId === templateId &&
            l.departureTime >= todayStartUTC &&
            l.departureTime < todayEndUTC
        );

        if (!hasActive && !alreadyCreated) {
          await ctx.db.insert("listings", {
            driverId: userId,
            direction: args.direction,
            departureTime,
            totalSeats: args.totalSeats,
            seatsLeft: args.totalSeats,
            pickupPoint: args.pickupPoint,
            note: args.note,
            status: "open",
            fare: 80,
            templateId,
            createdAt: Date.now(),
          });
        }
      }
    }

    return templateId;
  },
});

export const listMyTemplates = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("recurringTemplates")
      .withIndex("by_driver", (q) => q.eq("driverId", userId))
      .collect();
  },
});

export const toggleTemplate = mutation({
  args: {
    templateId: v.id("recurringTemplates"),
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, { templateId, userId, isActive }) => {
    const template = await ctx.db.get(templateId);
    if (!template || template.driverId !== userId) throw new Error("Not found");
    await ctx.db.patch(templateId, { isActive });
  },
});

export const deleteTemplate = mutation({
  args: { templateId: v.id("recurringTemplates"), userId: v.id("users") },
  handler: async (ctx, { templateId, userId }) => {
    const template = await ctx.db.get(templateId);
    if (!template || template.driverId !== userId) throw new Error("Not found");
    await ctx.db.delete(templateId);
  },
});

// ── Internal (cron) ───────────────────────────────────────────────────────────

/** Called every hour by cron — spawns today's listing for each active template. */
export const spawnDailyListings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const { dayOfWeek, todayStartUTC, todayEndUTC } = getISTToday();

    const templates = await ctx.db
      .query("recurringTemplates")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    for (const template of templates) {
      if (!template.daysOfWeek.includes(dayOfWeek)) continue;

      const departureTime = buildDepartureUTC(template.departureTimeHHMM, todayStartUTC);

      // Skip if departure is within 15 min or already past
      if (departureTime < Date.now() + 15 * 60 * 1000) continue;

      const driverListings = await ctx.db
        .query("listings")
        .withIndex("by_driver", (q) => q.eq("driverId", template.driverId))
        .collect();

      // Skip if today's listing from this template already exists
      const alreadyCreated = driverListings.some(
        (l) =>
          l.templateId === template._id &&
          l.departureTime >= todayStartUTC &&
          l.departureTime < todayEndUTC
      );
      if (alreadyCreated) continue;

      // Skip if driver already has another active listing
      if (driverListings.some(isListingActive)) continue;

      await ctx.db.insert("listings", {
        driverId: template.driverId,
        direction: template.direction,
        departureTime,
        totalSeats: template.totalSeats,
        seatsLeft: template.totalSeats,
        pickupPoint: template.pickupPoint,
        note: template.note,
        status: "open",
        fare: 80,
        templateId: template._id,
        createdAt: Date.now(),
      });
    }
  },
});
