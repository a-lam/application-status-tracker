import SharedApplicationCard from "./SharedApplicationCard.jsx";

export default function SharedApplicationList({ applications }) {
  return (
    <ul className="app-list" aria-label="Applications">
      {applications.map((app) => (
        <li key={app.id}>
          <SharedApplicationCard application={app} />
        </li>
      ))}
    </ul>
  );
}
