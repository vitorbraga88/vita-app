import { rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getDb } from "@/lib/db/client";
import { configPadrao } from "@/lib/domain/configuracao/catalogo";
import { aplicarMetasAutomaticas } from "./metasAutomaticas";
import { getMetaAguaAtual } from "@/lib/agua/metaAtual";
import { setConfig } from "@/lib/db/repositories/configuracao";
import { dataLocalRecife } from "@/lib/domain/configuracao/horario";

const arquivo = path.join(process.cwd(), "data", "vita.test-agua-precedencia.db");
process.env.VITA_DB_PATH = arquivo;
for (const suffix of ["", "-wal", "-shm"]) rmSync(arquivo + suffix, { force: true });
beforeAll(() => {
  const db = getDb();
  db.prepare("INSERT INTO usuario (id,nome,email) VALUES (1,'Teste','agua-precedencia@vita.app')").run();
  db.prepare("INSERT INTO peso_registro (usuario_id,data,peso_kg) VALUES (1,'2026-10-28',80.6)").run();
  db.prepare("INSERT INTO meta (usuario_id,tipo,valor_alvo) VALUES (1,'agua_ml_dia',3000)").run();
});
afterAll(() => { getDb().close(); for (const suffix of ["", "-wal", "-shm"]) rmSync(arquivo + suffix, { force: true }); });
it("preserva a meta manual ao calcular metas em modo automático", () => {
  expect(aplicarMetasAutomaticas({ ...configPadrao(), "hidratacao.meta_modo": "auto" }).ok).toBe(true);
  expect(getDb().prepare("SELECT valor_alvo FROM meta WHERE usuario_id=1 AND tipo='agua_ml_dia'").get()).toEqual({ valor_alvo: 3000 });
});
it("auto ignora meta armazenada e manual explícito a respeita", async () => {
  const hoje = dataLocalRecife();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ daily: { time: [hoje], temperature_2m_max: [32] } }))));
  expect(await getMetaAguaAtual(1)).toMatchObject({ modo: "auto", ml: 2750 });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ daily: { time: [hoje], temperature_2m_max: [33] } }))));
  expect(await getMetaAguaAtual(1)).toMatchObject({ modo: "auto", ml: 3250 });
  setConfig(1, "hidratacao.meta_modo", "manual");
  expect(await getMetaAguaAtual(1)).toMatchObject({ modo: "manual", ml: 3000 });
  vi.unstubAllGlobals();
});
