const prisma = require("../lib/prisma");

async function getProjectOrThrow(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      memberships: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  if (!project) {
    const error = new Error("Project not found");
    error.status = 404;
    throw error;
  }

  return project;
}

async function assertProjectAccess(projectId, user) {
  const project = await getProjectOrThrow(projectId);

  if (user.role === "ADMIN") {
    return project;
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    const error = new Error("Forbidden: not a project member");
    error.status = 403;
    throw error;
  }

  return project;
}

async function assertTaskAccess(taskId, user) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      assignee: { select: { id: true, name: true, email: true, role: true } },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!task) {
    const error = new Error("Task not found");
    error.status = 404;
    throw error;
  }

  if (user.role === "ADMIN") {
    return task;
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: task.projectId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    const error = new Error("Forbidden: not a project member");
    error.status = 403;
    throw error;
  }

  return task;
}

module.exports = {
  assertProjectAccess,
  assertTaskAccess,
};
