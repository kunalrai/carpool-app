import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

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

    // Show local preview immediately
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
      // Reset input so same file can be re-selected
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
      setTimeout(() => setSaved(false), 2500);
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

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="pb-24 px-5 pt-14 animate-pulse space-y-5">
        <div className="h-7 bg-gray-200 rounded w-2/3" />
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const fieldCls = "w-full bg-gray-100 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500 transition-all";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="pb-24 bg-white min-h-screen">

        {/* ── Header ── */}
        <div className="px-5 pt-14 pb-2">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
              Complete your<br />
              <span className="text-brand-700">profile.</span>
            </h1>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 rounded-xl active:bg-gray-50"
            >
              Log Out
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            This helps your passengers and fellow commuters identify you.
          </p>
        </div>

        {/* ── Avatar ── */}
        <div className="flex flex-col items-center py-6">
          <button
            className="relative active:opacity-80"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {/* Photo or initials */}
            {(localPhotoUrl ?? photoUrl) ? (
              <img
                src={localPhotoUrl ?? photoUrl!}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold select-none">
                {(name || profile.name).split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
            )}

            {/* Edit badge */}
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

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-2">
            {uploading ? "Uploading…" : "Upload Photo"}
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="px-5 space-y-4">

          {/* ── Personal fields ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              className={fieldCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              inputMode="email"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className={fieldCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
            <input
              type="text"
              value={`+91 ${profile.mobile}`}
              readOnly
              className={`${fieldCls} text-gray-400 cursor-not-allowed`}
            />
          </div>

          {/* ── Offer rides toggle ── */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-100 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">I offer rides</p>
              <p className="text-xs text-gray-500 mt-0.5">Show vehicle details to passengers</p>
            </div>
            <button
              type="button"
              onClick={() => { setOfferRides((v) => !v); setError(null); }}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${offerRides ? "bg-brand-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${offerRides ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>

          {/* ── Vehicle Details ── */}
          {offerRides && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-base font-bold text-gray-900 pt-1">Vehicle Details</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Car Name</label>
                <input
                  type="text"
                  placeholder="e.g. Swift Dzire"
                  value={carName}
                  onChange={(e) => { setCarName(e.target.value); setError(null); }}
                  className={fieldCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Car Number</label>
                  <input
                    type="text"
                    placeholder="UP14 AB 1234"
                    value={carNumber}
                    onChange={(e) => { setCarNumber(e.target.value.toUpperCase()); setError(null); }}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Car Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Silver"
                    value={carColor}
                    onChange={(e) => { setCarColor(e.target.value); setError(null); }}
                    className={fieldCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* ── Security banner ── */}
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

          {/* ── Save button ── */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-brand-700 text-white font-bold py-4 rounded-2xl text-base active:bg-brand-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? "Saving…" : saved ? "Saved!" : (
              <>
                Save Profile
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Logout confirm ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/40">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up shadow-xl">
            <p className="text-gray-800 font-semibold text-center text-lg mb-1">Log out?</p>
            <p className="text-gray-500 text-sm text-center mb-6">
              You'll need your mobile number and OTP to sign in again.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleLogout} className="flex-1 bg-red-600 text-white font-semibold py-3 px-4 rounded-xl active:bg-red-700">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
