import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  applied?: boolean;
  rides?: RideResult[];
};

type HistoryItem = { role: "user" | "assistant"; content: string };

const WELCOME =
  "Hi! I'm Tara 👋 I can help you:\n\n🔁 Manage recurring rides:\n• \"Show my recurring rides\"\n• \"Change my Monday ride to 8:30 AM\"\n• \"Pause my morning template\"\n\n🔍 Find available rides:\n• \"Find a ride at 3 PM from HCL to GaurCity\"\n• \"Any rides to office today?\"";

export default function TaraScreen() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const taraChat = useAction(api.tara.taraChat);

  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const history: HistoryItem[] = messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({ role: m.role, content: m.content }));

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !userId) return;
    setInput("");
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const result = await taraChat({ userId, message: text, history });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.reply,
          applied: result.applied,
          rides: result.rides as RideResult[] | undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Something went wrong. Please try again!" },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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
          Community Chat
        </button>
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
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: "0.5rem",
              alignItems: "flex-end",
            }}
          >
            {msg.role === "assistant" && (
              <div
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
              </div>
            )}
            <div
              style={{
                maxWidth: "78%",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg,#2563eb,#7c3aed)"
                    : "rgba(255,255,255,0.07)",
                border:
                  msg.role === "assistant" ? "1px solid rgba(99,102,241,0.2)" : "none",
                borderRadius:
                  msg.role === "user"
                    ? "1rem 1rem 0.25rem 1rem"
                    : "1rem 1rem 1rem 0.25rem",
                padding: "0.625rem 0.875rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "white",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                }}
              >
                {msg.content}
              </p>
              {msg.applied && (
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "#34d399",
                    margin: "0.3rem 0 0",
                    fontWeight: 700,
                  }}
                >
                  ✓ Changes applied
                </p>
              )}
            </div>

            {/* Ride result cards */}
            {msg.rides && msg.rides.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", maxWidth: "90%" }}>
                {msg.rides.map((ride) => {
                  const dep = new Date(ride.departureTime);
                  const depStr = dep.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) +
                    " · " + dep.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                  return (
                    <motion.button
                      key={ride._id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/listing/${ride._id}`)}
                      style={{
                        background: "rgba(37,99,235,0.12)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        borderRadius: "0.875rem",
                        padding: "0.75rem",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "white", margin: 0 }}>{ride.driverName}</p>
                      <p style={{ fontSize: "0.72rem", color: "rgba(165,180,252,0.8)", margin: 0 }}>{ride.fromLabel} → {ride.toLabel}</p>
                      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.1rem" }}>
                        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{depStr}</span>
                        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{ride.seatsLeft} seats</span>
                        <span style={{ fontSize: "0.68rem", color: "#34d399", fontWeight: 700 }}>₹{ride.fare}</span>
                      </div>
                      {ride.pickupPoint && (
                        <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>📍 {ride.pickupPoint}</p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        ))}

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
