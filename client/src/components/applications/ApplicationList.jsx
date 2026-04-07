import ApplicationCard from "./ApplicationCard.jsx";

export default function ApplicationList({ applications, onStatusUpdate, onDeleteRequest, onArtifactToggle }) {
  return (
    <ul className="app-list" aria-label="Applications">
      {applications.map((app) => (
        <li key={app.id}>
          <ApplicationCard
            application={app}
            onStatusUpdate={onStatusUpdate}
            onDeleteRequest={onDeleteRequest}
            onArtifactToggle={onArtifactToggle}
          />
        </li>
      ))}
    </ul>
  );
}
