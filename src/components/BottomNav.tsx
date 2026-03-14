import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {filled
        ? <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill="currentColor" stroke="none" />
        : <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" />}
    </svg>
  );
}

function ProfileIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" fill={filled ? "currentColor" : "none"} />
      <path d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" strokeWidth={2} fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

function ChatIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

function AdminIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const profile = useQuery(api.users.getUserProfile, { userId: userId! });
  const isAdmin = profile?.isAdmin === true;

  const tabs = [
    { label: "Home",    path: "/home",    Icon: HomeIcon },
    { label: "Chats",   path: "/chats",   Icon: ChatIcon },
    { label: "Profile", path: "/profile", Icon: ProfileIcon },
    ...(isAdmin ? [{ label: "Admin", path: "/admin", Icon: AdminIcon }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map(({ label, path, Icon }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              active ? "text-brand-700" : "text-gray-400"
            }`}
          >
            <Icon filled={active} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
