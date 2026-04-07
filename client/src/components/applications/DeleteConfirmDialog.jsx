import { useEffect, useRef } from "react";

export default function DeleteConfirmDialog({ application, onConfirm, onCancel, returnFocusTo }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => returnFocusTo?.focus();
  }, [returnFocusTo]);

  function handleClick(e) {
    const rect = dialogRef.current.getBoundingClientRect();
    const clickedOutside =
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top  || e.clientY > rect.bottom;
    if (clickedOutside) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      onClick={handleClick}
    >
      <h2 id="dialog-title" className="dialog__title">Delete Application?</h2>
      <p className="dialog__body">
        Delete <strong>{application.jobTitle}</strong> at{" "}
        <strong>{application.employer}</strong>? This cannot be undone.
      </p>
      <div className="dialog__actions">
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onConfirm(application.id)}
        >
          Confirm Delete
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </dialog>
  );
}
