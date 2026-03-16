import { useNavigate } from "react-router-dom";

// ── Feature card data ──────────────────────────────────────────────────────

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Real-Time Listings",
    desc: "See available rides the moment drivers post them. No refreshing — live updates instantly.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    title: "Fixed ₹80 Fare",
    desc: "Always ₹80 per seat, no surge pricing, no surprises. Pay your co-rider directly — no app fees.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    title: "Ride Group Chat",
    desc: "Every ride has its own group chat. Coordinate pickup, share updates — all in one place.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
    title: "Internet Voice Calls",
    desc: "Call your driver or co-riders directly inside the app. No need to share phone numbers.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    title: "Installs Like an App",
    desc: "Add to your home screen and it works just like a native app — fast, offline-ready, no app store needed.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Private & Secure",
    desc: "OTP login — no passwords ever. Phone numbers stay hidden from all other users.",
    color: "bg-rose-50 text-rose-600",
  },
];

const steps = [
  {
    num: "01",
    title: "Sign up with OTP",
    desc: "Enter your mobile number, verify with a one-time code. Done in 30 seconds.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Post or Join a Ride",
    desc: "Drivers post their departure time. Riders browse and claim a seat instantly.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="9" width="22" height="9" rx="2" />
        <path d="M3 9l2-5h14l2 5" />
        <circle cx="7.5" cy="18.5" r="1.5" />
        <circle cx="16.5" cy="18.5" r="1.5" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Ride & Chat Together",
    desc: "Coordinate via group chat or voice call. Pay ₹80 cash to the driver. Simple.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <circle cx="17" cy="7" r="3" />
        <path d="M21 21v-2a4 4 0 00-3-3.87" />
      </svg>
    ),
  },
];

// ── Route Animation ────────────────────────────────────────────────────────

function RouteAnimation() {
  return (
    <div className="relative w-full h-20 my-2">
      <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/20 rounded-full -translate-y-1/2" />
      <div
        className="absolute top-1/2 left-8 right-8 h-0.5 -translate-y-1/2 rounded-full overflow-hidden"
        style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 8px, transparent 8px, transparent 16px)" }}
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center animate-route-dot">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-700" />
        </div>
        <span className="text-[10px] font-bold text-white/80 whitespace-nowrap">Gaur City</span>
      </div>
      <div className="absolute top-1/2 -translate-y-[60%] animate-car" style={{ position: "absolute" }}>
        <div className="animate-float" style={{ animationDuration: "2s" }}>
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-yellow-300 drop-shadow-lg" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
        </div>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <div className="w-5 h-5 rounded-full bg-yellow-300 flex items-center justify-center animate-route-dot" style={{ animationDelay: "1s" }}>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-600" />
        </div>
        <span className="text-[10px] font-bold text-white/80 whitespace-nowrap">HCL Campus</span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Sticky Nav ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50"
        style={{ background: "rgba(15, 23, 42, 0.88)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3.5 md:px-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm tracking-wide">GC Carpool</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">How It Works</button>
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">Features</button>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-1.5 rounded-full transition-colors active:scale-95"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex flex-col justify-center pt-20 pb-16 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%)" }}
      >
        {/* Background blobs */}
        <div className="absolute top-20 -right-20 w-72 h-72 md:w-96 md:h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }} />
        <div className="absolute bottom-10 -left-10 w-56 h-56 md:w-80 md:h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />

        <div className="relative max-w-7xl mx-auto w-full px-6 md:px-10 lg:px-16">
          {/* Two-column layout on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">

            {/* Left: copy + CTAs */}
            <div className="flex-1 lg:max-w-xl">
              {/* Badge */}
              <div className="animate-fade-in-up mb-6">
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Exclusively for GaurCity ↔ HCL commuters
                </span>
              </div>

              <h1 className="animate-fade-in-up-1 text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4">
                Your daily commute,{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #a78bfa)" }}
                >
                  shared.
                </span>
              </h1>

              <p className="animate-fade-in-up-2 text-base md:text-lg text-blue-200 leading-relaxed mb-8 max-w-md">
                The carpooling app built for the Gaur City community. Post a ride, join one,
                and split the commute — always at a fixed ₹80 per seat.
              </p>

              {/* CTAs */}
              <div className="animate-fade-in-up-3 flex flex-col sm:flex-row gap-3 mb-10 lg:mb-0">
                <button
                  onClick={() => navigate("/login")}
                  className="sm:w-auto px-8 py-4 rounded-2xl font-bold text-base text-brand-900 transition-all active:scale-95 hover:brightness-105"
                  style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b)" }}
                >
                  Get Started — It's Free
                </button>
                <button
                  onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                  className="sm:w-auto px-8 py-4 rounded-2xl font-semibold text-sm text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  See How It Works
                </button>
              </div>
            </div>

            {/* Right: route animation card + stats */}
            <div className="flex-1 lg:max-w-md mt-10 lg:mt-0">
              {/* Route animation card */}
              <div className="animate-fade-in-up-4 bg-white/10 border border-white/15 rounded-2xl px-4 pt-4 pb-2 backdrop-blur-sm mb-5">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">Live Route</p>
                <RouteAnimation />
                <div className="flex justify-between text-xs text-white/50 mt-1 pb-1">
                  <span>GC1 / GC2</span>
                  <span>HCL Tech Park</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="animate-fade-in-up-5 grid grid-cols-3 gap-3">
                {[
                  { val: "₹80", label: "Fixed fare" },
                  { val: "4", label: "Seats max" },
                  { val: "0", label: "App fees" },
                ].map((s) => (
                  <div key={s.label} className="text-center bg-white/5 rounded-xl py-3 border border-white/10">
                    <p className="text-xl font-black text-white">{s.val}</p>
                    <p className="text-[11px] text-blue-300 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">Simple process</p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-10 md:mb-14">How it works</h2>

          {/* Horizontal on md+, vertical on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {steps.map((step, i) => (
              <div key={i} className="flex md:flex-col gap-4 md:gap-5 items-start">
                <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-700/30">
                  {step.icon}
                </div>
                <div className="pt-1 md:pt-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-brand-400">{step.num}</span>
                    <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">Everything you need</p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-8 md:mb-12">Built for your commute</h2>

          {/* 2-col on mobile, 3-col on md+ */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 p-4 md:p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${f.color}`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-gray-900 leading-tight mb-1">{f.title}</h3>
                  <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fare Highlight ── */}
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div
            className="rounded-3xl px-6 py-8 md:px-12 md:py-12 text-white overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)" }}
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 md:w-56 md:h-56 rounded-full bg-white/5" />
            <div className="absolute -right-2 top-12 w-20 h-20 md:w-36 md:h-36 rounded-full bg-white/5" />

            {/* Two-column on desktop */}
            <div className="relative flex flex-col md:flex-row md:items-center md:gap-16">
              <div className="md:flex-1 mb-8 md:mb-0">
                <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">Transparent pricing</p>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-5xl md:text-6xl font-black">₹80</span>
                  <span className="text-blue-300 text-sm mb-2">/ seat</span>
                </div>
                <p className="text-sm md:text-base text-blue-200 leading-relaxed">
                  One price. Always. No surge, no booking fee, no commission.
                  Pay your driver directly when you board.
                </p>
              </div>

              <div className="md:flex-1 flex flex-col gap-3">
                {["No hidden charges", "Pay cash to driver", "No payment gateway needed", "No surge pricing ever"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-3 h-3 text-green-900" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-sm md:text-base text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Callouts ── */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex items-start gap-4">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Community + Ride Chats</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  A shared community chat for all GC ↔ HCL commuters, plus a private group chat
                  for every ride — so you can always coordinate easily.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex items-start gap-4">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Internet Voice Calls</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Call your driver or co-riders directly inside the app.
                  Your phone number stays completely private.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="py-16 md:py-24 text-center"
        style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e3a8a 100%)" }}
      >
        <div className="max-w-2xl mx-auto px-6 md:px-10">
          <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-yellow-300" fill="currentColor">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
            Ready to ride smarter?
          </h2>
          <p className="text-sm md:text-base text-blue-300 mb-8 leading-relaxed">
            Join your neighbours already sharing the GC ↔ HCL commute.
            Sign up in under a minute — just your phone number.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto sm:px-12 py-4 rounded-2xl font-bold text-base text-brand-900 transition-all active:scale-95 hover:brightness-105 mb-3"
            style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b)" }}
          >
            Start Carpooling Now
          </button>
          <p className="text-xs text-blue-400 mt-3">Free to use · No credit card · No passwords</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md bg-brand-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm">GC Carpool</span>
          </div>
          <p className="text-xs text-gray-500">GaurCity ↔ HCL Tech Park · Built for the community</p>
        </div>
      </footer>

    </div>
  );
}
