import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/** Strip sensitive fields before returning a user object to other users. */
function sanitizeUser(user: Doc<"users"> | null) {
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mobile: _m, fcmToken: _f, ...safe } = user;
  return safe;
}

// Listings auto-expire 60 minutes after their departure time.
function isExpired(listing: { departureTime: number }): boolean {
  return Date.now() > listing.departureTime + 60 * 60 * 1000;
}

/** Haversine distance in kilometres between two lat/lng points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Rough India bounding box check. */
function withinIndia(lat: number, lng: number): boolean {
  return lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98;
}

// ── Internal (cron) ───────────────────────────────────────────────────────────

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
    await Promise.all(expired.map((l) => ctx.db.patch(l._id, { status: "expired" })));

    // Mark all confirmed bookings on expired listings as completed
    await Promise.all(
      expired.map(async (l) => {
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_listing", (q) => q.eq("listingId", l._id))
          .collect();
        await Promise.all(
          bookings
            .filter((b) => b.status === "confirmed")
            .map((b) => ctx.db.patch(b._id, { status: "completed" }))
        );
      })
    );
  },
});

/**
 * One-time migration — run from Convex dashboard after deploying new schema.
 * Patches old listings with hardcoded coordinates (direction field).
 * Safe to run multiple times (skips already-migrated listings).
 */
export const migrateListingsToGeo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const HOME = { label: "Home", lat: 28.6123, lng: 77.4312 };
    const OFFICE = { label: "Office", lat: 28.5245, lng: 77.3799 };

    const all = await ctx.db.query("listings").collect();
    let patched = 0;

    for (const listing of all) {
      // Skip already-migrated records (they already have fromLabel)
      if ((listing as Record<string, unknown>).fromLabel) continue;

      const dir = (listing as Record<string, unknown>).direction as string | undefined;
      if (!dir) continue;

      const isToOffice = dir === "TO_OFFICE";
      const from = isToOffice ? HOME : OFFICE;
      const to = isToOffice ? OFFICE : HOME;

      await ctx.db.patch(listing._id, {
        fromLabel: from.label,
        toLabel: to.label,
        fromLat: from.lat,
        fromLng: from.lng,
        toLat: to.lat,
        toLng: to.lng,
        fare: 80, // default fare for old listings
      });
      patched++;
    }

    return `Patched ${patched} listings`;
  },
});

// ── Queries ───────────────────────────────────────────────────────────────────

export const getActiveListings = query({
  args: {
    fromLat: v.optional(v.number()),
    fromLng: v.optional(v.number()),
    toLat: v.optional(v.number()),
    toLng: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, { fromLat, fromLng, toLat, toLng, radiusKm = 3.0 }) => {
    const open = await ctx.db
      .query("listings")
      .withIndex("by_status_departure", (q) => q.eq("status", "open"))
      .collect();
    const full = await ctx.db
      .query("listings")
      .withIndex("by_status_departure", (q) => q.eq("status", "full"))
      .collect();

    const active = [...open, ...full].filter((l) => !isExpired(l));

    const hasSearch =
      fromLat !== undefined &&
      fromLng !== undefined &&
      toLat !== undefined &&
      toLng !== undefined;

    // Haversine filter: keep only listings within radiusKm of both endpoints
    const filtered = hasSearch
      ? active
          .map((l) => {
            const fromDist = haversineKm(fromLat!, fromLng!, l.fromLat, l.fromLng);
            const toDist = haversineKm(toLat!, toLng!, l.toLat, l.toLng);
            return { listing: l, score: fromDist + toDist, fromDist, toDist };
          })
          .filter((r) => r.fromDist <= radiusKm && r.toDist <= radiusKm)
          .sort((a, b) => a.score - b.score)
          .map((r) => r.listing)
      : active.sort((a, b) => a.departureTime - b.departureTime);

    // Join driver info
    return await Promise.all(
      filtered.map(async (listing) => {
        const driver = await ctx.db.get(listing.driverId);
        return { ...listing, driver: sanitizeUser(driver) };
      })
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

    return (
      listings.find(
        (l) =>
          (l.status === "open" || l.status === "full" || l.status === "started") &&
          !isExpired(l)
      ) ?? null
    );
  },
});

export const getListingById = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) return null;
    const driver = await ctx.db.get(listing.driverId);
    return { ...listing, driver: sanitizeUser(driver) };
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
        return { ...booking, rider: sanitizeUser(rider) };
      })
    );
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const postListing = mutation({
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
    departureTime: v.number(),
    totalSeats: v.number(),
    fare: v.number(),
    pickupPoint: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, ...args }) => {
    const user = await ctx.db.get(userId);
    if (user?.isSuspended) throw new Error("Your account has been suspended.");

    if (args.totalSeats < 1 || args.totalSeats > 4)
      throw new Error("Seats must be between 1 and 4");
    if (args.fare < 1 || args.fare > 2000)
      throw new Error("Fare must be between ₹1 and ₹2000");
    if (!withinIndia(args.fromLat, args.fromLng) || !withinIndia(args.toLat, args.toLng))
      throw new Error("Pickup and drop locations must be within India");

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

    return await ctx.db.insert("listings", {
      driverId: userId,
      fromLabel: args.fromLabel,
      toLabel: args.toLabel,
      fromLat: args.fromLat,
      fromLng: args.fromLng,
      toLat: args.toLat,
      toLng: args.toLng,
      fromPlaceId: args.fromPlaceId,
      toPlaceId: args.toPlaceId,
      departureTime: args.departureTime,
      totalSeats: args.totalSeats,
      seatsLeft: args.totalSeats,
      pickupPoint: args.pickupPoint,
      note: args.note,
      status: "open",
      fare: args.fare,
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
    if (listing.status === "expired") throw new Error("Listing has expired");
    if (listing.status === "started") throw new Error("Ride already started");

    await ctx.db.patch(listingId, { status: "cancelled" });

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();

    const riderIds = bookings
      .filter((b) => b.status === "confirmed")
      .map((b) => b.riderId);

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
    if (listing.status === "expired") throw new Error("Listing has expired");
    if (listing.status === "started") throw new Error("Ride already started");

    await ctx.db.patch(listingId, { status: "started" });

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

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();
    await Promise.all(
      bookings
        .filter((b) => b.status === "confirmed")
        .map((b) => ctx.db.patch(b._id, { status: "completed" }))
    );
  },
});

// TEMP: run from Convex dashboard to clear all listings when needed
export const clearAllListings = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("listings").collect();
    await Promise.all(all.map((l) => ctx.db.delete(l._id)));
    return `Deleted ${all.length} listings`;
  },
});
