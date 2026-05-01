const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const baseWhere =
      req.user.role === "ADMIN"
        ? {}
        : {
            project: {
              memberships: {
                some: { userId: req.user.id },
              },
            },
          };

    const now = new Date();

    const [tasks, overdueTasks, myAssignedTasks] = await Promise.all([
      prisma.task.findMany({
        where: baseWhere,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      }),
      prisma.task.findMany({
        where: {
          ...baseWhere,
          dueDate: { lt: now },
          status: { not: "DONE" },
        },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      prisma.task.findMany({
        where: {
          ...baseWhere,
          assigneeId: req.user.id,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      }),
    ]);

    const summary = tasks.reduce(
      (acc, task) => {
        acc.total += 1;
        acc[task.status] += 1;
        if (task.dueDate && task.dueDate < now && task.status !== "DONE") {
          acc.overdue += 1;
        }
        return acc;
      },
      {
        total: 0,
        TODO: 0,
        IN_PROGRESS: 0,
        DONE: 0,
        overdue: 0,
      }
    );

    return res.json({
      summary,
      overdueTasks,
      myAssignedTasks,
      tasks,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
