function validate(schema, target = "body") {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[target]);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req[target] = parsed.data;
    return next();
  };
}

module.exports = {
  validate,
};
