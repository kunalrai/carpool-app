import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type RideResult = {
  _id: string;
  fromLabel: string;
  toLabel: string;
  departureTime: number;
  driverName: string;
  seatsLeft: number;
  totalSeats: number;
  fare: number;
  pickupPoint?: string;
};

function buildSystemPrompt(
  templates: {
    _id: string;
    fromLabel: string;
    toLabel: string;
    departureTimeHHMM: string;
    daysOfWeek: number[];
    totalSeats: number;
    fare: number;
    pickupPoint?: string;
    note?: string;
    isActive: boolean;
  }[]
): string {
  const tmplPart =
    templates.length === 0
      ? "User has NO recurring templates."
      : `User's recurring templates:\n${templates
          .map(
            (t, i) =>
              `[${i + 1}] ID:"${t._id}" | ${t.fromLabel} → ${t.toLabel} | ${t.departureTimeHHMM} IST | ${t.daysOfWeek.map((d) => DAY_NAMES[d]).join("/")} | ${t.totalSeats} seats | ₹${t.fare} | ${t.isActive ? "active" : "paused"}${t.pickupPoint ? ` | pickup:${t.pickupPoint}` : ""}`
          )
          .join("\n")}`;

  return `You are Tara, a friendly AI assistant for CarPool — a community carpooling app. You help users:
1. MANAGE their recurring ride schedule (drivers)
2. FIND available rides (riders)

${tmplPart}

TODAY'S DATE (IST): ${new Date(Date.now() + 5.5 * 3600000).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
CURRENT TIME (IST): ${new Date(Date.now() + 5.5 * 3600000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}

Actions you can take:
- action:"none"  → just reply (list templates, answer questions, chitchat)
- action:"edit"  → update a recurring template (templateId + changes required)
- action:"search" → search for available rides by location/time (use searchParams)

Recurring template edit fields: departureTimeHHMM (24h "HH:MM"), totalSeats (1-4), fare (₹1-2000), daysOfWeek ([0-6], 0=Sun), pickupPoint (string), note (string), isActive (boolean)
Day numbers: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat

For ride search, extract fromQuery, toQuery, and timeHHMM from the user's message. Use partial location names (e.g. "HCL", "GaurCity", "office", "home").

STRICT RULES — you must follow these without exception:
1. NEVER include raw database IDs (the long alphanumeric _id strings) in your "reply" text. IDs are for internal JSON fields only (templateId). When referring to a ride/template in your reply, use descriptive names like "your Monday 8:30 AM ride" or "template #1".
2. NEVER delete, remove, or permanently cancel anything. If the user asks to delete a ride, template, booking, or anything else, set action:"none" and politely explain: "I can't delete rides or templates — please use the Admin panel for deletions."
3. You CAN pause/resume a template (isActive: false/true) — that is NOT deletion.

Respond ONLY with JSON (no markdown, no extra text):
{
  "action": "none" | "edit" | "search",
  "templateId": "<_id from template list>" | null,
  "changes": { "departureTimeHHMM":"HH:MM"|null, "totalSeats":number|null, "fare":number|null, "daysOfWeek":[...]|null, "pickupPoint":string|null, "note":string|null, "isActive":boolean|null } | null,
  "searchParams": { "fromQuery": string|null, "toQuery": string|null, "timeHHMM": "HH:MM"|null } | null,
  "reply": "<warm, brief message — NO raw IDs allowed>"
}

Only include changed fields in "changes". If intent is unclear, set action:"none" and ask for clarification.`;
}

export const taraChat = action({
  args: {
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (
    ctx,
    { userId, message }
  ): Promise<{
    reply: string;
    applied: boolean;
    error?: string;
    rides?: RideResult[];
  }> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return {
        reply: "I'm not available right now — the AI service isn't configured. Please ask the admin to set OPENROUTER_API_KEY.",
        applied: false,
      };
    }

    // ── Hard-block delete requests before hitting the AI ───────────────────
    const DELETE_PATTERN = /\b(delete|remove|erase|wipe|drop|destroy|cancel booking|cancel ride|cancel listing|remove ride|remove template)\b/i;
    if (DELETE_PATTERN.test(message)) {
      const refusal = "I can't delete rides, templates, or bookings through chat. For any deletions, please use the Admin panel. I can help you pause a recurring ride if you'd like!";
      await ctx.runMutation(api.taraHistory.saveMessages, {
        userId,
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: refusal },
        ],
      });
      return { reply: refusal, applied: false };
    }

    // Load conversation history from DB (source of truth for context)
    const dbHistory = await ctx.runQuery(api.taraHistory.getHistory, { userId });
    const history = dbHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const templates = await ctx.runQuery(api.recurring.listMyTemplates, { userId });
    const systemPrompt = buildSystemPrompt(
      templates as Parameters<typeof buildSystemPrompt>[0]
    );

    // Try models in order; skip to next on 429 rate-limit
    const MODELS = [
      "nvidia/nemotron-3-super-120b-a12b:free",
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "z-ai/glm-4.5-air:free",
    ];

    let response: Response | null = null;
    for (const model of MODELS) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://carpool-virid.vercel.app",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...history.slice(-6),
            { role: "user", content: message },
          ],
          temperature: 0.3,
        }),
      });
      if (r.status === 429) {
        console.warn(`[Tara] ${model} rate-limited, trying next model`);
        continue;
      }
      response = r;
      break;
    }

    try {
      if (!response || !response.ok) {
        console.error("[Tara] All models failed or HTTP error:", response?.status);
        return { reply: "I'm a bit overloaded right now. Please try again in a moment!", applied: false };
      }

      const data = await response.json();
      const raw: string = data.choices?.[0]?.message?.content ?? "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { reply: "I didn't quite understand that. Could you rephrase?", applied: false };
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        action: string;
        templateId: string | null;
        changes: Record<string, unknown> | null;
        searchParams: { fromQuery: string | null; toQuery: string | null; timeHHMM: string | null } | null;
        reply: string;
      };

      // Sanitise reply: strip any leaked Convex-style IDs (20+ char alphanumeric tokens)
      const sanitiseReply = (text: string) =>
        text.replace(/\bj[0-9a-zA-Z]{15,}\b/g, "[id]").replace(/\b[0-9a-zA-Z]{20,}\b/g, "[id]");

      // Collect result, then save to DB before returning
      let result: { reply: string; applied: boolean; error?: string; rides?: RideResult[] };

      // ── Handle ride search ──────────────────────────────────────────────
      if (parsed.action === "search" && parsed.searchParams) {
        const { fromQuery, toQuery, timeHHMM } = parsed.searchParams;

        let departureTimeMs: number | undefined;
        if (timeHHMM) {
          const [h, m] = timeHHMM.split(":").map(Number);
          const IST_OFFSET_MS = 5.5 * 3600 * 1000;
          const nowIST = Date.now() + IST_OFFSET_MS;
          const midnightIST = nowIST - (nowIST % (24 * 3600 * 1000));
          departureTimeMs = midnightIST - IST_OFFSET_MS + h * 3600000 + m * 60000;
          if (departureTimeMs < Date.now() - 3600000) departureTimeMs += 24 * 3600 * 1000;
        }

        const found = await ctx.runQuery(api.listings.searchListings, {
          fromQuery: fromQuery ?? undefined,
          toQuery: toQuery ?? undefined,
          departureTimeMs,
          windowMs: 2 * 3600 * 1000,
        });

        if (found.length === 0) {
          const parts = [];
          if (fromQuery) parts.push(`from ${fromQuery}`);
          if (toQuery) parts.push(`to ${toQuery}`);
          if (timeHHMM) parts.push(`around ${timeHHMM}`);
          result = {
            reply: `I couldn't find any active rides${parts.length ? ` ${parts.join(" ")}` : ""} right now. Try adjusting your search or check back later!`,
            applied: false,
            rides: [],
          };
        } else {
          const replyText = sanitiseReply(
            parsed.reply ||
            `Found ${found.length} ride${found.length !== 1 ? "s" : ""}! Here ${found.length === 1 ? "it is" : "they are"}:`
          );
          result = {
            reply: replyText,
            applied: false,
            rides: found.map((r) => ({
              _id: r._id,
              fromLabel: r.fromLabel,
              toLabel: r.toLabel,
              departureTime: r.departureTime,
              driverName: (r as { driverName?: string }).driverName ?? "Unknown",
              seatsLeft: r.seatsLeft,
              totalSeats: r.totalSeats,
              fare: r.fare,
              pickupPoint: r.pickupPoint,
            })),
          };
        }

      // ── Block any action the AI might label as "delete" ──────────────────
      } else if (parsed.action === "delete" || parsed.action === "remove") {
        result = {
          reply: "I can't delete rides, templates, or bookings through chat. For any deletions, please use the Admin panel. I can help you pause a recurring ride if you'd like!",
          applied: false,
        };

      // ── Handle recurring template edit ──────────────────────────────────
      } else if (parsed.action === "edit" && parsed.templateId && parsed.changes) {
        const cleanChanges: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(parsed.changes)) {
          if (value !== null && value !== undefined) cleanChanges[key] = value;
        }

        if (Object.keys(cleanChanges).length > 0) {
          try {
            await ctx.runMutation(api.recurring.updateTemplate, {
              templateId: parsed.templateId as Id<"recurringTemplates">,
              userId,
              ...(cleanChanges as {
                departureTimeHHMM?: string;
                totalSeats?: number;
                fare?: number;
                daysOfWeek?: number[];
                pickupPoint?: string;
                note?: string;
                isActive?: boolean;
              }),
            });
            result = { reply: sanitiseReply(parsed.reply ?? "Done! Your ride schedule has been updated."), applied: true };
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            result = { reply: `I tried to update your ride but got an error: ${msg}`, applied: false, error: msg };
          }
        } else {
          result = { reply: sanitiseReply(parsed.reply ?? "Got it!"), applied: false };
        }
      } else {
        result = { reply: sanitiseReply(parsed.reply ?? "Got it!"), applied: false };
      }

      // ── Persist both sides of the exchange to DB ────────────────────────
      await ctx.runMutation(api.taraHistory.saveMessages, {
        userId,
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: result.reply },
        ],
      });

      return result;
    } catch (e) {
      console.error("[Tara] exception:", e);
      return { reply: "Something went wrong. Please try again!", applied: false };
    }
  },
});
