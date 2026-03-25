import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// ── TaraAI Avatar ──────────────────────────────────────────────────────────

function TaraAvatar({ size = 48 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, transparent 60%)",
      }} />
      <span style={{ color: "white", fontWeight: 800, fontSize: size * 0.28, position: "relative" }}>AI</span>
    </div>
  );
}

// ── Floating Orb ───────────────────────────────────────────────────────────

function FloatOrb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <motion.div
      animate={{ y: [0, -24, 0], scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
      transition={{ repeat: Infinity, duration: 6 + delay, ease: "easeInOut", delay }}
      style={{
        position: "absolute", left: x, top: y,
        width: size, height: size, borderRadius: "50%",
        background: color, filter: "blur(60px)", pointerEvents: "none",
      }}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  const fadeUp = {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55 },
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0f172a", color: "white", overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(15,23,42,0.7)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(99,102,241,0.15)",
        padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
          <span style={{
            fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>CarPool</span>
          <div style={{ display: "flex", gap: "1.5rem" }} className="hidden md:flex">
            {["How It Works", "Blog"].map(label => (
              <button key={label}
                onClick={() => label === "Blog" ? navigate("/blog") : document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => navigate("/login")}
            style={{ color: "#93c5fd", fontWeight: 600, fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", padding: "0.5rem 1rem" }}
            className="hidden sm:block">
            Log In
          </button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/login")}
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              color: "white", fontWeight: 700, fontSize: "0.875rem", border: "none", cursor: "pointer",
              padding: "0.6rem 1.4rem", borderRadius: "9999px",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            }}>
            Get Started
          </motion.button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "6rem 1.5rem 5rem", minHeight: "85vh", display: "flex", alignItems: "center" }}>
        {/* Animated orbs */}
        <FloatOrb x="5%" y="10%" size={400} color="rgba(37,99,235,0.35)" delay={0} />
        <FloatOrb x="60%" y="5%" size={350} color="rgba(124,58,237,0.3)" delay={1.5} />
        <FloatOrb x="20%" y="60%" size={300} color="rgba(5,150,105,0.2)" delay={3} />
        <FloatOrb x="75%" y="55%" size={280} color="rgba(239,68,68,0.15)" delay={2} />

        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div style={{ maxWidth: "64rem", margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: "9999px", marginBottom: "2rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            <span style={{ color: "#a5b4fc" }}>Powered by TaraAI · Smart Commutes</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            style={{ fontSize: "clamp(2.8rem,8vw,5.5rem)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: "1.5rem" }}>
            Smarter Rides.<br />
            <span style={{ background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Share the Way.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.6)", maxWidth: "36rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>
            The community carpooling app for daily commuters. Post a ride or find a seat — guided by TaraAI in seconds.
          </motion.p>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/login")}
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                color: "white", fontWeight: 700, fontSize: "1rem", border: "none", cursor: "pointer",
                padding: "0.875rem 2.5rem", borderRadius: "9999px",
                boxShadow: "0 8px 32px rgba(99,102,241,0.5)",
              }}>
              Start Riding Free →
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/login")}
              style={{
                color: "white", fontWeight: 600, fontSize: "1rem",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
                padding: "0.875rem 2rem", borderRadius: "9999px", backdropFilter: "blur(8px)",
              }}>
              Offer a Ride
            </motion.button>
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "3rem" }}>
            <div style={{ display: "flex" }}>
              {["AK","SR","PM","RV"].map((initials, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: "50%", border: "2px solid #0f172a",
                  marginLeft: i > 0 ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700, color: "white",
                  background: ["#2563eb","#7c3aed","#059669","#dc2626"][i],
                }}>{initials}</div>
              ))}
            </div>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
              <strong style={{ color: "white" }}>2,000+ commuters</strong> sharing rides daily
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── TaraAI Feature ── */}
      <section style={{ padding: "5rem 1.5rem", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
          <motion.div {...fadeUp} style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.5rem", borderRadius: "9999px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "1.5rem" }}>
              <TaraAvatar size={32} />
              <span style={{ fontWeight: 700, fontSize: "0.875rem", background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Meet TaraAI</span>
            </div>
            <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1rem" }}>
              Your AI Ride Guide.<br />
              <span style={{ background: "linear-gradient(135deg,#a78bfa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Always Online.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.05rem", maxWidth: "36rem", margin: "0 auto", lineHeight: 1.7 }}>
              No forms, no menus. Just chat with TaraAI to post your ride, find a seat, or set up a weekly commute.
            </p>
          </motion.div>

          {/* Chat demo mockup */}
          <motion.div {...fadeUp} transition={{ duration: 0.55, delay: 0.1 }}
            style={{
              maxWidth: "28rem", margin: "0 auto",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: "1.5rem", overflow: "hidden",
              boxShadow: "0 20px 60px rgba(99,102,241,0.2)",
            }}>
            {/* Chat header */}
            <div style={{ padding: "1rem 1.25rem", background: "linear-gradient(135deg,#1e3a8a,#312e81)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <TaraAvatar size={40} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "white" }}>TaraAI</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <motion.span animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 1.8 }}
                    style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>Online · Your ride guide</span>
                </div>
              </div>
            </div>
            {/* Messages */}
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { from: "tara", text: "Hi! I'm TaraAI 🙏 Want to offer a ride or find one?" },
                { from: "user", text: "I want to offer a ride to Noida Sector 62" },
                { from: "tara", text: "Great! Where are you starting from? 📍" },
                { from: "user", text: "Gaur City 2, Greater Noida West" },
                { from: "tara", text: "Perfect route! What time do you depart? 🕐" },
              ].map((msg, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: msg.from === "user" ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.4 }}
                  style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "0.5rem" }}>
                  {msg.from === "tara" && <TaraAvatar size={24} />}
                  <div style={{
                    maxWidth: "78%", padding: "0.6rem 0.9rem", fontSize: "0.8rem", lineHeight: 1.5,
                    background: msg.from === "user" ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(255,255,255,0.08)",
                    color: msg.from === "user" ? "white" : "rgba(255,255,255,0.85)",
                    border: msg.from === "tara" ? "1px solid rgba(99,102,241,0.2)" : "none",
                    borderRadius: msg.from === "user" ? "1rem 1rem 0.2rem 1rem" : "1rem 1rem 1rem 0.2rem",
                  }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Action buttons in chat */}
            <div style={{ padding: "0 1.25rem 1.25rem", display: "flex", gap: "0.5rem" }}>
              {[{ label: "🚗 Offer Ride", bg: "linear-gradient(135deg,#2563eb,#1d4ed8)" }, { label: "🙋 Find Ride", bg: "linear-gradient(135deg,#7c3aed,#9333ea)" }].map(btn => (
                <button key={btn.label} onClick={() => navigate("/login")}
                  style={{ flex: 1, padding: "0.6rem", borderRadius: "0.75rem", background: btn.bg, color: "white", fontWeight: 700, fontSize: "0.75rem", border: "none", cursor: "pointer" }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: "5rem 1.5rem", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1.5rem" }}>
          {[
            { val: "2,000+", label: "Active Riders", icon: "👥" },
            { val: "4", label: "Seats Per Ride", icon: "🪑" },
            { val: "₹0", label: "Platform Fee", icon: "💸" },
            { val: "24/7", label: "TaraAI Online", icon: "🤖" },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: "1.5rem", padding: "2rem 1.5rem", textAlign: "center",
              }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{s.icon}</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.25rem" }}>{s.val}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features Bento ── */}
      <section style={{ padding: "5rem 1.5rem", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
          <motion.div {...fadeUp} style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              Built for daily commuters.<br />
              <span style={{ background: "linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Refined with AI.
              </span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: "32rem" }}>Everything you need for a smooth commute, every day.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.25rem" }}>
            {[
              {
                cols: "span 12 / span 12",
                gradient: "linear-gradient(135deg,#1e3a8a 0%,#312e81 100%)",
                icon: "⚡",
                tag: "REAL-TIME",
                title: "Live Ride Feed",
                desc: "Rides appear the instant drivers post them. No refresh needed — real-time updates via Convex.",
                style: { minHeight: 240 },
              },
              {
                cols: "span 12 / span 12",
                gradient: "linear-gradient(135deg,#059669 0%,#0d9488 100%)",
                icon: "🔁",
                tag: "SMART",
                title: "Recurring Rides",
                desc: "Set once, auto-posts every week. TaraAI manages your schedule so you never forget.",
                style: { minHeight: 240 },
              },
              {
                cols: "span 12 / span 12",
                gradient: "linear-gradient(135deg,#7c3aed 0%,#9333ea 100%)",
                icon: "🗣️",
                tag: "AI CHAT",
                title: "Talk to TaraAI",
                desc: "Post rides via conversation. No forms, just chat.",
                style: { minHeight: 200 },
              },
              {
                cols: "span 12 / span 12",
                gradient: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
                border: "1px solid rgba(99,102,241,0.2)",
                icon: "💬",
                tag: "CONNECTED",
                title: "Group Chat + Calls",
                desc: "Every ride has its own group chat. Voice call your carpool before you set off.",
                style: { minHeight: 200 },
              },
            ].map((card, i) => (
              <motion.div key={card.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  gridColumn: card.cols, background: card.gradient,
                  border: card.border ?? "none",
                  borderRadius: "1.75rem", padding: "2.5rem",
                  display: "flex", flexDirection: "column", justifyContent: "flex-end",
                  position: "relative", overflow: "hidden",
                  ...card.style,
                }}>
                <div style={{ position: "absolute", top: "50%", right: "1.5rem", transform: "translateY(-50%)", fontSize: "5rem", opacity: 0.15, pointerEvents: "none" }}>
                  {card.icon}
                </div>
                <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "0.75rem", display: "block" }}>{card.tag}</span>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "0.5rem" }}>{card.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: "28rem" }}>{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" style={{ padding: "5rem 1.5rem", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
          <motion.div {...fadeUp} style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              Three steps.<br />
              <span style={{ background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One commute.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}>From sign-up to seat booked in under a minute.</p>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1.5rem" }}>
            {[
              { num: "01", title: "Sign Up", desc: "Enter your mobile, verify with OTP. Ready in 30 seconds — no password.", gradient: "linear-gradient(135deg,#1e3a8a,#312e81)" },
              { num: "02", title: "Chat with TaraAI", desc: "Tell TaraAI if you want to offer or find a ride. She'll guide you step by step.", gradient: "linear-gradient(135deg,#7c3aed,#9333ea)" },
              { num: "03", title: "Ride & Pay", desc: "Coordinate via group chat or voice call. Pay your driver directly when you board.", gradient: "linear-gradient(135deg,#059669,#0d9488)" },
            ].map((s, i) => (
              <motion.div key={s.num}
                initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
                style={{
                  background: s.gradient, borderRadius: "1.75rem",
                  padding: "2.5rem 2rem", position: "relative", overflow: "hidden",
                }}>
                <div style={{ position: "absolute", top: "1.5rem", right: "1.5rem", fontSize: "3.5rem", fontWeight: 900, color: "rgba(255,255,255,0.1)" }}>{s.num}</div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", marginBottom: "0.75rem", marginTop: "2rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "4rem 1.5rem 6rem", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
        <motion.div {...fadeUp}
          style={{
            maxWidth: "56rem", margin: "0 auto",
            background: "linear-gradient(135deg,#1e3a8a 0%,#312e81 50%,#4c1d95 100%)",
            borderRadius: "2rem", padding: "4rem 2.5rem", textAlign: "center",
            position: "relative", overflow: "hidden",
            boxShadow: "0 24px 80px rgba(99,102,241,0.35)",
          }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.07),transparent)", pointerEvents: "none" }} />
          <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
            <TaraAvatar size={56} />
          </div>
          <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, color: "white", marginBottom: "1rem", letterSpacing: "-0.03em" }}>
            Join the smarter commute.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.05rem", maxWidth: "32rem", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            Your neighbours are already sharing daily rides. Free to join — just your phone number.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/login")}
              style={{ background: "white", color: "#1e3a8a", fontWeight: 800, fontSize: "1rem", border: "none", cursor: "pointer", padding: "0.875rem 2.5rem", borderRadius: "9999px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              Start Riding Free
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/login")}
              style={{ color: "white", fontWeight: 700, fontSize: "1rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", padding: "0.875rem 2rem", borderRadius: "9999px" }}>
              Offer a Ride
            </motion.button>
          </div>
          <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>Install as PWA · Works Offline · No App Store</p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "3rem 1.5rem", borderTop: "1px solid rgba(99,102,241,0.1)", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "2.5rem", marginBottom: "2.5rem" }}>
            <div style={{ maxWidth: "18rem" }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 900, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block", marginBottom: "0.75rem" }}>CarPool</span>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.7 }}>The community carpooling app. Fast, secure, and community-run.</p>
            </div>
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              {[
                { heading: "Product", items: [{ label: "Find a Ride", to: null }, { label: "Offer a Ride", to: null }, { label: "Blog", to: "/blog" }] },
                { heading: "Legal", items: [{ label: "Privacy Policy", to: "/privacy" }, { label: "Terms", to: "/terms" }, { label: "Data Safety", to: "/data-safety" }] },
              ].map(col => (
                <div key={col.heading} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.25rem" }}>{col.heading}</span>
                  {col.items.map(item => (
                    item.to ? (
                      <button key={item.label} onClick={() => navigate(item.to!)}
                        style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                        {item.label}
                      </button>
                    ) : (
                      <span key={item.label} style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>{item.label}</span>
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(99,102,241,0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>© 2025 CarPool. Built for the community.</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>Share rides · Save money · Reduce traffic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
