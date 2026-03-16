import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Returns all messages in a conversation between two users on a listing, oldest first. */
export const getConversation = query({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, { userId, otherUserId, listingId }) => {
    const msgs = await ctx.db
      .query("directMessages")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .order("asc")
      .collect();

    return msgs.filter(
      (m) =>
        (m.senderId === userId && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === userId)
    );
  },
});

/** Send a direct message. Sender must be the driver or a confirmed rider on the listing. */
export const sendDM = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
    listingId: v.id("listings"),
    text: v.string(),
  },
  handler: async (ctx, { senderId, receiverId, listingId, text }) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    if (trimmed.length > 500) throw new Error("Message too long (max 500 chars)");

    const sender = await ctx.db.get(senderId);
    if (!sender) throw new Error("User not found");
    if (sender.isSuspended) throw new Error("Your account has been suspended.");

    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");

    // Verify sender is the driver or a confirmed rider
    const isDriver = listing.driverId === senderId;
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_listing_rider", (q) =>
        q.eq("listingId", listingId).eq("riderId", senderId)
      )
      .unique();
    const isRider = booking?.status === "confirmed";

    if (!isDriver && !isRider) {
      throw new Error("You are not part of this ride");
    }

    await ctx.db.insert("directMessages", {
      listingId,
      senderId,
      receiverId,
      text: trimmed,
      createdAt: Date.now(),
      read: false,
    });
  },
});

/** Mark all messages sent by otherUserId to userId in this listing as read. */
export const markRead = mutation({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, { userId, otherUserId, listingId }) => {
    const msgs = await ctx.db
      .query("directMessages")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();

    const toMark = msgs.filter(
      (m) => m.senderId === otherUserId && m.receiverId === userId && !m.read
    );
    await Promise.all(toMark.map((m) => ctx.db.patch(m._id, { read: true })));
  },
});

/** Total count of unread direct messages for a user across all conversations. */
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const unread = await ctx.db
      .query("directMessages")
      .withIndex("by_receiver_read", (q) =>
        q.eq("receiverId", userId).eq("read", false)
      )
      .collect();
    return unread.length;
  },
});
