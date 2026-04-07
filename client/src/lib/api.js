async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    window.location.href = "/login";
    return;
  }

  if (res.status === 204) {
    return null;
  }

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data?.error ?? "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function getApplications() {
  return apiFetch("/api/applications");
}

export function getApplication(id) {
  return apiFetch(`/api/applications/${id}`);
}

export function createApplication(body) {
  return apiFetch("/api/applications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateApplicationStatus(id, status) {
  return apiFetch(`/api/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateApplication(id, body) {
  return apiFetch(`/api/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteApplication(id) {
  return apiFetch(`/api/applications/${id}`, {
    method: "DELETE",
  });
}

export function updateArtifactCompleted(id, completed) {
  return apiFetch(`/api/artifacts/${id}/completed`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}
