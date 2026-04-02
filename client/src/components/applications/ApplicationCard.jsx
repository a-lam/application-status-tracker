import { useState, useRef, useEffect } from "react";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { getUrgencyBand } from "../../lib/getUrgencyBand.js";
import KebabMenu from "./KebabMenu.jsx";

function formatDueDate(dueDate) {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const delta = differenceInCalendarDays(due, today);
  const dateStr = format(new Date(dueDate), "d MMM yyyy");
  if (delta < 0) return dateStr;
  if (delta === 0) return `${dateStr} (Today)`;
  return `${dateStr} (${delta} day${delta === 1 ? "" : "s"} away)`;
}

export default function ApplicationCard({ application, onStatusToggle, onDeleteRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const descRef = useRef(null);
  const band = getUrgencyBand(application.dueDate);

  const hasDescription = !!application.jobDescription?.trim();
  const hasArtifacts = application.artifacts?.length > 0;
  const statusLabel = application.status === "SUBMITTED" ? "Submitted" : "Not Submitted";

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
        <span className="app-card__title">
          {application.jobTitle}{" "}
          <span className="app-card__status">({statusLabel})</span>
        </span>
        <KebabMenu
          application={application}
          onStatusToggle={onStatusToggle}
          onDeleteRequest={onDeleteRequest}
        />
      </div>

      <div className="app-card__header">
        <div className="app-card__employer">{application.employer}</div>
        <span className="app-card__due">Due: {formatDueDate(application.dueDate)}</span>
      </div>

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

      {hasArtifacts && (
        <div className="app-card__artifacts">
          <span className="app-card__artifacts-label">Artifacts: </span>
          {application.artifacts.map((a) => a.label).join(", ")}
        </div>
      )}
    </article>
  );
}
