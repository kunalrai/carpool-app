import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";

type Role = "taker" | "giver" | "both";

// ── Role badge ────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, { label: string; cls: string }> = {
    taker:  { label: "Rider",          cls: "bg-blue-50 text-blue-700" },
    giver:  { label: "Driver",         cls: "bg-green-50 text-green-700" },
    both:   { label: "Driver & Rider", cls: "bg-purple-50 text-purple-700" },
  };
  const { label, cls } = map[role] ?? map.taker;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ── Add User form (shown inline below the header) ─────────────────────────
function AddUserForm({
  adminId,
  onDone,
}: {
  adminId: Id<"users">;
  onDone: () => void;
}) {
  const adminAddUser = useMutation(api.admin.adminAddUser);

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [offerRides, setOfferRides] = useState(false);
  const [carName, setCarName] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) { setError("Enter a valid 10-digit mobile number"); return; }
    if (!name.trim()) { setError("Name is required"); return; }
    if (offerRides) {
      if (!carName.trim()) { setError("Car name is required"); return; }
      if (!carColor.trim()) { setError("Car color is required"); return; }
      if (!carNumber.trim()) { setError("Car number is required"); return; }
    }
    setError(null);
    setLoading(true);
    try {
      await adminAddUser({
        adminId,
        mobile,
        name: name.trim(),
        role: offerRides ? "both" : "taker",
        carName: offerRides ? carName.trim() : undefined,
        carColor: offerRides ? carColor.trim() : undefined,
        carNumber: offerRides ? carNumber.trim() : undefined,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-4 mb-4 card border border-brand-200 animate-slide-up">
      <p className="text-sm font-bold text-gray-800 mb-4">Add New User</p>

      <div className="space-y-3">
        {/* Mobile */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Mobile <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
            <span className="px-3 py-2.5 bg-gray-50 text-gray-600 text-sm border-r border-gray-300">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={mobile}
              onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(null); }}
              className="flex-1 px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Offer rides toggle */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-gray-800">Also offers rides</p>
          <button
            type="button"
            onClick={() => setOfferRides((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${offerRides ? "bg-brand-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${offerRides ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Car fields */}
        <div className={`overflow-hidden transition-all duration-300 ${offerRides ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="space-y-3 pt-1">
            {[
              { label: "Car Name", placeholder: "e.g. Swift Dzire", value: carName, onChange: setCarName },
              { label: "Car Color", placeholder: "e.g. Silver", value: carColor, onChange: setCarColor },
              { label: "Car Number", placeholder: "e.g. UP14 AB 1234", value: carNumber, onChange: (v: string) => setCarNumber(v.toUpperCase()) },
            ].map(({ label, placeholder, value, onChange }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => { onChange(e.target.value); setError(null); }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onDone} disabled={loading} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm active:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm active:bg-brand-800 disabled:opacity-50">
            {loading ? "Adding…" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────
type User = {
  _id: Id<"users">;
  name: string;
  mobile: string;
  role: Role;
  isAdmin?: boolean;
  carName?: string;
  carColor?: string;
  carNumber?: string;
  createdAt: number;
};

function UserRow({
  user,
  adminId,
  isSelf,
}: {
  user: User;
  adminId: Id<"users">;
  isSelf: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAdminStatus = useMutation(api.admin.setAdminStatus);

  const handleToggleAdmin = async () => {
    setLoading(true);
    setError(null);
    try {
      await setAdminStatus({ adminId, targetUserId: user._id, isAdmin: !user.isAdmin });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-4 mb-3 card">
      {/* Collapsed row */}
      <button
        className="w-full flex items-center gap-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
          {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
            {user.isAdmin && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                Admin
              </span>
            )}
            {isSelf && (
              <span className="text-xs text-gray-400">(you)</span>
            )}
          </div>
          <p className="text-xs text-gray-500">+91 {user.mobile}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RoleBadge role={user.role} />
          <svg
            viewBox="0 0 24 24"
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-slide-up">
          <DetailRow label="Mobile" value={`+91 ${user.mobile}`} />
          <DetailRow label="Role" value={
            user.role === "both" ? "Driver & Rider" :
            user.role === "giver" ? "Driver" : "Rider"
          } />
          {user.carName && <DetailRow label="Car" value={`${user.carName} · ${user.carColor ?? ""}`} />}
          {user.carNumber && <DetailRow label="Plate" value={user.carNumber} />}
          <DetailRow
            label="Joined"
            value={new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          />

          {error && <p className="text-red-600 text-xs">{error}</p>}

          {!isSelf && (
            <button
              onClick={handleToggleAdmin}
              disabled={loading}
              className={`mt-2 w-full py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                user.isAdmin
                  ? "border-red-300 text-red-600 active:bg-red-50"
                  : "border-brand-300 text-brand-700 active:bg-brand-50"
              }`}
            >
              {loading
                ? "Updating…"
                : user.isAdmin
                ? "Remove Admin"
                : "Make Admin"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function AdminScreen() {
  const { userId } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");

  const users = useQuery(api.admin.getAllUsers, { adminId: userId! });

  const filtered = (users ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile.includes(search)
  );

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-brand-700 px-4 pt-12 pb-4 text-white">
        <h1 className="text-lg font-bold">Admin Panel</h1>
        <p className="text-brand-200 text-xs">
          {users === undefined ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""} registered`}
        </p>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 active:text-gray-600">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Add user form */}
      {showAddForm && (
        <AddUserForm
          adminId={userId!}
          onDone={() => setShowAddForm(false)}
        />
      )}

      {/* User list */}
      {users === undefined ? (
        <div className="px-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card animate-pulse flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <p className="text-sm font-medium">
            {search ? "No users match your search" : "No users yet"}
          </p>
        </div>
      ) : (
        filtered.map((user) => (
          <UserRow
            key={user._id}
            user={user as User}
            adminId={userId!}
            isSelf={user._id === userId}
          />
        ))
      )}

      {/* FAB — Add user */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-20 right-4 bg-brand-700 text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg active:bg-brand-800 z-30 flex items-center gap-1.5"
        >
          <span className="text-lg leading-none font-light">+</span>
          Add User
        </button>
      )}
    </div>
  );
}
