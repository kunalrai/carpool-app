import { useNavigate } from "react-router-dom";

// ── Design tokens (Material You palette from reference) ───────────────────
const C = {
  primary: "#003d9b",
  primaryContainer: "#0052cc",
  surface: "#faf8ff",
  surfaceContainer: "#ededf8",
  surfaceContainerLow: "#f3f3fd",
  surfaceContainerHigh: "#e7e7f2",
  surfaceContainerHighest: "#e1e2ec",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#191b23",
  onSurfaceVariant: "#434654",
  outline: "#737685",
  outlineVariant: "#c3c6d6",
  secondaryContainer: "#c7dfff",
  onSecondaryContainer: "#4b637e",
  tertiaryFixed: "#ffdbcf",
  onTertiaryFixed: "#380d00",
  onPrimary: "#ffffff",
};

function glassNav(): React.CSSProperties {
  return { background: "rgba(250, 248, 255, 0.75)", backdropFilter: "blur(24px)" };
}

// ── Components ────────────────────────────────────────────────────────────

// ── Main ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.surface, color: C.onSurface }} className="min-h-screen antialiased overflow-x-hidden">

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 py-4 px-6 md:px-10 flex items-center justify-between border-b"
        style={{ ...glassNav(), borderColor: C.outlineVariant + "33" }}
      >
        <div className="flex items-center gap-8">
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.primary }} className="text-2xl font-extrabold tracking-tight">
            GC Carpool
          </span>
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: "Find a Ride", action: () => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }) },
              { label: "How It Works", action: () => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }) },
              { label: "Blog", action: () => navigate("/blog") },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                style={{ color: C.onSurfaceVariant }}
                className="hover:text-blue-800 font-medium text-sm transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            style={{ color: C.primary }}
            className="px-4 py-2 font-semibold text-sm hidden sm:block"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2.5 text-white font-semibold text-sm rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)` }}
          >
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex items-center px-6 md:px-16 pt-20 pb-16 overflow-hidden" style={{ background: C.surface }}>
        {/* Background decoration */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-[0.06] pointer-events-none select-none"
          style={{ background: `radial-gradient(ellipse at 80% 40%, ${C.primary}, transparent 70%)` }} />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
          style={{ background: C.primary + "0a" }} />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-8 tracking-wider uppercase"
            style={{ background: C.secondaryContainer, color: C.onSecondaryContainer }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Carpool any route, any time
          </div>

          {/* Headline */}
          <h1
            className="text-[clamp(3rem,10vw,6.5rem)] font-extrabold leading-[0.92] tracking-tight mb-8"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
          >
            Your Route.<br />
            <span style={{ color: C.primary }}>Share the ride.</span>
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-xl leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            The community carpooling app for daily commuters.
            Post a ride, claim a seat, and split the trip with neighbours going your way.
          </p>

          {/* CTA widget */}
          <div className="flex flex-col sm:flex-row gap-3 p-1.5 rounded-2xl w-full md:w-auto" style={{ background: C.surfaceContainerLow }}>
            <div className="flex items-center gap-4 bg-white px-5 py-4 rounded-xl shadow-sm flex-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.outline }}>Any route</span>
                <span className="font-semibold text-sm" style={{ color: C.onSurface }}>Search rides near you</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 rounded-xl font-bold text-white text-sm transition-transform hover:scale-[1.02] active:scale-95 whitespace-nowrap"
              style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)` }}
            >
              Find a Ride
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="px-6 md:px-16 py-16 mb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { val: "2,000+", label: "Active Riders" },
            { val: "4", label: "Seats Per Ride" },
            { val: "₹0", label: "App Fees Ever" },
          ].map((s) => (
            <div
              key={s.label}
              className="p-8 flex flex-col items-center justify-center text-center shadow-xl border"
              style={{ background: C.surfaceContainerLowest, borderColor: C.outlineVariant + "1a", borderRadius: "9999px" }}
            >
              <span
                className="text-4xl font-extrabold mb-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.primary }}
              >
                {s.val}
              </span>
              <span className="text-sm font-medium" style={{ color: C.onSurfaceVariant }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bento Features ── */}
      <section className="px-6 md:px-16 py-24" style={{ background: C.surface }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <h2
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
            >
              Engineered for<br />Professionalism.
            </h2>
            <p className="max-w-md text-base" style={{ color: C.onSurfaceVariant }}>
              Why commuters trust GC Carpool every day.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-12 gap-5">
            {/* Large card — Real-Time Listings */}
            <div
              className="col-span-12 md:col-span-7 p-10 md:p-12 flex flex-col justify-end relative overflow-hidden group min-h-[260px]"
              style={{ background: C.surfaceContainerLowest, borderRadius: "2rem" }}
            >
              {/* Large decorative shield icon, right side */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.12] group-hover:opacity-[0.2] transition-opacity pointer-events-none">
                <svg width="160" height="160" viewBox="0 0 24 24" fill={C.primary}>
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
              </div>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold w-fit mb-4"
                style={{ background: C.tertiaryFixed, color: C.onTertiaryFixed }}
              >
                PRIVACY FIRST
              </span>
              <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}>
                Real-Time Listings
              </h3>
              <p className="max-w-sm text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                See rides the moment drivers post them. No refreshing, no delays —
                instant live updates to every rider simultaneously.
              </p>
            </div>

            {/* Blue card — Always Punctual */}
            <div
              className="col-span-12 md:col-span-5 p-10 md:p-12 flex flex-col justify-center relative overflow-hidden min-h-[260px]"
              style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`, borderRadius: "2rem" }}
            >
              <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full blur-2xl" style={{ background: "rgba(255,255,255,0.08)" }} />
              {/* Clock icon at top */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)" className="mb-6">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 11h-5v-2h3V7h2v6z" />
              </svg>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Always Punctual
              </h3>
              <p className="text-white/75 text-sm leading-relaxed">
                Drivers post their departure time and riders join instantly.
                Coordinate via group chat so everyone is ready on time.
              </p>
            </div>

            {/* Small card — Eco-friendly / PWA */}
            <div
              className="col-span-12 md:col-span-4 p-10 flex flex-col items-center text-center justify-center min-h-[220px]"
              style={{ background: C.surfaceContainerHigh, borderRadius: "2rem" }}
            >
              {/* Leaf icon */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#7b2600" className="mb-4">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2-.93 0-1.83.09-2.7.26C13.67 4.08 16 2 16 2s-6 1-9 7c-.75 1.46-1.26 3.14-1.63 4.84C4.78 10.4 3 7.83 3 4.9V3L1 5c0 5.52 3.47 10.26 8.38 12.09A8.5 8.5 0 0117 8z" />
              </svg>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}>
                Eco-Friendly
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                Fewer cars on the road, shared by neighbours going the same way.
              </p>
            </div>

            {/* Wide card — Trusted Community */}
            <div
              className="col-span-12 md:col-span-8 p-8 md:px-14 flex items-center gap-8 min-h-[220px]"
              style={{ background: C.secondaryContainer, borderRadius: "2rem" }}
            >
              {/* Stacked avatar circles with counter */}
              <div className="flex -space-x-4 shrink-0">
                {["AK", "SR", "PM"].map((initials, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-full border-4 flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      borderColor: C.secondaryContainer,
                      background: [C.primary, "#1d4ed8", "#1e40af"][i],
                    }}
                  >
                    {initials}
                  </div>
                ))}
                <div
                  className="w-14 h-14 rounded-full border-4 flex items-center justify-center text-xs font-bold text-white"
                  style={{ borderColor: C.secondaryContainer, background: C.primary }}
                >
                  500+
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}>
                  Trusted Community
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.onSecondaryContainer }}>
                  Join the growing network of commuters sharing daily rides. Verified by OTP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="px-6 md:px-16 py-28 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 md:gap-20">
          {/* Left */}
          <div className="md:w-1/3">
            <h2
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-[0.92]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
            >
              Three steps.<br />One commute.
            </h2>
            <p className="text-base mb-10 leading-relaxed" style={{ color: C.onSurfaceVariant }}>
              From sign-up to seat booked in under a minute.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 font-bold text-sm group"
              style={{ color: C.primary }}
            >
              Get Started Now
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </button>
          </div>

          {/* Steps — staggered */}
          <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Sign Up", desc: "Enter your mobile, verify with an OTP. Your account is ready in 30 seconds — no password ever.", offset: "" },
              { num: "02", title: "Post or Join", desc: "Drivers post departure time and seats. Riders browse the live feed and claim a seat instantly.", offset: "md:translate-y-4" },
              { num: "03", title: "Ride & Chat", desc: "Coordinate via group chat or voice call inside the app. Pay your driver directly when you board.", offset: "md:translate-y-8" },
            ].map((s) => (
              <div
                key={s.num}
                className={`p-8 rounded-3xl border border-transparent hover:border-blue-200 transition-all ${s.offset}`}
                style={{ background: C.surfaceContainerLow }}
              >
                <span
                  className="text-6xl font-extrabold block mb-6"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.outlineVariant + "88" }}
                >
                  {s.num}
                </span>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 md:px-16 py-16 md:py-20" style={{ background: C.surface }}>
        <div
          className="max-w-7xl mx-auto rounded-[2rem] p-12 md:p-20 flex flex-col items-center text-center text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)` }}
        >
          {/* Blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />

          <h2
            className="text-4xl md:text-6xl font-extrabold mb-6 max-w-3xl relative z-10 leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Join the smarter commute revolution.
          </h2>
          <p className="text-white/75 text-base md:text-lg mb-10 max-w-xl relative z-10 leading-relaxed">
            Your neighbours are already sharing daily rides.
            Free to join — just your phone number.
          </p>

          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <button
              onClick={() => navigate("/login")}
              className="bg-white px-10 py-4 rounded-full font-extrabold text-base shadow-2xl hover:bg-gray-50 transition-colors active:scale-95"
              style={{ color: C.primary }}
            >
              Start Riding
            </button>
            <button
              onClick={() => navigate("/login")}
              className="border-2 border-white/30 text-white px-10 py-4 rounded-full font-extrabold text-base hover:bg-white/10 transition-colors active:scale-95"
            >
              Offer a Ride
            </button>
          </div>

          {/* PWA install nudge */}
          <div className="mt-14 relative z-10 flex flex-col items-center gap-3">
            <p className="text-xs font-bold tracking-widest uppercase opacity-60">Works on any device</p>
            <div className="flex gap-6 text-white/80">
              {["Install as App", "No App Store", "Offline Ready"].map((label) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-20 px-6 md:px-16 border-t"
        style={{ background: C.surfaceContainerLowest, borderColor: C.outlineVariant + "33" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Brand */}
          <div className="max-w-xs">
            <span
              className="text-2xl font-extrabold tracking-tight mb-4 block"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.primary }}
            >
              GC Carpool
            </span>
            <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>
              The community carpooling app for daily commuters.
              Fast, secure, and community-run.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-20">
            {[
              {
                heading: "Product",
                items: [
                  { label: "Find a Ride", to: null },
                  { label: "Offer a Ride", to: null },
                  { label: "How It Works", to: null },
                  { label: "Blog", to: "/blog" },
                ],
              },
              {
                heading: "Privacy",
                items: [
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms of Service", to: "/terms" },
                  { label: "Data Safety", to: "/data-safety" },
                ],
              },
              {
                heading: "App",
                items: [
                  { label: "Install as PWA", to: null },
                  { label: "Add to Home Screen", to: null },
                  { label: "Works Offline", to: null },
                ],
              },
            ].map((col) => (
              <div key={col.heading} className="flex flex-col gap-3">
                <span className="font-bold text-xs tracking-widest uppercase" style={{ color: C.outline }}>
                  {col.heading}
                </span>
                {col.items.map(({ label, to }) =>
                  to ? (
                    <button
                      key={label}
                      onClick={() => navigate(to)}
                      className="text-sm text-left hover:text-blue-800 transition-colors"
                      style={{ color: C.onSurfaceVariant }}
                    >
                      {label}
                    </button>
                  ) : (
                    <span key={label} className="text-sm" style={{ color: C.onSurfaceVariant }}>
                      {label}
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          className="max-w-7xl mx-auto mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-3"
          style={{ borderColor: C.outlineVariant + "22" }}
        >
          <span className="text-xs" style={{ color: C.outline }}>© 2025 GC Carpool. Built for the community.</span>
          <span className="text-xs" style={{ color: C.outline }}>Share rides · Save money · Reduce traffic</span>
        </div>
      </footer>

    </div>
  );
}
