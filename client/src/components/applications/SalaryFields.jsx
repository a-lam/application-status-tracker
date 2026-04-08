const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD", "JPY", "KRW"];

export default function SalaryFields({
  salaryMin,
  salaryMax,
  salaryCurrency,
  onChange,
  onBlur,
  minError,
  maxError,
  crossError,
  disabled,
}) {
  return (
    <fieldset className="salary-fields">
      <legend>Salary</legend>

      <div className="salary-row">
        <div className="field">
          <label htmlFor="salary-min">Starting Salary</label>
          <input
            id="salary-min"
            type="text"
            inputMode="numeric"
            value={salaryMin}
            onChange={(e) => onChange("salaryMin", e.target.value)}
            onBlur={onBlur}
            aria-invalid={!!(minError || crossError)}
            aria-describedby={
              minError ? "salary-min-error" : crossError ? "salary-cross-error" : undefined
            }
            disabled={disabled}
          />
          {minError && (
            <span id="salary-min-error" className="field-error" role="alert">
              {minError}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="salary-max">Maximum Salary</label>
          <input
            id="salary-max"
            type="text"
            inputMode="numeric"
            value={salaryMax}
            onChange={(e) => onChange("salaryMax", e.target.value)}
            onBlur={onBlur}
            aria-invalid={!!(maxError || crossError)}
            aria-describedby={
              maxError ? "salary-max-error" : crossError ? "salary-cross-error" : undefined
            }
            disabled={disabled}
          />
          {maxError && (
            <span id="salary-max-error" className="field-error" role="alert">
              {maxError}
            </span>
          )}
        </div>

        <div className="field salary-currency">
          <label htmlFor="salary-currency">Currency</label>
          <select
            id="salary-currency"
            value={salaryCurrency}
            onChange={(e) => onChange("salaryCurrency", e.target.value)}
            disabled={disabled}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {crossError && (
        <span id="salary-cross-error" className="field-error" role="alert">
          {crossError}
        </span>
      )}
    </fieldset>
  );
}
