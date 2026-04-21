import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Returns the most recent 60 Tara messages for this user, oldest first. */
export const getHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const all = await ctx.db
      .query("taraMessages")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();
    // Keep last 60 to avoid unbounded growth in the prompt
    return all.slice(-60);
  },
});

/** Appends one or more messages to the user's Tara history. */
export const saveMessages = mutation({
  args: {
    userId: v.id("users"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, { userId, messages }) => {
    const now = Date.now();
    for (let i = 0; i < messages.length; i++) {
      await ctx.db.insert("taraMessages", {
        userId,
        role: messages[i].role,
        content: messages[i].content,
        createdAt: now + i, // offset to preserve order within same ms
      });
    }
  },
});

/** Deletes all Tara history for a user (clear conversation). */
export const clearHistory = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const msgs = await ctx.db
      .query("taraMessages")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(msgs.map((m) => ctx.db.delete(m._id)));
    return msgs.length;
  },
});
