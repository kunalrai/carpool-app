import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

type Phase = "splash" | "mobile" | "otp" | "register";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=80";

// ── Dark screen shell ─────────────────────────────────────────────────────

function DarkShell({
  onBack,
  children,
}: {
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col overflow-hidden">
      <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-2/5 object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-gray-950/75 to-gray-950" />

      <div
        className="relative z-10 flex-1 overflow-y-auto"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Nav bar */}
        <div className="flex items-center px-4 pt-6 pb-1">
          <button onClick={onBack} className="p-2 -ml-2 active:opacity-60">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-white">CarPool</span>
          <div className="w-9" />
        </div>

        {/* Heading */}
        <div className="px-6 pt-1 pb-4">
          <h1 className="text-2xl font-extrabold text-white leading-snug">
            Welcome to <span className="text-brand-400">CarPool</span>
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Find or offer rides on any route, in seconds.
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

  const mobileInputRef = useRef<HTMLInputElement>(null);
  const digitRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Auto-focus mobile input when entering mobile phase
  useEffect(() => {
    if (phase === "mobile") {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [phase]);

  // Auto-focus first OTP box when entering OTP phase
  useEffect(() => {
    if (phase === "otp") {
      setCountdown(60);
      setCanResend(false);
      setTimeout(() => digitRefs.current[0]?.focus(), 100);

      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); setCanResend(true); return 0; }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
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

  // OTP digit input handler — auto-advance and auto-backtrack
  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setError(null);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    digitRefs.current[focusIdx]?.focus();
  };

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
            Find or offer rides on any route, in seconds.
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
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
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

  // ── Mobile phase ──────────────────────────────────────────────────────────
  if (phase === "mobile") {
    return (
      <DarkShell onBack={() => { setMobile(""); setError(null); setPhase("splash"); }}>
        <div className="mx-4 bg-white rounded-2xl p-5 mb-3">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Get Started</h2>
          <p className="text-sm text-gray-500 mb-4">Enter your phone number to continue.</p>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Phone Number</p>
          <div className="flex items-center bg-gray-100 rounded-xl px-3 py-1 gap-2">
            <span className="text-lg leading-none">🇮🇳</span>
            <span className="text-sm font-semibold text-gray-700">+91</span>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <input
              ref={mobileInputRef}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="00000 00000"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                setError(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && mobile.length === 10) handleSendOtp(); }}
              className="flex-1 bg-transparent text-base font-medium text-gray-900 placeholder-gray-400 tracking-widest outline-none py-2"
            />
            {mobile.length > 0 && (
              <span className="text-xs text-gray-400 shrink-0">{mobile.length}/10</span>
            )}
          </div>

          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

          <button
            onClick={handleSendOtp}
            disabled={loading || mobile.length !== 10}
            className="mt-4 w-full bg-brand-700 text-white font-semibold py-3 rounded-xl text-sm active:bg-brand-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Sending OTP…" : "Continue"}
          </button>
        </div>
      </DarkShell>
    );
  }

  // ── OTP phase ─────────────────────────────────────────────────────────────
  if (phase === "otp") {
    return (
      <DarkShell onBack={() => { setDigits(Array(6).fill("")); setError(null); setPhase("mobile"); }}>
        <div className="mx-4 bg-white rounded-2xl p-5 mb-3">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Verify OTP</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sent to <span className="font-medium text-gray-700">{maskedMobile}</span>
          </p>

          {/* Dev hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
            <span className="text-base">🔑</span>
            <p className="text-blue-700 text-xs">Dev OTP: <span className="font-bold tracking-widest">123456</span></p>
          </div>

          {/* 6 digit inputs */}
          <div className="grid grid-cols-6 gap-2 mb-3" onPaste={handleDigitPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { digitRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(i, e)}
                className={`w-full h-12 text-center rounded-xl border-2 text-xl font-bold outline-none transition-colors ${
                  d ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 bg-gray-50 text-gray-900 focus:border-brand-400"
                }`}
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

          <button
            onClick={handleVerifyOtp}
            disabled={loading || digits.join("").length < 6}
            className="w-full bg-brand-700 text-white font-semibold py-3 rounded-xl text-sm active:bg-brand-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Verifying…" : "Verify OTP"}
          </button>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => { setPhase("mobile"); setDigits(Array(6).fill("")); setError(null); }}
              className="text-xs text-gray-500 underline underline-offset-2"
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
      </DarkShell>
    );
  }

  // ── Register phase ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-6 pt-14 pb-6 text-white" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)" }}>
        <h1 className="text-xl font-bold">CarPool</h1>
        <p className="text-brand-200 text-xs mt-0.5">Share rides · Save money</p>
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
