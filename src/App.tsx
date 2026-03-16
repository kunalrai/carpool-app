import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import DirectChatScreen from "./screens/DirectChatScreen";
import RideGroupChatScreen from "./screens/RideGroupChatScreen";
import CallScreen from "./screens/CallScreen";
import LandingPage from "./screens/LandingPage";
import PrivacyPolicy from "./screens/PrivacyPolicy";
import TermsOfService from "./screens/TermsOfService";
import DataSafety from "./screens/DataSafety";

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
        path="/chat"
        element={
          <PrivateRoute>
            <TabLayout><ChatScreen /></TabLayout>
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
      <Route path="/dm/:listingId/:otherUserId" element={<PrivateRoute><DirectChatScreen /></PrivateRoute>} />
      <Route path="/ride-chat/:listingId" element={<PrivateRoute><RideGroupChatScreen /></PrivateRoute>} />
      <Route path="/call/:mode/:listingId" element={<PrivateRoute><CallScreen /></PrivateRoute>} />
      <Route path="/call/:mode/:listingId/:otherUserId" element={<PrivateRoute><CallScreen /></PrivateRoute>} />

      {/* Landing page — full-width, no auth required */}
      <Route
        path="/"
        element={userId ? <Navigate to="/home" replace /> : <LandingPage />}
      />

      {/* Legal pages — full-width, public */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/data-safety" element={<DataSafety />} />

      {/* Default */}
      <Route path="*" element={<Navigate to={userId ? "/home" : "/"} replace />} />
    </Routes>
  );
}

/** Applies the mobile-frame constraint for all app screens, but not the landing page. */
function AppShell() {
  const location = useLocation();
  const fullWidthRoutes = ["/", "/privacy", "/terms", "/data-safety"];
  const isLanding = fullWidthRoutes.includes(location.pathname);

  if (isLanding) {
    return <AppRoutes />;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white relative">
      <AppRoutes />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
