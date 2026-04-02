import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApplications, updateApplicationStatus, deleteApplication } from "../lib/api.js";
import { authClient } from "../lib/auth.js";
import ApplicationList from "../components/applications/ApplicationList.jsx";
import EmptyState from "../components/applications/EmptyState.jsx";
import DeleteConfirmDialog from "../components/applications/DeleteConfirmDialog.jsx";

export default function ApplicationsListPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
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

  async function handleStatusToggle(id, newStatus) {
    try {
      const updated = await updateApplicationStatus(id, newStatus);
      setApplications((apps) => apps.map((a) => (a.id === id ? updated : a)));
    } catch {
      // status toggle failure is silent; a retry is available via the kebab menu
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
      <div className="page-header">
        <Link to="/applications/new" className="btn btn-primary">
          + Add an application
        </Link>
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
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            </ul>
          )}
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
          onStatusToggle={handleStatusToggle}
          onDeleteRequest={handleDeleteRequest}
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
