import { useState } from "react";
import MagicLinkForm from "../components/auth/MagicLinkForm.jsx";
import ConfirmationMessage from "../components/auth/ConfirmationMessage.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

export default function LoginPage() {
  usePageTitle("Sign In — Applications Tracker");
  const [state, setState] = useState("idle"); // idle | sent
  const [sentEmail, setSentEmail] = useState("");

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Applications Tracker</h1>

        {state === "idle" && (
          <>
            <p className="login-subtitle">Sign in to your account</p>
            <MagicLinkForm
              defaultEmail={sentEmail}
              onSuccess={(email) => {
                setSentEmail(email);
                setState("sent");
              }}
            />
            <p className="login-hint">
              No password needed. We&apos;ll email you a one-time sign-in link.
            </p>
          </>
        )}

        {state === "sent" && (
          <ConfirmationMessage
            email={sentEmail}
            onReset={() => setState("idle")}
          />
        )}
      </div>
    </div>
  );
}
