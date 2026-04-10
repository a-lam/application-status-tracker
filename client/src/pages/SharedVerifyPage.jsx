import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { requestCode, verifyCode } from "../lib/api.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

function getStoredRetryAfter(token) {
  try {
    const stored = localStorage.getItem(`share-retry-${token}`);
    return stored ? new Date(stored) : null;
  } catch {
    return null;
  }
}

function setStoredRetryAfter(token, date) {
  try {
    localStorage.setItem(`share-retry-${token}`, date.toISOString());
  } catch {}
}

function clearStoredRetryAfter(token) {
  try {
    localStorage.removeItem(`share-retry-${token}`);
  } catch {}
}

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SharedVerifyPage() {
  usePageTitle("Verify Access");
  const { token } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState("loading"); // loading | form | error | locked
  const [errorMsg, setErrorMsg] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  function startCountdown(retryAfterDate) {
    setStoredRetryAfter(token, retryAfterDate);
    clearInterval(timerRef.current);
    const tick = () => {
      const secs = Math.max(0, Math.ceil((retryAfterDate - new Date()) / 1000));
      setSecondsLeft(secs);
      if (secs === 0) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    const stored = getStoredRetryAfter(token);
    if (stored && stored > new Date()) {
      setState("form");
      startCountdown(stored);
    } else {
      clearStoredRetryAfter(token);
      sendCode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function sendCode() {
    setState("loading");
    const { status, data } = await requestCode(token);

    if (status === 200) {
      if (data?.email) setMaskedEmail(data.email);
      setState("form");
      startCountdown(new Date(data.retryAfter));
    } else if (status === 429) {
      if (data?.lockedUntil) {
        setErrorMsg(
          `This link is temporarily locked due to too many failed attempts. Try again after ${new Date(data.lockedUntil).toLocaleString()}.`
        );
        setState("locked");
      } else if (data?.retryAfter) {
        // Cooldown active — code was already sent
        setState("form");
        startCountdown(new Date(data.retryAfter));
      }
    } else if (status === 410) {
      setErrorMsg(data?.error ?? "This invitation is no longer valid.");
      setState("error");
    } else {
      setErrorMsg(data?.error ?? "Something went wrong. Please try again later.");
      setState("error");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitError("");
    setSubmitting(true);

    const { status, data } = await verifyCode(token, code.trim());
    setSubmitting(false);

    if (status === 200) {
      clearStoredRetryAfter(token);
      navigate(`/shared/${token}/view`);
    } else if (status === 410) {
      setSubmitError(data?.error ?? "Your code has expired. Please request a new one.");
    } else if (status === 429) {
      if (data?.lockedUntil) {
        setErrorMsg(
          `This link is temporarily locked due to too many failed attempts. Try again after ${new Date(data.lockedUntil).toLocaleString()}.`
        );
        setState("locked");
      } else {
        setSubmitError(data?.error ?? "Too many attempts. Please wait before trying again.");
      }
    } else {
      setSubmitError(data?.error ?? "Incorrect code. Please try again.");
    }
  }

  if (state === "loading") {
    return (
      <div className="verify-page__shell">
        <p className="verify-page__loading">Sending verification code…</p>
      </div>
    );
  }

  if (state === "error" || state === "locked") {
    return (
      <div className="verify-page__shell">
        <div className="verify-page__error-box">
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page__shell">
      <div className="verify-page">
        <h1 className="verify-page__title">Verify Access</h1>
        {maskedEmail && (
          <p className="verify-page__instruction">
            We've sent a verification code to <strong>{maskedEmail}</strong>. Enter it below to
            view the shared applications.
          </p>
        )}
        <form className="verify-page__form" onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="verify-page__code-input"
            placeholder="6-digit code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={submitting}
            aria-label="Verification code"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || code.length !== 6}
          >
            {submitting ? "Verifying…" : "Submit"}
          </button>
          {submitError && (
            <p className="verify-page__submit-error" role="alert">
              {submitError}
            </p>
          )}
        </form>
        <div className="verify-page__resend">
          {secondsLeft > 0 ? (
            <span className="verify-page__countdown" aria-live="polite" aria-atomic="true">
              Resend code (available in {formatSeconds(secondsLeft)})
            </span>
          ) : (
            <button type="button" className="btn-link" onClick={sendCode}>
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
