/**
 * Validates that all required environment variables are present and non-empty.
 * Throws immediately if any are missing so the server never starts in a broken state.
 */

const REQUIRED = [
  "BETTER_AUTH_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "DATABASE_URL",
  "FRONTEND_URL",
];

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        "Copy .env.example to .env and fill in all values before starting the server."
    );
  }
}
