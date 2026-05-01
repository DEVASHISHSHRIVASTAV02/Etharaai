require("dotenv").config();

const { initializeSqliteSchema } = require("../src/lib/sqlite-init");

initializeSqliteSchema();
