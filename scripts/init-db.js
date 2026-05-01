require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

function resolveSqlitePath(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must be a sqlite URL that starts with file:");
  }

  let sqlitePath = databaseUrl.slice(5);

  if (sqlitePath.startsWith("/")) {
    sqlitePath = sqlitePath.slice(1);
  }

  if (!path.isAbsolute(sqlitePath)) {
    sqlitePath = path.resolve(process.cwd(), sqlitePath);
  }

  return sqlitePath;
}

function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const dbPath = resolveSqlitePath(databaseUrl);

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlFilePath = path.resolve(process.cwd(), "prisma", "init.sql");
  const sql = fs.readFileSync(sqlFilePath, "utf8");

  const db = new DatabaseSync(dbPath);
  db.exec(sql);
  db.close();

  console.log(`Initialized SQLite schema at ${dbPath}`);
}

main();
