import React, { useEffect } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.mjs";
import { useQuery, ConvexProvider, ConvexReactClient } from "convex/react";
import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { componentsGeneric, anyApi } from "convex/server";
function TaraAvatar({ size = 48 }) {
  return /* @__PURE__ */ jsxs("div", { style: {
    width: size,
    height: size,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
    overflow: "hidden"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, transparent 60%)"
    } }),
    /* @__PURE__ */ jsx("span", { style: { color: "white", fontWeight: 800, fontSize: size * 0.28, position: "relative" }, children: "AI" })
  ] });
}
function FloatOrb({ x, y, size, color, delay }) {
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      animate: { y: [0, -24, 0], scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] },
      transition: { repeat: Infinity, duration: 6 + delay, ease: "easeInOut", delay },
      style: {
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: "blur(60px)",
        pointerEvents: "none"
      }
    }
  );
}
function LandingPage() {
  const navigate = useNavigate();
  const fadeUp = {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55 }
  };
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "'Inter', sans-serif", background: "#0f172a", color: "white", overflowX: "hidden" }, children: [
    /* @__PURE__ */ jsxs("nav", { style: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "rgba(15,23,42,0.7)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(99,102,241,0.15)",
      padding: "1rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "2.5rem" }, children: [
        /* @__PURE__ */ jsx("span", { style: {
          fontSize: "1.4rem",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }, children: "CarPool" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "1.5rem" }, className: "hidden md:flex", children: ["How It Works", "Blog"].map((label) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              var _a;
              return label === "Blog" ? navigate("/blog") : (_a = document.getElementById("how")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
            },
            style: { color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", fontWeight: 500, background: "none", border: "none", cursor: "pointer" },
            children: label
          },
          label
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "0.75rem", alignItems: "center" }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => navigate("/login"),
            style: { color: "#93c5fd", fontWeight: 600, fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", padding: "0.5rem 1rem" },
            className: "hidden sm:block",
            children: "Log In"
          }
        ),
        /* @__PURE__ */ jsx(
          motion.button,
          {
            whileHover: { scale: 1.04 },
            whileTap: { scale: 0.96 },
            onClick: () => navigate("/login"),
            style: {
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
              padding: "0.6rem 1.4rem",
              borderRadius: "9999px",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)"
            },
            children: "Get Started"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { position: "relative", overflow: "hidden", padding: "6rem 1.5rem 5rem", minHeight: "85vh", display: "flex", alignItems: "center" }, children: [
      /* @__PURE__ */ jsx(FloatOrb, { x: "5%", y: "10%", size: 400, color: "rgba(37,99,235,0.35)", delay: 0 }),
      /* @__PURE__ */ jsx(FloatOrb, { x: "60%", y: "5%", size: 350, color: "rgba(124,58,237,0.3)", delay: 1.5 }),
      /* @__PURE__ */ jsx(FloatOrb, { x: "20%", y: "60%", size: 300, color: "rgba(5,150,105,0.2)", delay: 3 }),
      /* @__PURE__ */ jsx(FloatOrb, { x: "75%", y: "55%", size: 280, color: "rgba(239,68,68,0.15)", delay: 2 }),
      /* @__PURE__ */ jsx("div", { style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      } }),
      /* @__PURE__ */ jsxs("div", { style: { maxWidth: "64rem", margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }, children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5 },
            style: { display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: "9999px", marginBottom: "2rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" },
            children: [
              /* @__PURE__ */ jsx(
                motion.span,
                {
                  animate: { scale: [1, 1.4, 1] },
                  transition: { repeat: Infinity, duration: 1.8 },
                  style: { width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }
                }
              ),
              /* @__PURE__ */ jsx("span", { style: { color: "#a5b4fc" }, children: "Powered by TaraAI · Smart Commutes" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          motion.h1,
          {
            initial: { opacity: 0, y: 32 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.1 },
            style: { fontSize: "clamp(2.8rem,8vw,5.5rem)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: "1.5rem" },
            children: [
              "Smarter Rides.",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("span", { style: { background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, children: "Share the Way." })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          motion.p,
          {
            initial: { opacity: 0, y: 24 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.2 },
            style: { fontSize: "1.15rem", color: "rgba(255,255,255,0.6)", maxWidth: "36rem", lineHeight: 1.7, marginBottom: "2.5rem" },
            children: "The community carpooling app for daily commuters. Post a ride or find a seat — guided by TaraAI in seconds."
          }
        ),
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.3 },
            style: { display: "flex", gap: "1rem", flexWrap: "wrap" },
            children: [
              /* @__PURE__ */ jsx(
                motion.button,
                {
                  whileHover: { scale: 1.04, y: -2 },
                  whileTap: { scale: 0.96 },
                  onClick: () => navigate("/login"),
                  style: {
                    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.875rem 2.5rem",
                    borderRadius: "9999px",
                    boxShadow: "0 8px 32px rgba(99,102,241,0.5)"
                  },
                  children: "Start Riding Free →"
                }
              ),
              /* @__PURE__ */ jsx(
                motion.button,
                {
                  whileHover: { scale: 1.02 },
                  whileTap: { scale: 0.96 },
                  onClick: () => navigate("/login"),
                  style: {
                    color: "white",
                    fontWeight: 600,
                    fontSize: "1rem",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    cursor: "pointer",
                    padding: "0.875rem 2rem",
                    borderRadius: "9999px",
                    backdropFilter: "blur(8px)"
                  },
                  children: "Offer a Ride"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { delay: 0.7 },
            style: { display: "flex", alignItems: "center", gap: "1rem", marginTop: "3rem" },
            children: [
              /* @__PURE__ */ jsx("div", { style: { display: "flex" }, children: ["AK", "SR", "PM", "RV"].map((initials, i) => /* @__PURE__ */ jsx("div", { style: {
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "2px solid #0f172a",
                marginLeft: i > 0 ? -10 : 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "white",
                background: ["#2563eb", "#7c3aed", "#059669", "#dc2626"][i]
              }, children: initials }, i)) }),
              /* @__PURE__ */ jsxs("p", { style: { fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }, children: [
                /* @__PURE__ */ jsx("strong", { style: { color: "white" }, children: "2,000+ commuters" }),
                " sharing rides daily"
              ] })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { style: { padding: "5rem 1.5rem", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(99,102,241,0.1)" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: "64rem", margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs(motion.div, { ...fadeUp, style: { textAlign: "center", marginBottom: "3rem" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.5rem", borderRadius: "9999px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "1.5rem" }, children: [
          /* @__PURE__ */ jsx(TaraAvatar, { size: 32 }),
          /* @__PURE__ */ jsx("span", { style: { fontWeight: 700, fontSize: "0.875rem", background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, children: "Meet TaraAI" })
        ] }),
        /* @__PURE__ */ jsxs("h2", { style: { fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1rem" }, children: [
          "Your AI Ride Guide.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { style: { background: "linear-gradient(135deg,#a78bfa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, children: "Always Online." })
        ] }),
        /* @__PURE__ */ jsx("p", { style: { color: "rgba(255,255,255,0.55)", fontSize: "1.05rem", maxWidth: "36rem", margin: "0 auto", lineHeight: 1.7 }, children: "No forms, no menus. Just chat with TaraAI to post your ride, find a seat, or set up a weekly commute." })
      ] }),
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          ...fadeUp,
          transition: { duration: 0.55, delay: 0.1 },
          style: {
            maxWidth: "28rem",
            margin: "0 auto",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "1.5rem",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(99,102,241,0.2)"
          },
          children: [
            /* @__PURE__ */ jsxs("div", { style: { padding: "1rem 1.25rem", background: "linear-gradient(135deg,#1e3a8a,#312e81)", display: "flex", alignItems: "center", gap: "0.75rem" }, children: [
              /* @__PURE__ */ jsx(TaraAvatar, { size: 40 }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, fontSize: "0.95rem", color: "white" }, children: "TaraAI" }),
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.3rem" }, children: [
                  /* @__PURE__ */ jsx(
                    motion.span,
                    {
                      animate: { opacity: [1, 0.3, 1] },
                      transition: { repeat: Infinity, duration: 1.8 },
                      style: { width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { style: { fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }, children: "Online · Your ride guide" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }, children: [
              { from: "tara", text: "Hi! I'm TaraAI 🙏 Want to offer a ride or find one?" },
              { from: "user", text: "I want to offer a ride to Noida Sector 62" },
              { from: "tara", text: "Great! Where are you starting from? 📍" },
              { from: "user", text: "Gaur City 2, Greater Noida West" },
              { from: "tara", text: "Perfect route! What time do you depart? 🕐" }
            ].map((msg, i) => /* @__PURE__ */ jsxs(
              motion.div,
              {
                initial: { opacity: 0, x: msg.from === "user" ? 20 : -20 },
                whileInView: { opacity: 1, x: 0 },
                viewport: { once: true },
                transition: { delay: i * 0.12, duration: 0.4 },
                style: { display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "0.5rem" },
                children: [
                  msg.from === "tara" && /* @__PURE__ */ jsx(TaraAvatar, { size: 24 }),
                  /* @__PURE__ */ jsx("div", { style: {
                    maxWidth: "78%",
                    padding: "0.6rem 0.9rem",
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    background: msg.from === "user" ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(255,255,255,0.08)",
                    color: msg.from === "user" ? "white" : "rgba(255,255,255,0.85)",
                    border: msg.from === "tara" ? "1px solid rgba(99,102,241,0.2)" : "none",
                    borderRadius: msg.from === "user" ? "1rem 1rem 0.2rem 1rem" : "1rem 1rem 1rem 0.2rem"
                  }, children: msg.text })
                ]
              },
              i
            )) }),
            /* @__PURE__ */ jsx("div", { style: { padding: "0 1.25rem 1.25rem", display: "flex", gap: "0.5rem" }, children: [{ label: "🚗 Offer Ride", bg: "linear-gradient(135deg,#2563eb,#1d4ed8)" }, { label: "🙋 Find Ride", bg: "linear-gradient(135deg,#7c3aed,#9333ea)" }].map((btn) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => navigate("/login"),
                style: { flex: 1, padding: "0.6rem", borderRadius: "0.75rem", background: btn.bg, color: "white", fontWeight: 700, fontSize: "0.75rem", border: "none", cursor: "pointer" },
                children: btn.label
              },
              btn.label
            )) })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("section", { style: { padding: "5rem 1.5rem", borderTop: "1px solid rgba(99,102,241,0.1)" }, children: /* @__PURE__ */ jsx("div", { style: { maxWidth: "64rem", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1.5rem" }, children: [
      { val: "2,000+", label: "Active Riders", icon: "👥" },
      { val: "4", label: "Seats Per Ride", icon: "🪑" },
      { val: "₹0", label: "Platform Fee", icon: "💸" },
      { val: "24/7", label: "TaraAI Online", icon: "🤖" }
    ].map((s, i) => /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { delay: i * 0.08, duration: 0.5 },
        style: {
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: "1.5rem",
          padding: "2rem 1.5rem",
          textAlign: "center"
        },
        children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: "2rem", marginBottom: "0.5rem" }, children: s.icon }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "2.2rem", fontWeight: 900, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.25rem" }, children: s.val }),
          /* @__PURE__ */ jsx("div", { style: { color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 500 }, children: s.label })
        ]
      },
      s.label
    )) }) }),
    /* @__PURE__ */ jsx("section", { style: { padding: "5rem 1.5rem", borderTop: "1px solid rgba(99,102,241,0.1)" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: "64rem", margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs(motion.div, { ...fadeUp, style: { marginBottom: "3rem" }, children: [
        /* @__PURE__ */ jsxs("h2", { style: { fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.75rem" }, children: [
          "Built for daily commuters.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { style: { background: "linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, children: "Refined with AI." })
        ] }),
        /* @__PURE__ */ jsx("p", { style: { color: "rgba(255,255,255,0.5)", maxWidth: "32rem" }, children: "Everything you need for a smooth commute, every day." })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.25rem" }, children: [
        {
          cols: "span 12 / span 12",
          gradient: "linear-gradient(135deg,#1e3a8a 0%,#312e81 100%)",
          icon: "⚡",
          tag: "REAL-TIME",
          title: "Live Ride Feed",
          desc: "Rides appear the instant drivers post them. No refresh needed — real-time updates via Convex.",
          style: { minHeight: 240 }
        },
        {
          cols: "span 12 / span 12",
          gradient: "linear-gradient(135deg,#059669 0%,#0d9488 100%)",
          icon: "🔁",
          tag: "SMART",
          title: "Recurring Rides",
          desc: "Set once, auto-posts every week. TaraAI manages your schedule so you never forget.",
          style: { minHeight: 240 }
        },
        {
          cols: "span 12 / span 12",
          gradient: "linear-gradient(135deg,#7c3aed 0%,#9333ea 100%)",
          icon: "🗣️",
          tag: "AI CHAT",
          title: "Talk to TaraAI",
          desc: "Post rides via conversation. No forms, just chat.",
          style: { minHeight: 200 }
        },
        {
          cols: "span 12 / span 12",
          gradient: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
          icon: "💬",
          tag: "CONNECTED",
          title: "Group Chat + Calls",
          desc: "Every ride has its own group chat. Voice call your carpool before you set off.",
          style: { minHeight: 200 }
        }
      ].map((card, i) => /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: i * 0.1, duration: 0.5 },
          style: {
            gridColumn: card.cols,
            background: card.gradient,
            border: card.border ?? "none",
            borderRadius: "1.75rem",
            padding: "2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            position: "relative",
            overflow: "hidden",
            ...card.style
          },
          children: [
            /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: "50%", right: "1.5rem", transform: "translateY(-50%)", fontSize: "5rem", opacity: 0.15, pointerEvents: "none" }, children: card.icon }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "0.75rem", display: "block" }, children: card.tag }),
            /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "0.5rem" }, children: card.title }),
            /* @__PURE__ */ jsx("p", { style: { fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: "28rem" }, children: card.desc })
          ]
        },
        card.title
      )) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "how", style: { padding: "5rem 1.5rem", borderTop: "1px solid rgba(99,102,241,0.1)" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: "64rem", margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs(motion.div, { ...fadeUp, style: { textAlign: "center", marginBottom: "3.5rem" }, children: [
        /* @__PURE__ */ jsxs("h2", { style: { fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.75rem" }, children: [
          "Three steps.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { style: { background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, children: "One commute." })
        ] }),
        /* @__PURE__ */ jsx("p", { style: { color: "rgba(255,255,255,0.5)", fontSize: "1rem" }, children: "From sign-up to seat booked in under a minute." })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1.5rem" }, children: [
        { num: "01", title: "Sign Up", desc: "Enter your mobile, verify with OTP. Ready in 30 seconds — no password.", gradient: "linear-gradient(135deg,#1e3a8a,#312e81)" },
        { num: "02", title: "Chat with TaraAI", desc: "Tell TaraAI if you want to offer or find a ride. She'll guide you step by step.", gradient: "linear-gradient(135deg,#7c3aed,#9333ea)" },
        { num: "03", title: "Ride & Pay", desc: "Coordinate via group chat or voice call. Pay your driver directly when you board.", gradient: "linear-gradient(135deg,#059669,#0d9488)" }
      ].map((s, i) => /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 32 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: i * 0.12, duration: 0.5 },
          style: {
            background: s.gradient,
            borderRadius: "1.75rem",
            padding: "2.5rem 2rem",
            position: "relative",
            overflow: "hidden"
          },
          children: [
            /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: "1.5rem", right: "1.5rem", fontSize: "3.5rem", fontWeight: 900, color: "rgba(255,255,255,0.1)" }, children: s.num }),
            /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.4rem", fontWeight: 800, color: "white", marginBottom: "0.75rem", marginTop: "2rem" }, children: s.title }),
            /* @__PURE__ */ jsx("p", { style: { fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }, children: s.desc })
          ]
        },
        s.num
      )) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { style: { padding: "4rem 1.5rem 6rem", borderTop: "1px solid rgba(99,102,241,0.1)" }, children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        ...fadeUp,
        style: {
          maxWidth: "56rem",
          margin: "0 auto",
          background: "linear-gradient(135deg,#1e3a8a 0%,#312e81 50%,#4c1d95 100%)",
          borderRadius: "2rem",
          padding: "4rem 2.5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(99,102,241,0.35)"
        },
        children: [
          /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: 0, right: 0, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.07),transparent)", pointerEvents: "none" } }),
          /* @__PURE__ */ jsx("div", { style: { marginBottom: "1.5rem", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsx(TaraAvatar, { size: 56 }) }),
          /* @__PURE__ */ jsx("h2", { style: { fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, color: "white", marginBottom: "1rem", letterSpacing: "-0.03em" }, children: "Join the smarter commute." }),
          /* @__PURE__ */ jsx("p", { style: { color: "rgba(255,255,255,0.6)", fontSize: "1.05rem", maxWidth: "32rem", margin: "0 auto 2.5rem", lineHeight: 1.7 }, children: "Your neighbours are already sharing daily rides. Free to join — just your phone number." }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsx(
              motion.button,
              {
                whileHover: { scale: 1.05, y: -2 },
                whileTap: { scale: 0.96 },
                onClick: () => navigate("/login"),
                style: { background: "white", color: "#1e3a8a", fontWeight: 800, fontSize: "1rem", border: "none", cursor: "pointer", padding: "0.875rem 2.5rem", borderRadius: "9999px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
                children: "Start Riding Free"
              }
            ),
            /* @__PURE__ */ jsx(
              motion.button,
              {
                whileHover: { scale: 1.03 },
                whileTap: { scale: 0.96 },
                onClick: () => navigate("/login"),
                style: { color: "white", fontWeight: 700, fontSize: "1rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", padding: "0.875rem 2rem", borderRadius: "9999px" },
                children: "Offer a Ride"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { style: { marginTop: "2rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }, children: "Install as PWA · Works Offline · No App Store" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx("footer", { style: { padding: "3rem 1.5rem", borderTop: "1px solid rgba(99,102,241,0.1)", background: "rgba(0,0,0,0.2)" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: "64rem", margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "2.5rem", marginBottom: "2.5rem" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { maxWidth: "18rem" }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: "1.4rem", fontWeight: 900, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block", marginBottom: "0.75rem" }, children: "CarPool" }),
          /* @__PURE__ */ jsx("p", { style: { color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.7 }, children: "The community carpooling app. Fast, secure, and community-run." })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "3rem", flexWrap: "wrap" }, children: [
          { heading: "Product", items: [{ label: "Find a Ride", to: null }, { label: "Offer a Ride", to: null }, { label: "Blog", to: "/blog" }] },
          { heading: "Legal", items: [{ label: "Privacy Policy", to: "/privacy" }, { label: "Terms", to: "/terms" }, { label: "Data Safety", to: "/data-safety" }] }
        ].map((col) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "0.6rem" }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.25rem" }, children: col.heading }),
          col.items.map((item) => item.to ? /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => navigate(item.to),
              style: { color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 },
              children: item.label
            },
            item.label
          ) : /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }, children: item.label }, item.label))
        ] }, col.heading)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { borderTop: "1px solid rgba(99,102,241,0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }, children: "© 2025 CarPool. Built for the community." }),
        /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }, children: "Share rides · Save money · Reduce traffic" })
      ] })
    ] }) })
  ] });
}
const api = anyApi;
componentsGeneric();
const C$3 = {
  primary: "#003d9b",
  surface: "#faf8ff",
  surfaceContainerLow: "#f3f3fd",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#191b23",
  onSurfaceVariant: "#434654",
  outline: "#737685",
  outlineVariant: "#c3c6d6",
  secondaryContainer: "#c7dfff",
  onSecondaryContainer: "#4b637e"
};
function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function BlogsPage() {
  const navigate = useNavigate();
  const blogs = useQuery(api.blogs.getPublishedBlogs);
  useEffect(() => {
    document.title = "Carpooling Tips & Stories — CarPool Blog";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Practical guides and real stories on saving money, cutting commute stress, and building greener habits through daily carpooling.");
  }, []);
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "'Inter', sans-serif", background: C$3.surface }, className: "min-h-screen", children: [
    /* @__PURE__ */ jsxs(
      "nav",
      {
        className: "sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between border-b",
        style: { background: "rgba(250,248,255,0.85)", backdropFilter: "blur(20px)", borderColor: C$3.outlineVariant + "33" },
        children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => navigate("/"),
              className: "font-extrabold text-xl tracking-tight",
              style: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: C$3.primary },
              children: "GC Ridepool"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => navigate("/login"),
              className: "px-5 py-2 rounded-full text-sm font-semibold text-white",
              style: { background: C$3.primary },
              children: "Sign In"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx("section", { className: "px-6 md:px-16 py-16 md:py-24", style: { background: C$3.surfaceContainerLow }, children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsx(
        "span",
        {
          className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6",
          style: { background: C$3.secondaryContainer, color: C$3.onSecondaryContainer },
          children: "✍️ Community Blog"
        }
      ),
      /* @__PURE__ */ jsxs(
        "h1",
        {
          className: "text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight",
          style: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: C$3.onSurface },
          children: [
            "Commute smarter.",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { style: { color: C$3.primary }, children: "Read, learn, share." })
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-lg max-w-xl", style: { color: C$3.onSurfaceVariant }, children: "Tips, stories, and guides for City ↔ HCL commuters." })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "px-6 md:px-16 py-16", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
      blogs === void 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx("div", { className: "rounded-2xl border animate-pulse", style: { background: C$3.surfaceContainerLowest, borderColor: C$3.outlineVariant + "33", height: 240 } }, i)) }),
      (blogs == null ? void 0 : blogs.length) === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-24", children: [
        /* @__PURE__ */ jsx("p", { className: "text-4xl mb-4", children: "✍️" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold mb-1", style: { color: C$3.onSurface }, children: "No articles yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", style: { color: C$3.outline }, children: "Check back soon — articles are on the way." })
      ] }),
      blogs && blogs.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: blogs.map((post, i) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => navigate(`/blog/${post.slug}`),
          className: "text-left rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow group",
          style: { background: C$3.surfaceContainerLowest, borderColor: C$3.outlineVariant + "22" },
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex items-center justify-center text-5xl",
                style: {
                  height: 140,
                  background: [
                    `linear-gradient(135deg, #dae2ff, #c7dfff)`,
                    `linear-gradient(135deg, #c7dfff, #d1e4ff)`,
                    `linear-gradient(135deg, #ffdbcf, #ffe8e0)`
                  ][i % 3]
                },
                children: post.coverEmoji ?? "📝"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
              post.tags && post.tags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 mb-3", children: post.tags.slice(0, 3).map((tag) => /* @__PURE__ */ jsx(
                "span",
                {
                  className: "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  style: { background: C$3.secondaryContainer, color: C$3.onSecondaryContainer },
                  children: tag
                },
                tag
              )) }),
              /* @__PURE__ */ jsx(
                "h2",
                {
                  className: "text-base font-bold mb-2 leading-snug group-hover:text-blue-800 transition-colors line-clamp-2",
                  style: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: C$3.onSurface },
                  children: post.title
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-xs leading-relaxed mb-4 line-clamp-3", style: { color: C$3.onSurfaceVariant }, children: post.excerpt }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px]", style: { color: C$3.outline }, children: formatDate(post.publishedAt ?? post.createdAt) })
            ] })
          ]
        },
        post._id
      )) })
    ] }) }),
    /* @__PURE__ */ jsx("footer", { className: "px-6 md:px-16 py-10 border-t", style: { borderColor: C$3.outlineVariant + "33" }, children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", style: { color: C$3.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }, children: "GC Ridepool" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-xs", style: { color: C$3.outline }, children: [
        /* @__PURE__ */ jsx("button", { onClick: () => navigate("/privacy"), className: "hover:underline", children: "Privacy" }),
        /* @__PURE__ */ jsx("button", { onClick: () => navigate("/terms"), className: "hover:underline", children: "Terms" }),
        /* @__PURE__ */ jsx("button", { onClick: () => navigate("/data-safety"), className: "hover:underline", children: "Data Safety" })
      ] })
    ] }) })
  ] });
}
const C$2 = {
  primary: "#003d9b",
  surface: "#faf8ff",
  onSurface: "#191b23",
  onSurfaceVariant: "#434654",
  outline: "#737685",
  outlineVariant: "#c3c6d6"
};
function Section$2({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-10", children: [
    /* @__PURE__ */ jsx(
      "h2",
      {
        className: "text-xl font-bold mb-3",
        style: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: C$2.onSurface },
        children: title
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "text-sm leading-relaxed space-y-3", style: { color: C$2.onSurfaceVariant }, children })
  ] });
}
function PrivacyPolicy() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Privacy Policy — CarPool";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Read how CarPool collects, uses, and protects your personal data. We never sell your information.");
  }, []);
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "'Inter', sans-serif", background: C$2.surface }, className: "min-h-screen", children: [
    /* @__PURE__ */ jsxs(
      "nav",
      {
        className: "sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center gap-4 border-b",
        style: { background: "rgba(250,248,255,0.85)", backdropFilter: "blur(20px)", borderColor: C$2.outlineVariant + "33" },
        children: [
          /* @__PURE__ */ jsx("button", { onClick: () => navigate(-1), className: "text-sm font-medium hover:underline", style: { color: C$2.primary }, children: "← Back" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", style: { color: C$2.onSurface }, children: "Privacy Policy" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-6 md:px-10 py-14", children: [
      /* @__PURE__ */ jsx(
        "h1",
        {
          className: "text-4xl font-extrabold mb-2 tracking-tight",
          style: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: C$2.onSurface },
          children: "Privacy Policy"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-sm mb-10", style: { color: C$2.outline }, children: "Last updated: March 2025" }),
      /* @__PURE__ */ jsxs(Section$2, { title: "1. Information We Collect", children: [
        /* @__PURE__ */ jsx("p", { children: "We collect the following information when you register or use GC Ridepool:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 pl-2", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Mobile number" }),
            " — used for OTP-based authentication only."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Name" }),
            " — displayed to co-riders and drivers you share a ride with."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Profile photo" }),
            " — optional; stored securely and displayed to ride participants."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Vehicle details" }),
            " — required for drivers (car name, colour, number plate)."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Ride activity" }),
            " — listings posted, bookings made, and messages sent."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Section$2, { title: "2. How We Use Your Information", children: [
        /* @__PURE__ */ jsx("p", { children: "Your information is used solely to operate the GC Ridepool service:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 pl-2", children: [
          /* @__PURE__ */ jsx("li", { children: "Authenticating your identity via OTP (no passwords are stored)." }),
          /* @__PURE__ */ jsx("li", { children: "Matching riders with drivers for the City ↔ HCL commute." }),
          /* @__PURE__ */ jsx("li", { children: "Enabling in-app group chat and voice calls between ride participants." }),
          /* @__PURE__ */ jsx("li", { children: "Sending push notifications about your bookings and listings." })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "We do ",
          /* @__PURE__ */ jsx("strong", { children: "not" }),
          " sell, rent, or share your personal data with third-party advertisers."
        ] })
      ] }),
      /* @__PURE__ */ jsx(Section$2, { title: "3. Phone Number Privacy", children: /* @__PURE__ */ jsxs("p", { children: [
        "Your mobile number is ",
        /* @__PURE__ */ jsx("strong", { children: "never" }),
        " displayed to other users. Drivers and co-riders can communicate through in-app chat and internet voice calls without ever seeing each other's phone numbers."
      ] }) }),
      /* @__PURE__ */ jsx(Section$2, { title: "4. Data Storage", children: /* @__PURE__ */ jsx("p", { children: "Your data is stored on Convex, a secure cloud database. Profile photos are stored in Convex managed object storage. All data is encrypted at rest and in transit." }) }),
      /* @__PURE__ */ jsxs(Section$2, { title: "5. Third-Party Services", children: [
        /* @__PURE__ */ jsx("p", { children: "We use the following third-party services to operate the app:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 pl-2", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "MSG91" }),
            " — for delivering OTP SMS messages."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Firebase Cloud Messaging" }),
            " — for push notifications."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Daily.co" }),
            " — for in-app internet voice calls (audio only)."
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Each service has its own privacy policy. We share only the minimum data required for each service to function." })
      ] }),
      /* @__PURE__ */ jsx(Section$2, { title: "6. Data Retention", children: /* @__PURE__ */ jsx("p", { children: "Your account data is retained while your account is active. You may request deletion of your account and all associated data by contacting us. Ride history and messages may be retained for up to 90 days after deletion for safety purposes." }) }),
      /* @__PURE__ */ jsxs(Section$2, { title: "7. Your Rights", children: [
        /* @__PURE__ */ jsx("p", { children: "You have the right to:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 pl-2", children: [
          /* @__PURE__ */ jsx("li", { children: "Access the personal data we hold about you." }),
          /* @__PURE__ */ jsx("li", { children: "Request correction of inaccurate data." }),
          /* @__PURE__ */ jsx("li", { children: "Request deletion of your account and data." }),
          /* @__PURE__ */ jsx("li", { children: "Withdraw consent for push notifications at any time from your device settings." })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Section$2, { title: "8. Contact", children: /* @__PURE__ */ jsx("p", { children: "For any privacy-related queries, please reach out via the community chat inside the app or contact the administrator." }) }),
      /* @__PURE__ */ jsx("div", { className: "pt-10 border-t mt-10 text-xs", style: { borderColor: C$2.outlineVariant + "33", color: C$2.outline }, children: "© 2025 GC Ridepool · City ↔ HCL Tech Park" })
    ] })
  ] });
}
const C$1 = {
  primary: "#003d9b",
  surface: "#faf8ff",
  onSurface: "#191b23",
  onSurfaceVariant: "#434654",
  outline: "#737685",
  outlineVariant: "#c3c6d6"
};
function Section$1({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-10", children: [
    /* @__PURE__ */ jsx(
      "h2",
      {
        className: "text-xl font-bold mb-3",
        style: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: C$1.onSurface },
        children: title
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "text-sm leading-relaxed space-y-3", style: { color: C$1.onSurfaceVariant }, children })
  ] });
}
function TermsOfService() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Terms of Service — CarPool";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "The rules and guidelines governing your use of the CarPool community carpooling platform.");
  }, []);
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "'Inter', sans-serif", background: C$1.surface }, className: "min-h-screen", children: [
    /* @__PURE__ */ jsxs(
      "nav",
      {
        className: "sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center gap-4 border-b",
        style: { background: "rgba(250,248,255,0.85)", backdropFilter: "blur(20px)", borderColor: C$1.outlineVariant + "33" },
        children: [
          /* @__PURE__ */ jsx("button", { onClick: () => navigate(-1), className: "text-sm font-medium hover:underline", style: { color: C$1.primary }, children: "← Back" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", style: { color: C$1.onSurface }, children: "Terms of Service" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-6 md:px-10 py-14", children: [
      /* @__PURE__ */ jsx(
        "h1",
        {
          className: "text-4xl font-extrabold mb-2 tracking-tight",
          style: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: C$1.onSurface },
          children: "Terms of Service"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-sm mb-10", style: { color: C$1.outline }, children: "Last updated: March 2025" }),
      /* @__PURE__ */ jsx(Section$1, { title: "1. Acceptance of Terms", children: /* @__PURE__ */ jsx("p", { children: "By registering or using GC Ridepool, you agree to these Terms of Service. If you do not agree, please do not use the app. We may update these terms from time to time; continued use of the app constitutes acceptance of any changes." }) }),
      /* @__PURE__ */ jsx(Section$1, { title: "2. Eligibility", children: /* @__PURE__ */ jsx("p", { children: "GC Ridepool is intended for residents of City (GC1 / GC2) and employees of HCL Tech Park, Noida. You must provide a valid Indian mobile number to register. By using the app you confirm that the information you provide is accurate." }) }),
      /* @__PURE__ */ jsxs(Section$1, { title: "3. User Conduct", children: [
        /* @__PURE__ */ jsx("p", { children: "You agree to:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 pl-2", children: [
          /* @__PURE__ */ jsx("li", { children: "Use the app only for legitimate carpooling between City and HCL campus." }),
          /* @__PURE__ */ jsx("li", { children: "Be punctual and honour commitments made to drivers and co-riders." }),
          /* @__PURE__ */ jsx("li", { children: "Treat all other users with respect in chats and voice calls." }),
          /* @__PURE__ */ jsx("li", { children: "Not share offensive, abusive, or illegal content in any chat." }),
          /* @__PURE__ */ jsx("li", { children: "Not use the app to solicit or conduct any commercial activity." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Section$1, { title: "4. Drivers", children: [
        /* @__PURE__ */ jsx("p", { children: 'Users who offer rides ("Drivers") agree to:' }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 pl-2", children: [
          /* @__PURE__ */ jsx("li", { children: "Provide accurate vehicle information (name, colour, registration number)." }),
          /* @__PURE__ */ jsx("li", { children: "Hold a valid Indian driving licence and vehicle insurance." }),
          /* @__PURE__ */ jsx("li", { children: "Maintain their vehicle in a safe and roadworthy condition." }),
          /* @__PURE__ */ jsx("li", { children: "Not exceed the posted number of seats (maximum 4 riders)." }),
          /* @__PURE__ */ jsx("li", { children: "Cancel a listing promptly if they are unable to complete the ride." })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Section$1, { title: "5. Payments", children: /* @__PURE__ */ jsx("p", { children: "GC Ridepool is a peer-to-peer platform. All fare payments are made directly between riders and drivers in cash. GC Ridepool does not process, hold, or take any commission on payments. Any fare disputes are between the rider and driver." }) }),
      /* @__PURE__ */ jsx(Section$1, { title: "6. Cancellations", children: /* @__PURE__ */ jsx("p", { children: "Drivers may cancel a listing at any time before the ride starts. Riders may cancel a booking at any time. Repeated no-shows or last-minute cancellations may result in account suspension at the administrator's discretion." }) }),
      /* @__PURE__ */ jsxs(Section$1, { title: "7. Safety & Liability", children: [
        /* @__PURE__ */ jsx("p", { children: "GC Ridepool is a community platform and does not operate, control, or insure any vehicle. All carpooling arrangements are voluntary agreements between users. GC Ridepool is not liable for any loss, injury, or damage arising from the use of the app or participation in any ride." }),
        /* @__PURE__ */ jsx("p", { children: "Users are responsible for their own safety. If you feel unsafe, exit the vehicle immediately and contact emergency services." })
      ] }),
      /* @__PURE__ */ jsx(Section$1, { title: "8. Account Suspension", children: /* @__PURE__ */ jsx("p", { children: "We reserve the right to suspend or terminate any account that violates these terms, engages in abusive behaviour, or is flagged by multiple users. Suspended users will not be able to post listings or join rides." }) }),
      /* @__PURE__ */ jsx(Section$1, { title: "9. Governing Law", children: /* @__PURE__ */ jsx("p", { children: "These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of the courts in Noida, Uttar Pradesh." }) }),
      /* @__PURE__ */ jsx(Section$1, { title: "10. Contact", children: /* @__PURE__ */ jsx("p", { children: "For any queries regarding these terms, please contact the administrator via the community chat inside the app." }) }),
      /* @__PURE__ */ jsx("div", { className: "pt-10 border-t mt-10 text-xs", style: { borderColor: C$1.outlineVariant + "33", color: C$1.outline }, children: "© 2025 GC Ridepool" })
    ] })
  ] });
}
const C = {
  primary: "#003d9b",
  surface: "#faf8ff",
  surfaceContainerLow: "#f3f3fd",
  onSurface: "#191b23",
  onSurfaceVariant: "#434654",
  outline: "#737685",
  outlineVariant: "#c3c6d6"
};
function SafetyRow({ label, status, note }) {
  const badge = {
    "collected": { text: "Collected", bg: "#dcfce7", color: "#166534" },
    "not-collected": { text: "Not Collected", bg: "#f1f5f9", color: "#475569" },
    "optional": { text: "Optional", bg: "#fef9c3", color: "#854d0e" }
  };
  const b = badge[status];
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 py-3 border-b", style: { borderColor: C.outlineVariant + "33" }, children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", style: { color: C.onSurface }, children: label }),
      note && /* @__PURE__ */ jsx("p", { className: "text-xs mt-0.5", style: { color: C.outline }, children: note })
    ] }),
    /* @__PURE__ */ jsx("span", { className: "shrink-0 text-xs font-bold px-2.5 py-1 rounded-full", style: { background: b.bg, color: b.color }, children: b.text })
  ] });
}
function Section({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-10", children: [
    /* @__PURE__ */ jsx(
      "h2",
      {
        className: "text-xl font-bold mb-4",
        style: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface },
        children: title
      }
    ),
    children
  ] });
}
function DataSafety() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Data Safety — CarPool";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "See exactly what data CarPool collects on Android and iOS, why we collect it, and how it is kept safe.");
  }, []);
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "'Inter', sans-serif", background: C.surface }, className: "min-h-screen", children: [
    /* @__PURE__ */ jsxs(
      "nav",
      {
        className: "sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center gap-4 border-b",
        style: { background: "rgba(250,248,255,0.85)", backdropFilter: "blur(20px)", borderColor: C.outlineVariant + "33" },
        children: [
          /* @__PURE__ */ jsx("button", { onClick: () => navigate(-1), className: "text-sm font-medium hover:underline", style: { color: C.primary }, children: "← Back" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", style: { color: C.onSurface }, children: "Data Safety" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-6 md:px-10 py-14", children: [
      /* @__PURE__ */ jsx(
        "h1",
        {
          className: "text-4xl font-extrabold mb-2 tracking-tight",
          style: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface },
          children: "Data Safety"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-sm mb-4", style: { color: C.outline }, children: "Last updated: March 2025" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed mb-10", style: { color: C.onSurfaceVariant }, children: "A clear summary of what data GC Ridepool collects, why it's collected, and how it's protected. We believe you have the right to know exactly what happens with your information." }),
      /* @__PURE__ */ jsxs(Section, { title: "Data We Collect", children: [
        /* @__PURE__ */ jsx(SafetyRow, { label: "Mobile Number", status: "collected", note: "Used for OTP login only. Never shown to other users." }),
        /* @__PURE__ */ jsx(SafetyRow, { label: "Name", status: "collected", note: "Displayed to co-riders and drivers during a shared ride." }),
        /* @__PURE__ */ jsx(SafetyRow, { label: "Profile Photo", status: "optional", note: "You can use the app without a photo." }),
        /* @__PURE__ */ jsx(SafetyRow, { label: "Vehicle Details (drivers only)", status: "collected", note: "Car name, colour, and registration number." }),
        /* @__PURE__ */ jsx(SafetyRow, { label: "Email Address", status: "optional", note: "Not required; only stored if you add it to your profile." }),
        /* @__PURE__ */ jsx(SafetyRow, { label: "FCM Token", status: "collected", note: "Required to deliver push notifications to your device." }),
        /* @__PURE__ */ jsx(SafetyRow, { label: "Location / GPS", status: "not-collected", note: "We never track your real-time location." }),
        /* @__PURE__ */ jsx(SafetyRow, { label: "Payment Information", status: "not-collected", note: "All payments are made in cash directly to drivers." }),
        /* @__PURE__ */ jsx(SafetyRow, { label: "Contacts / Address Book", status: "not-collected" }),
        /* @__PURE__ */ jsx(SafetyRow, { label: "Device Identifiers", status: "not-collected" })
      ] }),
      /* @__PURE__ */ jsx(Section, { title: "Data Sharing", children: /* @__PURE__ */ jsxs("div", { className: "text-sm leading-relaxed space-y-3", style: { color: C.onSurfaceVariant }, children: [
        /* @__PURE__ */ jsx("p", { children: "We share limited data with the following third parties to operate the service:" }),
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden border", style: { borderColor: C.outlineVariant + "44" }, children: [
          { party: "MSG91", purpose: "Delivering OTP SMS messages", data: "Mobile number only" },
          { party: "Firebase (Google)", purpose: "Push notifications", data: "FCM device token" },
          { party: "Daily.co", purpose: "In-app internet voice calls", data: "Display name, room token" },
          { party: "Convex", purpose: "Database & file storage", data: "All app data (encrypted)" }
        ].map((row, i) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "grid grid-cols-3 gap-4 px-5 py-3 text-xs border-b last:border-b-0",
            style: { borderColor: C.outlineVariant + "22", background: i % 2 === 0 ? C.surfaceContainerLow : "white" },
            children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold", style: { color: C.onSurface }, children: row.party }),
              /* @__PURE__ */ jsx("span", { style: { color: C.onSurfaceVariant }, children: row.purpose }),
              /* @__PURE__ */ jsx("span", { style: { color: C.outline }, children: row.data })
            ]
          },
          i
        )) }),
        /* @__PURE__ */ jsxs("p", { children: [
          "We do ",
          /* @__PURE__ */ jsx("strong", { children: "not" }),
          " sell your data to advertisers or any other commercial third parties."
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Section, { title: "How We Protect Your Data", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        { icon: "🔒", title: "Encrypted in Transit", desc: "All data is sent over HTTPS / TLS. No plain-text communication." },
        { icon: "🗄️", title: "Encrypted at Rest", desc: "Data stored in Convex is encrypted at the storage layer." },
        { icon: "📵", title: "No Phone Number Exposure", desc: "Your mobile number is stripped before any data reaches other users." },
        { icon: "🔑", title: "OTP-Only Auth", desc: "No passwords are ever stored. Authentication uses one-time codes only." }
      ].map((item) => /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl border", style: { background: "white", borderColor: C.outlineVariant + "33" }, children: [
        /* @__PURE__ */ jsx("p", { className: "text-xl mb-2", children: item.icon }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold mb-1", style: { color: C.onSurface }, children: item.title }),
        /* @__PURE__ */ jsx("p", { className: "text-xs leading-relaxed", style: { color: C.onSurfaceVariant }, children: item.desc })
      ] }, item.title)) }) }),
      /* @__PURE__ */ jsx(Section, { title: "Your Data Rights", children: /* @__PURE__ */ jsxs("div", { className: "text-sm leading-relaxed space-y-2", style: { color: C.onSurfaceVariant }, children: [
        /* @__PURE__ */ jsx("p", { children: "You can, at any time:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 pl-2", children: [
          /* @__PURE__ */ jsx("li", { children: "Edit your profile name, photo, and vehicle details inside the app." }),
          /* @__PURE__ */ jsx("li", { children: "Disable push notifications from your device settings." }),
          /* @__PURE__ */ jsx("li", { children: "Request full deletion of your account and all associated data by contacting the administrator." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "pt-10 border-t mt-10 text-xs", style: { borderColor: C.outlineVariant + "33", color: C.outline }, children: "© 2025 GC Ridepool ·" })
    ] })
  ] });
}
const ROUTE_COMPONENTS = {
  "/": LandingPage,
  "/blog": BlogsPage,
  "/privacy": PrivacyPolicy,
  "/terms": TermsOfService,
  "/data-safety": DataSafety
};
let _convex = null;
function getConvex(url) {
  if (!_convex) _convex = new ConvexReactClient(url);
  return _convex;
}
function render(route, convexUrl) {
  const Component = ROUTE_COMPONENTS[route] ?? LandingPage;
  const convex = getConvex(convexUrl);
  return renderToString(
    React.createElement(
      ConvexProvider,
      { client: convex },
      React.createElement(
        StaticRouter,
        { location: route },
        React.createElement(Component)
      )
    )
  );
}
export {
  render
};
