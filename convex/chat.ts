import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Returns true if userId is the driver or has ever booked this listing
async function isMember(
  ctx: { db: { get: Function; query: Function } },
  listingId: Id<"listings">,
  userId: Id<"users">
): Promise<boolean> {
  const listing = await ctx.db.get(listingId);
  if (!listing) return false;
  if (listing.driverId === userId) return true;
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_listing", (q: any) => q.eq("listingId", listingId))
    .collect();
  return bookings.some((b: any) => b.riderId === userId);
}

export const getMessages = query({
  args: {
    listingId: v.id("listings"),
    userId: v.id("users"),
  },
  handler: async (ctx, { listingId, userId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) return null;

    if (!(await isMember(ctx, listingId, userId))) {
      throw new Error("Not a member of this ride");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_listing_time", (q) => q.eq("listingId", listingId))
      .order("asc")
      .collect();

    return await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          senderName: sender?.name ?? "Unknown",
          isDriver: listing.driverId === msg.senderId,
        };
      })
    );
  },
});

export const sendMessage = mutation({
  args: {
    listingId: v.id("listings"),
    senderId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, { listingId, senderId, text }) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    if (trimmed.length > 500) throw new Error("Message too long (max 500 chars)");

    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.status === "cancelled" || listing.status === "completed") {
      throw new Error("This ride has ended. Chat is read-only.");
    }

    if (!(await isMember(ctx, listingId, senderId))) {
      throw new Error("Not a member of this ride");
    }

    await ctx.db.insert("messages", {
      listingId,
      senderId,
      text: trimmed,
      createdAt: Date.now(),
    });

    // Notify all members except sender
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();
    const memberIds = [
      listing.driverId,
      ...bookings.map((b) => b.riderId),
    ];
    const sender = await ctx.db.get(senderId);
    for (const memberId of memberIds) {
      if (memberId === senderId) continue;
      const member = await ctx.db.get(memberId);
      console.log("[FCM] newMessage →", {
        to: member?.fcmToken,
        title: sender?.name ?? "New message",
        body: trimmed.slice(0, 80),
        data: { screen: "chat", listingId },
      });
    }
  },
});
