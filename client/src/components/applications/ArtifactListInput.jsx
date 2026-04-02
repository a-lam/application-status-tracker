import { useState } from "react";
import ArtifactItem from "./ArtifactItem.jsx";

export default function ArtifactListInput({ artifacts, onChange }) {
  const [inputValue, setInputValue] = useState("");
  const [inlineError, setInlineError] = useState("");

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const isDuplicate = artifacts.some(
      (a) => a.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setInlineError("This artifact already exists.");
      return;
    }

    onChange([...artifacts, trimmed]);
    setInputValue("");
    setInlineError("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleRemove(index) {
    onChange(artifacts.filter((_, i) => i !== index));
  }

  return (
    <div className="artifact-list-input">
      <div className="artifact-list-input__controls">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setInlineError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Add an artifact…"
          aria-label="Artifact name"
          aria-describedby={inlineError ? "artifact-error" : undefined}
        />
        <button type="button" className="btn btn-secondary" onClick={handleAdd}>
          + Add
        </button>
      </div>

      {inlineError && (
        <span id="artifact-error" className="field-error" role="alert">
          {inlineError}
        </span>
      )}

      {artifacts.length > 0 && (
        <div className="artifact-list">
          {artifacts.map((label, i) => (
            <ArtifactItem
              key={`${label}-${i}`}
              label={label}
              onRemove={() => handleRemove(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
