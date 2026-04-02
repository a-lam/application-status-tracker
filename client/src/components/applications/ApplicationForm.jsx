import { useState, useRef } from "react";
import DatePickerField from "./DatePickerField.jsx";
import ArtifactListInput from "./ArtifactListInput.jsx";

export default function ApplicationForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  serverErrors = {},
  submitting = false,
}) {
  const [validationErrors, setValidationErrors] = useState({});
  const employerRef = useRef(null);
  const jobTitleRef = useRef(null);
  const dueDateRef = useRef(null);

  const errors = { ...validationErrors, ...serverErrors };

  function validate() {
    const errs = {};
    if (!formData.employer?.trim()) errs.employer = "Employer is required.";
    if (!formData.jobTitle?.trim()) errs.jobTitle = "Job title is required.";
    if (!formData.dueDate) errs.dueDate = "Due date is required.";
    return errs;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      if (errs.employer) employerRef.current?.focus();
      else if (errs.jobTitle) jobTitleRef.current?.focus();
      else if (errs.dueDate) dueDateRef.current?.focus();
      return;
    }
    setValidationErrors({});
    onSubmit();
  }

  return (
    <div className="app-form">
      {/* Employer */}
      <div className="field">
        <label htmlFor="employer">
          Employer <span aria-hidden="true">*</span>
        </label>
        <input
          ref={employerRef}
          id="employer"
          type="text"
          value={formData.employer}
          onChange={(e) => onChange("employer", e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.employer}
          aria-describedby={errors.employer ? "employer-error" : undefined}
          disabled={submitting}
        />
        {errors.employer && (
          <span id="employer-error" className="field-error" role="alert">
            {errors.employer}
          </span>
        )}
      </div>

      {/* Job Title */}
      <div className="field">
        <label htmlFor="job-title">
          Job Title <span aria-hidden="true">*</span>
        </label>
        <input
          ref={jobTitleRef}
          id="job-title"
          type="text"
          value={formData.jobTitle}
          onChange={(e) => onChange("jobTitle", e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.jobTitle}
          aria-describedby={errors.jobTitle ? "job-title-error" : undefined}
          disabled={submitting}
        />
        {errors.jobTitle && (
          <span id="job-title-error" className="field-error" role="alert">
            {errors.jobTitle}
          </span>
        )}
      </div>

      {/* Due Date */}
      <div className="field" ref={dueDateRef}>
        <label htmlFor="due-date">
          Due Date <span aria-hidden="true">*</span>
        </label>
        <DatePickerField
          id="due-date"
          value={formData.dueDate}
          onChange={(val) => onChange("dueDate", val)}
          error={errors.dueDate}
        />
      </div>

      {/* Job Description */}
      <div className="field">
        <label htmlFor="job-description">Job Description</label>
        <textarea
          id="job-description"
          value={formData.jobDescription}
          onChange={(e) => onChange("jobDescription", e.target.value)}
          rows={5}
          disabled={submitting}
        />
      </div>

      {/* Artifacts */}
      <div className="field">
        <label>Artifacts</label>
        <ArtifactListInput
          artifacts={formData.artifacts}
          onChange={(val) => onChange("artifacts", val)}
        />
      </div>

      <p className="required-note">* Required field</p>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={submitting}
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
