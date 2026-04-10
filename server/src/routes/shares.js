import { Router } from "express";
import { randomBytes } from "crypto";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";
import { getResend } from "../lib/resend.js";

const router = Router();
const SHARE_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_ACTIVE_SHARES = 20;

function generateToken() {
  return randomBytes(32).toString("base64url");
}

// GET /api/shares — list active shares for current user
router.get("/shares", requireAuth, async (req, res, next) => {
  try {
    const now = new Date();
    const shares = await prisma.share.findMany({
      where: { userId: req.user.id, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, createdAt: true, expiresAt: true },
    });
    res.json(shares);
  } catch (err) {
    next(err);
  }
});

// POST /api/shares — create a share or extend an existing one
router.post("/shares", requireAuth, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ error: "You cannot share with yourself." });
    }

    const now = new Date();

    const activeCount = await prisma.share.count({
      where: { userId: req.user.id, expiresAt: { gt: now } },
    });

    if (activeCount >= MAX_ACTIVE_SHARES) {
      return res.status(400).json({ error: "You have reached the maximum of 20 active shares." });
    }

    const existing = await prisma.share.findFirst({
      where: { userId: req.user.id, email: normalizedEmail },
    });

    if (existing) {
      if (existing.expiresAt > now) {
        // Active share — extend expiry
        const newExpiry = new Date(now.getTime() + SHARE_EXPIRY_MS);
        const updated = await prisma.share.update({
          where: { id: existing.id },
          data: { expiresAt: newExpiry },
          select: { id: true, email: true, createdAt: true, expiresAt: true },
        });
        return res.json({ extended: true, share: updated });
      } else {
        // Expired share — delete it before creating a new one
        await prisma.share.delete({ where: { id: existing.id } });
      }
    }

    const token = generateToken();
    const expiresAt = new Date(now.getTime() + SHARE_EXPIRY_MS);

    const share = await prisma.share.create({
      data: { token, userId: req.user.id, email: normalizedEmail, expiresAt },
      select: { id: true, email: true, createdAt: true, expiresAt: true },
    });

    const link = `${process.env.FRONTEND_URL}/shared/${token}`;
    try {
      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: normalizedEmail,
        subject: `${req.user.email} shared their job applications with you`,
        html: `
          <p>${req.user.email} has shared their job applications with you.</p>
          <p><a href="${link}">View applications</a></p>
          <p>Or copy this link: ${link}</p>
          <p>This invitation expires in 90 days.</p>
        `,
      });
    } catch (err) {
      console.error("[resend] Failed to send share invitation:", err);
    }

    res.status(201).json({ extended: false, share });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/shares/:id — revoke a share
router.delete("/shares/:id", requireAuth, async (req, res, next) => {
  try {
    const share = await prisma.share.findUnique({ where: { id: req.params.id } });
    if (!share) return res.status(404).json({ error: "Not found." });
    if (share.userId !== req.user.id) return res.status(403).json({ error: "Forbidden." });
    await prisma.share.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
