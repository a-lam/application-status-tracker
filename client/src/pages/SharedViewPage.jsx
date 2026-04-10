import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSharedApplications } from "../lib/api.js";
import SharedApplicationList from "../components/shared/SharedApplicationList.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

export default function SharedViewPage() {
  usePageTitle("Shared Applications");
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState("loading");
  const [sharerEmail, setSharerEmail] = useState("");
  const [applications, setApplications] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    getSharedApplications(token).then(({ status, data }) => {
      if (status === 200) {
        setSharerEmail(data.sharerEmail);
        setApplications(data.applications);
        setState("ready");
      } else if (status === 401) {
        navigate(`/shared/${token}`, { replace: true });
      } else if (status === 410) {
        setErrorMsg(data?.error ?? "This shared link is no longer valid.");
        setState("error");
      } else {
        setErrorMsg("Something went wrong. Please try again.");
        setState("error");
      }
    });
  }, [token, navigate]);

  if (state === "loading") {
    return <div className="page-loading">Loading…</div>;
  }

  if (state === "error") {
    return (
      <div className="verify-page__shell">
        <div className="verify-page__error-box">
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="shared-view__banner">
        <h2 className="shared-view__shared-by">Shared by: {sharerEmail}</h2>
      </div>
      {applications.length === 0 ? (
        <p className="share-page__empty">No applications to display.</p>
      ) : (
        <SharedApplicationList applications={applications} />
      )}
    </div>
  );
}
