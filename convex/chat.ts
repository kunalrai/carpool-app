import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    await ctx.db.insert("messages", {
      senderId,
      text: trimmed,
      createdAt: Date.now(),
    });
  },
});
