import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import "react-day-picker/style.css";

export default function DatePickerField({ value, onChange, error, id = "due-date" }) {
  const [open, setOpen] = useState(false);

  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const displayValue =
    selected && isValid(selected) ? format(selected, "EEE d MMM yyyy") : "";

  function handleSelect(date) {
    if (!date) return;
    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <div className="date-picker-field">
      <div className="date-picker-field__trigger">
        <input
          id={id}
          type="text"
          readOnly
          value={displayValue}
          placeholder="Select a date…"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((v) => !v);
            }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        <span className="date-picker-field__icon" aria-hidden="true">📅</span>
      </div>

      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}

      {open && (
        <div
          className="date-picker-field__popover"
          role="dialog"
          aria-label="Select due date"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={{ before: new Date() }}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
