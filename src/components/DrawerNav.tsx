import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  {
    label: "Home",
    path: "/home",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" />
      </svg>
    ),
  },
  {
    label: "TaraAI",
    path: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 5.92 2 10.8c0 2.64 1.28 5.01 3.33 6.65L4 21l4.5-2.25A11.4 11.4 0 0012 19.6c5.52 0 10-3.92 10-8.8S17.52 2 12 2z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "/profile",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: "Blog",
    path: "/blog",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

export default function DrawerNav({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { userId, logout } = useAuth();

  const profile = useQuery(api.users.getUserProfile, { userId: userId! });
  const isAdmin = profile?.isAdmin === true;
  const firstName = profile?.name?.split(" ")[0] ?? "";

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer panel */}
      <motion.div
        initial={false}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        className="fixed top-0 left-0 h-full w-72 max-w-[80vw] z-50 flex flex-col"
        style={{
          background: "#0f172a",
          borderRight: "1px solid rgba(99,102,241,0.25)",
          boxShadow: "8px 0 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-14 pb-5"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* Logo mark */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
                  <rect x="9" y="11" width="14" height="10" rx="2" />
                  <circle cx="12" cy="16" r="1" />
                  <circle cx="20" cy="16" r="1" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">CarPool</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {profile && (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{profile.name}</p>
                <p className="text-xs truncate" style={{ color: "rgba(196,181,253,0.8)" }}>
                  {profile.role === "giver" || profile.role === "both" ? "Car owner" : "Rider"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_ITEMS.map(({ label, path, icon }) => {
            const active = pathname === path;
            return (
              <motion.button
                key={path}
                onClick={() => go(path)}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium relative"
                style={{
                  color: active ? "#818cf8" : "rgba(255,255,255,0.6)",
                  background: active ? "rgba(99,102,241,0.12)" : "transparent",
                  borderRight: active ? "3px solid #6366f1" : "3px solid transparent",
                }}
              >
                <span style={{ color: active ? "#818cf8" : "rgba(255,255,255,0.35)" }}>{icon}</span>
                {label}
              </motion.button>
            );
          })}

          {isAdmin && (
            <motion.button
              onClick={() => go("/admin")}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium"
              style={{
                color: pathname === "/admin" ? "#818cf8" : "rgba(255,255,255,0.6)",
                background: pathname === "/admin" ? "rgba(99,102,241,0.12)" : "transparent",
                borderRight: pathname === "/admin" ? "3px solid #6366f1" : "3px solid transparent",
              }}
            >
              <span style={{ color: pathname === "/admin" ? "#818cf8" : "rgba(255,255,255,0.35)" }}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
                </svg>
              </span>
              Admin
            </motion.button>
          )}

          <div className="mx-5 my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

          <button
            onClick={() => go("/privacy")}
            className="w-full flex items-center gap-3 px-5 py-3 text-sm"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => go("/terms")}
            className="w-full flex items-center gap-3 px-5 py-3 text-sm"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Terms of Service
          </button>
        </nav>

        {/* Sign out */}
        <div
          className="px-5 py-4"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
          }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold"
            style={{
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              background: "rgba(239,68,68,0.07)",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
