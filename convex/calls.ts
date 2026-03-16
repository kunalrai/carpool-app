import { v } from "convex/values";
import { action } from "./_generated/server";
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
