import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import LocationInput from "../components/LocationInput";
import type { PlaceResult } from "../hooks/usePlacesAutocomplete";
import { reverseGeocode } from "../hooks/usePlacesAutocomplete";

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultTimeStr(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  const mins = Math.round(d.getMinutes() / 15) * 15;
  if (mins === 60) { d.setHours(d.getHours() + 1, 0, 0, 0); }
  else { d.setMinutes(mins, 0, 0); }
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parseTimeToday(t: string): number {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// ── Wizard Types ──────────────────────────────────────────────────────────────

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS = [1, 2, 3, 4, 5];

type OfferData     = { from?: PlaceResult | null; to?: PlaceResult | null; timeStr?: string; seats?: number; fare?: number };
type SeekData      = { from?: PlaceResult | null; to?: PlaceResult | null; timeStr?: string; seats?: number };
type RecurringData = { from?: PlaceResult | null; to?: PlaceResult | null; timeStr?: string; seats?: number; fare?: number; days?: number[] };

type WizardState =
  | { flow: "offer";     step: "from" | "to" | "time" | "seats" | "fare" | "confirm";         data: OfferData     }
  | { flow: "seek";      step: "from" | "to" | "time" | "seats" | "confirm";                   data: SeekData      }
  | { flow: "recurring"; step: "from" | "to" | "time" | "seats" | "fare" | "days" | "confirm"; data: RecurringData };

type LocalMsg = { id: string; role: "bot" | "user"; text: string };

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { userId } = useAuth();

  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [msgs, setMsgs] = useState<LocalMsg[]>([]);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [locInput, setLocInput] = useState<PlaceResult | null>(null);
  const [timeStr, setTimeStr] = useState(defaultTimeStr);
  const [seats, setSeats] = useState(1);
  const [fare, setFare] = useState(50);
  const [days, setDays] = useState<number[]>(WEEKDAYS);

  const bottomRef = useRef<HTMLDivElement>(null);

  const myListing      = useQuery(api.listings.getMyActiveListing,      { userId: userId! });
  const myRequest      = useQuery(api.rideRequests.getMyActiveRequest,  { riderId: userId! });
  const myBooking      = useQuery(api.bookings.getMyBooking,            { userId: userId! });
  const postListingMut    = useMutation(api.listings.postListing);
  const postRequestMut    = useMutation(api.rideRequests.postRequest);
  const createTemplateMut = useMutation(api.recurring.createTemplate);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // ── Wizard helpers ─────────────────────────────────────────────────────────

  const addBot  = (t: string) => setMsgs((p) => [...p, { id: `${Date.now()}-b`, role: "bot",  text: t }]);
  const addUser = (t: string) => setMsgs((p) => [...p, { id: `${Date.now()}-u`, role: "user", text: t }]);

  const startOffer = () => {
    if (myListing) { addBot("You already have an active listing. Check it on the Home screen."); return; }
    setWizard({ flow: "offer", step: "from", data: {} });
    setLocInput(null); setTimeStr(defaultTimeStr()); setSeats(1); setFare(50);
    addBot("Let's post your ride! Where are you starting from?");
  };

  const startSeek = () => {
    if (myBooking) { addBot("You already have a confirmed booking. Check it on the Home screen."); return; }
    if (myRequest) { addBot("You already have an active ride request. Check it on the Home screen."); return; }
    setWizard({ flow: "seek", step: "from", data: {} });
    setLocInput(null); setTimeStr(defaultTimeStr()); setSeats(1);
    addBot("Looking for a ride? Where are you starting from?");
  };

  const startRecurring = () => {
    if (myListing) { addBot("You already have an active listing. Check it on the Home screen."); return; }
    setWizard({ flow: "recurring", step: "from", data: {} });
    setLocInput(null); setTimeStr(defaultTimeStr()); setSeats(1); setFare(50); setDays(WEEKDAYS);
    addBot("Let's set up a recurring ride! It'll auto-post every week on the days you choose.\n\nWhere are you starting from?");
  };

  const cancelWizard = () => {
    addBot("No problem! Tap any button below whenever you're ready.");
    setWizard(null);
    setLocInput(null);
  };

  const handleWizardNext = async () => {
    if (!wizard) return;

    // ── Offer ──────────────────────────────────────────────────────────────
    if (wizard.flow === "offer") {
      if (wizard.step === "from") {
        if (!locInput) return;
        addUser(`From: ${locInput.label}`);
        setWizard({ flow: "offer", step: "to", data: { ...wizard.data, from: locInput } });
        setLocInput(null);
        addBot("Where are you going to?");

      } else if (wizard.step === "to") {
        if (!locInput) return;
        addUser(`To: ${locInput.label}`);
        setWizard({ flow: "offer", step: "time", data: { ...wizard.data, to: locInput } });
        addBot("What time are you departing?");

      } else if (wizard.step === "time") {
        addUser(`Departing at ${timeStr}`);
        setWizard({ flow: "offer", step: "seats", data: { ...wizard.data, timeStr } });
        addBot("How many seats are you offering? (1–4)");

      } else if (wizard.step === "seats") {
        addUser(`${seats} seat${seats !== 1 ? "s" : ""}`);
        setWizard({ flow: "offer", step: "fare", data: { ...wizard.data, seats } });
        addBot("What's the fare per seat? (₹1–₹2000)");

      } else if (wizard.step === "fare") {
        addUser(`₹${fare} per seat`);
        const d = { ...wizard.data, fare };
        setWizard({ flow: "offer", step: "confirm", data: d });
        addBot(
          `Ready to post your ride:\n` +
          `📍 ${d.from?.label}\n🏁 ${d.to?.label}\n` +
          `🕐 ${d.timeStr}  ·  ${d.seats} seat${d.seats !== 1 ? "s" : ""}  ·  ₹${fare}/seat\n\nConfirm?`
        );

      } else if (wizard.step === "confirm") {
        setWizardLoading(true);
        try {
          await postListingMut({
            userId: userId!,
            fromLabel: wizard.data.from!.label, fromLat: wizard.data.from!.lat, fromLng: wizard.data.from!.lng,
            toLabel:   wizard.data.to!.label,   toLat:   wizard.data.to!.lat,   toLng:   wizard.data.to!.lng,
            departureTime: parseTimeToday(wizard.data.timeStr!),
            totalSeats: wizard.data.seats!,
            fare: wizard.data.fare!,
          });
          addBot("Ride posted! It's now live on the Home screen for riders to find.");
        } catch (e) {
          addBot(`Could not post: ${e instanceof Error ? e.message : "Something went wrong"}`);
        } finally {
          setWizardLoading(false); setWizard(null); setLocInput(null);
        }
      }

    // ── Seek ───────────────────────────────────────────────────────────────
    } else if (wizard.flow === "seek") {
      if (wizard.step === "from") {
        if (!locInput) return;
        addUser(`From: ${locInput.label}`);
        setWizard({ flow: "seek", step: "to", data: { ...wizard.data, from: locInput } });
        setLocInput(null);
        addBot("Where are you going to?");

      } else if (wizard.step === "to") {
        if (!locInput) return;
        addUser(`To: ${locInput.label}`);
        setWizard({ flow: "seek", step: "time", data: { ...wizard.data, to: locInput } });
        addBot("What time do you need the ride?");

      } else if (wizard.step === "time") {
        addUser(`Time: ${timeStr}`);
        setWizard({ flow: "seek", step: "seats", data: { ...wizard.data, timeStr } });
        addBot("How many seats do you need? (1–4)");

      } else if (wizard.step === "seats") {
        addUser(`${seats} seat${seats !== 1 ? "s" : ""}`);
        const d = { ...wizard.data, seats };
        setWizard({ flow: "seek", step: "confirm", data: d });
        addBot(
          `Ready to post your request:\n` +
          `📍 ${d.from?.label}\n🏁 ${d.to?.label}\n` +
          `🕐 ${d.timeStr}  ·  ${d.seats} seat${d.seats !== 1 ? "s" : ""}\n\nConfirm?`
        );

      } else if (wizard.step === "confirm") {
        setWizardLoading(true);
        try {
          await postRequestMut({
            riderId: userId!,
            fromLabel: wizard.data.from!.label, fromLat: wizard.data.from!.lat, fromLng: wizard.data.from!.lng,
            toLabel:   wizard.data.to!.label,   toLat:   wizard.data.to!.lat,   toLng:   wizard.data.to!.lng,
            departureTime: parseTimeToday(wizard.data.timeStr!),
            seatsNeeded: wizard.data.seats!,
          });
          addBot("Request posted! Drivers can now see you on the Home screen.");
        } catch (e) {
          addBot(`Could not post: ${e instanceof Error ? e.message : "Something went wrong"}`);
        } finally {
          setWizardLoading(false); setWizard(null); setLocInput(null);
        }
      }

    // ── Recurring ──────────────────────────────────────────────────────────
    } else if (wizard.flow === "recurring") {
      if (wizard.step === "from") {
        if (!locInput) return;
        addUser(`From: ${locInput.label}`);
        setWizard({ flow: "recurring", step: "to", data: { ...wizard.data, from: locInput } });
        setLocInput(null);
        addBot("Where are you going to?");

      } else if (wizard.step === "to") {
        if (!locInput) return;
        addUser(`To: ${locInput.label}`);
        setWizard({ flow: "recurring", step: "time", data: { ...wizard.data, to: locInput } });
        addBot("What time do you depart each day?");

      } else if (wizard.step === "time") {
        addUser(`Departing at ${timeStr}`);
        setWizard({ flow: "recurring", step: "seats", data: { ...wizard.data, timeStr } });
        addBot("How many seats are you offering? (1–4)");

      } else if (wizard.step === "seats") {
        addUser(`${seats} seat${seats !== 1 ? "s" : ""}`);
        setWizard({ flow: "recurring", step: "fare", data: { ...wizard.data, seats } });
        addBot("What's the fare per seat? (₹1–₹2000)");

      } else if (wizard.step === "fare") {
        addUser(`₹${fare} per seat`);
        setWizard({ flow: "recurring", step: "days", data: { ...wizard.data, fare } });
        addBot("Which days of the week should this repeat?");

      } else if (wizard.step === "days") {
        if (days.length === 0) return;
        const dayNames = days.sort((a, b) => a - b).map((d) => DAY_LABELS[d]).join(", ");
        addUser(`Every ${dayNames}`);
        const d = { ...wizard.data, days };
        setWizard({ flow: "recurring", step: "confirm", data: d });
        addBot(
          `Ready to create your recurring ride:\n` +
          `📍 ${d.from?.label}\n🏁 ${d.to?.label}\n` +
          `🕐 ${d.timeStr}  ·  ${d.seats} seat${d.seats !== 1 ? "s" : ""}  ·  ₹${d.fare}/seat\n` +
          `📅 Every ${dayNames}\n\nConfirm?`
        );

      } else if (wizard.step === "confirm") {
        setWizardLoading(true);
        try {
          await createTemplateMut({
            userId: userId!,
            fromLabel: wizard.data.from!.label, fromLat: wizard.data.from!.lat, fromLng: wizard.data.from!.lng,
            toLabel:   wizard.data.to!.label,   toLat:   wizard.data.to!.lat,   toLng:   wizard.data.to!.lng,
            departureTimeHHMM: wizard.data.timeStr!,
            totalSeats: wizard.data.seats!,
            fare: wizard.data.fare!,
            daysOfWeek: wizard.data.days!,
          });
          addBot("Recurring ride created! It'll auto-post on your chosen days each week. Manage it anytime from your Profile.");
        } catch (e) {
          addBot(`Could not create: ${e instanceof Error ? e.message : "Something went wrong"}`);
        } finally {
          setWizardLoading(false); setWizard(null); setLocInput(null);
        }
      }
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocInput(result);
      } catch { /* ignore */ }
    }, () => {}, { enableHighAccuracy: true, timeout: 10000 });
  };

  // ── Step flags ─────────────────────────────────────────────────────────────

  const isLocation = wizard?.step === "from" || wizard?.step === "to";
  const isTime     = wizard?.step === "time";
  const isSeats    = wizard?.step === "seats";
  const isFare     = (wizard?.flow === "offer" || wizard?.flow === "recurring") && wizard?.step === "fare";
  const isDays     = wizard?.flow === "recurring" && wizard?.step === "days";
  const isConfirm  = wizard?.step === "confirm";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-white" style={{ height: "calc(100vh - 65px)" }}>

      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Tara</h1>
            <p className="text-xs text-green-500 font-semibold leading-none">● Online · Your ride guide</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Welcome card — always shown at top */}
        {msgs.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center shrink-0 mb-0.5">
                <span className="text-white text-[9px] font-bold">T</span>
              </div>
              <div className="max-w-[80%] bg-blue-50 border border-blue-100 rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-[10px] font-semibold text-brand-600 mb-1">Tara</p>
                <p className="text-sm text-gray-800 leading-relaxed">
                  Hi! I'm <strong>Tara</strong>, your ride guide for Gaur City commuters. 🙏
                </p>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center shrink-0 mb-0.5">
                <span className="text-white text-[9px] font-bold">T</span>
              </div>
              <div className="max-w-[80%] bg-blue-50 border border-blue-100 rounded-2xl rounded-bl-md px-4 py-3 space-y-2.5">
                <p className="text-[10px] font-semibold text-brand-600">Tara</p>
                <p className="text-sm text-gray-800 font-medium">Here's what I can do for you:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5">🚗</span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <strong>Offer Ride</strong> — Post a one-time ride for today. I'll ask your route, time, seats & fare then list it on Home.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5">🔁</span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <strong>Recurring</strong> — Set up a weekly schedule. I'll auto-post your ride every day you choose.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5">🙋</span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <strong>Find Ride</strong> — Looking for a seat? I'll post your request so drivers can find you.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 pt-1">Tap a button below to get started.</p>
              </div>
            </div>
          </div>
        )}

        {/* Conversation messages */}
        {msgs.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center shrink-0 mb-0.5">
                  <span className="text-white text-[9px] font-bold">T</span>
                </div>
              )}
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 whitespace-pre-line text-sm leading-relaxed ${
                isUser
                  ? "bg-brand-700 text-white rounded-br-md"
                  : "bg-blue-50 border border-blue-100 text-gray-800 rounded-bl-md"
              }`}>
                {!isUser && <p className="text-[10px] font-semibold text-brand-600 mb-0.5">Tara</p>}
                {msg.text}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── Wizard Input Panel ── */}
      {wizard && (
        <div className="shrink-0 border-t border-blue-100 bg-blue-50 px-4 py-3 space-y-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>

          {isLocation && (
            <>
              <LocationInput
                placeholder={wizard.step === "from" ? "Search pickup location…" : "Search drop location…"}
                value={locInput}
                onChange={setLocInput}
              />
              <button onClick={handleUseMyLocation}
                className="flex items-center gap-2 text-xs font-semibold text-blue-600 active:opacity-70">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
                Use my current location
              </button>
              <div className="flex gap-2">
                <button onClick={cancelWizard} className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white">Cancel</button>
                <button onClick={handleWizardNext} disabled={!locInput} className="flex-1 bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-40">Next →</button>
              </div>
            </>
          )}

          {isTime && (
            <>
              <div className="bg-white rounded-xl px-4 py-3 border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Departure Time</p>
                <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)}
                  className="w-full text-sm font-semibold text-gray-800 outline-none bg-transparent" />
              </div>
              <div className="flex gap-2">
                <button onClick={cancelWizard} className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white">Cancel</button>
                <button onClick={handleWizardNext} className="flex-1 bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm">Next →</button>
              </div>
            </>
          )}

          {isSeats && (
            <>
              <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  {wizard.flow === "seek" ? "Seats needed" : "Seats offered"}
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold active:bg-gray-200">−</button>
                  <span className="text-lg font-bold text-gray-900 w-6 text-center">{seats}</span>
                  <button onClick={() => setSeats(Math.min(4, seats + 1))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold active:bg-gray-200">+</button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={cancelWizard} className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white">Cancel</button>
                <button onClick={handleWizardNext} className="flex-1 bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm">Next →</button>
              </div>
            </>
          )}

          {isFare && (
            <>
              <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 flex items-center gap-2">
                <span className="text-sm font-bold text-gray-500">₹</span>
                <input type="number" min={1} max={2000} value={fare}
                  onChange={(e) => setFare(Number(e.target.value))}
                  className="flex-1 text-sm font-semibold text-gray-800 outline-none bg-transparent"
                  placeholder="Fare per seat" />
              </div>
              <div className="flex gap-2">
                <button onClick={cancelWizard} className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white">Cancel</button>
                <button onClick={handleWizardNext} disabled={fare < 1 || fare > 2000} className="flex-1 bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-40">Next →</button>
              </div>
            </>
          )}

          {isDays && (
            <>
              <div className="bg-white rounded-xl px-4 py-3 border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Repeat on</p>
                <div className="flex gap-2 justify-between">
                  {DAY_LABELS.map((label, i) => {
                    const on = days.includes(i);
                    return (
                      <button key={i}
                        onClick={() => setDays(on ? days.filter((d) => d !== i) : [...days, i])}
                        className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${on ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={cancelWizard} className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white">Cancel</button>
                <button onClick={handleWizardNext} disabled={days.length === 0} className="flex-1 bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-40">Next →</button>
              </div>
            </>
          )}

          {isConfirm && (
            <div className="flex gap-3">
              <button onClick={cancelWizard} className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl text-sm bg-white">Cancel</button>
              <button onClick={handleWizardNext} disabled={wizardLoading} className="flex-1 bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {wizardLoading ? "Posting…" : "Confirm & Post"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Action Buttons (when no wizard active) ── */}
      {!wizard && (
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 space-y-2"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <div className="flex gap-2">
            <button onClick={startOffer}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 text-sm font-bold rounded-2xl active:bg-blue-100">
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
              </svg>
              Offer Ride
            </button>
            <button onClick={startRecurring}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 text-sm font-bold rounded-2xl active:bg-green-100">
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" />
                <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
              Recurring
            </button>
          </div>
          <button onClick={startSeek}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-700 text-sm font-bold rounded-2xl active:bg-purple-100">
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            Find Ride
          </button>
        </div>
      )}
    </div>
  );
}
