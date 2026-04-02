import { Link } from "react-router-dom";

export default function AddButton() {
  return (
    <Link
      to="/applications/new"
      className="add-button"
      aria-label="Add new application"
    >
      +
    </Link>
  );
}
