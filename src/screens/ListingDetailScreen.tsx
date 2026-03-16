import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-28">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

export default function ListingDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Live queries (real-time via Convex subscription) ──────────────────
  const listing = useQuery(api.listings.getListingById, {
    listingId: id as Id<"listings">,
  });
  const myBooking = useQuery(api.bookings.getMyBooking, { userId: userId! });

  const joinRide = useMutation(api.bookings.joinRide);

  // ── Derived state ──────────────────────────────────────────────────────
  const isFull = listing?.seatsLeft === 0 || listing?.status === "full";
  const isOwn = listing?.driverId === userId;
  const alreadyJoined = !!myBooking && myBooking.listingId === id;
  const isActiveRider = !!myBooking;
  const isCancelledOrEnded =
    listing?.status === "cancelled" ||
    listing?.status === "completed";

  const canJoin = !isFull && !isOwn && !isActiveRider && !alreadyJoined && !isCancelledOrEnded;

  const joinLabel = joined
    ? "Joined!"
    : isCancelledOrEnded
    ? listing?.status === "cancelled" ? "Ride Cancelled" : "Ride Ended"
    : isOwn
    ? "Your own ride"
    : alreadyJoined
    ? "Already joined"
    : isFull
    ? "Ride is Full"
    : isActiveRider
    ? "Already in a ride"
    : "Join Ride";

  // ── Handler ────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    setError(null);
    setJoining(true);
    try {
      await joinRide({
        listingId: id as Id<"listings">,
        riderId: userId!,
      });
      setJoined(true);
      // Brief success pause, then back to Home where the banner appears
      setTimeout(() => navigate("/home", { replace: true }), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join ride");
    } finally {
      setJoining(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (listing === undefined) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:bg-gray-100">
            <ChevronLeft />
          </button>
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="px-4 py-6 space-y-4 animate-pulse">
          <div className="h-24 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
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

  const driver = listing.driver;
  const filledSeats = listing.totalSeats - listing.seatsLeft;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl active:bg-gray-100"
          aria-label="Back"
        >
          <ChevronLeft />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Ride Details</h1>

        {/* Live status badge */}
        <div className="ml-auto">
          {isCancelledOrEnded ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              {listing.status === "cancelled" ? "Cancelled" : "Ended"}
            </span>
          ) : isFull ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
              Full
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              Open
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Driver card */}
        <div className="card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Driver
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-base shrink-0">
              {driver?.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{driver?.name ?? "—"}</p>
              {driver?.carName && (
                <p className="text-sm text-gray-500">
                  {driver.carName} · {driver.carColor}
                </p>
              )}
              {driver?.carNumber && (
                <p className="text-sm text-gray-400">
                  Plate ends ···{driver.carNumber.slice(-4)}
                </p>
              )}
            </div>
            {alreadyJoined && (
              <div className="shrink-0 flex gap-2">
                {/* Group Chat */}
                <button
                  onClick={() => navigate(`/ride-chat/${id}`)}
                  className="flex flex-col items-center gap-0.5 text-brand-700 active:opacity-70"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                      <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Group</span>
                </button>
                {/* 1-on-1 with driver */}
                {listing.driverId && (
                  <button
                    onClick={() => navigate(`/dm/${id}/${listing.driverId}`)}
                    className="flex flex-col items-center gap-0.5 text-brand-700 active:opacity-70"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">Driver</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ride details */}
        <div className="card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Ride Info
          </p>
          <DetailRow
            label="Direction"
            value={listing.direction === "GC_TO_HCL" ? "Gaur City → HCL" : "HCL → Gaur City"}
          />
          <DetailRow label="Departure" value={new Date(listing.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })} />
          <DetailRow
            label="Seats"
            value={`${filledSeats} filled · ${listing.seatsLeft} left of ${listing.totalSeats}`}
          />
          {listing.pickupPoint && (
            <DetailRow label="Pickup" value={listing.pickupPoint} />
          )}
          {listing.note && (
            <DetailRow label="Note" value={listing.note} />
          )}
        </div>

        {/* Seats visual */}
        <div className="card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Seats
          </p>
          <div className="flex gap-2">
            {Array.from({ length: listing.totalSeats }).map((_, i) => {
              const filled = i < filledSeats;
              return (
                <div
                  key={i}
                  className={`flex-1 h-10 rounded-xl flex items-center justify-center text-xs font-semibold transition-colors ${
                    filled
                      ? "bg-brand-700 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {filled ? "Taken" : "Free"}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {/* Join button — sticky at bottom */}
      <div
        className="px-4 py-4 border-t border-gray-100 bg-white"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={handleJoin}
          disabled={!canJoin || joining || joined}
          className={`w-full font-semibold py-3 px-4 rounded-xl transition-all ${
            joined
              ? "bg-green-600 text-white"
              : canJoin
              ? "bg-brand-700 text-white active:bg-brand-800"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {joining ? "Joining…" : joinLabel}
        </button>

      </div>
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
