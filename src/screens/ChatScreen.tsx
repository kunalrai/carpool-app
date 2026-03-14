import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

// Convert "HH:MM" 24h string to Unix ms timestamp for today
function toTimestamp(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export default function ChatScreen() {
  const { userId } = useAuth();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [ridePosted, setRidePosted] = useState<string | null>(null); // success banner text
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useQuery(api.chat.getMessages, { userId: userId! });
  const sendMessage = useMutation(api.chat.sendMessage);
  const postListing = useMutation(api.listings.postListing);
  const parseRideOffer = useAction(api.ai.parseRideOffer);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-dismiss success banner after 4 seconds
  useEffect(() => {
    if (!ridePosted) return;
    const t = setTimeout(() => setRidePosted(null), 4000);
    return () => clearTimeout(t);
  }, [ridePosted]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setSending(true);
    setError(null);
    setRidePosted(null);
    try {
      await sendMessage({ senderId: userId!, text: msgText });
      setText("");
      inputRef.current?.focus();
      // Parse and auto-post in background
      setParsing(true);
      (async () => {
        try {
          const result = await parseRideOffer({ text: msgText });
          console.log("[Chat] parseRideOffer result:", result);
          if (!result || !result.isRideOffer || !result.direction || !result.departureTime) return;

          const departureMs = toTimestamp(result.departureTime);
          if (departureMs <= Date.now()) {
            setError("Detected a ride offer but departure time is in the past.");
            return;
          }

          await postListing({
            userId: userId!,
            direction: result.direction,
            departureTime: departureMs,
            totalSeats: result.seats ?? 1,
            pickupPoint: result.pickupPoint ?? undefined,
          });

          const dir = result.direction === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC";
          const time = new Date(departureMs).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", hour12: true,
          });
          setRidePosted(`🚗 Ride posted: ${dir} at ${time}`);
        } catch (e) {
          console.error("[Chat] auto-post error:", e);
          setError(e instanceof Error ? e.message : "Failed to auto-post ride");
        } finally {
          setParsing(false);
        }
      })();
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

  return (
    <div className="flex flex-col bg-white" style={{ height: "calc(100vh - 65px)" }}>

      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-white border-b border-gray-100 shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Community Chat</h1>
        <p className="text-xs text-gray-500 mt-0.5">GaurCity ↔ HCL · All members</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages === undefined && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Loading…
          </div>
        )}

        {messages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
            <p className="text-2xl mb-2">👋</p>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Say hello to the GaurCity-HCL community!</p>
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
                <p className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName}</p>
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

      {/* AI parsing indicator */}
      {parsing && (
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 text-center shrink-0">
          Detecting ride offer…
        </div>
      )}

      {/* Auto-post success banner */}
      {ridePosted && (
        <div className="mx-4 mb-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-2xl text-xs font-semibold text-green-700 text-center shrink-0">
          {ridePosted}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 text-center shrink-0">
          {error}
        </div>
      )}

      {/* Input bar */}
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
            placeholder="Message the community…"
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
    </div>
  );
}
