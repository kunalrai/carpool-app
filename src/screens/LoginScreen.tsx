import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

type Phase = "splash" | "mobile" | "otp" | "register";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=80";

// ── Custom numeric keypad ─────────────────────────────────────────────────

const KEYS = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "", sub: "" },       // empty cell
  { digit: "0", sub: "" },
  { digit: "⌫", sub: "" },     // backspace
];

function Keypad({ onPress }: { onPress: (key: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-4">
      {KEYS.map((k, i) =>
        k.digit === "" ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            onPointerDown={(e) => { e.preventDefault(); onPress(k.digit); }}
            className="flex flex-col items-center justify-center bg-white/10 active:bg-white/20 rounded-2xl py-3 select-none transition-colors"
          >
            <span className="text-white text-2xl font-light leading-none">
              {k.digit === "⌫" ? (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              ) : k.digit}
            </span>
            {k.sub && <span className="text-white/50 text-xs mt-0.5 tracking-widest">{k.sub}</span>}
          </button>
        )
      )}
    </div>
  );
}

// ── Dark screen shell ─────────────────────────────────────────────────────

function DarkShell({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col overflow-hidden">
      <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-1/2 object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-gray-950/80 to-gray-950" />

      <div className="relative z-10 flex flex-col h-full" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {/* Nav bar */}
        <div className="flex items-center px-4 pt-10 pb-2">
          <button onPointerDown={onBack} className="p-2 -ml-2 active:opacity-60">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-white">GC Carpool</span>
          <div className="w-9" />
        </div>

        {/* Heading */}
        <div className="px-6 pt-2 pb-5">
          <h1 className="text-2xl font-extrabold text-white leading-snug">
            Welcome to{" "}
            <span className="text-brand-400">GC Carpool</span>
          </h1>
          <p className="text-sm text-white/60 mt-1">
            GaurCity ↔ HCL campus. Book or offer a ride in seconds.
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phase, setPhase] = useState<Phase>("splash");
  const [mobile, setMobile] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [name, setName] = useState("");
  const [offerRides, setOfferRides] = useState(false);
  const [carName, setCarName] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carNumber, setCarNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useAction(api.auth.sendOtp);
  const verifyOtp = useAction(api.auth.verifyOtp);
  const registerUser = useMutation(api.users.registerUser);

  const digitRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  useEffect(() => {
    if (phase !== "otp") return;
    setCountdown(60);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendOtp({ mobile });
      setPhase("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otp = digits.join("");
    if (otp.length < 6) { setError("Enter the 6-digit OTP"); return; }
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp({ mobile, otp });
      if (result.isNewUser) {
        setPhase("register");
      } else {
        login(result.userId! as Id<"users">);
        navigate("/home", { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) { setError("Display name is required"); return; }
    if (offerRides) {
      if (!carName.trim()) { setError("Car name is required"); return; }
      if (!carColor.trim()) { setError("Car color is required"); return; }
      if (!carNumber.trim()) { setError("Car number is required"); return; }
    }
    setError(null);
    setLoading(true);
    try {
      const userId = await registerUser({
        mobile,
        name: name.trim(),
        role: offerRides ? "both" : "taker",
        carName: offerRides ? carName.trim() : undefined,
        carColor: offerRides ? carColor.trim() : undefined,
        carNumber: offerRides ? carNumber.trim() : undefined,
      });
      login(userId);
      navigate("/home", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setDigits(Array(6).fill(""));
    setError(null);
    setLoading(true);
    try {
      await sendOtp({ mobile });
      setPhase("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Keypad press handler for mobile phase
  const handleMobileKey = (key: string) => {
    setError(null);
    if (key === "⌫") {
      setMobile((m) => m.slice(0, -1));
    } else if (mobile.length < 10) {
      setMobile((m) => m + key);
    }
  };

  // Keypad press handler for OTP phase
  const handleOtpKey = (key: string) => {
    setError(null);
    setDigits((prev) => {
      const next = [...prev];
      if (key === "⌫") {
        const lastFilled = [...next].reverse().findIndex((d) => d !== "");
        if (lastFilled !== -1) next[5 - lastFilled] = "";
      } else {
        const emptyIdx = next.findIndex((d) => d === "");
        if (emptyIdx !== -1) next[emptyIdx] = key;
      }
      return next;
    });
  };

  // Format mobile display: "XXXXX XXXXX"
  const mobileDisplay = mobile
    ? mobile.slice(0, 5) + (mobile.length > 5 ? " " + mobile.slice(5) : "")
    : "";

  const maskedMobile = `+91 ${mobile.slice(0, 2)}${"•".repeat(6)}${mobile.slice(8)}`;

  // ── Splash ───────────────────────────────────────────────────────────────
  if (phase === "splash") {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gray-900">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60" />
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 pt-7 pb-8"
             style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
            The Smarter<br />
            <span className="text-brand-700">Commute</span>
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            GaurCity ↔ HCL campus. Book or offer a ride in seconds.
          </p>
          <div className="flex gap-3 mb-6">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
              <span className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Verified</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
              <span className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Instant</span>
            </div>
          </div>
          <button onClick={() => setPhase("mobile")}
            className="w-full bg-brand-700 text-white font-semibold py-4 rounded-2xl text-base active:bg-brand-800 transition-colors mb-4">
            Get Started
          </button>
          <div className="flex items-center justify-center">
            <button onClick={() => setPhase("mobile")} className="text-sm font-semibold text-gray-700 active:opacity-60">
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Mobile phase — dark + custom keypad ───────────────────────────────────
  if (phase === "mobile") {
    return (
      <DarkShell onBack={() => { setMobile(""); setError(null); setPhase("splash"); }}>
        {/* White card */}
        <div className="mx-4 bg-white rounded-2xl p-5 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Get Started</h2>
          <p className="text-sm text-gray-500 mb-4">Enter your phone number to continue your journey.</p>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Phone Number</p>
          <div className="flex items-center bg-gray-100 rounded-xl px-3 py-3 gap-2">
            {/* Flag + code */}
            <span className="text-lg leading-none">🇮🇳</span>
            <span className="text-sm font-semibold text-gray-700">+91</span>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <span className={`flex-1 text-base font-medium tracking-widest ${mobileDisplay ? "text-gray-900" : "text-gray-400"}`}>
              {mobileDisplay || "00000 00000"}
            </span>
            {mobile.length > 0 && (
              <span className="text-xs text-gray-400">{mobile.length}/10</span>
            )}
          </div>

          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

          {mobile.length === 10 && (
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="mt-4 w-full bg-brand-700 text-white font-semibold py-3 rounded-xl text-sm active:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending OTP…" : "Continue"}
            </button>
          )}
        </div>

        {/* Custom keypad */}
        <div className="flex-1 flex flex-col justify-end pb-6"
             style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
          <Keypad onPress={handleMobileKey} />
        </div>
      </DarkShell>
    );
  }

  // ── OTP phase — dark + custom keypad ─────────────────────────────────────
  if (phase === "otp") {
    return (
      <DarkShell onBack={() => { setDigits(Array(6).fill("")); setError(null); setPhase("mobile"); }}>
        {/* White card */}
        <div className="mx-4 bg-white rounded-2xl p-5 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Verify OTP</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sent to <span className="font-medium text-gray-700">{maskedMobile}</span>
          </p>

          {/* Dev hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
            <span className="text-base">🔑</span>
            <p className="text-blue-700 text-xs">Dev OTP: <span className="font-bold tracking-widest">123456</span></p>
          </div>

          {/* 6 digit boxes */}
          <div className="flex gap-2 justify-between mb-3">
            {digits.map((d, i) => (
              <div
                key={i}
                ref={(el) => { digitRefs.current[i] = el as unknown as HTMLInputElement; }}
                className={`flex-1 h-12 flex items-center justify-center rounded-xl border-2 text-xl font-bold transition-colors ${
                  d ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 bg-gray-50 text-gray-300"
                }`}
              >
                {d || "·"}
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

          {digits.join("").length === 6 && (
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-brand-700 text-white font-semibold py-3 rounded-xl text-sm active:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
          )}

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => { setPhase("mobile"); setDigits(Array(6).fill("")); setError(null); }}
              className="text-xs text-gray-500 underline-offset-2 underline"
            >
              Change number
            </button>
            {canResend ? (
              <button onClick={handleResend} disabled={loading} className="text-xs text-brand-700 font-semibold">
                Resend OTP
              </button>
            ) : (
              <span className="text-xs text-gray-400">
                Resend in {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>

        {/* Custom keypad */}
        <div className="flex-1 flex flex-col justify-end pb-6"
             style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
          <Keypad onPress={handleOtpKey} />
        </div>
      </DarkShell>
    );
  }

  // ── Register phase — white screen ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-brand-700 px-6 pt-14 pb-6 text-white">
        <h1 className="text-xl font-bold">GC Carpool</h1>
        <p className="text-brand-200 text-xs mt-0.5">Gaur City ↔ HCL</p>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="animate-slide-up">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Complete your profile</h2>
          <p className="text-gray-500 text-sm mb-6">You're new here — tell us a bit about yourself</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="e.g. Rahul Sharma" value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              className="input-field" autoFocus />
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">I also want to offer rides</p>
              <p className="text-xs text-gray-500 mt-0.5">Add your car details to post rides</p>
            </div>
            <button type="button" onClick={() => setOfferRides((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${offerRides ? "bg-brand-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${offerRides ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-300 ${offerRides ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Car Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Swift Dzire" value={carName}
                  onChange={(e) => { setCarName(e.target.value); setError(null); }} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Car Color <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Silver" value={carColor}
                  onChange={(e) => { setCarColor(e.target.value); setError(null); }} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Car Number <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. UP14 AB 1234" value={carNumber}
                  onChange={(e) => { setCarNumber(e.target.value.toUpperCase()); setError(null); }} className="input-field" />
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button onClick={handleRegister} disabled={loading} className="btn-primary">
            {loading ? "Setting up…" : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}
