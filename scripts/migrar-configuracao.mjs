// Additive migration for /ajustes on data/vita.db: consistent backup (SQLite backup API, safe
// with the server running in WAL), then schema.sql — which only has CREATE ... IF NOT EXISTS —
// then proves protected counts and integrity are unchanged. Usage: node scripts/migrar-configuracao.mjs
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_PATH = path.join(ROOT, "data", "vita.db");
const SCHEMA = readFileSync(path.join(ROOT, "src", "lib", "db", "schema.sql"), "utf8");

const PROTEGIDAS = `SELECT
  (SELECT COUNT(*) FROM sessao_serie) AS series, (SELECT COUNT(*) FROM sessao) AS sessoes,
  (SELECT COUNT(*) FROM peso_registro) AS pesagens, (SELECT COUNT(*) FROM usuario) AS usuarios,
  (SELECT COUNT(*) FROM exercicio) AS exercicios`;

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
const tabelas = () => db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").pluck().all();

const antes = db.prepare(PROTEGIDAS).get();
const tabelasAntes = tabelas();
const backup = `${DB_PATH}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}-pre-configuracao`;
await db.backup(backup);

db.exec(SCHEMA);

const depois = db.prepare(PROTEGIDAS).get();
const integridade = db.pragma("integrity_check", { simple: true });
const criadas = tabelas().filter((t) => !tabelasAntes.includes(t));
db.close();

if (JSON.stringify(antes) !== JSON.stringify(depois) || integridade !== "ok") {
  console.error(JSON.stringify({ erro: "migração alterou dados protegidos ou integridade", antes, depois, integridade }));
  process.exit(1);
}
console.log(JSON.stringify({ backup: path.relative(ROOT, backup), criadas, antes, depois, integridade }, null, 1));
