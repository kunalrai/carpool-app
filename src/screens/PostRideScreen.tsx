import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import LocationInput from "../components/LocationInput";
import type { PlaceResult } from "../hooks/usePlacesAutocomplete";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
      departureTime?: string; // "HH:MM" 24h
      seats?: number;
      pickupPoint?: string;
    } | null;
  };

  const [fromPlace, setFromPlace] = useState<PlaceResult | null>(null);
  const [toPlace, setToPlace] = useState<PlaceResult | null>(null);
  const [timeValue, setTimeValue] = useState(state?.departureTime ?? "");
  const [seats, setSeats] = useState(state?.seats ?? 2);
  const [fare, setFare] = useState(80);
  const [pickupPoint, setPickupPoint] = useState(state?.pickupPoint ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon–Fri

  const postListing = useMutation(api.listings.postListing);
  const createTemplate = useMutation(api.recurring.createTemplate);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handlePost = async () => {
    if (!fromPlace) { setError("Please select a From location"); return; }
    if (!toPlace)   { setError("Please select a To location");   return; }
    if (!timeValue) { setError("Please select a departure time"); return; }
    if (fare < 1 || fare > 2000) { setError("Fare must be between ₹1 and ₹2000"); return; }

    if (isRecurring) {
      if (selectedDays.length === 0) { setError("Select at least one day"); return; }
      setError(null);
      setLoading(true);
      try {
        await createTemplate({
          userId: userId!,
          fromLabel: fromPlace.label,
          toLabel: toPlace.label,
          fromLat: fromPlace.lat,
          fromLng: fromPlace.lng,
          toLat: toPlace.lat,
          toLng: toPlace.lng,
          fromPlaceId: fromPlace.placeId,
          toPlaceId: toPlace.placeId,
          departureTimeHHMM: timeValue,
          totalSeats: seats,
          fare,
          daysOfWeek: selectedDays,
          pickupPoint: pickupPoint.trim() || undefined,
          note: note.trim() || undefined,
        });
        navigate("/home", { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save schedule");
      } finally {
        setLoading(false);
      }
      return;
    }

    const departureMs = toTimestamp(timeValue);
    if (departureMs <= Date.now()) { setError("Departure time must be in the future"); return; }

    setError(null);
    setLoading(true);
    try {
      await postListing({
        userId: userId!,
        fromLabel: fromPlace.label,
        toLabel: toPlace.label,
        fromLat: fromPlace.lat,
        fromLng: fromPlace.lng,
        toLat: toPlace.lat,
        toLng: toPlace.lng,
        fromPlaceId: fromPlace.placeId,
        toPlaceId: toPlace.placeId,
        departureTime: departureMs,
        totalSeats: seats,
        fare,
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

        {/* From */}
        <LocationInput
          label="From"
          placeholder="Pickup location…"
          value={fromPlace}
          onChange={(v) => { setFromPlace(v); setError(null); }}
        />

        {/* To */}
        <LocationInput
          label="To"
          placeholder="Drop location…"
          value={toPlace}
          onChange={(v) => { setToPlace(v); setError(null); }}
        />

        {/* Departure Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Departure Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={timeValue}
            min={isRecurring ? undefined : minTimeValue()}
            onChange={(e) => { setTimeValue(e.target.value); setError(null); }}
            className="input-field"
          />
        </div>

        {/* Seats */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Seats Available
          </label>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setSeats((s) => Math.max(1, s - 1))}
              disabled={seats <= 1}
              className="w-11 h-11 rounded-full border-2 border-gray-200 text-gray-700 text-xl font-light flex items-center justify-center active:bg-gray-100 disabled:opacity-30"
            >
              −
            </button>
            <div className="text-center">
              <span className="text-3xl font-bold text-brand-700">{seats}</span>
              <p className="text-xs text-gray-500 mt-0.5">{seats === 1 ? "seat" : "seats"}</p>
            </div>
            <button
              onClick={() => setSeats((s) => Math.min(4, s + 1))}
              disabled={seats >= 4}
              className="w-11 h-11 rounded-full border-2 border-gray-200 text-gray-700 text-xl font-light flex items-center justify-center active:bg-gray-100 disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>

        {/* Fare */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fare per seat
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              value={fare}
              onChange={(e) => setFare(Number(e.target.value))}
              className="input-field pl-8"
            />
          </div>
        </div>

        {/* Pickup Point */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pickup Point <span className="text-gray-400 font-normal">(optional)</span>
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
            Note <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="e.g. Will leave sharp at the time posted"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="input-field resize-none"
          />
        </div>

        {/* Recurring toggle */}
        <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
          <button
            onClick={() => setIsRecurring((v) => !v)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Repeat weekly</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isRecurring
                  ? "Auto-posts this ride on selected days each week"
                  : "Post once for today only"}
              </p>
            </div>
            <div
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                isRecurring ? "bg-brand-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isRecurring ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </button>

          {isRecurring && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Repeat on
              </p>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, idx) => {
                  const active = selectedDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-full text-xs font-semibold transition-all ${
                        active
                          ? "bg-brand-600 text-white"
                          : "bg-gray-100 text-gray-500 active:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                A listing will be posted automatically each selected day. Manage schedules from My Ride.
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
      </div>

      {/* Post button */}
      <div
        className="px-4 py-4 border-t border-gray-100 bg-white"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={handlePost}
          disabled={loading || !timeValue || !fromPlace || !toPlace}
          className="btn-primary"
        >
          {loading
            ? isRecurring ? "Saving…" : "Posting…"
            : isRecurring ? "Save Recurring Schedule" : "Post Ride"}
        </button>
      </div>
    </div>
  );
}
