import { useState, useRef, useEffect } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

type RideResult = {
  _id: Id<"listings">;
  fromLabel: string;
  toLabel: string;
  departureTime: number;
  driverName: string;
  seatsLeft: number;
  totalSeats: number;
  fare: number;
  pickupPoint?: string;
};

// Local overlay message for optimistic/ephemeral content (rides cards, applied flag)
type Overlay = {
  forIndex: number; // index in dbMessages this overlay belongs after
  applied?: boolean;
  rides?: RideResult[];
};

// ── Sub-components ────────────────────────────────────────────────────────────

function AiAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", fontWeight: 900, color: "white", flexShrink: 0 }}>
      AI
    </div>
  );
}

function ChatBubble({ role, content, applied }: { role: "user" | "assistant"; content: string; applied?: boolean }) {
  return (
    <div style={{
      background: role === "user" ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(255,255,255,0.07)",
      border: role === "assistant" ? "1px solid rgba(99,102,241,0.2)" : "none",
      borderRadius: role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
      padding: "0.625rem 0.875rem",
    }}>
      <p style={{ fontSize: "0.875rem", color: "white", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{content}</p>
      {applied && <p style={{ fontSize: "0.7rem", color: "#34d399", margin: "0.3rem 0 0", fontWeight: 700 }}>✓ Changes applied</p>}
    </div>
  );
}

function RideCards({ rides, onNavigate }: { rides: RideResult[]; onNavigate: (id: Id<"listings">) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {rides.map((ride) => {
        const dep = new Date(ride.departureTime);
        const depStr = dep.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) +
          " · " + dep.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        return (
          <motion.button key={ride._id} whileTap={{ scale: 0.97 }} onClick={() => onNavigate(ride._id)}
            style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "0.875rem", padding: "0.75rem", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "white", margin: 0 }}>{ride.driverName}</p>
            <p style={{ fontSize: "0.72rem", color: "rgba(165,180,252,0.8)", margin: 0 }}>{ride.fromLabel} → {ride.toLabel}</p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.1rem" }}>
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{depStr}</span>
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{ride.seatsLeft} seats</span>
              <span style={{ fontSize: "0.68rem", color: "#34d399", fontWeight: 700 }}>₹{ride.fare}</span>
            </div>
            {ride.pickupPoint && <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>📍 {ride.pickupPoint}</p>}
          </motion.button>
        );
      })}
    </div>
  );
}

const WELCOME =
  "Hi! I'm Tara 👋 I can help you:\n\n🔁 Manage recurring rides:\n• \"Show my recurring rides\"\n• \"Change my Monday ride to 8:30 AM\"\n• \"Pause my morning template\"\n\n🔍 Find available rides:\n• \"Find a ride at 3 PM from HCL to GaurCity\"\n• \"Any rides to office today?\"";

export default function TaraScreen() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const taraChat = useAction(api.tara.taraChat);
  const clearHistory = useMutation(api.taraHistory.clearHistory);

  // DB-backed message history (source of truth)
  const dbMessages = useQuery(api.taraHistory.getHistory, { userId: userId! });

  // Ephemeral state: pending user message shown while waiting, overlays for ride cards/applied badges
  const [pendingMsg, setPendingMsg] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dbMessages, pendingMsg, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !userId) return;
    setInput("");
    setPendingMsg(text);
    setLoading(true);
    try {
      const result = await taraChat({ userId, message: text });
      // DB will reactively update with the saved messages.
      // Store overlays (rides + applied) keyed to the last DB message index after update.
      const newIndex = (dbMessages?.length ?? 0) + 1; // assistant msg will be at this index
      if (result.applied || (result.rides && result.rides.length > 0)) {
        setOverlays((prev) => [
          ...prev,
          { forIndex: newIndex, applied: result.applied, rides: result.rides as RideResult[] | undefined },
        ]);
      }
    } catch {
      // On error, show a local error message by pushing to overlays at a sentinel index
      setOverlays((prev) => [...prev, { forIndex: -1 }]);
    } finally {
      setPendingMsg(null);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClear = async () => {
    if (!userId || clearing) return;
    setClearing(true);
    setOverlays([]);
    try { await clearHistory({ userId }); } finally { setClearing(false); }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "4rem", // bottom nav space
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          padding: "3rem 1rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
          flexShrink: 0,
        }}
      >
        {/* Tara avatar — pulses while processing */}
        <motion.div
          animate={loading ? {
            boxShadow: ["0 0 10px rgba(99,102,241,0.4)", "0 0 28px rgba(99,102,241,0.9)", "0 0 10px rgba(99,102,241,0.4)"],
          } : { boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.85rem",
            fontWeight: 900,
            color: "white",
            flexShrink: 0,
          }}
        >
          AI
        </motion.div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.05rem", fontWeight: 900, color: "white", margin: 0 }}>Tara</h1>
          <p style={{ fontSize: "0.7rem", color: "rgba(165,180,252,0.7)", margin: 0 }}>
            Recurring ride assistant
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* Clear history */}
          {dbMessages && dbMessages.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "0.625rem",
                padding: "0.4rem 0.6rem",
                color: "rgba(248,113,113,0.8)",
                fontSize: "0.65rem",
                fontWeight: 700,
                cursor: "pointer",
                opacity: clearing ? 0.5 : 1,
              }}
            >
              {clearing ? "…" : "Clear"}
            </button>
          )}
          <button
            onClick={() => navigate("/chat")}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "0.625rem",
              padding: "0.4rem 0.7rem",
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.7rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Community
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {/* Welcome message when no history */}
        {dbMessages !== undefined && dbMessages.length === 0 && !pendingMsg && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <AiAvatar />
            <ChatBubble role="assistant" content={WELCOME} />
          </motion.div>
        )}

        {/* DB-persisted messages */}
        {(dbMessages ?? []).map((msg, idx) => {
          const overlay = overlays.find((o) => o.forIndex === idx);
          return (
            <motion.div key={msg._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: "0.5rem", alignItems: "flex-end" }}>
              {msg.role === "assistant" && <AiAvatar />}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "78%" }}>
                <ChatBubble role={msg.role} content={msg.content} applied={overlay?.applied} />
                {overlay?.rides && overlay.rides.length > 0 && (
                  <RideCards rides={overlay.rides} onNavigate={(id) => navigate(`/listing/${id}`)} />
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Optimistic pending user message */}
        {pendingMsg && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "row-reverse", gap: "0.5rem", alignItems: "flex-end" }}>
            <ChatBubble role="user" content={pendingMsg} />
          </motion.div>
        )}

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}
          >
            {/* Pulsing avatar while thinking */}
            <motion.div
              animate={{ boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 14px rgba(99,102,241,0.8)", "0 0 0px rgba(99,102,241,0)"] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#3b82f6,#7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.58rem",
                fontWeight: 900,
                color: "white",
                flexShrink: 0,
              }}
            >
              AI
            </motion.div>
            <div
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "1rem 1rem 1rem 0.25rem",
                padding: "0.625rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              <span style={{ fontSize: "0.72rem", color: "rgba(165,180,252,0.85)", fontWeight: 600 }}>
                Tara is thinking…
              </span>
              <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "rgba(165,180,252,0.8)",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        style={{
          position: "fixed",
          bottom: "3.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "28rem",
          padding: "0.5rem 0.875rem",
          paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))",
          background: "rgba(15,23,42,0.97)",
          borderTop: `1px solid ${loading ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.2)"}`,
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          boxSizing: "border-box",
          transition: "border-color 0.3s",
        }}
      >
        {/* Status label while processing */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", paddingLeft: "0.25rem" }}
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", flexShrink: 0 }}
            />
            <span style={{ fontSize: "0.7rem", color: "#818cf8", fontWeight: 600 }}>
              Tara is processing your request…
            </span>
          </motion.div>
        )}

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={loading ? "Please wait…" : "Ask Tara about your rides…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={loading}
          style={{
            flex: 1,
            background: loading ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.07)",
            border: `1px solid ${loading ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.25)"}`,
            borderRadius: "0.875rem",
            padding: "0.7rem 0.875rem",
            color: loading ? "rgba(255,255,255,0.4)" : "white",
            fontSize: "0.875rem",
            outline: "none",
            transition: "all 0.3s",
          }}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#2563eb,#7c3aed)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: loading || !input.trim() ? 0.4 : 1,
            flexShrink: 0,
            transition: "opacity 0.15s",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={17}
            height={17}
            fill="none"
            stroke="white"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
          </svg>
        </motion.button>
        </div>
      </div>
    </div>
  );
}
