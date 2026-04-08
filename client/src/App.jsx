import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { authClient } from "./lib/auth.js";
import { useTheme } from "./lib/useTheme.js";
import { ThemeContext } from "./lib/ThemeContext.js";
import LoginPage from "./pages/LoginPage.jsx";
import ApplicationsListPage from "./pages/ApplicationsListPage.jsx";
import AddApplicationPage from "./pages/AddApplicationPage.jsx";
import EditApplicationPage from "./pages/EditApplicationPage.jsx";

function ProtectedRoute({ children }) {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await authClient.getSession();
      if (!data) {
        navigate("/login", { replace: true });
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (isPending) return <div className="page-loading">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div className="page-loading">Loading…</div>;
  if (session) return <Navigate to="/applications" replace />;
  return children;
}

function RootRedirect() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div className="page-loading">Loading…</div>;
  return <Navigate to={session ? "/applications" : "/login"} replace />;
}

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {import.meta.env.DEV && (
        <div className="dev-banner" aria-hidden="true">Development</div>
      )}
      <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <ApplicationsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications/new"
        element={
          <ProtectedRoute>
            <AddApplicationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications/:id/edit"
        element={
          <ProtectedRoute>
            <EditApplicationPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ThemeContext.Provider>
  );
}
