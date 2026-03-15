import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Internal mutation called by cron every 5 min — patches open/full listings
// that are past departureTime + 60 min to 'cancelled' so reactive queries
// re-fire and they disappear from the rider feed.
export const expireListings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const open = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    const full = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "full"))
      .collect();
    const expired = [...open, ...full].filter((l) => l.departureTime < cutoff);
    await Promise.all(expired.map((l) => ctx.db.patch(l._id, { status: "cancelled" })));
  },
});

// TEMP: run once from Convex dashboard to clear old string-format listings, then delete this mutation
export const clearAllListings = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("listings").collect();
    await Promise.all(all.map((l) => ctx.db.delete(l._id)));
    return `Deleted ${all.length} listings`;
  },
});

// Listings auto-expire 60 minutes after their departure time.
function isExpired(listing: { departureTime: number }): boolean {
  return Date.now() > listing.departureTime + 60 * 60 * 1000;
}

export const getActiveListings = query({
  args: {
    direction: v.optional(
      v.union(v.literal("GC_TO_HCL"), v.literal("HCL_TO_GC"))
    ),
  },
  handler: async (ctx, { direction }) => {
    let listings;

    if (direction) {
      // Fetch open + full for this direction
      const open = await ctx.db
        .query("listings")
        .withIndex("by_direction_status", (q) =>
          q.eq("direction", direction).eq("status", "open")
        )
        .collect();
      const full = await ctx.db
        .query("listings")
        .withIndex("by_direction_status", (q) =>
          q.eq("direction", direction).eq("status", "full")
        )
        .collect();
      listings = [...open, ...full];
    } else {
      const open = await ctx.db
        .query("listings")
        .withIndex("by_status", (q) => q.eq("status", "open"))
        .collect();
      const full = await ctx.db
        .query("listings")
        .withIndex("by_status", (q) => q.eq("status", "full"))
        .collect();
      listings = [...open, ...full];
    }

    // Filter out expired listings and join driver info
    const active = listings.filter((l) => !isExpired(l));

    const withDriver = await Promise.all(
      active.map(async (listing) => {
        const driver = await ctx.db.get(listing.driverId);
        return { ...listing, driver };
      })
    );

    // Sort by departure time string (lexicographic works for "HH:MM AM/PM" if
    // we normalise — simpler: sort by createdAt as a tiebreaker, primary sort
    // done on the client where full Date parsing is cheap)
    return withDriver.sort((a, b) => a.departureTime - b.departureTime);
  },
});

export const getMyActiveListing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_driver", (q) => q.eq("driverId", userId))
      .collect();

    return listings.find(
      (l) =>
        (l.status === "open" || l.status === "full" || l.status === "started") &&
        !isExpired(l)
    ) ?? null;
    // Note: 'completed' and 'cancelled' are intentionally excluded so the banner clears immediately.
  },
});

export const getListingById = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) return null;
    const driver = await ctx.db.get(listing.driverId);
    return { ...listing, driver };
  },
});

export const getListingRiders = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();

    const confirmed = bookings.filter((b) => b.status === "confirmed");

    return await Promise.all(
      confirmed.map(async (booking) => {
        const rider = await ctx.db.get(booking.riderId);
        return { ...booking, rider };
      })
    );
  },
});

export const postListing = mutation({
  args: {
    userId: v.id("users"),
    direction: v.union(v.literal("GC_TO_HCL"), v.literal("HCL_TO_GC")),
    departureTime: v.number(),
    totalSeats: v.number(),
    pickupPoint: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, ...args }) => {
    const user = await ctx.db.get(userId);
    if (user?.isSuspended) throw new Error("Your account has been suspended.");

    // Enforce one active listing per driver
    const existing = await ctx.db
      .query("listings")
      .withIndex("by_driver", (q) => q.eq("driverId", userId))
      .collect();

    const hasActive = existing.some(
      (l) =>
        (l.status === "open" || l.status === "full" || l.status === "started") &&
        !isExpired(l)
    );
    if (hasActive) throw new Error("You already have an active listing");

    if (args.totalSeats < 1 || args.totalSeats > 4) {
      throw new Error("Seats must be between 1 and 4");
    }

    return await ctx.db.insert("listings", {
      driverId: userId,
      direction: args.direction,
      departureTime: args.departureTime,
      totalSeats: args.totalSeats,
      seatsLeft: args.totalSeats,
      pickupPoint: args.pickupPoint,
      note: args.note,
      status: "open",
      fare: 80,
      createdAt: Date.now(),
    });
  },
});

export const cancelListing = mutation({
  args: { listingId: v.id("listings"), driverId: v.id("users") },
  handler: async (ctx, { listingId, driverId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.driverId !== driverId) throw new Error("Unauthorized");
    if (listing.status === "cancelled") throw new Error("Already cancelled");
    if (listing.status === "started") throw new Error("Ride already started");

    await ctx.db.patch(listingId, { status: "cancelled" });

    // Get confirmed riders for notification (caller handles FCM)
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();

    const riderIds = bookings
      .filter((b) => b.status === "confirmed")
      .map((b) => b.riderId);

    // console.log FCM payload (FCM wired up in Step 12)
    for (const riderId of riderIds) {
      const rider = await ctx.db.get(riderId);
      const driver = await ctx.db.get(driverId);
      console.log("[FCM] cancelListing →", {
        to: rider?.fcmToken,
        title: "Ride Cancelled",
        body: `${driver?.name} cancelled the ${new Date(listing.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ride.`,
      });
    }

    return riderIds;
  },
});

export const startRide = mutation({
  args: { listingId: v.id("listings"), driverId: v.id("users") },
  handler: async (ctx, { listingId, driverId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.driverId !== driverId) throw new Error("Unauthorized");
    if (listing.status === "cancelled") throw new Error("Listing is cancelled");
    if (listing.status === "started") throw new Error("Ride already started");

    await ctx.db.patch(listingId, { status: "started" });

    // Notify confirmed riders
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();

    const driver = await ctx.db.get(driverId);
    for (const booking of bookings.filter((b) => b.status === "confirmed")) {
      const rider = await ctx.db.get(booking.riderId);
      console.log("[FCM] startRide →", {
        to: rider?.fcmToken,
        title: "Ride Started!",
        body: `${driver?.name} has started. Be at pickup now.`,
      });
    }
  },
});

export const endRide = mutation({
  args: { listingId: v.id("listings"), driverId: v.id("users") },
  handler: async (ctx, { listingId, driverId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.driverId !== driverId) throw new Error("Unauthorized");
    if (listing.status !== "started") throw new Error("Ride is not in progress");

    await ctx.db.patch(listingId, { status: "completed" });
  },
});
