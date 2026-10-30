import { rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { registrarAviso } from "./notificacoes";

const arquivo = path.join(process.cwd(), "data", "vita.test-avisos.db");
process.env.VITA_DB_PATH = arquivo;
for (const suffix of ["", "-wal", "-shm"]) rmSync(arquivo + suffix, { force: true });
let usuarioId = 0;
beforeAll(() => { usuarioId = Number(getDb().prepare("INSERT INTO usuario (nome,email) VALUES ('Teste','aviso@vita.app')").run().lastInsertRowid); });
afterAll(() => { getDb().close(); for (const suffix of ["", "-wal", "-shm"]) rmSync(arquivo + suffix, { force: true }); });
describe("aviso idempotente", () => {
  it("registra uma única vez mesmo para duas tentativas com a mesma chave", () => {
    const aviso = { usuarioId, tipo: "agua" as const, chave: "2026-10-30:agua:14:00", titulo: "Água", mensagem: "Beba água", link: "/agua" };
    expect(registrarAviso(aviso, new Date("2026-10-30T14:00:00-03:00"))).toBe(true);
    expect(registrarAviso(aviso, new Date("2026-10-30T14:01:00-03:00"))).toBe(false);
    expect(getDb().prepare("SELECT chave_dia, COUNT(*) AS total FROM notif_log GROUP BY chave_dia").all()).toEqual([{ chave_dia: aviso.chave, total: 1 }]);
  });
});
