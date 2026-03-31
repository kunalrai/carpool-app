import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

function sanitizeUser(user: Doc<"users"> | null) {
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mobile: _m, fcmToken: _f, ...safe } = user;
  return safe;
}

export const getMyBookingForListing = query({
  args: { userId: v.id("users"), listingId: v.id("listings") },
  handler: async (ctx, { userId, listingId }) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_listing_rider", (q) =>
        q.eq("listingId", listingId).eq("riderId", userId)
      )
      .unique();
  },
});

export const getMyBooking = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_rider_status", (q) =>
        q.eq("riderId", userId).eq("status", "confirmed")
      )
      .unique();

    if (!booking) return null;

    const listing = await ctx.db.get(booking.listingId);
    if (!listing) return null;

    // Hide banner if the listing was cancelled, expired, or completed
    if (
      listing.status === "cancelled" ||
      listing.status === "expired" ||
      listing.status === "completed"
    ) return null;

    const driver = await ctx.db.get(listing.driverId);
    return { ...booking, listing: { ...listing, driver: sanitizeUser(driver) } };
  },
});

export const joinRide = mutation({
  args: {
    listingId: v.id("listings"),
    riderId: v.id("users"),
  },
  handler: async (ctx, { listingId, riderId }) => {
    const rider = await ctx.db.get(riderId);
    if (rider?.isSuspended) throw new Error("Your account has been suspended.");

    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.status === "cancelled") throw new Error("Listing is cancelled");
    if (listing.status === "expired") throw new Error("Listing has expired");
    if (listing.status === "started") throw new Error("Ride already started");
    if (listing.seatsLeft <= 0) throw new Error("No seats available");

    // Rider must not already have an active booking
    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_rider_status", (q) =>
        q.eq("riderId", riderId).eq("status", "confirmed")
      )
      .unique();
    if (existingBooking) throw new Error("You already have an active booking");

    // Rider must not be the driver
    if (listing.driverId === riderId) {
      throw new Error("You cannot join your own ride");
    }

    // Prevent duplicate join on same listing
    const duplicate = await ctx.db
      .query("bookings")
      .withIndex("by_listing_rider", (q) =>
        q.eq("listingId", listingId).eq("riderId", riderId)
      )
      .unique();
    if (duplicate?.status === "confirmed") {
      throw new Error("You have already joined this ride");
    }

    // Atomically decrement seatsLeft
    const newSeatsLeft = listing.seatsLeft - 1;
    const newStatus = newSeatsLeft === 0 ? "full" : "open";
    await ctx.db.patch(listingId, {
      seatsLeft: newSeatsLeft,
      status: newStatus,
    });

    // Create or reactivate booking
    let bookingId;
    if (duplicate) {
      await ctx.db.patch(duplicate._id, {
        status: "confirmed",
        joinedAt: Date.now(),
      });
      bookingId = duplicate._id;
    } else {
      bookingId = await ctx.db.insert("bookings", {
        listingId,
        riderId,
        status: "confirmed",
        joinedAt: Date.now(),
      });
    }

    // Notify driver via FCM
    const driver = await ctx.db.get(listing.driverId);
    if (driver?.fcmToken) {
      if (newSeatsLeft === 0) {
        await ctx.scheduler.runAfter(0, internal.fcm.sendPush, {
          token: driver.fcmToken,
          title: "Ride Full!",
          body: "Your ride is full! All riders confirmed.",
        });
      } else {
        await ctx.scheduler.runAfter(0, internal.fcm.sendPush, {
          token: driver.fcmToken,
          title: "New Rider",
          body: `${rider?.name ?? "Someone"} joined your ride.`,
        });
      }
    }

    return bookingId;
  },
});

export const checkIn = mutation({
  args: { bookingId: v.id("bookings"), riderId: v.id("users") },
  handler: async (ctx, { bookingId, riderId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.riderId !== riderId) throw new Error("Unauthorized");
    if (booking.status !== "confirmed") throw new Error("Booking is not active");

    const listing = await ctx.db.get(booking.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.status !== "started") throw new Error("Ride has not started yet");

    await ctx.db.patch(bookingId, { checkedIn: true });
  },
});

export const checkOut = mutation({
  args: { bookingId: v.id("bookings"), riderId: v.id("users") },
  handler: async (ctx, { bookingId, riderId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.riderId !== riderId) throw new Error("Unauthorized");
    if (booking.status !== "confirmed") throw new Error("Booking is not active");
    if (!booking.checkedIn) throw new Error("You must check in before checking out");

    const listing = await ctx.db.get(booking.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.status !== "started") throw new Error("Ride has not started");

    await ctx.db.patch(bookingId, { checkedOut: true });

    // Auto-complete listing if all confirmed riders have checked out
    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
      .collect();
    const confirmed = allBookings.filter((b) => b.status === "confirmed");
    const allOut = confirmed.every((b) => b._id === bookingId || b.checkedOut === true);

    if (allOut) {
      await ctx.db.patch(listing._id, { status: "completed" });
      await Promise.all(confirmed.map((b) => ctx.db.patch(b._id, { status: "completed" })));
    }
  },
});

export const cancelBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    riderId: v.id("users"),
  },
  handler: async (ctx, { bookingId, riderId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.riderId !== riderId) throw new Error("Unauthorized");
    if (booking.status === "cancelled") throw new Error("Already cancelled");

    const listing = await ctx.db.get(booking.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.status === "started") throw new Error("Ride already started");

    await ctx.db.patch(bookingId, { status: "cancelled" });

    // Increment seatsLeft; revert to 'open' if it was 'full'
    const newSeatsLeft = listing.seatsLeft + 1;
    const newStatus =
      listing.status === "full" ? "open" : listing.status;
    await ctx.db.patch(booking.listingId, {
      seatsLeft: newSeatsLeft,
      status: newStatus,
    });

    // Notify driver
    const driver = await ctx.db.get(listing.driverId);
    const rider = await ctx.db.get(riderId);
    if (driver?.fcmToken) {
      await ctx.scheduler.runAfter(0, internal.fcm.sendPush, {
        token: driver.fcmToken,
        title: "Rider Left",
        body: `${rider?.name ?? "A rider"} left your ride. ${newSeatsLeft} seat${newSeatsLeft !== 1 ? "s" : ""} free.`,
      });
    }
  },
});
