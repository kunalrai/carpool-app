import { useNavigate } from "react-router-dom";

const C = {
  primary: "#003d9b",
  surface: "#faf8ff",
  surfaceContainerLow: "#f3f3fd",
  onSurface: "#191b23",
  onSurfaceVariant: "#434654",
  outline: "#737685",
  outlineVariant: "#c3c6d6",
  secondaryContainer: "#c7dfff",
  onSecondaryContainer: "#4b637e",
};

type Status = "collected" | "not-collected" | "optional";

function SafetyRow({ label, status, note }: { label: string; status: Status; note?: string }) {
  const badge: Record<Status, { text: string; bg: string; color: string }> = {
    "collected":     { text: "Collected",     bg: "#dcfce7", color: "#166534" },
    "not-collected": { text: "Not Collected",  bg: "#f1f5f9", color: "#475569" },
    "optional":      { text: "Optional",       bg: "#fef9c3", color: "#854d0e" },
  };
  const b = badge[status];
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b" style={{ borderColor: C.outlineVariant + "33" }}>
      <div>
        <p className="text-sm font-medium" style={{ color: C.onSurface }}>{label}</p>
        {note && <p className="text-xs mt-0.5" style={{ color: C.outline }}>{note}</p>}
      </div>
      <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: b.bg, color: b.color }}>
        {b.text}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2
        className="text-xl font-bold mb-4"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function DataSafety() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.surface }} className="min-h-screen">
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center gap-4 border-b"
        style={{ background: "rgba(250,248,255,0.85)", backdropFilter: "blur(20px)", borderColor: C.outlineVariant + "33" }}
      >
        <button onClick={() => navigate(-1)} className="text-sm font-medium hover:underline" style={{ color: C.primary }}>
          ← Back
        </button>
        <span className="text-sm font-semibold" style={{ color: C.onSurface }}>Data Safety</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">
        <h1
          className="text-4xl font-extrabold mb-2 tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
        >
          Data Safety
        </h1>
        <p className="text-sm mb-4" style={{ color: C.outline }}>Last updated: March 2025</p>
        <p className="text-sm leading-relaxed mb-10" style={{ color: C.onSurfaceVariant }}>
          A clear summary of what data GC Ridepool collects, why it's collected, and how it's protected.
          We believe you have the right to know exactly what happens with your information.
        </p>

        {/* Data collected table */}
        <Section title="Data We Collect">
          <SafetyRow label="Mobile Number" status="collected" note="Used for OTP login only. Never shown to other users." />
          <SafetyRow label="Name" status="collected" note="Displayed to co-riders and drivers during a shared ride." />
          <SafetyRow label="Profile Photo" status="optional" note="You can use the app without a photo." />
          <SafetyRow label="Vehicle Details (drivers only)" status="collected" note="Car name, colour, and registration number." />
          <SafetyRow label="Email Address" status="optional" note="Not required; only stored if you add it to your profile." />
          <SafetyRow label="FCM Token" status="collected" note="Required to deliver push notifications to your device." />
          <SafetyRow label="Location / GPS" status="not-collected" note="We never track your real-time location." />
          <SafetyRow label="Payment Information" status="not-collected" note="All payments are made in cash directly to drivers." />
          <SafetyRow label="Contacts / Address Book" status="not-collected" />
          <SafetyRow label="Device Identifiers" status="not-collected" />
        </Section>

        {/* Sharing */}
        <Section title="Data Sharing">
          <div className="text-sm leading-relaxed space-y-3" style={{ color: C.onSurfaceVariant }}>
            <p>We share limited data with the following third parties to operate the service:</p>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: C.outlineVariant + "44" }}>
              {[
                { party: "MSG91", purpose: "Delivering OTP SMS messages", data: "Mobile number only" },
                { party: "Firebase (Google)", purpose: "Push notifications", data: "FCM device token" },
                { party: "Daily.co", purpose: "In-app internet voice calls", data: "Display name, room token" },
                { party: "Convex", purpose: "Database & file storage", data: "All app data (encrypted)" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 px-5 py-3 text-xs border-b last:border-b-0"
                  style={{ borderColor: C.outlineVariant + "22", background: i % 2 === 0 ? C.surfaceContainerLow : "white" }}>
                  <span className="font-semibold" style={{ color: C.onSurface }}>{row.party}</span>
                  <span style={{ color: C.onSurfaceVariant }}>{row.purpose}</span>
                  <span style={{ color: C.outline }}>{row.data}</span>
                </div>
              ))}
            </div>
            <p>We do <strong>not</strong> sell your data to advertisers or any other commercial third parties.</p>
          </div>
        </Section>

        {/* Security */}
        <Section title="How We Protect Your Data">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "🔒", title: "Encrypted in Transit", desc: "All data is sent over HTTPS / TLS. No plain-text communication." },
              { icon: "🗄️", title: "Encrypted at Rest", desc: "Data stored in Convex is encrypted at the storage layer." },
              { icon: "📵", title: "No Phone Number Exposure", desc: "Your mobile number is stripped before any data reaches other users." },
              { icon: "🔑", title: "OTP-Only Auth", desc: "No passwords are ever stored. Authentication uses one-time codes only." },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-2xl border" style={{ background: "white", borderColor: C.outlineVariant + "33" }}>
                <p className="text-xl mb-2">{item.icon}</p>
                <p className="text-sm font-bold mb-1" style={{ color: C.onSurface }}>{item.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: C.onSurfaceVariant }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Rights */}
        <Section title="Your Data Rights">
          <div className="text-sm leading-relaxed space-y-2" style={{ color: C.onSurfaceVariant }}>
            <p>You can, at any time:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Edit your profile name, photo, and vehicle details inside the app.</li>
              <li>Disable push notifications from your device settings.</li>
              <li>Request full deletion of your account and all associated data by contacting the administrator.</li>
            </ul>
          </div>
        </Section>

        {/* Footer */}
        <div className="pt-10 border-t mt-10 text-xs" style={{ borderColor: C.outlineVariant + "33", color: C.outline }}>
          © 2025 GC Ridepool · Gaur City ↔ HCL Tech Park
        </div>
      </div>
    </div>
  );
}
