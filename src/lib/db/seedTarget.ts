import path from "node:path";
import { PRODUCTION_DB_PATH, resolveDatabasePath } from "@/lib/db/client";

const DEVELOPMENT_DB_PATH = path.join("data", "vita.dev.db");

/** Resolves an isolated database path and refuses the production database. */
export function getSeedDatabasePath(configuredPath?: string): string {
  const databasePath = resolveDatabasePath(configuredPath ?? DEVELOPMENT_DB_PATH);
  if (databasePath === PRODUCTION_DB_PATH) {
    throw new Error("Seed must not target the production database.");
  }
  return databasePath;
}
