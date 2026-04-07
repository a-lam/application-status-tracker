import { useState } from "react";

export default function ArtifactsPanel({ applicationId, artifacts, onArtifactToggle }) {
  const [open, setOpen] = useState(false);

  if (!artifacts || artifacts.length === 0) return null;

  const completedCount = artifacts.filter((a) => a.completed).length;
  const totalCount = artifacts.length;
  const panelId = `artifacts-${applicationId}`;

  return (
    <div className="artifacts-panel">
      <button
        type="button"
        className="artifacts-panel__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="artifacts-panel__arrow" aria-hidden="true">
          {open ? "▼" : "▶"}
        </span>
        Artifacts ({completedCount}/{totalCount} completed)
      </button>

      {open && (
        <ul id={panelId} className="artifacts-panel__list" role="list">
          {artifacts.map((artifact) => (
            <li key={artifact.id} role="listitem" className="artifacts-panel__item">
              <label className="artifacts-panel__label">
                <input
                  type="checkbox"
                  className="artifact-check__input"
                  checked={artifact.completed}
                  onChange={(e) => onArtifactToggle(artifact.id, e.target.checked)}
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
