import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import BottomNav from "./components/BottomNav";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import PostRideScreen from "./screens/PostRideScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AdminScreen from "./screens/AdminScreen";
import ListingDetailScreen from "./screens/ListingDetailScreen";
import MyListingScreen from "./screens/MyListingScreen";
import ChatScreen from "./screens/ChatScreen";
import ChatsScreen from "./screens/ChatsScreen";

// ── Layouts ───────────────────────────────────────────────────────────────

/** Wraps the two bottom-nav tabs (Home + Profile) */
function TabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
      <BottomNav />
    </div>
  );
}

// ── Auth guard ────────────────────────────────────────────────────────────

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  return userId ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const profile = useQuery(api.users.getUserProfile, { userId: userId! });
  if (!userId) return <Navigate to="/login" replace />;
  if (profile === undefined) return null; // loading
  if (!profile?.isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
}


// ── Routes ────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { userId } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={userId ? <Navigate to="/home" replace /> : <LoginScreen />}
      />

      {/* Bottom-nav tabs */}
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <TabLayout><HomeScreen /></TabLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <TabLayout><ProfileScreen /></TabLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/chats"
        element={
          <PrivateRoute>
            <TabLayout><ChatsScreen /></TabLayout>
          </PrivateRoute>
        }
      />

      {/* Admin tab */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <TabLayout><AdminScreen /></TabLayout>
          </AdminRoute>
        }
      />

      {/* Full-screen pushed screens (no bottom nav) */}
      <Route path="/post-ride" element={<PrivateRoute><PostRideScreen /></PrivateRoute>} />
      <Route path="/listing/:id" element={<PrivateRoute><ListingDetailScreen /></PrivateRoute>} />
      <Route path="/my-listing" element={<PrivateRoute><MyListingScreen /></PrivateRoute>} />
      <Route path="/chat/:id" element={<PrivateRoute><ChatScreen /></PrivateRoute>} />

      {/* Default */}
      <Route path="*" element={<Navigate to={userId ? "/home" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen max-w-md mx-auto bg-white relative">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
