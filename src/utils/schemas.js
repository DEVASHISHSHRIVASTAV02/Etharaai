const { z } = require("zod");

const userSignupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
});

const userLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const projectCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

const addMemberSchema = z.object({
  email: z.string().trim().email(),
});

const taskCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().cuid().optional(),
});

const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(1000).optional().or(z.literal("")),
    dueDate: z.string().datetime().optional().or(z.literal("")).or(z.null()),
    assigneeId: z.string().cuid().optional().or(z.literal("")).or(z.null()),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  });

module.exports = {
  userSignupSchema,
  userLoginSchema,
  projectCreateSchema,
  addMemberSchema,
  taskCreateSchema,
  taskUpdateSchema,
};
