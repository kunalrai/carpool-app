import { v } from "convex/values";
import { action } from "./_generated/server";

const SYSTEM_PROMPT = `You are a ride-offer parser for a carpooling app between Gaur City and HCL campus (Noida, India).

Analyze a chat message and extract ride offer details. Return JSON only — no explanation.

Location rules:
- GC, GC1, GC2, Gaur City, gaur = Gaur City side
- HCL, HCL campus, HCL gate, office, Tech Park = HCL side
- "going to HCL" / "leaving for HCL" / "to office" → direction: "GC_TO_HCL"
- "going to GC" / "leaving from HCL" / "returning" / "back" → direction: "HCL_TO_GC"

Time rules:
- Convert any time format to 24h "HH:MM" string
- Examples: "7:30" → "07:30", "7:30 AM" → "07:30", "7:30 PM" → "19:30", "11.30 AM" → "11:30", "9pm" → "21:00"

Only set isRideOffer=true if the sender is OFFERING to give a ride (has a car, offering seats).
Set isRideOffer=false if they are ASKING/LOOKING for a ride.

Return exactly this JSON:
{
  "isRideOffer": boolean,
  "direction": "GC_TO_HCL" | "HCL_TO_GC" | null,
  "departureTime": "HH:MM" | null,
  "seats": number | null,
  "pickupPoint": string | null
}`;

export const parseRideOffer = action({
  args: { text: v.string() },
  handler: async (_ctx, { text }): Promise<{
    isRideOffer: boolean;
    direction: "GC_TO_HCL" | "HCL_TO_GC" | null;
    departureTime: string | null;
    seats: number | null;
    pickupPoint: string | null;
  } | null> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("[AI] OPENROUTER_API_KEY not set");
      return null;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://gaurcity-hcl-carpool.vercel.app",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        }),
      });

      if (!response.ok) {
        console.error("[AI] OpenRouter error:", response.status, await response.text());
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      return JSON.parse(content);
    } catch (e) {
      console.error("[AI] parse error:", e);
      return null;
    }
  },
});
