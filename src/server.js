require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const prisma = require("./lib/prisma");

const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/projects.routes");
const taskRoutes = require("./routes/tasks.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_req, res) => {
  return res.json({ message: "OK" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (_req, res) => {
  return res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use("/api", notFound);
app.use(errorHandler);

async function start() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

start();
