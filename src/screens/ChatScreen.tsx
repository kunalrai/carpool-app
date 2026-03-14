import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";

export default function ChatScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const listingId = id as Id<"listings">;

  const listing = useQuery(api.listings.getListingById, { listingId });
  const messages = useQuery(api.chat.getMessages, { listingId, userId: userId! });
  const sendMessage = useMutation(api.chat.sendMessage);

  const isReadOnly =
    listing?.status === "cancelled" || listing?.status === "completed";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage({ listingId, senderId: userId!, text });
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

  // ── Loading ──────────────────────────────────────────────────────────────
  if (listing === undefined || messages === undefined) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:bg-gray-100">
            <ChevronLeft />
          </button>
          <div className="h-5 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Loading…
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-gray-500">
        <p className="font-medium">Ride not found</p>
        <button onClick={() => navigate("/home")} className="text-brand-700 text-sm font-semibold">
          Back to Home
        </button>
      </div>
    );
  }

  const direction = listing.direction === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC";
  const departureTime = new Date(listing.departureTime).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-gray-100 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl active:bg-gray-100"
          aria-label="Back"
        >
          <ChevronLeft />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 leading-tight">Group Chat</p>
          <p className="text-xs text-gray-500">{direction} · {departureTime}</p>
        </div>
        {isReadOnly && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 shrink-0">
            {listing.status === "cancelled" ? "Cancelled" : "Ended"}
          </span>
        )}
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 text-xs text-amber-700 font-medium text-center shrink-0">
          This ride has ended. Chat is read-only.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
            <p className="text-2xl mb-2">👋</p>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Say hello to your ride group!</p>
          </div>
        )}

        {messages && messages.map((msg, i) => {
          const isOwn = msg.senderId === userId;
          const prevMsg = messages[i - 1];
          const showSenderName = !isOwn && msg.senderId !== prevMsg?.senderId;
          const time = new Date(msg.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          return (
            <div key={msg._id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
              {showSenderName && (
                <p className="text-xs text-gray-500 mb-1 ml-1">
                  {msg.senderName}
                  {msg.isDriver && (
                    <span className="ml-1 text-brand-600 font-semibold">(Driver)</span>
                  )}
                </p>
              )}
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  isOwn
                    ? "bg-brand-700 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
              <p className={`text-xs text-gray-400 mt-0.5 ${isOwn ? "mr-1" : "ml-1"}`}>
                {time}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 text-center shrink-0">
          {error}
        </div>
      )}

      {/* Input bar */}
      {!isReadOnly && (
        <div
          className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-2"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              maxLength={500}
              className="input-field resize-none max-h-28 overflow-y-auto py-2.5 pr-10"
              style={{ lineHeight: "1.4" }}
            />
            {text.length > 400 && (
              <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                {500 - text.length}
              </span>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-white disabled:opacity-40 active:bg-brand-800 transition-colors shrink-0"
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
