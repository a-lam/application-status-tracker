import { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApplications, updateApplicationStatus, deleteApplication, updateArtifactCompleted } from "../lib/api.js";
import { authClient } from "../lib/auth.js";
import { ThemeContext } from "../lib/ThemeContext.js";
import ApplicationList from "../components/applications/ApplicationList.jsx";
import EmptyState from "../components/applications/EmptyState.jsx";
import DeleteConfirmDialog from "../components/applications/DeleteConfirmDialog.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

export default function ApplicationsListPage() {
  usePageTitle("Applications Tracker");
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const menuRef = useRef(null);
  const { data: session } = authClient.useSession();
  const pendingDeleteTriggerRef = useRef(null);
  const navigate = useNavigate();

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await getApplications();
      setApplications(data);
    } catch {
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  async function handleArtifactToggle(artifactId, completed) {
    setApplications((apps) =>
      apps.map((app) => ({
        ...app,
        artifacts: app.artifacts.map((a) =>
          a.id === artifactId ? { ...a, completed } : a
        ),
      }))
    );
    try {
      await updateArtifactCompleted(artifactId, completed);
    } catch {
      setApplications((apps) =>
        apps.map((app) => ({
          ...app,
          artifacts: app.artifacts.map((a) =>
            a.id === artifactId ? { ...a, completed: !completed } : a
          ),
        }))
      );
    }
  }

  const STATUS_LABELS = {
    NOT_SUBMITTED: "Not Submitted",
    SUBMITTED: "Submitted",
    INTERVIEWING: "Interviewing",
    OFFER_RECEIVED: "Offer Received",
    OFFER_ACCEPTED: "Offer Accepted",
    OFFER_DECLINED: "Offer Declined",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
  };

  async function handleStatusUpdate(id, newStatus) {
    try {
      const updated = await updateApplicationStatus(id, newStatus);
      setApplications((apps) => apps.map((a) => (a.id === id ? updated : a)));
      const app = applications.find((a) => a.id === id);
      const label = STATUS_LABELS[newStatus] ?? newStatus;
      if (app) {
        setStatusAnnouncement(`${app.jobTitle} at ${app.employer} marked as ${label}.`);
      }
    } catch {
      // status update failure is silent; a retry is available via the kebab menu
    }
  }

  function handleDeleteRequest(id, triggerEl) {
    const app = applications.find((a) => a.id === id);
    pendingDeleteTriggerRef.current = triggerEl ?? null;
    setPendingDelete(app ?? null);
  }

  async function handleDeleteConfirm(id) {
    try {
      await deleteApplication(id);
      setApplications((apps) => apps.filter((a) => a.id !== id));
    } finally {
      setPendingDelete(null);
    }
  }

  function handleDeleteCancel() {
    setPendingDelete(null);
  }

  async function handleLogout() {
    await authClient.signOut();
    navigate("/login");
  }

  return (
    <div className="page">
      <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
        {statusAnnouncement}
      </div>

      <div className="page-header">
        <Link
          to="/applications/new"
          className="btn btn-primary add-application-btn"
          aria-label="Add an application"
        >
          <span className="add-application-btn__full" aria-hidden="true">+ Add an application</span>
          <span className="add-application-btn__short" aria-hidden="true">+</span>
        </Link>
        <div className="page-header__right">
          {session?.user?.email && (
            <span className="page-header__user-email" aria-hidden="true">
              {session.user.email}
            </span>
          )}
          <div className="kebab-menu" ref={menuRef}>
            <button
              type="button"
              className="kebab-menu__trigger"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Page options"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ⋮
            </button>
            {menuOpen && (
              <ul className="kebab-menu__dropdown" role="menu">
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="kebab-menu__item"
                    onClick={() => { toggleTheme(); setMenuOpen(false); }}
                  >
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                </li>
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="kebab-menu__item"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {loading && <div className="page-loading">Loading…</div>}

      {!loading && error && (
        <div className="page-error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && applications.length === 0 && <EmptyState />}

      {!loading && !error && applications.length > 0 && (
        <ApplicationList
          applications={applications}
          onStatusUpdate={handleStatusUpdate}
          onDeleteRequest={handleDeleteRequest}
          onArtifactToggle={handleArtifactToggle}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmDialog
          application={pendingDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          returnFocusTo={pendingDeleteTriggerRef.current}
        />
      )}
    </div>
  );
}
