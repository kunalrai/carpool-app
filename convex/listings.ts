import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Listings auto-expire 60 minutes after their departure time.
// Parses "08:30 AM" relative to the day the listing was created.
function parseDepartureMs(departureTime: string, createdAt: number): number {
  const [timePart, meridiem] = departureTime.split(" ");
  const [hoursStr, minutesStr] = timePart.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const departure = new Date(createdAt);
  departure.setHours(hours, minutes, 0, 0);

  // If calculated departure is before creation (edge case), push to next day
  if (departure.getTime() < createdAt) {
    departure.setDate(departure.getDate() + 1);
  }
  return departure.getTime();
}

function isExpired(listing: {
  departureTime: string;
  createdAt: number;
}): boolean {
  const departureMs = parseDepartureMs(listing.departureTime, listing.createdAt);
  return Date.now() > departureMs + 60 * 60 * 1000;
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
    return withDriver.sort((a, b) =>
      a.departureTime.localeCompare(b.departureTime)
    );
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
    departureTime: v.string(),
    totalSeats: v.number(),
    pickupPoint: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, ...args }) => {
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
        body: `${driver?.name} cancelled the ${listing.departureTime} ride.`,
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
