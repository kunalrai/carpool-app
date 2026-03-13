import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

type Direction = "GC_TO_HCL" | "HCL_TO_GC";

function formatDeparture(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (isToday) return time;
  return `${time}, ${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`;
}

function getDefaultDirection(): Direction {
  return new Date().getHours() < 12 ? "GC_TO_HCL" : "HCL_TO_GC";
}

// ── Shared sub-components ─────────────────────────────────────────────────

function SeatsBadge({ seatsLeft, totalSeats }: { seatsLeft: number; totalSeats: number }) {
  const cls =
    seatsLeft === 0
      ? "bg-red-100 text-red-700"
      : seatsLeft === 1
      ? "bg-amber-100 text-amber-700"
      : "bg-green-100 text-green-700";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {seatsLeft === 0 ? "Full" : `${seatsLeft} of ${totalSeats} left`}
    </span>
  );
}

function DirectionPill({ direction }: { direction: Direction }) {
  return (
    <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
      {direction === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC"}
    </span>
  );
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/40">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up shadow-xl">
        <p className="text-gray-800 font-medium text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-secondary">
            Keep it
          </button>
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

// ── Driver My Ride Banner ─────────────────────────────────────────────────

type MyListing = NonNullable<
  ReturnType<typeof useQuery<typeof api.listings.getMyActiveListing>>
>;

function DriverBanner({
  listing,
  onCancel,
  onStart,
  onEnd,
  loading,
}: {
  listing: MyListing;
  onCancel: () => void;
  onStart: () => void;
  onEnd: () => void;
  loading: boolean;
}) {
  const navigate = useNavigate();
  const filled = listing.totalSeats - listing.seatsLeft;
  const started = listing.status === "started";

  return (
    <div
      className="mx-4 mb-2 card border-l-4 border-l-brand-600 cursor-pointer active:bg-gray-50"
      onClick={() => navigate("/my-listing")}
    >
      <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-2">
        My Ride · Driver
      </p>
      <div className="flex items-center justify-between">
        <DirectionPill direction={listing.direction as Direction} />
        <span className="text-sm font-semibold text-gray-800">{formatDeparture(listing.departureTime)}</span>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        {started ? "Ride in progress" : `${filled} of ${listing.totalSeats} seats filled`}
      </p>
      {listing.pickupPoint && (
        <p className="text-xs text-gray-500 mt-0.5">Pickup: {listing.pickupPoint}</p>
      )}

      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
        {started ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl">
              On the way
            </span>
            <button
              onClick={onEnd}
              disabled={loading}
              className="ml-auto border border-gray-400 text-gray-600 font-semibold py-1.5 px-4 rounded-xl text-sm active:bg-gray-100 disabled:opacity-50"
            >
              End Ride
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 border border-red-500 text-red-600 font-semibold py-2 rounded-xl text-sm active:bg-red-50 disabled:opacity-50"
            >
              Cancel Ride
            </button>
            <button
              onClick={onStart}
              disabled={loading}
              className="flex-1 bg-green-600 text-white font-semibold py-2 rounded-xl text-sm active:bg-green-700 disabled:opacity-50"
            >
              Start Ride
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rider My Ride Banner ──────────────────────────────────────────────────

type MyBooking = NonNullable<
  ReturnType<typeof useQuery<typeof api.bookings.getMyBooking>>
>;

function RiderBanner({
  booking,
  onCancelSeat,
  loading,
}: {
  booking: MyBooking;
  onCancelSeat: () => void;
  loading: boolean;
}) {
  const { listing } = booking;
  const driver = listing.driver;
  const started = listing.status === "started";

  return (
    <div className="mx-4 mb-2 card border-l-4 border-l-green-500">
      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
        My Ride · Rider
      </p>
      <div className="flex items-center justify-between">
        <DirectionPill direction={listing.direction as Direction} />
        <span className="text-sm font-semibold text-gray-800">{formatDeparture(listing.departureTime)}</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-sm font-medium text-gray-800">{driver?.name ?? "Driver"}</p>
        {driver?.mobile && (
          <a
            href={`tel:+91${driver.mobile}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-brand-700 text-sm font-semibold active:opacity-70"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            +91 {driver.mobile}
          </a>
        )}
      </div>
      {driver?.carName && (
        <p className="text-sm text-gray-500">
          {driver.carName} · {driver.carColor}
          {driver.carNumber ? ` · ···${driver.carNumber.slice(-4)}` : ""}
        </p>
      )}
      {listing.pickupPoint && (
        <p className="text-xs text-gray-500 mt-0.5">Pickup: {listing.pickupPoint}</p>
      )}

      <div className="mt-3">
        {started ? (
          <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl">
            Ride started — be at pickup!
          </span>
        ) : (
          <button
            onClick={onCancelSeat}
            disabled={loading}
            className="border border-red-500 text-red-600 font-semibold py-2 px-4 rounded-xl text-sm active:bg-red-50 disabled:opacity-50"
          >
            Cancel Seat
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [direction, setDirection] = useState<Direction>(getDefaultDirection);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancelListing, setConfirmCancelListing] = useState(false);
  const [confirmCancelSeat, setConfirmCancelSeat] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const listings = useQuery(api.listings.getActiveListings, { direction });
  const myListing = useQuery(api.listings.getMyActiveListing, { userId: userId! });
  const myBooking = useQuery(api.bookings.getMyBooking, { userId: userId! });
  const userProfile = useQuery(api.users.getUserProfile, { userId: userId! });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const cancelListingMut = useMutation(api.listings.cancelListing);
  const startRideMut = useMutation(api.listings.startRide);
  const endRideMut = useMutation(api.listings.endRide);
  const cancelBookingMut = useMutation(api.bookings.cancelBooking);

  // ── Derived state ─────────────────────────────────────────────────────────
  const hasCarDetails =
    userProfile &&
    (userProfile.role === "giver" || userProfile.role === "both") &&
    !!userProfile.carName;

  const isActiveDriver = !!myListing;
  const isActiveRider = !!myBooking;

  // Exclude user's own listing from the feed
  const feedListings = (listings ?? []).filter((l) => l.driverId !== userId);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const withAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelListing = () =>
    withAction(async () => {
      await cancelListingMut({ listingId: myListing!._id, driverId: userId! });
      setConfirmCancelListing(false);
    });

  const handleStartRide = () =>
    withAction(async () => {
      await startRideMut({ listingId: myListing!._id, driverId: userId! });
    });

  const handleEndRide = () =>
    withAction(async () => {
      await endRideMut({ listingId: myListing!._id, driverId: userId! });
    });

  const handleCancelSeat = () =>
    withAction(async () => {
      await cancelBookingMut({ bookingId: myBooking!._id, riderId: userId! });
      setConfirmCancelSeat(false);
    });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="pb-20">
        {/* App header */}
        <div className="bg-brand-700 px-4 pt-12 pb-4 text-white">
          <h1 className="text-lg font-bold">GaurCity-HCL Carpool</h1>
          <p className="text-brand-200 text-xs">₹80 fixed fare · Gaur City ↔ HCL</p>
        </div>

        {/* Error banner */}
        {actionError && (
          <div
            className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 cursor-pointer"
            onClick={() => setActionError(null)}
          >
            {actionError}
          </div>
        )}

        {/* My Ride Banners — both shown simultaneously for dual-role users */}
        {(myListing || myBooking) && (
          <div className="mt-4 space-y-2">
            {myListing && (
              <DriverBanner
                listing={myListing}
                onCancel={() => setConfirmCancelListing(true)}
                onStart={handleStartRide}
                onEnd={handleEndRide}
                loading={actionLoading}
              />
            )}
            {myBooking && (
              <RiderBanner
                booking={myBooking}
                onCancelSeat={() => setConfirmCancelSeat(true)}
                loading={actionLoading}
              />
            )}
          </div>
        )}

        {/* Direction filter */}
        <div className="px-4 mt-4 mb-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(["GC_TO_HCL", "HCL_TO_GC"] as Direction[]).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  direction === d
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                {d === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC"}
              </button>
            ))}
          </div>
        </div>

        {/* Listings feed */}
        {listings === undefined ? (
          // Loading skeleton
          <div className="px-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/5" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : feedListings.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <svg viewBox="0 0 24 24" className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M3 10h18M3 14h18M10 3L9 21M14 3l-1 18" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium">No rides available</p>
            <p className="text-xs mt-1">
              {direction === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC"} · check back soon
            </p>
          </div>
        ) : (
          feedListings.map((listing) => {
            const alreadyJoined = !!myBooking && myBooking.listingId === listing._id;
            const isFull = listing.seatsLeft === 0 || listing.status === "full";
            const disableJoin = isFull || isActiveRider;
            const joinLabel = alreadyJoined
              ? "Joined"
              : isFull
              ? "Full"
              : isActiveRider
              ? "In a ride"
              : "Join Ride";

            return (
              <div
                key={listing._id}
                className="mx-4 mb-3 card cursor-pointer active:bg-gray-50"
                onClick={() => navigate(`/listing/${listing._id}`)}
              >
                {/* Driver + time */}
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {listing.driver?.name ?? "—"}
                    </p>
                    {listing.driver?.carName && (
                      <p className="text-sm text-gray-500">
                        {listing.driver.carName}
                        {listing.driver.carColor ? ` · ${listing.driver.carColor}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 shrink-0 ml-2">
                    {formatDeparture(listing.departureTime)}
                  </span>
                </div>

                {listing.pickupPoint && (
                  <p className="text-xs text-gray-500 mb-1">
                    Pickup: {listing.pickupPoint}
                  </p>
                )}
                {listing.note && (
                  <p className="text-xs text-gray-400 italic mb-1">
                    "{listing.note}"
                  </p>
                )}

                {/* Footer row: seats badge + fare + join button */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <SeatsBadge
                      seatsLeft={listing.seatsLeft}
                      totalSeats={listing.totalSeats}
                    />
                    <span className="text-xs text-gray-500">₹{listing.fare}/seat</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!disableJoin) navigate(`/listing/${listing._id}`);
                    }}
                    disabled={disableJoin}
                    className={`text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors ${
                      disableJoin
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-brand-700 text-white active:bg-brand-800"
                    }`}
                  >
                    {joinLabel}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB — only for drivers with car details who aren't currently driving */}
      {hasCarDetails && !isActiveDriver && (
        <button
          onClick={() => navigate("/post-ride")}
          className="fixed bottom-20 right-4 bg-brand-700 text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg active:bg-brand-800 z-30 flex items-center gap-1.5"
        >
          <span className="text-lg leading-none font-light">+</span>
          Offer a Ride
        </button>
      )}

      {/* Confirmation dialogs */}
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
