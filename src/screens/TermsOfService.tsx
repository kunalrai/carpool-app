import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  primary: "#003d9b",
  surface: "#faf8ff",
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

export default function TermsOfService() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Terms of Service — CarPool";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "The rules and guidelines governing your use of the CarPool community carpooling platform.");
  }, []);

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
        <span className="text-sm font-semibold" style={{ color: C.onSurface }}>Terms of Service</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">
        <h1
          className="text-4xl font-extrabold mb-2 tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
        >
          Terms of Service
        </h1>
        <p className="text-sm mb-10" style={{ color: C.outline }}>Last updated: March 2025</p>

        <Section title="1. Acceptance of Terms">
          <p>
            By registering or using GC Ridepool, you agree to these Terms of Service.
            If you do not agree, please do not use the app. We may update these terms from time to time;
            continued use of the app constitutes acceptance of any changes.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            GC Ridepool is intended for residents of City (GC1 / GC2) and employees of HCL Tech Park, Noida.
            You must provide a valid Indian mobile number to register. By using the app you confirm that
            the information you provide is accurate.
          </p>
        </Section>

        <Section title="3. User Conduct">
          <p>You agree to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Use the app only for legitimate carpooling between City and HCL campus.</li>
            <li>Be punctual and honour commitments made to drivers and co-riders.</li>
            <li>Treat all other users with respect in chats and voice calls.</li>
            <li>Not share offensive, abusive, or illegal content in any chat.</li>
            <li>Not use the app to solicit or conduct any commercial activity.</li>
          </ul>
        </Section>

        <Section title="4. Drivers">
          <p>Users who offer rides ("Drivers") agree to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Provide accurate vehicle information (name, colour, registration number).</li>
            <li>Hold a valid Indian driving licence and vehicle insurance.</li>
            <li>Maintain their vehicle in a safe and roadworthy condition.</li>
            <li>Not exceed the posted number of seats (maximum 4 riders).</li>
            <li>Cancel a listing promptly if they are unable to complete the ride.</li>
          </ul>
        </Section>

        <Section title="5. Payments">
          <p>
            GC Ridepool is a peer-to-peer platform. All fare payments are made directly between
            riders and drivers in cash. GC Ridepool does not process, hold, or take any commission
            on payments. Any fare disputes are between the rider and driver.
          </p>
        </Section>

        <Section title="6. Cancellations">
          <p>
            Drivers may cancel a listing at any time before the ride starts. Riders may cancel a booking
            at any time. Repeated no-shows or last-minute cancellations may result in account suspension
            at the administrator's discretion.
          </p>
        </Section>

        <Section title="7. Safety & Liability">
          <p>
            GC Ridepool is a community platform and does not operate, control, or insure any vehicle.
            All carpooling arrangements are voluntary agreements between users. GC Ridepool is not
            liable for any loss, injury, or damage arising from the use of the app or participation
            in any ride.
          </p>
          <p>
            Users are responsible for their own safety. If you feel unsafe, exit the vehicle immediately
            and contact emergency services.
          </p>
        </Section>

        <Section title="8. Account Suspension">
          <p>
            We reserve the right to suspend or terminate any account that violates these terms, engages
            in abusive behaviour, or is flagged by multiple users. Suspended users will not be able to
            post listings or join rides.
          </p>
        </Section>

        <Section title="9. Governing Law">
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the
            jurisdiction of the courts in Noida, Uttar Pradesh.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            For any queries regarding these terms, please contact the administrator via the community
            chat inside the app.
          </p>
        </Section>

        {/* Footer */}
        <div className="pt-10 border-t mt-10 text-xs" style={{ borderColor: C.outlineVariant + "33", color: C.outline }}>
          © 2025 GC Ridepool 
        </div>
      </div>
    </div>
  );
}
