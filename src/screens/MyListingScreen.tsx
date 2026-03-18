import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  // ── Header (shared) ───────────────────────────────────────────────────────
  const Header = () => (
    <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white">
      <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <span className="text-base font-bold text-gray-900">My Ride</span>
      <button onClick={() => navigate("/profile")} className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center active:opacity-70">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (listing === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="px-4 py-4 space-y-4 animate-pulse">
          <div className="h-52 bg-brand-700/30 rounded-3xl" />
          <div className="h-32 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── No active listing ─────────────────────────────────────────────────────
  if (!listing) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <div className="flex-1 px-4 py-6 space-y-4">
            <div className="text-center py-8 text-gray-500">
              <p className="font-medium">No active ride</p>
              <button onClick={() => navigate("/home")} className="text-brand-700 text-sm font-semibold mt-2">
                Back to Home
              </button>
            </div>

            {templates !== undefined && templates.length > 0 && (
              <div className="card">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recurring Schedules</p>
                <div className="space-y-3">
                  {templates.map((t) => (
                    <div key={t._id} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{t.fromLabel} → {t.toLabel} · {t.departureTimeHHMM}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t.totalSeats} seat{t.totalSeats > 1 ? "s" : ""}{t.pickupPoint ? ` · ${t.pickupPoint}` : ""}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {t.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {DAY_LABELS.map((label, idx) => (
                          <span key={idx} className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center ${t.daysOfWeek.includes(idx) ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-300"}`}>
                            {label}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={templateActionId === t._id}
                          onClick={async () => {
                            setTemplateActionId(t._id);
                            try { await toggleTemplate({ templateId: t._id as Id<"recurringTemplates">, userId: userId!, isActive: !t.isActive }); }
                            finally { setTemplateActionId(null); }
                          }}
                          className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg border border-gray-200 text-gray-700 active:bg-gray-50 disabled:opacity-50"
                        >
                          {templateActionId === t._id ? "…" : t.isActive ? "Pause" : "Resume"}
                        </button>
                        <button disabled={templateActionId === t._id} onClick={() => setConfirmDeleteId(t._id)} className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg border border-red-200 text-red-600 active:bg-red-50 disabled:opacity-50">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/40">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up shadow-xl">
              <p className="text-gray-800 font-medium text-center mb-6">Delete this recurring schedule? Future auto-posts will stop.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} disabled={templateActionId === confirmDeleteId} className="btn-secondary">Keep it</button>
                <button
                  disabled={templateActionId === confirmDeleteId}
                  onClick={async () => {
                    setTemplateActionId(confirmDeleteId);
                    try { await deleteTemplate({ templateId: confirmDeleteId as Id<"recurringTemplates">, userId: userId! }); setConfirmDeleteId(null); }
                    finally { setTemplateActionId(null); }
                  }}
                  className="flex-1 bg-red-600 text-white font-semibold py-3 px-4 rounded-xl active:bg-red-700 disabled:opacity-50"
                >
                  {templateActionId === confirmDeleteId ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Active listing view ───────────────────────────────────────────────────
  const filledSeats = listing.totalSeats - listing.seatsLeft;
  const isStarted = listing.status === "started";
  const isOpen = listing.status === "open" || listing.status === "full";
  const departureStr = new Date(listing.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex-1 overflow-y-auto pb-40 space-y-4 px-4 pt-2">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
              {error}
            </div>
          )}

          {/* ── Blue info card ── */}
          <div className="bg-brand-700 rounded-3xl p-5">
            {/* Top row */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">
                Active Driver Listing
              </span>
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                  <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
                </svg>
                <span className="text-xs font-semibold text-white">
                  {filledSeats} of {listing.totalSeats} seats filled
                </span>
              </div>
            </div>

            {/* Route timeline */}
            <div className="flex gap-4 mb-5">
              <div className="flex flex-col items-center pt-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-white" />
                <div className="w-px flex-1 bg-white/30 my-1.5" style={{ minHeight: 32 }} />
                <div className="w-3 h-3 rounded-full border-2 border-white bg-transparent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-0.5">Pickup</p>
                  <p className="text-lg font-bold text-white leading-tight">{listing.fromLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-0.5">Drop-off</p>
                  <p className="text-lg font-bold text-white leading-tight">{listing.toLabel}</p>
                </div>
              </div>
            </div>

            {/* Bottom info row */}
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-0.5">Departure</p>
                <p className="text-xl font-bold text-white tabular-nums">{departureStr}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-0.5">Earnings</p>
                <p className="text-base font-bold text-white">₹{listing.fare}/seat</p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-1.5 bg-green-500 rounded-full px-3 py-1.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-xs font-bold text-white">VERIFIED RIDE</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Passengers ── */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Passengers</h2>

            {riders === undefined ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : riders.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400">
                <p className="text-sm font-medium">No passengers yet</p>
                <p className="text-xs mt-1">Your ride will appear in the feed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {riders.map((booking) => {
                  const name = booking.rider?.name ?? "Rider";
                  const initials = avatarInitials(name);
                  const color = avatarColor(name);
                  return (
                    <div key={booking._id} className="bg-white rounded-2xl p-4 flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-sm font-bold">{initials}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{name}</p>
                        {isStarted && (
                          <p className={`text-xs font-semibold mt-0.5 ${
                            booking.checkedOut ? "text-green-600" : booking.checkedIn ? "text-blue-600" : "text-gray-400"
                          }`}>
                            {booking.checkedOut ? "✓ Checked out" : booking.checkedIn ? "✓ Checked in" : "Awaiting check-in"}
                          </p>
                        )}
                        {!isStarted && listing.pickupPoint && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <svg viewBox="0 0 24 24" className="w-3 h-3 text-gray-400 shrink-0" fill="currentColor">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <span className="text-xs text-gray-400 truncate">{listing.pickupPoint}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => navigate(`/dm/${listing._id}/${booking.riderId}`)}
                          className="flex items-center gap-1.5 bg-brand-700 text-white text-xs font-bold px-3 py-2 rounded-xl active:bg-brand-800"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                          Chat
                        </button>
                        <button
                          onClick={() => navigate(`/ride-chat/${listing._id}`)}
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-50"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Group chat link */}
                {riders.length > 1 && (
                  <button
                    onClick={() => navigate(`/ride-chat/${listing._id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-brand-200 text-brand-700 text-sm font-semibold py-3 rounded-2xl active:bg-brand-50"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                      <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
                    </svg>
                    Group Chat
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Map placeholder ── */}
          <div className="rounded-2xl overflow-hidden h-32 bg-green-50 border border-green-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-green-400">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              <span className="text-xs font-medium">Route Map</span>
            </div>
          </div>

          {/* ── Recurring schedules ── */}
          {templates !== undefined && templates.length > 0 && (
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recurring Schedules</p>
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t._id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t.fromLabel} → {t.toLabel} · {t.departureTimeHHMM}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.totalSeats} seat{t.totalSeats > 1 ? "s" : ""}{t.pickupPoint ? ` · ${t.pickupPoint}` : ""}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {t.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {DAY_LABELS.map((label, idx) => (
                        <span key={idx} className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center ${t.daysOfWeek.includes(idx) ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-300"}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={templateActionId === t._id}
                        onClick={async () => {
                          setTemplateActionId(t._id);
                          try { await toggleTemplate({ templateId: t._id as Id<"recurringTemplates">, userId: userId!, isActive: !t.isActive }); }
                          finally { setTemplateActionId(null); }
                        }}
                        className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg border border-gray-200 text-gray-700 active:bg-gray-50 disabled:opacity-50"
                      >
                        {templateActionId === t._id ? "…" : t.isActive ? "Pause" : "Resume"}
                      </button>
                      <button disabled={templateActionId === t._id} onClick={() => setConfirmDeleteId(t._id)} className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg border border-red-200 text-red-600 active:bg-red-50 disabled:opacity-50">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Sticky action buttons ── */}
        {(isOpen || isStarted) && (
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-4 bg-white/90 backdrop-blur border-t border-gray-100 space-y-3"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            {isStarted ? (
              <button
                onClick={handleEnd}
                disabled={actionLoading}
                className="w-full bg-brand-700 text-white font-bold py-4 rounded-2xl text-base active:bg-brand-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                {actionLoading ? "Ending…" : "End Ride"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="w-full bg-brand-700 text-white font-bold py-4 rounded-2xl text-base active:bg-brand-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  {actionLoading ? "Starting…" : "Start Ride"}
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  disabled={actionLoading}
                  className="w-full border-2 border-brand-700 text-brand-700 font-bold py-4 rounded-2xl text-base active:bg-brand-50 disabled:opacity-50"
                >
                  Cancel Ride
                </button>
              </>
            )}
          </div>
        )}
      </div>

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

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/40">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up shadow-xl">
            <p className="text-gray-800 font-medium text-center mb-6">Delete this recurring schedule? Future auto-posts will stop.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} disabled={templateActionId === confirmDeleteId} className="btn-secondary">Keep it</button>
              <button
                disabled={templateActionId === confirmDeleteId}
                onClick={async () => {
                  setTemplateActionId(confirmDeleteId);
                  try { await deleteTemplate({ templateId: confirmDeleteId as Id<"recurringTemplates">, userId: userId! }); setConfirmDeleteId(null); }
                  finally { setTemplateActionId(null); }
                }}
                className="flex-1 bg-red-600 text-white font-semibold py-3 px-4 rounded-xl active:bg-red-700 disabled:opacity-50"
              >
                {templateActionId === confirmDeleteId ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
