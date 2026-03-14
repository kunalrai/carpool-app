import { v } from "convex/values";
import { action } from "./_generated/server";

const SYSTEM_PROMPT = `You are a ride-offer parser for a carpooling app between Gaur City and HCL campus (Noida, India).

Analyze a chat message and extract ride offer details. Return JSON only — no explanation, no markdown, no code block.

Location rules:
- GC, GC1, GC2, Gaur City, gaur = Gaur City side
- HCL, HCL campus, HCL gate, office, Tech Park = HCL side
- "going to HCL" / "leaving for HCL" / "to office" / "from GC to HCL" → direction: "GC_TO_HCL"
- "going to GC" / "leaving from HCL" / "from HCL to GC" / "returning" / "back" → direction: "HCL_TO_GC"

Time rules:
- Convert any time format to 24h "HH:MM" string
- Examples: "7:30" → "07:30", "7:30 AM" → "07:30", "7:30 PM" → "19:30", "05:20 PM" → "17:20", "11.30 AM" → "11:30", "9pm" → "21:00"

isRideOffer rules — set to true if the message announces the sender is leaving/going somewhere at a specific time, even without mentioning seats or a car. Examples that ARE ride offers:
- "I will leave at 5:20 PM from HCL to Gaur City"
- "leaving @7:30 from HCL gate 2"
- "going to HCL at 9am"
- "Will go to HCL at 11.30 AM. Seats available"

Set isRideOffer=false ONLY if they are explicitly ASKING/LOOKING for a ride (e.g. "anyone going to HCL?", "need a ride to GC").

Return exactly this JSON with no other text:
{"isRideOffer":boolean,"direction":"GC_TO_HCL"|"HCL_TO_GC"|null,"departureTime":"HH:MM"|null,"seats":number|null,"pickupPoint":string|null}`;

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

    console.log("[AI] parsing message:", text);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://gaurcity-hcl-carpool.vercel.app",
        },
        body: JSON.stringify({
          model: "z-ai/glm-4.5-air:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text },
          ],
          temperature: 0,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("[AI] OpenRouter HTTP error:", response.status, errBody);
        return null;
      }

      const data = await response.json();
      const raw: string = data.choices?.[0]?.message?.content ?? "";
      console.log("[AI] raw response:", raw);

      if (!raw) {
        console.error("[AI] empty response from model");
        return null;
      }

      // Strip markdown code blocks if model wraps response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[AI] no JSON object found in response:", raw);
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log("[AI] parsed result:", JSON.stringify(parsed));
      return parsed;
    } catch (e) {
      console.error("[AI] exception:", e);
      return null;
    }
  },
});
