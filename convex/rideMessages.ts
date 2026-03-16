import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

/** Check if a user is the driver or a confirmed rider on a listing. */
async function isParticipant(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  listingId: Id<"listings">
): Promise<boolean> {
  const listing = await ctx.db.get(listingId);
  if (!listing) return false;
  if (listing.driverId === userId) return true;

  const booking = await ctx.db
    .query("bookings")
    .withIndex("by_listing_rider", (q) =>
      q.eq("listingId", listingId).eq("riderId", userId)
    )
    .unique();
  return booking?.status === "confirmed";
}

/** Real-time group chat messages for a ride, with sender name attached. */
export const getRideMessages = query({
  args: {
    userId: v.id("users"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, { userId, listingId }) => {
    const authorized = await isParticipant(ctx, userId, listingId);
    if (!authorized) return [];

    const messages = await ctx.db
      .query("rideMessages")
      .withIndex("by_listing_time", (q) => q.eq("listingId", listingId))
      .order("asc")
      .collect();

    return await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return { ...msg, senderName: sender?.name ?? "Unknown" };
      })
    );
  },
});

/** Send a message to the ride group chat. Sender must be driver or confirmed rider. */
export const sendRideMessage = mutation({
  args: {
    senderId: v.id("users"),
    listingId: v.id("listings"),
    text: v.string(),
  },
  handler: async (ctx, { senderId, listingId, text }) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    if (trimmed.length > 500) throw new Error("Message too long (max 500 chars)");

    const sender = await ctx.db.get(senderId);
    if (!sender) throw new Error("User not found");
    if (sender.isSuspended) throw new Error("Your account has been suspended.");

    const authorized = await isParticipant(ctx, senderId, listingId);
    if (!authorized) throw new Error("You are not part of this ride");

    await ctx.db.insert("rideMessages", {
      listingId,
      senderId,
      text: trimmed,
      createdAt: Date.now(),
    });
  },
});

/** Returns all participants (driver + confirmed riders) for a listing. */
export const getRideParticipants = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();

    const driver = await ctx.db.get(listing.driverId);
    const riderEntries = await Promise.all(
      bookings
        .filter((b) => b.status === "confirmed")
        .map(async (b) => {
          const user = await ctx.db.get(b.riderId);
          return user ? { _id: user._id, name: user.name, isDriver: false as const } : null;
        })
    );

    return [
      ...(driver ? [{ _id: driver._id, name: driver.name, isDriver: true as const }] : []),
      ...riderEntries.filter((r): r is NonNullable<typeof r> => r !== null),
    ];
  },
});
