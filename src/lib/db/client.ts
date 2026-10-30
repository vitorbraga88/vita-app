// Single point of access to the SQLite connection. No other file in the
// codebase should import `better-sqlite3` directly — this keeps the data
// layer swappable (e.g. to Postgres later) by only touching this directory.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "vita.db");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "db", "schema.sql");

let instance: Database.Database | null = null;

function createConnection(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schema);
  return db;
}

/** Returns the shared SQLite connection, creating it (and applying the schema) on first use. */
export function getDb(): Database.Database {
  if (!instance) {
    instance = createConnection();
  }
  return instance;
}

export { DB_PATH };
