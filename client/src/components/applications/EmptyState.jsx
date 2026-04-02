import { Link } from "react-router-dom";

export default function EmptyState() {
  return (
    <div className="empty-state">
      <p>No applications yet.</p>
      <p>
        <Link to="/applications/new" className="btn btn-primary">
          Add your first application
        </Link>
      </p>
    </div>
  );
}
