import ApplicationCard from "../applications/ApplicationCard.jsx";

export default function SharedApplicationList({ applications }) {
  return (
    <ul className="app-list" aria-label="Applications">
      {applications.map((app) => (
        <li key={app.id}>
          <ApplicationCard application={app} readOnly />
        </li>
      ))}
    </ul>
  );
}
