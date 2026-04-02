import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function KebabMenu({ application, onStatusToggle, onDeleteRequest }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const navigate = useNavigate();

  const isSubmitted = application.status === "SUBMITTED";
  const targetStatus = isSubmitted ? "NOT_SUBMITTED" : "SUBMITTED";
  const targetLabel = isSubmitted ? "Not Submitted" : "Submitted";

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="kebab-menu" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="kebab-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Options for ${application.jobTitle} at ${application.employer}`}
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>

      {open && (
        <ul className="kebab-menu__dropdown" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="kebab-menu__item"
              onClick={() => {
                setOpen(false);
                onStatusToggle(application.id, targetStatus);
              }}
            >
              Update Status — {targetLabel}
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="kebab-menu__item"
              onClick={() => {
                setOpen(false);
                navigate(`/applications/${application.id}/edit`);
              }}
            >
              Edit Application
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="kebab-menu__item kebab-menu__item--danger"
              onClick={() => {
                setOpen(false);
                onDeleteRequest(application.id, triggerRef.current);
              }}
            >
              Delete Application
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
