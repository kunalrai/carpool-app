import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAction, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

type Phase = "splash" | "mobile" | "otp" | "register";

// ── Floating orb ──────────────────────────────────────────────────────────

function Orb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <motion.div
      animate={{ y: [0, -20, 0], scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
      transition={{ repeat: Infinity, duration: 5 + delay, ease: "easeInOut", delay }}
      style={{
        position: "absolute", left: x, top: y,
        width: size, height: size, borderRadius: "50%",
        background: color, filter: "blur(50px)", pointerEvents: "none",
      }}
    />
  );
}

// ── TaraAI avatar ─────────────────────────────────────────────────────────

function TaraAvatar({ size = 56 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", flexShrink: 0,
      boxShadow: "0 8px 32px rgba(99,102,241,0.5)",
    }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, transparent 60%)",
      }} />
      <span style={{ color: "white", fontWeight: 900, fontSize: size * 0.28, position: "relative" }}>AI</span>
    </div>
  );
}

// ── Dark shell for mobile/otp phases ─────────────────────────────────────

function DarkShell({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Orb x="5%" y="8%" size={280} color="rgba(37,99,235,0.4)" delay={0} />
      <Orb x="55%" y="3%" size={240} color="rgba(124,58,237,0.35)" delay={1.5} />
      <Orb x="15%" y="55%" size={200} color="rgba(5,150,105,0.25)" delay={2.5} />

      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)",
        backgroundSize: "50px 50px",
      }} />

      <div style={{ position: "relative", zIndex: 10, flex: 1, overflowY: "auto", paddingTop: "env(safe-area-inset-top)" }}>
        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", padding: "1.5rem 1rem 0.5rem" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
            style={{ padding: "0.5rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "0.625rem", cursor: "pointer", display: "flex" }}>
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, color: "white" }} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </motion.button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{
              fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>CarPool</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* Heading */}
        <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <TaraAvatar size={40} />
            <div>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 900, color: "white", margin: 0, lineHeight: 1.2 }}>Welcome back</h1>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>TaraAI is ready to find your ride</p>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

// ── Gradient input field style ────────────────────────────────────────────

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(99,102,241,0.25)",
  borderRadius: "1.25rem",
  padding: "1.25rem",
  backdropFilter: "blur(12px)",
  margin: "0 1rem 0.75rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(99,102,241,0.3)",
  borderRadius: "0.75rem", padding: "0.875rem 1rem", color: "white",
  fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: "0.4rem",
};

const gradientBtn: React.CSSProperties = {
  width: "100%", background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
  color: "white", fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: "pointer",
  padding: "0.9rem", borderRadius: "0.875rem", marginTop: "0.75rem",
  boxShadow: "0 6px 24px rgba(99,102,241,0.45)",
};

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

  useEffect(() => {
    if (phase === "mobile") setTimeout(() => mobileInputRef.current?.focus(), 100);
  }, [phase]);

  useEffect(() => {
    if (phase === "otp") {
      setCountdown(60); setCanResend(false);
      setTimeout(() => digitRefs.current[0]?.focus(), 100);
      const timer = setInterval(() => {
        setCountdown((c) => { if (c <= 1) { clearInterval(timer); setCanResend(true); return 0; } return c - 1; });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) { setError("Enter a valid 10-digit Indian mobile number"); return; }
    setError(null); setLoading(true);
    try { await sendOtp({ mobile }); setPhase("otp"); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    const otp = digits.join("");
    if (otp.length < 6) { setError("Enter the 6-digit OTP"); return; }
    setError(null); setLoading(true);
    try {
      const result = await verifyOtp({ mobile, otp });
      if (result.isNewUser) { setPhase("register"); }
      else { login(result.userId! as Id<"users">); navigate("/home", { replace: true }); }
    } catch (e) { setError(e instanceof Error ? e.message : "OTP verification failed"); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim()) { setError("Display name is required"); return; }
    if (offerRides) {
      if (!carName.trim()) { setError("Car name is required"); return; }
      if (!carColor.trim()) { setError("Car color is required"); return; }
      if (!carNumber.trim()) { setError("Car number is required"); return; }
    }
    setError(null); setLoading(true);
    try {
      const userId = await registerUser({
        mobile, name: name.trim(), role: offerRides ? "both" : "taker",
        carName: offerRides ? carName.trim() : undefined,
        carColor: offerRides ? carColor.trim() : undefined,
        carNumber: offerRides ? carNumber.trim() : undefined,
      });
      login(userId); navigate("/home", { replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : "Registration failed"); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setDigits(Array(6).fill("")); setError(null); setLoading(true);
    try { await sendOtp({ mobile }); setPhase("otp"); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to resend OTP"); }
    finally { setLoading(false); }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setError(null);
    setDigits((prev) => { const next = [...prev]; next[index] = digit; return next; });
    if (digit && index < 5) digitRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) digitRefs.current[index - 1]?.focus();
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    digitRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const maskedMobile = `+91 ${mobile.slice(0, 2)}${"•".repeat(6)}${mobile.slice(8)}`;

  // ── Splash ───────────────────────────────────────────────────────────────
  if (phase === "splash") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <Orb x="5%" y="5%" size={320} color="rgba(37,99,235,0.4)" delay={0} />
        <Orb x="50%" y="2%" size={280} color="rgba(124,58,237,0.35)" delay={1.5} />
        <Orb x="10%" y="50%" size={240} color="rgba(5,150,105,0.2)" delay={3} />
        <Orb x="65%" y="60%" size={200} color="rgba(239,68,68,0.15)" delay={2} />

        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
        }} />

        {/* 3D perspective card in background */}
        <motion.div
          animate={{ rotateX: [0, 4, 0], rotateY: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          style={{
            position: "absolute", top: "8%", right: "-5%", width: 220, height: 140,
            background: "linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(124,58,237,0.2) 100%)",
            border: "1px solid rgba(99,102,241,0.3)", borderRadius: "1.25rem",
            transformStyle: "preserve-3d", perspective: 800,
            backdropFilter: "blur(8px)", pointerEvents: "none",
          }}
        >
          <div style={{ padding: "1rem", color: "rgba(255,255,255,0.7)", fontSize: "0.7rem" }}>
            <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#a78bfa" }}>🚗 Today's Ride</div>
            <div style={{ marginTop: "0.25rem", color: "rgba(255,255,255,0.45)" }}>8:30 AM · 2 seats left</div>
            <div style={{ marginTop: "0.5rem", background: "rgba(99,102,241,0.3)", borderRadius: "0.5rem", padding: "0.25rem 0.5rem", display: "inline-block", fontWeight: 700, color: "#60a5fa" }}>₹80/seat</div>
          </div>
        </motion.div>

        <motion.div
          animate={{ rotateX: [0, -3, 0], rotateY: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 2 }}
          style={{
            position: "absolute", top: "22%", left: "-8%", width: 180, height: 100,
            background: "linear-gradient(135deg, rgba(5,150,105,0.25) 0%, rgba(13,148,136,0.2) 100%)",
            border: "1px solid rgba(5,150,105,0.3)", borderRadius: "1rem",
            transformStyle: "preserve-3d", perspective: 800,
            backdropFilter: "blur(8px)", pointerEvents: "none",
          }}
        >
          <div style={{ padding: "0.875rem", color: "rgba(255,255,255,0.7)", fontSize: "0.7rem" }}>
            <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "#34d399" }}>✓ Booking Confirmed</div>
            <div style={{ color: "rgba(255,255,255,0.45)" }}>Driver: Priya S.</div>
          </div>
        </motion.div>

        {/* Bottom sheet */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.2 }}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(15,23,42,0.95)", backdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(99,102,241,0.2)", borderRadius: "2rem 2rem 0 0",
            padding: "2rem 1.5rem", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
          }}
        >
          {/* Brand + TaraAI */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.5rem" }}>
            <TaraAvatar size={52} />
            <div>
              <div style={{
                fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1,
                background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>CarPool</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "0.1rem" }}>
                Powered by TaraAI
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: "0.5rem" }}>
            The Smarter<br />
            <span style={{ background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Daily Commute
            </span>
          </h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Post or find a ride — guided by AI in seconds.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {[{ icon: "✓", text: "OTP Verified" }, { icon: "⚡", text: "Instant" }, { icon: "₹0", text: "No Fees" }].map(f => (
              <div key={f.text} style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
                background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "9999px", padding: "0.3rem 0.75rem",
                fontSize: "0.72rem", fontWeight: 700, color: "#a5b4fc",
              }}>
                <span>{f.icon}</span><span>{f.text}</span>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={() => setPhase("mobile")}
            style={{ ...gradientBtn, marginTop: 0, marginBottom: "0.75rem" }}>
            Get Started Free →
          </motion.button>
          <button onClick={() => setPhase("mobile")}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.875rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.9rem", padding: "0.875rem", cursor: "pointer" }}>
            Log In
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Mobile phase ──────────────────────────────────────────────────────────
  if (phase === "mobile") {
    return (
      <DarkShell onBack={() => { setMobile(""); setError(null); setPhase("splash"); }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={glassCard}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white", marginBottom: "0.25rem" }}>Enter your number</h2>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.25rem" }}>We'll send a one-time code to verify you</p>

          <label style={labelStyle}>Phone Number</label>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "0.75rem", padding: "0.25rem 0.75rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🇮🇳</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", borderRight: "1px solid rgba(255,255,255,0.15)", paddingRight: "0.5rem" }}>+91</span>
            <input
              ref={mobileInputRef}
              type="tel" inputMode="numeric" maxLength={10}
              placeholder="00000 00000"
              value={mobile}
              onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && mobile.length === 10) handleSendOtp(); }}
              style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: "0.95rem", fontWeight: 500, outline: "none", padding: "0.625rem 0", letterSpacing: "0.1em" }}
            />
            {mobile.length > 0 && <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>{mobile.length}/10</span>}
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.5rem", background: "rgba(239,68,68,0.1)", padding: "0.4rem 0.75rem", borderRadius: "0.5rem" }}>
              {error}
            </motion.p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSendOtp}
            disabled={loading || mobile.length !== 10}
            style={{ ...gradientBtn, opacity: loading || mobile.length !== 10 ? 0.45 : 1 }}>
            {loading ? "Sending OTP…" : "Continue →"}
          </motion.button>
        </motion.div>
      </DarkShell>
    );
  }

  // ── OTP phase ─────────────────────────────────────────────────────────────
  if (phase === "otp") {
    return (
      <DarkShell onBack={() => { setDigits(Array(6).fill("")); setError(null); setPhase("mobile"); }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={glassCard}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white", marginBottom: "0.25rem" }}>Verify OTP</h2>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.25rem" }}>
            Sent to <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{maskedMobile}</span>
          </p>

          {/* Dev hint */}
          <div style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.35)", borderRadius: "0.625rem", padding: "0.5rem 0.75rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🔑</span>
            <span style={{ color: "#93c5fd", fontSize: "0.75rem" }}>Dev OTP: <strong style={{ letterSpacing: "0.15em" }}>123456</strong></span>
          </div>

          {/* 6 digit inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "0.5rem", marginBottom: "0.75rem" }} onPaste={handleDigitPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { digitRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(i, e)}
                style={{
                  width: "100%", height: 52, textAlign: "center", borderRadius: "0.75rem",
                  border: `2px solid ${d ? "rgba(99,102,241,0.8)" : "rgba(99,102,241,0.25)"}`,
                  background: d ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                  color: d ? "#a78bfa" : "white", fontSize: "1.3rem", fontWeight: 800,
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              />
            ))}
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: "#f87171", fontSize: "0.75rem", marginBottom: "0.5rem", background: "rgba(239,68,68,0.1)", padding: "0.4rem 0.75rem", borderRadius: "0.5rem" }}>
              {error}
            </motion.p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleVerifyOtp}
            disabled={loading || digits.join("").length < 6}
            style={{ ...gradientBtn, marginTop: 0, opacity: loading || digits.join("").length < 6 ? 0.45 : 1 }}>
            {loading ? "Verifying…" : "Verify OTP →"}
          </motion.button>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.875rem" }}>
            <button onClick={() => { setPhase("mobile"); setDigits(Array(6).fill("")); setError(null); }}
              style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Change number
            </button>
            {canResend ? (
              <button onClick={handleResend} disabled={loading}
                style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                Resend OTP
              </button>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                Resend in {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}
              </span>
            )}
          </div>
        </motion.div>
      </DarkShell>
    );
  }

  // ── Register phase ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", position: "relative", overflow: "hidden" }}>
      <Orb x="5%" y="5%" size={280} color="rgba(37,99,235,0.35)" delay={0} />
      <Orb x="55%" y="3%" size={240} color="rgba(124,58,237,0.3)" delay={1.5} />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)", padding: "3.5rem 1.5rem 1.5rem", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <TaraAvatar size={40} />
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "white" }}>Complete your profile</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Just a few details and you're set</div>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 10, padding: "1.5rem", overflowY: "auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "1.25rem", padding: "1.5rem" }}>

          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Display Name *</label>
            <input type="text" placeholder="e.g. Rahul Sharma" value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }} autoFocus style={inputStyle} />
          </div>

          {/* Offer rides toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "white", margin: 0 }}>I also want to offer rides</p>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", margin: "0.1rem 0 0" }}>Add your car details to post rides</p>
            </div>
            <button type="button" onClick={() => { setOfferRides(v => !v); setError(null); }}
              style={{ position: "relative", width: 48, height: 26, borderRadius: "9999px", border: "none", cursor: "pointer", transition: "background 0.2s", background: offerRides ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(255,255,255,0.15)", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 3, left: offerRides ? 25 : 3, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
            </button>
          </div>

          <AnimatePresence>
            {offerRides && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }} style={{ overflow: "hidden", marginBottom: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {[
                    { label: "Car Name *", placeholder: "e.g. Swift Dzire", value: carName, onChange: setCarName },
                    { label: "Car Color *", placeholder: "e.g. Silver", value: carColor, onChange: setCarColor },
                    { label: "Car Number *", placeholder: "e.g. UP14 AB 1234", value: carNumber, onChange: (v: string) => setCarNumber(v.toUpperCase()) },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={labelStyle}>{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={f.value}
                        onChange={(e) => { f.onChange(e.target.value); setError(null); }} style={inputStyle} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: "#f87171", fontSize: "0.8rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.625rem", padding: "0.5rem 0.875rem", marginBottom: "1rem" }}>
              {error}
            </motion.p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleRegister} disabled={loading}
            style={{ ...gradientBtn, marginTop: 0, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Setting up…" : "Get Started →"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
