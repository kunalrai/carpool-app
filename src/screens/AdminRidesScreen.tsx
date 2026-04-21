import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";

type Listing = {
  _id: Id<"listings">;
  driverName: string;
  fromLabel: string;
  toLabel: string;
  departureTime: number;
  status: string;
  totalSeats: number;
  seatsLeft: number;
  fare: number;
  note?: string;
  pickupPoint?: string;
  createdAt: number;
};

const STATUS_COLORS: Record<string, string> = {
  open: "#34d399",
  full: "#f59e0b",
  started: "#60a5fa",
  completed: "#a78bfa",
  cancelled: "#f87171",
  expired: "#6b7280",
};

function ListingRow({
  listing,
  adminId,
  index,
}: {
  listing: Listing;
  adminId: Id<"users">;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editFare, setEditFare] = useState(String(listing.fare));
  const [editNote, setEditNote] = useState(listing.note ?? "");
  const [editPickup, setEditPickup] = useState(listing.pickupPoint ?? "");
  const [editStatus, setEditStatus] = useState(listing.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const adminDeleteListing = useMutation(api.admin.adminDeleteListing);
  const adminEditListing = useMutation(api.admin.adminEditListing);

  const dep = new Date(listing.departureTime);
  const depStr = dep.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    " " + dep.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const handleSave = async () => {
    setLoading(true); setError(null);
    try {
      const fare = Number(editFare);
      if (isNaN(fare) || fare < 1 || fare > 2000) throw new Error("Fare must be ₹1–2000");
      await adminEditListing({
        adminId,
        listingId: listing._id,
        fare,
        note: editNote || undefined,
        pickupPoint: editPickup || undefined,
        status: editStatus as "open" | "full" | "started" | "completed" | "cancelled" | "expired",
      });
      setExpanded(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true); setError(null);
    try {
      await adminDeleteListing({ adminId, listingId: listing._id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = STATUS_COLORS[listing.status] ?? "#6b7280";

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "0.625rem",
    padding: "0.5rem 0.75rem",
    color: "white",
    fontSize: "0.8rem",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 300, damping: 28 }}
      style={{
        margin: "0 1rem 0.75rem",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: "1.25rem",
        overflow: "hidden",
      }}
    >
      <div style={{ height: 2, background: statusColor }} />

      <button
        className="w-full"
        style={{
          padding: "0.875rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
            <span style={{ fontWeight: 700, color: "white", fontSize: "0.875rem" }}>{listing.driverName}</span>
            <span style={{
              fontSize: "0.62rem", fontWeight: 800, padding: "0.1rem 0.4rem",
              borderRadius: "0.25rem", background: `${statusColor}22`, color: statusColor,
              textTransform: "capitalize",
            }}>{listing.status}</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            {listing.fromLabel} → {listing.toLabel}
          </p>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", margin: "0.15rem 0 0" }}>
            {depStr} · {listing.seatsLeft}/{listing.totalSeats} seats · ₹{listing.fare}
          </p>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0.875rem 1rem 1rem", borderTop: "1px solid rgba(99,102,241,0.15)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {/* Status */}
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.25rem" }}>STATUS</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ ...fieldStyle, appearance: "none" }}>
                  {["open", "full", "started", "completed", "cancelled", "expired"].map((s) => (
                    <option key={s} value={s} style={{ background: "#1e293b" }}>{s}</option>
                  ))}
                </select>
              </div>
              {/* Fare */}
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.25rem" }}>FARE (₹)</label>
                <input type="number" value={editFare} onChange={(e) => setEditFare(e.target.value)} style={fieldStyle} min={1} max={2000} />
              </div>
              {/* Pickup */}
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.25rem" }}>PICKUP POINT</label>
                <input type="text" value={editPickup} onChange={(e) => setEditPickup(e.target.value)} placeholder="e.g. Gate 2" style={fieldStyle} />
              </div>
              {/* Note */}
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.25rem" }}>NOTE</label>
                <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Optional note" style={fieldStyle} />
              </div>

              {error && (
                <p style={{ color: "#f87171", fontSize: "0.75rem", margin: 0 }}>{error}</p>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSave}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "0.625rem", borderRadius: "0.75rem",
                    fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", border: "none",
                    background: "rgba(37,99,235,0.2)", color: "#60a5fa", opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "Saving…" : "Save Changes"}
                </motion.button>

                {showDeleteConfirm ? (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleDelete}
                      disabled={loading}
                      style={{
                        flex: 1, padding: "0.625rem", borderRadius: "0.75rem",
                        fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", border: "none",
                        background: "rgba(239,68,68,0.25)", color: "#f87171", opacity: loading ? 0.5 : 1,
                      }}
                    >
                      Confirm Delete
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{
                        padding: "0.625rem 0.75rem", borderRadius: "0.75rem",
                        fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", border: "none",
                        background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Cancel
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    style={{
                      padding: "0.625rem 0.875rem", borderRadius: "0.75rem",
                      fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", border: "none",
                      background: "rgba(239,68,68,0.15)", color: "#f87171", opacity: loading ? 0.5 : 1,
                    }}
                  >
                    Delete
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminRidesScreen() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const listings = useQuery(api.admin.getAllListings, { adminId: userId! });

  const filtered = (listings ?? []).filter((l) => {
    const matchSearch =
      l.driverName.toLowerCase().includes(search.toLowerCase()) ||
      l.fromLabel.toLowerCase().includes(search.toLowerCase()) ||
      l.toLabel.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", paddingBottom: "2rem" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
        padding: "3rem 1rem 1.25rem",
        boxShadow: "0 4px 24px rgba(30,58,138,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => navigate("/admin")} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "0.625rem", padding: "0.5rem", cursor: "pointer", display: "flex" }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 900, color: "white", margin: 0 }}>Manage Rides</h1>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
              {listings === undefined ? "Loading…" : `${listings.length} listing${listings.length !== 1 ? "s" : ""} total`}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "1rem 1rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.875rem", padding: "0.625rem 0.875rem", marginBottom: "0.75rem" }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search driver, route…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: "0.875rem", outline: "none" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>}
        </div>

        {/* Status filter chips */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {["all", "open", "full", "started", "completed", "cancelled", "expired"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: "0.25rem 0.625rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700,
                cursor: "pointer", border: "none", transition: "all 0.15s",
                background: statusFilter === s ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)",
                color: statusFilter === s ? "#c7d2fe" : "rgba(255,255,255,0.5)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Listing list */}
      {listings === undefined ? (
        <div style={{ padding: "0 1rem" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ margin: "0 0 0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "1.25rem", padding: "1rem", height: 80 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 1rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🚗</div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
            {search || statusFilter !== "all" ? "No listings match your filter" : "No listings yet"}
          </p>
        </div>
      ) : (
        filtered.map((listing, i) => (
          <ListingRow key={listing._id} listing={listing as Listing} adminId={userId!} index={i} />
        ))
      )}
    </div>
  );
}
