import { useState, useRef } from "react";
import DatePickerField from "./DatePickerField.jsx";
import ArtifactListInput from "./ArtifactListInput.jsx";
import SalaryFields from "./SalaryFields.jsx";

export default function ApplicationForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  serverErrors = {},
  submitting = false,
  disablePast = true,
  artifactObjects,
}) {
  const [validationErrors, setValidationErrors] = useState({});
  const employerRef = useRef(null);
  const jobTitleRef = useRef(null);
  const jobListingUrlRef = useRef(null);
  const dueDateRef = useRef(null);

  const errors = { ...validationErrors, ...serverErrors };

  function parseSalary(val) {
    if (val === "" || val === undefined || val === null) return null;
    const trimmed = String(val).trim();
    if (trimmed === "") return null;
    // Must be a valid non-negative number — no letters or symbols allowed
    if (!/^\d+(\.\d+)?$/.test(trimmed)) return NaN;
    return parseFloat(trimmed);
  }

  function validateSalary(min, max) {
    const errs = {};
    const parsedMin = parseSalary(min);
    const parsedMax = parseSalary(max);

    if (parsedMin !== null && (isNaN(parsedMin) || parsedMin < 0)) {
      errs.salaryMin = "Starting salary must be a non-negative number.";
    }
    if (parsedMax !== null && (isNaN(parsedMax) || parsedMax < 0)) {
      errs.salaryMax = "Maximum salary must be a non-negative number.";
    }
    if (!errs.salaryMin && !errs.salaryMax && parsedMin !== null && parsedMax !== null && parsedMin >= parsedMax) {
      errs.salary = "Starting salary must be less than maximum salary.";
    }
    return errs;
  }

  function validateUrl(url) {
    const trimmed = url?.trim();
    if (!trimmed) return null;
    if (!/^https?:\/\//i.test(trimmed)) return "Please enter a valid URL (must start with http:// or https://).";
    return null;
  }

  function validate() {
    const errs = {};
    if (!formData.employer?.trim()) errs.employer = "Employer is required.";
    if (!formData.jobTitle?.trim()) errs.jobTitle = "Job title is required.";
    const urlErr = validateUrl(formData.jobListingUrl);
    if (urlErr) errs.jobListingUrl = urlErr;
    if (!formData.dueDate) errs.dueDate = "Due date is required.";
    return { ...errs, ...validateSalary(formData.salaryMin, formData.salaryMax) };
  }

  function handleSalaryBlur() {
    const salaryErrs = validateSalary(formData.salaryMin, formData.salaryMax);
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.salaryMin;
      delete next.salaryMax;
      delete next.salary;
      return { ...next, ...salaryErrs };
    });
  }

  function handleUrlBlur() {
    const urlErr = validateUrl(formData.jobListingUrl);
    setValidationErrors((prev) => {
      const next = { ...prev };
      if (urlErr) next.jobListingUrl = urlErr;
      else delete next.jobListingUrl;
      return next;
    });
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      if (errs.employer) employerRef.current?.focus();
      else if (errs.jobTitle) jobTitleRef.current?.focus();
      else if (errs.jobListingUrl) jobListingUrlRef.current?.focus();
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

      {/* Job Listing URL */}
      <div className="field">
        <label htmlFor="job-listing-url">Job Listing URL</label>
        <input
          ref={jobListingUrlRef}
          id="job-listing-url"
          type="url"
          value={formData.jobListingUrl ?? ""}
          onChange={(e) => onChange("jobListingUrl", e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://"
          aria-invalid={!!errors.jobListingUrl}
          aria-describedby={errors.jobListingUrl ? "job-listing-url-error" : undefined}
          disabled={submitting}
        />
        {errors.jobListingUrl && (
          <span id="job-listing-url-error" className="field-error" role="alert">
            {errors.jobListingUrl}
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
          disablePast={disablePast}
        />
      </div>

      {/* Salary */}
      <SalaryFields
        salaryMin={formData.salaryMin ?? ""}
        salaryMax={formData.salaryMax ?? ""}
        salaryCurrency={formData.salaryCurrency ?? "CAD"}
        onChange={onChange}
        onBlur={handleSalaryBlur}
        minError={errors.salaryMin}
        maxError={errors.salaryMax}
        crossError={errors.salary}
        disabled={submitting}
      />

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
          artifactObjects={artifactObjects}
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
