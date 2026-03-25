import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <span className="text-sm shrink-0 w-28" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: "rgba(255,255,255,0.9)" }}>{value}</span>
    </div>
  );
}

export default function ListingDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listing = useQuery(api.listings.getListingById, {
    listingId: id as Id<"listings">,
  });
  const myBooking = useQuery(api.bookings.getMyBooking, { userId: userId! });
  const myBookingForListing = useQuery(api.bookings.getMyBookingForListing, {
    userId: userId!,
    listingId: id as Id<"listings">,
  });

  const joinRide = useMutation(api.bookings.joinRide);
  const checkInMut = useMutation(api.bookings.checkIn);
  const checkOutMut = useMutation(api.bookings.checkOut);

  const isFull = listing?.seatsLeft === 0 || listing?.status === "full";
  const isOwn = listing?.driverId === userId;
  const isStarted = listing?.status === "started";
  const alreadyJoined = !!myBooking && myBooking.listingId === id;
  const isActiveRider = !!myBooking;
  const isCancelledOrEnded = listing?.status === "cancelled" || listing?.status === "completed";

  const hasBookingHere = !!myBookingForListing && myBookingForListing.status !== "cancelled";
  const checkedIn = myBookingForListing?.checkedIn === true;
  const checkedOut = myBookingForListing?.checkedOut === true;

  const canJoin = !isFull && !isOwn && !isActiveRider && !alreadyJoined && !isCancelledOrEnded && !isStarted;

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

  const handleCheckIn = async () => {
    if (!myBookingForListing) return;
    setCheckingIn(true);
    setError(null);
    try {
      await checkInMut({ bookingId: myBookingForListing._id, riderId: userId! });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!myBookingForListing) return;
    setCheckingOut(true);
    setError(null);
    try {
      await checkOutMut({ bookingId: myBookingForListing._id, riderId: userId! });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-out failed");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleJoin = async () => {
    setError(null);
    setJoining(true);
    try {
      await joinRide({ listingId: id as Id<"listings">, riderId: userId! });
      setJoined(true);
      setTimeout(() => navigate("/home", { replace: true }), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join ride");
    } finally {
      setJoining(false);
    }
  };

  if (listing === undefined) {
    return (
      <div className="min-h-screen" style={{ background: "#0f172a" }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(99,102,241,0.2)" }}>
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl" style={{ color: "rgba(255,255,255,0.7)" }}>
            <ChevronLeft />
          </button>
          <div className="h-5 rounded w-32 animate-pulse" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>
        <div className="px-4 py-6 space-y-4 animate-pulse">
          <div className="h-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="h-48 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "#0f172a" }}>
        <p className="font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Ride not found</p>
        <button onClick={() => navigate("/home")} className="text-sm font-semibold" style={{ color: "#818cf8" }}>
          Back to Home
        </button>
      </div>
    );
  }

  const driver = listing.driver;
  const filledSeats = listing.totalSeats - listing.seatsLeft;

  const statusBadge = isCancelledOrEnded ? (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
      {listing.status === "cancelled" ? "Cancelled" : "Ended"}
    </span>
  ) : isFull ? (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>Full</span>
  ) : (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.2)", color: "#86efac" }}>Open</span>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0f172a" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-12 pb-4 shrink-0"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
          borderBottom: "1px solid rgba(99,102,241,0.3)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl"
          style={{ color: "rgba(255,255,255,0.8)" }}
          aria-label="Back"
        >
          <ChevronLeft />
        </button>
        <h1 className="text-lg font-bold text-white">Ride Details</h1>
        <div className="ml-auto">{statusBadge}</div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-32">

        {/* Driver card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "1rem",
            borderTop: "2px solid #6366f1",
            padding: "1rem",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Driver
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}
            >
              {driver?.name
                .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{driver?.name ?? "—"}</p>
              {driver?.carName && (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {driver.carName} · {driver.carColor}
                </p>
              )}
              {driver?.carNumber && (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Plate ends ···{driver.carNumber.slice(-4)}
                </p>
              )}
            </div>
            {alreadyJoined && (
              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => navigate(`/ride-chat/${id}`)}
                  className="flex flex-col items-center gap-0.5 active:opacity-70"
                  style={{ color: "#818cf8" }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                      <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Group</span>
                </button>
                {listing.driverId && (
                  <button
                    onClick={() => navigate(`/dm/${id}/${listing.driverId}`)}
                    className="flex flex-col items-center gap-0.5 active:opacity-70"
                    style={{ color: "#818cf8" }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
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
        </motion.div>

        {/* Ride details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "1rem",
            borderTop: "2px solid #a78bfa",
            padding: "1rem",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Ride Info
          </p>
          <DetailRow label="From" value={listing.fromLabel} />
          <DetailRow label="To" value={listing.toLabel} />
          <DetailRow label="Fare" value={`₹${listing.fare} per seat`} />
          <DetailRow
            label="Departure"
            value={new Date(listing.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
          />
          <DetailRow
            label="Seats"
            value={`${filledSeats} filled · ${listing.seatsLeft} left of ${listing.totalSeats}`}
          />
          {listing.pickupPoint && <DetailRow label="Pickup" value={listing.pickupPoint} />}
          {listing.note && <DetailRow label="Note" value={listing.note} />}
        </motion.div>

        {/* Seats visual */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "1rem",
            borderTop: "2px solid #60a5fa",
            padding: "1rem",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Seats
          </p>
          <div className="flex gap-2">
            {Array.from({ length: listing.totalSeats }).map((_, i) => {
              const filled = i < filledSeats;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex-1 h-10 rounded-xl flex items-center justify-center text-xs font-semibold"
                  style={
                    filled
                      ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }
                      : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }
                  }
                >
                  {filled ? "Taken" : "Free"}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm rounded-xl px-4 py-3"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-4"
        style={{
          background: "rgba(15,23,42,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(99,102,241,0.2)",
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        {isStarted && hasBookingHere && !isOwn ? (
          <div className="space-y-3">
            {checkedOut ? (
              <div className="w-full rounded-xl py-3 px-4 flex items-center justify-center gap-2"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ color: "#86efac" }} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="font-semibold text-sm" style={{ color: "#86efac" }}>Ride Complete — Checked Out</span>
              </div>
            ) : checkedIn ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="w-full text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                {checkingOut ? "Checking Out…" : "Check Out"}
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
              >
                {checkingIn ? "Checking In…" : "Check In"}
              </motion.button>
            )}
            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {checkedOut ? "Thank you for riding!" : checkedIn ? "Tap when you've reached your destination" : "Tap when you board the vehicle"}
            </p>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: canJoin ? 0.97 : 1 }}
            onClick={handleJoin}
            disabled={!canJoin || joining || joined}
            className="w-full font-bold py-3 px-4 rounded-xl transition-all"
            style={
              joined
                ? { background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white" }
                : canJoin
                ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }
                : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" }
            }
          >
            {joining ? "Joining…" : joinLabel}
          </motion.button>
        )}
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
