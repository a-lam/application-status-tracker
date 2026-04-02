import ApplicationCard from "./ApplicationCard.jsx";

export default function ApplicationList({ applications, onStatusToggle, onDeleteRequest }) {
  return (
    <ul className="app-list" aria-label="Applications">
      {applications.map((app) => (
        <li key={app.id}>
          <ApplicationCard
            application={app}
            onStatusToggle={onStatusToggle}
            onDeleteRequest={onDeleteRequest}
          />
        </li>
      ))}
    </ul>
  );
}
