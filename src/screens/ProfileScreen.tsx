import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-brand-700 flex items-center justify-center text-white text-2xl font-bold select-none">
      {initials}
    </div>
  );
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();

  const profile = useQuery(api.users.getUserProfile, { userId: userId! });
  const updateProfile = useMutation(api.users.updateProfile);

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [offerRides, setOfferRides] = useState(false);
  const [carName, setCarName] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Populate edit fields when profile loads or edit starts
  useEffect(() => {
    if (profile && editing) {
      setName(profile.name);
      setOfferRides(profile.role === "giver" || profile.role === "both");
      setCarName(profile.carName ?? "");
      setCarColor(profile.carColor ?? "");
      setCarNumber(profile.carNumber ?? "");
      setError(null);
    }
  }, [profile, editing]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Display name is required"); return; }
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
        role: offerRides ? "both" : "taker",
        carName: offerRides ? carName.trim() : undefined,
        carColor: offerRides ? carColor.trim() : undefined,
        carNumber: offerRides ? carNumber.trim() : undefined,
      });
      setEditing(false);
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
      <div className="pb-16 px-4 pt-14 animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const isDriver = profile.role === "giver" || profile.role === "both";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-brand-700 px-4 pt-12 pb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold">Profile</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-semibold text-white bg-white/20 px-4 py-1.5 rounded-xl active:bg-white/30"
              >
                Edit
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} />
            <div>
              <p className="text-xl font-bold">{profile.name}</p>
              <p className="text-brand-200 text-sm">+91 {profile.mobile}</p>
              <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                isDriver ? "bg-white/20 text-white" : "bg-white/10 text-brand-100"
              }`}>
                {profile.role === "both" ? "Driver & Rider" : profile.role === "giver" ? "Driver" : "Rider"}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 space-y-4">
          {/* ── View mode ── */}
          {!editing && (
            <>
              {/* Car details card */}
              {isDriver && profile.carName ? (
                <div className="card">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Car Details
                  </p>
                  <div className="space-y-2">
                    <Row label="Car" value={profile.carName} />
                    <Row label="Color" value={profile.carColor ?? "—"} />
                    <Row label="Number" value={profile.carNumber ?? "—"} />
                  </div>
                </div>
              ) : (
                <div className="card border-dashed text-center py-5">
                  <p className="text-sm text-gray-500">No car details added</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add your car to start offering rides
                  </p>
                </div>
              )}

              {/* Account section */}
              <div className="card">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Account
                </p>
                <Row label="Mobile" value={`+91 ${profile.mobile}`} />
                <p className="text-xs text-gray-400 mt-2">
                  Mobile number cannot be changed
                </p>
              </div>
            </>
          )}

          {/* ── Edit mode ── */}
          {editing && (
            <div className="space-y-4 animate-slide-up">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  className="input-field"
                  autoFocus
                />
              </div>

              {/* Mobile — read-only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile
                </label>
                <div className="input-field bg-gray-50 text-gray-500 cursor-not-allowed">
                  +91 {profile.mobile}
                </div>
              </div>

              {/* Offer rides toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">I offer rides</p>
                  <p className="text-xs text-gray-500 mt-0.5">Show my car and allow posting rides</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setOfferRides((v) => !v); setError(null); }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    offerRides ? "bg-brand-600" : "bg-gray-300"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    offerRides ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Car fields */}
              <div className={`overflow-hidden transition-all duration-300 ${
                offerRides ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}>
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Car Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Swift Dzire"
                      value={carName}
                      onChange={(e) => { setCarName(e.target.value); setError(null); }}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Car Color <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Silver"
                      value={carColor}
                      onChange={(e) => { setCarColor(e.target.value); setError(null); }}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Car Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UP14 AB 1234"
                      value={carNumber}
                      onChange={(e) => { setCarNumber(e.target.value.toUpperCase()); setError(null); }}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              {/* Save / Cancel */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setEditing(false); setError(null); }}
                  disabled={saving}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Logout button */}
          {!editing && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full mt-2 border border-red-300 text-red-600 font-semibold py-3 px-4 rounded-xl active:bg-red-50 transition-colors"
            >
              Log Out
            </button>
          )}
        </div>
      </div>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/40">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up shadow-xl">
            <p className="text-gray-800 font-semibold text-center text-lg mb-1">Log out?</p>
            <p className="text-gray-500 text-sm text-center mb-6">
              You'll need your mobile number and OTP to sign in again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white font-semibold py-3 px-4 rounded-xl active:bg-red-700"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
