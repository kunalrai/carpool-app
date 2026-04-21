import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import DrawerNav from "../components/DrawerNav";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

const AVATAR_COLORS = [
  ["#8b5cf6", "#6d28d9"],
  ["#3b82f6", "#1d4ed8"],
  ["#14b8a6", "#0d9488"],
  ["#f97316", "#ea580c"],
  ["#ec4899", "#db2777"],
  ["#6366f1", "#4f46e5"],
];
function avatarGradient(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  const [a, b] = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Ride Card ─────────────────────────────────────────────────────────────────

function RideCard({
  listing,
  onClick,
  index,
}: {
  listing: {
    _id: string; fromLabel: string; toLabel: string;
    departureTime: number; fare: number; seatsLeft: number;
    totalSeats: number; driver?: { name?: string; carName?: string; carColor?: string } | null;
  };
  onClick: () => void;
  index: number;
}) {
  const name = listing.driver?.name ?? "Driver";
  const taken = listing.totalSeats - listing.seatsLeft;
  const car = [listing.driver?.carColor, listing.driver?.carName].filter(Boolean).join(" ");
  const full = listing.seatsLeft === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 340, damping: 28 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl cursor-pointer overflow-hidden"
      style={{
        background: "white",
        boxShadow: "0 2px 16px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.06)",
        border: "1px solid rgba(99,102,241,0.1)",
      }}
      onClick={onClick}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)" }} />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center shadow-sm"
            style={{ background: avatarGradient(name) }}>
            <span className="text-white text-sm font-bold">{initials(name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 leading-tight">{name}</p>
            {car && <p className="text-xs text-gray-400 mt-0.5">{car}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-gray-900">₹{listing.fare}</p>
            <p className="text-[10px] text-gray-400">per seat</p>
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex flex-col items-center pt-1 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#2563eb" }} />
            <div className="w-px my-1" style={{ height: 20, background: "linear-gradient(180deg,#93c5fd,#d8b4fe)" }} />
            <div className="w-2.5 h-2.5 rounded-full border-2 bg-white" style={{ borderColor: "#7c3aed" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 truncate pr-2">{listing.fromLabel}</p>
              <p className="text-xs text-gray-400 shrink-0 tabular-nums font-semibold">{formatTime(listing.departureTime)}</p>
            </div>
            <p className="text-sm text-gray-500 truncate">{listing.toLabel}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1">
            {Array.from({ length: listing.totalSeats }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-colors`}
                style={{ background: i < taken ? "#6366f1" : "#e5e7eb" }} />
            ))}
          </div>
          {full ? (
            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Full</span>
          ) : (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {listing.seatsLeft} seat{listing.seatsLeft !== 1 ? "s" : ""} left
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Ride Request Card ─────────────────────────────────────────────────────────

function RideRequestCard({
  request,
  index,
}: {
  request: {
    _id: string; fromLabel: string; toLabel: string;
    departureTime: number; seatsNeeded: number; note?: string;
    rider?: { name?: string } | null;
  };
  index: number;
}) {
  const name = request.rider?.name ?? "Rider";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 340, damping: 28 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "white",
        boxShadow: "0 2px 16px rgba(124,58,237,0.08), 0 1px 4px rgba(0,0,0,0.06)",
        border: "1px solid rgba(124,58,237,0.1)",
      }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7c3aed 0%, #ec4899 100%)" }} />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center shadow-sm"
            style={{ background: avatarGradient(name) }}>
            <span className="text-white text-sm font-bold">{initials(name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 leading-tight">{name}</p>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              {request.seatsNeeded} seat{request.seatsNeeded !== 1 ? "s" : ""} needed
            </span>
          </div>
          <p className="text-xs text-gray-400 shrink-0 tabular-nums font-semibold">{formatTime(request.departureTime)}</p>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col items-center pt-1 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#7c3aed" }} />
            <div className="w-px my-1" style={{ height: 20, background: "linear-gradient(180deg,#d8b4fe,#f9a8d4)" }} />
            <div className="w-2.5 h-2.5 rounded-full border-2 bg-white" style={{ borderColor: "#ec4899" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate mb-2">{request.fromLabel}</p>
            <p className="text-sm text-gray-500 truncate">{request.toLabel}</p>
          </div>
        </div>

        {request.note && (
          <p className="mt-2 text-xs text-gray-500 bg-purple-50 rounded-xl px-3 py-1.5">{request.note}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Status Banners ────────────────────────────────────────────────────────────

type MyListing = NonNullable<ReturnType<typeof useQuery<typeof api.listings.getMyActiveListing>>>;
type MyBooking = NonNullable<ReturnType<typeof useQuery<typeof api.bookings.getMyBooking>>>;
type MyRequest = NonNullable<ReturnType<typeof useQuery<typeof api.rideRequests.getMyActiveRequest>>>;

function DriverBanner({ listing, loading, onStart, onEnd, onCancel }: {
  listing: MyListing; loading: boolean;
  onStart: () => void; onEnd: () => void; onCancel: () => void;
}) {
  const navigate = useNavigate();
  const filled = listing.totalSeats - listing.seatsLeft;
  const started = listing.status === "started";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mx-4 rounded-2xl p-4 overflow-hidden cursor-pointer active:opacity-90 relative"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)",
        boxShadow: "0 8px 32px rgba(30,58,138,0.35)",
      }}
      onClick={() => navigate("/my-listing")}
    >
      {/* Decorative glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Active Listing</p>
          <p className="text-sm font-bold text-white truncate">{listing.fromLabel}</p>
          <p className="text-xs text-blue-300 truncate">→ {listing.toLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatTime(listing.departureTime)}</p>
          <p className="text-xs text-blue-300">₹{listing.fare}/seat</p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-3"
        style={{ background: "rgba(255,255,255,0.1)" }}>
        <span className="text-sm font-medium text-white">
          {started ? "Ride in progress" : `${filled} of ${listing.totalSeats} seats filled`}
        </span>
        {filled > 0 && (
          <button onClick={(e) => { e.stopPropagation(); navigate(`/ride-chat/${listing._id}`); }}
            className="text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 active:opacity-70"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            Group Chat
          </button>
        )}
      </div>
      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
        {started ? (
          <>
            <span className="flex-1 text-center text-sm font-semibold text-white rounded-xl py-2.5"
              style={{ background: "rgba(255,255,255,0.15)" }}>On the way</span>
            <motion.button whileTap={{ scale: 0.96 }} onClick={onEnd} disabled={loading}
              className="flex-1 bg-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
              style={{ color: "#1e3a8a" }}>End Ride</motion.button>
          </>
        ) : (
          <>
            <motion.button whileTap={{ scale: 0.96 }} onClick={onStart} disabled={loading}
              className="flex-1 bg-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
              style={{ color: "#1e3a8a" }}>Start Ride</motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={onCancel} disabled={loading}
              className="flex-1 border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
              Cancel
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function RiderBanner({ booking, loading, onCancelSeat }: {
  booking: MyBooking; loading: boolean; onCancelSeat: () => void;
}) {
  const navigate = useNavigate();
  const { listing } = booking;
  const started = listing.status === "started";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mx-4 rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #065f46 0%, #0d9488 100%)",
        boxShadow: "0 8px 32px rgba(5,150,105,0.3)",
      }}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #6ee7b7 0%, transparent 70%)" }} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-1">My Ride · Rider</p>
          <p className="text-sm font-bold text-white truncate">{listing.fromLabel}</p>
          <p className="text-xs text-emerald-300 truncate">→ {listing.toLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatTime(listing.departureTime)}</p>
          <p className="text-xs text-emerald-300">₹{listing.fare}/seat</p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-3"
        style={{ background: "rgba(255,255,255,0.1)" }}>
        <p className="text-sm font-semibold text-white">{listing.driver?.name ?? "Driver"}</p>
        {listing.driverId && (
          <button onClick={() => navigate(`/dm/${booking.listingId}/${listing.driverId}`)}
            className="text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 active:opacity-70"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            Message Driver
          </button>
        )}
      </div>
      <button onClick={() => navigate(`/ride-chat/${booking.listingId}`)}
        className="w-full text-white text-sm font-semibold rounded-xl py-2 mb-3 active:opacity-80"
        style={{ background: "rgba(255,255,255,0.1)" }}>
        Group Chat
      </button>
      {started ? (
        <span className="block text-center text-sm font-semibold text-white rounded-xl py-2.5"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          Ride started — be at pickup!
        </span>
      ) : (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onCancelSeat} disabled={loading}
          className="w-full border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
          Cancel Seat
        </motion.button>
      )}
    </motion.div>
  );
}

function MyRequestBanner({ request, loading, onCancel }: {
  request: MyRequest; loading: boolean; onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mx-4 rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #5b21b6 0%, #9333ea 100%)",
        boxShadow: "0 8px 32px rgba(124,58,237,0.3)",
      }}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)" }} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-1">My Ride Request</p>
          <p className="text-sm font-bold text-white truncate">{request.fromLabel}</p>
          <p className="text-xs text-purple-300 truncate">→ {request.toLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatTime(request.departureTime)}</p>
          <p className="text-xs text-purple-300">{request.seatsNeeded} seat{request.seatsNeeded !== 1 ? "s" : ""} needed</p>
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onCancel} disabled={loading}
        className="w-full border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
        {loading ? "Cancelling…" : "Cancel Request"}
      </motion.button>
    </motion.div>
  );
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
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <motion.div
        initial={{ y: 32, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 32, scale: 0.97 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl"
      >
        <p className="text-gray-800 font-medium text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm">
            Keep it
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #dc2626 0%, #9f1239 100%)" }}>
            {loading ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ChatHomeScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [dashTab, setDashTab] = useState<"offering" | "seeking">("offering");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmCancelListing, setConfirmCancelListing] = useState(false);
  const [confirmCancelSeat, setConfirmCancelSeat] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const listings    = useQuery(api.listings.getActiveListings, {});
  const myListing   = useQuery(api.listings.getMyActiveListing, { userId: userId! });
  const myBooking   = useQuery(api.bookings.getMyBooking, { userId: userId! });
  const myRequest   = useQuery(api.rideRequests.getMyActiveRequest, { riderId: userId! });
  const allRequests = useQuery(api.rideRequests.getActiveRequests, {});

  const cancelListingMut = useMutation(api.listings.cancelListing);
  const startRideMut     = useMutation(api.listings.startRide);
  const endRideMut       = useMutation(api.listings.endRide);
  const cancelBookingMut = useMutation(api.bookings.cancelBooking);
  const cancelRequestMut = useMutation(api.rideRequests.cancelRequest);

  const handleStartRide = async () => {
    if (!myListing) return;
    setActionLoading(true);
    try { await startRideMut({ listingId: myListing._id, driverId: userId! }); }
    finally { setActionLoading(false); }
  };

  const handleEndRide = async () => {
    if (!myListing) return;
    setActionLoading(true);
    try { await endRideMut({ listingId: myListing._id, driverId: userId! }); }
    finally { setActionLoading(false); }
  };

  const handleCancelListing = async () => {
    if (!myListing) return;
    setActionLoading(true);
    try { await cancelListingMut({ listingId: myListing._id, driverId: userId! }); setConfirmCancelListing(false); }
    finally { setActionLoading(false); }
  };

  const handleCancelSeat = async () => {
    if (!myBooking) return;
    setActionLoading(true);
    try { await cancelBookingMut({ bookingId: myBooking._id, riderId: userId! }); setConfirmCancelSeat(false); }
    finally { setActionLoading(false); }
  };

  const handleCancelRequest = async () => {
    if (!myRequest) return;
    setActionLoading(true);
    try { await cancelRequestMut({ requestId: myRequest._id, riderId: userId! }); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 65px)", background: "#f8faff" }}>
      <DrawerNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-4 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
          boxShadow: "0 4px 24px rgba(30,58,138,0.25)",
        }}
      >
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </motion.button>
        <h1 className="text-base font-bold text-white tracking-wide">CarPool</h1>
        <div className="w-9" />
      </div>

      {/* ── Status Banners ── */}
      {(myListing || (myBooking && !myListing) || (myRequest && !myListing && !myBooking)) && (
        <div className="py-3 space-y-2">
          {myListing && (
            <DriverBanner listing={myListing} loading={actionLoading}
              onStart={handleStartRide} onEnd={handleEndRide}
              onCancel={() => setConfirmCancelListing(true)} />
          )}
          {myBooking && !myListing && (
            <RiderBanner booking={myBooking} loading={actionLoading}
              onCancelSeat={() => setConfirmCancelSeat(true)} />
          )}
          {myRequest && !myListing && !myBooking && (
            <MyRequestBanner request={myRequest} loading={actionLoading}
              onCancel={handleCancelRequest} />
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 bg-white flex relative"
        style={{ borderBottom: "1px solid #e0e7ff" }}>
        <button
          onClick={() => setDashTab("offering")}
          className={`flex-1 py-3 text-sm font-bold transition-colors relative ${
            dashTab === "offering" ? "text-blue-700" : "text-gray-400"
          }`}
        >
          🚗 Offering ({listings?.length ?? "…"})
          {dashTab === "offering" && (
            <motion.div layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: "linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)" }} />
          )}
        </button>
        <button
          onClick={() => setDashTab("seeking")}
          className={`flex-1 py-3 text-sm font-bold transition-colors relative ${
            dashTab === "seeking" ? "text-purple-700" : "text-gray-400"
          }`}
        >
          🙋 Seeking ({allRequests?.length ?? "…"})
          {dashTab === "seeking" && (
            <motion.div layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: "linear-gradient(90deg, #7c3aed 0%, #ec4899 100%)" }} />
          )}
        </button>
      </div>

      {/* ── Cards ── */}
      <div className="flex-1 px-4 py-4 space-y-3">
        <AnimatePresence mode="wait">
          {dashTab === "offering" && (
            <motion.div key="offering" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="space-y-3">
              {listings === undefined ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-2xl overflow-hidden"
                      style={{ background: "white", border: "1px solid #e0e7ff", boxShadow: "0 2px 8px rgba(99,102,241,0.06)" }}>
                      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #e0e7ff, #ede9fe)" }} />
                      <div className="p-4 space-y-2.5 animate-pulse">
                        <div className="flex gap-3">
                          <div className="w-11 h-11 rounded-full bg-gray-100" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                            <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="text-center pt-16">
                  <div className="text-5xl mb-4">🚗</div>
                  <p className="text-base font-bold text-gray-600">No rides available right now</p>
                  <p className="text-sm text-gray-400 mt-1">Go to Chat tab to post your ride via TaraAI</p>
                </motion.div>
              ) : (
                listings.map((l, i) => (
                  <RideCard key={l._id} listing={l} index={i} onClick={() => navigate(`/listing/${l._id}`)} />
                ))
              )}
            </motion.div>
          )}

          {dashTab === "seeking" && (
            <motion.div key="seeking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="space-y-3">
              {allRequests === undefined ? (
                <p className="text-sm text-gray-400 text-center pt-10">Loading…</p>
              ) : allRequests.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="text-center pt-16">
                  <div className="text-5xl mb-4">🙋</div>
                  <p className="text-base font-bold text-gray-600">No ride requests right now</p>
                  <p className="text-sm text-gray-400 mt-1">Go to Chat tab to post a request via TaraAI</p>
                </motion.div>
              ) : (
                allRequests.map((r, i) => (
                  <RideRequestCard key={r._id} request={r} index={i} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Confirm Dialogs ── */}
      <AnimatePresence>
        {confirmCancelListing && (
          <ConfirmDialog message="Cancel your active ride listing?"
            onConfirm={handleCancelListing} onCancel={() => setConfirmCancelListing(false)}
            loading={actionLoading} />
        )}
        {confirmCancelSeat && (
          <ConfirmDialog message="Cancel your booked seat?"
            onConfirm={handleCancelSeat} onCancel={() => setConfirmCancelSeat(false)}
            loading={actionLoading} />
        )}
      </AnimatePresence>
    </div>
  );
}
