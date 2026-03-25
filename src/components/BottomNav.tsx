import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {filled
      ? <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill="currentColor" stroke="none" />
      : <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" />}
  </svg>
);

const ChatIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill={filled ? "currentColor" : "none"} />
  </svg>
);

const ProfileIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" fill={filled ? "currentColor" : "none"} />
    <path d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" fill={filled ? "currentColor" : "none"} />
  </svg>
);

const AdminIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const profile = useQuery(api.users.getUserProfile, { userId: userId! });
  const isAdmin = profile?.isAdmin === true;

  const tabs = [
    { label: "Home", path: "/home", Icon: HomeIcon },
    { label: "TaraAI", path: "/chat", Icon: ChatIcon },
    { label: "Profile", path: "/profile", Icon: ProfileIcon },
    ...(isAdmin ? [{ label: "Admin", path: "/admin", Icon: AdminIcon }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex z-40"
      style={{
        background: "linear-gradient(180deg, rgba(15,23,42,0.97) 0%, #0f172a 100%)",
        borderTop: "1px solid rgba(99,102,241,0.2)",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
      }}
    >
      {tabs.map(({ label, path, Icon }) => {
        const active = pathname === path;
        return (
          <motion.button
            key={path}
            onClick={() => navigate(path)}
            whileTap={{ scale: 0.88 }}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 relative"
            style={{ color: active ? "transparent" : "rgba(255,255,255,0.38)", fontSize: "0.65rem", fontWeight: active ? 700 : 500, background: "none", border: "none", cursor: "pointer" }}
          >
            {/* Active glow */}
            {active && (
              <motion.div
                layoutId="nav-active-bg"
                style={{
                  position: "absolute", inset: 0,
                  background: "rgba(99,102,241,0.15)",
                  borderRadius: "0.5rem",
                  margin: "0.25rem 0.5rem",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={active ? { background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex" } : {}}>
                <Icon filled={active} />
              </div>
            </div>
            <span style={{
              position: "relative", zIndex: 1, fontSize: "0.65rem",
              background: active ? "linear-gradient(135deg,#60a5fa,#a78bfa)" : "none",
              WebkitBackgroundClip: active ? "text" : "unset",
              WebkitTextFillColor: active ? "transparent" : "rgba(255,255,255,0.38)",
              color: active ? "transparent" : "rgba(255,255,255,0.38)",
              fontWeight: active ? 700 : 500,
            }}>
              {label}
            </span>
            {/* Active dot indicator */}
            {active && (
              <motion.div
                layoutId="nav-dot"
                style={{ width: 4, height: 4, borderRadius: "50%", background: "linear-gradient(135deg,#60a5fa,#a78bfa)", position: "relative", zIndex: 1 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
