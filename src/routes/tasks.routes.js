const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { taskCreateSchema, taskUpdateSchema } = require("../utils/schemas");
const { assertProjectAccess, assertTaskAccess } = require("../utils/access");

const router = express.Router();

router.use(authenticate);

async function assertAssigneeInProject(projectId, assigneeId) {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: assigneeId,
      },
    },
  });

  if (!membership) {
    const error = new Error("Assignee must be a member of the project");
    error.status = 400;
    throw error;
  }
}

router.get("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    const project = await assertProjectAccess(req.params.projectId, req.user);

    const where = { projectId: project.id };

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.assigneeId) {
      where.assigneeId = req.query.assigneeId;
    }

    if (req.query.overdue === "true") {
      where.dueDate = { lt: new Date() };
      where.status = { not: "DONE" };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return res.json({ tasks });
  } catch (error) {
    return next(error);
  }
});

router.post("/projects/:projectId/tasks", validate(taskCreateSchema), async (req, res, next) => {
  try {
    const project = await assertProjectAccess(req.params.projectId, req.user);
    const { title, description, dueDate, assigneeId } = req.body;

    if (assigneeId) {
      await assertAssigneeInProject(project.id, assigneeId);
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: project.id,
        createdById: req.user.id,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(201).json({ message: "Task created", task });
  } catch (error) {
    return next(error);
  }
});

router.patch("/tasks/:taskId", validate(taskUpdateSchema), async (req, res, next) => {
  try {
    const task = await assertTaskAccess(req.params.taskId, req.user);

    if (req.user.role === "MEMBER") {
      const isCreator = task.createdById === req.user.id;
      const isAssignee = task.assigneeId === req.user.id;

      if (!isCreator && !isAssignee) {
        return res.status(403).json({ message: "Forbidden: cannot update this task" });
      }

      const attemptedKeys = Object.keys(req.body);
      const nonStatusFieldUpdate = attemptedKeys.some((key) => key !== "status");

      if (!isCreator && nonStatusFieldUpdate) {
        return res.status(403).json({
          message: "Forbidden: members can only update status for tasks they are assigned",
        });
      }
    }

    const data = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(data, "dueDate")) {
      data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    if (Object.prototype.hasOwnProperty.call(data, "description")) {
      data.description = data.description || null;
    }

    if (Object.prototype.hasOwnProperty.call(data, "assigneeId")) {
      data.assigneeId = data.assigneeId || null;
      if (data.assigneeId) {
        await assertAssigneeInProject(task.projectId, data.assigneeId);
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data,
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.json({ message: "Task updated", task: updatedTask });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
