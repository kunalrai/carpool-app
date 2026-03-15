import { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

type Phase = "splash" | "mobile" | "otp" | "register";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=80";

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phase, setPhase] = useState<Phase>("splash");
  const [mobile, setMobile] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

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

  useEffect(() => {
    if (phase === "otp") setTimeout(() => digitRefs.current[0]?.focus(), 100);
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
        setIsNewUser(true);
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

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError(null);
    if (value && index < 5) digitRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setDigits(newDigits);
    digitRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const maskedMobile = `+91 ${mobile.slice(0, 2)}${"•".repeat(6)}${mobile.slice(8)}`;

  // ── Splash Screen ────────────────────────────────────────────────────────
  if (phase === "splash") {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gray-900">
        {/* Hero image */}
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay so card blends in */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60" />

        {/* Bottom sheet card */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 pt-7 pb-8"
             style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>

          {/* Heading */}
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
            The Smarter<br />
            <span className="text-brand-700">Commute</span>
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            Fixed fare ₹80 per seat · GaurCity ↔ HCL campus. Book or offer a ride in seconds.
          </p>

          {/* Feature badges */}
          <div className="flex gap-3 mb-6">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
              <span className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fixed ₹80</span>
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

          {/* Get Started CTA */}
          <button
            onClick={() => setPhase("mobile")}
            className="w-full bg-brand-700 text-white font-semibold py-4 rounded-2xl text-base active:bg-brand-800 transition-colors mb-4"
          >
            Get Started
          </button>

          {/* Log In link */}
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            <button
              onClick={() => setPhase("mobile")}
              className="font-semibold text-gray-700 active:opacity-60"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── OTP + Register: full white screen ────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Compact header */}
      <div className="bg-brand-700 px-6 pt-14 pb-6 text-white">
        <h1 className="text-xl font-bold">GC Carpool</h1>
        <p className="text-brand-200 text-xs mt-0.5">₹80 fixed fare · Gaur City ↔ HCL</p>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto">

        {/* ── Phase: Mobile ── */}
        {phase === "mobile" && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Enter your mobile</h2>
            <p className="text-gray-500 text-sm mb-6">We'll send you a one-time password</p>

            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent mb-4">
              <span className="px-4 py-3 bg-gray-50 text-gray-600 font-medium border-r border-gray-300 select-none">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className="flex-1 px-4 py-3 text-base outline-none bg-white"
                autoFocus
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={loading || mobile.length < 10}
              className="btn-primary mb-4"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>

            <button
              onClick={() => setPhase("splash")}
              className="w-full text-sm text-gray-500 text-center active:opacity-60"
            >
              Back
            </button>
          </div>
        )}

        {/* ── Phase: OTP ── */}
        {phase === "otp" && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Verify OTP</h2>
            <p className="text-gray-500 text-sm mb-4">
              Sent to <span className="font-medium text-gray-700">{maskedMobile}</span>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-6 flex items-center gap-2">
              <span className="text-blue-500 text-lg">🔑</span>
              <p className="text-blue-700 text-sm">
                Use OTP: <span className="font-bold tracking-widest">123456</span>
              </p>
            </div>

            <div className="flex gap-2 justify-between mb-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { digitRefs.current[i] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-brand-600 transition-colors"
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || digits.join("").length < 6}
              className="btn-primary mb-4"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => { setPhase("mobile"); setDigits(Array(6).fill("")); setError(null); }}
                className="text-gray-500 underline-offset-2 hover:underline"
              >
                Change number
              </button>
              {canResend ? (
                <button onClick={handleResend} disabled={loading} className="text-brand-700 font-semibold">
                  Resend OTP
                </button>
              ) : (
                <span className="text-gray-400">
                  Resend in {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Phase: Register ── */}
        {phase === "register" && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Complete your profile</h2>
            <p className="text-gray-500 text-sm mb-6">You're new here — tell us a bit about yourself</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                className="input-field"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl mb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">I also want to offer rides</p>
                <p className="text-xs text-gray-500 mt-0.5">Add your car details to post rides</p>
              </div>
              <button
                type="button"
                onClick={() => setOfferRides((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${offerRides ? "bg-brand-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${offerRides ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ${offerRides ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Car Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Swift Dzire" value={carName} onChange={(e) => { setCarName(e.target.value); setError(null); }} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Car Color <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Silver" value={carColor} onChange={(e) => { setCarColor(e.target.value); setError(null); }} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Car Number <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. UP14 AB 1234" value={carNumber} onChange={(e) => { setCarNumber(e.target.value.toUpperCase()); setError(null); }} className="input-field" />
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button onClick={handleRegister} disabled={loading} className="btn-primary">
              {loading ? "Setting up…" : "Get Started"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
