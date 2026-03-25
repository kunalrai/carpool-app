import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
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

// ── TaraAI Avatar ─────────────────────────────────────────────────────────────

function TaraAvatar({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "w-14 h-14" : size === "md" ? "w-10 h-10" : "w-7 h-7";
  const text = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-[9px]";
  return (
    <div className={`${dims} rounded-full shrink-0 flex items-center justify-center relative`}
      style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)" }}>
      <div className="absolute inset-0 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
      <span className={`text-white font-bold ${text} relative z-10`}>AI</span>
    </div>
  );
}

// ── Welcome Cards ─────────────────────────────────────────────────────────────

const capabilities = [
  {
    icon: "🚗",
    title: "Offer Ride",
    desc: "Post a one-time ride for today. I'll ask your route, time, seats & fare then list it on Home.",
    gradient: "from-blue-500 to-blue-700",
  },
  {
    icon: "🔁",
    title: "Recurring",
    desc: "Set up a weekly schedule. I'll auto-post your ride every day you choose.",
    gradient: "from-emerald-500 to-teal-700",
  },
  {
    icon: "🙋",
    title: "Find Ride",
    desc: "Looking for a seat? I'll post your request so drivers can find you.",
    gradient: "from-violet-500 to-purple-700",
  },
];

function WelcomeCards() {
  return (
    <div className="space-y-3 pb-2">
      {/* Greeting bubble */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end gap-2"
      >
        <TaraAvatar size="sm" />
        <div className="max-w-[82%] rounded-2xl rounded-bl-md px-4 py-3"
          style={{ background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)", border: "1px solid #c7d2fe" }}>
          <p className="text-[10px] font-bold text-indigo-500 mb-1 tracking-wide">TaraAI</p>
          <p className="text-sm text-gray-800 leading-relaxed">
            Hi! I'm <strong>TaraAI</strong>, your smart ride guide for City commuters. 🙏
          </p>
        </div>
      </motion.div>

      {/* Capability cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex items-end gap-2"
      >
        <TaraAvatar size="sm" />
        <div className="max-w-[82%] rounded-2xl rounded-bl-md px-4 py-3 space-y-3"
          style={{ background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)", border: "1px solid #c7d2fe" }}>
          <p className="text-[10px] font-bold text-indigo-500 tracking-wide">TaraAI</p>
          <p className="text-sm font-semibold text-gray-800">Here's what I can do for you:</p>
          <div className="space-y-2">
            {capabilities.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.1 }}
                className="flex items-start gap-3 rounded-xl p-2.5"
                style={{ background: "rgba(255,255,255,0.7)" }}
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                  <span className="text-sm">{c.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{c.title}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-gray-400 pt-1">Tap a button below to get started.</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: LocalMsg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <TaraAvatar size="sm" />}
      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 whitespace-pre-line text-sm leading-relaxed shadow-sm ${
        isUser
          ? "text-white rounded-br-md"
          : "rounded-bl-md"
      }`}
        style={isUser
          ? { background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }
          : { background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)", border: "1px solid #c7d2fe" }
        }
      >
        {!isUser && <p className="text-[10px] font-bold text-indigo-500 mb-0.5 tracking-wide">TaraAI</p>}
        <span className={isUser ? "text-white" : "text-gray-800"}>{msg.text}</span>
      </div>
    </motion.div>
  );
}

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
          addBot("Ride posted! It's now live on the Home screen for riders to find. 🎉");
        } catch (e) {
          addBot(`Could not post: ${e instanceof Error ? e.message : "Something went wrong"}`);
        } finally {
          setWizardLoading(false); setWizard(null); setLocInput(null);
        }
      }

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
          addBot("Request posted! Drivers can now see you on the Home screen. 🙌");
        } catch (e) {
          addBot(`Could not post: ${e instanceof Error ? e.message : "Something went wrong"}`);
        } finally {
          setWizardLoading(false); setWizard(null); setLocInput(null);
        }
      }

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
          addBot("Recurring ride created! It'll auto-post on your chosen days each week. 🔁\nManage it from your Profile.");
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

  // ── Free-form chat handler ─────────────────────────────────────────────────

  const [freeText, setFreeText] = useState("");

  const handleFreeSend = () => {
    const text = freeText.trim();
    if (!text) return;
    setFreeText("");
    addUser(text);
    const lower = text.toLowerCase();
    // Intent detection
    if (/offer|post.*ride|drive|giving.*ride/i.test(lower)) {
      setTimeout(() => startOffer(), 300);
    } else if (/find|need.*ride|looking.*ride|seek|book.*seat/i.test(lower)) {
      setTimeout(() => startSeek(), 300);
    } else if (/recurring|weekly|daily|every (day|week|monday)/i.test(lower)) {
      setTimeout(() => startRecurring(), 300);
    } else if (/hi|hello|hey|namaste|hii/i.test(lower)) {
      setTimeout(() => addBot("Namaste! 🙏 I'm TaraAI — tap Offer Ride, Recurring, or Find Ride below to get started. Or ask me anything!"), 300);
    } else if (/how.*work|what.*do|help|what can/i.test(lower)) {
      setTimeout(() => addBot("Here's what I can do:\n\n🚗 Offer Ride — Post a one-time ride for today\n🔁 Recurring — Auto-post your ride every week\n🙋 Find Ride — Request a seat and let drivers find you\n\nJust tap the buttons below!"), 300);
    } else if (/fare|price|cost|pay|money|₹/i.test(lower)) {
      setTimeout(() => addBot("Fares are set by the driver when posting a ride. The app charges ₹0 platform fees — you pay the driver directly when you board. 💸"), 300);
    } else if (/safe|trust|verify|otp/i.test(lower)) {
      setTimeout(() => addBot("All users are OTP-verified with their mobile number. You can also chat with your driver before the ride. Stay safe! 🛡️"), 300);
    } else if (/cancel|cancell/i.test(lower)) {
      setTimeout(() => addBot("You can cancel your ride or booking anytime from the Home screen — just tap your active ride banner. No penalties! ✅"), 300);
    } else {
      setTimeout(() => addBot("I'm best at helping you post or find rides! 🙏\n\nTap one of the buttons below:\n🚗 Offer Ride · 🔁 Recurring · 🙋 Find Ride"), 300);
    }
  };

  const isLocation = wizard?.step === "from" || wizard?.step === "to";
  const isTime     = wizard?.step === "time";
  const isSeats    = wizard?.step === "seats";
  const isFare     = (wizard?.flow === "offer" || wizard?.flow === "recurring") && wizard?.step === "fare";
  const isDays     = wizard?.flow === "recurring" && wizard?.step === "days";
  const isConfirm  = wizard?.step === "confirm";

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 65px)", background: "#f8faff" }}>

      {/* ── Header ── */}
      <div className="shrink-0 px-4 pt-12 pb-4"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
          boxShadow: "0 4px 24px rgba(30,58,138,0.25)",
        }}>
        <div className="flex items-center gap-3">
          {/* Pulsing avatar */}
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
            />
            <TaraAvatar size="md" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight tracking-wide">TaraAI</h1>
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              <p className="text-xs text-blue-200 font-medium">Online · Your ride guide</p>
            </div>
          </div>
          <div className="ml-auto">
            <div className="text-[10px] text-blue-300 text-right font-medium">City</div>
            <div className="text-[10px] text-blue-300 text-right">Commuter AI</div>
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgs.length === 0 && <WelcomeCards />}

        {msgs.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Wizard Input Panel ── */}
      <AnimatePresence>
        {wizard && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="shrink-0 px-4 py-3 space-y-3"
            style={{
              background: "linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)",
              borderTop: "1px solid #c7d2fe",
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
            }}
          >
            {isLocation && (
              <>
                <LocationInput
                  placeholder={wizard.step === "from" ? "Search pickup location…" : "Search drop location…"}
                  value={locInput}
                  onChange={setLocInput}
                />
                <button onClick={handleUseMyLocation}
                  className="flex items-center gap-2 text-xs font-semibold text-indigo-600 active:opacity-70">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                  Use my current location
                </button>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={cancelWizard}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white shadow-sm">
                    Cancel
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleWizardNext} disabled={!locInput}
                    className="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-40 shadow-md"
                    style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
                    Next →
                  </motion.button>
                </div>
              </>
            )}

            {isTime && (
              <>
                <div className="bg-white rounded-xl px-4 py-3 border border-indigo-100 shadow-sm">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Departure Time</p>
                  <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full text-sm font-semibold text-gray-800 outline-none bg-transparent" />
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={cancelWizard}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white shadow-sm">
                    Cancel
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleWizardNext}
                    className="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm shadow-md"
                    style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
                    Next →
                  </motion.button>
                </div>
              </>
            )}

            {isSeats && (
              <>
                <div className="bg-white rounded-xl px-4 py-3 border border-indigo-100 shadow-sm flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {wizard.flow === "seek" ? "Seats needed" : "Seats offered"}
                  </p>
                  <div className="flex items-center gap-3">
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => setSeats(Math.max(1, seats - 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}>−</motion.button>
                    <span className="text-xl font-bold text-gray-900 w-6 text-center">{seats}</span>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => setSeats(Math.min(4, seats + 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}>+</motion.button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={cancelWizard}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white shadow-sm">
                    Cancel
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleWizardNext}
                    className="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm shadow-md"
                    style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
                    Next →
                  </motion.button>
                </div>
              </>
            )}

            {isFare && (
              <>
                <div className="bg-white rounded-xl px-4 py-3 border border-indigo-100 shadow-sm flex items-center gap-3">
                  <span className="text-lg font-bold text-indigo-400">₹</span>
                  <input type="number" min={1} max={2000} value={fare}
                    onChange={(e) => setFare(Number(e.target.value))}
                    className="flex-1 text-sm font-semibold text-gray-800 outline-none bg-transparent"
                    placeholder="Fare per seat" />
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={cancelWizard}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white shadow-sm">
                    Cancel
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleWizardNext} disabled={fare < 1 || fare > 2000}
                    className="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-40 shadow-md"
                    style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
                    Next →
                  </motion.button>
                </div>
              </>
            )}

            {isDays && (
              <>
                <div className="bg-white rounded-xl px-4 py-3 border border-indigo-100 shadow-sm">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3">Repeat on</p>
                  <div className="flex gap-1.5 justify-between">
                    {DAY_LABELS.map((label, i) => {
                      const on = days.includes(i);
                      return (
                        <motion.button key={i} whileTap={{ scale: 0.85 }}
                          onClick={() => setDays(on ? days.filter((d) => d !== i) : [...days, i])}
                          className={`w-9 h-9 rounded-full text-xs font-bold transition-all shadow-sm ${on ? "text-white" : "bg-gray-100 text-gray-500"}`}
                          style={on ? { background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" } : {}}>
                          {label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={cancelWizard}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white shadow-sm">
                    Cancel
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleWizardNext} disabled={days.length === 0}
                    className="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-40 shadow-md"
                    style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
                    Next →
                  </motion.button>
                </div>
              </>
            )}

            {isConfirm && (
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.95 }} onClick={cancelWizard}
                  className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm bg-white shadow-sm">
                  Cancel
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleWizardNext} disabled={wizardLoading}
                  className="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 shadow-md"
                  style={{ background: "linear-gradient(135deg, #059669 0%, #0891b2 100%)" }}>
                  {wizardLoading ? "Posting…" : "Confirm & Post ✓"}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action Buttons ── */}
      <AnimatePresence>
        {!wizard && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="shrink-0 px-4 py-3 space-y-2.5 bg-white"
            style={{
              borderTop: "1px solid #e0e7ff",
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
              boxShadow: "0 -4px 20px rgba(99,102,241,0.08)",
            }}
          >
            <div className="flex gap-2.5">
              {/* Offer Ride */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={startOffer}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
                }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
                Offer Ride
              </motion.button>

              {/* Recurring */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={startRecurring}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                  boxShadow: "0 6px 20px rgba(5,150,105,0.35)",
                }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" />
                  <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
                Recurring
              </motion.button>
            </div>

            {/* Find Ride */}
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={startSeek}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
                boxShadow: "0 6px 20px rgba(124,58,237,0.35)",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              Find Ride
            </motion.button>

          {/* Free-form text input */}
          <div className="flex items-center gap-2 rounded-2xl px-3 py-1.5"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <input
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFreeSend(); }}
              placeholder="Ask TaraAI anything…"
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
            />
            <motion.button whileTap={{ scale: 0.88 }} onClick={handleFreeSend} disabled={!freeText.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </motion.button>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
