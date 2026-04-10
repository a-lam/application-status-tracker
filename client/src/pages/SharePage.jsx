import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getShares, createShare, deleteShare } from "../lib/api.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

export default function SharePage() {
  usePageTitle("Share — Applications Tracker");
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getShares()
      .then(setShares)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setMessage(null);
    setSubmitting(true);
    try {
      const result = await createShare(email.trim());
      if (result.extended) {
        const expiry = new Date(result.share.expiresAt).toLocaleDateString();
        setMessage({
          type: "success",
          text: `A share already existed for ${result.share.email}. Its expiry has been extended to ${expiry}.`,
        });
        setShares((prev) => prev.map((s) => (s.id === result.share.id ? result.share : s)));
      } else {
        setMessage({ type: "success", text: `Invitation sent to ${result.share.email}.` });
        setShares((prev) => [result.share, ...prev]);
      }
      setEmail("");
    } catch (err) {
      setMessage({ type: "error", text: err.message ?? "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id, email) {
    try {
      await deleteShare(id);
      setShares((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setMessage({ type: "error", text: `Failed to remove share for ${email}.` });
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/applications" className="back-link">← Back</Link>
      </div>

      <h1>Share Your Applications</h1>

      <div className="share-page__content">
        <form className="share-page__form" onSubmit={handleAdd}>
          <div className="share-page__form-row">
            <input
              type="email"
              className="share-page__input"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setMessage(null); }}
              disabled={submitting}
              aria-label="Recipient email address"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !email.trim()}
            >
              {submitting ? "Adding…" : "Add"}
            </button>
          </div>
          {message && (
            <p
              className={`share-page__message share-page__message--${message.type}`}
              role={message.type === "error" ? "alert" : "status"}
            >
              {message.text}
            </p>
          )}
        </form>

        {!loading && shares.length > 0 && (
          <section>
            <h2 className="share-page__section-title">Active Shares</h2>
            <ul className="share-page__list">
              {shares.map((share) => (
                <li key={share.id} className="share-page__item">
                  <div className="share-page__item-info">
                    <span className="share-page__item-email">{share.email}</span>
                    <span className="share-page__item-dates">
                      Shared: {new Date(share.createdAt).toLocaleDateString()} · Expires:{" "}
                      {new Date(share.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(share.id, share.email)}
                    aria-label={`Remove share for ${share.email}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && shares.length === 0 && (
          <p className="share-page__empty">You haven't shared with anyone yet.</p>
        )}
      </div>
    </div>
  );
}
