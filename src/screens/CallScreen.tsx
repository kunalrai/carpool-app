import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

/**
 * Sanitise a Convex ID for use as part of a Daily room name.
 * Daily allows: a-z A-Z 0-9 - _   (3–100 chars)
 */
function toRoomSlug(id: string, maxLen = 20): string {
  return id.replace(/[^a-zA-Z0-9]/g, "").slice(0, maxLen);
}

export default function CallScreen() {
  const { mode, listingId, otherUserId } = useParams<{
    mode: string;
    listingId: string;
    otherUserId?: string;
  }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [status, setStatus] = useState<"connecting" | "joined" | "error">("connecting");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);

  const getCallToken = useAction(api.calls.getCallToken);

  // Build a deterministic, unique room name
  const roomName =
    mode === "group"
      ? `ride-${toRoomSlug(listingId!)}`
      : `dm-${[userId, otherUserId]
          .sort()
          .map((id) => toRoomSlug(id!, 12))
          .join("-")}`;

  useEffect(() => {
    if (!containerRef.current || !userId) return;

    let callFrame: DailyCall | null = null;

    const startCall = async () => {
      try {
        const { roomUrl, token } = await getCallToken({
          roomName,
          userId: userId as Id<"users">,
        });

        callFrame = DailyIframe.createFrame(containerRef.current!, {
          showLeaveButton: true,
          showFullscreenButton: false,
          iframeStyle: {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            border: "none",
            zIndex: "100",
          },
        });

        callRef.current = callFrame;

        callFrame.on("joined-meeting", () => setStatus("joined"));
        callFrame.on("left-meeting", () => {
          callFrame?.destroy();
          navigate(-1);
        });
        callFrame.on("error", (e) => {
          setError((e as { errorMsg?: string })?.errorMsg ?? "Call failed");
          setStatus("error");
        });

        await callFrame.join({ url: roomUrl, token });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start call");
        setStatus("error");
      }
    };

    startCall();

    return () => {
      callFrame?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
      {/* Connecting state */}
      {status === "connecting" && (
        <div className="text-center text-white px-6">
          <div className="w-20 h-20 rounded-full bg-brand-700 flex items-center justify-center mx-auto mb-5 animate-pulse">
            <PhoneIcon />
          </div>
          <p className="text-lg font-semibold">
            {mode === "group" ? "Joining group call…" : "Connecting…"}
          </p>
          <p className="text-sm text-gray-400 mt-1">Setting up secure audio</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 text-sm text-gray-400 underline active:text-gray-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="text-center text-white px-6">
          <div className="w-16 h-16 rounded-full bg-red-800 flex items-center justify-center mx-auto mb-4">
            <PhoneOffIcon />
          </div>
          <p className="text-base font-semibold text-red-300 mb-2">Call failed</p>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white/10 text-white rounded-xl text-sm font-semibold active:bg-white/20"
          >
            Go back
          </button>
        </div>
      )}

      {/* Daily iframe mounts here */}
      <div ref={containerRef} className="fixed inset-0 pointer-events-none" />
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.42 19.42 0 01-3.33-2.67m-2.67-3.34a19.79 19.79 0 01-3.07-8.63A2 2 0 014 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}
