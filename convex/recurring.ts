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
    fromLabel: v.string(),
    toLabel: v.string(),
    fromLat: v.number(),
    fromLng: v.number(),
    toLat: v.number(),
    toLng: v.number(),
    fromPlaceId: v.optional(v.string()),
    toPlaceId: v.optional(v.string()),
    departureTimeHHMM: v.string(),
    totalSeats: v.number(),
    fare: v.number(),
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
    if (args.fare < 1 || args.fare > 2000)
      throw new Error("Fare must be between ₹1 and ₹2000");

    const templateId = await ctx.db.insert("recurringTemplates", {
      driverId: userId,
      fromLabel: args.fromLabel,
      toLabel: args.toLabel,
      fromLat: args.fromLat,
      fromLng: args.fromLng,
      toLat: args.toLat,
      toLng: args.toLng,
      fromPlaceId: args.fromPlaceId,
      toPlaceId: args.toPlaceId,
      departureTimeHHMM: args.departureTimeHHMM,
      totalSeats: args.totalSeats,
      fare: args.fare,
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
            fromLabel: args.fromLabel,
            toLabel: args.toLabel,
            fromLat: args.fromLat,
            fromLng: args.fromLng,
            toLat: args.toLat,
            toLng: args.toLng,
            fromPlaceId: args.fromPlaceId,
            toPlaceId: args.toPlaceId,
            departureTime,
            totalSeats: args.totalSeats,
            seatsLeft: args.totalSeats,
            pickupPoint: args.pickupPoint,
            note: args.note,
            status: "open",
            fare: args.fare,
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

export const updateTemplate = mutation({
  args: {
    templateId: v.id("recurringTemplates"),
    userId: v.id("users"),
    departureTimeHHMM: v.optional(v.string()),
    totalSeats: v.optional(v.number()),
    fare: v.optional(v.number()),
    daysOfWeek: v.optional(v.array(v.number())),
    pickupPoint: v.optional(v.string()),
    note: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { templateId, userId, ...changes }) => {
    const template = await ctx.db.get(templateId);
    if (!template || template.driverId !== userId) throw new Error("Not found or unauthorized");
    if (changes.totalSeats !== undefined && (changes.totalSeats < 1 || changes.totalSeats > 4))
      throw new Error("Seats must be between 1 and 4");
    if (changes.fare !== undefined && (changes.fare < 1 || changes.fare > 2000))
      throw new Error("Fare must be between ₹1 and ₹2000");
    if (changes.daysOfWeek !== undefined && changes.daysOfWeek.length === 0)
      throw new Error("Select at least one day");
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(changes)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(templateId, patch as Parameters<typeof ctx.db.patch<"recurringTemplates">>[1]);
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
        fromLabel: template.fromLabel,
        toLabel: template.toLabel,
        fromLat: template.fromLat,
        fromLng: template.fromLng,
        toLat: template.toLat,
        toLng: template.toLng,
        fromPlaceId: template.fromPlaceId,
        toPlaceId: template.toPlaceId,
        departureTime,
        totalSeats: template.totalSeats,
        seatsLeft: template.totalSeats,
        pickupPoint: template.pickupPoint,
        note: template.note,
        status: "open",
        fare: template.fare,
        templateId: template._id,
        createdAt: Date.now(),
      });
    }
  },
});
