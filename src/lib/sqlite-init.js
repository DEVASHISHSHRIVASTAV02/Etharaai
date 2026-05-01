const fs = require("fs");
const path = require("path");

function resolveSqlitePath(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must be a sqlite URL that starts with file:");
  }

  let sqlitePath = databaseUrl.slice(5);

  // Handle file URL variants:
  // - file:./dev.db
  // - file:/app/data/dev.db
  // - file:///app/data/dev.db
  // - file:C:/path/dev.db
  // - file:/C:/path/dev.db
  if (sqlitePath.startsWith("///")) {
    sqlitePath = sqlitePath.slice(2);
  }

  // Normalize Windows drive letters when URL is file:/C:/...
  if (/^\/[A-Za-z]:[\\/]/.test(sqlitePath)) {
    sqlitePath = sqlitePath.slice(1);
  }

  if (!path.isAbsolute(sqlitePath)) {
    sqlitePath = path.resolve(process.cwd(), sqlitePath);
  }

  return sqlitePath;
}

function initializeSqliteSchema() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.startsWith("file:")) {
    return;
  }

  const { DatabaseSync } = require("node:sqlite");
  const dbPath = resolveSqlitePath(databaseUrl);

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlFilePath = path.resolve(process.cwd(), "prisma", "init.sql");
  const sql = fs.readFileSync(sqlFilePath, "utf8");

  const db = new DatabaseSync(dbPath);
  db.exec(sql);
  db.close();

  console.log(`Initialized SQLite schema at ${dbPath}`);
}

module.exports = {
  resolveSqlitePath,
  initializeSqliteSchema,
};
