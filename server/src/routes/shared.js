import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { getResend } from "../lib/resend.js";

const router = Router();

const CODE_COOLDOWN_MS = 3 * 60 * 1000;        // 3 minutes
const CODE_EXPIRY_MS = 15 * 60 * 1000;          // 15 minutes
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LOCK_DURATION_MS = 3 * 60 * 60 * 1000;   // 3 hours
const MAX_FAILED_ACTIONS = 10;
const FAILED_ACTION_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;        // 15 minutes
const BCRYPT_ROUNDS = 10;
const COOKIE_NAME = "recipient-session";

function addMs(base, ms) {
  return new Date(new Date(base).getTime() + ms);
}

function signRecipientToken(sessionId) {
  return jwt.sign({ sub: sessionId }, process.env.BETTER_AUTH_SECRET, { expiresIn: "7d" });
}

function verifyRecipientToken(token) {
  return jwt.verify(token, process.env.BETTER_AUTH_SECRET);
}

function generateCode() {
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
}

function maskEmail(email) {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  return `${email[0]}***${email.slice(at)}`;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx > -1) {
      cookies[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
  });
  return cookies;
}

// POST /api/shared/:token/request-code
router.post("/shared/:token/request-code", async (req, res, next) => {
  try {
    const now = new Date();

    const share = await prisma.share.findUnique({ where: { token: req.params.token } });
    if (!share || share.expiresAt <= now) {
      return res.status(410).json({ error: "This invitation is no longer valid." });
    }

    let rateLimit = await prisma.shareRateLimit.findUnique({ where: { shareId: share.id } });
    if (!rateLimit) {
      rateLimit = await prisma.shareRateLimit.create({ data: { shareId: share.id } });
    }

    if (rateLimit.lockedUntil && rateLimit.lockedUntil > now) {
      return res.status(429).json({
        error: "This link is temporarily locked due to too many failed attempts.",
        lockedUntil: rateLimit.lockedUntil.toISOString(),
      });
    }

    if (rateLimit.lastCodeSentAt && now - rateLimit.lastCodeSentAt < CODE_COOLDOWN_MS) {
      const retryAfter = addMs(rateLimit.lastCodeSentAt, CODE_COOLDOWN_MS);
      return res.status(429).json({ retryAfter: retryAfter.toISOString() });
    }

    await prisma.recipientSession.deleteMany({ where: { shareId: share.id } });

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const codeExpiresAt = addMs(now, CODE_EXPIRY_MS);

    await prisma.recipientSession.create({
      data: { shareId: share.id, codeHash, codeExpiresAt },
    });

    await prisma.shareRateLimit.update({
      where: { shareId: share.id },
      data: { lastCodeSentAt: now },
    });

    try {
      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: share.email,
        subject: "Your verification code",
        html: `
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code expires in 15 minutes.</p>
          <p>If you did not request this code, you can ignore this email.</p>
        `,
      });
    } catch (err) {
      console.error("[resend] Failed to send verification code:", err);
      return res.status(500).json({ error: "Failed to send verification code. Please try again." });
    }

    const retryAfter = addMs(now, CODE_COOLDOWN_MS);
    res.json({ retryAfter: retryAfter.toISOString(), email: maskEmail(share.email) });
  } catch (err) {
    next(err);
  }
});

// POST /api/shared/:token/verify
router.post("/shared/:token/verify", async (req, res, next) => {
  try {
    const now = new Date();
    const { code } = req.body;

    if (!code) return res.status(400).json({ error: "Code is required." });

  const share = await prisma.share.findUnique({ where: { token: req.params.token } });
  if (!share || share.expiresAt <= now) {
    return res.status(410).json({ error: "This invitation is no longer valid." });
  }

  const rateLimit = await prisma.shareRateLimit.findUnique({ where: { shareId: share.id } });

  if (rateLimit?.lockedUntil && rateLimit.lockedUntil > now) {
    return res.status(429).json({
      error: "This link is temporarily locked due to too many failed attempts.",
      lockedUntil: rateLimit.lockedUntil.toISOString(),
    });
  }

  // 15-minute window rate limit
  let verifyAttempts = rateLimit?.verifyAttempts ?? 0;
  let verifyWindowStart = rateLimit?.verifyWindowStart ?? null;

  if (verifyWindowStart && now - verifyWindowStart < VERIFY_WINDOW_MS) {
    if (verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({ error: "Too many attempts. Please wait before trying again." });
    }
    verifyAttempts += 1;
  } else {
    verifyWindowStart = now;
    verifyAttempts = 1;
  }

  const session = await prisma.recipientSession.findFirst({
    where: { shareId: share.id },
    orderBy: { createdAt: "desc" },
  });

  if (!session) {
    return res.status(410).json({ error: "No verification code found. Please request a new one." });
  }

  if (session.codeExpiresAt <= now) {
    return res.status(410).json({ error: "Your code has expired. Please request a new one." });
  }

  const isMatch = await bcrypt.compare(String(code), session.codeHash);

  if (!isMatch) {
    let failedActionCount = rateLimit?.failedActionCount ?? 0;
    let failedActionWindowStart = rateLimit?.failedActionWindowStart ?? null;

    if (failedActionWindowStart && now - failedActionWindowStart < FAILED_ACTION_WINDOW_MS) {
      failedActionCount += 1;
    } else {
      failedActionWindowStart = now;
      failedActionCount = 1;
    }

    let lockedUntil = rateLimit?.lockedUntil ?? null;
    let statusCode = 401;
    let responseBody = { error: "Incorrect code. Please try again." };

    if (failedActionCount >= MAX_FAILED_ACTIONS) {
      lockedUntil = addMs(now, LOCK_DURATION_MS);
      statusCode = 429;
      responseBody = {
        error: "This link has been locked due to too many failed attempts.",
        lockedUntil: lockedUntil.toISOString(),
      };
    }

    await prisma.shareRateLimit.upsert({
      where: { shareId: share.id },
      update: { verifyAttempts, verifyWindowStart, failedActionCount, failedActionWindowStart, lockedUntil },
      create: { shareId: share.id, verifyAttempts, verifyWindowStart, failedActionCount, failedActionWindowStart, lockedUntil },
    });

    return res.status(statusCode).json(responseBody);
  }

  // Code matched
  const verifiedAt = now;
  const sessionExpiresAt = addMs(now, SESSION_EXPIRY_MS);

  await prisma.recipientSession.update({
    where: { id: session.id },
    data: { verifiedAt, sessionExpiresAt },
  });

  if (rateLimit) {
    await prisma.shareRateLimit.update({
      where: { shareId: share.id },
      data: {
        verifyAttempts: 0,
        verifyWindowStart: null,
        failedActionCount: 0,
        failedActionWindowStart: null,
        lockedUntil: null,
      },
    });
  }

  const jwtToken = signRecipientToken(session.id);
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(COOKIE_NAME, jwtToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: SESSION_EXPIRY_MS,
  });

  res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/shared/:token/applications
router.get("/shared/:token/applications", async (req, res, next) => {
  try {
    const now = new Date();
    const cookies = parseCookies(req.headers.cookie);
    const rawToken = cookies[COOKIE_NAME];

    if (!rawToken) {
      return res.status(401).json({ error: "Recipient session required." });
    }

    let payload;
    try {
      payload = verifyRecipientToken(rawToken);
    } catch {
      return res.status(401).json({ error: "Invalid or expired recipient session." });
    }

    const session = await prisma.recipientSession.findUnique({
      where: { id: payload.sub },
      include: { share: true },
    });

    if (!session || !session.verifiedAt || session.sessionExpiresAt <= now) {
      return res.status(401).json({ error: "Recipient session expired." });
    }

    const share = session.share;

    if (!share || share.token !== req.params.token) {
      return res.status(403).json({ error: "Forbidden." });
    }

    if (share.expiresAt <= now) {
      return res.status(410).json({ error: "This shared link is no longer valid." });
    }

    const [applications, sharer] = await Promise.all([
      prisma.application.findMany({
        where: { userId: share.userId },
        orderBy: { dueDate: "asc" },
        include: { artifacts: { orderBy: { order: "asc" } } },
      }),
      prisma.user.findUnique({
        where: { id: share.userId },
        select: { email: true },
      }),
    ]);

    res.json({ sharerEmail: sharer?.email ?? "", applications });
  } catch (err) {
    next(err);
  }
});

export default router;
