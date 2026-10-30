import { rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
import { getDb } from "@/lib/db/client";
import { setConfig } from "@/lib/db/repositories/configuracao";
import { parearRelogio, relogioPareado } from "@/lib/db/repositories/relogio";
import { GET } from "@/app/api/relogio/pacote/route";
import { POST } from "@/app/api/relogio/series/route";

const arquivo = path.join(process.cwd(), "data", "vita.test-relogio-api.db");
process.env.VITA_DB_PATH = arquivo;
for (const s of ["", "-wal", "-shm"]) rmSync(arquivo + s, { force: true });

let usuario = 0;
let treino = 0;
let supino = 0;
let token = "";

const pedido = (metodo: "GET" | "POST", corpo?: unknown, chave = token) =>
  new Request(`http://vita.test/api/relogio/${metodo === "GET" ? "pacote" : "series"}`, {
    method: metodo,
    headers: { authorization: `Bearer ${chave}`, "content-type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

const sessaoLote = (id: string, finalizadaEm: string | null = null) =>
  ({ id, treinoId: treino, iniciadaEm: "2026-10-31T18:05:00-03:00", finalizadaEm });
const serieLote = (id: string, sessaoId: string, extra: Record<string, unknown> = {}) =>
  ({ id, sessaoId, exercicioId: supino, numeroSerie: 1, reps: 12, cargaKg: 72.5, registradaEm: "2026-10-31T18:07:00-03:00", ...extra });

beforeAll(() => {
  const db = getDb();
  usuario = Number(db.prepare("INSERT INTO usuario (nome, email) VALUES ('Teste', 'relogio@vita.app')").run().lastInsertRowid);
  supino = Number(db.prepare("INSERT INTO exercicio (nome, grupo_muscular) VALUES ('Supino reto', 'peito')").run().lastInsertRowid);
  treino = Number(db.prepare("INSERT INTO treino (usuario_id, nome) VALUES (?, 'Push')").run(usuario).lastInsertRowid);
  db.prepare("INSERT INTO treino_exercicio (treino_id, exercicio_id, series_alvo, reps_alvo) VALUES (?, ?, 4, '8-12')").run(treino, supino);
  const sessao = Number(db.prepare(`INSERT INTO sessao (usuario_id, treino_id, status, iniciado_em)
    VALUES (?, ?, 'concluido', '2026-10-26 18:00:00')`).run(usuario, treino).lastInsertRowid);
  for (const n of [1, 2, 3]) {
    db.prepare("INSERT INTO sessao_serie (sessao_id, exercicio_id, numero_serie, reps, carga_kg) VALUES (?, ?, ?, 12, 70)").run(sessao, supino, n);
  }
  token = parearRelogio(usuario);
});

afterAll(() => {
  getDb().close();
  for (const s of ["", "-wal", "-shm"]) rmSync(arquivo + s, { force: true });
});

describe("API do relógio", () => {
  it("recusa token inválido e integração desligada", async () => {
    expect((await GET(pedido("GET", undefined, "token-errado"))).status).toBe(401);
    expect((await GET(pedido("GET"))).status).toBe(403);
    expect(relogioPareado(usuario)).toBe(true);
  });

  it("entrega o próximo treino com a sugestão do motor de progressão", async () => {
    setConfig(usuario, "amazfit.ativo", true);
    const resposta = await GET(pedido("GET"));
    expect(resposta.status).toBe(200);
    const pacote = await resposta.json();
    expect(pacote).toMatchObject({ versao: 1, treino: { id: treino, nome: "Push" } });
    expect(pacote.treino.exercicios[0]).toMatchObject({
      exercicioId: supino, seriesAlvo: 4, repsAlvo: "8-12", cargaSugeridaKg: 72.5, tipoSugestao: "aumentar", ultimaCargaKg: 70,
    });
    expect(pacote.alarmes).toEqual([]);
  });

  it("gerar novo token revoga o anterior", async () => {
    const antigo = token;
    token = parearRelogio(usuario);
    expect((await GET(pedido("GET", undefined, antigo))).status).toBe(401);
    expect(relogioPareado(usuario)).toBe(false);
    expect((await GET(pedido("GET"))).status).toBe(200);
  });

  it("o mesmo lote enviado duas vezes grava uma vez só e confirma sessões e séries", async () => {
    const lote = { sessoes: [sessaoLote("sessao-0001")], series: [serieLote("serie-0001", "sessao-0001"), serieLote("serie-0002", "sessao-0001", { numeroSerie: 2 })] };
    const primeiro = await (await POST(pedido("POST", lote))).json();
    const segundo = await (await POST(pedido("POST", lote))).json();
    expect(primeiro).toEqual({ aceitas: ["sessao-0001", "serie-0001", "serie-0002"], duplicadas: [], rejeitadas: [], finalizadas: [] });
    expect(segundo).toEqual({ aceitas: [], duplicadas: ["sessao-0001", "serie-0001", "serie-0002"], rejeitadas: [], finalizadas: [] });
    expect(getDb().prepare("SELECT count(*) AS n FROM relogio_serie").get()).toEqual({ n: 2 });
    expect(getDb().prepare("SELECT iniciado_em, status FROM sessao s JOIN relogio_sessao r ON r.sessao_id = s.id").get())
      .toEqual({ iniciado_em: "2026-10-31 18:05:00", status: "em_andamento" });
  });

  it("rejeita itens inválidos sem descartar os válidos", async () => {
    const resultado = await (await POST(pedido("POST", {
      sessoes: [{ ...sessaoLote("sessao-0002"), treinoId: 9999 }],
      series: [
        serieLote("serie-0003", "sessao-0001", { numeroSerie: 3, reps: 0 }),
        serieLote("serie-0004", "sessao-0002"),
        serieLote("serie-0005", "sessao-0001", { numeroSerie: 3, exercicioId: 9999 }),
        serieLote("serie-0006", "sessao-0001", { numeroSerie: 3, reps: 10 }),
      ],
    }))).json();
    expect(resultado.aceitas).toEqual(["serie-0006"]);
    expect(resultado.rejeitadas).toEqual([
      { id: "sessao-0002", motivo: "Treino não encontrado." },
      { id: "serie-0003", motivo: "Repetições fora de 1–100." },
      { id: "serie-0004", motivo: "Sessão desconhecida." },
      { id: "serie-0005", motivo: "Exercício não encontrado." },
    ]);
  });

  it("finaliza a sessão com duração e kcal pela regra da sessão guiada, de forma idempotente", async () => {
    const lote = { sessoes: [sessaoLote("sessao-0001", "2026-10-31T19:00:00-03:00")], series: [] };
    expect((await (await POST(pedido("POST", lote))).json()).finalizadas).toEqual(["sessao-0001"]);
    expect((await (await POST(pedido("POST", lote))).json()).finalizadas).toEqual(["sessao-0001"]);
    expect(getDb().prepare("SELECT status, finalizado_em, duracao_min, kcal_estimado FROM sessao s JOIN relogio_sessao r ON r.sessao_id = s.id").get())
      .toEqual({ status: "concluido", finalizado_em: "2026-10-31 19:00:00", duracao_min: 55, kcal_estimado: 330 });
  });

  it("recusa envelope inválido com 400 e recebimento desligado com 403", async () => {
    expect((await POST(pedido("POST", { series: [{ id: "curto" }] }))).status).toBe(400);
    expect((await POST(pedido("POST", { series: Array.from({ length: 301 }, (_, i) => serieLote(`serie-x${String(i).padStart(4, "0")}`, "sessao-0001")) }))).status).toBe(400);
    setConfig(usuario, "amazfit.sincronizar_treino", false);
    expect((await POST(pedido("POST", { sessoes: [], series: [] }))).status).toBe(403);
  });
});
