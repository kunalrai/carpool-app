import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Community chat — all registered users can read and send.

export const getMessages = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_time")
      .order("asc")
      .collect();

    return await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          senderName: sender?.name ?? "Unknown",
        };
      })
    );
  },
});

export const sendMessage = mutation({
  args: {
    senderId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, { senderId, text }) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    if (trimmed.length > 500) throw new Error("Message too long (max 500 chars)");

    const user = await ctx.db.get(senderId);
    if (!user) throw new Error("User not found");
    if (user.isSuspended) throw new Error("Your account has been suspended.");

    await ctx.db.insert("messages", {
      senderId,
      text: trimmed,
      createdAt: Date.now(),
    });

    // Notify all other users about the new message (except the sender)
    const allUsers = await ctx.db.query("users").collect();
    const senderName = user?.name ?? "Someone";

    for (const recipient of allUsers) {
      // Don't notify the sender themselves
      if (recipient._id !== senderId && recipient.fcmToken) {
        await ctx.scheduler.runAfter(0, internal.fcm.sendPush, {
          token: recipient.fcmToken,
          title: "New Message",
          body: `${senderName}: ${trimmed.substring(0, 50)}${trimmed.length > 50 ? "..." : ""}`,
        });
      }
    }
  },
});
