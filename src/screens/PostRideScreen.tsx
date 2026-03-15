import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

type Direction = "GC_TO_HCL" | "HCL_TO_GC";

// Convert "HH:MM" (24h) to a Unix ms timestamp for today
function toTimestamp(value: string): number {
  const [h, m] = value.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// Minimum time value for the input (now + 1 min)
function minTimeValue(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function PostRideScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { state } = useLocation() as {
    state?: {
      direction?: "GC_TO_HCL" | "HCL_TO_GC";
      departureTime?: string; // "HH:MM" 24h
      seats?: number;
      pickupPoint?: string;
    } | null;
  };

  const [direction, setDirection] = useState<Direction>(state?.direction ?? "GC_TO_HCL");
  const [timeValue, setTimeValue] = useState(state?.departureTime ?? ""); // "HH:MM" 24h
  const [seats, setSeats] = useState(state?.seats ?? 2);
  const [pickupPoint, setPickupPoint] = useState(state?.pickupPoint ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const postListing = useMutation(api.listings.postListing);

  const handlePost = async () => {
    if (!timeValue) {
      setError("Please select a departure time");
      return;
    }
    const departureMs = toTimestamp(timeValue);
    if (departureMs <= Date.now()) {
      setError("Departure time must be in the future");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await postListing({
        userId: userId!,
        direction,
        departureTime: departureMs,
        totalSeats: seats,
        pickupPoint: pickupPoint.trim() || undefined,
        note: note.trim() || undefined,
      });
      navigate("/home", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl active:bg-gray-100"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Offer a Ride</h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {/* Direction */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Direction
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["GC_TO_HCL", "HCL_TO_GC"] as Direction[]).map((d) => {
              const selected = direction === d;
              return (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`py-4 rounded-2xl border-2 font-semibold text-sm transition-all ${
                    selected
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 bg-white text-gray-500 active:bg-gray-50"
                  }`}
                >
                  <span className="block text-base font-bold mb-0.5">
                    {d === "GC_TO_HCL" ? "GC → HCL" : "HCL → GC"}
                  </span>
                  <span className="text-xs font-normal">
                    {d === "GC_TO_HCL" ? "Gaur City to HCL" : "HCL to Gaur City"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Departure Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={timeValue}
            min={minTimeValue()}
            onChange={(e) => {
              setTimeValue(e.target.value);
              setError(null);
            }}
            className="input-field"
          />
        </div>

        {/* Seats Available */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Seats Available
          </label>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setSeats((s) => Math.max(1, s - 1))}
              disabled={seats <= 1}
              className="w-11 h-11 rounded-full border-2 border-gray-200 text-gray-700 text-xl font-light flex items-center justify-center active:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              −
            </button>
            <div className="text-center">
              <span className="text-3xl font-bold text-brand-700">{seats}</span>
              <p className="text-xs text-gray-500 mt-0.5">
                {seats === 1 ? "seat" : "seats"}
              </p>
            </div>
            <button
              onClick={() => setSeats((s) => Math.min(4, s + 1))}
              disabled={seats >= 4}
              className="w-11 h-11 rounded-full border-2 border-gray-200 text-gray-700 text-xl font-light flex items-center justify-center active:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Pickup Point */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pickup Point{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. GC1 Gate, Tower 4 lobby"
            value={pickupPoint}
            onChange={(e) => setPickupPoint(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Note{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="e.g. Will leave sharp at the time posted"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="input-field resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
      </div>

      {/* Post button — sticky at bottom */}
      <div className="px-4 py-4 border-t border-gray-100 bg-white"
           style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <button
          onClick={handlePost}
          disabled={loading || !timeValue}
          className="btn-primary"
        >
          {loading ? "Posting…" : "Post Ride"}
        </button>
      </div>
    </div>
  );
}
