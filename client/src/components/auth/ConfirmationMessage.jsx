import { useEffect, useRef } from "react";

export default function ConfirmationMessage({ email, onReset }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      className="confirmation-message"
      tabIndex={-1}
      aria-live="polite"
    >
      <h2>Check your inbox</h2>
      <p>
        We sent a sign-in link to <strong>{email}</strong>.
      </p>
      <p className="expiry-note">The link expires in 15 minutes.</p>
      <p>
        Didn&apos;t get it?{" "}
        <button type="button" className="btn-link" onClick={onReset}>
          Send again
        </button>
      </p>
    </div>
  );
}
