import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

const DAILY_BASE = "https://api.daily.co/v1";

/**
 * Gets a Daily.co meeting token for a call room.
 * Creates the room if it doesn't exist yet.
 * Room is private — only people with a token can join.
 */
export const getCallToken = action({
  args: {
    roomName: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { roomName, userId }): Promise<{ roomUrl: string; token: string }> => {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) throw new Error("DAILY_API_KEY is not configured");

    const user = await ctx.runQuery(api.users.getUserProfile, { userId });
    const userName: string = user?.name ?? "User";

    // Try to fetch an existing room; create it if it doesn't exist
    const getRes: Response = await fetch(`${DAILY_BASE}/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    let roomUrl: string;

    if (getRes.ok) {
      const room = await getRes.json() as { url: string };
      roomUrl = room.url;
    } else {
      const exp = Math.floor(Date.now() / 1000) + 7200; // 2 hours
      const createRes: Response = await fetch(`${DAILY_BASE}/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          privacy: "private",
          properties: {
            exp,
            max_participants: 6,
            start_video_off: true,
            start_audio_off: false,
            enable_screenshare: false,
            enable_chat: false,
            enable_prejoin_ui: false,
          },
        }),
      });

      if (!createRes.ok) {
        const err: string = await createRes.text();
        throw new Error(`Failed to create call room: ${err}`);
      }

      const room = await createRes.json() as { url: string };
      roomUrl = room.url;
    }

    // Issue a short-lived meeting token for this specific user
    const tokenRes: Response = await fetch(`${DAILY_BASE}/meeting-tokens`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
          exp: Math.floor(Date.now() / 1000) + 7200,
          start_video_off: true,
        },
      }),
    });

    if (!tokenRes.ok) {
      const err: string = await tokenRes.text();
      throw new Error(`Failed to create meeting token: ${err}`);
    }

    const tokenData = await tokenRes.json() as { token: string };
    return { roomUrl, token: tokenData.token };
  },
});

/**
 * Write an active call signal so other participants can see the call is live.
 * Upserts — if a signal already exists for this listing+mode, reactivates it.
 */
export const signalCall = mutation({
  args: {
    listingId: v.id("listings"),
    callerId: v.id("users"),
    callerName: v.string(),
    mode: v.union(v.literal("group"), v.literal("dm")),
    targetUserId: v.optional(v.id("users")),
    roomName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find an existing signal for this listing + mode to avoid duplicates
    const existing = await ctx.db
      .query("callSignals")
      .withIndex("by_listing_active", (q) => q.eq("listingId", args.listingId))
      .filter((q) => q.eq(q.field("mode"), args.mode))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        callerId: args.callerId,
        callerName: args.callerName,
        targetUserId: args.targetUserId,
        roomName: args.roomName,
        active: true,
        startedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("callSignals", {
      listingId: args.listingId,
      callerId: args.callerId,
      callerName: args.callerName,
      mode: args.mode,
      targetUserId: args.targetUserId,
      roomName: args.roomName,
      active: true,
      startedAt: Date.now(),
    });
  },
});

/**
 * Mark the call signal as inactive when the caller leaves.
 */
export const endCall = mutation({
  args: {
    listingId: v.id("listings"),
    mode: v.union(v.literal("group"), v.literal("dm")),
  },
  handler: async (ctx, { listingId, mode }) => {
    const signal = await ctx.db
      .query("callSignals")
      .withIndex("by_listing_active", (q) =>
        q.eq("listingId", listingId).eq("active", true)
      )
      .filter((q) => q.eq(q.field("mode"), mode))
      .first();

    if (signal) {
      await ctx.db.patch(signal._id, { active: false });
    }
  },
});

/**
 * Real-time query — returns the active call signal for a listing, if any.
 * Used by chat screens to show an incoming call banner.
 */
export const getActiveCallSignal = query({
  args: {
    listingId: v.id("listings"),
    mode: v.union(v.literal("group"), v.literal("dm")),
  },
  handler: async (ctx, { listingId, mode }) => {
    return await ctx.db
      .query("callSignals")
      .withIndex("by_listing_active", (q) =>
        q.eq("listingId", listingId).eq("active", true)
      )
      .filter((q) => q.eq(q.field("mode"), mode))
      .first();
  },
});
