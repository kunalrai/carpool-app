import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Build Google Static Maps URL with route polyline
function buildStaticMapUrl(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const size = "600x300";
  const scale = "2";
  const zoom = 12;
  // Center point between pickup and dropoff
  const centerLat = (fromLat + toLat) / 2;
  const centerLng = (fromLng + toLng) / 2;
  // Path with markers
  const path = `color:0x4f46e5|weight:4|${fromLat},${fromLng}|${toLat},${toLng}`;
  const markers = `markers=color:blue|label:A|${fromLat},${fromLng}|markers=color:red|label:B|${toLat},${toLng}`;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${size}&scale=${scale}&path=${encodeURIComponent(path)}&${encodeURIComponent(markers)}&key=${apiKey}`;
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#8b5cf6,#6366f1)",
  "linear-gradient(135deg,#3b82f6,#6366f1)",
  "linear-gradient(135deg,#14b8a6,#3b82f6)",
  "linear-gradient(135deg,#f97316,#ef4444)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#6366f1,#a78bfa)",
];
function avatarGradient(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function avatarInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function ConfirmDialog({ message, onConfirm, onCancel, loading }: {
  message: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: "#1e293b", border: "1px solid rgba(99,102,241,0.3)" }}
      >
        <p className="font-medium text-center mb-6" style={{ color: "rgba(255,255,255,0.9)" }}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 font-semibold py-3 px-4 rounded-xl text-sm disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
          >
            {loading ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MyListingScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listing = useQuery(api.listings.getMyActiveListing, { userId: userId! });
  const riders = useQuery(
    api.listings.getListingRiders,
    listing ? { listingId: listing._id } : "skip"
  );

  const templates = useQuery(api.recurring.listMyTemplates, { userId: userId! });
  const toggleTemplate = useMutation(api.recurring.toggleTemplate);
  const deleteTemplate = useMutation(api.recurring.deleteTemplate);
  const [templateActionId, setTemplateActionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startRideMut = useMutation(api.listings.startRide);
  const cancelListingMut = useMutation(api.listings.cancelListing);
  const endRideMut = useMutation(api.listings.endRide);

  const withAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setError(null);
    try { await fn(); } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally { setActionLoading(false); }
  };

  const handleStart = () => withAction(async () => {
    await startRideMut({ listingId: listing!._id, driverId: userId! });
  });

  const handleCancel = () => withAction(async () => {
    await cancelListingMut({ listingId: listing!._id, driverId: userId! });
    setConfirmCancel(false);
    navigate("/home", { replace: true });
  });

  const handleEnd = () => withAction(async () => {
    await endRideMut({ listingId: listing!._id, driverId: userId! });
    navigate("/home", { replace: true });
  });

  const Header = () => (
    <div
      className="flex items-center justify-between px-4 pt-4 pb-4"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
        borderBottom: "1px solid rgba(99,102,241,0.3)",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        className="p-2 -ml-2 rounded-xl"
        style={{ color: "rgba(255,255,255,0.8)" }}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="text-base font-bold text-white">My Ride</span>
      <button
        onClick={() => navigate("/profile")}
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>
    </div>
  );

  if (listing === undefined) {
    return (
      <div className="min-h-screen" style={{ background: "#0f172a" }}>
        <Header />
        <div className="px-4 py-4 space-y-4 animate-pulse">
          <div className="h-52 rounded-3xl" style={{ background: "rgba(99,102,241,0.15)" }} />
          <div className="h-32 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <>
        <div className="min-h-screen flex flex-col" style={{ background: "#0f172a" }}>
          <Header />
          <div className="flex-1 px-4 py-6 space-y-4">
            <div className="text-center py-8">
              <p className="font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>No active ride</p>
              <button onClick={() => navigate("/home")} className="text-sm font-semibold mt-2" style={{ color: "#818cf8" }}>
                Back to Home
              </button>
            </div>

            {templates !== undefined && templates.length > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderTop: "2px solid #6366f1" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Recurring Schedules
                </p>
                <TemplatesList
                  templates={templates}
                  templateActionId={templateActionId}
                  setTemplateActionId={setTemplateActionId}
                  setConfirmDeleteId={setConfirmDeleteId}
                  toggleTemplate={toggleTemplate}
                  userId={userId!}
                />
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {confirmDeleteId && (
            <DeleteConfirmDialog
              confirmDeleteId={confirmDeleteId}
              setConfirmDeleteId={setConfirmDeleteId}
              templateActionId={templateActionId}
              setTemplateActionId={setTemplateActionId}
              deleteTemplate={deleteTemplate}
              userId={userId!}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  const filledSeats = listing.totalSeats - listing.seatsLeft;
  const isStarted = listing.status === "started";
  const isOpen = listing.status === "open" || listing.status === "full";
  const departureStr = new Date(listing.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <>
      <div className="min-h-screen flex flex-col" style={{ background: "#0f172a" }}>
        <Header />

        <div className="flex-1 overflow-y-auto pb-44 space-y-4 px-4 pt-3">

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm rounded-xl px-4 py-3 cursor-pointer"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
                onClick={() => setError(null)}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gradient info card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl p-5"
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 60%, #4c1d95 100%)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
            }}
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(196,181,253,0.9)" }}>
                Active Driver Listing
              </span>
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(255,255,255,0.15)" }}>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                  <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
                </svg>
                <span className="text-xs font-semibold text-white">{filledSeats} of {listing.totalSeats} seats filled</span>
              </div>
            </div>

            {/* Route timeline */}
            <div className="flex gap-4 mb-4">
              <div className="flex flex-col items-center pt-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-white" />
                <div className="w-px flex-1 my-1.5" style={{ background: "rgba(255,255,255,0.3)", minHeight: 32 }} />
                <div className="w-3 h-3 rounded-full border-2 border-white bg-transparent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(196,181,253,0.8)" }}>Pickup</p>
                  <p className="text-lg font-bold text-white leading-tight">{listing.fromLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(196,181,253,0.8)" }}>Drop-off</p>
                  <p className="text-lg font-bold text-white leading-tight">{listing.toLabel}</p>
                </div>
              </div>
            </div>

            {/* Static Map */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <img
                src={buildStaticMapUrl(listing.fromLat, listing.fromLng, listing.toLat, listing.toLng)}
                alt="Route map"
                className="w-full h-auto"
                style={{ display: "block" }}
              />
            </div>

            {/* Bottom info row */}
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(196,181,253,0.8)" }}>Departure</p>
                <p className="text-xl font-bold text-white tabular-nums">{departureStr}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(196,181,253,0.8)" }}>Earnings</p>
                <p className="text-base font-bold text-white">₹{listing.fare}/seat</p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "rgba(34,197,94,0.3)", border: "1px solid rgba(34,197,94,0.4)" }}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ color: "#86efac" }} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-xs font-bold" style={{ color: "#86efac" }}>VERIFIED RIDE</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Passengers */}
          <div>
            <h2 className="text-base font-bold text-white mb-3">Passengers</h2>

            {riders === undefined ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="rounded-2xl p-4 flex items-center gap-3 animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="w-11 h-11 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded w-1/3" style={{ background: "rgba(255,255,255,0.1)" }} />
                      <div className="h-3 rounded w-1/4" style={{ background: "rgba(255,255,255,0.07)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : riders.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>No passengers yet</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Your ride will appear in the feed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {riders.map((booking, idx) => {
                  const name = booking.rider?.name ?? "Rider";
                  const initials = avatarInitials(name);
                  const gradient = avatarGradient(name);
                  return (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(99,102,241,0.15)",
                        borderLeft: "3px solid #6366f1",
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: gradient }}
                      >
                        <span className="text-white text-sm font-bold">{initials}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{name}</p>
                        {isStarted && (
                          <p className="text-xs font-semibold mt-0.5" style={{
                            color: booking.checkedOut ? "#86efac" : booking.checkedIn ? "#93c5fd" : "rgba(255,255,255,0.35)",
                          }}>
                            {booking.checkedOut ? "✓ Checked out" : booking.checkedIn ? "✓ Checked in" : "Awaiting check-in"}
                          </p>
                        )}
                        {!isStarted && listing.pickupPoint && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} fill="currentColor">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{listing.pickupPoint}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate(`/dm/${listing._id}/${booking.riderId}`)}
                          className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded-xl"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                          Chat
                        </motion.button>
                        <button
                          onClick={() => navigate(`/ride-chat/${listing._id}`)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {riders.length > 1 && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/ride-chat/${listing._id}`)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-2xl"
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      color: "#818cf8",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                      <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
                    </svg>
                    Group Chat
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Map placeholder */}
          <div
            className="rounded-2xl overflow-hidden h-32 flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <div className="flex flex-col items-center gap-1" style={{ color: "rgba(129,140,248,0.5)" }}>
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              <span className="text-xs font-medium">Route Map</span>
            </div>
          </div>

          {/* Recurring schedules */}
          {templates !== undefined && templates.length > 0 && (
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderTop: "2px solid #a78bfa" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                Recurring Schedules
              </p>
              <TemplatesList
                templates={templates}
                templateActionId={templateActionId}
                setTemplateActionId={setTemplateActionId}
                setConfirmDeleteId={setConfirmDeleteId}
                toggleTemplate={toggleTemplate}
                userId={userId!}
              />
            </div>
          )}
        </div>

        {/* Sticky action buttons */}
        {(isOpen || isStarted) && (
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-4 space-y-3"
            style={{
              background: "rgba(15,23,42,0.95)",
              backdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(99,102,241,0.2)",
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
            }}
          >
            {isStarted ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleEnd}
                disabled={actionLoading}
                className="w-full text-white font-bold py-4 rounded-2xl text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                {actionLoading ? "Ending…" : "End Ride"}
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="w-full text-white font-bold py-4 rounded-2xl text-base disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  {actionLoading ? "Starting…" : "Start Ride"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setConfirmCancel(true)}
                  disabled={actionLoading}
                  className="w-full font-bold py-4 rounded-2xl text-base disabled:opacity-50"
                  style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", background: "rgba(239,68,68,0.08)" }}
                >
                  Cancel Ride
                </motion.button>
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {confirmCancel && (
          <ConfirmDialog
            message={
              filledSeats > 0
                ? `Cancel your ride? ${filledSeats} confirmed rider${filledSeats > 1 ? "s" : ""} will be notified.`
                : "Cancel your ride? It will be removed from the feed."
            }
            onConfirm={handleCancel}
            onCancel={() => setConfirmCancel(false)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeleteId && (
          <DeleteConfirmDialog
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            templateActionId={templateActionId}
            setTemplateActionId={setTemplateActionId}
            deleteTemplate={deleteTemplate}
            userId={userId!}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function TemplatesList({ templates, templateActionId, setTemplateActionId, setConfirmDeleteId, toggleTemplate, userId }: {
  templates: Array<{
    _id: string; fromLabel: string; toLabel: string; departureTimeHHMM: string;
    totalSeats: number; pickupPoint?: string; isActive: boolean; daysOfWeek: number[];
  }>;
  templateActionId: string | null;
  setTemplateActionId: (id: string | null) => void;
  setConfirmDeleteId: (id: string | null) => void;
  toggleTemplate: (args: { templateId: Id<"recurringTemplates">; userId: Id<"users">; isActive: boolean }) => Promise<unknown>;
  userId: string;
}) {
  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <div key={t._id} className="rounded-xl p-3" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-semibold text-white">{t.fromLabel} → {t.toLabel} · {t.departureTimeHHMM}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {t.totalSeats} seat{t.totalSeats > 1 ? "s" : ""}{t.pickupPoint ? ` · ${t.pickupPoint}` : ""}
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={t.isActive
                ? { background: "rgba(34,197,94,0.2)", color: "#86efac" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            >
              {t.isActive ? "Active" : "Paused"}
            </span>
          </div>
          <div className="flex gap-1 mb-3">
            {DAY_LABELS.map((label, idx) => (
              <span
                key={idx}
                className="w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center"
                style={t.daysOfWeek.includes(idx)
                  ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }
                  : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.25)" }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              disabled={templateActionId === t._id}
              onClick={async () => {
                setTemplateActionId(t._id);
                try { await toggleTemplate({ templateId: t._id as Id<"recurringTemplates">, userId: userId as Id<"users">, isActive: !t.isActive }); }
                finally { setTemplateActionId(null); }
              }}
              className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg disabled:opacity-50"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.05)" }}
            >
              {templateActionId === t._id ? "…" : t.isActive ? "Pause" : "Resume"}
            </button>
            <button
              disabled={templateActionId === t._id}
              onClick={() => setConfirmDeleteId(t._id)}
              className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg disabled:opacity-50"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", background: "rgba(239,68,68,0.07)" }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DeleteConfirmDialog({ confirmDeleteId, setConfirmDeleteId, templateActionId, setTemplateActionId, deleteTemplate, userId }: {
  confirmDeleteId: string;
  setConfirmDeleteId: (id: string | null) => void;
  templateActionId: string | null;
  setTemplateActionId: (id: string | null) => void;
  deleteTemplate: (args: { templateId: Id<"recurringTemplates">; userId: Id<"users"> }) => Promise<unknown>;
  userId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: "#1e293b", border: "1px solid rgba(99,102,241,0.3)" }}
      >
        <p className="font-medium text-center mb-6" style={{ color: "rgba(255,255,255,0.9)" }}>
          Delete this recurring schedule? Future auto-posts will stop.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmDeleteId(null)}
            disabled={templateActionId === confirmDeleteId}
            className="flex-1 font-semibold py-3 px-4 rounded-xl text-sm disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
          >
            Keep it
          </button>
          <button
            disabled={templateActionId === confirmDeleteId}
            onClick={async () => {
              setTemplateActionId(confirmDeleteId);
              try {
                await deleteTemplate({ templateId: confirmDeleteId as Id<"recurringTemplates">, userId: userId as Id<"users"> });
                setConfirmDeleteId(null);
              } finally { setTemplateActionId(null); }
            }}
            className="flex-1 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
          >
            {templateActionId === confirmDeleteId ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
