import { useState, useRef, useEffect } from "react";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { getUrgencyBand } from "../../lib/getUrgencyBand.js";

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

function ReadOnlyArtifactsPanel({ applicationId, artifacts }) {
  const [open, setOpen] = useState(false);
  if (!artifacts || artifacts.length === 0) return null;

  const completedCount = artifacts.filter((a) => a.completed).length;
  const panelId = `artifacts-ro-${applicationId}`;

  return (
    <div className="artifacts-panel">
      <button
        type="button"
        className="artifacts-panel__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="artifacts-panel__arrow" aria-hidden="true">{open ? "▼" : "▶"}</span>
        {open ? "Hide" : "Show"} artifacts ({completedCount}/{artifacts.length} completed)
      </button>
      {open && (
        <ul id={panelId} className="artifacts-panel__list" role="list">
          {artifacts.map((artifact) => (
            <li key={artifact.id} role="listitem" className="artifacts-panel__item">
              <label className="artifacts-panel__label artifacts-panel__label--readonly">
                <input
                  type="checkbox"
                  className="artifact-check__input"
                  checked={artifact.completed}
                  disabled
                  readOnly
                  aria-label={artifact.label}
                />
                <span className="artifact-check__box" aria-hidden="true" />
                <span className={artifact.completed ? "artifact-check__text--completed" : undefined}>
                  {artifact.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SharedApplicationCard({ application }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const descRef = useRef(null);
  const band = getUrgencyBand(application.dueDate, application.status);

  const hasDescription = !!application.jobDescription?.trim();
  const statusLabel = STATUS_LABELS[application.status] ?? application.status;
  const salaryDisplay = formatSalary(application.salaryMin, application.salaryMax, application.salaryCurrency);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const check = () => { if (el.scrollHeight > el.clientHeight) setOverflows(true); };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [application.jobDescription]);

  return (
    <article
      className={`app-card card--${band}${application.status === "OFFER_ACCEPTED" ? " app-card--offer-accepted" : ""}`}
      aria-label={`Application: ${application.jobTitle} at ${application.employer}`}
    >
      <div className="app-card__row1">
        <span className="app-card__title">
          {application.jobTitle}{" "}
          <span className="app-card__status">({statusLabel})</span>
        </span>
      </div>

      <div className="app-card__header">
        <div className="app-card__employer">{application.employer}</div>
        <span className="app-card__due">Due: {formatDueDate(application.dueDate)}</span>
      </div>

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

      {salaryDisplay && <div className="app-card__salary">{salaryDisplay}</div>}

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

      <ReadOnlyArtifactsPanel
        applicationId={application.id}
        artifacts={application.artifacts}
      />
    </article>
  );
}
