// Back up the live SQLite database before the additive Phase 5 schema migration (watch tables).
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "data/vita.db");
const db = new Database(target, { fileMustExist: true });
db.pragma("foreign_keys = ON");
const counts = () => db.prepare(`SELECT
  (SELECT count(*) FROM sessao_serie) series,
  (SELECT count(*) FROM sessao) sessoes,
  (SELECT count(*) FROM peso_registro) pesagens,
  (SELECT count(*) FROM usuario) usuarios,
  (SELECT count(*) FROM exercicio) exercicios`).get();
const tables = () => db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").pluck().all();
const expected = { series: 795, sessoes: 36, pesagens: 28, usuarios: 1, exercicios: 132 };
const before = counts();
if (JSON.stringify(before) !== JSON.stringify(expected)) throw new Error(`Protected counts differ: ${JSON.stringify(before)}`);
const settings = JSON.stringify(db.prepare("SELECT * FROM configuracao ORDER BY usuario_id, chave").all());
const tablesBefore = tables();
const backup = `${target}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}-pre-fase5`;
await db.backup(backup);
const schema = readFileSync(path.join(root, "src/lib/db/schema.sql"), "utf8");
db.transaction(() => {
  db.exec(schema);
  if (JSON.stringify(counts()) !== JSON.stringify(before)) throw new Error("Protected counts changed");
  if (JSON.stringify(db.prepare("SELECT * FROM configuracao ORDER BY usuario_id, chave").all()) !== settings) throw new Error("Settings changed");
  if (db.pragma("integrity_check", { simple: true }) !== "ok") throw new Error("Integrity check failed");
})();
console.log(JSON.stringify({
  backup: path.relative(root, backup),
  created: tables().filter((t) => !tablesBefore.includes(t)),
  before,
  after: counts(),
  integrity: db.pragma("integrity_check", { simple: true }),
  settingsUnchanged: true,
}, null, 2));
db.close();
