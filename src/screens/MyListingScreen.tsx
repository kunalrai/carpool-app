import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-28">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
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

export default function MyListingScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Live queries ─────────────────────────────────────────────────────────
  const listing = useQuery(api.listings.getMyActiveListing, { userId: userId! });
  const riders = useQuery(
    api.listings.getListingRiders,
    listing ? { listingId: listing._id } : "skip"
  );

  // ── Recurring templates ───────────────────────────────────────────────────
  const templates = useQuery(api.recurring.listMyTemplates, { userId: userId! });
  const toggleTemplate = useMutation(api.recurring.toggleTemplate);
  const deleteTemplate = useMutation(api.recurring.deleteTemplate);
  const [templateActionId, setTemplateActionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const startRideMut = useMutation(api.listings.startRide);
  const cancelListingMut = useMutation(api.listings.cancelListing);
  const endRideMut = useMutation(api.listings.endRide);

  const withAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = () =>
    withAction(async () => {
      await startRideMut({ listingId: listing!._id, driverId: userId! });
    });

  const handleCancel = () =>
    withAction(async () => {
      await cancelListingMut({ listingId: listing!._id, driverId: userId! });
      setConfirmCancel(false);
      navigate("/home", { replace: true });
    });

  const handleEnd = () =>
    withAction(async () => {
      await endRideMut({ listingId: listing!._id, driverId: userId! });
      navigate("/home", { replace: true });
    });

  // ── No active listing ─────────────────────────────────────────────────────
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
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <>
        <div className="min-h-screen bg-white flex flex-col">
          <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gray-100">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:bg-gray-100">
              <ChevronLeft />
            </button>
            <h1 className="text-lg font-bold text-gray-900">My Ride</h1>
          </div>
          <div className="flex-1 px-4 py-6 space-y-4">
            <div className="text-center py-8 text-gray-500">
              <p className="font-medium">No active ride</p>
              <button onClick={() => navigate("/home")} className="text-brand-700 text-sm font-semibold mt-2">
                Back to Home
              </button>
            </div>

            {/* Still show templates even with no active listing */}
            {templates !== undefined && templates.length > 0 && (
              <div className="card">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Recurring Schedules
                </p>
                <div className="space-y-3">
                  {templates.map((t) => (
                    <div key={t._id} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {t.direction === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC"} · {t.departureTimeHHMM}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t.totalSeats} seat{t.totalSeats > 1 ? "s" : ""}
                            {t.pickupPoint ? ` · ${t.pickupPoint}` : ""}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {t.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {DAY_LABELS.map((label, idx) => (
                          <span
                            key={idx}
                            className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center ${
                              t.daysOfWeek.includes(idx)
                                ? "bg-brand-600 text-white"
                                : "bg-gray-100 text-gray-300"
                            }`}
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
                            try {
                              await toggleTemplate({ templateId: t._id as Id<"recurringTemplates">, userId: userId!, isActive: !t.isActive });
                            } finally {
                              setTemplateActionId(null);
                            }
                          }}
                          className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg border border-gray-200 text-gray-700 active:bg-gray-50 disabled:opacity-50"
                        >
                          {templateActionId === t._id ? "…" : t.isActive ? "Pause" : "Resume"}
                        </button>
                        <button
                          disabled={templateActionId === t._id}
                          onClick={() => setConfirmDeleteId(t._id)}
                          className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg border border-red-200 text-red-600 active:bg-red-50 disabled:opacity-50"
                        >
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
              <p className="text-gray-800 font-medium text-center mb-6">
                Delete this recurring schedule? Future auto-posts will stop.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} disabled={templateActionId === confirmDeleteId} className="btn-secondary">
                  Keep it
                </button>
                <button
                  disabled={templateActionId === confirmDeleteId}
                  onClick={async () => {
                    setTemplateActionId(confirmDeleteId);
                    try {
                      await deleteTemplate({ templateId: confirmDeleteId as Id<"recurringTemplates">, userId: userId! });
                      setConfirmDeleteId(null);
                    } finally {
                      setTemplateActionId(null);
                    }
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

  const filledSeats = listing.totalSeats - listing.seatsLeft;
  const isStarted = listing.status === "started";
  const isOpen = listing.status === "open" || listing.status === "full";

  const statusColors: Record<string, string> = {
    open:      "bg-green-100 text-green-700",
    full:      "bg-red-100 text-red-700",
    started:   "bg-blue-100 text-blue-700",
    completed: "bg-gray-100 text-gray-500",
    cancelled: "bg-gray-100 text-gray-500",
  };
  const statusLabels: Record<string, string> = {
    open:      "Open",
    full:      "Full",
    started:   "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <>
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
          <h1 className="text-lg font-bold text-gray-900">My Ride</h1>
          <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[listing.status] ?? "bg-gray-100 text-gray-500"}`}>
            {statusLabels[listing.status] ?? listing.status}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-36">

          {/* Error */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 cursor-pointer"
              onClick={() => setError(null)}
            >
              {error}
            </div>
          )}

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
                      filled ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {filled ? "Taken" : "Free"}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recurring schedules */}
          {templates !== undefined && templates.length > 0 && (
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Recurring Schedules
              </p>
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t._id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {t.direction === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC"} · {t.departureTimeHHMM}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t.totalSeats} seat{t.totalSeats > 1 ? "s" : ""}
                          {t.pickupPoint ? ` · ${t.pickupPoint}` : ""}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {t.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {DAY_LABELS.map((label, idx) => (
                        <span
                          key={idx}
                          className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center ${
                            t.daysOfWeek.includes(idx)
                              ? "bg-brand-600 text-white"
                              : "bg-gray-100 text-gray-300"
                          }`}
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
                          try {
                            await toggleTemplate({ templateId: t._id as Id<"recurringTemplates">, userId: userId!, isActive: !t.isActive });
                          } finally {
                            setTemplateActionId(null);
                          }
                        }}
                        className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg border border-gray-200 text-gray-700 active:bg-gray-50 disabled:opacity-50"
                      >
                        {templateActionId === t._id ? "…" : t.isActive ? "Pause" : "Resume"}
                      </button>
                      <button
                        disabled={templateActionId === t._id}
                        onClick={() => setConfirmDeleteId(t._id)}
                        className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg border border-red-200 text-red-600 active:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riders list */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Confirmed Riders
                {riders && riders.length > 0 && (
                  <span className="ml-2 bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full text-xs">
                    {riders.length}
                  </span>
                )}
              </p>
              {riders && riders.length > 0 && (
                <button
                  onClick={() => navigate(`/ride-chat/${listing._id}`)}
                  className="flex items-center gap-1.5 text-brand-700 text-xs font-semibold bg-brand-50 px-3 py-1.5 rounded-xl active:bg-brand-100"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                    <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a4 4 0 00-3-3.87" />
                  </svg>
                  Group Chat
                </button>
              )}
            </div>

            {riders === undefined ? (
              <div className="space-y-2 animate-pulse">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : riders.length === 0 ? (
              <div className="py-4 text-center text-gray-400">
                <p className="text-sm">No riders yet</p>
                <p className="text-xs mt-1">Your ride will appear in the feed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {riders.map((booking, i) => (
                  <div key={booking._id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
                      {booking.rider?.name
                        .split(" ")
                        .map((w: string) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() ?? i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {booking.rider?.name ?? "Rider"}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/dm/${listing._id}/${booking.riderId}`)}
                      className="shrink-0 w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 active:opacity-70"
                      aria-label={`Chat with ${booking.rider?.name ?? "rider"}`}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Action buttons — sticky at bottom */}
        {(isOpen || isStarted) && (
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-4 bg-white border-t border-gray-100"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            {isStarted ? (
              /* Started state: End Ride only (cancel not allowed once started) */
              <button
                onClick={handleEnd}
                disabled={actionLoading}
                className="btn-primary bg-gray-800 active:bg-gray-900"
              >
                {actionLoading ? "Ending…" : "End Ride"}
              </button>
            ) : (
              /* Open / Full state: Cancel + Start */
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmCancel(true)}
                  disabled={actionLoading}
                  className="flex-1 border border-red-500 text-red-600 font-semibold py-3 px-4 rounded-xl active:bg-red-50 disabled:opacity-50"
                >
                  Cancel Ride
                </button>
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white font-semibold py-3 px-4 rounded-xl active:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? "Starting…" : "Start Ride"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirmation */}
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

      {/* Delete template confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/40">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up shadow-xl">
            <p className="text-gray-800 font-medium text-center mb-6">
              Delete this recurring schedule? Future auto-posts will stop.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={templateActionId === confirmDeleteId}
                className="btn-secondary"
              >
                Keep it
              </button>
              <button
                disabled={templateActionId === confirmDeleteId}
                onClick={async () => {
                  setTemplateActionId(confirmDeleteId);
                  try {
                    await deleteTemplate({ templateId: confirmDeleteId as Id<"recurringTemplates">, userId: userId! });
                    setConfirmDeleteId(null);
                  } finally {
                    setTemplateActionId(null);
                  }
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
