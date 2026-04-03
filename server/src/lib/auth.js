import { betterAuth } from "better-auth";
import { fromNodeHeaders } from "better-auth/node";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import prisma from "./prisma.js";
import { getResend } from "./resend.js";

// Lazily initialized so betterAuth() is only constructed after validateEnv()
// confirms all required environment variables are present.
let _auth = null;

/**
 * Express middleware that validates the session cookie via better-auth.
 * Attaches req.user and req.session on success, or returns 401.
 */
export async function requireAuth(req, res, next) {
  try {
    const session = await getAuth().api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = session.user;
    req.session = session.session;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function getAuth() {
  if (!_auth) {
    _auth = betterAuth({
      database: prismaAdapter(prisma, { provider: "postgresql" }),

      secret: process.env.BETTER_AUTH_SECRET,

      baseURL: process.env.FRONTEND_URL,

      // ── Session ───────────────────────────────────────────────────────────
      session: {
        expiresIn: parseInt(process.env.SESSION_EXPIRY_HOURS || "72") * 60 * 60,
      },

      // ── Email & Password (disabled — we use magic link instead) ──────────
      emailAndPassword: {
        enabled: false,
      },

      // ── Plugins ───────────────────────────────────────────────────────────
      plugins: [
        magicLink({
          sendMagicLink: async ({ email, url }) => {
            const isDev = process.env.NODE_ENV === "development";
            if (isDev) {
              const apiKey = process.env.RESEND_API_KEY;
              console.log(`[resend] Sending magic link to ${email}`);
              console.log(`[resend] RESEND_API_KEY present: ${!!apiKey}, length: ${apiKey?.length ?? 0}, prefix: ${apiKey?.slice(0, 8) ?? "undefined"}`);
              console.log(`[resend] RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL ?? "undefined"}`);
            }
            try {
              const result = await getResend().emails.send({
                from: process.env.RESEND_FROM_EMAIL,
                to: email,
                subject: "Your magic link",
                html: `
                <p>Click the link below to sign in. It expires in 15 minutes.</p>
                <p><a href="${url}">Sign in</a></p>
                <p>Or copy this link: ${url}</p>
              `,
              });
              if (result.error) {
                console.error("[resend] Email send failed:", result.error);
              } else if (isDev) {
                console.log(`[resend] Email sent successfully, id: ${result.data?.id}`);
              }
            } catch (err) {
              console.error("[resend] Unexpected error sending email:", err);
              throw err;
            }
          },
        }),
      ],
    });
  }
  return _auth;
}
