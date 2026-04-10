import { useState, useRef, useEffect } from "react";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { getStatusBand } from "../../lib/getStatusBand.js";
import KebabMenu from "./KebabMenu.jsx";
import ArtifactsPanel from "./ArtifactsPanel.jsx";

const CURRENCY_SYMBOLS = { CAD: "$", USD: "$", EUR: "€", GBP: "£", AUD: "$", JPY: "¥", KRW: "₩" };

function formatSalary(min, max, currency) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "$";
  const code = currency ?? "";
  const fmt = (n) => Number(n).toLocaleString("en-CA", { maximumFractionDigits: 0 });
  if (min != null && max != null) return `${symbol}${fmt(min)}–${symbol}${fmt(max)} ${code}`;
  if (min != null) return `${symbol}${fmt(min)}+ ${code}`;
  if (max != null) return `up to ${symbol}${fmt(max)} ${code}`;
  return null;
}

function formatDueDate(dueDate) {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const delta = differenceInCalendarDays(due, today);
  const dateStr = format(new Date(dueDate), "d MMM yyyy");
  if (delta < 0) return dateStr;
  if (delta === 0) return `${dateStr} (Today)`;
  return `${dateStr} (${delta} day${delta === 1 ? "" : "s"} away)`;
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

const STATUS_BADGE_CLASS = {
  NOT_SUBMITTED: "status-badge--not-submitted",
  SUBMITTED:     "status-badge--submitted",
  INTERVIEWING:  "status-badge--interviewing",
  OFFER_RECEIVED:"status-badge--offer-received",
  OFFER_ACCEPTED:"status-badge--offer-accepted",
  OFFER_DECLINED:"status-badge--offer-declined",
  REJECTED:      "status-badge--rejected",
  WITHDRAWN:     "status-badge--withdrawn",
};


export default function ApplicationCard({ application, onStatusUpdate, onDeleteRequest, onArtifactToggle, readOnly = false }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const descRef = useRef(null);
  const band = getStatusBand(application.status);

  const hasDescription = !!application.jobDescription?.trim();
  const statusLabel = STATUS_LABELS[application.status] ?? application.status;
  const statusBadgeClass = STATUS_BADGE_CLASS[application.status] ?? "status-badge--not-submitted";
  const salaryDisplay = formatSalary(application.salaryMin, application.salaryMax, application.salaryCurrency);
  const hasMeta = !!(application.jobListingUrl || application.jobStartDate || application.jobStartText || salaryDisplay);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const check = () => {
      if (el.scrollHeight > el.clientHeight) setOverflows(true);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [application.jobDescription]);

  return (
    <article
      className={`app-card card--${band}`}
      aria-label={`Application: ${application.jobTitle} at ${application.employer}`}
    >
      <div className="app-card__row1">
        <div className="app-card__title-group">
          <span className="app-card__title">{application.jobTitle}</span>
          <div className="app-card__employer">{application.employer}</div>
          <span className="app-card__due app-card__due--mobile">Due: {formatDueDate(application.dueDate)}</span>
          <span className={`status-badge ${statusBadgeClass}`}>{statusLabel}</span>
        </div>
        <div className="app-card__actions">
          <span className="app-card__due app-card__due--desktop">Due: {formatDueDate(application.dueDate)}</span>
          {!readOnly && (
            <KebabMenu
              application={application}
              onStatusUpdate={onStatusUpdate}
              onDeleteRequest={onDeleteRequest}
            />
          )}
        </div>
      </div>

      {hasMeta && (
        <div className="app-card__meta">
          {application.jobListingUrl && (
            <a
              className="app-card__listing-link"
              href={application.jobListingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Job Listing →
              <span className="sr-only"> for {application.jobTitle} at {application.employer}</span>
            </a>
          )}

          {(application.jobStartDate || application.jobStartText) && (
            <div className="app-card__job-start">
              <span className="app-card__inline-label">Job Start:</span>
              {application.jobStartDate
                ? format(new Date(application.jobStartDate), "d MMM yyyy")
                : application.jobStartText}
            </div>
          )}

          {salaryDisplay && (
            <div className="app-card__salary">
              <span className="app-card__inline-label">Salary:</span>
              {salaryDisplay}
            </div>
          )}
        </div>
      )}

      {hasDescription && (
        <div className="app-card__description">
          <span className="app-card__description-label">Job Description:</span>
          <p
            ref={descRef}
            className={expanded ? "" : "app-card__description--clamped"}
          >
            {application.jobDescription}
          </p>
          {overflows && (
            <button
              type="button"
              className="btn-link"
              aria-expanded={expanded}
              aria-label={expanded ? "Show less of job description" : "Show full job description"}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      <ArtifactsPanel
        applicationId={application.id}
        artifacts={application.artifacts}
        onArtifactToggle={onArtifactToggle}
        readOnly={readOnly}
      />
    </article>
  );
}
