const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { validate } = require("../middleware/validate");
const { authenticate, JWT_SECRET } = require("../middleware/auth");
const { userSignupSchema, userLoginSchema } = require("../utils/schemas");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });
}

function toSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

router.post("/signup", validate(userSignupSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "MEMBER",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = signToken(user);

    return res.status(201).json({
      message: "Signup successful",
      token,
      user,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", validate(userLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({ message: "Use Admin Login for admin accounts" });
    }

    const token = signToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/signup", validate(userSignupSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = signToken(user);

    return res.status(201).json({
      message: "Admin account created",
      token,
      user,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/login", validate(userLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "This account is not an admin account" });
    }

    const token = signToken(user);

    return res.json({
      message: "Admin login successful",
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authenticate, async (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
