import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// GET /api/applications — list all applications for the current user
router.get("/applications", requireAuth, async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { userId: req.user.id },
    orderBy: { dueDate: "asc" },
    include: { artifacts: { orderBy: { order: "asc" } } },
  });
  res.json(applications);
});

// GET /api/applications/:id — fetch a single application
router.get("/applications/:id", requireAuth, async (req, res) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { artifacts: { orderBy: { order: "asc" } } },
  });
  if (!application) return res.status(404).json({ error: "Not found." });
  if (application.userId !== req.user.id) return res.status(403).json({ error: "Forbidden." });
  res.json(application);
});

// POST /api/applications — create a new application
router.post("/applications", requireAuth, async (req, res) => {
  const { employer, jobTitle, dueDate, jobDescription, artifacts = [], salaryMin, salaryMax, salaryCurrency } = req.body;

  const parsedSalaryMin = salaryMin !== undefined && salaryMin !== null && salaryMin !== "" ? parseFloat(salaryMin) : null;
  const parsedSalaryMax = salaryMax !== undefined && salaryMax !== null && salaryMax !== "" ? parseFloat(salaryMax) : null;

  const errors = {};
  if (!employer?.trim()) errors.employer = "Employer is required.";
  if (!jobTitle?.trim()) errors.jobTitle = "Job title is required.";
  if (!dueDate) {
    errors.dueDate = "Due date is required.";
  } else {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(due.getTime())) {
      errors.dueDate = "Due date is invalid.";
    } else if (due < today) {
      errors.dueDate = "Due date cannot be in the past.";
    }
  }
  if (parsedSalaryMin !== null && (isNaN(parsedSalaryMin) || parsedSalaryMin < 0)) {
    errors.salary = "Starting salary must be a non-negative number.";
  } else if (parsedSalaryMax !== null && (isNaN(parsedSalaryMax) || parsedSalaryMax < 0)) {
    errors.salary = "Maximum salary must be a non-negative number.";
  } else if (parsedSalaryMin !== null && parsedSalaryMax !== null && parsedSalaryMin >= parsedSalaryMax) {
    errors.salary = "Starting salary must be less than maximum salary.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        employer: employer.trim(),
        jobTitle: jobTitle.trim(),
        dueDate: new Date(dueDate),
        jobDescription: jobDescription?.trim() || null,
        salaryMin: parsedSalaryMin,
        salaryMax: parsedSalaryMax,
        salaryCurrency: parsedSalaryMin !== null || parsedSalaryMax !== null ? (salaryCurrency || "CAD") : null,
        status: "NOT_SUBMITTED",
        userId: req.user.id,
      },
    });

    if (artifacts.length > 0) {
      await tx.artifact.createMany({
        data: artifacts.map((label, order) => ({
          label: label.trim(),
          order,
          applicationId: app.id,
        })),
      });
    }

    return tx.application.findUnique({
      where: { id: app.id },
      include: { artifacts: { orderBy: { order: "asc" } } },
    });
  });

  res.status(201).json(application);
});

// PATCH /api/applications/:id/status — toggle application status
router.patch("/applications/:id/status", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["NOT_SUBMITTED", "SUBMITTED"].includes(status)) {
    return res.status(422).json({ error: "Invalid status." });
  }

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found." });
  if (existing.userId !== req.user.id) return res.status(403).json({ error: "Forbidden." });

  const updated = await prisma.application.update({
    where: { id },
    data: { status },
    include: { artifacts: { orderBy: { order: "asc" } } },
  });
  res.json(updated);
});

// PATCH /api/applications/:id — update application fields
router.patch("/applications/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { employer, jobTitle, dueDate, jobDescription, artifacts, salaryMin, salaryMax, salaryCurrency } = req.body;

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found." });
  if (existing.userId !== req.user.id) return res.status(403).json({ error: "Forbidden." });

  const parsedSalaryMin = salaryMin !== undefined && salaryMin !== null && salaryMin !== "" ? parseFloat(salaryMin) : null;
  const parsedSalaryMax = salaryMax !== undefined && salaryMax !== null && salaryMax !== "" ? parseFloat(salaryMax) : null;

  const errors = {};
  if (employer !== undefined && !employer?.trim()) errors.employer = "Employer is required.";
  if (jobTitle !== undefined && !jobTitle?.trim()) errors.jobTitle = "Job title is required.";
  if (dueDate !== undefined) {
    if (!dueDate) {
      errors.dueDate = "Due date is required.";
    } else {
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) errors.dueDate = "Due date is invalid.";
    }
  }
  if (salaryMin !== undefined || salaryMax !== undefined) {
    if (parsedSalaryMin !== null && (isNaN(parsedSalaryMin) || parsedSalaryMin < 0)) {
      errors.salary = "Starting salary must be a non-negative number.";
    } else if (parsedSalaryMax !== null && (isNaN(parsedSalaryMax) || parsedSalaryMax < 0)) {
      errors.salary = "Maximum salary must be a non-negative number.";
    } else if (parsedSalaryMin !== null && parsedSalaryMax !== null && parsedSalaryMin >= parsedSalaryMax) {
      errors.salary = "Starting salary must be less than maximum salary.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updateData = {};
    if (employer !== undefined) updateData.employer = employer.trim();
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle.trim();
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (jobDescription !== undefined) updateData.jobDescription = jobDescription?.trim() || null;
    if (salaryMin !== undefined) updateData.salaryMin = parsedSalaryMin;
    if (salaryMax !== undefined) updateData.salaryMax = parsedSalaryMax;
    if (salaryMin !== undefined || salaryMax !== undefined || salaryCurrency !== undefined) {
      const effectiveMin = salaryMin !== undefined ? parsedSalaryMin : existing.salaryMin;
      const effectiveMax = salaryMax !== undefined ? parsedSalaryMax : existing.salaryMax;
      updateData.salaryCurrency = effectiveMin !== null || effectiveMax !== null ? (salaryCurrency || existing.salaryCurrency || "CAD") : null;
    }

    await tx.application.update({ where: { id }, data: updateData });

    if (artifacts !== undefined) {
      const existing = await tx.artifact.findMany({
        where: { applicationId: id },
        select: { label: true, completed: true },
      });
      const completedLabels = new Set(
        existing.filter((a) => a.completed).map((a) => a.label.toLowerCase())
      );

      await tx.artifact.deleteMany({ where: { applicationId: id } });
      if (artifacts.length > 0) {
        await tx.artifact.createMany({
          data: artifacts.map((label, order) => ({
            label: label.trim(),
            order,
            applicationId: id,
            completed: completedLabels.has(label.trim().toLowerCase()),
          })),
        });
      }
    }

    return tx.application.findUnique({
      where: { id },
      include: { artifacts: { orderBy: { order: "asc" } } },
    });
  });

  res.json(updated);
});

// DELETE /api/applications/:id — delete an application and its artifacts
router.delete("/applications/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found." });
  if (existing.userId !== req.user.id) return res.status(403).json({ error: "Forbidden." });

  await prisma.application.delete({ where: { id } });
  res.status(204).end();
});

export default router;
