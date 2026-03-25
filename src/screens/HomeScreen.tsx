import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import LocationInput from "../components/LocationInput";
import DrawerNav from "../components/DrawerNav";
import type { PlaceResult } from "../hooks/usePlacesAutocomplete";
import { reverseGeocode } from "../hooks/usePlacesAutocomplete";
import { matchPercent } from "../lib/matching";


// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDeparture(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
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
function avatarInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function defaultTimeStr(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  const mins = Math.round(d.getMinutes() / 15) * 15;
  if (mins === 60) { d.setHours(d.getHours() + 1, 0, 0, 0); }
  else { d.setMinutes(mins, 0, 0); }
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parseTimeToday(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// ── Match Badge ───────────────────────────────────────────────────────────────

function MatchBadge({ pct }: { pct: number }) {
  const cls =
    pct >= 80 ? "bg-green-100 text-green-700" :
    pct >= 50 ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-500";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {pct}% match
    </span>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  message, onConfirm, onCancel, loading,
}: {
  message: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/40">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up shadow-xl">
        <p className="text-gray-800 font-medium text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-secondary">Keep it</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 text-white font-semibold py-3 px-4 rounded-xl active:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Driver Banner ─────────────────────────────────────────────────────────────

type MyListing = NonNullable<
  ReturnType<typeof useQuery<typeof api.listings.getMyActiveListing>>
>;

function DriverBanner({
  listing, onCancel, onStart, onEnd, loading,
}: {
  listing: MyListing; onCancel: () => void; onStart: () => void; onEnd: () => void; loading: boolean;
}) {
  const navigate = useNavigate();
  const filled = listing.totalSeats - listing.seatsLeft;
  const started = listing.status === "started";

  return (
    <div
      className="mx-4 rounded-2xl bg-brand-700 p-4 cursor-pointer active:opacity-90"
      onClick={() => navigate("/my-listing")}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">
            Active Driver Listing
          </p>
          <p className="text-sm font-bold text-white truncate">{listing.fromLabel}</p>
          <p className="text-xs text-blue-200 truncate">→ {listing.toLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatDeparture(listing.departureTime)}</p>
          <p className="text-xs text-blue-200">Today · ₹{listing.fare}/seat</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 mb-4">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
            <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
          </svg>
          <span className="text-sm font-medium text-white">
            {started ? "Ride in progress" : `${filled} of ${listing.totalSeats} seats filled`}
          </span>
        </div>
        {filled > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/ride-chat/${listing._id}`); }}
            className="flex items-center gap-1.5 text-white text-xs font-semibold active:opacity-70 bg-white/20 px-2.5 py-1.5 rounded-xl"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
              <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
            </svg>
            Group Chat
          </button>
        )}
      </div>

      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
        {started ? (
          <>
            <span className="flex-1 text-center text-sm font-semibold text-white bg-white/20 py-2.5 rounded-xl">On the way</span>
            <button onClick={onEnd} disabled={loading} className="flex-1 bg-white text-brand-700 font-semibold py-2.5 rounded-xl text-sm active:opacity-80 disabled:opacity-50">
              End Ride
            </button>
          </>
        ) : (
          <>
            <button onClick={onStart} disabled={loading} className="flex-1 bg-white text-brand-700 font-semibold py-2.5 rounded-xl text-sm active:opacity-80 disabled:opacity-50">
              Start Ride
            </button>
            <button onClick={onCancel} disabled={loading} className="flex-1 border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm active:bg-white/10 disabled:opacity-50">
              Cancel Ride
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Rider Banner ──────────────────────────────────────────────────────────────

type MyBooking = NonNullable<
  ReturnType<typeof useQuery<typeof api.bookings.getMyBooking>>
>;

function RiderBanner({
  booking, onCancelSeat, loading,
}: {
  booking: MyBooking; onCancelSeat: () => void; loading: boolean;
}) {
  const navigate = useNavigate();
  const { listing } = booking;
  const driver = listing.driver;
  const started = listing.status === "started";

  return (
    <div className="mx-4 rounded-2xl bg-green-600 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-semibold text-green-200 uppercase tracking-widest mb-1">
            My Ride · Rider
          </p>
          <p className="text-sm font-bold text-white truncate">{listing.fromLabel}</p>
          <p className="text-xs text-green-200 truncate">→ {listing.toLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatDeparture(listing.departureTime)}</p>
          <p className="text-xs text-green-200">Today · ₹{listing.fare}/seat</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-white">{driver?.name ?? "Driver"}</p>
          {driver?.carName && (
            <p className="text-xs text-green-100">{driver.carName}{driver.carColor ? ` · ${driver.carColor}` : ""}</p>
          )}
        </div>
        {listing.driverId && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/dm/${booking.listingId}/${listing.driverId}`); }}
            className="flex items-center gap-1.5 text-white text-xs font-semibold active:opacity-70 bg-white/20 px-2.5 py-1.5 rounded-xl"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Driver
          </button>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/ride-chat/${booking.listingId}`); }}
        className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold bg-white/10 py-2 rounded-xl mb-3 active:bg-white/20"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
          <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
        </svg>
        Group Chat
      </button>

      <div>
        {started ? (
          <span className="block text-center text-sm font-semibold text-white bg-white/20 py-2.5 rounded-xl">
            Ride started — be at pickup!
          </span>
        ) : (
          <button
            onClick={onCancelSeat}
            disabled={loading}
            className="w-full border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm active:bg-white/10 disabled:opacity-50"
          >
            Cancel Seat
          </button>
        )}
      </div>
    </div>
  );
}

// ── My Request Banner ─────────────────────────────────────────────────────────

type MyRequest = NonNullable<
  ReturnType<typeof useQuery<typeof api.rideRequests.getMyActiveRequest>>
>;

function MyRequestBanner({
  request, onCancel, loading,
}: {
  request: MyRequest; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="mx-4 rounded-2xl bg-purple-600 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-semibold text-purple-200 uppercase tracking-widest mb-1">
            My Ride Request
          </p>
          <p className="text-sm font-bold text-white truncate">{request.fromLabel}</p>
          <p className="text-xs text-purple-200 truncate">→ {request.toLabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatDeparture(request.departureTime)}</p>
          <p className="text-xs text-purple-200">{request.seatsNeeded} seat{request.seatsNeeded > 1 ? "s" : ""} needed</p>
        </div>
      </div>
      {request.note && (
        <p className="text-xs text-purple-100 bg-white/10 rounded-xl px-3 py-2 mb-3">
          {request.note}
        </p>
      )}
      <button
        onClick={onCancel}
        disabled={loading}
        className="w-full border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm active:bg-white/10 disabled:opacity-50"
      >
        {loading ? "Cancelling…" : "Cancel Request"}
      </button>
    </div>
  );
}

// ── Post Request Sheet ────────────────────────────────────────────────────────

function PostRequestSheet({
  onClose,
  onSubmit,
  initialFrom = null,
  initialTo = null,
}: {
  onClose: () => void;
  onSubmit: (data: {
    fromLabel: string; fromLat: number; fromLng: number;
    toLabel: string; toLat: number; toLng: number;
    departureTime: number; seatsNeeded: number; note?: string;
  }) => Promise<void>;
  initialFrom?: PlaceResult | null;
  initialTo?: PlaceResult | null;
}) {
  const [from, setFrom] = useState<PlaceResult | null>(initialFrom);
  const [to, setTo] = useState<PlaceResult | null>(initialTo);
  const [timeStr, setTimeStr] = useState(defaultTimeStr);
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setFrom(result);
        } catch {
          setError("Could not determine your location");
        } finally { setLocating(false); }
      },
      () => { setError("Location access denied"); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!from || !to) { setError("Please set pickup and drop locations"); return; }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        fromLabel: from.label, fromLat: from.lat, fromLng: from.lng,
        toLabel: to.label, toLat: to.lat, toLng: to.lng,
        departureTime: parseTimeToday(timeStr),
        seatsNeeded: seats,
        note: note.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl animate-slide-up pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Post a Ride Request</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-4 space-y-4">
          {/* From / To */}
          <div className="bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <div className="flex-1">
                <LocationInput placeholder="From — pickup area…" value={from} onChange={setFrom} />
              </div>
              <button
                onClick={handleUseMyLocation}
                disabled={locating}
                title="Use my location"
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 active:bg-blue-100 disabled:opacity-40"
              >
                {locating ? (
                  <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="ml-[3.25rem] mr-4 border-t border-dashed border-gray-200" />
            <div className="flex items-center gap-3 px-4 pt-2 pb-4">
              <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <div className="flex-1">
                <LocationInput placeholder="To — drop area…" value={to} onChange={setTo} />
              </div>
            </div>
          </div>

          {/* Time + Seats */}
          <div className="flex gap-3">
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Departure</p>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
              />
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Seats needed</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSeats((s) => Math.max(1, s - 1))}
                  className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm active:bg-gray-300"
                >−</button>
                <span className="text-sm font-bold text-gray-800 w-4 text-center">{seats}</span>
                <button
                  onClick={() => setSeats((s) => Math.min(4, s + 1))}
                  className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm active:bg-gray-300"
                >+</button>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Note (optional)</p>
            <textarea
              rows={2}
              maxLength={200}
              placeholder="e.g. I'm near the main gate…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-800 outline-none resize-none placeholder-gray-400"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !from || !to}
            className="w-full bg-brand-700 text-white font-semibold py-3.5 rounded-xl text-sm active:bg-brand-800 disabled:opacity-40"
          >
            {loading ? "Posting…" : "Post Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ride Card ─────────────────────────────────────────────────────────────────

function RideCard({
  listing,
  matchPct,
  onClick,
}: {
  listing: {
    _id: string;
    fromLabel: string;
    toLabel: string;
    departureTime: number;
    fare: number;
    seatsLeft: number;
    totalSeats: number;
    driver?: { name?: string; carName?: string; carColor?: string } | null;
  };
  matchPct?: number;
  onClick: () => void;
}) {
  const driverName = listing.driver?.name ?? "Driver";
  const initials = avatarInitials(driverName);
  const color = avatarColor(driverName);
  const takenSeats = listing.totalSeats - listing.seatsLeft;
  const carLine = [listing.driver?.carColor, listing.driver?.carName].filter(Boolean).join(" ");

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:bg-gray-50"
      onClick={onClick}
    >
      {/* ── Header: avatar · name · price ── */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center shrink-0`}>
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 leading-tight">{driverName}</p>
          {carLine && (
            <div className="flex items-center gap-1 mt-0.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-green-500 shrink-0" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z" />
              </svg>
              <span className="text-xs text-gray-400">{carLine}</span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">₹{listing.fare}</p>
          <p className="text-[10px] font-bold text-gray-400 tracking-wide">FIXED PRICE</p>
        </div>
      </div>

      {/* ── Route timeline ── */}
      <div className="flex gap-3 mb-4">
        <div className="flex flex-col items-center pt-1 shrink-0">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <div className="w-px bg-gray-200 my-1" style={{ height: 26 }} />
          <div className="w-3 h-3 rounded-full border-2 border-gray-400 bg-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-700 font-medium truncate pr-2">{listing.fromLabel}</p>
            <p className="text-sm text-gray-400 shrink-0 tabular-nums">{formatDeparture(listing.departureTime)}</p>
          </div>
          <p className="text-sm text-gray-500 truncate">{listing.toLabel}</p>
        </div>
      </div>

      {/* ── Footer: seat indicators · match badge · seats left ── */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 gap-1">
            <span className="text-xs font-bold text-gray-600">{takenSeats}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: listing.totalSeats }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < takenSeats ? "bg-gray-400" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>
          {matchPct !== undefined && <MatchBadge pct={matchPct} />}
        </div>
        {listing.seatsLeft === 0 ? (
          <span className="text-xs font-semibold text-red-500">Full</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-green-600">{listing.seatsLeft} Seats Left</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ride Request Card ─────────────────────────────────────────────────────────

type ActiveRequest = {
  _id: string;
  riderId: string;
  fromLabel: string;
  toLabel: string;
  departureTime: number;
  seatsNeeded: number;
  note?: string;
  rider?: { name?: string } | null;
};

function RideRequestCard({ request, matchPct }: { request: ActiveRequest; matchPct: number }) {
  const riderName = request.rider?.name ?? "Rider";
  const initials = avatarInitials(riderName);
  const color = avatarColor(riderName);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center shrink-0`}>
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 leading-tight">{riderName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {request.seatsNeeded} seat{request.seatsNeeded > 1 ? "s" : ""} needed
          </p>
        </div>
        <MatchBadge pct={matchPct} />
      </div>

      {/* Route */}
      <div className="flex gap-3 mb-3">
        <div className="flex flex-col items-center pt-1 shrink-0">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="w-px bg-gray-200 my-1" style={{ height: 26 }} />
          <div className="w-3 h-3 rounded-full border-2 border-gray-400 bg-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-700 font-medium truncate pr-2">{request.fromLabel}</p>
            <p className="text-sm text-gray-400 shrink-0 tabular-nums">{formatDeparture(request.departureTime)}</p>
          </div>
          <p className="text-sm text-gray-500 truncate">{request.toLabel}</p>
        </div>
      </div>

      {/* Note */}
      {request.note && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
          {request.note}
        </p>
      )}
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"find" | "offer">("find");
  const [showPostReqSheet, setShowPostReqSheet] = useState(false);

  const [searchFrom, setSearchFrom] = useState<PlaceResult | null>(null);
  const [searchTo, setSearchTo] = useState<PlaceResult | null>(null);
  const [locating, setLocating] = useState(false);

  const [offerFrom, setOfferFrom] = useState<PlaceResult | null>(null);
  const [offerTo, setOfferTo] = useState<PlaceResult | null>(null);


  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancelListing, setConfirmCancelListing] = useState(false);
  const [confirmCancelSeat, setConfirmCancelSeat] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const listings = useQuery(api.listings.getActiveListings, {});
  const myListing = useQuery(api.listings.getMyActiveListing, { userId: userId! });
  const myBooking = useQuery(api.bookings.getMyBooking, { userId: userId! });
  const userProfile = useQuery(api.users.getUserProfile, { userId: userId! });
  const myRequest = useQuery(api.rideRequests.getMyActiveRequest, { riderId: userId! });
  const allRequests = useQuery(api.rideRequests.getActiveRequests, {});

  const cancelListingMut = useMutation(api.listings.cancelListing);
  const startRideMut = useMutation(api.listings.startRide);
  const endRideMut = useMutation(api.listings.endRide);
  const cancelBookingMut = useMutation(api.bookings.cancelBooking);
  const postRequestMut = useMutation(api.rideRequests.postRequest);
  const cancelRequestMut = useMutation(api.rideRequests.cancelRequest);

  const hasCarDetails =
    userProfile &&
    (userProfile.role === "giver" || userProfile.role === "both") &&
    !!userProfile.carName;

  const feedListings = (listings ?? []).filter((l) => l.driverId !== userId);
  const firstName = userProfile?.name?.split(" ")[0] ?? "there";

  const withAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setActionError(null);
    try { await fn(); } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong");
    } finally { setActionLoading(false); }
  };

  const handleCancelListing = () => withAction(async () => {
    await cancelListingMut({ listingId: myListing!._id, driverId: userId! });
    setConfirmCancelListing(false);
  });
  const handleStartRide = () => withAction(async () => {
    await startRideMut({ listingId: myListing!._id, driverId: userId! });
  });
  const handleEndRide = () => withAction(async () => {
    await endRideMut({ listingId: myListing!._id, driverId: userId! });
  });
  const handleCancelSeat = () => withAction(async () => {
    await cancelBookingMut({ bookingId: myBooking!._id, riderId: userId! });
    setConfirmCancelSeat(false);
  });
  const handleCancelRequest = () => withAction(async () => {
    await cancelRequestMut({ requestId: myRequest!._id, riderId: userId! });
  });

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { setActionError("Geolocation not supported"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setSearchFrom(result);
        } catch {
          setActionError("Could not determine your location");
        } finally { setLocating(false); }
      },
      () => { setActionError("Location access denied. Please allow location permission."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      <DrawerNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="pb-28 bg-gray-50 min-h-screen">

        {/* ── Top bar ── */}
        <div className="bg-white px-4 pt-4 pb-4 flex items-center justify-between">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-xl active:bg-gray-100"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-base font-bold text-gray-900">GC Carpool</span>
          <button
            onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center active:opacity-70"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </div>

        {/* ── Greeting ── */}
        <div className="bg-white px-4 pt-1 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Hey, {firstName}!</h1>
          <p className="text-sm text-gray-400 mt-1">What would you like to do today?</p>
        </div>

        {/* ── Category Tabs ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab("find")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "find"
                  ? "border-brand-700 text-brand-700"
                  : "border-transparent text-gray-400"
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
              </svg>
              Find Pool
            </button>
            <button
              onClick={() => setActiveTab("offer")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "offer"
                  ? "border-brand-700 text-brand-700"
                  : "border-transparent text-gray-400"
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Offer Pool
            </button>
          </div>
        </div>

        <div className="h-3" />

        {/* ── Error banner ── */}
        {actionError && (
          <div
            className="mx-4 mb-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 cursor-pointer"
            onClick={() => setActionError(null)}
          >
            {actionError}
          </div>
        )}

        {/* ══ FIND POOL TAB ══ */}
        {activeTab === "find" && (
          <>
            {/* ── Search / Request Card ── */}
            <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              {/* From */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1">
                  <LocationInput placeholder="From — pickup area…" value={searchFrom} onChange={setSearchFrom} />
                </div>
                <button
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  title="Use my location"
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 active:bg-blue-100 disabled:opacity-40"
                >
                  {locating ? (
                    <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Divider */}
              <div className="ml-[3.25rem] mr-4 border-t border-dashed border-gray-200" />
              {/* To */}
              <div className="flex items-center gap-3 px-4 pt-2 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <div className="flex-1">
                  <LocationInput placeholder="To — drop area…" value={searchTo} onChange={setSearchTo} />
                </div>
              </div>
              {/* Post Request button */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowPostReqSheet(true)}
                  disabled={!!myRequest}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold py-3 rounded-xl text-sm active:bg-purple-700 disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {myRequest ? "Request already posted" : "Post Ride Request"}
                </button>
              </div>
            </div>

            {/* ── My Request Banner ── */}
            {myRequest && (
              <div className="mb-4">
                <MyRequestBanner
                  request={myRequest}
                  onCancel={handleCancelRequest}
                  loading={actionLoading}
                />
              </div>
            )}

            {/* ── Rider Banner ── */}
            {myBooking && (
              <div className="mb-4">
                <RiderBanner
                  booking={myBooking}
                  onCancelSeat={() => setConfirmCancelSeat(true)}
                  loading={actionLoading}
                />
              </div>
            )}

            {/* ── Available Rides header ── */}
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="text-base font-bold text-gray-900">Available Rides</h2>
            </div>

            {/* ── Feed ── */}
            {listings === undefined ? (
              <div className="px-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse space-y-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-2/5" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-12 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : feedListings.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-gray-400">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="9" width="22" height="9" rx="2" />
                    <path d="M3 9l2-5h14l2 5" />
                    <circle cx="7.5" cy="18.5" r="1.5" />
                    <circle cx="16.5" cy="18.5" r="1.5" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-500">No rides available</p>
                <p className="text-xs mt-1 text-gray-400">Check back soon or post a request below</p>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                {feedListings.map((listing) => {
                  const pct = myRequest ? matchPercent(listing, myRequest) : undefined;
                  return (
                    <RideCard
                      key={listing._id}
                      listing={listing}
                      matchPct={pct}
                      onClick={() => navigate(`/listing/${listing._id}`)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══ OFFER POOL TAB ══ */}
        {activeTab === "offer" && (
          <>
            {/* Driver state: active listing / post prompt / no car */}
            {myListing ? (
              <div className="mb-4">
                <DriverBanner
                  listing={myListing}
                  onCancel={() => setConfirmCancelListing(true)}
                  onStart={handleStartRide}
                  onEnd={handleEndRide}
                  loading={actionLoading}
                />
              </div>
            ) : hasCarDetails ? (
              <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Where are you going?</p>
                  {/* From */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                    <div className="flex-1">
                      <LocationInput placeholder="From — your pickup…" value={offerFrom} onChange={setOfferFrom} />
                    </div>
                  </div>
                  <div className="ml-[1.375rem] border-l-2 border-dashed border-gray-200 h-3" />
                  {/* To */}
                  <div className="flex items-center gap-3 mt-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                    <div className="flex-1">
                      <LocationInput placeholder="To — destination…" value={offerTo} onChange={setOfferTo} />
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => navigate("/post-ride", { state: { from: offerFrom, to: offerTo } })}
                    disabled={!offerFrom || !offerTo}
                    className="w-full flex items-center justify-center gap-2 bg-brand-700 text-white font-semibold py-3 rounded-xl text-sm active:bg-brand-800 disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    Continue to Post Ride
                  </button>
                </div>
              </div>
            ) : (
              <div className="mx-4 mb-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Add your car details</h3>
                  <p className="text-sm text-gray-400 mb-5">To offer a ride, update your profile with your car information and set your role to Driver.</p>
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full bg-brand-700 text-white font-semibold py-3.5 rounded-xl text-sm active:bg-brand-800"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            )}

            {/* ── Riders Looking section ── */}
            <div className="mt-2">
              <div className="flex items-center justify-between px-4 mb-3">
                <h2 className="text-base font-bold text-gray-900">Riders Looking for a Ride</h2>
                {allRequests !== undefined && (
                  <span className="text-xs text-brand-600 font-semibold">
                    {allRequests.filter((r) => r.riderId !== userId).length} active
                  </span>
                )}
              </div>

              {allRequests === undefined ? (
                <div className="px-4 space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse space-y-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-2/5" />
                          <div className="h-3 bg-gray-100 rounded w-1/3" />
                        </div>
                      </div>
                      <div className="h-10 bg-gray-100 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : allRequests.filter((r) => r.riderId !== userId).length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                      <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No ride requests yet</p>
                  <p className="text-xs mt-1 text-gray-400">Riders will appear here when they post a request</p>
                </div>
              ) : (
                <div className="px-4 space-y-3">
                  {allRequests
                    .filter((r) => r.riderId !== userId)
                    .sort((a, b) => {
                      // Sort by match % descending if driver has listing
                      if (myListing) {
                        return matchPercent(myListing, b) - matchPercent(myListing, a);
                      }
                      return a.departureTime - b.departureTime;
                    })
                    .map((r) => (
                      <RideRequestCard
                        key={r._id}
                        request={r}
                        matchPct={myListing ? matchPercent(myListing, r) : 0}
                      />
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Post Request Sheet ── */}
      {showPostReqSheet && (
        <PostRequestSheet
          onClose={() => setShowPostReqSheet(false)}
          initialFrom={searchFrom}
          initialTo={searchTo}
          onSubmit={async (data) => {
            await postRequestMut({ riderId: userId!, ...data });
            setShowPostReqSheet(false);
          }}
        />
      )}

      {/* ── Confirm dialogs ── */}
      {confirmCancelListing && (
        <ConfirmDialog
          message="Cancel your ride? All confirmed riders will be notified."
          onConfirm={handleCancelListing}
          onCancel={() => setConfirmCancelListing(false)}
          loading={actionLoading}
        />
      )}
      {confirmCancelSeat && (
        <ConfirmDialog
          message="Cancel your seat? The driver will be notified."
          onConfirm={handleCancelSeat}
          onCancel={() => setConfirmCancelSeat(false)}
          loading={actionLoading}
        />
      )}
    </>
  );
}
