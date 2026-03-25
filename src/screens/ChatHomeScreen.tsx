import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
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
  "bg-purple-500", "bg-blue-500", "bg-teal-500",
  "bg-orange-500", "bg-pink-500", "bg-indigo-500",
];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Ride Card ─────────────────────────────────────────────────────────────────

function RideCard({
  listing,
  onClick,
}: {
  listing: {
    _id: string; fromLabel: string; toLabel: string;
    departureTime: number; fare: number; seatsLeft: number;
    totalSeats: number; driver?: { name?: string; carName?: string; carColor?: string } | null;
  };
  onClick: () => void;
}) {
  const name = listing.driver?.name ?? "Driver";
  const taken = listing.totalSeats - listing.seatsLeft;
  const car = [listing.driver?.carColor, listing.driver?.carName].filter(Boolean).join(" ");

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer active:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-full ${avatarColor(name)} flex items-center justify-center shrink-0`}>
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
        <div className="flex flex-col items-center pt-0.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <div className="w-px bg-gray-200 my-1" style={{ height: 22 }} />
          <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 truncate pr-2">{listing.fromLabel}</p>
            <p className="text-xs text-gray-400 shrink-0 tabular-nums">{formatTime(listing.departureTime)}</p>
          </div>
          <p className="text-sm text-gray-500 truncate">{listing.toLabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-0.5">
          {Array.from({ length: listing.totalSeats }).map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < taken ? "bg-gray-400" : "bg-gray-200"}`} />
          ))}
        </div>
        {listing.seatsLeft === 0 ? (
          <span className="text-xs font-semibold text-red-500">Full</span>
        ) : (
          <span className="text-xs font-semibold text-green-600">{listing.seatsLeft} seat{listing.seatsLeft !== 1 ? "s" : ""} left</span>
        )}
      </div>
    </div>
  );
}

// ── Ride Request Card ─────────────────────────────────────────────────────────

function RideRequestCard({
  request,
}: {
  request: {
    _id: string; fromLabel: string; toLabel: string;
    departureTime: number; seatsNeeded: number; note?: string;
    rider?: { name?: string } | null;
  };
}) {
  const name = request.rider?.name ?? "Rider";

  return (
    <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-full ${avatarColor(name)} flex items-center justify-center shrink-0`}>
          <span className="text-white text-sm font-bold">{initials(name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 leading-tight">{name}</p>
          <p className="text-xs text-purple-500 mt-0.5">
            {request.seatsNeeded} seat{request.seatsNeeded !== 1 ? "s" : ""} needed
          </p>
        </div>
        <p className="text-xs text-gray-400 shrink-0 tabular-nums">{formatTime(request.departureTime)}</p>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col items-center pt-0.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <div className="w-px bg-gray-200 my-1" style={{ height: 22 }} />
          <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-white" />
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
    <div className="mx-4 rounded-2xl bg-brand-700 p-4 cursor-pointer active:opacity-90" onClick={() => navigate("/my-listing")}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">Active Listing</p>
          <p className="text-sm font-bold text-white truncate">{listing.fromLabel}</p>
          <p className="text-xs text-blue-200 truncate">→ {listing.toLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatTime(listing.departureTime)}</p>
          <p className="text-xs text-blue-200">₹{listing.fare}/seat</p>
        </div>
      </div>
      <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 mb-3">
        <span className="text-sm font-medium text-white">
          {started ? "Ride in progress" : `${filled} of ${listing.totalSeats} seats filled`}
        </span>
        {filled > 0 && (
          <button onClick={(e) => { e.stopPropagation(); navigate(`/ride-chat/${listing._id}`); }}
            className="text-white text-xs font-semibold bg-white/20 px-2.5 py-1.5 rounded-xl active:opacity-70">
            Group Chat
          </button>
        )}
      </div>
      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
        {started ? (
          <>
            <span className="flex-1 text-center text-sm font-semibold text-white bg-white/20 py-2.5 rounded-xl">On the way</span>
            <button onClick={onEnd} disabled={loading} className="flex-1 bg-white text-brand-700 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">End Ride</button>
          </>
        ) : (
          <>
            <button onClick={onStart} disabled={loading} className="flex-1 bg-white text-brand-700 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">Start Ride</button>
            <button onClick={onCancel} disabled={loading} className="flex-1 border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

function RiderBanner({ booking, loading, onCancelSeat }: {
  booking: MyBooking; loading: boolean; onCancelSeat: () => void;
}) {
  const navigate = useNavigate();
  const { listing } = booking;
  const started = listing.status === "started";

  return (
    <div className="mx-4 rounded-2xl bg-green-600 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-semibold text-green-200 uppercase tracking-widest mb-1">My Ride · Rider</p>
          <p className="text-sm font-bold text-white truncate">{listing.fromLabel}</p>
          <p className="text-xs text-green-200 truncate">→ {listing.toLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatTime(listing.departureTime)}</p>
          <p className="text-xs text-green-200">₹{listing.fare}/seat</p>
        </div>
      </div>
      <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 mb-3">
        <p className="text-sm font-semibold text-white">{listing.driver?.name ?? "Driver"}</p>
        {listing.driverId && (
          <button onClick={() => navigate(`/dm/${booking.listingId}/${listing.driverId}`)}
            className="text-white text-xs font-semibold bg-white/20 px-2.5 py-1.5 rounded-xl active:opacity-70">
            Message Driver
          </button>
        )}
      </div>
      <button onClick={() => navigate(`/ride-chat/${booking.listingId}`)}
        className="w-full text-white text-sm font-semibold bg-white/10 py-2 rounded-xl mb-3 active:bg-white/20">
        Group Chat
      </button>
      {started ? (
        <span className="block text-center text-sm font-semibold text-white bg-white/20 py-2.5 rounded-xl">
          Ride started — be at pickup!
        </span>
      ) : (
        <button onClick={onCancelSeat} disabled={loading}
          className="w-full border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
          Cancel Seat
        </button>
      )}
    </div>
  );
}

function MyRequestBanner({ request, loading, onCancel }: {
  request: MyRequest; loading: boolean; onCancel: () => void;
}) {
  return (
    <div className="mx-4 rounded-2xl bg-purple-600 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-semibold text-purple-200 uppercase tracking-widest mb-1">My Ride Request</p>
          <p className="text-sm font-bold text-white truncate">{request.fromLabel}</p>
          <p className="text-xs text-purple-200 truncate">→ {request.toLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatTime(request.departureTime)}</p>
          <p className="text-xs text-purple-200">{request.seatsNeeded} seat{request.seatsNeeded !== 1 ? "s" : ""} needed</p>
        </div>
      </div>
      <button onClick={onCancel} disabled={loading}
        className="w-full border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
        {loading ? "Cancelling…" : "Cancel Request"}
      </button>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, loading }: {
  message: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/40">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
        <p className="text-gray-800 font-medium text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-secondary flex-1">Keep it</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-600 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50">
            {loading ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
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
    <div className="flex flex-col bg-gray-50" style={{ minHeight: "calc(100vh - 65px)" }}>
      <DrawerNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-12 pb-3 flex items-center justify-between">
        <button onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">CarPool</h1>
        <div className="w-9" />
      </div>

      {/* Status Banners */}
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

      {/* Dashboard tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 flex">
        <button
          onClick={() => setDashTab("offering")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            dashTab === "offering"
              ? "text-brand-700 border-b-2 border-brand-700"
              : "text-gray-400"
          }`}
        >
          Offering ({listings?.length ?? "…"})
        </button>
        <button
          onClick={() => setDashTab("seeking")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            dashTab === "seeking"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-400"
          }`}
        >
          Seeking ({allRequests?.length ?? "…"})
        </button>
      </div>

      {/* Cards list */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {dashTab === "offering" && (
          listings === undefined ? (
            <p className="text-sm text-gray-400 text-center pt-10">Loading…</p>
          ) : listings.length === 0 ? (
            <div className="text-center pt-12">
              <p className="text-2xl mb-2">🚗</p>
              <p className="text-sm font-medium text-gray-500">No rides available right now</p>
              <p className="text-xs text-gray-400 mt-1">Go to Chat to post your ride</p>
            </div>
          ) : (
            listings.map((l) => (
              <RideCard key={l._id} listing={l} onClick={() => navigate(`/listing/${l._id}`)} />
            ))
          )
        )}

        {dashTab === "seeking" && (
          allRequests === undefined ? (
            <p className="text-sm text-gray-400 text-center pt-10">Loading…</p>
          ) : allRequests.length === 0 ? (
            <div className="text-center pt-12">
              <p className="text-2xl mb-2">🙋</p>
              <p className="text-sm font-medium text-gray-500">No ride requests right now</p>
              <p className="text-xs text-gray-400 mt-1">Go to Chat to post a ride request</p>
            </div>
          ) : (
            allRequests.map((r) => (
              <RideRequestCard key={r._id} request={r} />
            ))
          )
        )}
      </div>

      {/* Confirm Dialogs */}
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
    </div>
  );
}
