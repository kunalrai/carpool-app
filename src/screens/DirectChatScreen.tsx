import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";

export default function DirectChatScreen() {
  const { listingId, otherUserId } = useParams<{ listingId: string; otherUserId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useQuery(api.directMessages.getConversation, {
    userId: userId!,
    otherUserId: otherUserId as Id<"users">,
    listingId: listingId as Id<"listings">,
  });

  const otherUser = useQuery(api.users.getUserProfile, {
    userId: otherUserId as Id<"users">,
  });

  const sendDM = useMutation(api.directMessages.sendDM);
  const markRead = useMutation(api.directMessages.markRead);

  const activeCall = useQuery(api.calls.getActiveCallSignal, {
    listingId: listingId as Id<"listings">,
    mode: "dm",
  });

  const appSettings = useQuery(api.admin.getAppSettings, {});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!userId || !otherUserId || !listingId) return;
    markRead({
      userId: userId as Id<"users">,
      otherUserId: otherUserId as Id<"users">,
      listingId: listingId as Id<"listings">,
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, otherUserId, listingId, messages?.length]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setSending(true);
    setError(null);
    try {
      await sendDM({
        senderId: userId!,
        receiverId: otherUserId as Id<"users">,
        listingId: listingId as Id<"listings">,
        text: msgText,
      });
      setText("");
      inputRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const avatarLetters = otherUser?.name
    ? otherUser.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0f172a" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-12 pb-4 shrink-0"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
          borderBottom: "1px solid rgba(99,102,241,0.3)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl"
          style={{ color: "rgba(255,255,255,0.8)" }}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}
        >
          {avatarLetters}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">
            {otherUser?.name ?? "…"}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Private message · Ride chat</p>
        </div>

        {/* Call button */}
        {appSettings?.callsEnabled !== false && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/call/dm/${listingId}/${otherUserId}`)}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(34,197,94,0.2)", color: "#86efac" }}
            aria-label="Voice call"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Incoming call banner */}
      <AnimatePresence>
        {activeCall && activeCall.callerId !== userId && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="px-4 py-3 flex items-center gap-3 shrink-0"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 animate-pulse" style={{ background: "rgba(255,255,255,0.2)" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <p className="flex-1 text-white text-sm font-semibold min-w-0 truncate">Incoming call from {activeCall.callerName}</p>
            <button
              onClick={() => navigate(`/call/dm/${listingId}/${otherUserId}`)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
              style={{ background: "rgba(255,255,255,0.95)", color: "#16a34a" }}
            >
              Answer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28">
        {messages === undefined && (
          <div className="flex items-center justify-center h-full py-16 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Loading…
          </div>
        )}

        {messages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.07)" }}>
              <svg viewBox="0 0 24 24" className="w-8 h-8" style={{ color: "rgba(255,255,255,0.2)" }} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>No messages yet</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Say hi to coordinate your ride</p>
          </div>
        )}

        {messages && messages.map((msg, i) => {
          const isOwn = msg.senderId === userId;
          const time = new Date(msg.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", hour12: true,
          });

          return (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 8, x: isOwn ? 8 : -8 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
              className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
            >
              <div
                className="max-w-[75%] px-3 py-2 rounded-2xl text-sm"
                style={
                  isOwn
                    ? {
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        color: "white",
                        borderBottomRightRadius: "4px",
                      }
                    : {
                        background: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.9)",
                        borderBottomLeftRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                }
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
              <p className={`text-xs mt-0.5 ${isOwn ? "mr-1" : "ml-1"}`} style={{ color: "rgba(255,255,255,0.3)" }}>
                {time}
              </p>
            </motion.div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-2 text-xs text-center shrink-0"
            style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md shrink-0 px-4 py-3 flex items-end gap-2"
        style={{
          background: "rgba(15,23,42,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(99,102,241,0.2)",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherUser?.name ?? ""}…`}
            rows={1}
            maxLength={500}
            className="w-full resize-none max-h-28 overflow-y-auto py-2.5 px-3 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "white",
              lineHeight: "1.4",
            }}
          />
          {text.length > 400 && (
            <span className="absolute bottom-2 right-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {500 - text.length}
            </span>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}
          aria-label="Send"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
