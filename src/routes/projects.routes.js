const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { projectCreateSchema, addMemberSchema } = require("../utils/schemas");
const { assertProjectAccess } = require("../utils/access");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : {
            memberships: {
              some: {
                userId: req.user.id,
              },
            },
          };

    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        memberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            memberships: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ projects });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireRole("ADMIN"), validate(projectCreateSchema), async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          name,
          description: description || null,
          createdById: req.user.id,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: createdProject.id,
          userId: req.user.id,
        },
      });

      return createdProject;
    });

    return res.status(201).json({ message: "Project created", project });
  } catch (error) {
    return next(error);
  }
});

router.get("/:projectId", async (req, res, next) => {
  try {
    const project = await assertProjectAccess(req.params.projectId, req.user);

    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ project: { ...project, tasks } });
  } catch (error) {
    return next(error);
  }
});

router.get("/:projectId/members", async (req, res, next) => {
  try {
    const project = await assertProjectAccess(req.params.projectId, req.user);

    const members = await prisma.projectMember.findMany({
      where: { projectId: project.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ members });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/:projectId/members",
  requireRole("ADMIN"),
  validate(addMemberSchema),
  async (req, res, next) => {
    try {
      const project = await assertProjectAccess(req.params.projectId, req.user);

      const user = await prisma.user.findUnique({ where: { email: req.body.email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existing = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: user.id,
          },
        },
      });

      if (existing) {
        return res.status(409).json({ message: "User is already part of this project" });
      }

      const member = await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      return res.status(201).json({ message: "Member added", member });
    } catch (error) {
      return next(error);
    }
  }
);

router.delete("/:projectId/members/:userId", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const project = await assertProjectAccess(req.params.projectId, req.user);

    if (project.createdById === req.params.userId) {
      return res.status(400).json({ message: "Cannot remove the project creator" });
    }

    const deleted = await prisma.projectMember.deleteMany({
      where: {
        projectId: project.id,
        userId: req.params.userId,
      },
    });

    if (!deleted.count) {
      return res.status(404).json({ message: "Member not found in this project" });
    }

    return res.json({ message: "Member removed" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
