import { rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getDb } from "@/lib/db/client";
import { setConfig } from "@/lib/db/repositories/configuracao";
import { executarAgendador } from "./agendador";
import { autenticarRelogio, parearRelogio } from "@/lib/db/repositories/relogio";

const arquivo = path.join(process.cwd(), "data", "vita.test-entrega-notificacao.db");
process.env.VITA_DB_PATH = arquivo;
for (const s of ["", "-wal", "-shm"]) rmSync(arquivo + s, { force: true });
let id = 0;
const fetchMock = vi.fn();
beforeAll(() => {
  id = Number(getDb().prepare("INSERT INTO usuario (nome,email) VALUES ('Teste','entrega@vita.app')").run().lastInsertRowid);
  vi.stubGlobal("fetch", fetchMock);
  setConfig(id, "notificacoes.silencio_ativo", false);
  setConfig(id, "hidratacao.ativo", true);
  setConfig(id, "hidratacao.pausar_meta_atingida", false);
  setConfig(id, "hidratacao.janela_inicio", "08:00");
  setConfig(id, "notificacoes.prioridade.hidratacao", "alta");
});
afterAll(() => {
  vi.unstubAllGlobals();
  getDb().close();
  for (const s of ["", "-wal", "-shm"]) rmSync(arquivo + s, { force: true });
});

describe("entrega de lembretes", () => {
  it("publica JSON na raiz uma vez e registra os resultados distintos de ambos", async () => {
    setConfig(id, "notificacoes.canal", "ambos");
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ event: "message", topic: "vita-agua" }) });
    const agora = new Date("2026-10-30T08:10:00-03:00");
    await executarAgendador(agora);
    await executarAgendador(agora);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8185/");
    const corpo = JSON.parse(opcoes.body);
    expect(corpo).toMatchObject({ topic: "vita-agua", priority: 4 });
    expect([...corpo.message].length).toBeLessThanOrEqual(40);
    expect(getDb().prepare("SELECT canal, status FROM notificacao_envio ORDER BY id").all()).toEqual([
      { canal: "ntfy", status: "enviado" }, { canal: "webpush", status: "falha: Web Push indisponível" },
    ]);
  });

  it("registra falha HTTP sem anunciar entrega nem duplicar", async () => {
    setConfig(id, "notificacoes.canal", "ntfy");
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    const agora = new Date("2026-10-31T08:10:00-03:00");
    await executarAgendador(agora);
    await executarAgendador(agora);
    expect(getDb().prepare("SELECT canal, status FROM notificacao_envio WHERE data_local = ?").all("2026-10-31")).toEqual([
      { canal: "ntfy", status: "falha: HTTP 503" },
    ]);
  });

  it("respeita silêncio e antecedência do treino", async () => {
    setConfig(id, "hidratacao.ativo", false);
    setConfig(id, "treino.ativo", true);
    setConfig(id, "treino.lembrete_hora", "18:00");
    setConfig(id, "treino.lembrete_antecedencia_min", 30);
    setConfig(id, "notificacoes.canal", "webpush");
    setConfig(id, "notificacoes.silencio_ativo", true);
    setConfig(id, "notificacoes.silencio_inicio", "17:00");
    setConfig(id, "notificacoes.silencio_fim", "18:00");
    await executarAgendador(new Date("2026-11-01T17:30:00-03:00"));
    expect(getDb().prepare("SELECT count(*) AS n FROM notif_log WHERE tipo='treino'").get()).toEqual({ n: 0 });
    setConfig(id, "notificacoes.silencio_ativo", false);
    await executarAgendador(new Date("2026-11-01T17:31:00-03:00"));
    await executarAgendador(new Date("2026-11-01T17:32:00-03:00"));
    expect(getDb().prepare("SELECT canal, status FROM notificacao_envio WHERE tipo='treino'").all()).toEqual([
      { canal: "webpush", status: "falha: Web Push indisponível" },
    ]);
  });

  it("só envia resumo com horário explícito e usa sua prioridade", async () => {
    setConfig(id, "treino.ativo", false);
    setConfig(id, "notificacoes.resumo_ativo", true);
    setConfig(id, "notificacoes.resumo_hora", null);
    setConfig(id, "notificacoes.canal", "ntfy");
    const agora = new Date("2026-11-02T20:10:00-03:00");
    await executarAgendador(agora);
    expect(getDb().prepare("SELECT count(*) AS n FROM notif_log WHERE tipo='resumo'").get()).toEqual({ n: 0 });
    setConfig(id, "notificacoes.resumo_hora", "20:00");
    setConfig(id, "notificacoes.prioridade.resumo", "baixa");
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ event: "message", topic: "vita-resumo" }) });
    await executarAgendador(agora);
    await executarAgendador(agora);
    const corpo = JSON.parse(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1].body);
    expect(corpo).toMatchObject({ topic: "vita-resumo", priority: 2, message: "0 treinos, 0 min hoje." });
    expect(getDb().prepare("SELECT count(*) AS n FROM notif_log WHERE tipo='resumo'").get()).toEqual({ n: 1 });
  });

  it("registra falha de conexão e não tenta novamente no mesmo slot", async () => {
    setConfig(id, "notificacoes.resumo_ativo", false);
    setConfig(id, "hidratacao.ativo", true);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const agora = new Date("2026-11-03T08:10:00-03:00");
    await executarAgendador(agora);
    await executarAgendador(agora);
    expect(getDb().prepare("SELECT canal, status FROM notificacao_envio WHERE data_local = ?").all("2026-11-03")).toEqual([
      { canal: "ntfy", status: "falha: erro de conexão ntfy" },
    ]);
  });

  it("envia suplemento agendado no tópico próprio, com mensagem limitada", async () => {
    setConfig(id, "hidratacao.ativo", false);
    setConfig(id, "suplementacao.ativo", true);
    setConfig(id, "suplementacao.antecedencia_min", 15);
    getDb().prepare(`INSERT INTO suplemento
      (usuario_id, nome, dose, unidade, horarios, estoque, ativo, criado_em)
      VALUES (?, ?, 1, 'caps', ?, 10, 1, ?)`).run(id, "Suplemento com nome extremamente comprido", JSON.stringify(["09:00"]), "2026-11-04T00:00:00-03:00");
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ event: "message", topic: "vita-sup" }) });
    const agora = new Date("2026-11-04T08:50:00-03:00");
    await executarAgendador(agora);
    await executarAgendador(agora);
    const corpo = JSON.parse(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1].body);
    expect(corpo.topic).toBe("vita-sup");
    expect([...corpo.message].length).toBeLessThanOrEqual(40);
    expect(getDb().prepare("SELECT count(*) AS n FROM notificacao_envio WHERE tipo='suplementacao'").get()).toEqual({ n: 1 });
  });

  it("não registra entrega quando um serviço diferente responde 2xx", async () => {
    setConfig(id, "suplementacao.ativo", false);
    setConfig(id, "hidratacao.ativo", true);
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });
    await executarAgendador(new Date("2026-11-05T08:10:00-03:00"));
    expect(getDb().prepare("SELECT status FROM notificacao_envio WHERE data_local = ?").get("2026-11-05")).toEqual({
      status: "falha: resposta ntfy inválida",
    });
  });

  it("com o relógio pareado, o lembrete de treino fica no sino e não vai ao ntfy", async () => {
    setConfig(id, "hidratacao.ativo", false);
    setConfig(id, "treino.ativo", true);
    setConfig(id, "treino.lembrete_hora", "18:00");
    setConfig(id, "treino.lembrete_antecedencia_min", 30);
    setConfig(id, "notificacoes.silencio_ativo", false);
    setConfig(id, "notificacoes.canal", "ntfy");
    setConfig(id, "amazfit.ativo", true);
    autenticarRelogio(parearRelogio(id));
    const chamadas = fetchMock.mock.calls.length;
    await executarAgendador(new Date("2026-11-06T17:31:00-03:00"));
    expect(fetchMock.mock.calls.length).toBe(chamadas);
    expect(getDb().prepare("SELECT count(*) AS n FROM notif_log WHERE chave_dia = '2026-11-06:treino'").get()).toEqual({ n: 1 });
    expect(getDb().prepare("SELECT count(*) AS n FROM notificacao_envio WHERE data_local = '2026-11-06'").get()).toEqual({ n: 0 });
  });
});
