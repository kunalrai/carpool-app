import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

// ── Info row used in view cards ───────────────────────────────────────────
function InfoRow({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();

  const profile = useQuery(api.users.getUserProfile, { userId: userId! });
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const photoUrl = useQuery(
    api.users.getProfilePhotoUrl,
    profile?.photoStorageId ? { storageId: profile.photoStorageId } : "skip"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [offerRides, setOfferRides] = useState(false);
  const [carName, setCarName] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email ?? "");
      setOfferRides(profile.role === "giver" || profile.role === "both");
      setCarName(profile.carName ?? "");
      setCarColor(profile.carColor ?? "");
      setCarNumber(profile.carNumber ?? "");
    }
  }, [profile]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB"); return; }
    setLocalPhotoUrl(URL.createObjectURL(file));
    setError(null);
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json() as { storageId: Id<"_storage"> };
      await updateProfile({ userId: userId!, photoStorageId: storageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
      setLocalPhotoUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Display name is required"); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address"); return;
    }
    if (offerRides) {
      if (!carName.trim()) { setError("Car name is required"); return; }
      if (!carColor.trim()) { setError("Car color is required"); return; }
      if (!carNumber.trim()) { setError("Car number is required"); return; }
    }
    setError(null);
    setSaving(true);
    try {
      await updateProfile({
        userId: userId!,
        name: name.trim(),
        email: email.trim() || undefined,
        role: offerRides ? "both" : "taker",
        carName: offerRides ? carName.trim() : undefined,
        carColor: offerRides ? carColor.trim() : undefined,
        carNumber: offerRides ? carNumber.trim() : undefined,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setMode("view"); }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 animate-pulse">
        <div className="h-56 bg-gray-800" />
        <div className="bg-white mx-4 -mt-6 rounded-2xl p-4 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const isDriver = profile.role === "giver" || profile.role === "both";
  const roleLabel = profile.role === "both" ? "Driver & Rider" : isDriver ? "Premium Driver" : "Member";
  const displayPhoto = localPhotoUrl ?? photoUrl ?? null;
  const initials = profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const fieldCls = "w-full bg-gray-100 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500 transition-all";

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW MODE
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === "view") {
    return (
      <>
        <div className="pb-24 bg-gray-50 min-h-screen">

          {/* ── Dark hero header ── */}
          <div className="bg-gray-900 pb-14 pt-12 px-4">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate(-1)} className="p-1 active:opacity-60">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-white font-semibold text-base">Profile</span>
              <button onClick={() => setMode("edit")} className="p-1 active:opacity-60">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center">
              <button
                className="relative mb-3 active:opacity-80"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <div className="p-1 rounded-full border-2 border-green-400">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-brand-700 flex items-center justify-center text-white text-2xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-gray-900 flex items-center justify-center">
                  {uploading ? (
                    <svg className="w-3 h-3 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
              </button>
              <p className="text-white font-bold text-xl">{profile.name}</p>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-1">{roleLabel}</p>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* ── Cards ── */}
          <div className="px-4 -mt-6 space-y-3">

            {/* Personal Information */}
            <div className="bg-white rounded-2xl px-4 pt-3 pb-1 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Personal Information</p>
                <button onClick={() => setMode("edit")} className="text-xs font-bold text-green-500 active:opacity-60 py-1">
                  EDIT
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                <InfoRow
                  iconBg="bg-gray-100"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  }
                  label="Email"
                  value={profile.email ?? "Not set"}
                />
                <InfoRow
                  iconBg="bg-gray-100"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  }
                  label="Phone Number"
                  value={`+91 ${profile.mobile}`}
                />
              </div>
            </div>

            {/* Vehicle Details */}
            {isDriver && (
              <div className="bg-white rounded-2xl px-4 pt-3 pb-1 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Vehicle Details</p>
                <div className="divide-y divide-gray-100">
                  <InfoRow
                    iconBg="bg-green-100"
                    icon={
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="9" width="22" height="9" rx="2" />
                        <path d="M3 9l2-5h14l2 5" />
                        <circle cx="7.5" cy="18.5" r="1.5" />
                        <circle cx="16.5" cy="18.5" r="1.5" />
                      </svg>
                    }
                    label="Car Name"
                    value={profile.carName ?? "—"}
                  />
                  <InfoRow
                    iconBg="bg-green-100"
                    icon={
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="10" rx="2" />
                        <path d="M7 11h.01M12 11h.01M17 11h.01" />
                      </svg>
                    }
                    label="Car Number"
                    value={profile.carNumber ?? "—"}
                  />
                  <InfoRow
                    iconBg="bg-green-100"
                    icon={
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    }
                    label="Car Color"
                    value={profile.carColor ?? "—"}
                  />
                </div>
              </div>
            )}

            {/* Account Settings */}
            <div className="bg-white rounded-2xl px-4 pt-3 pb-1 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Account Settings</p>
              <button className="w-full flex items-center justify-between py-3 active:opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Ride History</span>
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-500 font-semibold py-4 rounded-2xl active:bg-red-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Logout confirm */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/40">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up shadow-xl">
              <p className="text-gray-800 font-semibold text-center text-lg mb-1">Log out?</p>
              <p className="text-gray-500 text-sm text-center mb-6">You'll need your mobile number and OTP to sign in again.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleLogout} className="flex-1 bg-red-600 text-white font-semibold py-3 px-4 rounded-xl active:bg-red-700">Log Out</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EDIT MODE
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <div className="pb-24 bg-white min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-100">
          <button onClick={() => { setMode("view"); setError(null); }} className="p-1 active:opacity-60">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="font-bold text-gray-900 text-base">Edit Profile</span>
          <div className="w-7" />
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center py-6">
          <button className="relative active:opacity-80" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {displayPhoto ? (
              <img src={displayPhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold">{initials}</div>
            )}
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center shadow">
              {uploading ? (
                <svg className="w-3 h-3 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              )}
            </span>
          </button>
          <p className="text-xs text-gray-400 mt-2">{uploading ? "Uploading…" : "Tap to change photo"}</p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="px-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input type="text" placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} className={fieldCls} autoFocus />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input type="email" inputMode="email" placeholder="e.g. rahul@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} className={fieldCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
            <input type="text" value={`+91 ${profile.mobile}`} readOnly className={`${fieldCls} text-gray-400 cursor-not-allowed`} />
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-100 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">I offer rides</p>
              <p className="text-xs text-gray-500 mt-0.5">Show vehicle details to passengers</p>
            </div>
            <button type="button" onClick={() => { setOfferRides(v => !v); setError(null); }}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${offerRides ? "bg-brand-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${offerRides ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>

          {offerRides && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-base font-bold text-gray-900 pt-1">Vehicle Details</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Car Name</label>
                <input type="text" placeholder="e.g. Swift Dzire" value={carName} onChange={(e) => { setCarName(e.target.value); setError(null); }} className={fieldCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Car Number</label>
                  <input type="text" placeholder="UP14 AB 1234" value={carNumber} onChange={(e) => { setCarNumber(e.target.value.toUpperCase()); setError(null); }} className={fieldCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Car Color</label>
                  <input type="text" placeholder="e.g. Silver" value={carColor} onChange={(e) => { setCarColor(e.target.value); setError(null); }} className={fieldCls} />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

          <div className="flex items-center gap-3 bg-gray-900 rounded-2xl px-4 py-4">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Identity Verification</p>
              <p className="text-xs text-white/50 mt-0.5">Your data is encrypted and secure.</p>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-brand-700 text-white font-bold py-4 rounded-2xl text-base active:bg-brand-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? "Saving…" : saved ? "Saved!" : (
              <>Save Profile
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
