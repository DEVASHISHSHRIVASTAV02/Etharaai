function notFound(_req, res, _next) {
  return res.status(404).json({ message: "Route not found" });
}

function errorHandler(err, _req, res, _next) {
  if (err?.status) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err?.code === "P2002") {
    return res.status(409).json({ message: "Duplicate value violates unique constraint" });
  }

  if (err?.code === "P2025") {
    return res.status(404).json({ message: "Record not found" });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}

module.exports = {
  notFound,
  errorHandler,
};
