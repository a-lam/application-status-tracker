export default function ArtifactItem({ label, onRemove }) {
  return (
    <div className="artifact-item">
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
