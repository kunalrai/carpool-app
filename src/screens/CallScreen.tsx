import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import DailyIframe, { DailyCall, DailyParticipant } from "@daily-co/daily-js";

function toRoomSlug(id: string, maxLen = 20): string {
  return id.replace(/[^a-zA-Z0-9]/g, "").slice(0, maxLen);
}

type Participant = { id: string; name: string; audioOn: boolean; isSpeaking: boolean };

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
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const callRef = useRef<DailyCall | null>(null);

  const getCallToken = useAction(api.calls.getCallToken);
  const signalCall = useMutation(api.calls.signalCall);
  const endCall = useMutation(api.calls.endCall);
  const myProfile = useQuery(api.users.getUserProfile, userId ? { userId: userId as Id<"users"> } : "skip");

  const roomName =
    mode === "group"
      ? `ride-${toRoomSlug(listingId!)}`
      : `dm-${[userId, otherUserId].sort().map((id) => toRoomSlug(id!, 12)).join("-")}`;

  const syncParticipants = useCallback((call: DailyCall) => {
    const raw = call.participants();
    const list: Participant[] = Object.values(raw).map((p: DailyParticipant) => ({
      id: p.session_id,
      name: (p.user_name as string) || "Participant",
      audioOn: !!p.tracks?.audio?.persistentTrack,
      isSpeaking: !!(p as unknown as { activeSpeaker?: boolean }).activeSpeaker,
    }));
    setParticipants(list);
  }, []);

  const handleLeave = useCallback(() => {
    endCall({
      listingId: listingId as Id<"listings">,
      mode: (mode === "group" ? "group" : "dm") as "group" | "dm",
    }).catch(console.error);
    callRef.current?.leave();
  }, [endCall, listingId, mode]);

  useEffect(() => {
    if (!userId) return;

    let call: DailyCall | null = null;

    const startCall = async () => {
      try {
        const { roomUrl, token } = await getCallToken({
          roomName,
          userId: userId as Id<"users">,
        });

        call = DailyIframe.createCallObject({ audioSource: true, videoSource: false });
        callRef.current = call;

        call.on("joined-meeting", () => {
          setStatus("joined");
          call!.setLocalVideo(false);
          syncParticipants(call!);
          signalCall({
            listingId: listingId as Id<"listings">,
            callerId: userId as Id<"users">,
            callerName: myProfile?.name ?? "Someone",
            mode: (mode === "group" ? "group" : "dm") as "group" | "dm",
            targetUserId: otherUserId ? (otherUserId as Id<"users">) : undefined,
            roomName,
          }).catch(console.error);
        });

        call.on("left-meeting", () => {
          call?.destroy();
          navigate(-1);
        });

        call.on("participant-joined", () => syncParticipants(call!));
        call.on("participant-left", () => syncParticipants(call!));
        call.on("participant-updated", () => syncParticipants(call!));

        call.on("error", (e) => {
          setError((e as { errorMsg?: string })?.errorMsg ?? "Call failed");
          setStatus("error");
        });

        await call.join({ url: roomUrl, token });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start call");
        setStatus("error");
      }
    };

    startCall();

    return () => {
      call?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    callRef.current?.setLocalAudio(!next);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center px-6">

      {/* Connecting */}
      {status === "connecting" && (
        <div className="text-center text-white">
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

      {/* Error */}
      {status === "error" && (
        <div className="text-center text-white">
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

      {/* In-call UI */}
      {status === "joined" && (
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          {/* Title */}
          <div className="text-center">
            <p className="text-white font-semibold text-lg">
              {mode === "group" ? "Group Call" : "Voice Call"}
            </p>
            <p className="text-gray-400 text-sm mt-0.5">
              {participants.length} participant{participants.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Participant avatars */}
          <div className="flex flex-wrap justify-center gap-4">
            {participants.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1.5">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                  p.isSpeaking ? "bg-green-600 ring-4 ring-green-400" : "bg-gray-700"
                }`}>
                  {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?"}
                </div>
                <p className="text-xs text-gray-300 text-center max-w-[64px] truncate">{p.name}</p>
                {!p.audioOn && (
                  <span className="text-[10px] text-red-400">muted</span>
                )}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                muted ? "bg-red-600 active:bg-red-700" : "bg-gray-700 active:bg-gray-600"
              }`}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <MicOffIcon /> : <MicIcon />}
            </button>

            {/* Leave */}
            <button
              onClick={handleLeave}
              className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center active:bg-red-700"
              aria-label="End call"
            >
              <PhoneOffIcon />
            </button>
          </div>
        </div>
      )}
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
    <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.42 19.42 0 01-3.33-2.67m-2.67-3.34a19.79 19.79 0 01-3.07-8.63A2 2 0 014 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0014 0" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path d="M17 16.95A7 7 0 015 10v-1m14 0v1a7 7 0 01-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
