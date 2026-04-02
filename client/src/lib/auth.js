import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Empty baseURL — Vite proxies /api/auth/* to the Express server in dev.
  // In production client and server share the same origin.
  baseURL: "",
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});
