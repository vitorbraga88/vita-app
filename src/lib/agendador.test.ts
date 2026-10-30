import { rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getDb } from "@/lib/db/client";
import { setConfig } from "@/lib/db/repositories/configuracao";
import { executarAgendador } from "./agendador";

const arquivo = path.join(process.cwd(), "data", "vita.test-agendador.db");
process.env.VITA_DB_PATH = arquivo;
for (const s of ["", "-wal", "-shm"]) rmSync(arquivo + s, { force: true });
let id = 0;
beforeAll(() => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url, options) => ({
    ok: true, status: 200, json: async () => ({ event: "message", topic: JSON.parse(options.body).topic }),
  })));
  id = Number(getDb().prepare("INSERT INTO usuario (nome,email) VALUES ('Teste','agendador@vita.app')").run().lastInsertRowid);
});
afterAll(() => { vi.unstubAllGlobals(); getDb().close(); for (const s of ["", "-wal", "-shm"]) rmSync(arquivo + s, { force: true }); });

describe("agendador em Recife", () => {
  it("envia uma vez por chave, recupera atrasado e faz segunda chamada única", async () => {
    setConfig(id, "notificacoes.silencio_ativo", false);
    setConfig(id, "hidratacao.ativo", true);
    setConfig(id, "hidratacao.pausar_meta_atingida", false);
    setConfig(id, "hidratacao.janela_inicio", "08:00");
    setConfig(id, "pesagem.ativo", true);
    setConfig(id, "pesagem.dia_semana", 5);
    setConfig(id, "pesagem.hora", "08:00");
    setConfig(id, "pesagem.lembrete_atraso_h", 3);
    const oito = new Date("2026-10-30T08:20:00-03:00");
    await executarAgendador(oito);
    await executarAgendador(oito);
    setConfig(id, "hidratacao.ativo", false);
    await executarAgendador(new Date("2026-10-30T11:15:00-03:00"));
    await executarAgendador(new Date("2026-10-30T11:16:00-03:00"));
    const logs = getDb().prepare("SELECT chave_dia, count(*) AS total FROM notif_log GROUP BY chave_dia ORDER BY chave_dia").all();
    expect(logs).toEqual([
      { chave_dia: "2026-10-30:agua:08:00", total: 1 },
      { chave_dia: "2026-10-30:pesagem:atraso", total: 1 },
      { chave_dia: "2026-10-30:pesagem:principal", total: 1 },
    ]);
  });
});
