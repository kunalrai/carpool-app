import { useNavigate } from "react-router-dom";

const C = {
  primary: "#003d9b",
  surface: "#faf8ff",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#191b23",
  onSurfaceVariant: "#434654",
  outline: "#737685",
  outlineVariant: "#c3c6d6",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2
        className="text-xl font-bold mb-3"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
      >
        {title}
      </h2>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: C.onSurfaceVariant }}>
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPolicy() {
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
        <span className="text-sm font-semibold" style={{ color: C.onSurface }}>Privacy Policy</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">
        <h1
          className="text-4xl font-extrabold mb-2 tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
        >
          Privacy Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: C.outline }}>Last updated: March 2025</p>

        <Section title="1. Information We Collect">
          <p>We collect the following information when you register or use GC Ridepool:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Mobile number</strong> — used for OTP-based authentication only.</li>
            <li><strong>Name</strong> — displayed to co-riders and drivers you share a ride with.</li>
            <li><strong>Profile photo</strong> — optional; stored securely and displayed to ride participants.</li>
            <li><strong>Vehicle details</strong> — required for drivers (car name, colour, number plate).</li>
            <li><strong>Ride activity</strong> — listings posted, bookings made, and messages sent.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>Your information is used solely to operate the GC Ridepool service:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Authenticating your identity via OTP (no passwords are stored).</li>
            <li>Matching riders with drivers for the City ↔ HCL commute.</li>
            <li>Enabling in-app group chat and voice calls between ride participants.</li>
            <li>Sending push notifications about your bookings and listings.</li>
          </ul>
          <p>We do <strong>not</strong> sell, rent, or share your personal data with third-party advertisers.</p>
        </Section>

        <Section title="3. Phone Number Privacy">
          <p>
            Your mobile number is <strong>never</strong> displayed to other users. Drivers and co-riders can communicate
            through in-app chat and internet voice calls without ever seeing each other's phone numbers.
          </p>
        </Section>

        <Section title="4. Data Storage">
          <p>
            Your data is stored on Convex, a secure cloud database. Profile photos are stored in Convex
            managed object storage. All data is encrypted at rest and in transit.
          </p>
        </Section>

        <Section title="5. Third-Party Services">
          <p>We use the following third-party services to operate the app:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>MSG91</strong> — for delivering OTP SMS messages.</li>
            <li><strong>Firebase Cloud Messaging</strong> — for push notifications.</li>
            <li><strong>Daily.co</strong> — for in-app internet voice calls (audio only).</li>
          </ul>
          <p>Each service has its own privacy policy. We share only the minimum data required for each service to function.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            Your account data is retained while your account is active. You may request deletion of your account
            and all associated data by contacting us. Ride history and messages may be retained for up to 90 days
            after deletion for safety purposes.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and data.</li>
            <li>Withdraw consent for push notifications at any time from your device settings.</li>
          </ul>
        </Section>

        <Section title="8. Contact">
          <p>
            For any privacy-related queries, please reach out via the community chat inside the app
            or contact the administrator.
          </p>
        </Section>

        {/* Footer */}
        <div className="pt-10 border-t mt-10 text-xs" style={{ borderColor: C.outlineVariant + "33", color: C.outline }}>
          © 2025 GC Ridepool · City ↔ HCL Tech Park
        </div>
      </div>
    </div>
  );
}
