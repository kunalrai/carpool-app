import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <circle cx="17" cy="7" r="3" />
      <path d="M21 21v-2a4 4 0 00-3-3.87" />
    </svg>
  );
}

export default function RideGroupChatScreen() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useQuery(api.rideMessages.getRideMessages, {
    userId: userId!,
    listingId: listingId as Id<"listings">,
  });

  const participants = useQuery(api.rideMessages.getRideParticipants, {
    listingId: listingId as Id<"listings">,
  });

  const sendRideMessage = useMutation(api.rideMessages.sendRideMessage);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setSending(true);
    setError(null);
    try {
      await sendRideMessage({
        senderId: userId!,
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

  const participantCount = participants?.length ?? 0;

  return (
    <div className="flex flex-col bg-white min-h-screen">
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
          <p className="font-semibold text-gray-900">Ride Group Chat</p>
          <button
            onClick={() => setShowParticipants((v) => !v)}
            className="flex items-center gap-1 text-xs text-brand-600 mt-0.5 active:opacity-70"
          >
            <UsersIcon />
            {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </button>
        </div>
        {/* Group icon */}
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
          <UsersIcon />
        </div>
      </div>

      {/* Participants panel */}
      {showParticipants && participants && (
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Participants</p>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <div
                key={p._id}
                className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 border border-gray-200"
              >
                <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-[9px] font-bold">
                  {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <span className="text-xs font-medium text-gray-700">{p.name}</span>
                {p.isDriver && (
                  <span className="text-[9px] font-semibold text-brand-600 bg-brand-50 px-1 rounded">
                    Driver
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28">
        {messages === undefined && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm py-16">
            Loading…
          </div>
        )}

        {messages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="3" />
                <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                <circle cx="17" cy="7" r="3" />
                <path d="M21 21v-2a4 4 0 00-3-3.87" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="text-xs mt-1">Be the first to say something</p>
          </div>
        )}

        {messages && messages.map((msg, i) => {
          const isOwn = msg.senderId === userId;
          const prevMsg = messages[i - 1];
          const showName = !isOwn && msg.senderId !== prevMsg?.senderId;
          const time = new Date(msg.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          return (
            <div key={msg._id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
              {showName && (
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

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 text-center shrink-0">
          {error}
        </div>
      )}

      {/* Input bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md shrink-0 px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-2"
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
            placeholder="Message the group…"
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
