import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
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
    label: "Chat",
    path: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
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
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-1/2 -translate-x-1/2 h-full w-72 max-w-[80vw] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-[-50%]" : "translate-x-[-200%]"
        }`}
        style={{ maxWidth: "min(18rem, calc(var(--max-w, 448px) * 0.8))" }}
      >
        {/* Header */}
        <div className="bg-brand-700 px-5 pt-14 pb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold text-lg">GC Carpool</span>
            <button onClick={onClose} className="p-1 rounded-lg active:bg-white/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {profile && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{profile.name}</p>
                <p className="text-blue-200 text-xs truncate">
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
              <button
                key={path}
                onClick={() => go(path)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700 border-r-4 border-brand-700"
                    : "text-gray-700 active:bg-gray-50"
                }`}
              >
                <span className={active ? "text-brand-700" : "text-gray-400"}>{icon}</span>
                {label}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => go("/admin")}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                pathname === "/admin"
                  ? "bg-brand-50 text-brand-700 border-r-4 border-brand-700"
                  : "text-gray-700 active:bg-gray-50"
              }`}
            >
              <span className={pathname === "/admin" ? "text-brand-700" : "text-gray-400"}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
                </svg>
              </span>
              Admin
            </button>
          )}

          <div className="mx-5 my-2 border-t border-gray-100" />

          <button
            onClick={() => go("/privacy")}
            className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-400 active:bg-gray-50"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => go("/terms")}
            className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-400 active:bg-gray-50"
          >
            Terms of Service
          </button>
        </nav>

        {/* Sign out */}
        <div className="px-5 py-4 border-t border-gray-100"
             style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-red-200 text-red-600 text-sm font-semibold active:bg-red-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
