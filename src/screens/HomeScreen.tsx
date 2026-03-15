import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

type Direction = "GC_TO_HCL" | "HCL_TO_GC";

function formatDeparture(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getDefaultDirection(): Direction {
  return new Date().getHours() < 12 ? "GC_TO_HCL" : "HCL_TO_GC";
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

// ── Driver Banner (blue card) ─────────────────────────────────────────────

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
  const dir = listing.direction === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC";

  return (
    <div
      className="mx-4 rounded-2xl bg-brand-700 p-4 cursor-pointer active:opacity-90"
      onClick={() => navigate("/my-listing")}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">
            Active Driver Listing
          </p>
          <p className="text-2xl font-bold text-white">{dir}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-white">{formatDeparture(listing.departureTime)}</p>
          <p className="text-xs text-blue-200">Today</p>
        </div>
      </div>

      {/* Seats row */}
      <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-4">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
          <circle cx="17" cy="7" r="3" />
          <path d="M21 21v-2a4 4 0 00-3-3.87" />
        </svg>
        <span className="text-sm font-medium text-white">
          {started ? "Ride in progress" : `${filled} of ${listing.totalSeats} seats filled`}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
        {started ? (
          <>
            <span className="flex-1 text-center text-sm font-semibold text-white bg-white/20 py-2.5 rounded-xl">
              On the way
            </span>
            <button
              onClick={onEnd}
              disabled={loading}
              className="flex-1 bg-white text-brand-700 font-semibold py-2.5 rounded-xl text-sm active:opacity-80 disabled:opacity-50"
            >
              End Ride
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onStart}
              disabled={loading}
              className="flex-1 bg-white text-brand-700 font-semibold py-2.5 rounded-xl text-sm active:opacity-80 disabled:opacity-50"
            >
              Start Ride
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 border-2 border-white text-white font-semibold py-2.5 rounded-xl text-sm active:bg-white/10 disabled:opacity-50"
            >
              Cancel Ride
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Rider Banner (blue card, green accent) ────────────────────────────────

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
  const dir = listing.direction === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC";

  return (
    <div className="mx-4 rounded-2xl bg-green-600 p-4">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-green-200 uppercase tracking-widest mb-1">
            My Ride · Rider
          </p>
          <p className="text-2xl font-bold text-white">{dir}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-white">{formatDeparture(listing.departureTime)}</p>
          <p className="text-xs text-green-200">Today</p>
        </div>
      </div>

      {/* Driver info */}
      <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 mb-4">
        <div>
          <p className="text-sm font-semibold text-white">{driver?.name ?? "Driver"}</p>
          {driver?.carName && (
            <p className="text-xs text-green-100">{driver.carName}{driver.carColor ? ` · ${driver.carColor}` : ""}</p>
          )}
        </div>
        {driver?.mobile && (
          <a
            href={`tel:+91${driver.mobile}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-white text-sm font-semibold active:opacity-70"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            +91 {driver.mobile}
          </a>
        )}
      </div>

      {/* Action */}
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

// ── Main Screen ───────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [direction, setDirection] = useState<Direction>(getDefaultDirection);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancelListing, setConfirmCancelListing] = useState(false);
  const [confirmCancelSeat, setConfirmCancelSeat] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const listings = useQuery(api.listings.getActiveListings, { direction });
  const myListing = useQuery(api.listings.getMyActiveListing, { userId: userId! });
  const myBooking = useQuery(api.bookings.getMyBooking, { userId: userId! });
  const userProfile = useQuery(api.users.getUserProfile, { userId: userId! });

  const cancelListingMut = useMutation(api.listings.cancelListing);
  const startRideMut = useMutation(api.listings.startRide);
  const endRideMut = useMutation(api.listings.endRide);
  const cancelBookingMut = useMutation(api.bookings.cancelBooking);

  const hasCarDetails =
    userProfile &&
    (userProfile.role === "giver" || userProfile.role === "both") &&
    !!userProfile.carName;

  const isActiveDriver = !!myListing;
  const isActiveRider = !!myBooking;

  const feedListings = (listings ?? []).filter((l) => l.driverId !== userId);

  const firstName = userProfile?.name?.split(" ")[0] ?? "there";

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

  return (
    <>
      <div className="pb-24 bg-white min-h-screen">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 pt-12 pb-2">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span className="text-base font-bold text-gray-900">GC Carpool</span>
          <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center active:opacity-70">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-brand-700" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </div>

        {/* ── Greeting ── */}
        <div className="px-4 pt-3 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Where to, {firstName}?</h1>
          <p className="text-sm text-gray-500 mt-0.5">Check your current ride or browse for a lift.</p>
        </div>

        {/* ── Error banner ── */}
        {actionError && (
          <div
            className="mx-4 mb-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 cursor-pointer"
            onClick={() => setActionError(null)}
          >
            {actionError}
          </div>
        )}

        {/* ── My Ride Banners ── */}
        {(myListing || myBooking) && (
          <div className="space-y-3 mb-4">
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

        {/* ── Direction tabs ── */}
        <div className="px-4 mb-4">
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

        {/* ── Available Rides header ── */}
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-base font-bold text-gray-900">Available Rides</h2>
          <span className="text-sm font-semibold text-brand-600">
            {direction === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC"}
          </span>
        </div>

        {/* ── Feed ── */}
        {listings === undefined ? (
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
            <p className="text-xs mt-1 text-gray-400">Check back soon</p>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {feedListings.map((listing) => {
              const alreadyJoined = !!myBooking && myBooking.listingId === listing._id;
              const isFull = listing.seatsLeft === 0 || listing.status === "full";
              const disableJoin = isFull || isActiveRider;
              const joinLabel = alreadyJoined
                ? "Joined"
                : isFull
                ? "Full"
                : isActiveRider
                ? "In a ride"
                : "Join";

              return (
                <div
                  key={listing._id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm cursor-pointer active:bg-gray-50"
                  onClick={() => navigate(`/listing/${listing._id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{listing.driver?.name ?? "—"}</p>
                      {listing.driver?.carName && (
                        <p className="text-sm text-gray-400 mt-0.5">
                          {listing.driver.carName}
                          {listing.driver.carColor ? ` · ${listing.driver.carColor}` : ""}
                        </p>
                      )}
                      {listing.pickupPoint && (
                        <p className="text-xs text-gray-400 mt-0.5">Pickup: {listing.pickupPoint}</p>
                      )}
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <p className="text-base font-bold text-gray-900">{formatDeparture(listing.departureTime)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">₹{listing.fare}/seat</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      listing.seatsLeft === 0
                        ? "bg-red-100 text-red-600"
                        : listing.seatsLeft === 1
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {listing.seatsLeft === 0 ? "Full" : `${listing.seatsLeft} of ${listing.totalSeats} seats left`}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!disableJoin) navigate(`/listing/${listing._id}`);
                      }}
                      disabled={disableJoin}
                      className={`text-sm font-semibold px-5 py-1.5 rounded-xl transition-colors ${
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
            })}
          </div>
        )}
      </div>

      {/* ── Offer a Ride FAB ── */}
      {hasCarDetails && !isActiveDriver && (
        <button
          onClick={() => navigate("/post-ride")}
          className="fixed bottom-20 right-4 bg-brand-700 text-white font-semibold text-sm px-5 py-3.5 rounded-full shadow-lg active:bg-brand-800 z-30 flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Offer a Ride
        </button>
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
