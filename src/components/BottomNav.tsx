import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const profile = useQuery(api.users.getUserProfile, { userId: userId! });
  const isAdmin = profile?.isAdmin === true;

  const tabs = [
    {
      label: "Home",
      path: "/home",
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill={active ? "currentColor" : "none"} />
        </svg>
      ),
    },
    {
      label: "TaraAI",
      path: "/chat",
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6.48 2 2 5.92 2 10.8c0 2.64 1.28 5.01 3.33 6.65L4 21l4.5-2.25A11.4 11.4 0 0012 19.6c5.52 0 10-3.92 10-8.8S17.52 2 12 2z" fill={active ? "currentColor" : "none"} />
          <circle cx="8.5" cy="10.5" r="1" fill={active ? "white" : "currentColor"} stroke="none" />
          <circle cx="12" cy="10.5" r="1" fill={active ? "white" : "currentColor"} stroke="none" />
          <circle cx="15.5" cy="10.5" r="1" fill={active ? "white" : "currentColor"} stroke="none" />
        </svg>
      ),
    },
    {
      label: "Profile",
      path: "/profile",
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} />
          <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" fill={active ? "currentColor" : "none"} />
        </svg>
      ),
    },
    ...(isAdmin
      ? [{
          label: "Admin",
          path: "/admin",
          icon: (active: boolean) => (
            <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill={active ? "currentColor" : "none"} />
            </svg>
          ),
        }]
      : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex z-40"
      style={{
        background: "#0f172a",
        borderTop: "1px solid rgba(99,102,241,0.25)",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {tabs.map(({ label, path, icon }) => {
        const active = pathname === path;
        return (
          <motion.button
            key={path}
            onClick={() => navigate(path)}
            whileTap={{ scale: 0.85 }}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: active ? "#818cf8" : "rgba(255,255,255,0.45)",
              position: "relative",
            }}
          >
            {/* Active top indicator bar */}
            {active && (
              <motion.div
                layoutId="nav-bar"
                style={{
                  position: "absolute",
                  top: 0, left: "15%", right: "15%", height: 2,
                  background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                  borderRadius: "0 0 2px 2px",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            {/* Active background pill */}
            {active && (
              <motion.div
                layoutId="nav-pill"
                style={{
                  position: "absolute",
                  inset: "4px 8px",
                  background: "rgba(99,102,241,0.18)",
                  borderRadius: "0.625rem",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            <div style={{ position: "relative", zIndex: 1 }}>
              {icon(active)}
            </div>
            <span style={{
              position: "relative",
              zIndex: 1,
              fontSize: "0.62rem",
              fontWeight: active ? 800 : 500,
              letterSpacing: active ? "0.02em" : "0",
              color: active ? "#818cf8" : "rgba(255,255,255,0.45)",
            }}>
              {label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
