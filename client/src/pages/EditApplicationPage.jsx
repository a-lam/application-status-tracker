import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getApplication, updateApplication } from "../lib/api.js";
import ApplicationForm from "../components/applications/ApplicationForm.jsx";

export default function EditApplicationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const app = await getApplication(id);
        setFormData({
          employer: app.employer,
          jobTitle: app.jobTitle,
          dueDate: app.dueDate.slice(0, 10),
          jobDescription: app.jobDescription ?? "",
          artifacts: app.artifacts.map((a) => a.label),
        });
      } catch {
        setLoadError("Failed to load application. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (serverErrors[field]) {
      setServerErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setGlobalError("");
    setServerErrors({});

    try {
      await updateApplication(id, formData);
      navigate("/applications");
    } catch (err) {
      if (err.status === 422 && err.data?.errors) {
        setServerErrors(err.data.errors);
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  function handleCancel() {
    navigate("/applications");
  }

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/applications" className="back-link">
          ← Back to Applications
        </Link>
      </div>

      <h1>Edit Application</h1>

      {loading && <div className="page-loading">Loading…</div>}

      {!loading && loadError && (
        <div className="page-error" role="alert">
          {loadError}
        </div>
      )}

      {!loading && !loadError && globalError && (
        <div className="page-error" role="alert">
          {globalError}
        </div>
      )}

      {!loading && !loadError && formData && (
        <ApplicationForm
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          serverErrors={serverErrors}
          submitting={submitting}
        />
      )}
    </div>
  );
}
