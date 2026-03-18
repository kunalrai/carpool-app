import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Fixed location: Gaur City 2, Greater Noida West
const LOCATION = { latitude: 28.6141, longitude: 77.4304 };

// 30 minutes — caps API usage at ≤ 2 calls/hour (48/day) regardless of user count
const CACHE_TTL_MS = 30 * 60 * 1000;

// ── Query (real-time subscription for the UI) ─────────────────────────────────

export const getCachedAqi = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("airQualityCache").first();
  },
});

// ── Internal mutation (writes the fetched value into the cache) ───────────────

export const upsertCache = mutation({
  args: {
    aqi: v.number(),
    category: v.string(),
    dominantPollutant: v.string(),
  },
  handler: async (ctx, { aqi, category, dominantPollutant }) => {
    const existing = await ctx.db.query("airQualityCache").first();
    const payload = { aqi, category, dominantPollutant, fetchedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("airQualityCache", payload);
    }
  },
});

// ── Action (checks TTL, hits Google API only when stale) ─────────────────────

export const refreshAqiIfStale = action({
  args: {},
  handler: async (ctx): Promise<void> => {
    // Check staleness first — avoids hitting the API if cache is still fresh
    const cached = await ctx.runQuery(api.airQuality.getCachedAqi);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return; // still fresh, skip API call
    }

    const apiKey = process.env.GOOGLE_AIR_QUALITY_KEY;
    if (!apiKey) {
      console.error("[AQI] GOOGLE_AIR_QUALITY_KEY not set — skipping fetch");
      return;
    }

    try {
      const response = await fetch(
        `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: LOCATION }),
        }
      );

      if (!response.ok) {
        console.error("[AQI] API error:", response.status, await response.text());
        return;
      }

      const data = await response.json();
      // Use the Universal AQI index (code: "uaqi")
      const uaqi = (data.indexes ?? []).find(
        (i: { code: string }) => i.code === "uaqi"
      );
      if (!uaqi) {
        console.error("[AQI] uaqi index not found in response");
        return;
      }

      await ctx.runMutation(api.airQuality.upsertCache, {
        aqi: uaqi.aqi,
        category: uaqi.category ?? "Unknown",
        dominantPollutant: uaqi.dominantPollutant ?? "—",
      });

      console.log(`[AQI] cached: AQI ${uaqi.aqi} — ${uaqi.category}`);
    } catch (e) {
      console.error("[AQI] fetch exception:", e);
    }
  },
});
