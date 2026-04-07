import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// PATCH /api/artifacts/:id/completed — set the completed state on a single artifact
router.patch("/artifacts/:id/completed", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  if (typeof completed !== "boolean") {
    return res.status(422).json({ error: "completed must be a boolean." });
  }

  const artifact = await prisma.artifact.findUnique({
    where: { id },
    include: { application: { select: { userId: true } } },
  });

  if (!artifact) return res.status(404).json({ error: "Not found." });
  if (artifact.application.userId !== req.user.id) return res.status(403).json({ error: "Forbidden." });

  const updated = await prisma.artifact.update({
    where: { id },
    data: { completed },
  });

  res.json(updated);
});

export default router;
