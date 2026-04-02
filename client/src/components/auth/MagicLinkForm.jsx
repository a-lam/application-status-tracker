import { useState, useRef } from "react";
import { authClient } from "../../lib/auth.js";

export default function MagicLinkForm({ onSuccess, defaultEmail = "" }) {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      inputRef.current?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    const result = await authClient.signIn.magicLink({
      email: trimmed,
      callbackURL: "/applications",
    });
    setLoading(false);

    if (result?.error) {
      if (result.error.status === 429) {
        setError("Too many requests. Please wait a few minutes before trying again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    onSuccess(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={loading} noValidate>
      <div className="field">
        <label htmlFor="magic-email">Email address</label>
        <input
          ref={inputRef}
          id="magic-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          autoComplete="email"
          aria-describedby={error ? "magic-email-error" : undefined}
          aria-invalid={!!error}
          disabled={loading}
        />
        {error && (
          <span id="magic-email-error" className="field-error" role="alert">
            {error}
          </span>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Sending…" : "Send sign-in link"}
        </button>
      </div>
    </form>
  );
}
