import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAction, useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
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
  const appSettings = useQuery(api.admin.getAppSettings, {});

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

  const handleLeave = useCallback(async () => {
    endCall({
      listingId: listingId as Id<"listings">,
      mode: (mode === "group" ? "group" : "dm") as "group" | "dm",
    }).catch(console.error);
    try {
      await callRef.current?.leave();
    } catch {
      navigate(-1);
    }
  }, [endCall, listingId, mode, navigate]);

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
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
    >
      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full"
          style={{ width: 300, height: 300, top: -80, right: -60, background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute rounded-full"
          style={{ width: 250, height: 250, bottom: -50, left: -40, background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
      </div>

      {/* Calls disabled by admin */}
      {appSettings?.callsEnabled === false && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <PhoneOffIcon />
          </div>
          <p className="text-base font-semibold text-white mb-2">Calls are currently disabled</p>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>The admin has turned off voice calls.</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            Go back
          </motion.button>
        </motion.div>
      )}

      {/* Connecting */}
      {appSettings?.callsEnabled !== false && status === "connecting" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <PhoneIcon />
          </motion.div>
          <p className="text-lg font-semibold text-white">
            {mode === "group" ? "Joining group call…" : "Connecting…"}
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Setting up secure audio</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 text-sm underline"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Cancel
          </button>
        </motion.div>
      )}

      {/* Error */}
      {appSettings?.callsEnabled !== false && status === "error" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <PhoneOffIcon />
          </div>
          <p className="text-base font-semibold mb-2" style={{ color: "#fca5a5" }}>Call failed</p>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>{error}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            Go back
          </motion.button>
        </motion.div>
      )}

      {/* In-call UI */}
      <AnimatePresence>
        {appSettings?.callsEnabled !== false && status === "joined" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10"
          >
            {/* Title */}
            <div className="text-center">
              <p className="text-white font-semibold text-lg">
                {mode === "group" ? "Group Call" : "Voice Call"}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {participants.length} participant{participants.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Participant avatars */}
            <div className="flex flex-wrap justify-center gap-5">
              {participants.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <motion.div
                    animate={p.isSpeaking ? {
                      scale: [1, 1.08, 1],
                      boxShadow: ["0 0 0 0 rgba(99,102,241,0)", "0 0 0 8px rgba(99,102,241,0.4)", "0 0 0 0 rgba(99,102,241,0)"],
                    } : {}}
                    transition={p.isSpeaking ? { duration: 1, repeat: Infinity } : {}}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{
                      background: p.isSpeaking
                        ? "linear-gradient(135deg, #22c55e, #16a34a)"
                        : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    }}
                  >
                    {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?"}
                  </motion.div>
                  <p className="text-xs text-center max-w-[64px] truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{p.name}</p>
                  {!p.audioOn && (
                    <span className="text-[10px]" style={{ color: "#fca5a5" }}>muted</span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Glass panel for controls */}
            <div
              className="flex items-center gap-6 px-8 py-5 rounded-3xl"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Mute toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={
                  muted
                    ? { background: "linear-gradient(135deg, #dc2626, #b91c1c)" }
                    : { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }
                }
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <MicOffIcon /> : <MicIcon />}
              </motion.button>

              {/* Leave */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLeave}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
                aria-label="End call"
              >
                <PhoneOffIcon />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
