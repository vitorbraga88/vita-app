// Preflight for `npm run start`: fails fast when better-sqlite3 was compiled for another Node ABI.
// Without it, `next start` boots, answers static routes and returns 500 on every database route.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtime = `${process.execPath} ${process.version} (NODE_MODULE_VERSION ${process.versions.modules})`;

try {
  const Database = require("better-sqlite3");
  new Database(":memory:").prepare("SELECT 1").get();
  console.log(`runtime ok: ${runtime}`);
} catch (erro) {
  console.error(`better-sqlite3 não carrega em ${runtime}:\n${erro.message}`);
  console.error("Recompile com este mesmo Node: npm rebuild better-sqlite3 (ver DEPLOY.md).");
  process.exit(1);
}
