export default function ArtifactItem({ label, onRemove, completed }) {
  const hasCompletion = completed !== undefined;

  return (
    <div className={`artifact-item${hasCompletion && completed ? " artifact-item--completed" : ""}`}>
      {hasCompletion && (
        <span
          className={`artifact-check__box${completed ? " artifact-check__box--checked" : ""}`}
          aria-label={completed ? "Completed" : "Not completed"}
          role="img"
        />
      )}
      <span className="artifact-item__label">{label}</span>
      <button
        type="button"
        className="artifact-item__remove"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}
