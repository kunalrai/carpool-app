import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

function sanitizeUser(user: Doc<"users"> | null) {
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mobile: _m, fcmToken: _f, ...safe } = user;
  return safe;
}

// Requests expire 60 minutes after their departure time.
function isExpired(req: { departureTime: number }): boolean {
  return Date.now() > req.departureTime + 60 * 60 * 1000;
}

// ── Internal (cron) ───────────────────────────────────────────────────────────

export const expireRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const active = await ctx.db
      .query("rideRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const toExpire = active.filter((r) => r.departureTime < cutoff);
    await Promise.all(toExpire.map((r) => ctx.db.patch(r._id, { status: "expired" })));
  },
});

// ── Queries ───────────────────────────────────────────────────────────────────

export const getMyActiveRequest = query({
  args: { riderId: v.id("users") },
  handler: async (ctx, { riderId }) => {
    const req = await ctx.db
      .query("rideRequests")
      .withIndex("by_rider_status", (q) =>
        q.eq("riderId", riderId).eq("status", "active")
      )
      .first();
    if (!req || isExpired(req)) return null;
    return req;
  },
});

export const getActiveRequests = query({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query("rideRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const valid = active.filter((r) => !isExpired(r));

    return Promise.all(
      valid.map(async (r) => {
        const user = await ctx.db.get(r.riderId);
        const safe = sanitizeUser(user);
        const photoUrl = safe?.photoStorageId
          ? await ctx.storage.getUrl(safe.photoStorageId)
          : null;
        return { ...r, rider: safe ? { ...safe, photoUrl } : null };
      })
    );
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const postRequest = mutation({
  args: {
    riderId: v.id("users"),
    fromLabel: v.string(),
    toLabel: v.string(),
    fromLat: v.number(),
    fromLng: v.number(),
    toLat: v.number(),
    toLng: v.number(),
    departureTime: v.number(),
    seatsNeeded: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.riderId);
    if (!user) throw new Error("User not found");
    if (user.isSuspended) throw new Error("Your account is suspended");
    if (args.seatsNeeded < 1 || args.seatsNeeded > 4)
      throw new Error("Seats must be between 1 and 4");
    if (args.departureTime < Date.now() - 5 * 60 * 1000)
      throw new Error("Departure time cannot be in the past");

    // Only one active request per rider
    const existing = await ctx.db
      .query("rideRequests")
      .withIndex("by_rider_status", (q) =>
        q.eq("riderId", args.riderId).eq("status", "active")
      )
      .first();
    if (existing && !isExpired(existing))
      throw new Error("You already have an active ride request. Cancel it first.");

    // Expire stale one if found
    if (existing) await ctx.db.patch(existing._id, { status: "expired" });

    return ctx.db.insert("rideRequests", {
      ...args,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const cancelRequest = mutation({
  args: {
    requestId: v.id("rideRequests"),
    riderId: v.id("users"),
  },
  handler: async (ctx, { requestId, riderId }) => {
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("Request not found");
    if (req.riderId !== riderId) throw new Error("Not authorised");
    await ctx.db.patch(requestId, { status: "cancelled" });
  },
});
