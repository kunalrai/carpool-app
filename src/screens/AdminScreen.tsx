import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";

type Role = "taker" | "giver" | "both";

// ── Role badge ────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, { label: string; bg: string; color: string }> = {
    taker: { label: "Rider",          bg: "rgba(37,99,235,0.15)",  color: "#60a5fa" },
    giver: { label: "Driver",         bg: "rgba(5,150,105,0.15)",  color: "#34d399" },
    both:  { label: "Driver & Rider", bg: "rgba(124,58,237,0.15)", color: "#a78bfa" },
  };
  const { label, bg, color } = map[role] ?? map.taker;
  return (
    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "9999px", background: bg, color }}>
      {label}
    </span>
  );
}

// ── Add User form ─────────────────────────────────────────────────────────

function AddUserForm({ adminId, onDone }: { adminId: Id<"users">; onDone: () => void }) {
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
    setError(null); setLoading(true);
    try {
      await adminAddUser({
        adminId, mobile, name: name.trim(), role: offerRides ? "both" : "taker",
        carName: offerRides ? carName.trim() : undefined,
        carColor: offerRides ? carColor.trim() : undefined,
        carNumber: offerRides ? carNumber.trim() : undefined,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add user");
    } finally { setLoading(false); }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "0.75rem", padding: "0.75rem 1rem", color: "white", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.3rem",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      style={{
        margin: "0 1rem 1rem",
        background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: "1.25rem", padding: "1.25rem",
      }}
    >
      <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "white", marginBottom: "1rem" }}>Add New User</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <div>
          <label style={labelStyle}>Mobile *</label>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "0.75rem", overflow: "hidden" }}>
            <span style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", borderRight: "1px solid rgba(99,102,241,0.2)" }}>+91</span>
            <input type="tel" inputMode="numeric" maxLength={10} placeholder="9876543210" value={mobile}
              onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(null); }}
              style={{ flex: 1, background: "transparent", border: "none", padding: "0.75rem", color: "white", fontSize: "0.875rem", outline: "none" }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Display Name *</label>
          <input type="text" placeholder="e.g. Rahul Sharma" value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }} style={fieldStyle} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem 1rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "white", margin: 0 }}>Also offers rides</p>
          <button type="button" onClick={() => setOfferRides(v => !v)}
            style={{ position: "relative", width: 44, height: 24, borderRadius: "9999px", border: "none", cursor: "pointer", background: offerRides ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(255,255,255,0.15)", flexShrink: 0, transition: "background 0.2s" }}>
            <span style={{ position: "absolute", top: 2, left: offerRides ? 22 : 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "left 0.2s" }} />
          </button>
        </div>

        <AnimatePresence>
          {offerRides && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Car Name *", placeholder: "e.g. Swift Dzire", value: carName, onChange: setCarName },
                  { label: "Car Color *", placeholder: "e.g. Silver", value: carColor, onChange: setCarColor },
                  { label: "Car Number *", placeholder: "e.g. UP14 AB 1234", value: carNumber, onChange: (v: string) => setCarNumber(v.toUpperCase()) },
                ].map(f => (
                  <div key={f.label}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={f.value}
                      onChange={(e) => { f.onChange(e.target.value); setError(null); }} style={fieldStyle} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p style={{ color: "#f87171", fontSize: "0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.625rem" }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onDone} disabled={loading}
            style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontWeight: 600, padding: "0.75rem", borderRadius: "0.75rem", cursor: "pointer", fontSize: "0.875rem" }}>
            Cancel
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleSubmit} disabled={loading}
            style={{ flex: 1, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", fontWeight: 700, padding: "0.75rem", borderRadius: "0.75rem", cursor: "pointer", border: "none", fontSize: "0.875rem", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Adding…" : "Add User"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────

type User = {
  _id: Id<"users">; name: string; mobile: string; role: Role;
  isAdmin?: boolean; isSuspended?: boolean;
  carName?: string; carColor?: string; carNumber?: string; createdAt: number;
};

function UserRow({ user, adminId, isSelf, index }: { user: User; adminId: Id<"users">; isSelf: boolean; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAdminStatus = useMutation(api.admin.setAdminStatus);
  const setSuspendStatus = useMutation(api.admin.setSuspendStatus);

  const initials = user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const avatarColors = ["#2563eb","#7c3aed","#059669","#dc2626","#ea580c","#0891b2"];
  let h = 0;
  for (const c of user.name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  const avatarBg = avatarColors[h % avatarColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 340, damping: 28 }}
      style={{
        margin: "0 1rem 0.75rem",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: "1.25rem", overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <div style={{ height: 2, background: user.isAdmin ? "linear-gradient(90deg,#f59e0b,#ef4444)" : user.isSuspended ? "linear-gradient(90deg,#ef4444,#9f1239)" : "linear-gradient(90deg,#2563eb,#7c3aed)" }} />

      <button className="w-full" style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
        onClick={() => setExpanded(v => !v)}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.8rem", fontWeight: 800, color: "white" }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, color: "white", fontSize: "0.875rem" }}>{user.name}</span>
            {user.isAdmin && <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: "rgba(245,158,11,0.2)", color: "#fbbf24" }}>ADMIN</span>}
            {user.isSuspended && <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: "rgba(239,68,68,0.2)", color: "#f87171" }}>SUSPENDED</span>}
            {isSelf && <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}>(you)</span>}
          </div>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", margin: 0 }}>+91 {user.mobile}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <RoleBadge role={user.role} />
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1rem 1rem", borderTop: "1px solid rgba(99,102,241,0.15)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                ["Mobile", `+91 ${user.mobile}`],
                ["Role", user.role === "both" ? "Driver & Rider" : user.role === "giver" ? "Driver" : "Rider"],
                ...(user.carName ? [["Car", `${user.carName} · ${user.carColor ?? ""}`]] : []),
                ...(user.carNumber ? [["Plate", user.carNumber]] : []),
                ["Joined", new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{label}</span>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{value}</span>
                </div>
              ))}

              {error && <p style={{ color: "#f87171", fontSize: "0.75rem", margin: 0 }}>{error}</p>}

              {!isSelf && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      setLoading(true); setError(null);
                      try { await setAdminStatus({ adminId, targetUserId: user._id, isAdmin: !user.isAdmin }); }
                      catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
                      finally { setLoading(false); }
                    }}
                    disabled={loading || !!user.isSuspended}
                    style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", border: "none", opacity: loading || user.isSuspended ? 0.45 : 1, background: user.isAdmin ? "rgba(239,68,68,0.15)" : "rgba(37,99,235,0.15)", color: user.isAdmin ? "#f87171" : "#60a5fa" }}>
                    {loading ? "…" : user.isAdmin ? "Remove Admin" : "Make Admin"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      setLoading(true); setError(null);
                      try { await setSuspendStatus({ adminId, targetUserId: user._id, isSuspended: !user.isSuspended }); }
                      catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
                      finally { setLoading(false); }
                    }}
                    disabled={loading}
                    style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", border: "none", opacity: loading ? 0.45 : 1, background: user.isSuspended ? "rgba(5,150,105,0.15)" : "rgba(239,68,68,0.15)", color: user.isSuspended ? "#34d399" : "#f87171" }}>
                    {loading ? "…" : user.isSuspended ? "Unsuspend" : "Suspend"}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [callsToggling, setCallsToggling] = useState(false);

  const users = useQuery(api.admin.getAllUsers, { adminId: userId! });
  const appSettings = useQuery(api.admin.getAppSettings, {});
  const setCallsEnabled = useMutation(api.admin.setCallsEnabled);

  const handleToggleCalls = async () => {
    if (callsToggling || appSettings === undefined) return;
    setCallsToggling(true);
    try { await setCallsEnabled({ adminId: userId!, enabled: !appSettings.callsEnabled }); }
    finally { setCallsToggling(false); }
  };

  const filtered = (users ?? []).filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.mobile.includes(search)
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", paddingBottom: "5rem" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
        padding: "3rem 1rem 1.25rem",
        position: "relative", overflow: "hidden",
        boxShadow: "0 4px 24px rgba(30,58,138,0.4)",
      }}>
        <div style={{ position: "absolute", top: "-3rem", right: "-3rem", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.08),transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", position: "relative" }}>
          <div style={{ width: 40, height: 40, borderRadius: "0.875rem", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="rgba(255,255,255,0.2)" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 900, color: "white", margin: 0 }}>Admin Panel</h1>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
              {users === undefined ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""} registered`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ padding: "1rem 1rem 0" }}>
        {/* Blog Management */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/admin/blog")}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "1rem", padding: "0.875rem 1rem", cursor: "pointer", marginBottom: "0.75rem",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "0.625rem", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>✍️</div>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#a5b4fc" }}>Blog Management</span>
          </div>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(165,180,252,0.6)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>

        {/* Calls toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "0.875rem 1rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "0.625rem", background: appSettings?.callsEnabled ? "rgba(5,150,105,0.2)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={appSettings?.callsEnabled ? "#34d399" : "rgba(255,255,255,0.4)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "white", margin: 0 }}>Voice Calls</p>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {appSettings === undefined ? "Loading…" : appSettings.callsEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <button onClick={handleToggleCalls} disabled={callsToggling || appSettings === undefined}
            style={{ position: "relative", width: 44, height: 24, borderRadius: "9999px", border: "none", cursor: "pointer", transition: "background 0.2s", background: appSettings?.callsEnabled ? "linear-gradient(135deg,#059669,#0d9488)" : "rgba(255,255,255,0.15)", flexShrink: 0, opacity: callsToggling ? 0.5 : 1 }}>
            <span style={{ position: "absolute", top: 2, left: appSettings?.callsEnabled ? 22 : 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: "0 1rem 0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.875rem", padding: "0.625rem 0.875rem" }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search by name or mobile…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: "0.875rem", outline: "none" }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Add user form ── */}
      <AnimatePresence>
        {showAddForm && (
          <AddUserForm adminId={userId!} onDone={() => setShowAddForm(false)} />
        )}
      </AnimatePresence>

      {/* ── User list ── */}
      {users === undefined ? (
        <div style={{ padding: "0 1rem" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ margin: "0 0 0.75rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: "1.25rem", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", animation: "pulse 1.5s infinite" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ height: 14, background: "rgba(255,255,255,0.08)", borderRadius: "0.375rem", width: "40%", animation: "pulse 1.5s infinite" }} />
                <div style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: "0.375rem", width: "28%", animation: "pulse 1.5s infinite" }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 1rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔍</div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
            {search ? "No users match your search" : "No users yet"}
          </p>
        </div>
      ) : (
        filtered.map((user, i) => (
          <UserRow key={user._id} user={user as User} adminId={userId!} isSelf={user._id === userId} index={i} />
        ))
      )}

      {/* ── FAB ── */}
      {!showAddForm && (
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          style={{
            position: "fixed", bottom: "5.5rem", right: "1rem",
            background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
            color: "white", fontWeight: 700, fontSize: "0.875rem",
            padding: "0.75rem 1.25rem", borderRadius: "9999px",
            border: "none", cursor: "pointer", zIndex: 30,
            display: "flex", alignItems: "center", gap: "0.375rem",
            boxShadow: "0 6px 24px rgba(99,102,241,0.5)",
          }}
        >
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
          Add User
        </motion.button>
      )}
    </div>
  );
}
