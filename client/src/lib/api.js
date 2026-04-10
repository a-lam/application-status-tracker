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

export function getShares() {
  return apiFetch("/api/shares");
}

export function createShare(email) {
  return apiFetch("/api/shares", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function deleteShare(id) {
  return apiFetch(`/api/shares/${id}`, { method: "DELETE" });
}

// Returns { status, data } — does not auto-redirect on 401
async function sharedFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = res.status !== 204 ? await res.json().catch(() => null) : null;
  return { status: res.status, data };
}

export function requestCode(token) {
  return sharedFetch(`/api/shared/${token}/request-code`, { method: "POST" });
}

export function verifyCode(token, code) {
  return sharedFetch(`/api/shared/${token}/verify`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function getSharedApplications(token) {
  return sharedFetch(`/api/shared/${token}/applications`);
}
