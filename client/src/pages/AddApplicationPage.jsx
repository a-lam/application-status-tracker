import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createApplication } from "../lib/api.js";
import ApplicationForm from "../components/applications/ApplicationForm.jsx";

const INITIAL_FORM = {
  employer: "",
  jobTitle: "",
  dueDate: "",
  jobDescription: "",
  artifacts: [],
};

export default function AddApplicationPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const navigate = useNavigate();

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
      await createApplication(formData);
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

      <h1>Add Application</h1>

      {globalError && (
        <div className="page-error" role="alert">
          {globalError}
        </div>
      )}

      <ApplicationForm
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        serverErrors={serverErrors}
        submitting={submitting}
      />
    </div>
  );
}
