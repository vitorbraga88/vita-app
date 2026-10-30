import Database from "better-sqlite3";
import { copyFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aplicarCatalogoCurado,
  garantirColunasMidia,
  garantirIndiceFonte,
  montarRegistros,
} from "./aplicar-midia.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_PATH = path.join(ROOT, "data", "vita.db");
const MAP_PATH = path.join(ROOT, "data", "mapa-midia.json");

function caminhoBackup() {
  return `${DB_PATH}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

function lerContagensProtegidas(db) {
  return db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM sessao_serie) AS series,
      (SELECT COUNT(*) FROM sessao) AS sessoes,
      (SELECT COUNT(*) FROM peso_registro) AS pesagens,
      (SELECT COUNT(*) FROM usuario) AS usuarios
  `).get();
}

function conferirContagens(antes, depois) {
  if (JSON.stringify(antes) !== JSON.stringify(depois)) {
    throw new Error(`Contagens protegidas divergiram: antes=${JSON.stringify(antes)} depois=${JSON.stringify(depois)}`);
  }
}

async function main() {
  const mapa = JSON.parse(await readFile(MAP_PATH, "utf8"));
  const registros = await montarRegistros(mapa);
  if (process.env.VITA_CATALOGO_APLICAR !== "1") {
    console.log(JSON.stringify({ catalogoValidado: registros.length, escrita: "bloqueada; defina VITA_CATALOGO_APLICAR=1" }, null, 2));
    return;
  }

  const leitura = new Database(DB_PATH, { readonly: true });
  const antes = lerContagensProtegidas(leitura);
  leitura.close();
  const backup = caminhoBackup();
  await copyFile(DB_PATH, backup);

  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");
  garantirColunasMidia(db);
  garantirIndiceFonte(db);
  const resultado = aplicarCatalogoCurado(db, registros);
  const totais = db.prepare(`
    SELECT COUNT(*) AS exercicios, SUM(midia_still IS NOT NULL) AS com_midia,
      SUM(midia_clip IS NOT NULL) AS com_clip
    FROM exercicio
  `).get();
  const depois = lerContagensProtegidas(db);
  const integridade = db.pragma("integrity_check", { simple: true });
  db.close();
  conferirContagens(antes, depois);
  if (integridade !== "ok") throw new Error(`integrity_check: ${integridade}`);
  console.log(JSON.stringify({ backup: path.relative(ROOT, backup), catalogo: registros.length, ...resultado, ...totais, ...antes, integridade }, null, 2));
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
